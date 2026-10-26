import { forwardRef, useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PillInput, { type PillInputProps } from './PillInput';

export interface PasswordInputProps
  extends Omit<PillInputProps, 'leadingIcon' | 'trailingElement' | 'type'> {
  showToggleLabel?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();

    const label = showPassword
      ? t('auth.hidePassword', { defaultValue: 'Hide password' })
      : t('auth.showPassword', { defaultValue: 'Show password' });

    return (
      <PillInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        leadingIcon={<Lock className="h-5 w-5 text-outline" aria-hidden="true" />}
        trailingElement={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={label}
            aria-pressed={showPassword}
            className="flex h-11 w-11 items-center justify-center rounded-full text-outline transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
