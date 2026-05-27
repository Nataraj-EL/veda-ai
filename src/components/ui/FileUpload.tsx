import React, { useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { FileMetadata } from "@/types/assignment.types";

export interface FileUploadProps {
  label: string;
  value?: FileMetadata | null;
  onChange: (file: FileMetadata | null) => void;
  error?: string;
  helperText?: string;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  accept = ".pdf,.txt",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper utility to format byte sizes into readable KB/MB
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onChange({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Basic extension check
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      const acceptedExts = accept.split(",").map(x => x.trim().toLowerCase());
      
      if (acceptedExts.includes(ext)) {
        onChange({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
        });
      } else {
        alert(`Only files matching ${accept} are allowed.`);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      <span className="text-sm font-semibold text-neutral-primary">{label}</span>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {!value ? (
        <div
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "h-40 border-2 border-dashed border-neutral-border hover:border-brand-primary rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-standard bg-surface-fill file-upload-drag",
            isDragging && "border-brand-primary bg-brand-light/30",
            error && "border-feedback-error bg-feedback-error/5 hover:border-feedback-error"
          )}
        >
          <Upload className="w-8 h-8 text-neutral-secondary mb-2" />
          <span className="text-sm font-medium text-neutral-primary">
            Drag and drop or <span className="text-brand-primary underline">click to upload</span>
          </span>
          <span className="text-xs text-neutral-secondary mt-1">
            Accepts PDF or TXT reference texts (optional)
          </span>
        </div>
      ) : (
        <div className="border border-neutral-border rounded-2xl p-4 bg-surface-fill flex items-center justify-between shadow-none">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-brand-light rounded-lg text-brand-primary flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-primary truncate">
                {value.name}
              </p>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-neutral-secondary">
                  {formatBytes(value.size)}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-feedback-success space-x-1">
                  <CheckCircle className="w-2.5 h-2.5" />
                  <span>Ready</span>
                </span>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 hover:bg-neutral-border rounded-lg text-neutral-secondary hover:text-neutral-primary transition-standard no-print"
            title="Remove File"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {helperText && !error && (
        <p className="text-xs text-neutral-secondary">{helperText}</p>
      )}

      {error && (
        <p className="text-xs text-feedback-error font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
