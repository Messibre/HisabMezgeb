import React from 'react';
import { Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AuthShellProps {
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ subtitle, children }: AuthShellProps) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        aria-hidden="true"
      >
        <Wallet className="h-8 w-8" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {t('brand.name')}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-6 w-full text-left">{children}</div>
    </div>
  );
}
