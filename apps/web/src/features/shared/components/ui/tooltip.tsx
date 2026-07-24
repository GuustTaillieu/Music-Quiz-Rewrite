import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cn } from '#/features/shared/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;

interface TooltipTriggerProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ asChild, ...props }, ref) => <TooltipPrimitive.Trigger ref={ref} {...props} />,
);
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup> {
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner sideOffset={sideOffset}>
        <TooltipPrimitive.Popup
          ref={ref}
          className={cn(
            'z-100 overflow-hidden rounded-xl border border-cyan-500/20 bg-black/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00f0ff] shadow-xl backdrop-blur-md transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="fill-black stroke-cyan-500/20" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  ));
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
