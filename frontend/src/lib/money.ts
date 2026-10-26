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
