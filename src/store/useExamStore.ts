import { create } from "zustand";
import { Exam } from "../types/exam.types";

interface ExamState {
  exams: Exam[];
  currentExam: Exam | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadError: string | null;

  // Actions
  fetchExams: (userId: string) => Promise<void>;
  fetchExamById: (id: string, userId: string) => Promise<void>;
  createExam: (formData: FormData, userId: string) => Promise<Exam>;
  deleteExam: (id: string, userId: string) => Promise<void>;
  updateExam: (id: string, userId: string, update: Partial<Exam>) => Promise<Exam>;
  resetStore: () => void;
  clearUploadError: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  exams: [],
  currentExam: null,
  isLoading: false,
  isUploading: false,
  uploadError: null,

  fetchExams: async (userId: string) => {
    set({ isLoading: true });
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiBase}/api/exams?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const result = await res.json();
        set({ exams: result.data?.exams || result.exams || [] });
      } else {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || "Failed to fetch exams");
      }
    } catch (error: any) {
      console.error("Failed to fetch exams:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExamById: async (id: string, userId: string) => {
    set({ isLoading: true });
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiBase}/api/exams/${id}`,
        {
          headers: {
            "x-user-id": userId,
          },
        }
      );
      if (res.ok) {
        const result = await res.json();
        set({ currentExam: result.data?.exam || result.exam || null });
      } else {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || "Failed to fetch exam details");
      }
    } catch (error: any) {
      console.error("Failed to fetch exam details:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  createExam: async (formData: FormData, userId: string) => {
    set({ isUploading: true, uploadError: null });
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiBase}/api/exams?userId=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        const result = await res.json();
        const newExam = result.data?.exam || result.exam;
        set((state) => ({
          exams: [newExam, ...state.exams],
          isUploading: false,
        }));
        return newExam;
      } else {
        const errorData = await res.json();
        const errorMsg = errorData?.error?.message || "Failed to upload exam";
        set({ uploadError: errorMsg, isUploading: false });
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      set({ uploadError: error.message || "Failed to upload exam", isUploading: false });
      throw error;
    }
  },

  deleteExam: async (id: string, userId: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiBase}/api/exams/${id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": userId,
          },
        }
      );

      if (res.ok) {
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
          currentExam: state.currentExam?.id === id ? null : state.currentExam,
        }));
      } else {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || "Failed to delete exam");
      }
    } catch (error: any) {
      console.error("Failed to delete exam:", error);
      throw error;
    }
  },

  updateExam: async (id: string, userId: string, update: Partial<Exam>) => {
    const oldExam = get().currentExam;
    const oldExamsList = get().exams;
    
    // Optimistically update local state immediately
    set((state) => {
      const current = state.currentExam;
      let nextCurrent = current;
      if (current && current.id === id) {
        nextCurrent = { ...current, ...update };
      }
      return {
        exams: state.exams.map((e) => (e.id === id ? { ...e, ...update } : e)),
        currentExam: nextCurrent,
      };
    });

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiBase}/api/exams/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify(update),
        }
      );

      if (res.ok) {
        const result = await res.json();
        const updatedExam = result.data?.exam || result.exam;
        set((state) => ({
          exams: state.exams.map((e) => (e.id === id ? updatedExam : e)),
          currentExam: state.currentExam?.id === id ? updatedExam : state.currentExam,
        }));
        return updatedExam;
      } else {
        // Rollback on server error
        set({ exams: oldExamsList, currentExam: oldExam });
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || "Failed to update exam");
      }
    } catch (error: any) {
      // Rollback on request failure
      set({ exams: oldExamsList, currentExam: oldExam });
      console.error("Failed to update exam:", error);
      throw error;
    }
  },

  clearUploadError: () => set({ uploadError: null }),

  resetStore: () =>
    set({
      exams: [],
      currentExam: null,
      isLoading: false,
      isUploading: false,
      uploadError: null,
    }),
}));
