export interface SkeletonRowProps {
  className?: string;
}

export function SkeletonRow({ className = '' }: SkeletonRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border/30 motion-safe:animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          data-testid="skeleton-circle"
          className="h-10 w-10 rounded-full bg-surface-container-high shrink-0"
        />
        <div data-testid="skeleton-lines" className="space-y-2 flex-1 min-w-0">
          <div className="h-3.5 w-1/2 rounded bg-surface-container-high" />
          <div className="h-3 w-1/3 rounded bg-surface-container-high" />
        </div>
      </div>
      <div
        data-testid="skeleton-pill"
        className="h-6 w-16 rounded-full bg-surface-container-high shrink-0"
      />
    </div>
  );
}

export interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = 'h-16 w-full rounded-xl' }: SkeletonBlockProps) {
  return (
    <div
      className={`bg-surface-container-high motion-safe:animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export default SkeletonRow;
