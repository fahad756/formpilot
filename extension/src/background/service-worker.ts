/**
 * FormPilot background service worker (Manifest V3).
 */

import { handleIncomingToken } from "../lib/auth";
import { resolveAutofill, logApplication } from "../lib/api";
import { getStoredAuth } from "../lib/storage";

const DASHBOARD_URL = "http://localhost:3000";

// ─── API-based session sync ───────────────────────────────────────────────────
// Fetches the session token from the dashboard's /api/extension-token endpoint.
// This is the most reliable approach — no cookie parsing, no content scripts.

async function syncSessionFromAPI(): Promise<boolean> {
  try {
    const res = await fetch(`${DASHBOARD_URL}/api/extension-token`, {
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.access_token || !data.user_id) return false;
    await handleIncomingToken({
      access_token: data.access_token,
      user_id: data.user_id,
      email: data.email,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Message types ─────────────────────────────────────────────────────────

type ExtensionMessage =
  | { type: "AUTH_TOKEN"; access_token: string; user_id: string; email?: string }
  | { type: "RESOLVE_AUTOFILL"; field_identifiers: string[] }
  | { type: "LOG_APPLICATION"; job_url: string; company_name?: string; job_title?: string; resume_id?: string }
  | { type: "GET_AUTH" }
  | { type: "SYNC_SESSION" };

// ─── Message handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case "AUTH_TOKEN": {
            await handleIncomingToken(message);
            sendResponse({ ok: true });
            break;
          }

          case "GET_AUTH": {
            const auth = await getStoredAuth();
            sendResponse({ auth });
            break;
          }

          // Popup calls this when it opens and finds no stored token
          case "SYNC_SESSION": {
            const ok = await syncSessionFromAPI();
            if (ok) {
              const auth = await getStoredAuth();
              sendResponse({ ok: true, auth });
            } else {
              sendResponse({ ok: false });
            }
            break;
          }

          case "RESOLVE_AUTOFILL": {
            const auth = await getStoredAuth();
            if (!auth) { sendResponse({ error: "NOT_AUTHENTICATED" }); break; }
            const payload = await resolveAutofill(auth.access_token, message.field_identifiers);
            sendResponse({ payload });
            break;
          }

          case "LOG_APPLICATION": {
            const auth = await getStoredAuth();
            if (!auth) break;
            await logApplication(auth.access_token, {
              job_url: message.job_url,
              company_name: message.company_name,
              job_title: message.job_title,
              resume_id: message.resume_id,
            });
            sendResponse({ ok: true });
            break;
          }

          default:
            sendResponse({ error: "UNKNOWN_MESSAGE_TYPE" });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        sendResponse({ error: msg });
      }
    })();
    return true;
  }
);

// On install / update, try to sync immediately
chrome.runtime.onInstalled.addListener(() => {
  syncSessionFromAPI();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    chrome.tabs.sendMessage(tabId, { type: "PAGE_LOADED" }).catch(() => {});
  }
});
