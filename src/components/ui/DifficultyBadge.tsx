import React from "react";
import { cn } from "@/utils/cn";
import { DifficultyPreference } from "@/types/assignment.types";

export interface DifficultyBadgeProps {
  difficulty: DifficultyPreference;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  className,
}) => {
  // Map difficulty level to standard high-contrast, accessible academic outline styles
  const styles = {
    easy: "bg-emerald-50 text-feedback-success border-emerald-200",
    medium: "bg-amber-50 text-feedback-warning border-amber-200",
    hard: "bg-red-50 text-feedback-error border-red-200",
  };

  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-standard select-none capitalize",
        styles[difficulty],
        className
      )}
    >
      {label}
    </span>
  );
};
