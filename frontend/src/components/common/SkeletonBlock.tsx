interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-container-high ${className}`}
      aria-hidden="true"
    />
  );
}

export default SkeletonBlock;
