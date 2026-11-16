export const AMOUNT_REGEX = /^\d{1,8}(\.\d{1,2})?$/;

export function isValidMoneyAmount(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return AMOUNT_REGEX.test(val);
}

export interface FormatMoneyOptions {
  showCurrency?: boolean;
  currency?: string;
  lang?: string;
}

export function formatMoney(
  amount: number | string | null | undefined,
  options?: FormatMoneyOptions
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) {
    return '0';
  }

  // Determine if the amount has non-zero fractional cents
  const isWhole = num % 1 === 0;

  const lang = options?.lang || 'en-US';
  const formatter = new Intl.NumberFormat(lang, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  });

  const formattedNum = formatter.format(num);

  if (options?.showCurrency) {
    const symbol = options.currency || 'ETB';
    return `${symbol} ${formattedNum}`;
  }

  return formattedNum;
}

/**
 * in      income, funding in            "+" green
 * out     shop expense, funding out     "−" red
 * neutral personal / family draws       no sign
 * owed    what customers owe the shop   no sign, neutral (never red, never a minus)
 */
export type MoneyTone = 'in' | 'out' | 'neutral' | 'owed' | 'default';

export const UNKNOWN_VALUE = '—';
const MINUS = '−';

export function parseAmount(amount: string | number | null | undefined): number | null {
  if (amount === null || amount === undefined || amount === '') return null;
  const num = typeof amount === 'string' ? Number(amount) : amount;
  return Number.isFinite(num) ? num : null;
}

/** Zero (including -0) never gets a sign; owed and draws never get one either. */
export function moneySign(value: number | null, tone: MoneyTone, showSign: boolean): string {
  if (!showSign || value === null || Math.round(value * 100) === 0) return '';
  if (tone === 'in') return '+';
  if (tone === 'out') return MINUS;
  return '';
}
