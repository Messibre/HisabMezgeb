/**
 * Accessibility utility functions for Hisab Mezgeb.
 * Includes live region announcements, haptics, and form error focusing.
 */

/**
  * Announces a message to assistive technology using an aria-live region.
  * @param message Text to announce
  * @param priority 'polite' (default) or 'assertive'
  */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  const announcerId = priority === 'assertive' ? 'global-sr-assertive' : 'global-sr-polite';
  let announcer = document.getElementById(announcerId);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = announcerId;
    announcer.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }

  // Clear previous message to ensure screen readers announce duplicate strings
  announcer.textContent = '';
  // Set the message after a microtask tick
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 50);
}

/**
 * Triggers a subtle tactile haptic vibration (10ms) on supported mobile devices.
 * Respects navigator.vibrate availability.
 */
export function triggerHaptic(durationMs = 10): void {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore errors on devices where vibration is disabled or not allowed
    }
  }
}

/**
 * Finds the first invalid field in a form or container, scrolls it into view,
 * and moves keyboard focus to it.
 * @param container Optional container or form element (defaults to document)
 * @returns boolean indicating if an invalid field was found and focused
 */
export function focusFirstInvalidField(container?: HTMLElement | null): boolean {
  if (typeof document === 'undefined') return false;

  const root = container || document;
  const invalidEl = root.querySelector<HTMLElement>(
    'input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"], [aria-invalid="true"], :invalid'
  );

  if (invalidEl) {
    invalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    invalidEl.focus();
    return true;
  }

  return false;
}
