import { describe, it, expect } from 'vitest';
import {
  fromGregorianYmd,
  toGregorianYmd,
  daysInMonth,
  monthRange,
  formatDate,
  todayYmdLocal,
  addDaysYmd,
  isFuture,
  defaultCalendarFor,
} from '@/lib/calendar';

describe('Ethiopian calendar module', () => {
  it.each([
    ['2026-09-11', { year: 2019, month: 1, day: 1 }],
    ['2026-11-14', { year: 2019, month: 3, day: 5 }],
    ['2027-09-11', { year: 2019, month: 13, day: 6 }],
    ['2027-09-12', { year: 2020, month: 1, day: 1 }],
  ])('test vector %s = %o', (g, e) => {
    expect(fromGregorianYmd(g, 'ethiopian')).toEqual(e);
    expect(toGregorianYmd(e, 'ethiopian')).toBe(g);
  });

  it('every day from 1990 to 2100 converts to Ethiopic and back, and agrees with Intl', () => {
    const fmt = new Intl.DateTimeFormat('en-u-ca-ethiopic', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    });
    let roundTripErrors = 0;
    let intlMismatches = 0;
    for (let ymd = '1990-01-01'; ymd <= '2100-12-31'; ymd = addDaysYmd(ymd, 1)) {
      const e = fromGregorianYmd(ymd, 'ethiopian');
      if (toGregorianYmd(e, 'ethiopian') !== ymd) roundTripErrors++;
      const parts = Object.fromEntries(
        fmt.formatToParts(new Date(`${ymd}T00:00:00Z`)).map((p) => [p.type, p.value])
      );
      if (+parts.year !== e.year || +parts.month !== e.month || +parts.day !== e.day) intlMismatches++;
    }
    expect(roundTripErrors).toBe(0);
    expect(intlMismatches).toBe(0);
  });

  it('Pagume has 6 days in a leap year and 5 otherwise', () => {
    expect(daysInMonth('ethiopian', 2019, 13)).toBe(6);
    expect(daysInMonth('ethiopian', 2020, 13)).toBe(5);
    expect(daysInMonth('ethiopian', 2019, 3)).toBe(30);
    expect(daysInMonth('gregorian', 2028, 2)).toBe(29);
  });

  it('this month follows the chosen calendar, including short Pagume', () => {
    expect(monthRange('2026-11-14', 'ethiopian')).toEqual({ from: '2026-11-10', to: '2026-12-09' });
    expect(monthRange('2027-09-08', 'ethiopian')).toEqual({ from: '2027-09-06', to: '2027-09-11' });
    expect(monthRange('2026-11-14', 'gregorian')).toEqual({ from: '2026-11-01', to: '2026-11-30' });
  });

  it('formats with our own month names and always shows the era', () => {
    expect(formatDate('2026-11-14', 'am', 'ethiopian')).toBe('ኅዳር 5, 2019 ዓ.ም');
    expect(formatDate('2026-11-14', 'ti', 'ethiopian')).toBe('ሕዳር 5, 2019 ዓ.ም');
    expect(formatDate('2026-11-14', 'en', 'ethiopian')).toBe('Hidar 5, 2019 E.C.');
    expect(formatDate('2026-11-14', 'en', 'gregorian')).toBe('November 14, 2026');
  });

  it('midnight in East Africa Time uses the local date, not UTC', () => {
    // 00:30 on 14 Nov in Addis is still 13 Nov 21:30 UTC.
    const local = new Date(2026, 10, 14, 0, 30);
    expect(todayYmdLocal(local)).toBe('2026-11-14');
  });

  it('crosses the Ethiopian new year correctly', () => {
    expect(fromGregorianYmd(addDaysYmd('2027-09-11', 1), 'ethiopian')).toEqual({ year: 2020, month: 1, day: 1 });
  });

  it('future dates and defaults', () => {
    expect(isFuture('2026-11-15', '2026-11-14')).toBe(true);
    expect(isFuture('2026-11-14', '2026-11-14')).toBe(false);
    expect(defaultCalendarFor('am')).toBe('ethiopian');
    expect(defaultCalendarFor('ti')).toBe('ethiopian');
    expect(defaultCalendarFor('en')).toBe('gregorian');
  });
});
