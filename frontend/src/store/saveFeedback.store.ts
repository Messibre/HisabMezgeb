import { create } from 'zustand';

export type SaveKind = 'income' | 'expense' | 'funding' | 'borrow' | 'payment' | 'customer';

export type SaveFeedback =
  | { id: number; status: 'saved'; kind: SaveKind; date?: string; amount?: number | string; name?: string }
  | { id: number; status: 'failed'; kind: SaveKind; message: string };

interface SaveFeedbackState {
  current: SaveFeedback | null;
  /** Id of the row that was just saved, highlighted in lists for a moment. */
  highlightId: string | null;
  showSaved: (input: {
    kind: SaveKind;
    date?: string;
    amount?: number | string;
    name?: string;
    recordId?: string;
  }) => void;
  showFailed: (input: { kind: SaveKind; message: string }) => void;
  dismiss: () => void;
}

export const SAVED_VISIBLE_MS = 4000;
export const HIGHLIGHT_MS = 2000;

let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let highlightTimer: ReturnType<typeof setTimeout> | undefined;

export const useSaveFeedbackStore = create<SaveFeedbackState>()((set) => ({
  current: null,
  highlightId: null,
  showSaved: ({ recordId, ...rest }) => {
    clearTimeout(hideTimer);
    clearTimeout(highlightTimer);
    set({ current: { id: nextId++, status: 'saved', ...rest }, highlightId: recordId ?? null });
    hideTimer = setTimeout(() => set({ current: null }), SAVED_VISIBLE_MS);
    if (recordId) highlightTimer = setTimeout(() => set({ highlightId: null }), HIGHLIGHT_MS);
  },
  // Failures stay until the user dismisses them.
  showFailed: (input) => {
    clearTimeout(hideTimer);
    set({ current: { id: nextId++, status: 'failed', ...input } });
  },
  dismiss: () => {
    clearTimeout(hideTimer);
    set({ current: null });
  },
}));
