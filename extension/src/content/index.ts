/**
 * Content script entry point — orchestrates form detection, trigger UI,
 * and sidebar communication.
 *
 * Lifecycle:
 *   1. Run on document_idle (DOM ready, scripts loaded)
 *   2. Detect job application forms
 *   3. If found: show the floating trigger button
 *   4. On trigger click: open the sidebar iframe
 *   5. Sidebar requests autofill → background → API → sidebar receives fill map
 *   6. Sidebar tells content script to apply the fill map to the form
 *   7. Log the application event to the backend
 *
 * Communication:
 *   Content ↔ Sidebar:  window.postMessage (cross-frame)
 *   Content ↔ Background: chrome.runtime.sendMessage
 */

import "./content.css";  // extracted by MiniCssExtractPlugin → dist/content.css
import { detectForms, type DetectedForm } from "./form-detector";
import { showTrigger, hideTrigger } from "./trigger-ui";
import { applyFillMap } from "./autofiller";

let activeForm: DetectedForm | null = null;
let sidebarFrame: HTMLIFrameElement | null = null;
let sidebarOpen = false;

// ─── Sidebar iframe ────────────────────────────────────────────────────────────

function openSidebar(): void {
  if (sidebarOpen) return;
  sidebarOpen = true;

  sidebarFrame = document.createElement("iframe");
  sidebarFrame.src = chrome.runtime.getURL("sidebar.html");
  sidebarFrame.id = "formpilot-sidebar";

  Object.assign(sidebarFrame.style, {
    position:      "fixed",
    top:           "0",
    right:         "0",
    width:         "360px",
    height:        "100vh",
    zIndex:        "2147483647",
    border:        "none",
    borderLeft:    "1px solid #e2e8f0",
    boxShadow:     "-8px 0 32px rgba(0,0,0,0.12)",
    transform:     "translateX(100%)",
    transition:    "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    background:    "#fff",
  });

  document.body.appendChild(sidebarFrame);

  // Animate in after next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (sidebarFrame) sidebarFrame.style.transform = "translateX(0)";
    });
  });
}

function closeSidebar(): void {
  if (!sidebarFrame) return;
  sidebarFrame.style.transform = "translateX(100%)";
  sidebarOpen = false;
  setTimeout(() => {
    sidebarFrame?.remove();
    sidebarFrame = null;
  }, 300);
}

// ─── Message bridge between sidebar iframe and extension ──────────────────────

window.addEventListener("message", async (event) => {
  // Only accept messages from our own extension
  if (event.source !== sidebarFrame?.contentWindow) return;

  const msg = event.data as {
    type: string;
    [key: string]: unknown;
  };

  switch (msg.type) {
    case "SIDEBAR_READY": {
      // Send form field identifiers to the sidebar so it can request autofill
      if (!activeForm) return;
      const identifiers = activeForm.fields.map((f) => f.rawIdentifier);
      sidebarFrame?.contentWindow?.postMessage(
        { type: "FORM_FIELDS", identifiers },
        "*"
      );
      break;
    }

    case "APPLY_FILL": {
      const fillMap = msg.fill_map as Record<string, string>;
      if (!activeForm) return;
      const result = applyFillMap(activeForm.container, fillMap);
      sidebarFrame?.contentWindow?.postMessage(
        { type: "FILL_RESULT", filled: result.filled, skipped: result.skipped },
        "*"
      );

      // Log the application event
      chrome.runtime.sendMessage({
        type: "LOG_APPLICATION",
        job_url: window.location.href,
        company_name: document.title || undefined,
        resume_id: msg.resume_id as string | undefined,
      });
      break;
    }

    case "CLOSE_SIDEBAR":
      closeSidebar();
      break;

    case "DEEP_SCAN": {
      // Manual trigger: re-run detection with lower threshold
      const forms = detectForms();
      const hasForm = forms.length > 0;
      sidebarFrame?.contentWindow?.postMessage(
        { type: "DEEP_SCAN_RESULT", hasForm },
        "*"
      );
      if (hasForm) activeForm = forms[0];
      break;
    }
  }
});

// ─── Init ──────────────────────────────────────────────────────────────────────

function init(): void {
  const forms = detectForms();
  if (forms.length > 0) {
    activeForm = forms[0];
    showTrigger(() => openSidebar());
  }
}

// Run immediately on document_idle
init();

// Re-run when background signals page has fully loaded (SPAs)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "PAGE_LOADED") {
    hideTrigger();
    closeSidebar();
    activeForm = null;
    setTimeout(init, 800); // small delay to let SPA render
  }
});
