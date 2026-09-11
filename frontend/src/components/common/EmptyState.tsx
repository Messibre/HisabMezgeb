import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        {icon}
      </div>
      <p className="max-w-[240px] text-[18px] leading-relaxed text-outline">{message}</p>
      {action}
    </div>
  );
}
