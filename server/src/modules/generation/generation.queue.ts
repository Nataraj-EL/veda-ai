import { Queue, QueueEvents } from "bullmq";
import { env } from "../../config/env.js";
import { getBullMqConnectionOptions } from "../../config/redis.js";
import { logger } from "../../utils/logger.js";

export const GENERATION_JOB_NAME = "generate-assessment";

export interface GenerationJobData {
  assignmentId: string;
}

export interface GenerationJobResult {
  assignmentId: string;
  resultId: string;
}

let generationQueue: Queue<GenerationJobData, GenerationJobResult> | null = null;
let queueEvents: QueueEvents | null = null;

export function getGenerationQueue(): Queue<
  GenerationJobData,
  GenerationJobResult
> {
  if (!generationQueue) {
    generationQueue = new Queue<GenerationJobData, GenerationJobResult>(
      env.GENERATION_QUEUE_NAME,
      {
        connection: getBullMqConnectionOptions(),
        defaultJobOptions: {
          attempts: env.GENERATION_JOB_ATTEMPTS,
          backoff: {
            type: "exponential",
            delay: env.GENERATION_JOB_BACKOFF_MS,
          },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 500 },
        },
      }
    );
  }
  return generationQueue;
}

export function initGenerationQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents(env.GENERATION_QUEUE_NAME, {
      connection: getBullMqConnectionOptions(),
    });

    queueEvents.on("failed", ({ jobId, failedReason }) => {
      logger.error({ jobId, failedReason }, "Generation job failed");
    });

    queueEvents.on("completed", ({ jobId }) => {
      logger.info({ jobId }, "Generation job completed");
    });

    queueEvents.on("error", (error: Error) => {
      logger.error({ err: error }, "Generation queue events error");
    });
  }
  return queueEvents;
}

export async function enqueueGenerationJob(
  assignmentId: string
): Promise<string> {
  const queue = getGenerationQueue();
  const job = await queue.add(
    GENERATION_JOB_NAME,
    { assignmentId },
    {
      jobId: `gen-${assignmentId}`,
    }
  );
  return job.id ?? `gen-${assignmentId}`;
}

export async function closeGenerationQueue(): Promise<void> {
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
  if (generationQueue) {
    await generationQueue.close();
    generationQueue = null;
  }
}
