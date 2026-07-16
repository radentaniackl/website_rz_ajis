"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"

function Select({ ...props }: SelectPrimitive.Root.Props) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("text-sm text-foreground", className)}
      {...props}
    />
  )
}

function SelectContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10",
            className
          )}
          {...props}
        />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative cursor-pointer select-none rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-muted data-[state=selected]:bg-primary/10 data-[state=selected]:text-foreground",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }