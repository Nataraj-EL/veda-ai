import http from "http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { disconnectRedis, getRedisClient } from "./config/redis.js";
import {
  closeGenerationQueue,
  initGenerationQueueEvents,
} from "./modules/generation/generation.queue.js";
import {
  startGenerationWorker,
  stopGenerationWorker,
} from "./modules/generation/generation.worker.js";
import { initSocketServer } from "./websocket/socket.js";
import { logger } from "./utils/logger.js";

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error(
      { err: error },
      "MongoDB connection failed at startup. Server will start, but database requests will fail."
    );
  }
  getRedisClient();
  initGenerationQueueEvents();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  if (env.EMBED_WORKER) {
    startGenerationWorker();
    logger.info("Embedded generation worker started");
  } else {
    logger.info("Embedded worker disabled — run `npm run worker` separately");
  }

  httpServer.listen(env.PORT, "0.0.0.0", () => {
    logger.info(
      { port: env.PORT, clientOrigin: env.CLIENT_ORIGIN },
      "Vedam AI API server listening on 0.0.0.0"
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down gracefully");
    httpServer.close(async () => {
      await stopGenerationWorker();
      await closeGenerationQueue();
      await disconnectRedis();
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});
