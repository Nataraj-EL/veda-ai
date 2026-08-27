import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import assignmentRoutes from "./modules/assignment/assignment.routes.js";
import pdfRoutes from "./modules/pdf/pdf.routes.js";
import examRoutes from "./modules/exam/exam.routes.js";
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
  app.use(
    helmet({
      frameguard: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    })
  );
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

  // Serve uploaded files dynamically from MongoDB if ephemeral local disk copy is lost
  app.get("/uploads/:filename", async (req, res, next) => {
    try {
      const { filename } = req.params;
      const targetPath = `/uploads/${filename}`;
      
      const { Exam } = await import("./modules/exam/exam.model.js");
      const exam = await Exam.findOne({
        $or: [
          { "questionPaper.path": targetPath },
          { "studentAnswerSheet.path": targetPath }
        ]
      });

      if (exam) {
        const fileMetadata = exam.questionPaper.path === targetPath 
          ? exam.questionPaper 
          : exam.studentAnswerSheet;

        if (fileMetadata.data) {
          const buffer = Buffer.from(fileMetadata.data, "base64");
          res.setHeader("Content-Type", fileMetadata.type);
          res.setHeader("Content-Length", buffer.length);
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=31536000");
          return res.send(buffer);
        }
      }
    } catch (err) {
      logger.error({ err }, "Failed to serve upload dynamically from database");
    }
    next();
  });

  app.use("/uploads", express.static("uploads"));

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
  app.use("/api/exams", examRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
