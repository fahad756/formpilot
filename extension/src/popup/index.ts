import { getStoredAuth, clearStoredAuth } from "../lib/storage";

const DASHBOARD_URL = "http://localhost:3000";
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const loadingEl     = $("loading");
const signedOutView = $("view-signed-out");
const signedInView  = $("view-signed-in");
const userEmailEl   = $("user-email");
const btnSignIn     = $<HTMLButtonElement>("btn-sign-in");
const btnSignOut    = $<HTMLButtonElement>("btn-sign-out");
const actionDash    = $("action-dashboard");
const actionProfile = $("action-profile");
const actionResumes = $("action-resumes");

function showView(view: "loading" | "signed-out" | "signed-in"): void {
  loadingEl.classList.toggle("hidden", view !== "loading");
  signedOutView.classList.toggle("hidden", view !== "signed-out");
  signedInView.classList.toggle("hidden", view !== "signed-in");
}

function showSignedIn(email?: string, userId?: string): void {
  userEmailEl.textContent = email ?? (userId ? userId.slice(0, 8) + "…" : "Unknown");
  showView("signed-in");
}

// ─── Init — check storage, then try to sync from dashboard cookies ────────────
(async () => {
  showView("loading");

  // 1. Check if we already have a stored token
  let auth = await getStoredAuth();
  if (auth) { showSignedIn(auth.email, auth.user_id); return; }

  // 2. Ask background to pull session from localhost:3000 cookies
  try {
    const response = await chrome.runtime.sendMessage({ type: "SYNC_SESSION" });
    if (response?.ok && response.auth) {
      showSignedIn(response.auth.email, response.auth.user_id);
      return;
    }
  } catch {
    // background may not respond — fall through
  }

  showView("signed-out");
})();

// ─── Sign in button — open dashboard ─────────────────────────────────────────
btnSignIn.addEventListener("click", () => {
  chrome.tabs.create({ url: `${DASHBOARD_URL}` });
  window.close();
});

// ─── Sign out ─────────────────────────────────────────────────────────────────
btnSignOut.addEventListener("click", async () => {
  await clearStoredAuth();
  showView("signed-out");
});

// ─── Dashboard links ──────────────────────────────────────────────────────────
actionDash.addEventListener("click",    () => { chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` }); window.close(); });
actionProfile.addEventListener("click", () => { chrome.tabs.create({ url: `${DASHBOARD_URL}/profile` });   window.close(); });
actionResumes.addEventListener("click", () => { chrome.tabs.create({ url: `${DASHBOARD_URL}/resumes` });   window.close(); });
