/**
 * Mock implementation for @/components/ui/card
 */
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return <div data-testid="card" className={className} {...props}>{children}</div>;
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return <div data-testid="card-header" className={className} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return <h3 data-testid="card-title" className={className} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: CardProps) {
  return <p data-testid="card-description" className={className} {...props}>{children}</p>;
}

export function CardContent({ className, children, ...props }: CardProps) {
  return <div data-testid="card-content" className={className} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return <div data-testid="card-footer" className={className} {...props}>{children}</div>;
}

export function CardGlass({ className, children, ...props }: CardProps) {
  return <div data-testid="card-glass" className={className} {...props}>{children}</div>;
}

export function CardGlassSoft({ className, children, ...props }: CardProps) {
  return <div data-testid="card-glass-soft" className={className} {...props}>{children}</div>;
}

export function CardGlassStrong({ className, children, ...props }: CardProps) {
  return <div data-testid="card-glass-strong" className={className} {...props}>{children}</div>;
}

export function CardAction({ className, children, ...props }: CardProps) {
  return <div data-testid="card-action" className={className} {...props}>{children}</div>;
}

// Default export
export default Card;
