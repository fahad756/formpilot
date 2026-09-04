/**
 * Shared TypeScript types for the FormPilot dashboard.
 *
 * These mirror the Pydantic models on the backend. Keep them in sync when
 * adding or renaming profile fields. Types are exported individually so
 * consumers can import only what they need.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  current_title?: string;
  years_experience?: number;
  current_company?: string;
  degree?: string;
  major?: string;
  university?: string;
  graduation_year?: number;
  gpa?: string;
  cover_letter_template?: string;
  salary_expectation?: string;
  availability?: string;
  created_at?: string;
  updated_at?: string;
}

export type ProfileUpdate = Omit<Profile, "id" | "created_at" | "updated_at">;

// ─── Resumes ─────────────────────────────────────────────────────────────────

export interface ResumeItem {
  id: string;
  name: string;
  file_size?: number;
  mime_type?: string;
  is_primary: boolean;
  created_at?: string;
  download_url?: string;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export interface JobApplication {
  id: string;
  user_id: string;
  company_name?: string;
  job_title?: string;
  job_url: string;
  status: ApplicationStatus;
  resume_id?: string;
  applied_at?: string;
  notes?: string;
}

export interface JobApplicationCreate {
  job_url: string;
  company_name?: string;
  job_title?: string;
  resume_id?: string;
  notes?: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export type LoadingState = "idle" | "loading" | "success" | "error";
