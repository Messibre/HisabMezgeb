import React from 'react';

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  name?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = (index - 1 + options.length) % options.length;
      onChange(options[nextIndex].value);
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex w-full items-center rounded-full bg-surface-container-low p-1 gap-1 border border-border/20 ${className}`}
    >
      {options.map((opt, i) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`flex-1 min-h-[40px] rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isSelected
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
