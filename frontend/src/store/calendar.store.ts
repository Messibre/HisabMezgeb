import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTranslation } from 'react-i18next';
import { defaultCalendarFor, type CalendarSystem } from '@/lib/calendar';
import i18n from '@/lib/i18n';

interface CalendarState {
  /** null = not chosen yet: Ethiopian for Amharic/Tigrigna, Gregorian for English. */
  choice: CalendarSystem | null;
  setCalendar: (calendar: CalendarSystem) => void;
}

/** Stored on this device only, like the language. */
export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      choice: null,
      setCalendar: (calendar) => set({ choice: calendar }),
    }),
    { name: 'hisab-calendar' }
  )
);

/** The calendar in effect right now (for non-React code such as date formatting). */
export function currentCalendar(): CalendarSystem {
  return useCalendarStore.getState().choice ?? defaultCalendarFor(i18n.language);
}

/** The calendar in effect; re-renders when the setting or the language changes. */
export function useCalendar(): CalendarSystem {
  const { i18n: instance } = useTranslation();
  const choice = useCalendarStore((s) => s.choice);
  return choice ?? defaultCalendarFor(instance.language);
}
