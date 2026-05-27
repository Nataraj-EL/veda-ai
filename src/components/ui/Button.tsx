import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = "primary", isLoading, disabled, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center h-11 px-5 rounded-2xl text-sm font-semibold transition-standard cursor-pointer select-none",
          "focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Primary button styles
          variant === "primary" && [
            "bg-brand-primary text-white border border-transparent shadow-none",
            "hover:bg-brand-hover active:bg-brand-hover/90",
          ],
          // Secondary/Outline button styles
          variant === "secondary" && [
            "bg-surface-fill text-neutral-primary border border-neutral-border shadow-none",
            "hover:bg-neutral-border hover:border-neutral-border-active active:bg-neutral-border/85",
          ],
          // Danger button styles (useful for clear or reset)
          variant === "danger" && [
            "bg-feedback-error text-white border border-transparent shadow-none",
            "hover:bg-feedback-error/90 active:bg-feedback-error/85",
          ],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            {/* Clean CSS Loading Spinner */}
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Processing...</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
