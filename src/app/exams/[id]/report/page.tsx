"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export default function GradedExamReportPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const { currentExam, isLoading, fetchExamById, updateExam } = useExamStore();
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  const [showAnswerSheet, setShowAnswerSheet] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [adjustedScores, setAdjustedScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<string | null>(null);

  const [zoomPercent, setZoomPercent] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    setIsFirefox(navigator.userAgent.toLowerCase().includes("firefox"));
  }, []);

  useEffect(() => {
    if (examId && userId) {
      fetchExamById(examId, userId);
    }
  }, [examId, fetchExamById, userId]);

  useEffect(() => {
    if (currentExam) {
      const initialScores: Record<string, number> = {};
      const initialComments: Record<string, string> = {};
      currentExam.mappings?.forEach((m) => {
        initialScores[m.questionNumber] = m.score ?? 0;
        initialComments[m.questionNumber] = m.teacherComment ?? "";
      });
      setAdjustedScores(initialScores);
      setComments(initialComments);

      // Expand the first question card by default
      if (currentExam.questions && currentExam.questions.length > 0) {
        const firstQNum = currentExam.questions[0].questionNumber;
        setExpandedQuestions({ [firstQNum]: true });
        setSelectedQuestionNumber(firstQNum);
      }
    }
  }, [currentExam]);

  if (isLoading || !currentExam) {
    return (
      <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
        <Sidebar variant="assignments" assignmentCount={0} />
        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
          <Header title="Exams" variant="assignments" backHref={`/exams/${examId}`} />
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#ff5623] animate-spin" />
              </div>
              <p className="text-sm font-semibold text-[#5e5e5e]/80">Loading report data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate scores and counts dynamically from state
  const maxMarks = currentExam.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;
  const currentTotalScore = Object.values(adjustedScores).reduce((sum, s) => sum + s, 0);
  const percent = maxMarks > 0 ? Math.round((currentTotalScore / maxMarks) * 100) : 0;

  const correctCount = currentExam.questions?.filter((q) => {
    const score = adjustedScores[q.questionNumber] ?? 0;
    return score === q.marks && q.marks > 0;
  }).length || 0;

  const partialCount = currentExam.questions?.filter((q) => {
    const score = adjustedScores[q.questionNumber] ?? 0;
    return score > 0 && score < q.marks;
  }).length || 0;

  const incorrectCount = currentExam.questions?.filter((q) => {
    const score = adjustedScores[q.questionNumber] ?? 0;
    return score === 0;
  }).length || 0;

  // Grade letters and status texts
  let performanceLabel = "Average";
  let gradeLetter = "C";
  let labelBg = "bg-amber-50 border-amber-200 text-amber-600";
  
  if (percent >= 85) {
    performanceLabel = "Outstanding";
    gradeLetter = "A";
    labelBg = "bg-[#ecfdf5] border-emerald-200 text-[#059669]";
  } else if (percent >= 70) {
    performanceLabel = "Good";
    gradeLetter = "B";
    labelBg = "bg-blue-50 border-blue-200 text-blue-600";
  } else if (percent >= 50) {
    performanceLabel = "Average";
    gradeLetter = "C";
    labelBg = "bg-yellow-50 border-yellow-200 text-yellow-600";
  } else {
    performanceLabel = "Needs Improvement";
    gradeLetter = "D";
    labelBg = "bg-red-50 border-red-200 text-red-600";
  }

  // Progress Circle Geometry (r=40)
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  // Compute total pages from coordinates
  const totalPages = currentExam.answers?.reduce((max, ans) => {
    const pageNum = ans.regions?.[0]?.pageNumber || 1;
    return Math.max(max, pageNum);
  }, 1) || 1;

  const isAllExpanded = currentExam.questions?.every((q) => expandedQuestions[q.questionNumber]) ?? false;

  const handleToggleAll = () => {
    const nextState = !isAllExpanded;
    const updated: Record<string, boolean> = {};
    currentExam.questions?.forEach((q) => {
      updated[q.questionNumber] = nextState;
    });
    setExpandedQuestions(updated);
  };

  const handleQuestionClick = (qNumber: string) => {
    setSelectedQuestionNumber(qNumber);
    const ans = currentExam.answers?.find((a) => a.questionNumber === qNumber);
    const page = ans?.regions?.[0]?.pageNumber || 1;
    setCurrentPage(page);
  };

  const handleAutoSave = async (updatedScoresMap: Record<string, number>, updatedCommentsMap: Record<string, string>) => {
    if (!currentExam) return;
    const newMappings = currentExam.mappings?.map((m) => ({
      ...m,
      score: updatedScoresMap[m.questionNumber] ?? m.score ?? 0,
      teacherComment: updatedCommentsMap[m.questionNumber] ?? m.teacherComment ?? "",
    })) || [];

    const newTotalScore = Object.values(updatedScoresMap).reduce((sum, s) => sum + s, 0);

    try {
      await updateExam(currentExam.id, userId, {
        mappings: newMappings,
        totalScore: newTotalScore,
      });
    } catch (err) {
      console.error("Failed to auto-save report", err);
    }
  };

  const handleDecrementScore = (qNumber: string) => {
    setAdjustedScores((prev) => {
      const currentVal = prev[qNumber] ?? 0;
      const newVal = Math.max(0, currentVal - 1);
      const updated = {
        ...prev,
        [qNumber]: newVal,
      };
      handleAutoSave(updated, comments);
      return updated;
    });
  };

  const handleIncrementScore = (qNumber: string, maxVal: number) => {
    setAdjustedScores((prev) => {
      const currentVal = prev[qNumber] ?? 0;
      const newVal = Math.min(maxVal, currentVal + 1);
      const updated = {
        ...prev,
        [qNumber]: newVal,
      };
      handleAutoSave(updated, comments);
      return updated;
    });
  };

  const handleCommentBlur = (qNumber: string, val: string) => {
    setComments((prev) => {
      const updated = {
        ...prev,
        [qNumber]: val,
      };
      handleAutoSave(adjustedScores, updated);
      return updated;
    });
  };

  // Document active answer regions
  const activeAnswer = currentExam.answers?.find((a) => a.questionNumber === selectedQuestionNumber);
  const activeRegions = activeAnswer?.regions || [];

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      <Sidebar variant="assignments" assignmentCount={0} primaryCta="aiTeacherToolkit" />

      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header title="Exams" variant="assignments" backHref={`/exams/${examId}`} />

        <div className="flex-grow flex flex-col min-h-0 overflow-y-auto px-4 py-4 md:px-6">
          
          {/* Top Title Banner */}
          <div className="flex items-center justify-between w-full max-w-[1343px] mx-auto mb-4 shrink-0">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-1.04px] text-[#303030] leading-tight">
                Evaluation Report
              </h2>
              <p className="text-[16px] font-semibold text-[#5e5e5e]/70 mt-1">
                {currentExam.studentAnswerSheet?.name?.split("-")?.[0]?.trim() || "Aryan Sharma"} - {currentTotalScore}/{maxMarks} marks
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowAnswerSheet(!showAnswerSheet)}
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-black/10 bg-white hover:bg-slate-50 transition-standard cursor-pointer font-semibold text-[14px] text-[#303030]"
            >
              {showAnswerSheet ? (
                <>
                  <EyeOff className="w-4 h-4 text-[#8e8e93]" />
                  <span>Hide Answer Sheets</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-[#8e8e93]" />
                  <span>Show Answer Sheets</span>
                </>
              )}
            </button>
          </div>

          {/* Responsive Split Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full max-w-[1343px] mx-auto flex-1 min-h-0 pb-16">
            
            {/* LEFT PANEL: Evaluation Card & Accordions */}
            <div className={cn(
              "flex flex-col min-h-0 overflow-y-auto gap-4",
              showAnswerSheet ? "lg:col-span-5" : "lg:col-span-12"
            )}>
              
              {/* Summary Performance Card */}
              <div className="rounded-[28px] border border-black/5 bg-white p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                
                {/* Profile info & count badges */}
                <div className="flex flex-col gap-4 min-w-0 flex-1">
                  <div>
                    <span className="font-semibold text-xs text-[#8e8e93] block uppercase tracking-wider">
                      Student Name
                    </span>
                    <h3 className="text-[20px] font-extrabold text-[#303030] leading-tight mt-0.5 truncate">
                      {currentExam.studentAnswerSheet?.name?.split("-")?.[0]?.trim() || "Aryan Sharma"}
                    </h3>
                    <p className="text-[13px] font-medium text-[#5e5e5e]/80 mt-1 truncate">
                      {currentExam.title}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-[#eafaf1] text-[#16a34a] rounded-full px-3.5 py-1.5 flex items-center gap-2 font-bold text-xs leading-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>{correctCount} Correct</span>
                    </span>
                    <span className="bg-[#fffde8] text-[#ca8a04] rounded-full px-3.5 py-1.5 flex items-center gap-2 font-bold text-xs leading-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ca8a04]/10 text-[#ca8a04]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                      <span>{partialCount} Partial</span>
                    </span>
                    <span className="bg-[#fef2f2] text-[#b91c1c] rounded-full px-3.5 py-1.5 flex items-center gap-2 font-bold text-xs leading-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#b91c1c]/10 text-[#b91c1c]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                      <span>{incorrectCount} Incorrect</span>
                    </span>
                  </div>
                </div>

                {/* Score donut circle & Grade banner (enclosed in light gray card container) */}
                <div className="bg-[#f8f8f9] rounded-[24px] border border-black/[0.03] p-5 flex items-center gap-6 shrink-0">
                  {/* Circular Donut Ring */}
                  <div className="relative flex items-center justify-center w-[100px] h-[100px] select-none">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-slate-200 fill-transparent"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-[#16a34a] fill-transparent transition-all duration-500"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-[24px] font-black text-[#303030] leading-none">
                        {currentTotalScore}
                      </span>
                      <span className="text-[10px] font-bold text-[#8e8e93] mt-1 uppercase tracking-wider">
                        Out of {maxMarks}
                      </span>
                    </div>
                  </div>

                  {/* Grade Badge details */}
                  <div className="flex flex-col items-start gap-1">
                    <span className={cn(
                      "px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border-none leading-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                      percent >= 85
                        ? "bg-[#eafaf1] text-[#16a34a]"
                        : percent >= 70
                        ? "bg-blue-50 text-blue-600"
                        : percent >= 50
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-red-50 text-red-600"
                    )}>
                      {performanceLabel}
                    </span>
                    <span className="text-[44px] font-black text-[#303030] leading-none mt-1.5">
                      {gradeLetter}
                    </span>
                    <span className="text-xs font-bold text-[#8e8e93] mt-1">
                      {percent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Subheading row */}
              <div className="flex items-center justify-between mt-2 px-2 shrink-0">
                <h4 className="text-[16px] font-bold text-[#303030]">
                  Question-wise Breakdown
                </h4>
                
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="bg-white hover:bg-slate-50 border border-black/10 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer text-[#303030]"
                >
                  {isAllExpanded ? "Collapse All" : "Expand All"}
                </button>
              </div>

              {/* Accordion Questions List */}
              <div className="space-y-3">
                {currentExam.questions?.map((q, idx) => {
                  const score = adjustedScores[q.questionNumber] ?? 0;
                  const comment = comments[q.questionNumber] ?? "";
                  const mapping = currentExam.mappings?.find((m) => m.questionNumber === q.questionNumber);
                  const feedback = mapping?.feedback || "No AI feedback provided.";
                  const isExpanded = expandedQuestions[q.questionNumber];

                  return (
                    <div
                      key={q.questionNumber}
                      onClick={() => handleQuestionClick(q.questionNumber)}
                      className={cn(
                        "rounded-[24px] border transition-all duration-200 overflow-hidden bg-white cursor-pointer select-none",
                        selectedQuestionNumber === q.questionNumber
                          ? "border-[#ff5623] shadow-sm"
                          : "border-black/5 hover:border-black/15"
                      )}
                    >
                      {/* Accordion Header */}
                      <div className="flex items-center justify-between p-5 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a4a4a] text-white text-[14px] font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-[15px] font-semibold text-[#303030] leading-relaxed truncate max-w-[320px] md:max-w-none">
                            {q.text}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={cn(
                            "px-3 py-1 rounded-full font-bold text-xs border uppercase",
                            score === q.marks
                              ? "bg-[#ecfdf5] border-emerald-100 text-[#059669]"
                              : score > 0
                              ? "bg-[#fffbeb] border-amber-100 text-[#d97706]"
                              : "bg-[#fef2f2] border-red-100 text-[#dc2626]"
                          )}>
                            {score} / {q.marks}
                          </span>
                          
                          <button
                            type="button"
                            className="p-1 text-[#8e8e93] hover:text-[#303030] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedQuestions((prev) => ({
                                ...prev,
                                [q.questionNumber]: !prev[q.questionNumber],
                              }));
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 border-t border-black/5 bg-[#fafafa]/50 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Score Adjustment */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2.5 rounded-lg border border-black/10 bg-white px-2 py-1 shadow-sm">
                              <button
                                type="button"
                                disabled={score <= 0}
                                onClick={() => handleDecrementScore(q.questionNumber)}
                                className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/5 text-[#5e5e5e] disabled:opacity-30 cursor-pointer border-none bg-transparent"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="min-w-[40px] text-center text-sm font-bold text-[#303030]">
                                {score} / {q.marks}
                              </span>
                              <button
                                type="button"
                                disabled={score >= q.marks}
                                onClick={() => handleIncrementScore(q.questionNumber, q.marks)}
                                className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/5 text-[#5e5e5e] disabled:opacity-30 cursor-pointer border-none bg-transparent"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-xs font-semibold text-[#8e8e93]">
                              AI Suggested : {mapping?.score ?? 0}
                            </span>
                          </div>

                          {/* AI Reasoning */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-[10px] text-[#8e8e93] block uppercase tracking-wider">
                              AI Reasoning
                            </span>
                            <p className="text-[13px] font-medium text-[#5e5e5e] leading-relaxed bg-[#f6f6f6] rounded-xl px-4 py-3 border border-black/5">
                              {feedback}
                            </p>
                          </div>

                          {/* Teacher comments input */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-[10px] text-[#8e8e93] block uppercase tracking-wider">
                              Teacher's Comments (Optional)
                            </span>
                            <textarea
                              placeholder="Add your feedback to this question..."
                              value={comment}
                              onChange={(e) => setComments({ ...comments, [q.questionNumber]: e.target.value })}
                              onBlur={(e) => handleCommentBlur(q.questionNumber, e.target.value)}
                              className="w-full text-sm font-medium text-[#303030] bg-white border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff5623] min-h-[70px] leading-relaxed shadow-inner"
                            />
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* RIGHT PANEL: Answer Sheet PDF/Image Frame */}
            <div className={cn(
              "flex flex-col min-h-0 border-[1.25px] border-black/10 bg-white rounded-[28px] overflow-hidden shadow-sm",
              showAnswerSheet ? "lg:col-span-7" : "hidden"
            )}>
              <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b-[1.25px] border-black/10 bg-[#303030] px-6">
                <p className="text-[16px] font-bold tracking-[-0.64px] text-white/90">
                  Answer Sheet
                </p>
                
                {/* Zoom & Page Control Blocks */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-1.5 text-white">
                    <button
                      type="button"
                      onClick={() => setZoomPercent((z) => Math.max(75, z - 25))}
                      className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white hover:opacity-85"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[44px] text-center text-[13px] font-bold tracking-[-0.56px]">
                      {zoomPercent}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomPercent((z) => Math.min(150, z + 25))}
                      className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white hover:opacity-85"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-1.5 text-white">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white disabled:opacity-35 hover:opacity-85"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[13px] font-bold tracking-[-0.56px]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex cursor-pointer items-center border-none bg-transparent p-0 text-white disabled:opacity-35 hover:opacity-85"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Document Content Area */}
              <div className="flex-1 overflow-y-auto bg-[#f6f6f6]/40 px-3 py-4">
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
                        className="relative mx-auto aspect-[1/1.25] w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-6 font-serif shadow-sm select-none md:p-8"
                      >
                        {/* Green Highlight Box for selected question */}
                        {activeRegions.map((region, rIdx) => {
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
                              <span className="absolute bottom-full left-[-2px] rounded-t-[10px] rounded-b-none bg-[#3dd218] px-3.5 py-0.5 font-serif text-[15px] font-extrabold leading-tight text-white select-none">
                                Q{selectedQuestionNumber}
                              </span>
                            </div>
                          );
                        })}

                        {/* Visual Document Content */}
                        {currentExam.studentAnswerSheet?.path ? (
                          currentExam.studentAnswerSheet.type?.startsWith("image/") ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${currentExam.studentAnswerSheet.path}`}
                              className="absolute inset-0 h-full w-full object-contain pointer-events-none z-0"
                              alt="Student Answer Sheet"
                            />
                          ) : (
                            <iframe
                              src={`${process.env.NEXT_PUBLIC_API_URL}${currentExam.studentAnswerSheet.path}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&messages=0`}
                              className={cn(
                                "absolute border-none pointer-events-none z-0",
                                isFirefox
                                  ? "-top-[40px] h-[calc(100%+40px)] w-full left-0"
                                  : "inset-0 h-full w-full"
                              )}
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

          </div>

        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}
