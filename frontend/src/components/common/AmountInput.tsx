import { forwardRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  label?: string;
  helperText?: string;
  error?: string;
  autoFocus?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      value,
      onChange,
      currency,
      label,
      helperText,
      error,
      autoFocus = false,
      placeholder = '0.00',
      id = 'amount',
      className = '',
    },
    ref
  ) => {
    const { t } = useTranslation();
    const currencyLabel = currency || t('common.currency', { defaultValue: 'ETB' });
    const fieldLabel = label || t('common.amount', { defaultValue: 'Amount' });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty string or numbers up to 8 integer digits and up to 2 decimals
      if (raw === '' || /^\d{0,8}(\.\d{0,2})?$/.test(raw)) {
        onChange(raw);
      }
    };

    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-xl bg-card p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-border/40 ${className}`}
      >
        <label htmlFor={id} className="text-sm font-semibold text-muted-foreground">
          {fieldLabel}
        </label>

        <div className="flex w-full items-baseline justify-center gap-2">
          <span className="text-xl font-bold text-outline shrink-0">{currencyLabel}</span>
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="decimal"
            autoFocus={autoFocus}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            className="w-full max-w-[260px] border-none bg-transparent p-0 text-center text-4xl font-bold tracking-tight text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-0"
          />
        </div>

        {helperText && !error && (
          <p id={`${id}-helper`} className="text-xs text-muted-foreground text-center">
            {helperText}
          </p>
        )}

        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive text-center">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';

export default AmountInput;
