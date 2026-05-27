import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { assignmentService } from "./assignment.service.js";
import type {
  AssignmentIdParams,
  CreateAssignmentBody,
} from "./assignment.validation.js";

import { AppError } from "../../utils/app-error.js";

function getRequestUserId(req: Request): string {
  const userId = (req.query.userId || req.headers["x-user-id"]) as string;
  if (!userId) {
    throw new AppError("User ID is required", 400, "USER_ID_REQUIRED");
  }
  return userId;
}

export const createAssignment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateAssignmentBody;
    const result = await assignmentService.createAssignment(body);
    sendSuccess(
      res,
      {
        assignment: result.assignment,
        jobId: result.jobId,
      },
      202
    );
  }
);

export const listAssignments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getRequestUserId(req);
    const assignments = await assignmentService.listAssignments(userId);
    sendSuccess(res, { assignments });
  }
);

export const getAssignment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as AssignmentIdParams;
    const userId = getRequestUserId(req);
    const assignment = await assignmentService.getAssignmentById(id, userId);
    sendSuccess(res, { assignment });
  }
);

export const getAssignmentStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as AssignmentIdParams;
    const userId = getRequestUserId(req);
    const status = await assignmentService.getAssignmentStatus(id, userId);
    sendSuccess(res, { status });
  }
);

export const getAssignmentResult = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as AssignmentIdParams;
    const userId = getRequestUserId(req);
    const result = await assignmentService.getAssignmentResult(id, userId);
    sendSuccess(res, { result });
  }
);

export const deleteAssignment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as AssignmentIdParams;
    const userId = getRequestUserId(req);
    await assignmentService.deleteAssignment(id, userId);
    sendSuccess(res, { message: "Assignment deleted successfully" });
  }
);
