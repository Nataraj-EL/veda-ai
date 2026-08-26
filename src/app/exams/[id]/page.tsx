"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, AlertCircle, FileText, CheckCircle, HelpCircle, Save, Crop, X } from "lucide-react";
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

export default function ExamAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const { currentExam, isLoading, fetchExamById, updateExam } = useExamStore();
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<string>("1");

  // Editing states
  const [editedAnswerText, setEditedAnswerText] = useState("");
  const [editedScore, setEditedScore] = useState(0);
  const [editedFeedback, setEditedFeedback] = useState("");
  const [newRegions, setNewRegions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Region drawing states
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; pageNum: number } | null>(null);
  const [tempBox, setTempBox] = useState<TempBox | null>(null);

  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  useEffect(() => {
    useUserPreferencesStore.getState().loadPreferences();
    if (examId) {
      fetchExamById(examId, userId);
    }
  }, [examId, fetchExamById, userId]);

  // Synchronize input fields when selected question changes
  useEffect(() => {
    if (!currentExam) return;
    const activeQuestion = currentExam.questions?.find((q) => q.questionNumber === selectedQuestionNumber);
    const activeAnswer = currentExam.answers?.find((a) => a.questionNumber === selectedQuestionNumber);
    const activeMapping = currentExam.mappings?.find((m) => m.questionNumber === selectedQuestionNumber);

    setEditedAnswerText(activeAnswer?.text || "");
    setEditedScore(activeMapping?.score || 0);
    setEditedFeedback(activeMapping?.feedback || "");
    setNewRegions(activeAnswer?.regions || []);
    setIsDrawingMode(false);
    setTempBox(null);
  }, [selectedQuestionNumber, currentExam]);

  const handleQuestionClick = (qNum: string) => {
    setSelectedQuestionNumber(qNum);

    const answer = currentExam?.answers?.find((a) => a.questionNumber === qNum);
    const targetPage = answer?.regions?.[0]?.pageNumber;

    if (targetPage && pageRefs.current[targetPage]) {
      pageRefs.current[targetPage]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  // Canvas drawing handlers
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
    // Set the new coordinate region
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

  // Save changes handler to backend
  const handleSaveChanges = async () => {
    if (!currentExam) return;
    setIsSaving(true);
    try {
      // Find matching index or insert new ones
      const updatedAnswers = [...(currentExam.answers || [])];
      let ansIdx = updatedAnswers.findIndex((a) => a.questionNumber === selectedQuestionNumber);
      
      const newAnswerData = {
        questionNumber: selectedQuestionNumber,
        text: editedAnswerText,
        regions: newRegions,
      };

      if (ansIdx > -1) {
        updatedAnswers[ansIdx] = newAnswerData;
      } else {
        updatedAnswers.push(newAnswerData);
      }

      const updatedMappings = [...(currentExam.mappings || [])];
      let mapIdx = updatedMappings.findIndex((m) => m.questionNumber === selectedQuestionNumber);
      
      const newMappingData = {
        questionNumber: selectedQuestionNumber,
        matched: newRegions.length > 0,
        score: editedScore,
        feedback: editedFeedback,
        extractedAnswerIndex: ansIdx > -1 ? ansIdx : updatedAnswers.length - 1,
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
      const newStatus = currentExam.gradingStatus === "completed" ? "pending" : "completed";
      await updateExam(currentExam.id, userId, {
        gradingStatus: newStatus,
      });
      alert(`Grading marked as ${newStatus === "completed" ? "Completed" : "Pending Review"}!`);
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
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#ff5623] animate-spin" />
              </div>
              <p className="text-sm font-semibold text-[#5e5e5e]/80">Loading exam assessment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeQuestion = currentExam.questions?.find((q) => q.questionNumber === selectedQuestionNumber);
  const activeAnswer = currentExam.answers?.find((a) => a.questionNumber === selectedQuestionNumber);
  const isUnanswered = newRegions.length === 0;

  const maxMarks = currentExam.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;
  const totalScore = currentExam.mappings?.reduce((sum, m) => sum + (m.score || 0), 0) || 0;
  const percent = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

  const totalPages = 2; // Simulated document pages

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Persistent Left Sidebar */}
      <Sidebar variant="assignments" assignmentCount={0} primaryCta="aiTeacherToolkit" />

      {/* Main Page Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header
          title="Exams"
          variant="assignments"
          backHref="/exams"
        />

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
          <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 pb-24 md:px-0 md:pb-12 flex-1 flex flex-col min-h-0">
            
            {/* Top metadata bar */}
            <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[20px] font-extrabold tracking-tight text-[#303030]">
                    {currentExam.title}
                  </h2>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                    currentExam.gradingStatus === "completed"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200/55"
                      : "bg-amber-50 text-amber-600 border-amber-200/55"
                  )}>
                    {currentExam.gradingStatus === "completed" ? "Graded" : "Pending Review"}
                  </span>
                </div>
                <p className="text-xs text-[#5e5e5e]/55 font-semibold mt-1">
                  AI Assessment &amp; Answer Mapping • Score: {totalScore} / {maxMarks} ({percent}%)
                </p>
              </div>
            </div>

            {/* Split panels - side-by-side on desktop */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 items-stretch">
              
              {/* Left Panel: Questions and details */}
              <div className="w-full lg:w-[460px] bg-white border border-neutral-border rounded-[28px] p-5 flex flex-col justify-between shadow-none">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                    <BookOpen className="w-5 h-5 text-[#ff5623]" />
                    <h3 className="text-sm font-bold tracking-tight text-[#303030]">Extracted Questions</h3>
                  </div>

                  {/* Scrollable Questions List */}
                  <div className="space-y-3 max-h-[300px] lg:max-h-[38vh] overflow-y-auto pr-1">
                    {currentExam.questions?.map((q) => {
                      const qAnswer = currentExam.answers?.find((a) => a.questionNumber === q.questionNumber);
                      const qUnanswered = !qAnswer || qAnswer.regions.length === 0;

                      return (
                        <div
                          key={q.questionNumber}
                          onClick={() => handleQuestionClick(q.questionNumber)}
                          className={cn(
                            "group relative rounded-[20px] border p-4 cursor-pointer text-left transition-standard select-none",
                            selectedQuestionNumber === q.questionNumber
                              ? "bg-orange-50/15 border-[#ff5623] shadow-inner"
                              : "bg-white border-black/5 hover:border-black/15"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-extrabold text-[#303030]">
                                Question {q.questionNumber}
                              </span>
                              <span className="text-[10px] font-bold text-[#5e5e5e]/50 px-2 py-0.5 bg-slate-100 rounded-full">
                                {q.marks} Marks
                              </span>
                            </div>

                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                                qUnanswered
                                  ? "bg-amber-50 text-amber-600 border border-amber-200/50"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                              )}
                            >
                              {qUnanswered ? "Unanswered" : "Mapped"}
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-semibold leading-relaxed text-[#5e5e5e]/80 line-clamp-2">
                            {q.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review Form Card */}
                {activeQuestion && (
                  <div className="mt-4 border-t border-black/5 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#303030]">
                        <AlertCircle className="w-4 h-4 text-[#ff5623]" />
                        <span>Configure Mapping &amp; Feedback</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        className={cn(
                          "inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-extrabold tracking-tight transition-standard border cursor-pointer",
                          isDrawingMode
                            ? "bg-[#ff5623] text-white border-transparent"
                            : "bg-white text-[#303030] border-black/10 hover:bg-slate-50"
                        )}
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>{isDrawingMode ? "Cancel Drawing" : "Adjust Region"}</span>
                      </button>
                    </div>

                    {isDrawingMode && (
                      <div className="bg-[#ff5623]/5 border border-[#ff5623]/25 text-[11px] text-[#ff5623] font-semibold p-2.5 rounded-xl text-center">
                        Drawing Mode Active: Click and drag on the answer sheet to define the new answer box.
                      </div>
                    )}

                    {/* Answer Text Area */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#5e5e5e]/85">Extracted Student Answer</label>
                      <textarea
                        value={editedAnswerText}
                        onChange={(e) => setEditedAnswerText(e.target.value)}
                        placeholder="No text extracted yet..."
                        className="w-full h-16 resize-none rounded-xl border border-black/10 bg-[#f8f8f8] p-3 text-[12px] font-medium leading-normal text-[#303030] placeholder:text-[#5e5e5e]/30 focus:outline-none"
                      />
                    </div>

                    {/* Score and feedback inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#5e5e5e]/85">
                          Score (Max {activeQuestion.marks})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={activeQuestion.marks}
                          value={editedScore}
                          onChange={(e) => setEditedScore(Math.min(activeQuestion.marks, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full rounded-xl border border-black/10 bg-[#f8f8f8] px-3 py-2 text-[12px] font-medium text-[#303030] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#5e5e5e]/85">Status</label>
                        <span className={cn(
                          "block text-center rounded-xl border py-2 text-[11px] font-bold uppercase",
                          isUnanswered
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        )}>
                          {isUnanswered ? "Unanswered" : "Mapped"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#5e5e5e]/85">Teacher Feedback</label>
                      <textarea
                        value={editedFeedback}
                        onChange={(e) => setEditedFeedback(e.target.value)}
                        placeholder="Write feedback comments..."
                        className="w-full h-16 resize-none rounded-xl border border-black/10 bg-[#f8f8f8] p-3 text-[12px] font-medium leading-normal text-[#303030] placeholder:text-[#5e5e5e]/30 focus:outline-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-black/5">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSaveChanges}
                        className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#181818] hover:bg-[#272727] text-white text-[13px] font-bold tracking-tight shadow-none transition-standard cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? "Saving..." : "Save Details"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleToggleGradingStatus}
                        className={cn(
                          "flex-1 flex h-10 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold tracking-tight transition-standard cursor-pointer disabled:opacity-50 border",
                          currentExam.gradingStatus === "completed"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/50"
                            : "bg-white text-[#303030] border-black/10 hover:bg-slate-50"
                        )}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{currentExam.gradingStatus === "completed" ? "Reopen" : "Complete"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Answer Sheet Canvas */}
              <div className="flex-1 bg-white border border-neutral-border rounded-[28px] p-5 flex flex-col shadow-none min-h-[500px]">
                <div className="flex items-center gap-2 border-b border-black/5 pb-3 justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#ff5623]" />
                    <h3 className="text-sm font-bold tracking-tight text-[#303030]">Student Answer Sheet</h3>
                  </div>
                  <div className="text-[11px] font-bold text-[#5e5e5e]/55">
                    {isDrawingMode ? "Click &amp; drag on paper to map" : isUnanswered ? "No highlight" : `Answer Region Highlighted`}
                  </div>
                </div>

                {/* Document Pages Container */}
                <div className="flex-1 overflow-y-auto max-h-[70vh] bg-slate-50/50 rounded-2xl p-4 space-y-6 mt-4 border border-black/5">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <div
                        key={pageNum}
                        ref={(el) => { pageRefs.current[pageNum] = el; }}
                        onMouseDown={(e) => handleMouseDown(e, pageNum)}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        className={cn(
                          "relative bg-white border border-slate-200 shadow-sm rounded-lg aspect-[1/1.414] w-full max-w-[500px] p-6 md:p-8 mx-auto my-4 text-left font-serif overflow-hidden select-none",
                          isDrawingMode ? "cursor-crosshair border-dashed border-[#ff5623]/60 bg-orange-50/5" : ""
                        )}
                      >
                        <div className="absolute top-3 right-3 text-[10px] font-bold text-[#a9a9a9] bg-slate-50 px-2 py-0.5 rounded border">
                          Page {pageNum}
                        </div>

                        {/* Saved Answer highlights */}
                        {!isDrawingMode && newRegions?.map((region: any, rIdx: number) => {
                          if (region.pageNumber === pageNum) {
                            const { x, y, width, height } = region.boundingBox;
                            return (
                              <div
                                key={rIdx}
                                className="absolute border-[2.5px] border-[#ff5623] bg-[#ff5623]/8 rounded-xl transition-all duration-300 pointer-events-none"
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  width: `${width}%`,
                                  height: `${height}%`,
                                }}
                              />
                            );
                          }
                          return null;
                        })}

                        {/* Drawing feedback boxes */}
                        {isDrawingMode && tempBox && tempBox.pageNum === pageNum && (
                          <div
                            className="absolute border-2 border-dashed border-[#ff5623] bg-[#ff5623]/10 rounded-lg pointer-events-none"
                            style={{
                              left: `${tempBox.x}%`,
                              top: `${tempBox.y}%`,
                              width: `${tempBox.width}%`,
                              height: `${tempBox.height}%`,
                            }}
                          />
                        )}

                        {/* Simulated Handwriting text */}
                        <div className="h-full flex flex-col justify-start space-y-8 font-serif italic text-blue-800 text-sm md:text-[15px] pt-8">
                          {pageNum === 1 ? (
                            <>
                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q1 answer:</p>
                                <p className="leading-relaxed">
                                  In brine (NaCl solution) electrolysis, chlorine gas is liberated at the anode, while hydrogen gas is evolved at the cathode. Sodium hydroxide solution accumulates near the cathode.
                                </p>
                                <p className="leading-normal font-mono text-xs md:text-sm text-blue-900 mt-1 pl-4">
                                  At Anode: 2Cl⁻ → Cl₂ + 2e⁻<br />
                                  At Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q2 answer:</p>
                                <p className="leading-relaxed">
                                  Sodium ions (Na⁺) and hydroxide (OH⁻) ions remain in the solution and combine to form NaOH because hydrogen ions (H⁺) are preferentially reduced at the cathode due to their lower reduction potential.
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q3(a) answer:</p>
                                <p className="leading-relaxed">
                                  Chlorine gas reacts with dry slaked lime [Ca(OH)₂] to form calcium oxychloride (bleaching powder) and water:
                                </p>
                                <p className="leading-normal font-mono text-xs md:text-sm text-blue-900 mt-1 pl-4">
                                  Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q4 answer:</p>
                                <p className="leading-relaxed">
                                  Common name: Baking Soda.<br />
                                  Chemical formula: NaHCO3.<br />
                                  Use: Bakery (bread/cakes) to make them fluffy by releasing CO2 gas on heating.
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          <Footer />
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
