/**
 * useResumes — list, upload, delete, and set-primary resume operations.
 *
 * Each mutation invalidates the resume list query so the UI stays current.
 * Upload progress is not tracked here — use the uploadResume mutation's
 * onMutate/onSettled callbacks if you need a progress bar.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import type { ResumeItem } from "@/types";

const QUERY_KEY = ["resumes"];

export function useResumes(accessToken: string | null) {
  const qc = useQueryClient();
  const client = () => new ApiClient(accessToken!);

  const query = useQuery<ResumeItem[]>({
    queryKey: QUERY_KEY,
    queryFn: () => client().listResumes(),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 2,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, primary }: { file: File; primary: boolean }) =>
      client().uploadResume(file, primary),
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client().deleteResume(id),
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => client().setPrimaryResume(id),
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    resumes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    setPrimary: setPrimaryMutation.mutateAsync,
    isSettingPrimary: setPrimaryMutation.isPending,
  };
}
