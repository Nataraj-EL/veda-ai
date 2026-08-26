import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { examService } from "./exam.service.js";
import type { CreateExamBody, ExamIdParams, UpdateExamBody } from "./exam.validation.js";
import { AppError } from "../../utils/app-error.js";

function getRequestUserId(req: Request): string {
  const userId = (req.query.userId || req.headers["x-user-id"]) as string;
  if (!userId) {
    throw new AppError("User ID is required", 400, "USER_ID_REQUIRED");
  }
  return userId;
}

export const createExam = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getRequestUserId(req);
    const body = req.body as CreateExamBody;

    // Files mapping from multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const questionPaperFile = files?.["questionPaper"]?.[0];
    const studentAnswerSheetFile = files?.["studentAnswerSheet"]?.[0];

    if (!questionPaperFile || !studentAnswerSheetFile) {
      throw new AppError("Both Question Paper and Student Answer Sheet are required", 400, "FILES_REQUIRED");
    }

    const exam = await examService.createExam({
      title: body.title || "Exam Paper",
      userId,
      questionPaper: {
        name: questionPaperFile.originalname,
        size: questionPaperFile.size,
        type: questionPaperFile.mimetype,
        path: `/uploads/${questionPaperFile.filename}`,
      },
      studentAnswerSheet: {
        name: studentAnswerSheetFile.originalname,
        size: studentAnswerSheetFile.size,
        type: studentAnswerSheetFile.mimetype,
        path: `/uploads/${studentAnswerSheetFile.filename}`,
      },
    });

    sendSuccess(res, { exam }, 201);
  }
);

export const listExams = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getRequestUserId(req);
    const exams = await examService.listExams(userId);
    sendSuccess(res, { exams });
  }
);

export const getExam = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as ExamIdParams;
    const userId = getRequestUserId(req);
    const exam = await examService.getExamById(id, userId);
    sendSuccess(res, { exam });
  }
);

export const deleteExam = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as ExamIdParams;
    const userId = getRequestUserId(req);
    await examService.deleteExam(id, userId);
    sendSuccess(res, { message: "Exam deleted successfully" });
  }
);

export const updateExam = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as ExamIdParams;
    const userId = getRequestUserId(req);
    const body = req.body as UpdateExamBody;
    const exam = await examService.updateExam(id, userId, body);
    sendSuccess(res, { exam });
  }
);
