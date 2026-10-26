import { describe, it, expect } from 'vitest';
import { formatMoney, isValidMoneyAmount, AMOUNT_REGEX } from '@/lib/money';

describe('money.ts helpers', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatMoney(1200)).toBe('1,200');
    expect(formatMoney('1200')).toBe('1,200');
    expect(formatMoney(0)).toBe('0');
    expect(formatMoney('0')).toBe('0');
  });

  it('formats decimals to exactly 2 decimal places', () => {
    expect(formatMoney(1200.5)).toBe('1,200.50');
    expect(formatMoney('1200.50')).toBe('1,200.50');
    expect(formatMoney(0.05)).toBe('0.05');
    expect(formatMoney('0.7')).toBe('0.70');
  });

  it('handles currency prefix when showCurrency is true', () => {
    expect(formatMoney(1200, { showCurrency: true, currency: 'ETB' })).toBe('ETB 1,200');
    expect(formatMoney(1200.5, { showCurrency: true, currency: 'ብር' })).toBe('ብር 1,200.50');
  });

  it('validates amounts using AMOUNT_REGEX: ^\\d{1,8}(\\.\\d{1,2})?$', () => {
    expect(isValidMoneyAmount('0')).toBe(true);
    expect(isValidMoneyAmount('1200')).toBe(true);
    expect(isValidMoneyAmount('1200.5')).toBe(true);
    expect(isValidMoneyAmount('1200.50')).toBe(true);
    expect(isValidMoneyAmount('99999999.99')).toBe(true);

    // Invalid amounts
    expect(isValidMoneyAmount('')).toBe(false);
    expect(isValidMoneyAmount('-5')).toBe(false);
    expect(isValidMoneyAmount('12.345')).toBe(false);
    expect(isValidMoneyAmount('abc')).toBe(false);
    expect(isValidMoneyAmount('123456789')).toBe(false); // 9 integer digits > 8
    expect(isValidMoneyAmount('12.')).toBe(false);
    expect(AMOUNT_REGEX.test('12.345')).toBe(false);
  });
});
