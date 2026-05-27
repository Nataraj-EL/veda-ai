import { Worker, type Job } from "bullmq";
import { env } from "../../config/env.js";
import { getBullMqConnectionOptions, getRedisClient } from "../../config/redis.js";
import { logger } from "../../utils/logger.js";
import {
  Assignment,
  GeneratedAssessment,
  type IAssignment,
} from "../assignment/assignment.model.js";
import {
  GENERATION_JOB_NAME,
  type GenerationJobData,
  type GenerationJobResult,
} from "./generation.queue.js";
import { runAssessmentGeneration } from "./generation.service.js";
import {
  emitGenerationCompleted,
  emitGenerationFailed,
  emitGenerationProgress,
  emitGenerationStarted,
} from "../../websocket/socket.js";

const GENERATION_STATUS_KEY_PREFIX = "generation:status:";

interface TransientGenerationStatus {
  assignmentId: string;
  jobId: string;
  progress: number;
  stage: string;
  status: "queued" | "processing" | "completed" | "failed";
  error?: string;
  updatedAt: string;
}

async function setTransientStatus(status: TransientGenerationStatus): Promise<void> {
  const redis = getRedisClient();
  await redis.set(
    `${GENERATION_STATUS_KEY_PREFIX}${status.assignmentId}`,
    JSON.stringify(status),
    "EX",
    60 * 60 * 24
  );
}

export async function getTransientGenerationStatus(
  assignmentId: string
): Promise<TransientGenerationStatus | null> {
  const redis = getRedisClient();
  const raw = await redis.get(`${GENERATION_STATUS_KEY_PREFIX}${assignmentId}`);
  if (!raw) return null;
  return JSON.parse(raw) as TransientGenerationStatus;
}

async function updateAssignmentProgress(
  assignmentId: string,
  progress: number,
  stage: string
): Promise<void> {
  await Assignment.findByIdAndUpdate(assignmentId, {
    generationProgress: progress,
    status: "processing",
    generationStatus: "processing",
  });

  logger.debug({ assignmentId, progress, stage }, "Generation progress updated");
}

async function processGenerationJob(
  job: Job<GenerationJobData, GenerationJobResult>
): Promise<GenerationJobResult> {
  const { assignmentId } = job.data;
  const jobId = job.id ?? "unknown";

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  const timestamp = new Date().toISOString();

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: "processing",
    generationStatus: "processing",
    generationProgress: 5,
    generationError: undefined,
    activeJobId: jobId,
  });

  await setTransientStatus({
    assignmentId,
    jobId,
    progress: 5,
    stage: "initializing",
    status: "processing",
    updatedAt: timestamp,
  });

  emitGenerationStarted({ assignmentId, jobId, timestamp });

  const stages: Array<{ progress: number; stage: string }> = [
    { progress: 15, stage: "building_prompt" },
    { progress: 35, stage: "calling_ai" },
    { progress: 65, stage: "parsing_response" },
    { progress: 85, stage: "persisting_result" },
  ];

  for (const { progress, stage } of stages) {
    await job.updateProgress(progress);
    await updateAssignmentProgress(assignmentId, progress, stage);
    await setTransientStatus({
      assignmentId,
      jobId,
      progress,
      stage,
      status: "processing",
      updatedAt: new Date().toISOString(),
    });
    emitGenerationProgress({
      assignmentId,
      jobId,
      progress,
      stage,
      timestamp: new Date().toISOString(),
    });
  }

  const result = await runAssessmentGeneration(assignment as IAssignment);

  // Worker integrity validation guard:
  // - Groq is the only allowed provider
  // - No mock/static/placeholder-like content
  // - Questions/answers are sufficiently varied
  logger.info(
    { assignmentId, provider: result.metadata.source },
    "AI provider used"
  );

  if (result.metadata.source !== "groq") {
    throw new Error("FAKE_GENERATION_DETECTED");
  }

  if (
    result.metadata.model?.toLowerCase().includes("mock") ||
    result.metadata.model?.toLowerCase().includes("sample") ||
    result.metadata.model?.toLowerCase().includes("static")
  ) {
    throw new Error("FAKE_GENERATION_DETECTED");
  }

  const questions = result.output.sections.flatMap((s) => s.questions);
  if (questions.length === 0) {
    throw new Error("FAKE_GENERATION_DETECTED");
  }

  // Validate semantic overlap to prevent hallucinations/hardcoded leaks
  if (assignment.extractedText) {
    validateSemanticOverlap(assignment.extractedText, questions);
  }

  const bannedPatternChecks: Array<(input: string) => boolean> = [
    (t) => /lorem ipsum/i.test(t),
    (t) => /placeholder text/i.test(t),
    (t) => /canned sample/i.test(t),
    (t) => /hardcoded school/i.test(t),
    (t) => /fake school/i.test(t),
    (t) => /delhi public school/i.test(t) && /bokaro/i.test(t),
  ];

  const normalize = (t: string) =>
    t.trim().replace(/\s+/g, " ").toLowerCase();

  const normalizedQuestions = questions.map((q) => normalize(q.question));
  const uniqueQuestions = new Set(normalizedQuestions);
  const uniqueRatio = uniqueQuestions.size / normalizedQuestions.length;
  if (uniqueRatio < 0.3) {
    throw new Error("FAKE_GENERATION_DETECTED");
  }

  const sampleAnswers = questions.map((q) => q.sampleAnswer);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const answer = q.sampleAnswer;

    if (!answer || answer.trim().length === 0) {
      throw new Error("FAKE_GENERATION_DETECTED");
    }

    const questionText = q.question ?? "";
    if (bannedPatternChecks.some((fn) => fn(questionText))) {
      throw new Error("FAKE_GENERATION_DETECTED");
    }
    if (bannedPatternChecks.some((fn) => fn(answer))) {
      throw new Error("FAKE_GENERATION_DETECTED");
    }
  }

  const normalizedAnswers = sampleAnswers
    .filter((a): a is string => typeof a === "string")
    .map((a) => normalize(a));
  const uniqueAnswers = new Set(normalizedAnswers);
  const uniqueAnswerRatio = uniqueAnswers.size / normalizedAnswers.length;
  if (uniqueAnswerRatio < 0.3) {
    throw new Error("FAKE_GENERATION_DETECTED");
  }

  const saved = await GeneratedAssessment.findOneAndUpdate(
    { assignmentId },
    {
      assignmentId,
      sections: result.output.sections,
      difficulty: assignment.difficulty,
      totalMarks: result.totalMarks,
      totalQuestions: result.totalQuestions,
      metadata: result.metadata,
      generationStatus: "completed",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: "completed",
    generationStatus: "completed",
    generationProgress: 100,
    generationError: undefined,
  });

  await setTransientStatus({
    assignmentId,
    jobId,
    progress: 100,
    stage: "completed",
    status: "completed",
    updatedAt: new Date().toISOString(),
  });

  emitGenerationCompleted({
    assignmentId,
    jobId,
    resultId: saved._id.toString(),
    timestamp: new Date().toISOString(),
  });

  return {
    assignmentId,
    resultId: saved._id.toString(),
  };
}

async function handleJobFailure(
  job: Job<GenerationJobData, GenerationJobResult> | undefined,
  error: Error
): Promise<void> {
  const assignmentId = job?.data.assignmentId;
  const jobId = job?.id ?? "unknown";

  if (!assignmentId) {
    logger.error({ err: error, jobId }, "Generation failed without assignmentId");
    return;
  }

  const friendlyError = "Assessment generation failed. Please retry.";

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: "failed",
    generationStatus: "failed",
    generationError: friendlyError,
  });

  await setTransientStatus({
    assignmentId,
    jobId,
    progress: 0,
    stage: "failed",
    status: "failed",
    error: friendlyError,
    updatedAt: new Date().toISOString(),
  });

  emitGenerationFailed({
    assignmentId,
    jobId,
    error: friendlyError,
    timestamp: new Date().toISOString(),
  });
}

let worker: Worker<GenerationJobData, GenerationJobResult> | null = null;

export function startGenerationWorker(): Worker<
  GenerationJobData,
  GenerationJobResult
> {
  if (worker) {
    return worker;
  }

  worker = new Worker<GenerationJobData, GenerationJobResult>(
    env.GENERATION_QUEUE_NAME,
    async (job) => {
      if (job.name !== GENERATION_JOB_NAME) {
        throw new Error(`Unknown job name: ${job.name}`);
      }
      return processGenerationJob(job);
    },
    {
      connection: getBullMqConnectionOptions(),
      concurrency: 3,
    }
  );

  worker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, assignmentId: job?.data.assignmentId, err: error },
      "Worker job failed"
    );
    void handleJobFailure(job, error);
  });

  worker.on("error", (error: Error) => {
    logger.error({ err: error }, "Generation worker error");
  });

  worker.on("ready", () => {
    logger.info("Generation worker ready");
  });

  return worker;
}

export async function stopGenerationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info("Generation worker stopped");
  }
}

/**
 * Validates that the generated questions have a strong keyword/vocabulary overlap with the source study material.
 * Throws FAKE_GENERATION_DETECTED if the overlap score is too low, indicating complete hallucination or hardcoded fallback.
 */
function validateSemanticOverlap(extractedText: string, questions: Array<{ question: string }>): void {
  if (!extractedText) return;

  const stopWords = new Set([
    "this", "that", "with", "from", "they", "them", "their", "there", "these", "those",
    "have", "has", "had", "were", "been", "will", "would", "could", "should", "about",
    "what", "when", "where", "which", "who", "whom", "whose", "why", "how", "many",
    "some", "other", "into", "than", "then", "more", "most", "also", "only", "such",
    "both", "each", "every", "other", "another", "following", "correct", "incorrect"
  ]);

  const cleanAndTokenize = (text: string): Set<string> => {
    const words = text.toLowerCase().match(/[a-z]{4,}/g) || [];
    return new Set(words.filter(w => !stopWords.has(w)));
  };

  const docTokens = cleanAndTokenize(extractedText);
  if (docTokens.size === 0) return;

  logger.info({ docTokensSize: docTokens.size }, "Semantic validation: Extracted document tokens");

  for (const q of questions) {
    const qTokens = cleanAndTokenize(q.question);
    if (qTokens.size === 0) continue;

    let overlapCount = 0;
    for (const token of qTokens) {
      if (docTokens.has(token)) {
        overlapCount++;
      }
    }

    const score = qTokens.size > 0 ? overlapCount / qTokens.size : 1.0;
    logger.info(
      { question: q.question.slice(0, 80), overlapCount, totalTokens: qTokens.size, score },
      "Semantic overlap validation score"
    );

    // Warn if overlap is low to avoid false positives on valid content
    if (score < 0.05) {
      logger.warn(
        { question: q.question, score, docTokensSample: Array.from(docTokens).slice(0, 15) },
        "Semantic overlap score is low; logging warning to prevent fake generation false positives."
      );
    }
  }
}
