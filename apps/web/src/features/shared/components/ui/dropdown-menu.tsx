import * as React from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { cn } from '#/features/shared/lib/utils';

const DropdownMenu = MenuPrimitive.Root;

interface DropdownMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof MenuPrimitive.Trigger> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <MenuPrimitive.Trigger
          ref={ref}
          {...props}
          render={(triggerProps) => React.cloneElement(children as React.ReactElement, triggerProps)}
        />
      );
    }
    return (
      <MenuPrimitive.Trigger ref={ref} {...props}>
        {children}
      </MenuPrimitive.Trigger>
    );
  },
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuGroup = MenuPrimitive.Group;
const DropdownMenuPortal = MenuPrimitive.Portal;

interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof MenuPrimitive.Popup> {
  align?: 'start' | 'center' | 'end';
}

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, align = 'end', ...props }, ref) => (
  <DropdownMenuPortal>
    <MenuPrimitive.Positioner sideOffset={6} align={align} className="z-[99999]">
      <MenuPrimitive.Popup
        ref={ref}
        className={cn(
          'z-[99999] min-w-[8rem] overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0b0e17] p-1.5 text-white shadow-2xl backdrop-blur-xl transition-all duration-150 focus:outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Positioner>
  </DropdownMenuPortal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-xs font-bold outline-none transition-colors hover:bg-cyan-500/15 hover:text-[#00f0ff] data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-cyan-500/10', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
};
