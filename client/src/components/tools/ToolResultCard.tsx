import React from'react';
import { cn } from'@/lib/utils';

interface ToolResultCardProps {
  label: string;
  value: string;
  description?: string;
  variant?:'default' |'highlight' |'success';
  icon?: React.ElementType;
}

const variantStyles: Record<NonNullable<ToolResultCardProps['variant']>, string> = {
  default:'bg-card border text-card-foreground',
  highlight:'bg-primary/10 border-primary/20 text-foreground',
  success:'bg-green-50  border-green-200  text-green-900',
};

export default function ToolResultCard({
  label,
  value,
  description,
  variant ='default',
  icon: Icon,
}: ToolResultCardProps) {
  return (
    <div
      data-variant={variant}
      className={cn('rounded-xl border p-5 space-y-2 shadow-sm',
        variantStyles[variant]
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span data-slot="icon" aria-hidden="true">
            <Icon className="h-5 w-5 opacity-70" />
          </span>
        )}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>

      <p className="text-2xl font-bold tracking-tight">{value}</p>

      {description && (
        <p
          data-slot="description"
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}
    </div>
  );
}
