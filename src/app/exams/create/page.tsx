"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export default function CreateExamPage() {
  const router = useRouter();
  const { createExam, isUploading, uploadError, clearUploadError } = useExamStore();

  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);

  const [questionPaperError, setQuestionPaperError] = useState("");
  const [answerSheetError, setAnswerSheetError] = useState("");

  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [processingState, setProcessingState] = useState<"idle" | "uploading" | "verifying" | "saving">("idle");

  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  useEffect(() => {
    useUserPreferencesStore.getState().loadPreferences();
    clearUploadError();
  }, [clearUploadError]);

  // Simulate progress when uploading/processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      setSimulatedProgress(0);
      setProcessingState("uploading");
      interval = setInterval(() => {
        setSimulatedProgress((prev) => {
          if (prev < 45) {
            return prev + 5;
          } else if (prev < 80) {
            setProcessingState("verifying");
            return prev + 2;
          } else if (prev < 98) {
            setProcessingState("saving");
            return prev + 1;
          }
          return prev;
        });
      }, 150);
    } else {
      setSimulatedProgress(0);
      setProcessingState("idle");
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const validateFile = (file: File, fieldName: string, setError: (msg: string) => void): boolean => {
    setError("");
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (file.size > maxSizeBytes) {
      setError(`${fieldName} exceeds the maximum size limit of 10MB.`);
      return false;
    }
    if (!allowedExtensions.includes(ext)) {
      setError(`${fieldName} must be a PDF or image (JPG, JPEG, PNG, WEBP).`);
      return false;
    }
    return true;
  };

  const handleQuestionPaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      const file = files[0];
      if (validateFile(file, "Question paper", setQuestionPaperError)) {
        setQuestionPaper(file);
      } else {
        setQuestionPaper(null);
      }
    }
  };

  const handleAnswerSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      const file = files[0];
      if (validateFile(file, "Handwritten answer sheet", setAnswerSheetError)) {
        setAnswerSheet(file);
      } else {
        setAnswerSheet(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!questionPaper) {
      setQuestionPaperError("Question paper file is required");
      hasError = true;
    }

    if (!answerSheet) {
      setAnswerSheetError("Student answer sheet is required");
      hasError = true;
    }

    if (hasError) return;

    // Auto-generate title from question paper filename
    const generatedTitle = questionPaper!.name.replace(/\.[^/.]+$/, "");

    const formData = new FormData();
    formData.append("title", generatedTitle);
    formData.append("userId", userId);
    formData.append("questionPaper", questionPaper!);
    formData.append("studentAnswerSheet", answerSheet!);

    try {
      await createExam(formData, userId);
      router.push("/exams");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar variant="assignments" assignmentCount={0} primaryCta="aiTeacherToolkit" />

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header
          title="Exams"
          variant="assignments"
          backHref="/exams"
        />

        {/* Upload & Processing Loader Stepper overlay */}
        {isUploading && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-fill border border-neutral-border rounded-[28px] p-6 max-w-md w-full shadow-sm text-center space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#FA643C] animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-black">
                    {processingState === "uploading"
                      ? "Uploading files..."
                      : processingState === "verifying"
                        ? "Verifying document formats..."
                        : "Saving exam details..."}
                  </h3>
                  <p className="text-xs text-neutral-secondary font-normal tracking-wide">
                    {simulatedProgress}% COMPLETED
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FA643C] to-[#A7280F] transition-all duration-75 ease-out rounded-full"
                    style={{ width: `${simulatedProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
          <div className="mx-auto w-full px-4 pt-4 pb-36 md:px-2 md:pb-6 flex-grow flex flex-col items-center justify-center">
            
            {/* Error block if backend fails */}
            {uploadError && (
              <div className="max-w-[720px] w-full mb-4 bg-feedback-error/5 border border-feedback-error/20 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-feedback-error w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-feedback-error">Upload failed</h4>
                  <p className="text-xs text-feedback-error/80 mt-1">{uploadError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-[720px] w-full space-y-6 flex flex-col items-center">
              
              {/* Header Title block */}
              <div className="text-center space-y-1 w-full">
                <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#303030] tracking-tight leading-tight">
                  Upload <span className="bg-[#ff5623]/10 text-[#ff5623] px-3.5 py-1 rounded-full inline-block mt-1 md:mt-0">Question Paper &amp; Answer Sheets</span>
                </h2>
                <p className="text-[#5e5e5e]/55 text-sm md:text-[16px] font-normal tracking-wide">
                  Upload both files to get started
                </p>
              </div>

              {/* Concentric circle illustration */}
              <div className="relative flex justify-center items-center my-4">
                <div className="absolute w-36 h-36 rounded-full border border-dashed border-[#ff5623]/30 animate-[spin_60s_linear_infinite]" />
                <div className="absolute w-44 h-44 rounded-full border border-dashed border-black/5" />
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 flex items-center justify-center overflow-hidden shadow-inner">
                  {/* Figma-like vector teacher outline avatar */}
                  <svg className="w-14 h-14 text-[#ff5623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 14c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 16c-4.42 0-8 2.58-8 6h16c0-3.42-3.58-6-8-6z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Upload boxes row - stacked on mobile, row on desktop */}
              <div className="flex flex-col md:flex-row gap-6 w-full">
                
                {/* 1. Question Paper Card */}
                <div className="flex-1">
                  <input
                    type="file"
                    id="question-paper-input"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleQuestionPaperChange}
                    className="hidden"
                  />
                  {!questionPaper ? (
                    <div
                      onClick={() => document.getElementById("question-paper-input")?.click()}
                      className={cn(
                        "h-48 border-2 border-dashed border-black/10 hover:border-[#ff5623]/50 bg-white rounded-[24px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-standard",
                        questionPaperError && "border-feedback-error bg-feedback-error/5"
                      )}
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-[#303030]" strokeWidth={2} />
                      </div>
                      <p className="text-sm font-semibold text-[#303030]">
                        Upload <span className="text-[#ff5623]">Question Paper</span>
                      </p>
                      <p className="text-[11px] text-neutral-secondary/50 mt-1">
                        Max 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="h-48 border border-black/10 bg-white rounded-[24px] flex flex-col items-center justify-center p-6 text-center">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#10b981] flex items-center justify-center mb-3">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-[#303030] truncate max-w-[200px]">
                        {questionPaper.name}
                      </p>
                      <p className="text-[11px] text-neutral-secondary/50 mt-0.5">
                        {(questionPaper.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuestionPaper(null)}
                        className="text-[11px] font-bold text-feedback-error hover:underline mt-2 border-none bg-transparent cursor-pointer"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                  {questionPaperError && (
                    <p className="text-xs text-feedback-error font-medium text-center mt-2">{questionPaperError}</p>
                  )}
                </div>

                {/* 2. Answer Sheet Card */}
                <div className="flex-1">
                  <input
                    type="file"
                    id="answer-sheet-input"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleAnswerSheetChange}
                    className="hidden"
                  />
                  {!answerSheet ? (
                    <div
                      onClick={() => document.getElementById("answer-sheet-input")?.click()}
                      className={cn(
                        "h-48 border-2 border-dashed border-black/10 hover:border-[#ff5623]/50 bg-white rounded-[24px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-standard",
                        answerSheetError && "border-feedback-error bg-feedback-error/5"
                      )}
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-[#303030]" strokeWidth={2} />
                      </div>
                      <p className="text-sm font-semibold text-[#303030]">
                        Upload <span className="text-[#ff5623]">Answer Sheet</span>
                      </p>
                      <p className="text-[11px] text-neutral-secondary/50 mt-1">
                        Max 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="h-48 border border-black/10 bg-white rounded-[24px] flex flex-col items-center justify-center p-6 text-center">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#10b981] flex items-center justify-center mb-3">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-[#303030] truncate max-w-[200px]">
                        {answerSheet.name}
                      </p>
                      <p className="text-[11px] text-neutral-secondary/50 mt-0.5">
                        {(answerSheet.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setAnswerSheet(null)}
                        className="text-[11px] font-bold text-feedback-error hover:underline mt-2 border-none bg-transparent cursor-pointer"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                  {answerSheetError && (
                    <p className="text-xs text-feedback-error font-medium text-center mt-2">{answerSheetError}</p>
                  )}
                </div>

              </div>

              {/* Start Mapping Button */}
              <div className="flex flex-col items-center justify-center pt-4 w-full">
                <button
                  type="submit"
                  disabled={!questionPaper || !answerSheet}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-8 text-[15px] font-bold tracking-tight select-none cursor-pointer transition-standard border-none",
                    (questionPaper && answerSheet)
                      ? "bg-[#181818] hover:bg-[#272727] text-white shadow-sm"
                      : "bg-[#c5c5c5] text-white/70 cursor-not-allowed shadow-none"
                  )}
                >
                  <span>Start Mapping</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <p className="text-[11px] text-[#5e5e5e]/50 text-center max-w-[320px] mt-2 leading-relaxed">
                  Once both files are uploaded, you'll be able to map answers with questions
                </p>
              </div>

            </form>
          </div>

          <Footer />
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
