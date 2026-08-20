"use client";

import { useState, useEffect, useRef } from 'react';
import { trackEvent } from '@/services/frontendTrackingService';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Calendar, Mail, CheckCircle, BookOpen, ListChecks, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TurnstileWidget } from './TurnstileWidget';

type MagnetType = 'guide' | 'checklist' | 'template';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailCapture?: (email: string, name: string, magnetType?: MagnetType, companyWebsite?: string, turnstileToken?: string) => void;
  onAnalytics?: (event: string, data?: Record<string, string | number | boolean>) => void;
  onDownload?: (magnetType: MagnetType) => void;
  variant?: 'lead-magnet' | 'consultation' | 'newsletter';
}

const magnetConfigs: Record<MagnetType, {
  title: string;
  description: string;
  icon: React.ElementType;
  benefits: string[];
  buttonText: string;
}> = {
  guide: {
    title: 'Membership Management Guide',
    description: 'Step-by-step setup, member engagement strategies, and growth tactics for any club.',
    icon: BookOpen,
    benefits: [
      'Step-by-step setup instructions',
      'Member engagement strategies',
      'Financial management tips',
      'Growth and retention tactics',
    ],
    buttonText: 'Get Free Guide',
  },
  checklist: {
    title: 'Organization Management Checklist',
    description: 'Monthly tasks, onboarding steps, seasonal planning, and financial review points.',
    icon: ListChecks,
    benefits: [
      'Monthly management tasks',
      'Event planning checklist',
      'Member onboarding steps',
      'Seasonal planning guide',
    ],
    buttonText: 'Get Free Checklist',
  },
  template: {
    title: 'Templates Bundle',
    description: 'Ready-to-use forms, meeting agendas, financial sheets, and communication templates.',
    icon: FileText,
    benefits: [
      'Member application forms',
      'Meeting agenda formats',
      'Financial tracking sheets',
      'Communication templates',
    ],
    buttonText: 'Get Free Templates',
  },
};

export function ExitIntentModal({
  isOpen,
  onClose,
  onEmailCapture,
  onAnalytics,
  onDownload,
  variant = 'lead-magnet',
}: ExitIntentModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedMagnet, setSelectedMagnet] = useState<MagnetType | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const isSelectionStep = variant === 'lead-magnet' && selectedMagnet === null && !isSuccess;

  // Focus management
  useEffect(() => {
    if (isOpen && !isSelectionStep && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen, isSelectionStep]);

  // Keyboard navigation + scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        onAnalytics?.('exit_intent_modal_dismissed', { method: 'escape' });
        if (typeof window !== 'undefined') {
          trackEvent('exit_intent_dismissed', { category: 'engagement', customParameters: { variant } });
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onAnalytics]);

  // Track modal view
  useEffect(() => {
    if (isOpen) {
      onAnalytics?.('exit_intent_modal_shown', { variant });
      if (typeof window !== 'undefined') {
        trackEvent('exit_intent_shown', { category: 'engagement', customParameters: { variant } });
      }
    }
  }, [isOpen, variant, onAnalytics]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setName('');
      setError('');
      setIsSuccess(false);
      setSelectedMagnet(null);
      setCompanyWebsite('');
      setTurnstileToken('');
    }
  }, [isOpen]);

  const handleSelectMagnet = (type: MagnetType) => {
    setSelectedMagnet(type);
    onAnalytics?.('exit_intent_magnet_selected', { variant, magnetType: type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    onAnalytics?.('exit_intent_form_submitted', { variant, magnetType: selectedMagnet ?? '' });

    try {
      await onEmailCapture?.(email.trim(), name.trim(), selectedMagnet ?? undefined, companyWebsite, turnstileToken);
      setIsSuccess(true);
      onAnalytics?.('exit_intent_conversion', { variant, magnetType: selectedMagnet ?? '' });
      if (typeof window !== 'undefined') {
        trackEvent('exit_intent_email_captured', { category: 'engagement', customParameters: { variant } });
      }
      if (selectedMagnet) {
        onDownload?.(selectedMagnet);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      onAnalytics?.('exit_intent_form_error', {
        variant,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
      onAnalytics?.('exit_intent_modal_dismissed', { method: 'backdrop' });
      if (typeof window !== 'undefined') {
        trackEvent('exit_intent_dismissed', { category: 'engagement', customParameters: { variant } });
      }
    }
  };

  const getNonMagnetContent = () => {
    switch (variant) {
      case 'consultation':
        return {
          title: "Before You Go \u2014 Let's Chat!",
          subtitle: 'Get a free 15-minute club setup consultation',
          description: 'Talk to our club management expert and get personalized advice for your situation.',
          buttonText: 'Schedule Free Call',
          icon: Calendar,
          benefits: [
            'Personalized club assessment',
            'Custom setup recommendations',
            'Best practices for your club type',
            'Q&A with our experts',
          ],
        };
      case 'newsletter':
        return {
          title: "Don't Miss Club Management Tips",
          subtitle: 'Get weekly insights delivered to your inbox',
          description: 'Exclusive strategies, templates, and case studies every week.',
          buttonText: 'Subscribe Now',
          icon: Mail,
          benefits: [
            'Weekly club management tips',
            'Exclusive templates and guides',
            'Member engagement strategies',
            'Success stories from other clubs',
          ],
        };
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const nonMagnetContent = getNonMagnetContent();
  const activeMagnet = selectedMagnet ? magnetConfigs[selectedMagnet] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        aria-describedby="exit-intent-description"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-primary/20 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => {
                onClose();
                onAnalytics?.('exit_intent_modal_dismissed', { method: 'close_button' });
                if (typeof window !== 'undefined') {
                  trackEvent('exit_intent_dismissed', { category: 'engagement', customParameters: { variant } });
                }
              }}
              className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* === LEAD MAGNET: SELECTION STEP === */}
            {isSelectionStep && (
              <>
                <CardHeader className="text-center pb-4">
                  <CardTitle id="exit-intent-title" className="text-xl font-bold pr-8">
                    Before you go \u2014 grab a free resource
                  </CardTitle>
                  <CardDescription id="exit-intent-description" className="text-base">
                    Which one would help your club most?
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-6">
                  {(Object.entries(magnetConfigs) as [MagnetType, typeof magnetConfigs[MagnetType]][]).map(
                    ([type, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => handleSelectMagnet(type)}
                          className="w-full text-left flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{cfg.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {cfg.description}
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Free. No credit card.{' '}
                    <a href="/privacy" className="underline hover:no-underline">
                      Privacy Policy
                    </a>
                  </p>
                </CardContent>
              </>
            )}

            {/* === LEAD MAGNET: EMAIL FORM STEP === */}
            {variant === 'lead-magnet' && selectedMagnet !== null && !isSuccess && (
              <>
                <CardHeader className="pb-4">
                  <button
                    onClick={() => setSelectedMagnet(null)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 -mt-1"
                    aria-label="Back to resource selection"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    {activeMagnet && <activeMagnet.icon className="w-8 h-8 text-primary" />}
                  </div>

                  <CardTitle id="exit-intent-title" className="text-xl font-bold text-center">
                    Get Your Free {activeMagnet?.title}
                  </CardTitle>

                  <CardDescription id="exit-intent-description" className="text-center text-base">
                    Enter your email and we&apos;ll send it right over.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pb-6">
                  <div className="space-y-2">
                    {activeMagnet?.benefits.map((benefit, i) => (
                      <div key={`b-${i}`} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="sr-only" aria-hidden="true">
                      <label htmlFor="exit-intent-company-website">Company website</label>
                      <input
                        id="exit-intent-company-website"
                        name="company_website"
                        type="text"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>
                    <Input
                      ref={firstInputRef}
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                      required
                    />
                    <Input
                      type="text"
                      placeholder="First name (optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full"
                    />

                    {error && (
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    )}

                    <TurnstileWidget onTokenChange={setTurnstileToken} />

                    <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                      {isSubmitting ? 'Sending...' : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          {activeMagnet?.buttonText ?? 'Get Free Resource'}
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center">
                    Your details stay private.{' '}
                    <a href="/privacy" className="underline hover:no-underline">
                      Privacy Policy
                    </a>
                  </p>
                </CardContent>
              </>
            )}

            {/* === CONSULTATION / NEWSLETTER VARIANTS === */}
            {nonMagnetContent && !isSuccess && (
              <>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <nonMagnetContent.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle id="exit-intent-title" className="text-xl font-bold">
                    {nonMagnetContent.title}
                  </CardTitle>
                  <CardDescription id="exit-intent-description" className="text-base">
                    {nonMagnetContent.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground text-center">
                    {nonMagnetContent.description}
                  </p>

                  <div className="space-y-2">
                    {nonMagnetContent.benefits.map((benefit, index) => (
                      <div key={`benefit-${index}`} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="sr-only" aria-hidden="true">
                      <label htmlFor="exit-intent-nonmagnet-company-website">Company website</label>
                      <input
                        id="exit-intent-nonmagnet-company-website"
                        name="company_website"
                        type="text"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>
                    {variant === 'consultation' && (
                      <Input
                        ref={firstInputRef}
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full"
                        required
                      />
                    )}
                    <Input
                      ref={variant !== 'consultation' ? firstInputRef : undefined}
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                      required
                    />

                    {error && (
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    )}

                    <TurnstileWidget onTokenChange={setTurnstileToken} />

                    <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                      {isSubmitting ? 'Processing...' : nonMagnetContent.buttonText}
                    </Button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center">
                    Your details stay private.{' '}
                    <a href="/privacy" className="underline hover:no-underline">
                      Privacy Policy
                    </a>
                  </p>
                </CardContent>
              </>
            )}

            {/* === SUCCESS STATE === */}
            {isSuccess && (
              <CardContent className="text-center space-y-4 py-12">
                <div className="mx-auto mb-4 p-3 bg-success/10 rounded-full w-fit">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>

                <h3 className="text-lg font-semibold">
                  {variant === 'lead-magnet' ? 'Check Your Email!' :
                   variant === 'consultation' ? "We'll Be In Touch!" :
                   'Welcome Aboard!'}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {variant === 'lead-magnet'
                    ? `Your ${activeMagnet?.title ?? 'resource'} is on its way to your inbox.`
                    : variant === 'consultation'
                    ? "We'll contact you within 24 hours to schedule your free consultation."
                    : "You're now subscribed to our weekly club management tips."}
                </p>

                <Button onClick={onClose} variant="outline" className="mt-4">
                  Continue Browsing
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
