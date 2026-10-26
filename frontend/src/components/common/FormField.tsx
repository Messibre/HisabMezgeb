import React from 'react';
import { useTranslation } from 'react-i18next';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  id?: string;
  optional?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  htmlFor,
  id,
  optional = false,
  helperText,
  error,
  children,
  className = '',
}: FormFieldProps) {
  const { t } = useTranslation();
  const effectiveHtmlFor = htmlFor || id;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={effectiveHtmlFor}
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
        <p id={`${effectiveHtmlFor}-helper`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${effectiveHtmlFor}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
