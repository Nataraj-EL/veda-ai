import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { disconnectRedis, getRedisClient } from "./config/redis.js";
import { initGenerationQueueEvents } from "./modules/generation/generation.queue.js";
import {
  startGenerationWorker,
  stopGenerationWorker,
} from "./modules/generation/generation.worker.js";
import { logger } from "./utils/logger.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  getRedisClient();
  initGenerationQueueEvents();
  startGenerationWorker();

  logger.info("Standalone generation worker process running");

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Worker shutting down");
    await stopGenerationWorker();
    await disconnectRedis();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, "Failed to start worker");
  process.exit(1);
});
