import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import AppHeader from '@/components/common/AppHeader';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { PeriodPicker } from '@/components/common/PeriodPicker';
import { DebtHistoryList } from '@/pages/debts/components/DebtHistoryList';

const setOnline = (value: boolean) =>
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });

describe('offline banner', () => {
  afterEach(() => setOnline(true));

  it('uses an SVG icon and translated text, never an icon-font word', () => {
    setOnline(false);
    const { container } = render(<OfflineBanner />);
    const banner = screen.getByTestId('offline-banner');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner.textContent).not.toMatch(/wifi_off/);
    expect(banner.textContent).toContain('cannot be saved');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('sits in the flow under the header, not fixed on top of it', () => {
    setOnline(false);
    render(
      <MemoryRouter>
        <AppHeader title="Reports" />
      </MemoryRouter>
    );
    const banner = screen.getByTestId('offline-banner');
    const header = screen.getByRole('banner');
    expect(banner.className).not.toMatch(/\bfixed\b/);
    expect(header.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows a one-time back-online note after reconnecting', () => {
    vi.useFakeTimers();
    try {
      setOnline(false);
      render(<OfflineBanner />);
      setOnline(true);
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(screen.getByTestId('offline-banner').textContent).toContain('Back online');
      act(() => vi.advanceTimersByTime(3000));
      expect(screen.queryByTestId('offline-banner')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('no icon font is used anywhere in the app', () => {
    const walk = (d: string): string[] =>
      fs.readdirSync(d).flatMap((f) => {
        const p = path.join(d, f);
        return fs.statSync(p).isDirectory() ? walk(p) : [p];
      });
    const offenders = walk(path.resolve(__dirname, '../src')).filter((f) =>
      fs.readFileSync(f, 'utf8').includes('material-symbols')
    );
    expect(offenders).toEqual([]);
  });
});

describe('layout polish', () => {
  it('period chips wrap inside the page (no negative margins, no horizontal scroller)', () => {
    render(<PeriodPicker value="week" onChange={() => {}} />);
    const group = screen.getByRole('radiogroup');
    expect(group.className).not.toMatch(/-mx-|overflow-x-auto/);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('history card accent bar is an inner straight bar in an overflow-hidden card', () => {
    render(
      <DebtHistoryList
        history={[{ id: 'b1', kind: 'borrow', date: '2026-11-14', amount: 100, itemsDescription: 'ዘይት', note: null }] as never}
        onSelectRecord={() => {}}
      />
    );
    const bar = screen.getByTestId('history-accent-bar');
    expect(bar.parentElement?.className).toContain('overflow-hidden');
    expect(bar.parentElement?.className).not.toMatch(/border-l-\[/);
  });
});
