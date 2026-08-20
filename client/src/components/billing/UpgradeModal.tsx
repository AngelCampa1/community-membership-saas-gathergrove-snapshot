"use client";

import { useState, useEffect } from"react";
import { trackEvent } from"@/services/frontendTrackingService";
import { loadStripe } from"@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from"@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Separator } from"@/components/ui/separator";
import { Check, CreditCard, Zap, AlertCircle, Crown, Tag, Loader2, CheckCircle } from"lucide-react";
import { billingService, PromotionInfo, ActivePromotionResponse } from"@/services/billingService";
import { logger } from"@/lib/logger";
import { CHART_SEMANTIC } from"@/utils/chartColors";
import { Input } from"@/components/ui/input";

// Debug: Log the Stripe key only in development
if (process.env.NODE_ENV ==='development') {
  logger.debug('billing','Stripe configuration check', {
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    envVarsPresent: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')),
    config: {
      STRIPE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_PRICE: !!process.env.NEXT_PUBLIC_STRIPE_GROW_PRICE_ID,
      API_URL: process.env.NEXT_PUBLIC_API_URL
    }
  });
}

// Initialize Stripe with proper environment variable only
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Helper function to get price ID based on tier and billing cycle
function getPriceId(targetTier: string, billingCycle: string): string {
  const key = `${targetTier.toUpperCase()}_${billingCycle.toUpperCase()}`;
  
  switch (key) {
    case'GROW_MONTHLY':
      return process.env.NEXT_PUBLIC_STRIPE_GROW_MONTHLY_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_GROW_PRICE_ID ||'';
    case'GROW_ANNUAL':
      return process.env.NEXT_PUBLIC_STRIPE_GROW_ANNUAL_PRICE_ID ||'';
    case'UNLIMITED_MONTHLY':
      return process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_MONTHLY_PRICE_ID ||'';
    case'UNLIMITED_ANNUAL':
      return process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_ANNUAL_PRICE_ID ||'';
    default:
      return process.env.NEXT_PUBLIC_STRIPE_GROW_MONTHLY_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_GROW_PRICE_ID ||'';
  }
}

// Helper function to get plan details
function getPlanDetails(targetTier: string, billingCycle: string) {
  const tier = targetTier.toLowerCase();
  const cycle = billingCycle.toLowerCase();
  
  const prices = {
    grow: { monthly: 29, annual: 290 },
    unlimited: { monthly: 200, annual: 2000 }
  };
  
  const features = {
    grow: ["Up to 200 members","Advanced member management","Advanced event features","Analytics & financial reporting","Community chat access","Mobile app access (iOS & Android)","Push notifications","3,000 emails/month","Custom branding","Priority support","No additional payment processing fees"
    ],
    unlimited: ["Everything in Grow, plus:","Up to 2,000 members","Unlimited admin users","50,000 emails/month","Unlimited events and RSVPs","Unlimited custom fields","Advanced automation features","Custom integrations & API access","Dedicated account manager","White-label options","Custom reporting & analytics","No additional payment processing fees"
    ]
  };
  
  return {
    price: prices[tier as keyof typeof prices]?.[cycle as keyof typeof prices.grow] || 20,
    features: features[tier as keyof typeof features] || features.grow,
    displayName: `${tier === 'unlimited' ? 'Expand' : tier.charAt(0).toUpperCase() + tier.slice(1)} ${cycle.charAt(0).toUpperCase() + cycle.slice(1)}`
  };
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetTier?: string;
  billingCycle?: string;
}

interface PaymentFormProps {
  onSuccess: () => void;
  onClose: () => void;
  targetTier: string;
  billingCycle: string;
  priceId: string;
  activePromotion?: PromotionInfo;
}

function PaymentForm({ onSuccess, onClose, targetTier, billingCycle, priceId, activePromotion }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [validatedPromotion, setValidatedPromotion] = useState<PromotionInfo | null>(activePromotion || null);
  const [showPromoInput, setShowPromoInput] = useState(!activePromotion);

  // Debug: Log Stripe and Elements state in development only
  useEffect(() => {
    if (process.env.NODE_ENV ==='development') {
      logger.debug('billing','Stripe initialization status', {
        stripeLoaded: !!stripe,
        elementsLoaded: !!elements
      });
    }
    setStripeLoaded(!!stripe && !!elements);
  }, [stripe, elements]);

  // Validate promo code
  const handleValidatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    setPromoCodeError(null);

    try {
      const result = await billingService.validatePromoCode(promoCode.trim());
      if (result.isValid && result.promotion) {
        setValidatedPromotion(result.promotion);
        setPromoCodeError(null);
      } else {
        setPromoCodeError(result.errorMessage ||'Invalid promo code');
        setValidatedPromotion(null);
      }
    } catch (error) {
      logger.error('billing','Promo code validation error', { error });
      setPromoCodeError('Failed to validate promo code');
      setValidatedPromotion(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Remove applied promo
  const handleRemovePromo = () => {
    setValidatedPromotion(null);
    setPromoCode('');
    setPromoCodeError(null);
    setShowPromoInput(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!priceId) {
      setPaymentError('Selected plan is not available. Please contact support.');
      return;
    }

    if (!stripe || !elements) {
      setPaymentError("Payment system not loaded. Please try again.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    if (typeof window !=='undefined') {
      trackEvent('upgrade_payment_started', { category:'ecommerce', customParameters: { plan: targetTier } });
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError("Payment form not loaded properly");
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type:'card',
        card: cardElement,
      });

      if (methodError) {
        setPaymentError(methodError.message ||"Failed to create payment method");
        setIsProcessing(false);
        return;
      }

      if (!paymentMethod) {
        setPaymentError("Failed to create payment method");
        setIsProcessing(false);
        return;
      }

      // Call our backend API to upgrade subscription
      const response = await billingService.upgradeSubscription({
        planId: priceId,
        paymentMethodId: paymentMethod.id,
        targetTier: targetTier,
        billingCycle: billingCycle,
        promoCode: validatedPromotion?.promoCode || undefined,
      });

      if (response.status ==="active" || response.status ==="trialing" || response.status ==="succeeded") {
        if (typeof window !=='undefined') {
          trackEvent('upgrade_payment_completed', { category:'ecommerce', customParameters: { plan: targetTier, value: getPlanDetails(targetTier, billingCycle).price } });
        }
        onSuccess();
      } else {
        const failMsg = response.message ||"Subscription upgrade failed";
        if (typeof window !=='undefined') {
          trackEvent('upgrade_payment_failed', { category:'ecommerce', customParameters: { error: failMsg } });
        }
        setPaymentError(failMsg);
      }
    } catch (error) {
      logger.error('billing','Payment processing error', { error });
      const errMsg = error instanceof Error ? error.message :"An unexpected error occurred";
      if (typeof window !=='undefined') {
        trackEvent('upgrade_payment_failed', { category:'ecommerce', customParameters: { error: errMsg } });
      }
      setPaymentError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize:'16px',
        color:'#374151',
        backgroundColor:'transparent',
        fontFamily:'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,"Segoe UI", Roboto,"Helvetica Neue", Arial,"Noto Sans", sans-serif','::placeholder': {
          color:'#6b7280',
        },
        iconColor:'#6b7280',
      },
      invalid: {
        color: CHART_SEMANTIC.negative,
        iconColor: CHART_SEMANTIC.negative,
      },
      complete: {
        color: CHART_SEMANTIC.positive,
        iconColor: CHART_SEMANTIC.positive,
      },
    },
    hidePostalCode: false,
  };

  if (!stripeLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4" />
            Payment Information
          </h3>
          <div className="border rounded-md p-4 bg-background border-border">
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm">Loading payment form...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="button-cancel-upgrade"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={true}
            className="flex-1"
            data-testid="button-confirm-upgrade"
          >
            <Zap className="h-4 w-4 mr-2" />
            Loading...
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-emerald-500/20">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          Payment Information
        </h3>
        <div className="border rounded-lg p-4 bg-gradient-to-br from-background/50 to-muted/20 border-border/70 min-h-[50px] backdrop-blur-sm">
          <CardElement
            options={cardElementOptions}
            onReady={() => {
              if (process.env.NODE_ENV ==='development') {
                logger.debug('billing','CardElement ready');
              }
            }}
            onChange={(event) => {
              if (process.env.NODE_ENV ==='development') {
                logger.debug('billing','CardElement validation', {
                  valid: event.complete,
                  hasError: !!event.error
                });
              }
              if (event.error) {
                setPaymentError(event.error.message);
              } else {
                setPaymentError(null);
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your payment information is secure and encrypted.
        </p>

        {/* Debug info for development */}
        {process.env.NODE_ENV ==='development' && (
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>Debug: Stripe Key Available: {!!stripePublishableKey ?'Yes' :'No'}</p>
            <p>Debug: Stripe Loaded: {!!stripe ?'Yes' :'No'}</p>
            <p>Debug: Elements Loaded: {!!elements ?'Yes' :'No'}</p>
          </div>
        )}
      </div>

      {/* Promo Code Section */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2 text-foreground">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Tag className="h-4 w-4 text-amber-600" />
          </div>
          Promo Code
        </h3>

        {/* Show validated promotion */}
        {validatedPromotion && !showPromoInput && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <div>
                  <p className="font-medium text-success">{validatedPromotion.name}</p>
                  <p className="text-sm text-success/80">{validatedPromotion.discountDescription}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemovePromo}
                className="text-muted-foreground hover:text-destructive h-8 px-2"
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Promo code input */}
        {showPromoInput && !validatedPromotion && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoCodeError(null);
                }}
                className="flex-1"
                data-testid="input-promo-code"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleValidatePromoCode}
                disabled={isValidatingPromo || !promoCode.trim()}
                className="min-w-[80px]"
                data-testid="button-apply-promo"
              >
                {isValidatingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : ('Apply'
                )}
              </Button>
            </div>
            {promoCodeError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {promoCodeError}
              </p>
            )}
          </div>
        )}

        {/* Auto-applied promotion notice */}
        {activePromotion && !showPromoInput && validatedPromotion?.promotionId === activePromotion.promotionId && (
          <p className="text-xs text-muted-foreground">
            This promotion was automatically applied to your order.
          </p>
        )}
      </div>

      {paymentError && (
        <div 
          data-testid="error-payment" 
          className="p-3 bg-destructive/10 border border-destructive/20 rounded-md"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{paymentError}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          data-testid="button-cancel-upgrade"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border-0"
          data-testid="button-confirm-upgrade"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function UpgradeModal({ isOpen, onClose, onSuccess, targetTier ="Grow", billingCycle ="monthly" }: UpgradeModalProps) {
  // Get plan details based on props
  const planDetails = getPlanDetails(targetTier, billingCycle);
  const priceId = getPriceId(targetTier, billingCycle);

  // Fetch active promotion when modal opens
  const [activePromotion, setActivePromotion] = useState<ActivePromotionResponse | null>(null);
  const [, setIsLoadingPromo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !=='undefined') {
        trackEvent('upgrade_modal_opened', { category:'ecommerce', customParameters: { source:'billing_page' } });
      }
      setIsLoadingPromo(true);
      billingService.getActivePromotion()
        .then(response => {
          setActivePromotion(response);
          if (response.hasActivePromotion && response.promotion) {
            logger.info('billing','Active promotion found', {
              name: response.promotion.name,
              remaining: response.redemptionsRemaining
            });
          }
        })
        .catch(error => {
          logger.error('billing','Failed to fetch active promotion', { error });
        })
        .finally(() => setIsLoadingPromo(false));
    }
  }, [isOpen]);

  // Check if Stripe is available
  if (!stripePublishableKey) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-upgrade">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Payment Configuration Error
            </DialogTitle>
            <DialogDescription>
              Payment processing is not properly configured. Please contact support for assistance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              Stripe configuration is missing. Please check your environment variables.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-strong border-border/50 shadow-2xl backdrop-blur-xl" data-testid="modal-upgrade">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
            Upgrade to {planDetails.displayName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {targetTier.toLowerCase() ==='unlimited'
              ?"Get room for 2,000 members and 50,000 emails each month."
              :"Get more members and tools for your club."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Active Promotion Banner */}
          {activePromotion?.hasActivePromotion && activePromotion.promotion && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/20">
                  <Tag className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-700">
                    {activePromotion.promotion.name}
                  </p>
                  <p className="text-sm text-amber-600/80">
                    {activePromotion.promotion.discountDescription}
                    {activePromotion.redemptionsRemaining !== undefined && activePromotion.redemptionsRemaining !== null && (
                      <span className="ml-2 text-xs">
                        ({activePromotion.redemptionsRemaining} remaining)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Summary */}
          <Card className="glass border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20">
                    <Crown className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xl font-bold">{planDetails.displayName}</span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                    ${planDetails.price}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    /{billingCycle}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                  Everything you get:
                </h4>
                <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
                  {planDetails.features.map((feature, index) => (
                    <div key={`feature-${index}-${feature.substring(0, 30)}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5  transition-all duration-200 group">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5 group-hover:text-success/80 transition-colors duration-200" />
                      <span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors duration-200">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Payment Form */}
          <Elements stripe={stripePromise}>
            <PaymentForm
              onSuccess={onSuccess}
              onClose={onClose}
              targetTier={targetTier}
              billingCycle={billingCycle}
              priceId={priceId}
              activePromotion={activePromotion?.hasActivePromotion ? activePromotion.promotion : undefined}
            />
          </Elements>

          <p className="text-xs text-muted-foreground text-center">
            Your subscription will auto-renew {billingCycle}. You can cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
