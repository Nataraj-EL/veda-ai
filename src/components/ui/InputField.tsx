import React, { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, required, className, id, type = "text", ...props }, ref) => {
    // Generate a default ID if none provided to ensure robust accessibility relationships
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        <label
          htmlFor={inputId}
          className="text-base font-semibold text-neutral-primary flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-feedback-error ml-1">*</span>}
          </span>
        </label>
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            cn(
              error ? errorId : undefined,
              helperText ? helperId : undefined
            ) || undefined
          }
          className={cn(
            "h-11 px-3.5 w-full bg-surface-fill border border-neutral-border text-neutral-primary rounded-2xl text-sm transition-standard",
            "placeholder-neutral-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none",
            error && "border-feedback-error focus:border-feedback-error focus:ring-feedback-error/20",
            className
          )}
          {...props}
        />
        
        {/* Helper text display for contextual guidelines */}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-neutral-500">
            {helperText}
          </p>
        )}
        
        {/* Error notification display */}
        {error && (
          <p id={errorId} className="text-sm text-feedback-error font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
