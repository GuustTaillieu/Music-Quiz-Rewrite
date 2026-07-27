import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '#/features/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#00f0ff]',
  {
    variants: {
      variant: {
        default: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
        secondary: 'border-cyan-500/20 bg-black/40 text-white',
        destructive: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
        magenta: 'border-pink-500/20 bg-pink-500/10 text-pink-400',
        spotify: 'border-spotify/30 bg-spotify/10 text-spotify',
        amber: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
        outline: 'border-cyan-500/20 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
