import { Router } from "express";
import multer from "multer";
import path from "path";
import { validate } from "../../middleware/validate.middleware.js";
import { AppError } from "../../utils/app-error.js";
import {
  createExam,
  deleteExam,
  getExam,
  listExams,
  updateExam,
} from "./exam.controller.js";
import {
  createExamSchema,
  examIdParamSchema,
  updateExamSchema,
} from "./exam.validation.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Unsupported file type. Please upload a PDF or an image.", 400, "INVALID_FILE_TYPE"));
    }
  },
});

const uploadMiddleware = upload.fields([
  { name: "questionPaper", maxCount: 1 },
  { name: "studentAnswerSheet", maxCount: 1 },
]);

router.post(
  "/",
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new AppError("File size exceeds the limit of 10MB", 400, "FILE_TOO_LARGE"));
        }
        return next(new AppError(err.message, 400, "UPLOAD_ERROR"));
      } else if (err) {
        return next(err);
      }
      next();
    });
  },
  validate(createExamSchema, "body"),
  createExam
);

router.get("/", listExams);

router.get(
  "/:id",
  validate(examIdParamSchema, "params"),
  getExam
);

router.put(
  "/:id",
  validate(examIdParamSchema, "params"),
  validate(updateExamSchema, "body"),
  updateExam
);

router.delete(
  "/:id",
  validate(examIdParamSchema, "params"),
  deleteExam
);

export default router;
