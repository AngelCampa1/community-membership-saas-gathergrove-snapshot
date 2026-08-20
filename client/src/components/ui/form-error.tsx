import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  message?: string | string[];
  className?: string;
  variant?: 'inline' | 'card';
}

export function FormError({ message, className, variant = 'inline' }: FormErrorProps) {
  if (!message) return null;

  const messages = Array.isArray(message) ? message : [message];

  if (variant === 'card') {
    return (
      <div className={cn(
        "rounded-md border border-destructive/20 bg-destructive/10 p-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <div className="text-sm">
            {messages.length === 1 ? (
              <p className="text-destructive">{messages[0]}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-destructive">
                {messages.map((msg, index) => (
                  <li key={`msg-${index}-${msg.substring(0, 30)}`}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {messages.map((msg, index) => (
        <p key={`inline-msg-${index}-${msg.substring(0, 30)}`} className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {msg}
        </p>
      ))}
    </div>
  );
}

interface FieldErrorProps {
  name: string;
  errors?: Record<string, string | string[]>;
  className?: string;
}

export function FieldError({ name, errors, className }: FieldErrorProps) {
  const error = errors?.[name];
  if (!error) return null;

  return <FormError message={error} className={className} />;
} 