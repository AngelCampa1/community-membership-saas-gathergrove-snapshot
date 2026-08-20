'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { ctaAnalyticsService } from '@/services/ctaAnalyticsService';
import { marketingService } from '@/services/marketingService';
import { logger } from '@/lib/logger';
import { TurnstileWidget } from './TurnstileWidget';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctaId?: string;
}

export function ConsultationModal({ isOpen, onClose, ctaId }: ConsultationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    clubName: '',
    clubSize: '',
    primaryChallenge: '',
    preferredTime: '',
    message: '',
    companyWebsite: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://cal.com/your-team/gathergrove-15min';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Capture consultation request
      await marketingService.captureExitIntentLead({
        email: formData.email,
        name: formData.name,
        source: 'consultation',
        companyWebsite: formData.companyWebsite,
        turnstileToken,
        metadata: {
          ctaId,
          clubName: formData.clubName,
          clubSize: formData.clubSize,
          primaryChallenge: formData.primaryChallenge,
          preferredTime: formData.preferredTime,
          message: formData.message,
          requestType: 'consultation'
        }
      });

      // Track conversion
      ctaAnalyticsService.recordConversion(
        ctaId || 'consultation-request',
        'consultation',
        1
      );

      setIsCompleted(true);
    } catch (error) {
      logger.error('marketing', 'Consultation request failed', { error, ctaId, email: formData.email, clubName: formData.clubName });
      // Still show success to avoid user frustration
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Request Received!
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-success" />
            </div>

            <h3 className="text-lg font-semibold mb-2">We&apos;ll be in touch soon!</h3>
            <p className="text-muted-foreground mb-6">
              Our team will contact you within 24 hours to schedule your 15-minute consultation.
            </p>

            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg text-sm">
                <div className="font-medium">What to expect:</div>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• 15-minute focused discussion</li>
                  <li>• Tailored recommendations for your club</li>
                  <li>• No sales pressure - just helpful advice</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md text-sm font-medium min-h-[44px]"
                >
                  <Calendar className="h-4 w-4" />
                  Book on Calendar
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
                <Button onClick={onClose} variant="outline" className="w-full min-h-[44px]">
                  Continue Exploring
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Your Free Consultation
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
            {/* Benefits */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">15-Minute Expert Consultation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                <span>Personalized club management advice</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                <span>Custom implementation roadmap</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                <span>Platform walkthrough for your needs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                <span>No sales pressure - just helpful guidance</span>
              </div>
            </div>
          </div>

            {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="consultation-company-website">Company website</label>
              <input
                id="consultation-company-website"
                name="company_website"
                type="text"
                value={formData.companyWebsite}
                onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clubName">Club Name</Label>
                <Input
                  id="clubName"
                  type="text"
                  value={formData.clubName}
                  onChange={(e) => handleInputChange('clubName', e.target.value)}
                  placeholder="Your club's name"
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <Label htmlFor="clubSize">Club Size</Label>
                <Select onValueChange={(value) => handleInputChange('clubSize', value)}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="How many members?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 members</SelectItem>
                    <SelectItem value="11-25">11-25 members</SelectItem>
                    <SelectItem value="26-50">26-50 members</SelectItem>
                    <SelectItem value="51-100">51-100 members</SelectItem>
                    <SelectItem value="100+">100+ members</SelectItem>
                    <SelectItem value="planning">Still planning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="primaryChallenge">Primary Challenge</Label>
              <Select onValueChange={(value) => handleInputChange('primaryChallenge', value)}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="What's your biggest challenge?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member-management">Member management</SelectItem>
                  <SelectItem value="dues-collection">Dues collection</SelectItem>
                  <SelectItem value="event-planning">Event planning</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="growth">Growing membership</SelectItem>
                  <SelectItem value="organization">Getting organized</SelectItem>
                  <SelectItem value="technology">Technology adoption</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Select onValueChange={(value) => handleInputChange('preferredTime', value)}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="When works best for you?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                  <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                  <SelectItem value="flexible">I&apos;m flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Additional Information (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us more about your club or specific questions you have..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <TurnstileWidget onTokenChange={setTurnstileToken} />
              </div>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md text-sm font-medium min-h-[44px]"
              >
                <Calendar className="h-4 w-4" />
                Book on Calendar
                <ExternalLink className="h-3 w-3 opacity-80" />
              </a>
              <Button 
              type="submit" 
              className="w-full min-h-[44px]" 
              disabled={isSubmitting || !formData.name || !formData.email}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Free Consultation
                </>
              )}
            </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              We respect your time and privacy. No spam, just helpful advice.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
