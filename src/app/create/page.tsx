"use client";

import React, { useState, useRef } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  X,
} from "lucide-react";
import { AddQuestionTypeIcon } from "@/components/icons/figma-icons";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { cn } from "@/utils/cn";
import {
  ddMmYyyyToIsoDate,
  formatDueDateInput,
  isoDateToDdMmYyyy,
} from "@/utils/dateInput";
import { Button } from "@/components/ui/Button";
import { assignmentFormSchema, AssignmentFormSchemaType } from "@/schemas/assignment.schema";
import { useAssignmentStore } from "@/store/useAssignmentStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";
import { QuestionTypeRow } from "@/types/assignment.types";
import {
  connectSocket,
  getSocket,
  GENERATION_SOCKET_EVENTS,
  subscribeAssignment,
  unsubscribeAssignment,
} from "@/features/websocket/socket";

function CounterControl({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex h-11 w-[100px] items-center justify-between rounded-2xl border border-black/10 bg-[#f6f6f6] px-2">
      <button
        type="button"
        onClick={onDecrement}
        className="flex h-4 w-4 cursor-pointer items-center justify-center text-[#a9a9a9] hover:text-[#303030] transition-colors select-none font-normal"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="text-[16px] font-normal tracking-[-0.64px] text-[#5e5e5e]">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="flex h-4 w-4 cursor-pointer items-center justify-center text-[#a9a9a9] hover:text-[#303030] transition-colors select-none font-normal"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

function MobileCounterControl({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex h-10 w-full max-w-[120px] items-center justify-between rounded-full bg-white px-3 shadow-none border border-black/5">
      <button
        type="button"
        onClick={onDecrement}
        className="flex h-6 w-6 cursor-pointer items-center justify-center text-[#a9a9a9] hover:text-black font-normal text-sm select-none"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="text-[15px] font-normal tracking-[-0.6px] text-[#5e5e5e]">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="flex h-6 w-6 cursor-pointer items-center justify-center text-[#a9a9a9] hover:text-black font-normal text-sm select-none"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { isLoading, setIsLoading, resetStore } = useAssignmentStore();

  // Stepper messages for visual generation overlay
  const [progress, setProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState<"queued" | "generating" | "completed">("queued");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const steps = [
    "Uploading reference material and parsing context...",
    "Analyzing topics, core concepts, and key definitions...",
    "Synthesizing questions pools based on preferred types...",
    "Calibrating question markings and difficulty distribution...",
    "Performing final academic quality checks...",
  ];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      subject: "",
      gradeClass: "",
      file: null,
      dueDate: "",
      questionTypeRows: [
        { id: "1", type: "Multiple Choice Questions", numQuestions: 4, marksPerQuestion: 1 },
        { id: "2", type: "Short Questions", numQuestions: 3, marksPerQuestion: 2 },
        { id: "3", type: "Diagram/Graph-Based Questions", numQuestions: 5, marksPerQuestion: 5 },
        { id: "4", type: "Numerical Problems", numQuestions: 5, marksPerQuestion: 5 },
      ],
      difficulty: "medium",
      additionalInstructions: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questionTypeRows",
  });

  const watchedRows = useWatch({ control, name: "questionTypeRows" }) || [];
  const watchedDueDate = useWatch({ control, name: "dueDate" }) || "";
  const dueDatePickerRef = useRef<HTMLInputElement>(null);
  const todayIso = new Date().toISOString().slice(0, 10);

  const openDueDatePicker = () => {
    const picker = dueDatePickerRef.current;
    if (!picker) return;
    const iso = ddMmYyyyToIsoDate(watchedDueDate);
    if (iso) picker.value = iso;
    picker.showPicker?.();
  };

  const handleDueDatePicked = (iso: string) => {
    if (!iso) return;
    setValue("dueDate", isoDateToDdMmYyyy(iso), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Calculate real-time summary values exactly mapping Figma math
  const totalQuestions = watchedRows.reduce(
    (sum: number, row: QuestionTypeRow) => sum + (Number(row?.numQuestions) || 0),
    0
  );
  
  const totalMarks = watchedRows.reduce(
    (sum: number, row: QuestionTypeRow) => sum + (Number(row?.numQuestions) || 0) * (Number(row?.marksPerQuestion) || 0),
    0
  );

  // Counter controllers decrement and increment values dynamically
  const handleDecrement = (
    index: number,
    field: "numQuestions" | "marksPerQuestion"
  ) => {
    const currentVal = Number(getValues(`questionTypeRows.${index}.${field}`)) || 0;
    const minVal = field === "numQuestions" ? 1 : 0.5;
    const step = field === "numQuestions" ? 1 : 0.5;
    
    if (currentVal > minVal) {
      setValue(`questionTypeRows.${index}.${field}`, currentVal - step, { shouldValidate: true });
    }
  };

  const handleIncrement = (
    index: number,
    field: "numQuestions" | "marksPerQuestion"
  ) => {
    const currentVal = Number(getValues(`questionTypeRows.${index}.${field}`)) || 0;
    const step = field === "numQuestions" ? 1 : 0.5;
    setValue(`questionTypeRows.${index}.${field}`, currentVal + step, { shouldValidate: true });
  };

  const computedProgressStep =
    isLoading
      ? Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1)
      : 0;

  const onSubmit = async (data: AssignmentFormSchemaType) => {
    setGenerationError(null);
    setGenerationPhase("queued");
    resetStore();
    setIsLoading(true);
    setProgress(0);

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      console.error("NEXT_PUBLIC_API_URL environment variable is not defined.");
      setGenerationError("API Configuration missing. Please set NEXT_PUBLIC_API_URL.");
      setIsLoading(false);
      return;
    }

    const ddmmyyyy = data.dueDate?.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    const normalizedDueDate = ddmmyyyy
      ? `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
      : data.dueDate;

    // Load user preferences dynamically
    const userId = useUserPreferencesStore.getState().userId || localStorage.getItem("vedam_user_id") || "";

    const formData = new FormData();
    formData.append("title", data.title?.trim() || ""); // Backend will generate dynamic title if empty
    formData.append("dueDate", normalizedDueDate);
    formData.append("difficulty", data.difficulty);
    formData.append("userId", userId);
    formData.append("subject", data.subject?.trim() || "");
    formData.append("gradeClass", data.gradeClass?.trim() || "");
    formData.append(
      "questionTypes",
      JSON.stringify(
        data.questionTypeRows.map((row) => ({
          type: row.type,
          numQuestions: row.numQuestions,
          marksPerQuestion: row.marksPerQuestion,
        }))
      )
    );
    if (data.additionalInstructions) {
      formData.append("additionalInstructions", data.additionalInstructions);
    }
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    const socket = getSocket();

    try {
      const res = await fetch(`${apiBase}/api/assignments`, {
        method: "POST",
        body: formData, // No Content-Type header so fetch automatically handles multipart boundary
      });

      const json: {
        success: boolean;
        data?: { assignment?: { id: string } };
        error?: { message?: string };
      } = await res.json();

      if (!res.ok || !json.success || !json.data?.assignment?.id) {
        throw new Error(json.error?.message || "Failed to create assignment");
      }

      const assignmentId = json.data.assignment.id;

      // Start listening for async generation updates.
      connectSocket();
      subscribeAssignment(assignmentId);

      const handleStarted = () => {
        setGenerationPhase("generating");
        setProgress(5);
      };

      const handleProgress = (evt: {
        assignmentId: string;
        progress: number;
      }) => {
        if (evt.assignmentId !== assignmentId) return;
        setProgress(Math.max(0, Math.min(100, evt.progress)));
      };

      const handleCompleted = (evt: { assignmentId: string }) => {
        if (evt.assignmentId !== assignmentId) return;

        unsubscribeAssignment(assignmentId);
        socket.off(GENERATION_SOCKET_EVENTS.STARTED, handleStarted);
        socket.off(GENERATION_SOCKET_EVENTS.PROGRESS, handleProgress);
        socket.off(GENERATION_SOCKET_EVENTS.COMPLETED, handleCompleted);
        socket.off(GENERATION_SOCKET_EVENTS.FAILED, handleFailed);

        setGenerationPhase("completed");
        setProgress(100);
        window.setTimeout(() => {
          setIsLoading(false);
          router.push(`/output?id=${encodeURIComponent(assignmentId)}`);
        }, 400);
      };

      const handleFailed = (evt: {
        assignmentId: string;
        error?: string;
      }) => {
        if (evt.assignmentId !== assignmentId) return;

        unsubscribeAssignment(assignmentId);
        socket.off(GENERATION_SOCKET_EVENTS.STARTED, handleStarted);
        socket.off(GENERATION_SOCKET_EVENTS.PROGRESS, handleProgress);
        socket.off(GENERATION_SOCKET_EVENTS.COMPLETED, handleCompleted);
        socket.off(GENERATION_SOCKET_EVENTS.FAILED, handleFailed);

        setGenerationError(evt.error || "Generation failed");
        setIsLoading(false);
      };

      // Prevent duplicate listener accumulation by cleaning up any previous bindings first
      socket.removeAllListeners(GENERATION_SOCKET_EVENTS.STARTED);
      socket.removeAllListeners(GENERATION_SOCKET_EVENTS.PROGRESS);
      socket.removeAllListeners(GENERATION_SOCKET_EVENTS.COMPLETED);
      socket.removeAllListeners(GENERATION_SOCKET_EVENTS.FAILED);

      socket.on(GENERATION_SOCKET_EVENTS.STARTED, handleStarted);
      socket.on(GENERATION_SOCKET_EVENTS.PROGRESS, handleProgress);
      socket.on(GENERATION_SOCKET_EVENTS.COMPLETED, handleCompleted);
      socket.on(GENERATION_SOCKET_EVENTS.FAILED, handleFailed);
    } catch (err: unknown) {
      let msg = "Request failed";
      if (err instanceof Error) {
        msg = err.message;
        if (msg.includes("MATERIAL_EXTRACTION_FAILED") || msg.toLowerCase().includes("extract")) {
          msg = "Unable to extract readable content from the uploaded PDF.";
        }
      }
      setGenerationError(msg);
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    append({
      id: `row-${Date.now()}`,
      type: "Multiple Choice Questions",
      numQuestions: 5,
      marksPerQuestion: 1,
    });
  };

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar variant="assignments" assignmentCount={0} primaryCta="aiTeacherToolkit" />

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header
          title="Create Assignment"
          variant="assignments"
          backHref="/"
          showMobileProgress
        />

        {/* Dynamic Simulated Loader stepper */}
        {isLoading && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-fill border border-neutral-border rounded-[28px] p-6 max-w-md w-full shadow-sm text-center space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#FA643C] animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-normal text-black">
                    {generationPhase === "queued"
                      ? "Queued for Generation"
                      : generationPhase === "completed"
                        ? "Completed"
                        : "Generating Assessment"}
                  </h3>
                  <p className="text-xs text-neutral-secondary font-normal tracking-wide">
                    STEP {Math.min(computedProgressStep + 1, steps.length)} OF {steps.length}
                  </p>
                </div>
              </div>

              <div className="bg-page-fill rounded-lg p-3 min-h-[60px] flex items-center justify-center border border-neutral-border">
                <p className="text-sm font-normal text-black">
                  {steps[computedProgressStep]}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FA643C] to-[#A7280F] transition-all duration-75 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-normal text-neutral-secondary">
                  <span>{Math.round(progress)}% SECURED</span>
                  <span>EST: 3s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full px-4 pt-2 pb-36 md:px-2 md:pb-6">
          {/* Header block container aligned to match form max-width (810px) */}
          <div className="mx-auto max-w-[810px] w-full">
            {/* Figma 2:9439 — dot vertically centered to title + subtitle (50px block) */}
            <div className="hidden md:flex mb-6 flex-col md:flex-row items-center md:items-center gap-3 rounded-2xl px-2 py-2 no-print">
              <div
                className="hidden md:block size-3 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16),0_0_14px_rgba(16,185,129,0.35)]"
                aria-hidden
              />
              <div className="min-w-0 text-center md:text-left">
                <h2 className="text-[20px] font-bold leading-7 tracking-[-0.8px] text-[#303030]">
                  Create Assignment
                </h2>
                <p className="hidden md:block mt-0.5 text-[14px] font-normal leading-5 tracking-[-0.56px] text-[#5e5e5e]/55">
                  Set up a new assignment for your students
                </p>
              </div>
            </div>

            {/* Step progress indicator (Figma two lines: first is black, other is slight of grey) */}
            <div className="hidden md:flex mb-6 gap-2 w-full no-print items-center">
              <div className="h-[2.5px] flex-1 rounded-full bg-[#4B5563]" />
              <div className="h-[2.5px] flex-1 rounded-full bg-[#E5E7EB]" />
            </div>
          </div>

          {generationError && (
            <div className="mb-4 mx-auto w-full max-w-[810px] rounded-2xl border border-feedback-error/30 bg-feedback-error/5 px-4 py-3">
              <p className="text-sm font-bold text-feedback-error">
                Generation failed
              </p>
              <p className="text-xs font-medium text-feedback-error/80 mt-1">
                {generationError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex max-w-[810px] flex-col gap-6">
            {/* Unified Card Container (matching Figma 100%) */}
            <div className="rounded-[32px] border border-black/10 bg-gradient-to-br from-[#FAFAFA] to-[#F1F1F3] p-5 md:p-8 shadow-none">
              <div className="mb-8">
                <h3 className="text-[20px] font-bold leading-7 tracking-[-0.8px] text-[#303030]">
                  Assignment Details
                </h3>
                <p className="mt-0.5 text-[14px] font-normal leading-5 tracking-[-0.56px] text-[#5e5e5e]/55">
                  Basic information about your assignment
                </p>
              </div>

              <div className="flex flex-col gap-[18px]">
                {/* Figma 2:9456 — file upload with dashed border and whiter background */}
                <Controller
                  name="file"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="w-full">
                      {!value ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => document.getElementById("figma-file-input")?.click()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              document.getElementById("figma-file-input")?.click();
                            }
                          }}
                          className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-black/15 bg-white px-8 pb-6 pt-6 text-center transition-standard hover:bg-slate-50/50 hover:border-black/25"
                        >
                          <input
                            type="file"
                            id="figma-file-input"
                            accept=".pdf,.txt,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files?.[0]) {
                                setSelectedFile(files[0]);
                                onChange({
                                  name: files[0].name,
                                  size: files[0].size,
                                  type: files[0].type || "application/octet-stream",
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <span className="mb-4 flex h-10 w-10 items-center justify-center text-[#303030]">
                            <svg
                              className="h-10 w-10"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden
                            >
                              <g clipPath="url(#clip0_2_9459)">
                                <path
                                  d="M7.99996 16L12 12L16 16M12 12V21M20.39 18.39C21.3653 17.8583 22.1358 17.0169 22.5798 15.9986C23.0239 14.9804 23.1162 13.8432 22.8422 12.7667C22.5682 11.6901 21.9434 10.7355 21.0666 10.0534C20.1898 9.37137 19.1108 9.00072 18 8.99998H16.74C16.4373 7.82923 15.8731 6.74232 15.0899 5.82098C14.3067 4.89964 13.3248 4.16783 12.2181 3.68059C11.1113 3.19335 9.90851 2.96334 8.70008 3.00787C7.49164 3.05239 6.30903 3.37028 5.24114 3.93765C4.17325 4.50501 3.24787 5.30709 2.53458 6.28357C1.82129 7.26004 1.33865 8.38552 1.12294 9.57538C0.90723 10.7652 0.964065 11.9885 1.28917 13.1532C1.61428 14.318 2.1992 15.3938 2.99996 16.3"
                                  stroke="#1E1E1E"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_2_9459">
                                  <rect width="24" height="24" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          </span>
                          <p className="text-[16px] font-normal leading-[22px] tracking-[-0.64px] text-[#303030]">
                            Choose a file or drag &amp; drop it here
                          </p>
                          <p className="mt-1 text-[14px] font-normal leading-5 tracking-[-0.56px] text-[#5e5e5e]/55">
                            JPEG, PNG, upto 10MB
                          </p>
                          <span className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-black/10 bg-[#ebebeb] px-5 text-[14px] font-bold tracking-[-0.56px] text-[#303030] hover:bg-[#e0e0e0] transition-standard">
                            Browse Files
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
                          <div className="min-w-0">
                            <p className="truncate text-[16px] font-medium tracking-[-0.64px] text-[#303030]">
                              {value.name}
                            </p>
                            <p className="mt-0.5 text-[14px] tracking-[-0.56px] text-[#5e5e5e]/55">
                              {(value.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              onChange(null);
                            }}
                            className="cursor-pointer text-[14px] font-medium text-[#c53535]"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      <p className="mt-2 w-full text-center text-[16px] font-normal leading-[22px] tracking-[-0.64px] text-[#5e5e5e]/80">
                        Upload images of your preferred document/image
                      </p>
                    </div>
                  )}
                />

                {/* Figma 2:9465 — Due Date */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="due-date"
                    className="text-[16px] font-bold leading-[22px] tracking-[-0.64px] text-[#303030]"
                  >
                    Due Date
                  </label>
                  <div className="relative">
                    <Controller
                      name="dueDate"
                      control={control}
                      render={({ field }) => (
                        <input
                          id="due-date"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="DD-MM-YYYY"
                          maxLength={10}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(formatDueDateInput(e.target.value))
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className={cn(
                            "h-11 w-full rounded-2xl border border-black/10 bg-[#f6f6f6] px-4 pr-12 text-[16px] font-normal tracking-[-0.64px] text-[#5e5e5e] placeholder:text-[#5e5e5e]/40",
                            "focus:outline-none focus:ring-2 focus:ring-black/5",
                            errors.dueDate && "border-[#c53535]"
                          )}
                        />
                      )}
                    />
                    <input
                      ref={dueDatePickerRef}
                      type="date"
                      min={todayIso}
                      tabIndex={-1}
                      aria-hidden
                      className="pointer-events-none absolute h-0 w-0 opacity-0"
                      onChange={(e) => handleDueDatePicked(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={openDueDatePicker}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#303030] transition-colors hover:bg-black/5"
                      aria-label="Open calendar"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#303030]">
                          <path fillRule="evenodd" clipRule="evenodd" d="M2 8C2 5.23858 4.23858 3 7 3H17C19.7614 3 22 5.23858 22 8V17C22 19.7614 19.7614 22 17 22H7C4.23858 22 2 19.7614 2 17V8ZM7 5C5.34315 5 4 6.34315 4 8V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V8C20 6.34315 18.6569 5 17 5H7Z" fill="currentColor"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M8 2C8.55228 2 9 2.44772 9 3V6C9 6.55228 8.55228 7 8 7C7.44772 7 7 6.55228 7 6V3C7 2.44772 7.44772 2 8 2Z" fill="currentColor"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M16 2C16.5523 2 17 2.44772 17 3V6C17 6.55228 16.5523 7 16 7C15.4477 7 15 6.55228 15 6V3C15 2.44772 15.4477 2 16 2Z" fill="currentColor"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 9C12.5523 9 13 9.44772 13 10V12H15C15.5523 12 16 12.4477 16 13C16 13.5523 15.5523 14 15 14H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16L11 14H9C8.44772 14 8 13.5523 8 13C8 12.4477 8.44772 12 9 12H11V10C11 9.44772 11.4477 9 12 9Z" fill="currentColor"/>
                        </svg>
                    </button>
                  </div>
                  {errors.dueDate && (
                    <p className="text-[14px] font-medium text-[#c53535]">{errors.dueDate.message?.toString()}</p>
                  )}
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="subject"
                    className="text-[16px] font-bold leading-[22px] tracking-[-0.64px] text-[#303030]"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="e.g. Science, Mathematics, Physics"
                    {...register("subject")}
                    className={cn(
                      "h-11 w-full rounded-2xl border border-black/10 bg-[#f6f6f6] px-4 text-[16px] font-normal tracking-[-0.64px] text-[#5e5e5e] placeholder:text-[#5e5e5e]/40 focus:outline-none focus:ring-2 focus:ring-black/5",
                      errors.subject && "border-[#c53535]"
                    )}
                  />
                  {errors.subject && (
                    <p className="text-[14px] font-medium text-[#c53535]">{errors.subject.message?.toString()}</p>
                  )}
                </div>

                {/* Grade / Class */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="gradeClass"
                    className="text-[16px] font-bold leading-[22px] tracking-[-0.64px] text-[#303030]"
                  >
                    Grade / Class
                  </label>
                  <input
                    id="gradeClass"
                    type="text"
                    placeholder="e.g. Class 8, Grade 10, 11th Standard"
                    {...register("gradeClass")}
                    className={cn(
                      "h-11 w-full rounded-2xl border border-black/10 bg-[#f6f6f6] px-4 text-[16px] font-normal tracking-[-0.64px] text-[#5e5e5e] placeholder:text-[#5e5e5e]/40 focus:outline-none focus:ring-2 focus:ring-black/5",
                      errors.gradeClass && "border-[#c53535]"
                    )}
                  />
                  {errors.gradeClass && (
                    <p className="text-[14px] font-medium text-[#c53535]">{errors.gradeClass.message?.toString()}</p>
                  )}
                </div>



                {/* Figma 2:9471 — Question types grid (Responsive Switch) */}
                <div className="w-full">
                  {/* Mobile Layout (Clean Figma list grid - exact replication of node 19-678) */}
                  <div className="lg:hidden flex flex-col">
                    <p className="text-[16px] font-bold leading-[22px] tracking-[-0.64px] text-[#303030] mb-3">
                      Question Type
                    </p>
                    <div className="flex flex-col gap-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="bg-white border border-black/10 rounded-[24px] p-5 shadow-sm space-y-4">
                          {/* Top row: Select box + X button */}
                          <div className="flex items-center justify-between">
                            <div className="relative min-w-0 flex-1">
                              <select
                                className="cursor-pointer appearance-none border-0 bg-transparent pr-8 text-[16px] font-medium tracking-[-0.64px] text-[#303030] focus:outline-none w-full"
                                {...register(`questionTypeRows.${index}.type` as const)}
                              >
                                <option value="Multiple Choice Questions">Multiple Choice Questions</option>
                                <option value="Short Questions">Short Questions</option>
                                <option value="Diagram/Graph-Based Questions">Diagram/Graph-Based Questions</option>
                                <option value="Numerical Problems">Numerical Problems</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-[#303030]/65" />
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="ml-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-black/60 hover:bg-[#f6f6f6] hover:text-[#c53535] transition-standard"
                              aria-label="Remove question type"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Inner grey panel with side-by-side counters */}
                          <div className="rounded-[20px] bg-[#F1F1F3] p-4 flex gap-4 items-stretch">
                            {/* Column 1: No. of Questions */}
                            <div className="flex-1 flex flex-col items-center gap-2">
                              <span className="text-[14px] font-normal tracking-[-0.56px] text-[#5e5e5e]/80 text-center">
                                No. of Questions
                              </span>
                              <div className="mt-auto w-full flex justify-center">
                                <MobileCounterControl
                                  value={Number(watchedRows?.[index]?.numQuestions) || 0}
                                  onDecrement={() => handleDecrement(index, "numQuestions")}
                                  onIncrement={() => handleIncrement(index, "numQuestions")}
                                />
                              </div>
                            </div>

                            {/* Column 2: Marks */}
                            <div className="flex-1 flex flex-col items-center gap-2">
                              <span className="text-[14px] font-normal tracking-[-0.56px] text-[#5e5e5e]/80 text-center">
                                Marks
                              </span>
                              <div className="mt-auto w-full flex justify-center">
                                <MobileCounterControl
                                  value={Number(watchedRows?.[index]?.marksPerQuestion) || 0}
                                  onDecrement={() => handleDecrement(index, "marksPerQuestion")}
                                  onIncrement={() => handleIncrement(index, "marksPerQuestion")}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex h-9 cursor-pointer items-center gap-2 text-[14px] font-semibold leading-5 tracking-[-0.56px] text-[#303030] pt-4"
                    >
                      <AddQuestionTypeIcon />
                      Add Question Type
                    </button>
                  </div>

                  {/* Desktop Layout (Double-column Grid) */}
                  <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_275px] gap-6">
                    <div className="flex flex-col gap-4">
                      <p className="text-[16px] font-bold leading-[22px] tracking-[-0.64px] text-[#303030]">
                        Question Type
                      </p>
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3">
                          <div className="relative min-w-0 flex-1">
                            <select
                              className="h-11 w-full appearance-none rounded-2xl border border-black/10 bg-[#f6f6f6] py-2.5 pl-4 pr-10 text-[16px] font-medium tracking-[-0.64px] text-[#303030] focus:outline-none"
                              {...register(`questionTypeRows.${index}.type` as const)}
                            >
                              <option value="Multiple Choice Questions">Multiple Choice Questions</option>
                              <option value="Short Questions">Short Questions</option>
                              <option value="Diagram/Graph-Based Questions">Diagram/Graph-Based Questions</option>
                              <option value="Numerical Problems">Numerical Problems</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#303030]" />
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-[#303030] hover:bg-[#f6f6f6]"
                            aria-label="Remove question type"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 text-[14px] font-semibold leading-5 tracking-[-0.56px] text-[#303030]"
                      >
                        <AddQuestionTypeIcon />
                        Add Question Type
                      </button>
                    </div>

                    <div className="flex gap-11 lg:gap-[43px]">
                      <div className="flex flex-col gap-4">
                        <p className="text-[16px] font-normal leading-[22px] tracking-[-0.64px] text-[#303030]">
                          No. of Questions
                        </p>
                        {fields.map((field, index) => (
                          <CounterControl
                            key={`q-${field.id}`}
                            value={Number(watchedRows?.[index]?.numQuestions) || 0}
                            onDecrement={() => handleDecrement(index, "numQuestions")}
                            onIncrement={() => handleIncrement(index, "numQuestions")}
                          />
                        ))}
                      </div>
                      <div className="flex flex-col gap-4">
                        <p className="text-[16px] font-normal leading-[22px] tracking-[-0.64px] text-[#303030]">
                          Marks
                        </p>
                        {fields.map((field, index) => (
                          <CounterControl
                            key={`m-${field.id}`}
                            value={Number(watchedRows?.[index]?.marksPerQuestion) || 0}
                            onDecrement={() => handleDecrement(index, "marksPerQuestion")}
                            onIncrement={() => handleIncrement(index, "marksPerQuestion")}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <div className="text-right text-[14px] font-normal leading-[18px] tracking-[-0.56px] text-[#303030]">
                    <p>Total Questions : {totalQuestions}</p>
                    <p className="mt-2">Total Marks : {totalMarks}</p>
                  </div>
                </div>

                {/* Panel 3: Additional Information (For better output) - Hidden on mobile */}
                <div className="hidden md:block flex flex-col gap-2 pt-2">
                  <label
                    htmlFor="additional-info"
                    className="text-[16px] font-bold leading-[22px] tracking-[-0.64px] text-[#303030]"
                  >
                    Additional Information (For better output)
                  </label>
                  <div className="relative">
                    <textarea
                      id="additional-info"
                      placeholder="e.g Generate a question paper for 3 hour exam duration..."
                      className="min-h-[102px] w-full resize-none rounded-2xl border border-black/10 bg-[#f6f6f6] p-4 pr-14 text-[14px] font-normal leading-5 tracking-[-0.56px] text-[#303030] placeholder:text-[#5e5e5e]/55 focus:outline-none"
                      {...register("additionalInstructions")}
                    />
                    <button
                      type="button"
                      className="absolute bottom-1 right-1 cursor-pointer"
                      aria-label="Voice input"
                    >
                      <svg width="73" height="63" viewBox="0 0 73 63" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20.1816" y="10.6364" width="36" height="36" rx="18" fill="#F0F0F0"/>
                        <g filter="url(#filter0_dd_2_9547)">
                          <path fillRule="evenodd" clipRule="evenodd" d="M34.7725 24.5455C34.7725 23.0393 35.9935 21.8182 37.4998 21.8182H38.8634C40.3696 21.8182 41.5907 23.0393 41.5907 24.5455V28.6364C41.5907 30.1427 40.3696 31.3637 38.8634 31.3637H37.4998C35.9935 31.3637 34.7725 30.1427 34.7725 28.6364V24.5455ZM33.4089 27.2728C33.7854 27.2728 34.0907 27.578 34.0907 27.9546V28.6364C34.0907 30.5192 35.617 32.0455 37.4998 32.0455H38.1816H38.8634C40.7462 32.0455 42.2725 30.5192 42.2725 28.6364V27.9546C42.2725 27.578 42.5778 27.2728 42.9543 27.2728C43.3309 27.2728 43.6361 27.578 43.6361 27.9546V28.6364C43.6361 31.2723 41.4993 33.4091 38.8634 33.4091V34.7728C38.8634 35.1493 38.5582 35.4546 38.1816 35.4546C37.805 35.4546 37.4998 35.1493 37.4998 34.7728L37.4998 33.4091C34.8639 33.4091 32.7271 31.2723 32.7271 28.6364V27.9546C32.7271 27.578 33.0323 27.2728 33.4089 27.2728Z" fill="#303030"/>
                        </g>
                        <defs>
                          <filter id="filter0_dd_2_9547" x="-2.72727" y="-1.36359" width="81.8183" height="92.7273" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                            <feOffset dy="21.8182"/>
                            <feGaussianBlur stdDeviation="16.3636"/>
                            <feComposite in2="hardAlpha" operator="out"/>
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2_9547"/>
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                            <feOffset dy="10.9091"/>
                            <feGaussianBlur stdDeviation="16.3636"/>
                            <feComposite in2="hardAlpha" operator="out"/>
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                            <feBlend mode="normal" in2="effect1_dropShadow_2_9547" result="effect2_dropShadow_2_9547"/>
                            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_2_9547" result="shape"/>
                          </filter>
                        </defs>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop footer actions */}
            <div className="hidden items-center justify-between md:flex">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex h-[46px] w-[106px] justify-center cursor-pointer items-center gap-1 rounded-full border border-black/10 bg-white text-[16px] font-medium tracking-[-0.64px] text-[#303030] transition-standard hover:bg-[#f6f6f6] px-0"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span>Previous</span>
              </button>

              <Button
                type="submit"
                className="flex h-[46px] w-[106px] justify-center items-center gap-1 rounded-full bg-[#272727] text-[16px] font-medium tracking-[-0.64px] shadow-none hover:bg-[#1c1c1c] text-white px-0"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </div>

            {/* Mobile Actions Container: static flow at the bottom of the page, scrolling with content */}
            <div className="md:hidden flex items-center justify-center gap-3 mt-8 mb-32 z-30 no-print">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center gap-1 h-[46px] w-[106px] rounded-full border border-black/10 bg-white text-[#303030] text-[14px] font-semibold shadow-sm transition-standard hover:bg-slate-50 cursor-pointer px-0"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Previous</span>
              </button>

              <button
                type="submit"
                className="inline-flex h-[46px] w-[106px] cursor-pointer items-center justify-center gap-1 rounded-full bg-[#272727] text-[14px] font-semibold tracking-[-0.64px] text-white transition-standard hover:bg-[#1c1c1c] shadow-sm px-0"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

          </form>
        </div>
        
        <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
