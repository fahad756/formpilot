/**
 * Dashboard bridge — content script running ONLY on localhost:3000.
 *
 * @supabase/ssr stores sessions in cookies (not localStorage) so the
 * Next.js server can also read the session. This script reads those cookies
 * and forwards the access token to the background service worker.
 *
 * Cookie key format:  sb-<project-ref>-auth-token
 * May be chunked:     sb-<ref>-auth-token.0, .1, ... for large sessions
 */

const PROJECT_REF = "jvsdritjiyteowcpnsdj";
const BASE_KEY = `sb-${PROJECT_REF}-auth-token`;

interface ParsedSession {
  access_token?: string;
  user?: { id?: string; email?: string };
}

// ── Cookie reader ─────────────────────────────────────────────────────────────

function getCookieValue(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function readSessionFromCookies(): ParsedSession | null {
  // Try exact key first
  let raw = getCookieValue(BASE_KEY);

  // Try chunked format: .0 + .1 + ...
  if (!raw) {
    let combined = "";
    for (let i = 0; i < 10; i++) {
      const chunk = getCookieValue(`${BASE_KEY}.${i}`);
      if (!chunk) break;
      combined += chunk;
    }
    if (combined) raw = combined;
  }

  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedSession;
  } catch {
    return null;
  }
}

// ── localStorage fallback (some Supabase configs still use it) ────────────────

function readSessionFromStorage(): ParsedSession | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as ParsedSession;
    } catch {
      // skip
    }
  }
  return null;
}

// ── Main sync ─────────────────────────────────────────────────────────────────

function syncToExtension(): void {
  const session = readSessionFromCookies() ?? readSessionFromStorage();
  const token = session?.access_token;
  const userId = session?.user?.id;

  if (!token || !userId) return;

  chrome.runtime.sendMessage({
    type: "AUTH_TOKEN",
    access_token: token,
    user_id: userId,
    email: session?.user?.email,
  }).catch(() => {
    // Background worker not awake — safe to ignore
  });
}

// Run on page load
syncToExtension();

// Re-run after a short delay (Supabase writes cookies slightly after load)
setTimeout(syncToExtension, 1000);
setTimeout(syncToExtension, 3000);

// Watch for cookie/storage changes (login / logout)
window.addEventListener("storage", syncToExtension);

// Poll every 5 seconds while on the dashboard (catches token refresh)
setInterval(syncToExtension, 5000);
