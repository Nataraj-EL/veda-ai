import { env } from "../../config/env.js";
import type { IAssignment } from "../assignment/assignment.model.js";
import {
  buildAssessmentPrompt,
  buildSystemPrompt,
  PROMPT_VERSION,
} from "./generation.prompt.js";
import {
  countQuestions,
  parseStructuredAssessment,
  sumMarks,
} from "./generation.parser.js";
import type { StructuredAssessmentOutput } from "../assignment/assignment.types.js";
import { GroqProvider } from "./providers/groq.provider.js";
import { AppError } from "../../utils/app-error.js";
import { logger } from "../../utils/logger.js";

export interface GenerationResult {
  output: StructuredAssessmentOutput;
  metadata: {
    model?: string;
    promptVersion: string;
    generatedAt: string;
    source: "openai" | "gemini" | "groq" | "structured-fallback";
  };
  totalQuestions: number;
  totalMarks: number;
}

interface AiProvider {
  generate(systemPrompt: string, userPrompt: string): Promise<string>;
}

const GEMINI_TIMEOUT_MS = 90_000;

async function withProviderTimeout<T>(
  p: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("AI provider request timed out"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}


function resolveProvider(): {
  provider: AiProvider;
  source: GenerationResult["metadata"]["source"];
  model?: string;
} {
  if (env.GROQ_API_KEY) {
    return {
      provider: new GroqProvider({
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL,
        timeoutMs: GEMINI_TIMEOUT_MS,
      }),
      source: "groq",
      model: env.GROQ_MODEL,
    };
  }

  throw new Error(
    "AI provider not configured. Set GROQ_API_KEY."
  );
}

export interface AssessmentPrompt {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * generateAssessment(prompt)
 * - Calls the selected provider
 * - Parses + structurally validates strictly (no raw output return)
 */
export async function generateAssessment(
  prompt: AssessmentPrompt
): Promise<GenerationResult> {
  const { provider, source, model } = resolveProvider();

  const attempt = async (userPrompt: string): Promise<StructuredAssessmentOutput> => {
    const raw = await withProviderTimeout(
      provider.generate(prompt.systemPrompt, userPrompt),
      source === "groq" ? GEMINI_TIMEOUT_MS : 120_000
    );
    return parseStructuredAssessment(raw);
  };

  let output: StructuredAssessmentOutput;
  try {
    output = await attempt(prompt.userPrompt);
  } catch (err: unknown) {
    const isRetryableParseFailure =
      err instanceof AppError &&
      (err.code === "AI_PARSE_ERROR" || err.code === "AI_VALIDATION_ERROR");

    if (!isRetryableParseFailure) {
      throw err;
    }

    // Retry once with stricter "repair" instruction, while preserving parser+Zod.
    const retryPrompt = [
      prompt.userPrompt,
      "",
      "CRITICAL RETRY INSTRUCTION:",
      "- Your previous output was invalid.",
      "- Return ONLY a single JSON object that matches the schema exactly.",
      "- No markdown, no backticks, no explanations, no extra keys.",
      "- Ensure difficulty is one of: easy, medium, hard.",
    ].join("\n");

    output = await attempt(retryPrompt);
  }

  // Stage 2: Gemini Academic Formatting & LaTeX Refinement
  try {
    const { geminiFormatterService } = await import("./gemini-formatter.service.js");
    output = await geminiFormatterService.refineAssessment(output);
  } catch (refineErr) {
    // Graceful degradation: log warning and proceed with Groq's high-quality assessment
    logger.warn({ err: refineErr }, "Stage 2: Gemini refinement pass bypassed due to error.");
  }

  return {
    output,
    metadata: {
      model,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
      source,
    },
    totalQuestions: countQuestions(output),
    totalMarks: sumMarks(output),
  };
}

export async function runAssessmentGeneration(
  assignment: IAssignment
): Promise<GenerationResult> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildAssessmentPrompt(assignment);
  return generateAssessment({ systemPrompt, userPrompt });
}

export async function extractMetadataFromText(
  text: string,
  defaultSubject?: string,
  defaultGradeClass?: string
): Promise<{
  subject?: string;
  gradeClass?: string;
  topic?: string;
  title: string;
}> {
  const { provider } = resolveProvider();

  const systemPrompt = `You are an educational assistant that extracts metadata from study materials or syllabus documents.
Analyze the provided text to identify the subject, target class/grade, and the main topic/chapter covered.
CRITICAL INSTRUCTIONS:
- You MUST ONLY extract metadata that is clearly present in or strongly implied by the text.
- DO NOT invent or hallucinate examination boards, school names, teacher names, subjects, or grades if not confidently mentioned.
- If the subject is not clearly mentioned, return null.
- If the class/grade is not clearly mentioned, return null.
- If the topic/chapter is not clearly mentioned, return null.
- Generate a highly descriptive and professional title for an assessment based on the text (e.g. "Class 8 Science - Electricity", "French Revolution Assessment", "Photosynthesis Worksheet", "Algebra Practice Test"). Avoid generic titles like "Assignment", "New Assignment", or "Assessment Paper".
You MUST respond with a single valid JSON object matching this schema:
{
  "subject": "string or null",
  "gradeClass": "string or null",
  "topic": "string or null",
  "title": "string (intelligent generated title)"
}`;

  // Take first 3000 characters of text to avoid context bloat
  const sampleText = text.slice(0, 3000);
  const userPrompt = `Analyze this text and extract metadata:\n\n=== TEXT START ===\n${sampleText}\n=== TEXT END ===`;

  try {
    const raw = await provider.generate(systemPrompt, userPrompt);
    const parsed = JSON.parse(raw.trim());
    
    const subject = parsed.subject || defaultSubject || undefined;
    const gradeClass = parsed.gradeClass || defaultGradeClass || undefined;
    const topic = parsed.topic || undefined;
    
    // Generate a smart title if not provided or too generic
    let title = parsed.title;
    if (!title || /^(assignment|assessment|new assignment|academic assessment)$/i.test(title.trim())) {
      if (gradeClass && subject && topic) {
        title = `${gradeClass} ${subject} - ${topic}`;
      } else if (subject && topic) {
        title = `${subject} - ${topic}`;
      } else if (topic) {
        title = `${topic} Assessment`;
      } else {
        title = defaultSubject ? `${defaultSubject} Assessment` : "Academic Assessment";
      }
    }

    return {
      subject,
      gradeClass,
      topic,
      title,
    };
  } catch {
    // Falls back safely if Groq fails or JSON is unparseable
    const subject = defaultSubject || undefined;
    const gradeClass = defaultGradeClass || undefined;
    const title = defaultSubject ? `${defaultSubject} Assessment` : "Academic Assessment";
    return {
      subject,
      gradeClass,
      title,
    };
  }
}

