'use client';

import React, { useState } from'react';
import { CheckCircle, Mail } from'lucide-react';
import { Button } from'@/components/ui/button';
import { Input } from'@/components/ui/input';
import { marketingService } from'@/services/marketingService';
import { TurnstileWidget } from '@/components/marketing/TurnstileWidget';

interface ToolLeadCaptureProps {
  source:'tool-dues-calculator' |'tool-stack-calculator' |'tool-event-budget';
  ctaText: string;
  successMessage?: string;
  toolData?: Record<string, unknown>;
}

type FormState ='idle' |'loading' |'success' |'error';

export default function ToolLeadCapture({
  source,
  ctaText,
  successMessage ='Check your inbox!',
  toolData,
}: ToolLeadCaptureProps) {
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const validateEmail = (value: string): string | null => {
    if (!value.includes('@')) {
      return'Please enter a valid email address.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateEmail(email);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setFormState('loading');

    try {
      const result = await marketingService.captureToolLead({
        email,
        source,
        metadata: { toolData },
        companyWebsite,
        turnstileToken,
      });

      if (result.success) {
        setFormState('success');
      } else {
        setFormState('error');
      }
    } catch {
      setFormState('error');
    }
  };

  if (formState ==='success') {
    return (
      <div
        className="flex items-center gap-3 rounded-lg border border-green-200  bg-green-50  p-4 text-green-800"
        role="status"
      >
        <CheckCircle className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
        <p className="font-medium">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <p className="text-sm font-medium">{ctaText}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="tool-lead-company-website">Company website</label>
          <input
            id="tool-lead-company-website"
            name="company_website"
            type="text"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="tool-lead-email" className="sr-only">
            Email address
          </label>
          <Input
            id="tool-lead-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationError) setValidationError(null);
            }}
            aria-label="Email"
            aria-invalid={validationError != null}
            aria-describedby={validationError ?'tool-lead-error' : undefined}
            disabled={formState ==='loading'}
            className="w-full"
          />
          {validationError && (
            <p id="tool-lead-error" role="alert" className="text-sm text-destructive">
              {validationError}
            </p>
          )}
        </div>

        {formState ==='error' && (
          <p role="alert" className="text-sm text-destructive">
            Something went wrong. Please try again.
          </p>
        )}

        <TurnstileWidget onTokenChange={setTurnstileToken} />

        <Button
          type="submit"
          disabled={formState ==='loading'}
          className="w-full sm:w-auto"
        >
          {formState ==='loading' ?'Sending…' :'Send me the template'}
        </Button>
      </form>
    </div>
  );
}
