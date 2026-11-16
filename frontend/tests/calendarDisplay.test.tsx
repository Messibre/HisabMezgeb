import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import i18n from '@/lib/i18n';
import { formatDate, startOfMonth, endOfMonth } from '@/lib/date';
import { useCalendarStore } from '@/store/calendar.store';
import { EntryListCard } from '@/pages/entries/components/EntryListCard';

describe('dates in the chosen calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, 12, 0));
  });
  afterEach(async () => {
    vi.useRealTimers();
    useCalendarStore.setState({ choice: null });
    await i18n.changeLanguage('en');
  });

  it('an entry made on Gregorian 14 Nov shows as ኅዳር 5, 2019 ዓ.ም in Amharic', async () => {
    await i18n.changeLanguage('am');
    expect(formatDate('2026-11-14')).toBe('ኅዳር 5, 2019 ዓ.ም');
  });

  it('switching the setting to Gregorian changes the text, data unchanged', async () => {
    await i18n.changeLanguage('am');
    useCalendarStore.setState({ choice: 'gregorian' });
    expect(formatDate('2026-11-14')).toBe('ኖቬምበር 14, 2026');
  });

  it('this month is the current Ethiopian month when that calendar is on', async () => {
    await i18n.changeLanguage('am');
    expect(startOfMonth()).toBe('2026-11-10');
    expect(endOfMonth()).toBe('2026-12-09');
    useCalendarStore.setState({ choice: 'gregorian' });
    expect(startOfMonth()).toBe('2026-11-01');
  });

  it('a history card shows the Ethiopian date', async () => {
    await act(() => i18n.changeLanguage('am'));
    render(
      <EntryListCard
        entry={{ entryType: 'income', id: 'i1', date: '2026-11-14', amount: 100, note: null } as never}
        onClick={() => {}}
      />
    );
    expect(screen.getByText('ኅዳር 5, 2019 ዓ.ም')).toBeInTheDocument();
  });
});
