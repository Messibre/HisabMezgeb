import { forwardRef, type ChangeEvent } from 'react';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  autoFocus?: boolean;
  placeholder?: string;
  id?: string;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  (
    { value, onChange, currency = 'ETB', autoFocus = false, placeholder = '0.00', id = 'amount' },
    ref
  ) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Only allow digits and up to 2 decimal places
      if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
        onChange(raw);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-lowest px-6 py-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
        <label htmlFor={id} className="text-[16px] font-semibold text-on-surface-variant">
          Amount
        </label>
        <div className="flex items-baseline gap-2">
          <span className="text-[24px] font-medium text-outline">{currency}</span>
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="decimal"
            autoFocus={autoFocus}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full max-w-[250px] border-none bg-transparent p-0 text-center text-[40px] font-bold text-primary placeholder:text-outline-variant focus:outline-none focus:ring-0"
          />
        </div>
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';
