import React from 'react';
import { useTranslation } from 'react-i18next';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  optional?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  htmlFor,
  optional = false,
  helperText,
  error,
  children,
  className = '',
}: FormFieldProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-sm font-semibold text-foreground tracking-tight"
        >
          {label}
        </label>
        {optional && (
          <span className="text-xs text-muted-foreground font-normal">
            {t('common.optional', { defaultValue: '(optional)' })}
          </span>
        )}
      </div>

      {children}

      {helperText && !error && (
        <p id={`${htmlFor}-helper`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
