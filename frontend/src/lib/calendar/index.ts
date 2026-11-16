/**
 * The one calendar module. Stored data and the API stay Gregorian YYYY-MM-DD;
 * only what the user sees and picks follows the chosen calendar.
 * Same arithmetic and month tables as backend/src/utils/ethiopicCalendar.ts.
 */

export type CalendarSystem = 'ethiopian' | 'gregorian';
export type CalendarLang = 'en' | 'am' | 'ti';
/** A date in the chosen calendar. Ethiopian months run 1–13 (13 = Pagume). */
export type CalendarDate = { year: number; month: number; day: number };

const ETHIOPIC_EPOCH = 1724221; // Julian Day Number of 1 Meskerem 1 E.C.

function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
  );
}

function jdnToGregorian(jdn: number): CalendarDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    year: 100 * b + d - 4800 + Math.floor(m / 10),
    month: m + 3 - 12 * Math.floor(m / 10),
    day: e - Math.floor((153 * m + 2) / 5) + 1,
  };
}

function ethiopicToJdn({ year, month, day }: CalendarDate): number {
  return ETHIOPIC_EPOCH + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

function jdnToEthiopic(jdn: number): CalendarDate {
  const year = Math.floor((4 * (jdn - ETHIOPIC_EPOCH) + 1463) / 1461);
  const n = jdn - ethiopicToJdn({ year, month: 1, day: 1 });
  return { year, month: Math.floor(n / 30) + 1, day: (n % 30) + 1 };
}

const pad = (n: number) => String(n).padStart(2, '0');

function parseYmd(ymd: string): CalendarDate {
  const [year, month, day] = ymd.slice(0, 10).split('-').map(Number);
  return { year, month, day };
}

function toYmd({ year, month, day }: CalendarDate): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Gregorian YYYY-MM-DD → date in the given calendar. */
export function fromGregorianYmd(ymd: string, calendar: CalendarSystem): CalendarDate {
  const g = parseYmd(ymd);
  return calendar === 'gregorian' ? g : jdnToEthiopic(gregorianToJdn(g.year, g.month, g.day));
}

/** Date in the given calendar → Gregorian YYYY-MM-DD (what the API stores). */
export function toGregorianYmd(date: CalendarDate, calendar: CalendarSystem): string {
  if (calendar === 'gregorian') return toYmd(date);
  return toYmd(jdnToGregorian(ethiopicToJdn(date)));
}

/** Today on this device as Gregorian YYYY-MM-DD (local time, never UTC-shifted). */
export function todayYmdLocal(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isEthiopicLeapYear(year: number): boolean {
  return year % 4 === 3;
}

export function monthsInYear(calendar: CalendarSystem): number {
  return calendar === 'ethiopian' ? 13 : 12;
}

/** Pagume has 5 days, or 6 in a leap year. */
export function daysInMonth(calendar: CalendarSystem, year: number, month: number): number {
  if (calendar === 'ethiopian') {
    if (month < 13) return 30;
    return isEthiopicLeapYear(year) ? 6 : 5;
  }
  return new Date(year, month, 0).getDate();
}

export function isFuture(ymd: string, today: string = todayYmdLocal()): boolean {
  return ymd.slice(0, 10) > today;
}

/** Add days to a Gregorian YYYY-MM-DD. */
export function addDaysYmd(ymd: string, days: number): string {
  const g = parseYmd(ymd);
  return toYmd(jdnToGregorian(gregorianToJdn(g.year, g.month, g.day) + days));
}

/** First and last Gregorian day of the month (in the given calendar) that contains `ymd`. */
export function monthRange(ymd: string, calendar: CalendarSystem): { from: string; to: string } {
  const d = fromGregorianYmd(ymd, calendar);
  const last = daysInMonth(calendar, d.year, d.month);
  return {
    from: toGregorianYmd({ year: d.year, month: d.month, day: 1 }, calendar),
    to: toGregorianYmd({ year: d.year, month: d.month, day: last }, calendar),
  };
}

const ETHIOPIC_MONTHS: Record<CalendarLang, readonly string[]> = {
  am: ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'],
  ti: ['መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታሕሳስ', 'ጥሪ', 'ለካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ', 'ሓምለ', 'ነሓሰ', 'ጳጉሜን'],
  en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
};

const GREGORIAN_MONTHS: Record<CalendarLang, readonly string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  am: ['ጃንዋሪ', 'ፌብሩዋሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'],
  ti: ['ጥሪ', 'ለካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ', 'ሓምለ', 'ነሓሰ', 'መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታሕሳስ'],
};

const WEEKDAYS: Record<CalendarLang, readonly string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  am: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'],
  ti: ['ሰንበት', 'ሰኑይ', 'ሰሉስ', 'ረቡዕ', 'ሓሙስ', 'ዓርቢ', 'ቀዳም'],
};

const ERA: Record<CalendarLang, string> = { am: 'ዓ.ም', ti: 'ዓ.ም', en: 'E.C.' };

const asLang = (lang: string | undefined): CalendarLang =>
  lang?.startsWith('am') ? 'am' : lang?.startsWith('ti') ? 'ti' : 'en';

export function monthNames(lang: string, calendar: CalendarSystem): readonly string[] {
  return (calendar === 'ethiopian' ? ETHIOPIC_MONTHS : GREGORIAN_MONTHS)[asLang(lang)];
}

export function weekdayNames(lang: string): readonly string[] {
  return WEEKDAYS[asLang(lang)];
}

/**
 * "ኅዳር 5, 2019 ዓ.ም" in the Ethiopian calendar (the era is always shown so 2019
 * is never read as a Gregorian year), "November 14, 2026" in the Gregorian one.
 * Month names come from our own tables so every phone shows the same text.
 */
export function formatDate(ymd: string, lang: string, calendar: CalendarSystem): string {
  const d = fromGregorianYmd(ymd, calendar);
  const month = monthNames(lang, calendar)[d.month - 1];
  return calendar === 'ethiopian'
    ? `${month} ${d.day}, ${d.year} ${ERA[asLang(lang)]}`
    : `${month} ${d.day}, ${d.year}`;
}

/** Default calendar for a language when the user has not chosen one. */
export function defaultCalendarFor(lang: string): CalendarSystem {
  return asLang(lang) === 'en' ? 'gregorian' : 'ethiopian';
}
