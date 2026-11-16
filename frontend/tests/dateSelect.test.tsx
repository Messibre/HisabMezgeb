import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateSelect from '@/components/common/DateSelect';
import { useCalendarStore } from '@/store/calendar.store';

describe('DateSelect', () => {
  beforeEach(() => useCalendarStore.setState({ choice: 'ethiopian' }));
  afterEach(() => useCalendarStore.setState({ choice: null }));

  it('shows the Gregorian value in the Ethiopian calendar with 13 months', () => {
    render(<DateSelect value="2026-11-14" onChange={() => {}} max="2027-09-11" />);
    expect((screen.getByLabelText('Day') as HTMLSelectElement).value).toBe('5');
    expect((screen.getByLabelText('Month') as HTMLSelectElement).value).toBe('3');
    expect((screen.getByLabelText('Year') as HTMLSelectElement).value).toBe('2019');
    expect(screen.getByLabelText('Month').querySelectorAll('option')).toHaveLength(13);
  });

  it('choosing Hedar 5, 2019 sends 2026-11-14', () => {
    const onChange = vi.fn();
    render(<DateSelect value="2026-11-20" onChange={onChange} max="2026-11-20" />);
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith('2026-11-14');
  });

  it('never offers a future date', () => {
    render(<DateSelect value="2026-11-14" onChange={() => {}} max="2026-11-14" />);
    const days = [...screen.getByLabelText('Day').querySelectorAll('option')].map((o) => o.textContent);
    expect(days.at(-1)).toBe('5');
    const months = [...screen.getByLabelText('Month').querySelectorAll('option')];
    expect(months).toHaveLength(3); // Meskerem, Tikimt, Hidar of 2019
  });

  it('moving from day 30 to Pagume clamps the day to the last day of Pagume', () => {
    const onChange = vi.fn();
    // Nehase 30, 2019 = 2027-09-05; Pagume 2019 has 6 days.
    render(<DateSelect value="2027-09-05" onChange={onChange} max="2027-09-11" />);
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '13' } });
    expect(onChange).toHaveBeenCalledWith('2027-09-11');
  });

  it('works in the Gregorian calendar too', () => {
    useCalendarStore.setState({ choice: 'gregorian' });
    const onChange = vi.fn();
    render(<DateSelect value="2026-11-14" onChange={onChange} max="2026-11-30" />);
    expect(screen.getByLabelText('Month').querySelectorAll('option')).toHaveLength(11);
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith('2026-11-01');
  });
});
