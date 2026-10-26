import React, { forwardRef } from 'react';

export interface PillInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingElement?: React.ReactNode;
  hasError?: boolean;
}

const PillInput = forwardRef<HTMLInputElement, PillInputProps>(
  ({ leadingIcon, trailingElement, hasError, className = '', ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {leadingIcon && (
          <div className="pointer-events-none absolute left-4 flex items-center justify-center text-outline">
            {leadingIcon}
          </div>
        )}

        <input
          ref={ref}
          className={`h-12 w-full rounded-full border-[1.5px] bg-card px-4 text-sm text-foreground transition-all duration-150 placeholder:text-outline-variant focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            leadingIcon ? 'pl-11' : ''
          } ${trailingElement ? 'pr-12' : ''} ${
            hasError
              ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
              : 'border-outline-variant focus:border-primary focus:ring-primary-container'
          } ${className}`}
          {...props}
        />

        {trailingElement && (
          <div className="absolute right-1 flex items-center justify-center">
            {trailingElement}
          </div>
        )}
      </div>
    );
  }
);

PillInput.displayName = 'PillInput';

export default PillInput;
