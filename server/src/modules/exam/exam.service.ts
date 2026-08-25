import { NotFoundError } from "../../utils/app-error.js";
import { Exam, type IExam } from "./exam.model.js";
import type { CreateExamDto } from "./exam.types.js";

function toExamResponse(exam: IExam) {
  return {
    id: exam._id.toString(),
    title: exam.title,
    status: exam.status,
    questionPaper: exam.questionPaper,
    studentAnswerSheet: exam.studentAnswerSheet,
    questions: exam.questions,
    answers: exam.answers,
    mappings: exam.mappings,
    userId: exam.userId,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString(),
  };
}

export class ExamService {
  async createExam(input: CreateExamDto): Promise<ReturnType<typeof toExamResponse>> {
    const exam = await Exam.create({
      title: input.title?.trim() || "Exam Paper",
      status: "completed",
      questionPaper: input.questionPaper,
      studentAnswerSheet: input.studentAnswerSheet,
      userId: input.userId,
      questions: [],
      answers: [],
      mappings: [],
    });

    return toExamResponse(exam);
  }

  async listExams(userId: string): Promise<ReturnType<typeof toExamResponse>[]> {
    const exams = await Exam.find({ userId }).sort({ createdAt: -1 });
    return exams.map(toExamResponse);
  }

  async getExamById(id: string, userId: string): Promise<ReturnType<typeof toExamResponse>> {
    const exam = await Exam.findOne({ _id: id, userId });
    if (!exam) {
      throw new NotFoundError("Exam not found or access denied");
    }
    return toExamResponse(exam);
  }

  async deleteExam(id: string, userId: string): Promise<void> {
    const result = await Exam.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundError("Exam not found or access denied");
    }
  }
}

export const examService = new ExamService();
