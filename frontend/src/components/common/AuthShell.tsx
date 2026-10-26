import React from 'react';
import { Wallet } from 'lucide-react';

export interface AuthShellProps {
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ subtitle, children }: AuthShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        aria-hidden="true"
      >
        <Wallet className="h-8 w-8" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        Hisab Mezgeb
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-6 w-full text-left">{children}</div>
    </div>
  );
}
