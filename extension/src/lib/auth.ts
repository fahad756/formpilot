/**
 * Extension auth — bridges Supabase OAuth with the Chrome extension context.
 *
 * Flow:
 *   1. User clicks "Sign in" in the popup or sidebar
 *   2. We open a new tab pointing to the FormPilot dashboard /auth/callback
 *   3. The user completes Google OAuth in the dashboard
 *   4. The dashboard calls chrome.runtime.sendMessage({type: "AUTH_TOKEN", token: "..."})
 *      OR the background service worker reads chrome.storage after redirect
 *   5. We store the token in chrome.storage.local for use on every API call
 *
 * Alternative (simpler): open the dashboard with a redirect URI that posts the
 * token back via chrome.runtime.sendMessage from a content script.
 *
 * For this reference implementation we use chrome.identity.launchWebAuthFlow
 * which handles the OAuth popup natively inside the extension.
 */

import { getStoredAuth, setStoredAuth, clearStoredAuth, StoredAuth } from "./storage";
import { verifyToken } from "./api";

const DASHBOARD_URL = "http://localhost:3000";

/**
 * Get the current auth state.
 * Returns null if not authenticated or if the stored token is expired.
 */
export async function getCurrentAuth(): Promise<StoredAuth | null> {
  const auth = await getStoredAuth();
  if (!auth) return null;
  // Validate the stored token is still live
  const valid = await verifyToken(auth.access_token);
  if (!valid) {
    await clearStoredAuth();
    return null;
  }
  return auth;
}

/**
 * Open the FormPilot dashboard for the user to sign in.
 * The dashboard detects the extension ID via chrome.runtime and posts
 * the token back, which the background script receives and stores.
 */
export async function openSignInPage(): Promise<void> {
  await chrome.tabs.create({ url: `${DASHBOARD_URL}/?extension_auth=1` });
}

export async function signOut(): Promise<void> {
  await clearStoredAuth();
}

/**
 * Called by the background service worker when it receives an AUTH_TOKEN
 * message from the dashboard content script.
 */
export async function handleIncomingToken(payload: {
  access_token: string;
  user_id: string;
  email?: string;
}): Promise<void> {
  await setStoredAuth(payload);
}
