import type { ReactNode } from 'react';
import { Drawer } from 'vaul';

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  trigger?: ReactNode;
  className?: string;
}

export default function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  className = '',
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity" />
        <Drawer.Content
          className={`fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[90dvh] flex-col rounded-t-[24px] bg-card border-t border-border focus:outline-none ${className}`}
        >
          <div
            data-testid="bottom-sheet-handle"
            className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-outline/60"
          />
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-3">
            {title ? (
              <Drawer.Title className="text-lg font-bold text-foreground mb-1">
                {title}
              </Drawer.Title>
            ) : (
              <Drawer.Title className="sr-only">Dialog</Drawer.Title>
            )}
            {description ? (
              <Drawer.Description className="text-sm text-on-surface-variant mb-4">
                {description}
              </Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">Dialog description</Drawer.Description>
            )}
            <div className="mt-2">{children}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
