import { create } from 'zustand';

/**
 * Global "dirty flag" for unsaved form input.
 *
 * Components that own an open form or bottom sheet with unsaved input should
 * call `setDirty(true)` while editing and `setDirty(false)` on
 * submit / cancel / close.
 *
 * The PWA update banner reads this flag: when a new service worker is waiting,
 * the "Update" prompt is deferred until isDirty === false so that a reload
 * never loses the user's input mid-form.
 */
interface DirtyState {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
}

export const useDirtyStore = create<DirtyState>()((set) => ({
  isDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
}));

