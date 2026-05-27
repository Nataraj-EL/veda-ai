import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { pdfService } from "./pdf.service.js";
import { Assignment } from "../assignment/assignment.model.js";

const router = Router();

router.get(
  "/:assignmentId",
  asyncHandler(async (req, res): Promise<void> => {
    const assignmentId = req.params.assignmentId as string;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Assignment not found",
        },
      });
      return;
    }

    try {
      const pdfBuffer = await pdfService.generateAssignmentPdf(assignmentId);

      const sanitizedTitle = assignment.title
        ? assignment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : "assignment";
      const filename = `assignment-${sanitizedTitle}-${assignmentId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.end(pdfBuffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      res.status(500).json({
        success: false,
        error: {
          code: "PDF_GENERATION_FAILED",
          message,
        },
      });
    }
  })
);

export default router;
