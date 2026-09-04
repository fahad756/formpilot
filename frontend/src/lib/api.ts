/**
 * Type-safe API client for the FormPilot backend.
 *
 * Every method attaches the current Supabase session token automatically.
 * Throws an ApiClientError on non-2xx responses so callers can differentiate
 * API errors from network errors without inspecting response.ok themselves.
 *
 * Usage:
 *   const client = new ApiClient(supabaseAccessToken);
 *   const profile = await client.getProfile();
 */

import type {
  JobApplication,
  JobApplicationCreate,
  Profile,
  ProfileUpdate,
  ResumeItem,
  UserInfo,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string
  ) {
    super(detail);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  private readonly headers: HeadersInit;

  constructor(accessToken: string) {
    this.headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...this.headers, ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiClientError(res.status, body.detail ?? "Unknown error");
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  getMe() {
    return this.request<UserInfo>("/auth/me");
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile() {
    return this.request<Profile>("/profile");
  }

  updateProfile(data: ProfileUpdate) {
    return this.request<Profile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ── Resumes ───────────────────────────────────────────────────────────────
  listResumes() {
    return this.request<ResumeItem[]>("/resumes");
  }

  uploadResume(file: File, setAsPrimary = false) {
    const form = new FormData();
    form.append("file", file);
    form.append("set_as_primary", String(setAsPrimary));
    // Remove Content-Type so browser sets multipart boundary automatically
    const { "Content-Type": _, ...headersWithoutCT } = this.headers as Record<string, string>;
    return fetch(`${BASE_URL}/resumes`, {
      method: "POST",
      headers: headersWithoutCT,
      body: form,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new ApiClientError(res.status, body.detail);
      }
      return res.json() as Promise<ResumeItem>;
    });
  }

  deleteResume(id: string) {
    return this.request<void>(`/resumes/${id}`, { method: "DELETE" });
  }

  setPrimaryResume(id: string) {
    return this.request<{ message: string }>(`/resumes/${id}/primary`, { method: "POST" });
  }

  // ── Applications ──────────────────────────────────────────────────────────
  listApplications(params?: { page?: number; page_size?: number; status?: string }) {
    const query = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    );
    const qs = query.toString() ? `?${query}` : "";
    return this.request<JobApplication[]>(`/applications${qs}`);
  }

  logApplication(data: JobApplicationCreate) {
    return this.request<JobApplication>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateApplicationStatus(id: string, status: string) {
    return this.request<JobApplication>(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  deleteApplication(id: string) {
    return this.request<void>(`/applications/${id}`, { method: "DELETE" });
  }
}
