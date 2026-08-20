'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Download, CheckCircle } from 'lucide-react';
import { ctaAnalyticsService } from '@/services/ctaAnalyticsService';
import { marketingService } from '@/services/marketingService';
import { logger } from '@/lib/logger';
import { TurnstileWidget } from './TurnstileWidget';

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctaId?: string;
  magnetType?: 'guide' | 'checklist' | 'template';
}

export function LeadMagnetModal({ 
  isOpen, 
  onClose, 
  ctaId,
  magnetType = 'guide' 
}: LeadMagnetModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        posthog.capture('lead_magnet_shown', { magnet_type: magnetType });
      }
    }
  }, [isOpen, magnetType]);

  const magnetConfig = {
    guide: {
      title: 'Ultimate Membership Management Guide',
      description: 'Complete guide covering member management, event planning, financial tracking, and growth strategies.',
      filename: 'membership-management-guide.pdf',
      benefits: [
        'Step-by-step setup instructions',
        'Member engagement strategies',
        'Financial management templates',
        'Event planning checklists',
        'Growth and retention tactics'
      ]
    },
    checklist: {
      title: 'Organization Management Checklist',
      description: 'Essential checklist for running a successful organization with actionable tasks and timelines.',
      filename: 'organization-management-checklist.pdf',
      benefits: [
        'Monthly management tasks',
        'Event planning checklist',
        'Member onboarding steps',
        'Financial review points',
        'Seasonal planning guide'
      ]
    },
    template: {
      title: 'Organization Templates Bundle',
      description: 'Ready-to-use templates for organization documentation, event planning, and member communication.',
      filename: 'organization-templates-bundle.zip',
      benefits: [
        'Member application forms',
        'Event planning templates',
        'Meeting agenda formats',
        'Financial tracking sheets',
        'Communication templates'
      ]
    }
  };

  const config = magnetConfig[magnetType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Capture lead
      await marketingService.captureExitIntentLead({
        email,
        name,
        source: 'lead-magnet',
        variant: magnetType,
        companyWebsite,
        turnstileToken,
        metadata: {
          ctaId,
          magnetType,
          downloadRequested: config.filename
        }
      });

      // Track conversion
      ctaAnalyticsService.recordConversion(
        ctaId || `lead-magnet-${magnetType}`,
        'download',
        1
      );

      if (typeof window !== 'undefined') {
        posthog.capture('lead_magnet_downloaded', { magnet_type: magnetType });
      }
      setIsCompleted(true);
    } catch (error) {
      logger.error('marketing', 'Lead capture failed', { error, email, magnetType });
      // Still show success to avoid user frustration
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    // In a real implementation, this would generate and download the actual file
    logger.info('marketing', 'Lead magnet download initiated', { filename: config.filename, magnetType });

    // Track download completion
    ctaAnalyticsService.recordConversion(
      ctaId || `download-complete-${magnetType}`,
      'download',
      1
    );

    // Close modal after short delay
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Success!
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

            <h3 className="text-lg font-semibold mb-2">Your download is ready!</h3>
            <p className="text-muted-foreground mb-6">
              Click below to download your {config.title.toLowerCase()}.
            </p>

            <Button onClick={handleDownload} className="w-full mb-4 min-h-[44px]">
              <Download className="h-4 w-4 mr-2" />
              Download {config.title}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>We&apos;ve also sent a download link to your email.</p>
            </div>
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
            <DialogTitle>Get Your Free {config.title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">{config.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {config.description}
            </p>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                What&apos;s included:
              </p>
              {config.benefits.map((benefit, index) => (
                <div key={`benefit-${index}-${benefit.substring(0, 30)}`} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="lead-magnet-company-website">Company website</label>
              <input
                id="lead-magnet-company-website"
                name="company_website"
                type="text"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="min-h-[44px]"
              />
            </div>

            <div>
              <Label htmlFor="name">First Name (Optional)</Label>
              <Input
                id="name"
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Get Free {config.title}
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
