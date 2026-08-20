'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Download, CheckCircle } from 'lucide-react';
import { ctaAnalyticsService } from '@/services/ctaAnalyticsService';
import { marketingService } from '@/services/marketingService';
import { logger } from '@/lib/logger';
import { TurnstileWidget } from './TurnstileWidget';

export interface TemplateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: { title: string; slug: string; format: string } | null;
}

const SESSION_EMAIL_KEY = 'gathergrove-template-email';

export function TemplateDownloadModal({
  isOpen,
  onClose,
  template,
}: TemplateDownloadModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  if (!template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await marketingService.captureExitIntentLead({
        email,
        name,
        source: 'template-download',
        variant: template.slug,
        companyWebsite,
        turnstileToken,
        metadata: {
          templateTitle: template.title,
          templateFormat: template.format,
        },
      });

      ctaAnalyticsService.recordConversion(
        `template-download-${template.slug}`,
        'download',
        1,
      );

      sessionStorage.setItem(SESSION_EMAIL_KEY, email);
      setIsCompleted(true);
    } catch (error) {
      logger.error('marketing', 'Template lead capture failed', {
        error,
        email,
        slug: template.slug,
      });
      // Still proceed to download — don't punish user for a backend hiccup
      sessionStorage.setItem(SESSION_EMAIL_KEY, email);
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    marketingService.downloadTemplate(template.slug);

    ctaAnalyticsService.recordConversion(
      `template-download-complete-${template.slug}`,
      'download',
      1,
    );

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Ready to download!
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-success" />
            </div>

            <h3 className="text-lg font-semibold mb-2">{template.title}</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Click below to download your template as a PDF.
            </p>

            <Button onClick={handleDownload} className="w-full mb-4 min-h-[44px]">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <p className="text-xs text-muted-foreground">
              {template.format} · Opens in a new tab
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Download Template</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-1">{template.title}</h3>
            <p className="text-sm text-muted-foreground">{template.format}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="template-company-website">Company website</label>
              <input
                id="template-company-website"
                name="company_website"
                type="text"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="template-email">Email Address *</Label>
              <Input
                id="template-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="min-h-[44px]"
              />
            </div>

            <div>
              <Label htmlFor="template-name">First Name (Optional)</Label>
              <Input
                id="template-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="min-h-[44px]"
              />
            </div>

            <TurnstileWidget onTokenChange={setTurnstileToken} />

            <Button
              type="submit"
              className="w-full min-h-[44px]"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Get Free Template
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
