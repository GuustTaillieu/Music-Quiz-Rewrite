import * as React from 'react';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '#/features/shared/utils/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#00f0ff]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        magenta: 'border-transparent bg-pink-500/10 text-pink-400 border-pink-500/20',
        spotify: 'border-transparent bg-green-500/10 text-spotify border-spotify/30',
        amber: 'border-transparent bg-amber-500/10 text-amber-500 border-amber-500/30',
        outline: 'text-foreground border-cyan-500/20',
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
