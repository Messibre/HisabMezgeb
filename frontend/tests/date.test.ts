import { describe, it, expect } from 'vitest';
import {
  WEEK_STARTS_ON,
  todayLocal,
  toApiDate,
  formatDate,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isFutureDate,
} from '@/lib/date';

describe('date.ts helpers', () => {
  it('has WEEK_STARTS_ON constant set to Monday (1)', () => {
    expect(WEEK_STARTS_ON).toBe(1);
  });

  it('todayLocal returns a valid YYYY-MM-DD local string', () => {
    const today = todayLocal();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('toApiDate formats dates in local time without UTC offset drift near midnight', () => {
    // 23:30 local time on Dec 31
    const lateNight = new Date(2025, 11, 31, 23, 30, 0);
    expect(toApiDate(lateNight)).toBe('2025-12-31');

    // 00:15 local time on Jan 1
    const earlyMorning = new Date(2026, 0, 1, 0, 15, 0);
    expect(toApiDate(earlyMorning)).toBe('2026-01-01');

    // String input
    expect(toApiDate('2026-05-15')).toBe('2026-05-15');
  });

  it('startOfWeek calculates Monday correctly across Sundays, month ends, and year ends', () => {
    // Monday Oct 26, 2026 -> Oct 26
    expect(startOfWeek('2026-10-26')).toBe('2026-10-26');

    // Wednesday Oct 28, 2026 -> Oct 26
    expect(startOfWeek('2026-10-28')).toBe('2026-10-26');

    // Sunday Nov 1, 2026 -> belongs to week starting Monday Oct 26
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26');

    // Year boundary: Sunday Jan 3, 2027 -> belongs to week starting Monday Dec 28, 2026
    expect(startOfWeek('2027-01-03')).toBe('2026-12-28');
  });

  it('formatDate renders Today, Yesterday, or formatted date', () => {
    const today = todayLocal();
    expect(formatDate(today)).toBe('Today');

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toApiDate(yesterdayDate);
    expect(formatDate(yesterday)).toBe('Yesterday');

    expect(formatDate('2025-06-15')).toBe('Jun 15, 2025');
  });

  it('isFutureDate correctly identifies past, present, and future dates', () => {
    const today = todayLocal();
    expect(isFutureDate(today)).toBe(false);

    expect(isFutureDate('2020-01-01')).toBe(false);
    expect(isFutureDate('2099-01-01')).toBe(true);
  });

  it('startOfMonth and endOfMonth calculate month boundaries correctly', () => {
    expect(startOfMonth('2026-10-26')).toBe('2026-10-01');
    expect(endOfMonth('2026-10-26')).toBe('2026-10-31');
    // Leap year February
    expect(startOfMonth('2024-02-15')).toBe('2024-02-01');
    expect(endOfMonth('2024-02-15')).toBe('2024-02-29');
  });
});
