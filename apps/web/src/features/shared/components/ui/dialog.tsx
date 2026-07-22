import * as React from 'react';
import { cn } from '#/features/shared/utils/utils';

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4 animate-fade-in">
      <div
        className={cn(
          'bg-[#0b0e17] border border-cyan-500/20 max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-white',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
