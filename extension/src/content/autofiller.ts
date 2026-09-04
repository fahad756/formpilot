/**
 * Autofiller — injects profile values into detected form fields.
 *
 * React, Vue, and Angular apps intercept input events via their own event
 * systems. Simply setting element.value does NOT trigger their state updates.
 * We must dispatch both `input` and `change` events after setting the value
 * so the framework picks up the change and validates it normally.
 *
 * For select elements we find the closest matching option by value or text.
 * For file inputs we cannot programmatically set files (browser security
 * restriction) — we skip those and note the download URL in the sidebar instead.
 */

export interface FillResult {
  filled: number;
  skipped: string[];
}

function setNativeValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  // Bypass React's synthetic event system by using the native descriptor
  const nativeInput = Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value"
  );
  if (nativeInput?.set) {
    nativeInput.set.call(el, value);
  } else {
    el.value = value;
  }
}

function dispatchChangeEvents(el: HTMLElement): void {
  ["input", "change", "blur"].forEach((type) => {
    el.dispatchEvent(new Event(type, { bubbles: true }));
  });
}

function fillInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
): boolean {
  if (el.disabled || el.readOnly) return false;
  setNativeValue(el, value);
  dispatchChangeEvents(el);
  return true;
}

function fillSelect(el: HTMLSelectElement, value: string): boolean {
  // Try matching by value first, then by visible text
  const norm = value.toLowerCase();
  for (const option of Array.from(el.options)) {
    if (
      option.value.toLowerCase() === norm ||
      option.text.toLowerCase().includes(norm)
    ) {
      el.value = option.value;
      dispatchChangeEvents(el);
      return true;
    }
  }
  return false;
}

/**
 * Fill a map of {rawIdentifier: value} into the form.
 *
 * The fill map comes from the backend's /autofill/resolve endpoint and
 * uses the same identifiers that form-detector.ts extracted.
 */
export function applyFillMap(
  formContainer: HTMLElement,
  fillMap: Record<string, string>
): FillResult {
  const skipped: string[] = [];
  let filled = 0;

  const inputs = Array.from(
    formContainer.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='file']), textarea, select"
    )
  );

  for (const input of inputs) {
    // Find the identifier we used when scanning this field
    const labelEl = input.id
      ? document.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`)
      : input.closest("label");
    const labelText = labelEl?.textContent?.trim() ?? "";
    const aria = input.getAttribute("aria-label") ?? "";
    const placeholder = (input as HTMLInputElement).placeholder ?? "";
    const candidates = [labelText, aria, placeholder, input.name, input.id].filter(Boolean);

    let matched = false;
    for (const candidate of candidates) {
      if (fillMap[candidate] !== undefined) {
        if (input instanceof HTMLSelectElement) {
          matched = fillSelect(input, fillMap[candidate]);
        } else {
          matched = fillInput(input as HTMLInputElement | HTMLTextAreaElement, fillMap[candidate]);
        }
        if (matched) {
          filled++;
          break;
        }
      }
    }
    if (!matched && candidates.length > 0) {
      // Don't report every unfilled field — only ones in the map
      const anyInMap = candidates.some((c) => fillMap[c] !== undefined);
      if (anyInMap) skipped.push(candidates[0]);
    }
  }

  return { filled, skipped };
}
