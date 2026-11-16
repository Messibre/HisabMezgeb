import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  daysInMonth,
  fromGregorianYmd,
  monthNames,
  monthsInYear,
  toGregorianYmd,
  todayYmdLocal,
} from '@/lib/calendar';
import { useCalendar } from '@/store/calendar.store';

export interface DateSelectProps {
  /** Gregorian YYYY-MM-DD. */
  value: string;
  onChange: (ymd: string) => void;
  /** Latest selectable Gregorian date; defaults to today. */
  max?: string;
  /** Earliest selectable Gregorian date. */
  min?: string;
  /** Visible group label. */
  label?: string;
  id?: string;
  className?: string;
}

const YEARS_BACK = 5;

/**
 * Day / Month / Year selects in the user's calendar (13 months in the Ethiopian one).
 * Always emits a Gregorian YYYY-MM-DD. Future dates are not offered.
 */
export default function DateSelect({ value, onChange, max, min, label, id, className = '' }: DateSelectProps) {
  const { t, i18n } = useTranslation();
  const calendar = useCalendar();
  const autoId = useId();
  const baseId = id ?? autoId;
  const maxYmd = max ?? todayYmdLocal();

  const current = fromGregorianYmd(value, calendar);
  const maxDate = fromGregorianYmd(maxYmd, calendar);
  const minDate = min ? fromGregorianYmd(min, calendar) : { year: maxDate.year - YEARS_BACK, month: 1, day: 1 };
  const names = monthNames(i18n.language, calendar);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxDate.year; y >= minDate.year; y--) list.push(y);
    return list;
  }, [maxDate.year, minDate.year]);

  const allowedMonths = (year: number) => {
    const last = year === maxDate.year ? maxDate.month : monthsInYear(calendar);
    const first = year === minDate.year ? minDate.month : 1;
    return Array.from({ length: last - first + 1 }, (_, i) => first + i);
  };

  const allowedDays = (year: number, month: number) => {
    let last = daysInMonth(calendar, year, month);
    if (year === maxDate.year && month === maxDate.month) last = Math.min(last, maxDate.day);
    const first = year === minDate.year && month === minDate.month ? minDate.day : 1;
    return Array.from({ length: last - first + 1 }, (_, i) => first + i);
  };

  // Keep the date valid when the month or year changes (e.g. day 30 → Pagume).
  const emit = (year: number, month: number, day: number) => {
    const months = allowedMonths(year);
    const m = Math.min(Math.max(month, months[0]), months[months.length - 1]);
    const days = allowedDays(year, m);
    const d = Math.min(Math.max(day, days[0]), days[days.length - 1]);
    onChange(toGregorianYmd({ year, month: m, day: d }, calendar));
  };

  const selectClass =
    'h-12 min-w-0 rounded-xl border border-input bg-card px-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <fieldset className={`min-w-0 ${className}`} data-testid="date-select">
      {label && <legend className="mb-1 text-xs font-semibold text-muted-foreground">{label}</legend>}
      <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2">
        <label className="sr-only" htmlFor={`${baseId}-day`}>
          {t('date.day')}
        </label>
        <select
          id={`${baseId}-day`}
          aria-label={t('date.day')}
          className={selectClass}
          value={current.day}
          onChange={(e) => emit(current.year, current.month, Number(e.target.value))}
        >
          {allowedDays(current.year, current.month).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`${baseId}-month`}>
          {t('date.month')}
        </label>
        <select
          id={`${baseId}-month`}
          aria-label={t('date.month')}
          className={selectClass}
          value={current.month}
          onChange={(e) => emit(current.year, Number(e.target.value), current.day)}
        >
          {allowedMonths(current.year).map((m) => (
            <option key={m} value={m}>
              {names[m - 1]}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`${baseId}-year`}>
          {t('date.year')}
        </label>
        <select
          id={`${baseId}-year`}
          aria-label={t('date.year')}
          className={selectClass}
          value={current.year}
          onChange={(e) => emit(Number(e.target.value), current.month, current.day)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
