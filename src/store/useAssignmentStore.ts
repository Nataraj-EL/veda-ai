import { create } from "zustand";
import { AssignmentFormData, GeneratedAssignment } from "../types/assignment.types";

interface AssignmentState {
  formData: AssignmentFormData | null;
  isLoading: boolean;
  generatedAssignment: GeneratedAssignment | null;
  
  // Actions
  setFormData: (data: AssignmentFormData) => void;
  setIsLoading: (isLoading: boolean) => void;
  setGeneratedAssignment: (assignment: GeneratedAssignment | null) => void;
  resetStore: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  formData: null,
  isLoading: false,
  generatedAssignment: null,

  setFormData: (formData) => set({ formData }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setGeneratedAssignment: (generatedAssignment) => set({ generatedAssignment }),
  
  resetStore: () => set({
    formData: null,
    isLoading: false,
    generatedAssignment: null,
  }),
}));
