import { useCallback, useRef, useState } from 'react';

/**
 * Runs one submit at a time. Extra taps while a save is in flight are ignored
 * synchronously (a ref, not only a disabled button, which updates a render late).
 * After a successful run, `justSaved` is true for about 1.5 s to show a check.
 */
export function useSubmitGuard() {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setBusy(true);
    try {
      return await fn();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);

  const markSaved = useCallback(() => {
    clearTimeout(savedTimer.current);
    setJustSaved(true);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1500);
  }, []);

  return { run, busy, justSaved, markSaved };
}
