/**
 * Floating trigger UI — the "Use FormPilot" button that appears when a form
 * is detected. Non-intrusive: positioned at the bottom-right, styled to be
 * visible but not obstructive.
 *
 * The button opens the sidebar panel (injected as an iframe) on click.
 * It removes itself if the user dismisses the sidebar and no longer wants it.
 *
 * Only one trigger button exists at a time — calling showTrigger() while one
 * already exists will update its position rather than create a duplicate.
 */

let triggerEl: HTMLElement | null = null;

export function showTrigger(onOpen: () => void): void {
  if (triggerEl) {
    // Already visible — just re-attach the handler in case the form changed
    triggerEl.onclick = (e) => { e.stopPropagation(); onOpen(); };
    return;
  }

  triggerEl = document.createElement("div");
  triggerEl.id = "formpilot-trigger";
  triggerEl.innerHTML = `
    <button aria-label="Open FormPilot autofill panel" title="Fill this form with FormPilot">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span>FormPilot</span>
    </button>
  `;

  Object.assign(triggerEl.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483646",
    fontFamily: "system-ui, -apple-system, sans-serif",
  });

  const btn = triggerEl.querySelector("button")!;
  Object.assign(btn.style, {
    display:        "flex",
    alignItems:     "center",
    gap:            "8px",
    padding:        "10px 16px",
    background:     "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color:          "#fff",
    border:         "none",
    borderRadius:   "999px",
    fontSize:       "13px",
    fontWeight:     "600",
    cursor:         "pointer",
    boxShadow:      "0 4px 20px rgba(99,102,241,0.45)",
    transition:     "transform 0.15s ease, box-shadow 0.15s ease",
    userSelect:     "none",
  });

  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "scale(1.05)";
    btn.style.boxShadow = "0 6px 28px rgba(99,102,241,0.6)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "";
    btn.style.boxShadow = "0 4px 20px rgba(99,102,241,0.45)";
  });

  triggerEl.onclick = (e) => { e.stopPropagation(); onOpen(); };
  document.body.appendChild(triggerEl);
}

export function hideTrigger(): void {
  triggerEl?.remove();
  triggerEl = null;
}
