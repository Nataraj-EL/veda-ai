import { NotFoundError } from "../../utils/app-error.js";
import {
  Assignment,
  GeneratedAssessment,
  type IAssignment,
  type IGeneratedAssessment,
} from "./assignment.model.js";
import type {
  AssignmentStatusResponse,
  CreateAssignmentDto,
} from "./assignment.types.js";
import { enqueueGenerationJob } from "../generation/generation.queue.js";
import { getTransientGenerationStatus } from "../generation/generation.worker.js";

function computeTotals(questionTypes: CreateAssignmentDto["questionTypes"]): {
  totalQuestions: number;
  totalMarks: number;
} {
  return questionTypes.reduce(
    (acc, row) => ({
      totalQuestions: acc.totalQuestions + row.numQuestions,
      totalMarks:
        acc.totalMarks + row.numQuestions * row.marksPerQuestion,
    }),
    { totalQuestions: 0, totalMarks: 0 }
  );
}

function toAssignmentResponse(assignment: IAssignment) {
  return {
    id: assignment._id.toString(),
    title: assignment.title,
    dueDate: assignment.dueDate.toISOString(),
    instructions: assignment.instructions,
    additionalInstructions: assignment.additionalInstructions,
    file: assignment.file,
    questionTypes: assignment.questionTypes,
    difficulty: assignment.difficulty,
    totalQuestions: assignment.totalQuestions,
    totalMarks: assignment.totalMarks,
    status: assignment.status,
    generationStatus: assignment.generationStatus,
    generationProgress: assignment.generationProgress,
    generationError: assignment.generationError,
    activeJobId: assignment.activeJobId,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
    userId: assignment.userId,
    subject: assignment.subject,
    gradeClass: assignment.gradeClass,
    topic: assignment.topic,
  };
}

function toResultResponse(result: IGeneratedAssessment) {
  return {
    id: result._id.toString(),
    assignmentId: result.assignmentId.toString(),
    sections: result.sections,
    difficulty: result.difficulty,
    totalMarks: result.totalMarks,
    totalQuestions: result.totalQuestions,
    metadata: result.metadata,
    generationStatus: result.generationStatus,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

export class AssignmentService {
  async createAssignment(input: CreateAssignmentDto): Promise<{
    assignment: ReturnType<typeof toAssignmentResponse>;
    jobId: string;
  }> {
    const { totalQuestions, totalMarks } = computeTotals(input.questionTypes);

    const assignment = await Assignment.create({
      title: input.title?.trim() || "Assignment",
      dueDate: new Date(input.dueDate),
      instructions: input.instructions,
      additionalInstructions: input.additionalInstructions,
      file: input.file ?? undefined,
      extractedText: input.extractedText,
      questionTypes: input.questionTypes,
      difficulty: input.difficulty,
      totalQuestions,
      totalMarks,
      status: "queued",
      generationStatus: "queued",
      generationProgress: 0,
      userId: input.userId,
      subject: input.subject,
      gradeClass: input.gradeClass,
      topic: input.topic,
    });

    const jobId = await enqueueGenerationJob(assignment._id.toString());

    assignment.activeJobId = jobId;
    await assignment.save();

    return {
      assignment: toAssignmentResponse(assignment),
      jobId,
    };
  }

  async listAssignments(userId: string): Promise<ReturnType<typeof toAssignmentResponse>[]> {
    if (!userId) return [];
    const assignments = await Assignment.find({ userId }).sort({ createdAt: -1 }).limit(100);
    return assignments.map(toAssignmentResponse);
  }

  async getAssignmentById(id: string, userId: string): Promise<ReturnType<typeof toAssignmentResponse>> {
    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.userId !== userId) {
      throw new NotFoundError("Assignment", id);
    }
    return toAssignmentResponse(assignment);
  }

  async getAssignmentStatus(id: string, userId: string): Promise<AssignmentStatusResponse> {
    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.userId !== userId) {
      throw new NotFoundError("Assignment", id);
    }

    const transient = await getTransientGenerationStatus(id);

    return {
      assignmentId: id,
      status: assignment.status,
      generationStatus: assignment.generationStatus,
      progress: transient?.progress ?? assignment.generationProgress,
      jobId: assignment.activeJobId,
      error: assignment.generationError,
      updatedAt: assignment.updatedAt.toISOString(),
    };
  }

  async getAssignmentResult(id: string, userId: string): Promise<ReturnType<typeof toResultResponse>> {
    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.userId !== userId) {
      throw new NotFoundError("Assignment", id);
    }

    const result = await GeneratedAssessment.findOne({ assignmentId: id });
    if (!result) {
      throw new NotFoundError("Generated assessment", id);
    }

    return toResultResponse(result);
  }

  async deleteAssignment(id: string, userId: string): Promise<void> {
    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.userId !== userId) {
      throw new NotFoundError("Assignment", id);
    }

    await Assignment.findByIdAndDelete(id);
    await GeneratedAssessment.deleteOne({ assignmentId: id });
  }
}

export const assignmentService = new AssignmentService();
