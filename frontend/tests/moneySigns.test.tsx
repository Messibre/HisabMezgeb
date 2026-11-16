import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MoneyText from '@/components/common/MoneyText';
import StatCard from '@/components/common/StatCard';
import { moneySign, parseAmount } from '@/lib/money';

const shown = (ui: React.ReactElement) => {
  const { container } = render(ui);
  // Drop the screen-reader-only label and the currency, keep the number.
  container.querySelectorAll('.sr-only').forEach((n) => n.remove());
  return container.textContent?.replace(/ETB|ብር/g, '').trim();
};

describe('money sign rules', () => {
  it.each([
    ['in', 1500, '+1,500'],
    ['out', 1500, '−1,500'],
    ['neutral', 1500, '1,500'],
    ['owed', 20522, '20,522'],
    ['in', 0, '0'],
    ['out', 0, '0'],
    ['out', -0, '0'],
    ['out', '-0.00', '0'],
    ['in', 99999999.99, '+99,999,999.99'],
    ['out', 12.5, '−12.50'],
    ['owed', -20522, '20,522'],
  ] as const)('%s %s shows %s', (tone, amount, expected) => {
    expect(shown(<MoneyText amount={amount} tone={tone} showSign showCurrency={false} />)).toBe(expected);
  });

  it('never prints -0 or +0', () => {
    expect(moneySign(-0, 'out', true)).toBe('');
    expect(moneySign(0, 'in', true)).toBe('');
    expect(moneySign(0.001, 'in', true)).toBe('');
  });

  it('treats null, undefined, empty and garbage as unknown', () => {
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('12.50')).toBe(12.5);
  });

  it('renders an unknown amount as a dash and never as 0', () => {
    render(<MoneyText amount={null} tone="owed" />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('a stat card with an unknown amount shows a dash, no number', () => {
    const { container } = render(<StatCard label="Owed to you" amount={null} tone="owed" />);
    expect(container.textContent).toContain('—');
    expect(container.textContent).not.toMatch(/\d/);
  });

  it('a stat card label wraps instead of being cut with an ellipsis', () => {
    render(<StatCard label="በደንበኞች የተያዘ ጠቅላላ ዕዳ በጣም ረጅም መለያ" amount={1} />);
    const label = screen.getByText(/በደንበኞች/);
    expect(label.className).not.toContain('truncate');
    expect(label.className).toContain('line-clamp-2');
  });
});
