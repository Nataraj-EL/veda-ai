"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Crop,
  Save,
  CheckCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

interface TempBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNum: number;
}

function scoreBadgeClass(score: number, max: number) {
  if (score <= 0) return "bg-[#ffe9e2] text-[#c0350a]";
  if (score >= max) return "bg-[rgba(69,181,41,0.1)] text-[#34ac15]";
  return "bg-[#fff4e8] text-[#ff5623]";
}

export default function ExamAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const { currentExam, isLoading, fetchExamById, updateExam } = useExamStore();
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<string>("1");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["1"]));
  const [syncedExamId, setSyncedExamId] = useState<string | null>(null);
  const [syncedQuestionNumber, setSyncedQuestionNumber] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"questions" | "answers">("questions");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const [editedAnswerText, setEditedAnswerText] = useState("");
  const [editedScore, setEditedScore] = useState(0);
  const [editedFeedback, setEditedFeedback] = useState("");
  const [newRegions, setNewRegions] = useState<
    Array<{
      pageNumber: number;
      boundingBox: { x: number; y: number; width: number; height: number };
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; pageNum: number } | null>(
    null
  );
  const [tempBox, setTempBox] = useState<TempBox | null>(null);

  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  useEffect(() => {
    if (examId && userId) {
      fetchExamById(examId, userId);
    }
  }, [examId, fetchExamById, userId]);

  // Adjust selection when a newly loaded exam arrives (allowed during render).
  if (currentExam && currentExam.id !== syncedExamId) {
    const first = currentExam.questions?.[0]?.questionNumber || "1";
    setSyncedExamId(currentExam.id);
    setSelectedQuestionNumber(first);
    setExpandedIds(new Set([first]));
    setSyncedQuestionNumber(null);
  }

  const activeAnswerForSync = currentExam?.answers?.find(
    (a) => a.questionNumber === selectedQuestionNumber
  );
  const activeMappingForSync = currentExam?.mappings?.find(
    (m) => m.questionNumber === selectedQuestionNumber
  );

  if (
    currentExam &&
    syncedQuestionNumber !== selectedQuestionNumber
  ) {
    setSyncedQuestionNumber(selectedQuestionNumber);
    setEditedAnswerText(
      activeAnswerForSync?.text === "Unanswered"
        ? ""
        : activeAnswerForSync?.text || ""
    );
    setEditedScore(activeMappingForSync?.score || 0);
    setEditedFeedback(activeMappingForSync?.feedback || "");
    setNewRegions(activeAnswerForSync?.regions || []);
    setIsDrawingMode(false);
    setTempBox(null);
    const targetPage = activeAnswerForSync?.regions?.[0]?.pageNumber;
    if (targetPage) setCurrentPage(targetPage);
  }

  const handleQuestionClick = (qNum: string) => {
    setSelectedQuestionNumber(qNum);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qNum)) next.delete(qNum);
      else next.add(qNum);
      return next;
    });

    const answer = currentExam?.answers?.find((a) => a.questionNumber === qNum);
    const targetPage = answer?.regions?.[0]?.pageNumber;
    if (targetPage && pageRefs.current[targetPage]) {
      setCurrentPage(targetPage);
      pageRefs.current[targetPage]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  const handleExpandAll = () => {
    if (!currentExam?.questions) return;
    const all = currentExam.questions.map((q) => q.questionNumber);
    const allOpen = all.every((id) => expandedIds.has(id));
    setExpandedIds(allOpen ? new Set() : new Set(all));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (!isDrawingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;
    setDrawStart({ x: startX, y: startY, pageNum });
    setTempBox({ x: startX, y: startY, width: 0, height: 0, pageNum });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(drawStart.x - currentX);
    const height = Math.abs(drawStart.y - currentY);

    setTempBox({ x, y, width, height, pageNum: drawStart.pageNum });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !tempBox) return;
    setIsDrawing(false);
    setNewRegions([
      {
        pageNumber: tempBox.pageNum,
        boundingBox: {
          x: Math.round(tempBox.x * 10) / 10,
          y: Math.round(tempBox.y * 10) / 10,
          width: Math.round(tempBox.width * 10) / 10,
          height: Math.round(tempBox.height * 10) / 10,
        },
      },
    ]);
    setIsDrawingMode(false);
    setTempBox(null);
  };

  const handleSaveChanges = async () => {
    if (!currentExam) return;
    setIsSaving(true);
    try {
      const updatedAnswers = [...(currentExam.answers || [])];
      let ansIdx = updatedAnswers.findIndex(
        (a) => a.questionNumber === selectedQuestionNumber
      );

      const newAnswerData = {
        questionNumber: selectedQuestionNumber,
        text: editedAnswerText.trim() === "" ? "Unanswered" : editedAnswerText,
        regions: newRegions,
      };

      if (ansIdx > -1) {
        updatedAnswers[ansIdx] = newAnswerData;
      } else {
        updatedAnswers.push(newAnswerData);
        ansIdx = updatedAnswers.length - 1;
      }

      const updatedMappings = [...(currentExam.mappings || [])];
      const mapIdx = updatedMappings.findIndex(
        (m) => m.questionNumber === selectedQuestionNumber
      );

      const newMappingData = {
        questionNumber: selectedQuestionNumber,
        matched: newRegions.length > 0,
        score: editedScore,
        feedback: editedFeedback,
        extractedAnswerIndex: ansIdx,
      };

      if (mapIdx > -1) {
        updatedMappings[mapIdx] = newMappingData;
      } else {
        updatedMappings.push(newMappingData);
      }

      await updateExam(currentExam.id, userId, {
        answers: updatedAnswers,
        mappings: updatedMappings,
      });

      alert("Changes saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleGradingStatus = async () => {
    if (!currentExam) return;
    setIsSaving(true);
    try {
      const newStatus =
        currentExam.gradingStatus === "completed" ? "pending" : "completed";
      await updateExam(currentExam.id, userId, {
        gradingStatus: newStatus,
      });
      alert(
        `Grading marked as ${newStatus === "completed" ? "Completed" : "Pending Review"}!`
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update grading status.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !currentExam) {
    return (
      <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
        <Sidebar variant="assignments" assignmentCount={0} />
        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
          <Header title="Exams" variant="assignments" backHref="/exams" />
          <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex-1 w-full bg-white rounded-[24px] border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-6 px-6 text-center">
                {/* Figma sparkles loading illustration */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/loading-sparkles.png"
                    alt="Loading..."
                    width={96}
                    height={96}
                    className="h-full w-full object-contain animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[28px] md:text-[32px] font-extrabold tracking-[-1.04px] text-[#303030] leading-tight">
                    Loading exam...
                  </h3>
                  <p className="text-[14px] md:text-[16px] font-normal tracking-[-0.56px] text-[#5e5e5e]/70">
                    Retrieving grading details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeQuestion = currentExam.questions?.find(
    (q) => q.questionNumber === selectedQuestionNumber
  );
  const isUnanswered = newRegions.length === 0;
  const totalPages = Math.max(
    2,
    ...(currentExam.answers?.flatMap((ans) => ans.regions?.map((r) => r.pageNumber) || []) || [])
  );
  const allExpanded =
    (currentExam.questions?.length || 0) > 0 &&
    currentExam.questions!.every((q) => expandedIds.has(q.questionNumber));

  const renderQuestionList = () => (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[16px] font-bold tracking-[-0.64px] text-[#303030]">
          Extracted Questions (from question paper)
        </h3>
        <button
          type="button"
          onClick={handleExpandAll}
          className="hidden h-11 shrink-0 cursor-pointer items-center rounded-full bg-white px-5 text-[14px] font-medium tracking-[-0.56px] text-[#181818] transition-standard hover:bg-[#f6f6f6] border-none md:inline-flex"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {currentExam.questions?.map((q) => {
          const mapping = currentExam.mappings?.find(
            (m) => m.questionNumber === q.questionNumber
          );
          const score = mapping?.score ?? 0;
          const isSelected = selectedQuestionNumber === q.questionNumber;
          const isExpanded = expandedIds.has(q.questionNumber);
          const feedback =
            isSelected && isExpanded
              ? editedFeedback || mapping?.feedback
              : mapping?.feedback;

          return (
            <div
              key={q.questionNumber}
              className={cn(
                "flex flex-col gap-3 rounded-2xl bg-white p-3 transition-standard",
                isSelected && isExpanded
                  ? "border-2 border-[#ff8d36]"
                  : "border border-transparent"
              )}
            >
              <button
                type="button"
                onClick={() => handleQuestionClick(q.questionNumber)}
                className="flex w-full cursor-pointer items-start gap-4 border-none bg-transparent p-0 text-left"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/25 text-[18px] font-extrabold tracking-[-0.8px] text-white",
                    isSelected
                      ? "bg-[#ff5623] shadow-[0px_8px_8.8px_rgba(255,121,80,0.1)]"
                      : "bg-[rgba(43,43,43,0.8)] shadow-[0px_8px_8.8px_rgba(134,134,134,0.1)]"
                  )}
                >
                  {q.questionNumber}
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-normal leading-[1.4] tracking-[-0.6px] text-[#303030] md:text-[16px]">
                  {q.text}
                </span>
                <span className="flex shrink-0 items-center gap-3 pt-0.5">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[14px] font-bold tracking-[-0.56px] md:text-[16px]",
                      scoreBadgeClass(score, q.marks || 0)
                    )}
                  >
                    {score} / {q.marks || 0}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f6f6f6] text-[#303030]">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <ChevronDown className="h-4 w-4" strokeWidth={2} />
                    )}
                  </span>
                </span>
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl bg-[#f6f6f6] px-5 py-4 md:px-6">
                    <p className="text-[16px] font-bold tracking-[-0.64px] text-[#303030]">
                      AI Feedback
                    </p>
                    <p className="mt-2.5 text-[14px] font-normal leading-[1.4] tracking-[-0.56px] text-[#303030]">
                      {feedback?.trim()
                        ? feedback
                        : "No feedback yet."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAnswerSheet = () => (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border-[1.25px] border-black/10 bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b-[1.25px] border-black/10 bg-[#303030] px-4 md:h-16 md:px-6">
        <p className="hidden text-[16px] font-bold tracking-[-0.64px] text-white/80 md:block">
          Answer Sheet
        </p>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoomPercent((z) => Math.max(75, z - 25))}
              className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[44px] text-center text-[14px] font-bold tracking-[-0.56px]">
              {zoomPercent}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoomPercent((z) => Math.min(150, z + 25))}
              className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[14px] font-bold tracking-[-0.56px]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f6f6f6]/40 px-2.5 py-4 md:px-3">
        <div
          className="mx-auto origin-top transition-transform"
          style={{
            width: `${Math.min(100, zoomPercent)}%`,
            maxWidth: 660,
            transform: zoomPercent > 100 ? `scale(${zoomPercent / 100})` : undefined,
          }}
        >
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            if (pageNum !== currentPage) return null;

            return (
              <div
                key={pageNum}
                ref={(el) => {
                  pageRefs.current[pageNum] = el;
                }}
                onMouseDown={(e) => handleMouseDown(e, pageNum)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={cn(
                  "relative mx-auto aspect-[1/1.25] w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-6 font-serif shadow-sm select-none md:p-8",
                  isDrawingMode
                    ? "cursor-crosshair border-dashed border-[#ff5623]/60 bg-orange-50/5"
                    : ""
                )}
              >
                {!isDrawingMode &&
                  newRegions?.map((region, rIdx) => {
                    if (region.pageNumber !== pageNum) return null;
                    const { x, y, width, height } = region.boundingBox;
                    return (
                      <div
                        key={rIdx}
                        className="pointer-events-none absolute rounded-2xl border-2 border-[#3dd218] bg-[rgba(94,255,53,0.1)] z-10"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                      >
                        <span className="absolute bottom-full left-[-2px] rounded-t-[10px] rounded-b-none bg-[#3dd218] px-3.5 py-0.5 font-serif text-[15px] font-extrabold leading-tight text-white">
                          Q{selectedQuestionNumber}
                        </span>
                      </div>
                    );
                  })}

                {isDrawingMode && tempBox && tempBox.pageNum === pageNum && (
                  <div
                    className="pointer-events-none absolute rounded-lg border-2 border-dashed border-[#ff5623] bg-[#ff5623]/10"
                    style={{
                      left: `${tempBox.x}%`,
                      top: `${tempBox.y}%`,
                      width: `${tempBox.width}%`,
                      height: `${tempBox.height}%`,
                    }}
                  />
                )}

                {currentExam.studentAnswerSheet?.path ? (
                  currentExam.studentAnswerSheet.type?.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${currentExam.studentAnswerSheet.path}`}
                      className="absolute inset-0 h-full w-full object-contain pointer-events-none z-0"
                      alt="Student Answer Sheet"
                    />
                  ) : (
                    <iframe
                      src={`${process.env.NEXT_PUBLIC_API_URL}${currentExam.studentAnswerSheet.path}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&messages=0`}
                      className="absolute inset-0 h-full w-full border-none pointer-events-none z-0"
                      title="Student Answer Sheet"
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-[#5e5e5e]/50 font-sans not-italic">
                    No answer sheet document loaded
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-page-fill font-sans text-neutral-primary">
      <Sidebar
        variant="assignments"
        assignmentCount={0}
        primaryCta="aiTeacherToolkit"
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:px-3 md:pt-3">
        <Header title="Exams" variant="assignments" backHref="/exams" />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1343px] flex-1 flex-col px-3 pb-24 pt-3 md:px-0 md:pb-10">
            {/* Mobile Questions / Answer Sheet toggle — Figma 3:1192 / 3:1576 */}
            <div className="mb-3 flex rounded-full bg-[#f6f6f6] p-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTab("questions")}
                className={cn(
                  "flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border-none text-[16px] font-medium tracking-[-0.64px] transition-standard",
                  mobileTab === "questions"
                    ? "bg-[#303030] text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                    : "bg-transparent text-[rgba(94,94,94,0.8)]"
                )}
              >
                Questions
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("answers")}
                className={cn(
                  "flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border-none text-[16px] font-medium tracking-[-0.64px] transition-standard",
                  mobileTab === "answers"
                    ? "bg-[#303030] text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                    : "bg-transparent text-[rgba(94,94,94,0.8)]"
                )}
              >
                Answer Sheet
              </button>
            </div>

            {/* Desktop split — Figma 1:8861 */}
            <div className="hidden min-h-0 flex-1 gap-3 lg:flex">
              <div className="flex w-[min(672px,48%)] shrink-0 flex-col gap-4 overflow-y-auto rounded-[20px] bg-white/50 p-4">
                {renderQuestionList()}
              </div>
              <div className="flex min-h-[640px] min-w-0 flex-1 flex-col">
                {renderAnswerSheet()}
              </div>
            </div>

            {/* Mobile panels */}
            <div className="lg:hidden">
              {mobileTab === "questions" ? (
                <div className="rounded-[20px] bg-white/70 p-3">{renderQuestionList()}</div>
              ) : (
                <div className="min-h-[520px]">{renderAnswerSheet()}</div>
              )}
            </div>
          </div>

          <Footer />
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
