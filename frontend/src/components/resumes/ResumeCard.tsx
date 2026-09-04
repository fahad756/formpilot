"use client";

import { formatDistanceToNow } from "date-fns";
import { Download, FileText, Star, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import type { ResumeItem } from "@/types";

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ResumeCardProps {
  resume: ResumeItem;
  onDelete: (id: string) => Promise<unknown>;
  onSetPrimary: (id: string) => Promise<unknown>;
}

export function ResumeCard({ resume, onDelete, onSetPrimary }: ResumeCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-4 bg-surface border rounded-2xl px-5 py-4 shadow-card transition-shadow hover:shadow-card-hover",
        resume.is_primary ? "border-primary-200 bg-primary-50/30" : "border-border"
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          resume.is_primary ? "bg-primary-100" : "bg-muted"
        )}
      >
        <FileText
          className={clsx("w-5 h-5", resume.is_primary ? "text-primary-500" : "text-text-muted")}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-base truncate">{resume.name}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {formatFileSize(resume.file_size)}
          {resume.created_at && (
            <> · {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}</>
          )}
        </p>
      </div>

      {/* Primary badge */}
      {resume.is_primary && (
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 fill-current" />
          Primary
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!resume.is_primary && (
          <button
            onClick={() => onSetPrimary(resume.id)}
            title="Set as primary"
            className="p-2 rounded-xl text-text-muted hover:text-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
        {resume.download_url && (
          <a
            href={resume.download_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Download"
            className="p-2 rounded-xl text-text-muted hover:text-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => onDelete(resume.id)}
          title="Delete"
          className="p-2 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
