/**
 * Auth helpers — Google OAuth sign-in/out flow via Supabase.
 *
 * These are thin wrappers around supabase.auth so UI components don't import
 * supabase directly and don't need to know the OAuth provider details.
 */

import { supabase } from "./supabase";

const DASHBOARD_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/dashboard`
    : "http://localhost:3000/dashboard";

/**
 * Redirect the user to Google's OAuth consent screen.
 * On success, Supabase redirects back to /auth/callback which exchanges
 * the code for a session and then navigates to the dashboard.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Return the current session's access token, or null if not authenticated. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
