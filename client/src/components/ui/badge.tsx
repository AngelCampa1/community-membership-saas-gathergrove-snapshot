import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Makes the badge interactive (clickable/focusable).
   * When true, renders as a button element.
   */
  interactive?: boolean;
  /**
   * Called when the badge is clicked (automatically makes badge interactive).
   */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Allows rendering as a custom element (e.g., 'a' for links).
   */
  asChild?: boolean;
}

function Badge({
  className,
  variant,
  interactive = false,
  onClick,
  asChild: _asChild = false,
  ...props
}: BadgeProps) {
  // Determine the component type
  // If onClick is provided, it's automatically interactive
  const isInteractive = interactive || !!onClick;
  const Component = isInteractive ? 'button' : 'div';

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      className={cn(
        badgeVariants({ variant }),
        isInteractive && 'cursor-pointer hover:scale-105 active:scale-95 transition-transform',
        className
      )}
      onClick={onClick}
      {...props}
    />
  )
}

export { Badge, badgeVariants } 