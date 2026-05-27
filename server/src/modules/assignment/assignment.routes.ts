import { Router } from "express";
import multer from "multer";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { AppError } from "../../utils/app-error.js";
import { logger } from "../../utils/logger.js";
import { extractTextFromPdf } from "../../utils/pdf-extractor.js";
import { extractMetadataFromText } from "../generation/ai.service.js";
import {
  createAssignment,
  deleteAssignment,
  getAssignment,
  getAssignmentResult,
  getAssignmentStatus,
  listAssignments,
} from "./assignment.controller.js";
import {
  assignmentIdParamSchema,
  createAssignmentSchema,
} from "./assignment.validation.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const uploadMiddleware = upload.single("file");

router.post(
  "/",
  uploadMiddleware,
  asyncHandler(async (req, _res, next) => {
    // 1. If a file is uploaded, populate req.body.file metadata so Zod validation passes
    if (req.file) {
      req.body.file = {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      };

      // 2. Perform text extraction
      logger.info({ filename: req.file.originalname, size: req.file.size }, "Extracting text from uploaded file");
      let text = "";
      
      if (req.file.mimetype === "application/pdf") {
        text = await extractTextFromPdf(req.file.buffer);
      } else if (req.file.mimetype.startsWith("text/")) {
        text = req.file.buffer.toString("utf-8").trim();
      } else {
        throw new AppError("Unsupported file type. Please upload a PDF or text file.", 400, "INVALID_FILE_TYPE");
      }

      // Reject empty or very small/unreadable extraction with user-friendly error message
      if (!text || text.trim().length < 10) {
        throw new AppError("Unable to extract readable content from the uploaded PDF.", 400, "MATERIAL_EXTRACTION_FAILED");
      }

      req.body.extractedText = text;

      // Extract dynamic metadata using Groq
      try {
        const metadata = await extractMetadataFromText(
          text,
          req.body.subject,      // onboarding fallback subject
          req.body.gradeClass    // onboarding fallback gradeClass
        );
        req.body.subject = metadata.subject;
        req.body.gradeClass = metadata.gradeClass;
        req.body.topic = metadata.topic;
        req.body.title = metadata.title;
        logger.info({ metadata }, "Successfully extracted metadata from uploaded file");
      } catch (err) {
        logger.error({ err }, "Failed to extract metadata from uploaded file");
      }

      // Temporary structured logs
      logger.info({
        uploadedFilename: req.file.originalname,
        extractedTextLength: text.length,
        first500CharsPreview: text.slice(0, 500),
      }, "PDF Extraction Debug Log");
    }

    // 3. Parse questionTypes array from JSON string if sent via FormData
    if (typeof req.body.questionTypes === "string") {
      try {
        req.body.questionTypes = JSON.parse(req.body.questionTypes);
      } catch {
        // Let Zod handle the parse error
      }
    }

    next();
  }),
  validate(createAssignmentSchema, "body"),
  createAssignment
);
router.get("/", listAssignments);
router.get(
  "/:id",
  validate(assignmentIdParamSchema, "params"),
  getAssignment
);
router.get(
  "/:id/status",
  validate(assignmentIdParamSchema, "params"),
  getAssignmentStatus
);
router.get(
  "/:id/result",
  validate(assignmentIdParamSchema, "params"),
  getAssignmentResult
);
router.delete(
  "/:id",
  validate(assignmentIdParamSchema, "params"),
  deleteAssignment
);

export default router;
