import { forwardRef, type ChangeEvent } from 'react';
import { Phone } from 'lucide-react';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  error?: boolean;
}

export const PhoneNumberInput = forwardRef<HTMLInputElement, PhoneNumberInputProps>(
  ({ value, onChange, id, placeholder = '09XX XXX XXX', error = false }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d+]/g, '');
      // Keep leading + only
      if (raw.includes('+') && !raw.startsWith('+')) {
        raw = raw.replace(/\+/g, '');
      }
      if (raw.startsWith('+')) {
        raw = '+' + raw.slice(1).replace(/\+/g, '');
      }
      onChange(raw);
    };

    return (
      <div className="relative">
        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="tel"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`h-14 w-full rounded-full border bg-surface-container-lowest pl-12 pr-4 text-[18px] text-on-surface placeholder:text-outline-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? 'border-error' : 'border-outline-variant focus:border-primary'
          }`}
        />
      </div>
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';
