import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import assignmentRoutes from "./modules/assignment/assignment.routes.js";
import pdfRoutes from "./modules/pdf/pdf.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

export function createApp(): express.Application {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
    })
  );
  app.use(helmet());
  app.use(
    cors({
      origin: [
        env.CLIENT_ORIGIN,
        "https://veda-ai-hub.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "VedaAI Backend Running",
    });
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
    });
  });

  app.use("/api/assignments", assignmentRoutes);
  app.use("/api/pdf", pdfRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
