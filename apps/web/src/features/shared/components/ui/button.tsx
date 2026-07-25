import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '#/features/shared/lib/utils.ts';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00f0ff] disabled:pointer-events-none disabled:opacity-40 active:scale-98 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]',
        spotify:
          'bg-[#1DB954] hover:bg-[#1ed760] text-black hover:shadow-[0_0_15px_rgba(29,185,84,0.35)]',
        cyan:
          'bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00f0ff] border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]',
        magenta:
          'bg-[#ff007f]/20 hover:bg-[#ff007f]/30 text-[#ff007f] border border-[#ff007f]/40 shadow-[0_0_10px_rgba(255,0,127,0.2)]',
        emerald:
          'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-emerald-400/20',
        emerald_inverted:
          'border-1 border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400',
        amber:
          'bg-amber-500 hover:bg-amber-600 text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        outline:
          'border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-400',
        ghost:
          'text-muted-foreground hover:text-white hover:bg-white/5',
        destructive:
          'border border-rose-500/30 hover:bg-rose-500/10 text-rose-400',
        destructive_ghost:
          'text-red-400 hover:text-red-300 hover:bg-red-500/40',
        secondary:
          'bg-black/40 border border-cyan-500/20 text-white hover:border-[#00f0ff]',
        link:
          'text-[#00f0ff] underline-offset-4 hover:underline lowercase tracking-normal font-normal',
      },
      size: {
        default: 'py-2.5 px-4',
        sm: 'py-1.5 px-3 text-[10px]',
        lg: 'py-3.5 px-6 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <BaseButton
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
