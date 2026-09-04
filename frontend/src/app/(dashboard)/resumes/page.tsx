"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useResumes } from "@/hooks/useResumes";
import { getAccessToken } from "@/lib/auth";
import { UploadDropzone } from "@/components/resumes/UploadDropzone";
import { ResumeCard } from "@/components/resumes/ResumeCard";
import { FileText } from "lucide-react";

export default function ResumesPage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(setToken);
  }, [user]);

  const { resumes, isLoading, upload, isUploading, remove, setPrimary } =
    useResumes(token);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text-base">Resumes</h1>
        <p className="text-text-muted mt-1 text-sm">
          Upload multiple versions. Mark one as Primary — that's what FormPilot
          will attach when filling forms.
        </p>
      </div>

      <UploadDropzone onUpload={upload} isUploading={isUploading} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-border/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
            <FileText className="w-7 h-7 text-primary-400" />
          </div>
          <div>
            <p className="font-semibold text-text-base">No resumes uploaded yet</p>
            <p className="text-sm text-text-muted mt-1">
              Upload your first resume above to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={remove}
              onSetPrimary={setPrimary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
