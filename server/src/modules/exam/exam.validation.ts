import { z } from "zod";

export const createExamSchema = z.object({
  title: z.string().optional(),
  userId: z.string().min(1, "userId is required"),
});

export const examIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid exam ID format"),
});

export type CreateExamBody = z.infer<typeof createExamSchema>;
export type ExamIdParams = z.infer<typeof examIdParamSchema>;
