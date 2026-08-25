"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Upload, X, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export default function CreateExamPage() {
  const router = useRouter();
  const { createExam, isUploading, uploadError, clearUploadError } = useExamStore();

  const [title, setTitle] = useState("");
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);

  const [titleError, setTitleError] = useState("");
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

    if (!title.trim()) {
      setTitleError("Exam title is required");
      hasError = true;
    } else {
      setTitleError("");
    }

    if (!questionPaper) {
      setQuestionPaperError("Question paper file is required");
      hasError = true;
    }

    if (!answerSheet) {
      setAnswerSheetError("Student answer sheet is required");
      hasError = true;
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append("title", title);
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
      <Sidebar variant="assignments" assignmentCount={0} />

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header
          title="Upload Exam"
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
          <div className="mx-auto w-full px-4 pt-2 pb-36 md:px-2 md:pb-6 flex-grow flex flex-col">
            {/* Header Title block */}
            <div className="mx-auto max-w-[810px] w-full mb-6">
              <h2 className="text-[20px] font-bold leading-7 tracking-[-0.8px] text-[#303030]">
                Configure New Exam
              </h2>
              <p className="text-[14px] font-normal leading-5 tracking-[-0.56px] text-[#5e5e5e]/55">
                Upload a printed question paper and the student handwritten answer sheet.
              </p>
            </div>

            {/* Error block if backend fails */}
            {uploadError && (
              <div className="mx-auto max-w-[810px] w-full mb-4 bg-feedback-error/5 border border-feedback-error/20 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-feedback-error w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-feedback-error">Upload failed</h4>
                  <p className="text-xs text-feedback-error/80 mt-1">{uploadError}</p>
                </div>
              </div>
            )}

            {/* Form wrapper */}
            <div className="mx-auto max-w-[810px] w-full bg-white border border-neutral-border rounded-[28px] p-6 shadow-none flex-1 flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Exam Title input */}
                  <div>
                    <InputField
                      label="Exam Title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (e.target.value.trim()) setTitleError("");
                      }}
                      placeholder="e.g. Science Terminal Assessment - Grade 8"
                      error={titleError}
                    />
                  </div>

                  {/* 1. Question Paper Upload Box */}
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-neutral-primary">Question Paper</span>
                    {!questionPaper ? (
                      <div
                        onClick={() => document.getElementById("question-paper-input")?.click()}
                        className={cn(
                          "h-32 border-2 border-dashed border-black/15 bg-white hover:bg-slate-50/50 hover:border-black/25 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-standard",
                          questionPaperError && "border-feedback-error bg-feedback-error/5"
                        )}
                      >
                        <input
                          type="file"
                          id="question-paper-input"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={handleQuestionPaperChange}
                          className="hidden"
                        />
                        <Upload className="w-6 h-6 text-neutral-secondary mb-1" />
                        <span className="text-sm font-medium text-neutral-primary">
                          Choose a file or drag &amp; drop it here
                        </span>
                        <span className="text-xs text-neutral-secondary mt-0.5">
                          PDF or images (JPEG, PNG, WEBP), up to 10MB
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-neutral-primary">
                            {questionPaper.name}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-secondary">
                            {(questionPaper.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuestionPaper(null)}
                          className="cursor-pointer text-xs font-semibold text-feedback-error border-none bg-transparent"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {questionPaperError && (
                      <p className="text-xs text-feedback-error font-medium">{questionPaperError}</p>
                    )}
                  </div>

                  {/* 2. Handwritten Answer Sheet Upload Box */}
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-neutral-primary">Handwritten Student Answer Sheet</span>
                    {!answerSheet ? (
                      <div
                        onClick={() => document.getElementById("answer-sheet-input")?.click()}
                        className={cn(
                          "h-32 border-2 border-dashed border-black/15 bg-white hover:bg-slate-50/50 hover:border-black/25 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-standard",
                          answerSheetError && "border-feedback-error bg-feedback-error/5"
                        )}
                      >
                        <input
                          type="file"
                          id="answer-sheet-input"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={handleAnswerSheetChange}
                          className="hidden"
                        />
                        <Upload className="w-6 h-6 text-neutral-secondary mb-1" />
                        <span className="text-sm font-medium text-neutral-primary">
                          Choose a file or drag &amp; drop it here
                        </span>
                        <span className="text-xs text-neutral-secondary mt-0.5">
                          PDF or images (JPEG, PNG, WEBP), up to 10MB
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-neutral-primary">
                            {answerSheet.name}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-secondary">
                            {(answerSheet.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAnswerSheet(null)}
                          className="cursor-pointer text-xs font-semibold text-feedback-error border-none bg-transparent"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {answerSheetError && (
                      <p className="text-xs text-feedback-error font-medium">{answerSheetError}</p>
                    )}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-between items-center border-t border-black/5 pt-6 mt-8">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/exams")}
                    className="h-11 rounded-full px-5 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-full px-5 text-sm"
                  >
                    <span>Upload &amp; Configure</span>
                    <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <Footer />
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
