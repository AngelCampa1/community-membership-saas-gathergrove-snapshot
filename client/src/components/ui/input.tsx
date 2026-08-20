import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  description?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

function Input({ 
  className, 
  type, 
  error, 
  description,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  id,
  ...props 
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const descriptionId = description ? `${inputId}-description` : undefined;
  
  const describedBy = [ariaDescribedBy, errorId, descriptionId]
    .filter(Boolean)
    .join(' ') || undefined;
  
  // If error or description are provided, return wrapper with input and messages
  if (error || description) {
    return (
      <div className="space-y-1">
        <input
          id={inputId}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-card/50 backdrop-blur-sm px-3 py-1 text-base shadow-sm transition-[color,box-shadow,background-color,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:bg-card/70 focus-visible:backdrop-blur-md",
            "hover:bg-card/60 hover:border-border/60",
            "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
            error && "border-destructive ring-destructive/20",
            className
          )}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
  
  // Return just the input if no error/description
  return (
    <input
      id={inputId}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-card/50 backdrop-blur-sm px-3 py-1 text-base shadow-sm transition-[color,box-shadow,background-color,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:bg-card/70 focus-visible:backdrop-blur-md",
        "hover:bg-card/60 hover:border-border/60",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      {...props}
    />
  )
}

export { Input }
