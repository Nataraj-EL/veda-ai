import { z } from "zod";

export const createExamSchema = z.object({
  title: z.string().optional(),
  userId: z.string().min(1, "userId is required"),
});

export const examIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid exam ID format"),
});

export const updateExamSchema = z.object({
  title: z.string().optional(),
  questions: z.array(z.any()).optional(),
  answers: z.array(z.any()).optional(),
  mappings: z.array(z.any()).optional(),
});

export type CreateExamBody = z.infer<typeof createExamSchema>;
export type ExamIdParams = z.infer<typeof examIdParamSchema>;
export type UpdateExamBody = z.infer<typeof updateExamSchema>;
