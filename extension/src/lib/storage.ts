/**
 * Chrome storage helpers — typed wrappers around chrome.storage.local.
 *
 * We use local (not sync) storage because:
 *   - Tokens are sensitive and shouldn't sync across devices
 *   - Profile cache can be large (sync has a 100KB limit)
 *
 * All operations are async/Promise-based for consistency with the rest of
 * the codebase. Errors are caught and returned as null so callers don't
 * need try/catch for the common "item not found" case.
 */

export interface StoredAuth {
  access_token: string;
  user_id: string;
  email?: string;
}

export interface StoredProfile {
  [key: string]: string | number | undefined;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getStoredAuth(): Promise<StoredAuth | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get("auth", (result) => {
      resolve(result.auth ?? null);
    });
  });
}

export async function setStoredAuth(auth: StoredAuth): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ auth }, resolve);
  });
}

export async function clearStoredAuth(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove("auth", resolve);
  });
}

// ─── Profile cache ────────────────────────────────────────────────────────────

export async function getStoredProfile(): Promise<StoredProfile | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get("profile_cache", (result) => {
      resolve(result.profile_cache ?? null);
    });
  });
}

export async function setStoredProfile(profile: StoredProfile): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ profile_cache: profile }, resolve);
  });
}

// ─── Primary resume ID ────────────────────────────────────────────────────────

export async function getStoredPrimaryResumeId(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get("primary_resume_id", (result) => {
      resolve(result.primary_resume_id ?? null);
    });
  });
}

export async function setStoredPrimaryResumeId(id: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ primary_resume_id: id }, resolve);
  });
}
