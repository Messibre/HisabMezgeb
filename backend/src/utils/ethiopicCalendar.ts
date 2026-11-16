/**
 * Ethiopian (Ethiopic, Amete Mihret) calendar for showing dates in exports.
 * Stored data and the API stay Gregorian YYYY-MM-DD; only display changes.
 * Same arithmetic and month tables as frontend/src/lib/calendar — keep them in sync.
 */

export type EthiopicDate = { year: number; month: number; day: number };
export type CalendarLang = 'en' | 'am' | 'ti';

/** Julian Day Number of 1 Meskerem 1 E.C. */
const ETHIOPIC_EPOCH = 1724221;

function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

function ethiopicToJdn({ year, month, day }: EthiopicDate): number {
  return ETHIOPIC_EPOCH + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

function jdnToEthiopic(jdn: number): EthiopicDate {
  const year = Math.floor((4 * (jdn - ETHIOPIC_EPOCH) + 1463) / 1461);
  const n = jdn - ethiopicToJdn({ year, month: 1, day: 1 });
  return { year, month: Math.floor(n / 30) + 1, day: (n % 30) + 1 };
}

/** A Gregorian calendar date (the Date's UTC Y-M-D, as stored by Prisma) in the Ethiopian calendar. */
export function toEthiopic(date: Date): EthiopicDate {
  return jdnToEthiopic(gregorianToJdn(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()));
}

export const ETHIOPIC_MONTHS: Record<CalendarLang, readonly string[]> = {
  am: ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'],
  ti: ['መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታሕሳስ', 'ጥሪ', 'ለካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ', 'ሓምለ', 'ነሓሰ', 'ጳጉሜን'],
  en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
};

const ERA: Record<CalendarLang, string> = { am: 'ዓ.ም', ti: 'ዓ.ም', en: 'E.C.' };

/** "ኅዳር 5, 2019 ዓ.ም" — the era is always shown so 2019 is never read as Gregorian. */
export function formatEthiopicDate(date: Date, lang: CalendarLang): string {
  const { year, month, day } = toEthiopic(date);
  return `${ETHIOPIC_MONTHS[lang][month - 1]} ${day}, ${year} ${ERA[lang]}`;
}
