import React from "react";
import { cn } from "@/utils/cn";

export interface FormSectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  className,
  children,
}) => {
  return (
    <section className={cn(
      "bg-surface-fill border border-neutral-border rounded-[28px] p-6 shadow-sm print-card",
      className
    )}>
      {/* Header section with structured titles */}
      <div className="border-b border-neutral-border pb-3 mb-4">
        <h2 className="text-lg font-bold text-neutral-primary tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-neutral-secondary mt-1">
            {description}
          </p>
        )}
      </div>
      
      {/* Content wrapper with clean spacings */}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
};
