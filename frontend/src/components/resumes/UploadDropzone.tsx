"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

interface UploadDropzoneProps {
  onUpload: (args: { file: File; primary: boolean }) => Promise<unknown>;
  isUploading: boolean;
}

export function UploadDropzone({ onUpload, isUploading }: UploadDropzoneProps) {
  const [queued, setQueued] = useState<File | null>(null);
  const [setPrimary, setSetPrimary] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setQueued(accepted[0]);
      setUploaded(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!queued) return;
    await onUpload({ file: queued, primary: setPrimary });
    setQueued(null);
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary-400 bg-primary-50"
            : "border-border hover:border-primary-300 hover:bg-primary-50/40"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploaded ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          ) : (
            <Upload className={clsx("w-10 h-10", isDragActive ? "text-primary-500" : "text-text-muted")} />
          )}
          <div>
            <p className="text-sm font-medium text-text-base">
              {uploaded
                ? "Resume uploaded!"
                : queued
                ? queued.name
                : isDragActive
                ? "Drop it here"
                : "Drop your resume here or click to browse"}
            </p>
            <p className="text-xs text-text-muted mt-1">PDF, DOC, or DOCX · Max 10 MB</p>
          </div>
        </div>
      </div>

      {queued && !uploaded && (
        <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-2xl px-5 py-3.5">
          <label className="flex items-center gap-2.5 text-sm text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={setPrimary}
              onChange={(e) => setSetPrimary(e.target.checked)}
              className="w-4 h-4 rounded accent-primary-500"
            />
            Set as Primary resume
          </label>
          <Button onClick={handleUpload} loading={isUploading} size="sm">
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
