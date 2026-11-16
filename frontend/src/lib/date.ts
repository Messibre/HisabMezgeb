import i18n from '@/lib/i18n';
import { formatDate as formatCalendarDate, monthRange } from '@/lib/calendar';
import { currentCalendar } from '@/store/calendar.store';

// 1 = Monday
export const WEEK_STARTS_ON = 1;

export function parseLocalDate(input: Date | string): Date {
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }

  // Parse YYYY-MM-DD string without UTC conversion
  const [yearStr, monthStr, dayStr] = input.slice(0, 10).split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  return new Date(year, month, day);
}

export function toApiDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function todayLocal(): string {
  return toApiDate(new Date());
}

export function startOfWeek(date?: Date | string): string {
  const d = date ? parseLocalDate(date) : parseLocalDate(todayLocal());
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ...

  // Week starts on Monday: Monday is day 1, diff = 0. Sunday is day 0, diff = 6.
  const diff = day === 0 ? 6 : day - WEEK_STARTS_ON;

  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  return toApiDate(monday);
}

export function endOfWeek(date?: Date | string): string {
  const start = parseLocalDate(startOfWeek(date));
  const sunday = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return toApiDate(sunday);
}

/** First day of the current month in the user's calendar (an Ethiopian month when that calendar is on). */
export function startOfMonth(date?: Date | string): string {
  const ymd = date ? toApiDate(date) : todayLocal();
  return monthRange(ymd, currentCalendar()).from;
}

export function endOfMonth(date?: Date | string): string {
  const ymd = date ? toApiDate(date) : todayLocal();
  return monthRange(ymd, currentCalendar()).to;
}

/** "Today" / "Yesterday", otherwise the date in the user's calendar ("ኅዳር 5, 2019 ዓ.ም"). */
export function formatDate(date: Date | string, lang?: string): string {
  const apiDate = toApiDate(date);
  const today = todayLocal();

  if (apiDate === today) {
    return i18n.t('common.today', { defaultValue: 'Today' });
  }

  const now = new Date();
  const yesterday = toApiDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  if (apiDate === yesterday) {
    return i18n.t('common.yesterday', { defaultValue: 'Yesterday' });
  }

  return formatCalendarDate(apiDate, lang || i18n.language || 'en', currentCalendar());
}

export function isFutureDate(date: Date | string): boolean {
  const apiDate = toApiDate(date);
  const today = todayLocal();
  return apiDate > today;
}
