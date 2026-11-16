import { useEffect, useRef } from 'react';

export const DRAFT_PREFIX = 'hisab-draft:';

export type DraftFields = Record<string, string>;

function readDraft(key: string): DraftFields | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + key);
    return raw ? (JSON.parse(raw) as DraftFields) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(DRAFT_PREFIX + key);
  } catch {
    // Storage unavailable (private mode): nothing to clear.
  }
}

/** Removes every form draft, e.g. on logout. */
export function clearAllDrafts() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(DRAFT_PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

/**
 * Keeps the typed fields of an unsaved form in sessionStorage and restores them
 * once when the form mounts (after a reload or when the app is reopened).
 * Only plain form fields are stored, never server data.
 */
export function useFormDraft(
  key: string,
  fields: DraftFields,
  restore: (draft: DraftFields) => void,
) {
  const restoredFor = useRef<string | null>(null);
  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  });

  useEffect(() => {
    if (restoredFor.current === key) return;
    restoredFor.current = key;
    const draft = readDraft(key);
    if (draft) restoreRef.current(draft);
  }, [key]);

  const serialized = JSON.stringify(fields);
  useEffect(() => {
    if (restoredFor.current !== key) return;
    const values = JSON.parse(serialized) as DraftFields;
    const isEmpty = Object.values(values).every((v) => !v);
    try {
      if (isEmpty) sessionStorage.removeItem(DRAFT_PREFIX + key);
      else sessionStorage.setItem(DRAFT_PREFIX + key, serialized);
    } catch {
      // Storage full or unavailable: drafts are a convenience only.
    }
  }, [key, serialized]);
}
