import * as React from"react"
import { Slot } from"@radix-ui/react-slot"
import { cva, type VariantProps } from"class-variance-authority"

import { cn } from"@/lib/utils"

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20  aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:"bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200",
        destructive:"bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:"border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200",
        secondary:"bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:"hover:bg-accent hover:text-accent-foreground",
        link:"text-primary underline-offset-4 hover:underline",
        glass:"glass border-border/50 text-foreground shadow-lg hover:glass-strong hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200","glass-primary":"glass border-primary/30 bg-gradient-to-r from-primary/20 to-emerald-500/20 text-primary shadow-lg hover:from-primary/30 hover:to-emerald-500/30 hover:text-primary-foreground hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 backdrop-blur-md transition-all duration-200",
      },
      size: {
        default:"h-9 px-4 py-2 has-[>svg]:px-3",
        sm:"h-8 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5",
        lg:"h-10 rounded-full px-6 has-[>svg]:px-4",
        icon:"size-9 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant:"default",
      size:"default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot :"button"
  const isDisabled = disabled || loading;

  // When using asChild, we can't modify the children structure
  // So we ignore loading state and pass children directly to Slot
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="animate-spin mr-2">⟳</span>}
      {loading && loadingText ? loadingText : children}
    </Comp>
  )
}

export { Button, buttonVariants }
