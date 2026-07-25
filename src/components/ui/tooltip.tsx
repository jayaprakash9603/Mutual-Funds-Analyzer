import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export function TooltipProvider({ delayDuration = 200, ...props }: TooltipPrimitive.TooltipProviderProps) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

export function Tooltip({ ...props }: TooltipPrimitive.TooltipProps) {
  return <TooltipPrimitive.Root {...props} />
}

export function TooltipTrigger({ ...props }: TooltipPrimitive.TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger {...props} />
}

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
