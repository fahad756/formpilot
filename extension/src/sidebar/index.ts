/**
 * Sidebar panel script — runs inside the FormPilot sidebar iframe.
 *
 * State machine:
 *   loading → (auth check) → auth_required | (form fields arrive) → ready | no_form
 *
 * The sidebar communicates UP to the content script via window.parent.postMessage.
 * It communicates with the background service worker via chrome.runtime.sendMessage
 * (available in extension iframes).
 */

import "./styles.css";
import { listResumes, setPrimaryResume } from "../lib/api";
import { getStoredAuth } from "../lib/storage";
import type { ResumeItem } from "../lib/api";

// ─── DOM refs ────────────────────────────────────────────────────────────────
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const stateLoading    = $("fp-state-loading");
const stateAuth       = $("fp-state-auth");
const stateReady      = $("fp-state-ready");
const stateNoForm     = $("fp-state-no-form");
const closeBtn        = $<HTMLButtonElement>("fp-close-btn");
const fillBtn         = $<HTMLButtonElement>("fp-fill-btn");
const deepScanBtn     = $<HTMLButtonElement>("fp-deep-scan-btn");
const openDashBtn     = $<HTMLButtonElement>("fp-open-dashboard-btn");
const resumeList      = $("fp-resume-list");
const fieldCount      = $("fp-field-count");
const fillResult      = $("fp-fill-result");
const resultText      = $("fp-result-text");
const completionBar   = $("fp-completion-bar");
const completionFill  = $("fp-completion-fill");
const completionPct   = $("fp-completion-pct");
const scanningSpinner = $("fp-scanning");

// ─── State ───────────────────────────────────────────────────────────────────
let accessToken: string | null = null;
let selectedResumeId: string | null = null;
let pendingFieldIdentifiers: string[] = [];
let pendingFillMap: Record<string, string> = {};

// ─── State switcher ─────────────────────────────────────────────────────────
type UIState = "loading" | "auth" | "ready" | "no-form";
function showState(state: UIState): void {
  [stateLoading, stateAuth, stateReady, stateNoForm].forEach((el) =>
    el.classList.add("fp-hidden")
  );
  const map: Record<UIState, HTMLElement> = {
    loading: stateLoading,
    auth: stateAuth,
    ready: stateReady,
    "no-form": stateNoForm,
  };
  map[state].classList.remove("fp-hidden");
}

// ─── Resume list rendering ───────────────────────────────────────────────────
function renderResumes(resumes: ResumeItem[]): void {
  if (resumes.length === 0) {
    resumeList.innerHTML = '<p class="fp-muted-sm">No resumes found. Upload one in the dashboard.</p>';
    return;
  }

  resumeList.innerHTML = resumes
    .map(
      (r) => `
    <div class="fp-resume-item ${r.is_primary || r.id === selectedResumeId ? "fp-selected" : ""}"
         data-id="${r.id}">
      <div class="fp-resume-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/>
        </svg>
      </div>
      <span class="fp-resume-name">${r.name}</span>
      ${r.is_primary ? '<span class="fp-primary-badge">Primary</span>' : ""}
    </div>
  `
    )
    .join("");

  // Set default selected to primary
  if (!selectedResumeId) {
    const primary = resumes.find((r) => r.is_primary);
    selectedResumeId = primary?.id ?? resumes[0]?.id ?? null;
  }

  // Click to select
  resumeList.querySelectorAll<HTMLElement>(".fp-resume-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const id = item.dataset.id!;
      selectedResumeId = id;
      resumeList.querySelectorAll(".fp-resume-item").forEach((el) =>
        el.classList.toggle("fp-selected", el === item)
      );
      // Persist primary selection to the backend
      if (accessToken) {
        await setPrimaryResume(accessToken, id).catch(() => {});
      }
    });
  });
}

// ─── Load resumes ────────────────────────────────────────────────────────────
async function loadResumes(): Promise<void> {
  if (!accessToken) return;
  try {
    const resumes = await listResumes(accessToken);
    renderResumes(resumes);
  } catch {
    resumeList.innerHTML = '<p class="fp-muted-sm">Could not load resumes.</p>';
  }
}

// ─── Apply fill ───────────────────────────────────────────────────────────────
async function triggerFill(): Promise<void> {
  if (!pendingFieldIdentifiers.length) return;

  fillBtn.disabled = true;
  fillBtn.textContent = "Filling…";

  // Ask background to resolve the fill map if we don't have it yet
  if (Object.keys(pendingFillMap).length === 0) {
    const response = await chrome.runtime.sendMessage({
      type: "RESOLVE_AUTOFILL",
      field_identifiers: pendingFieldIdentifiers,
    });
    if (response.error) {
      fillBtn.disabled = false;
      fillBtn.textContent = "Autofill This Form";
      return;
    }
    pendingFillMap = response.payload.fill_map;
  }

  // Send fill map down to content script
  window.parent.postMessage(
    {
      type: "APPLY_FILL",
      fill_map: pendingFillMap,
      resume_id: selectedResumeId,
    },
    "*"
  );
}

// ─── Event listeners ────────────────────────────────────────────────────────
closeBtn.addEventListener("click", () => {
  window.parent.postMessage({ type: "CLOSE_SIDEBAR" }, "*");
});

fillBtn.addEventListener("click", triggerFill);

deepScanBtn.addEventListener("click", () => {
  scanningSpinner.classList.remove("fp-hidden");
  deepScanBtn.disabled = true;
  window.parent.postMessage({ type: "DEEP_SCAN" }, "*");
});

openDashBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000" });
});

// ─── Messages from content script ────────────────────────────────────────────
window.addEventListener("message", async (event) => {
  const msg = event.data as { type: string; [k: string]: unknown };

  if (msg.type === "FORM_FIELDS") {
    const identifiers = msg.identifiers as string[];
    pendingFieldIdentifiers = identifiers;
    fieldCount.textContent = `${identifiers.length} field${identifiers.length !== 1 ? "s" : ""} detected`;

    // Pre-resolve the fill map immediately
    if (accessToken) {
      const response = await chrome.runtime.sendMessage({
        type: "RESOLVE_AUTOFILL",
        field_identifiers: identifiers,
      });
      if (!response.error) {
        const payload = response.payload;
        pendingFillMap = payload.fill_map;

        // Profile completion
        if (payload.profile_completion !== undefined) {
          const pct = payload.profile_completion as number;
          completionBar.classList.remove("fp-hidden");
          completionFill.style.width = `${pct}%`;
          completionPct.textContent = `${pct}%`;
        }
      }
    }

    const filledCount = Object.keys(pendingFillMap).length;
    fillBtn.disabled = filledCount === 0;
    fieldCount.textContent = `${identifiers.length} detected · ${filledCount} can be filled`;
  }

  if (msg.type === "FILL_RESULT") {
    fillBtn.textContent = "Autofill This Form";
    fillBtn.disabled = false;
    fillResult.classList.remove("fp-hidden");
    const filled = msg.filled as number;
    resultText.textContent = `Filled ${filled} field${filled !== 1 ? "s" : ""} successfully.`;
  }

  if (msg.type === "DEEP_SCAN_RESULT") {
    scanningSpinner.classList.add("fp-hidden");
    deepScanBtn.disabled = false;
    if (msg.hasForm) {
      showState("ready");
      window.parent.postMessage({ type: "SIDEBAR_READY" }, "*");
    } else {
      const noFormText = stateNoForm.querySelector(".fp-state-sub")!;
      noFormText.textContent =
        "Deep scan complete — no application form found on this page.";
    }
  }
});

// ─── Init ────────────────────────────────────────────────────────────────────
(async () => {
  showState("loading");

  const auth = await getStoredAuth();
  if (!auth) {
    showState("auth");
    return;
  }
  accessToken = auth.access_token;

  // Check if the content script has already detected a form
  window.parent.postMessage({ type: "SIDEBAR_READY" }, "*");

  // Show ready state — form fields will arrive via FORM_FIELDS message
  // If no fields arrive within 1s, show no-form
  showState("ready");
  await loadResumes();

  setTimeout(() => {
    if (pendingFieldIdentifiers.length === 0) {
      showState("no-form");
    }
  }, 1200);
})();
