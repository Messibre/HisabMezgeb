interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div className={`animate-pulse rounded-md bg-surface-dim ${className}`} aria-hidden="true" />
  );
}
