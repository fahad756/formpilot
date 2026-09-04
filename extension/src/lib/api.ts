/**
 * Extension API client — mirrors frontend/src/lib/api.ts but runs in the
 * extension context (background service worker or content script).
 *
 * The base URL points to the local dev server by default. In a production
 * build, replace with the deployed backend URL via a build-time constant or
 * by reading it from chrome.storage if you want it user-configurable.
 */

const BASE_URL = "http://localhost:8001/api/v1";

export interface AutofillPayload {
  fill_map: Record<string, string>;
  primary_resume: {
    id: string;
    name: string;
    download_url?: string;
    is_primary: boolean;
  } | null;
  profile_completion: number;
}

export interface ResumeItem {
  id: string;
  name: string;
  is_primary: boolean;
  download_url?: string;
  file_size?: number;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Unknown error");
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await request("/auth/verify", token, { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

export async function resolveAutofill(
  token: string,
  fieldIdentifiers: string[]
): Promise<AutofillPayload> {
  return request("/autofill/resolve", token, {
    method: "POST",
    body: JSON.stringify({ field_identifiers: fieldIdentifiers }),
  });
}

export async function listResumes(token: string): Promise<ResumeItem[]> {
  return request("/resumes", token);
}

export async function setPrimaryResume(token: string, id: string): Promise<void> {
  return request(`/resumes/${id}/primary`, token, { method: "POST" });
}

export async function logApplication(
  token: string,
  data: { job_url: string; company_name?: string; job_title?: string; resume_id?: string }
): Promise<void> {
  return request("/applications", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
