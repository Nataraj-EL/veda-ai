import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, "ROUTE_NOT_FOUND", "The requested resource was not found");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  void _next;
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, "Non-operational application error");
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    sendError(res, 400, "INVALID_JSON", "Malformed JSON request body");
    return;
  }

  // Intercept Mongoose ValidationErrors and return a clean 400 status
  if (err && (err as any).name === "ValidationError") {
    const details: Record<string, string> = {};
    if ((err as any).errors) {
      for (const key of Object.keys((err as any).errors)) {
        details[key] = (err as any).errors[key]?.message || "Validation failed";
      }
    }
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      (err as any).message || "Database validation failed",
      details
    );
    return;
  }

  logger.error({ err }, "Unhandled server error");
  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "An unexpected error occurred. Please try again later."
  );
}
