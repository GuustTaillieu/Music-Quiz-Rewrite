import * as React from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cn } from '#/features/shared/lib/utils';

interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'> {
  value?: number | null;
  max?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const numericValue = value ?? 0;
    const percentage = Math.min(100, Math.max(0, (numericValue / max) * 100));

    return (
      <ProgressPrimitive.Root
        ref={ref}
        value={value}
        max={max}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-black/40 border border-cyan-500/10',
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Track className="h-full w-full overflow-hidden rounded-full">
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full w-full flex-1 bg-gradient-to-r from-cyan-500 to-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.5)] transition-all duration-300',
              indicatorClassName,
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
        </ProgressPrimitive.Track>
      </ProgressPrimitive.Root>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
