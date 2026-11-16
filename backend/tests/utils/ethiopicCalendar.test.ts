import { describe, it, expect } from 'vitest';
import { toEthiopic, formatEthiopicDate } from '../../src/utils/ethiopicCalendar.js';

const ymd = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe('Ethiopian calendar (exports)', () => {
  it.each([
    ['2026-09-11', { year: 2019, month: 1, day: 1 }],
    ['2026-11-14', { year: 2019, month: 3, day: 5 }],
    ['2027-09-11', { year: 2019, month: 13, day: 6 }],
    ['2027-09-12', { year: 2020, month: 1, day: 1 }],
  ])('%s is %o', (g, e) => {
    expect(toEthiopic(ymd(g))).toEqual(e);
  });

  it('agrees with Intl (ethiopic) for every day from 1990 to 2100', () => {
    const fmt = new Intl.DateTimeFormat('en-u-ca-ethiopic', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    });
    let mismatches = 0;
    for (let t = Date.UTC(1990, 0, 1); t <= Date.UTC(2100, 11, 31); t += 86_400_000) {
      const d = new Date(t);
      const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
      const e = toEthiopic(d);
      if (+parts.year !== e.year || +parts.month !== e.month || +parts.day !== e.day) mismatches++;
    }
    expect(mismatches).toBe(0);
  });

  it('formats with our own month names and the era', () => {
    expect(formatEthiopicDate(ymd('2026-11-14'), 'am')).toBe('ኅዳር 5, 2019 ዓ.ም');
    expect(formatEthiopicDate(ymd('2026-11-14'), 'ti')).toBe('ሕዳር 5, 2019 ዓ.ም');
    expect(formatEthiopicDate(ymd('2026-11-14'), 'en')).toBe('Hidar 5, 2019 E.C.');
  });
});
