"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base styles - compact pill shape (20px height, 36px width)
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full",
        // Border using design token
        "border border-transparent",
        // Unchecked state - using muted and border tokens
        "data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
        // Checked state - using primary token
        "data-[state=checked]:bg-primary",
        // Focus ring using ring token
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Hover using design tokens
        "hover:data-[state=unchecked]:brightness-95 hover:data-[state=checked]:brightness-110",
        // Smooth transition
        "transition-colors duration-200",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Thumb size (16px) and styling using background token
          "pointer-events-none block h-4 w-4 rounded-full",
          "bg-background shadow-sm",
          // Smooth slide animation
          "transition-transform duration-200",
          // Position based on state
          "data-[state=unchecked]:translate-x-0.5",
          "data-[state=checked]:translate-x-[18px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
