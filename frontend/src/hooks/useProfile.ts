/**
 * useProfile — fetch and mutate the current user's profile.
 *
 * Built on TanStack Query for automatic caching, background refetch,
 * and stale-while-revalidate behaviour. The mutation invalidates the
 * query cache so the UI reflects the update immediately.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import type { Profile, ProfileUpdate } from "@/types";

const QUERY_KEY = ["profile"];

export function useProfile(accessToken: string | null) {
  const qc = useQueryClient();

  const query = useQuery<Profile>({
    queryKey: QUERY_KEY,
    queryFn: () => new ApiClient(accessToken!).getProfile(),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,  // consider profile fresh for 5 minutes
  });

  const mutation = useMutation({
    mutationFn: (data: ProfileUpdate) =>
      new ApiClient(accessToken!).updateProfile(data),
    onSuccess: (updated) => {
      // Optimistically update cache before refetch
      qc.setQueryData<Profile>(QUERY_KEY, updated);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
