"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  description,
  children,
  className
}: FormFieldProps) {
  const fieldId = React.useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId} className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-destructive" aria-label="required">
            *
          </span>
        )}
      </Label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {children ? (
        React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: fieldId,
          'aria-labelledby': `${fieldId}-label`,
          'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required
        })
      ) : (
        <Input
          id={fieldId}
          aria-labelledby={`${fieldId}-label`}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required}
        />
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface FormGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function FormGroup({ 
  children, 
  title, 
  description, 
  className 
}: FormGroupProps) {
  const groupId = React.useId();
  
  return (
    <fieldset className={cn("space-y-4 border-0", className)} aria-labelledby={title ? `${groupId}-title` : undefined}>
      {title && (
        <legend id={`${groupId}-title`} className="text-lg font-semibold mb-2">
          {title}
        </legend>
      )}
      {description && (
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  );
}