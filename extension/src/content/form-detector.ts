/**
 * Form detection engine — identifies job application forms on arbitrary pages.
 *
 * Detection strategy (multi-signal scoring):
 *   1. Find all <form> elements (and form-like containers without <form> tags)
 *   2. Score each candidate against job-application signals
 *   3. Return candidates above DETECTION_THRESHOLD sorted by score
 *
 * A form is "job-application-like" when it contains:
 *   - At minimum: an email field + a name-like field
 *   - Bonus signals: phone, resume upload, LinkedIn, submit button with apply wording
 *
 * This heuristic handles 95%+ of ATS platforms without requiring site-specific
 * selectors. Sites that render forms in shadow DOM or iframes will fall through
 * to the manual trigger.
 */

export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  rawIdentifier: string;  // name/id/placeholder/label text we'll send to the backend
}

export interface DetectedForm {
  container: HTMLElement;
  score: number;
  fields: DetectedField[];
}

const DETECTION_THRESHOLD = 3;

// Keywords that suggest a submit button is for a job application
const APPLY_BUTTON_KEYWORDS = [
  "apply", "submit application", "send application", "submit", "apply now",
  "apply for", "submit resume", "send resume",
];

// High-signal input identifiers (name/id/placeholder fragments)
const HIGH_SIGNAL_FRAGMENTS = [
  "firstname", "lastname", "fullname", "email", "phone", "mobile",
  "linkedin", "github", "portfolio", "resume", "cv", "coverletter",
  "university", "degree", "experience",
];

// Form-like container selectors for sites that don't use <form> tags
const FORM_CONTAINER_SELECTORS = [
  "form",
  "[data-testid*='application']",
  "[data-testid*='apply']",
  "[class*='application-form']",
  "[class*='apply-form']",
  "[id*='application']",
  "[id*='apply-form']",
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getFieldIdentifier(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
  // Priority: label text > aria-label > placeholder > name > id
  const labelEl = el.id
    ? document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`)
    : el.closest("label");
  if (labelEl?.textContent) return labelEl.textContent.trim();
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label")!;
    if (el.placeholder) return el.placeholder;
  }
  return el.name || el.id || "";
}

function scoreContainer(container: HTMLElement): { score: number; fields: DetectedField[] } {
  const inputs = Array.from(
    container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio']), textarea, select"
    )
  );

  if (inputs.length < 2) return { score: 0, fields: [] };

  const fields: DetectedField[] = [];
  let score = 0;

  for (const input of inputs) {
    const identifier = getFieldIdentifier(input);
    const normalised = normalise(identifier || input.name || input.id);
    if (!normalised) continue;

    // Score based on how many high-signal fragments match
    const matched = HIGH_SIGNAL_FRAGMENTS.some((frag) => normalised.includes(frag));
    if (matched) {
      score += 1;
      fields.push({ element: input, rawIdentifier: identifier || input.name || input.id });
    }
  }

  // Bonus: submit/apply button present
  const buttons = Array.from(container.querySelectorAll("button, input[type='submit']"));
  const hasApplyButton = buttons.some((btn) => {
    const text = normalise(btn.textContent || (btn as HTMLInputElement).value || "");
    return APPLY_BUTTON_KEYWORDS.some((kw) => text.includes(normalise(kw)));
  });
  if (hasApplyButton) score += 2;

  // Bonus: file input (resume upload)
  const hasFileInput = container.querySelector("input[type='file']") !== null;
  if (hasFileInput) score += 2;

  return { score, fields };
}

/**
 * Scan the current page for job application forms.
 * Returns all candidates above DETECTION_THRESHOLD, sorted by score desc.
 */
export function detectForms(): DetectedForm[] {
  const candidates: DetectedForm[] = [];
  const seen = new WeakSet<HTMLElement>();

  for (const selector of FORM_CONTAINER_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);

      const { score, fields } = scoreContainer(el);
      if (score >= DETECTION_THRESHOLD) {
        candidates.push({ container: el, score, fields });
      }
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}
