import * as React from 'react';
import { cn } from '#/features/shared/utils/utils';

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (val: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min = 0, max = 1, step = 0.05, onValueChange, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onValueChange?.(parseFloat(e.target.value))}
        className={cn(
          'w-full h-1 bg-black/40 rounded-full appearance-none cursor-pointer accent-[#00f0ff] border border-cyan-500/10 focus:outline-none',
          className,
        )}
        {...props}
      />
    );
  },
);
Slider.displayName = 'Slider';

export { Slider };
