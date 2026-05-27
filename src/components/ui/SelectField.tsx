import React, { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, helperText, required, className, id, options, children, ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="flex flex-col space-y-1.5 w-full relative">
        <label
          htmlFor={selectId}
          className="text-base font-semibold text-neutral-primary flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-feedback-error ml-1">*</span>}
          </span>
        </label>
        
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              cn(
                error ? errorId : undefined,
                helperText ? helperId : undefined
              ) || undefined
            }
            className={cn(
              "h-11 px-3.5 pr-10 w-full bg-surface-fill border border-neutral-border text-neutral-primary rounded-2xl text-sm transition-standard appearance-none cursor-pointer",
              "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none",
              error && "border-feedback-error focus:border-feedback-error focus:ring-feedback-error/20",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          
          {/* Custom SVG Chevron Arrow positioned perfectly inside the input */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-secondary">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        
        {helperText && !error && (
          <p id={helperId} className="text-sm text-neutral-500">
            {helperText}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-sm text-feedback-error font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";
