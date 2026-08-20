"use client";

import { useState, useEffect, useCallback, Suspense } from"react";
import { useSearchParams } from"next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Separator } from"@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from"@/components/ui/dialog";
import { CreditCard, Calendar, Users, Zap, Check, AlertTriangle } from"lucide-react";
import { billingService, type BillingStatus } from"@/services/billingService";
import { getMemberLimitDisplayText } from"@/utils/memberUtils";
import { UpgradeModal } from"@/components/billing/UpgradeModal";
import { ErrorHandler } from"@/lib/errorHandler";
import { useToast } from"@/hooks/useToast";
import { calculateAnnualSavings, calculatePlanAnnualSavings, getPricingPlan } from"@/lib/pricing";

function BillingContent() {
  const searchParams = useSearchParams();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<string>("Grow");
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState<string>("monthly");
  const [billingFrequency, setBillingFrequency] = useState<'monthly' |'annual'>('monthly');
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const toast = useToast();

  const loadBillingStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const status = await billingService.getBillingStatus();
      setBillingStatus(status);
    } catch (error) {
      setHasError(true);
      const apiError = ErrorHandler.handleBillingError(error,'loading billing status');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingStatus();
    
    // Check for upgrade parameters from signup flow - only run this logic once
    const upgrade = searchParams?.get('upgrade');
    const source = searchParams?.get('source');
    
    if (upgrade ==='grow' && source ==='signup') {
      setWelcomeMessage('Welcome to GatherGrove! Complete your Grow plan upgrade to unlock all features.');
      // Show upgrade modal after a short delay to ensure billing status is loaded
      setTimeout(() => {
        setShowUpgradeModal(true);
      }, 1000);
    }
    // Only run on mount, ignore searchParams changes to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelSubscription = async () => {
    setShowCancelModal(false);
    
    try {
      setIsCancelling(true);
      await billingService.cancelSubscription();
      toast.success('Subscription cancelled successfully');
      await loadBillingStatus();
    } catch (error) {
      const apiError = ErrorHandler.handleBillingError(error,'cancelling subscription');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    loadBillingStatus();
    toast.success(`Successfully upgraded to ${upgradeTargetTier} tier!`);
  };


  const handleOpenBillingPortal = async () => {
    try {
      setIsOpeningPortal(true);
      const session = await billingService.createCustomerPortalSession();
      window.location.href = session.url;
    } catch (error) {
      const apiError = ErrorHandler.handleBillingError(error,'opening billing portal');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>
        <div data-testid="loading-billing" className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!billingStatus && hasError) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p data-testid="error-billing" className="text-center text-destructive">
              Failed to load billing information. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!billingStatus && !hasError) {
    // Still loading, continue showing loading state
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>
        <div data-testid="loading-billing" className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }



  // Generate plans based on billing frequency
  const growPlan = getPricingPlan('grow');
  const expandPlan = getPricingPlan('unlimited');
  const getAllPlans = () => [
    {
      name:"Grow",
      tier:"Grow",
      price:`$${growPlan.monthlyPrice}`,
      period:"/month",
      memberLimit: growPlan.memberLimit,

      billingCycle:"monthly",
      badge:"Most Popular",
      popular: true,
      features: ["Up to 200 members","Up to 3 admin users","3,000 emails/month","Community chat feature","Mobile app access (iOS & Android)","Push notifications","Digital membership cards","Custom member fields (up to 10)","Member privacy controls","Advanced analytics & reporting","Priority support","No additional payment processing fees","30-day free trial included"
      ],
      current: billingStatus?.currentTier ==="Grow" && (billingStatus?.billingCycle ==="monthly" || !billingStatus?.billingCycle)
    },
    {
      name:"Grow",
      tier:"Grow",
      price:`$${growPlan.annualPrice.toLocaleString()}`,
      period:"/year",
      memberLimit: growPlan.memberLimit,

      billingCycle:"annual",
      badge: `Save ${calculateAnnualSavings(growPlan.monthlyPrice, growPlan.annualPrice)}%`,
      savings: calculateAnnualSavings(growPlan.monthlyPrice, growPlan.annualPrice),
      recommended: true,
      features: ["Up to 200 members","Up to 3 admin users","3,000 emails/month","Community chat feature","Mobile app access (iOS & Android)","Push notifications","Digital membership cards","Custom member fields (up to 10)","Member privacy controls","Advanced analytics & reporting","Priority support","No additional payment processing fees","30-day free trial included"
      ],
      current: billingStatus?.currentTier ==="Grow" && billingStatus?.billingCycle ==="annual"
    },
    {
      name:"Expand",
      tier:"Unlimited",
      price:`$${expandPlan.monthlyPrice}`,
      period:"/month",
      memberLimit: expandPlan.memberLimit,

      billingCycle:"monthly",
      badge:"More Room",
      highlight: true,
      features: ["Up to 2,000 members","Unlimited admin users","50,000 emails/month","Unlimited events and RSVPs","Unlimited custom member fields","Advanced automation features","Custom integrations & API access","White-label options","Custom reporting & analytics","No additional payment processing fees","30-day free trial included"
      ],
      current: (billingStatus?.currentTier ==="Expand" || billingStatus?.currentTier ==="Unlimited") && (billingStatus?.billingCycle ==="monthly" || !billingStatus?.billingCycle)
    },
    {
      name:"Expand",
      tier:"Unlimited",
      price:`$${expandPlan.annualPrice.toLocaleString()}`,
      period:"/year",
      memberLimit: expandPlan.memberLimit,

      billingCycle:"annual",
      badge: `Save ${calculateAnnualSavings(expandPlan.monthlyPrice, expandPlan.annualPrice)}%`,
      savings: calculateAnnualSavings(expandPlan.monthlyPrice, expandPlan.annualPrice),
      enterprise: true,
      features: ["Up to 2,000 members","Unlimited admin users","50,000 emails/month","Unlimited events and RSVPs","Unlimited custom member fields","Advanced automation features","Custom integrations & API access","White-label options","Custom reporting & analytics","No additional payment processing fees","SLA guarantees","Premium support","30-day free trial included"
      ],
      current: (billingStatus?.currentTier ==="Expand" || billingStatus?.currentTier ==="Unlimited") && billingStatus?.billingCycle ==="annual"
    }
  ];

  // Filter plans based on billing frequency
  const plans = getAllPlans().filter(plan => plan.billingCycle === billingFrequency);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Welcome message for new Grow plan users */}
      {welcomeMessage && (
        <Card className="glass-soft border-success/30 bg-gradient-to-r from-success/5 to-success/10   shadow-lg hover:glass transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-success/20 to-success/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Zap className="h-5 w-5 text-success" />
                </div>
              </div>
              <div>
                <p className="text-success-foreground font-medium">{welcomeMessage}</p>
                <p className="text-success-foreground/80 text-sm mt-1">
                  Ready to add mobile apps and more room for members?
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWelcomeMessage(null)}
                  className="text-success-foreground hover:text-success-foreground/80"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={() => {
                    setUpgradeTargetTier("Grow");
                    setUpgradeBillingCycle("monthly");
                    setShowUpgradeModal(true);
                    setWelcomeMessage(null);
                  }}
                  className="bg-success hover:bg-success/90"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(billingStatus?.trialStatus ==='trialing' ||
        billingStatus?.accountLocked) && (
        <Card className={`border ${billingStatus?.accountLocked ?'border-destructive/40' :'border-primary/30'}`}>
          <CardHeader>
            <CardTitle>
              {billingStatus?.accountLocked
                ?'Trial ended - action required'
                :'Your trial is active'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billingStatus?.trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                Trial ends on {new Date(billingStatus.trialEndsAt).toLocaleDateString()}.
              </p>
            )}
            {(billingStatus?.trialStatus ==='trialing' || billingStatus?.accountLocked) && (
              <Button
                variant={billingStatus?.accountLocked ?'destructive' :'default'}
                onClick={handleOpenBillingPortal}
                disabled={isOpeningPortal}
                data-testid="button-open-billing-portal"
              >
                {isOpeningPortal ?'Opening...' : billingStatus?.accountLocked ?'Add payment to unlock' :'Manage billing'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card data-testid="card-billing-status" className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <span>Current Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold">{billingStatus?.currentTier} Plan</span>
                <Badge 
                  variant={billingStatus?.hasActiveSubscription ?"default" :"secondary"}
                  data-testid="badge-subscription-status"
                >
                  {billingStatus?.hasActiveSubscription
                    ?"Active"
                    : billingStatus?.trialStatus ==='trialing'
                    ?"Trial"
                    : billingStatus?.accountLocked
                    ?"Locked"
                    :"Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {billingStatus?.memberCount} of {billingStatus?.memberLimit != null ? getMemberLimitDisplayText(billingStatus.memberLimit) :'—'} members
              </p>
              {billingStatus?.billingCycle && (
                <p className="text-xs text-muted-foreground mt-1">
                  Billing cycle: {billingStatus?.billingCycle}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {billingStatus?.currentTier ==="Grow" ?
                   (billingStatus?.billingCycle ==="annual" ?"$290" :"$29") :
                 (billingStatus?.currentTier ==="Expand" || billingStatus?.currentTier ==="Unlimited") ?
                   (billingStatus?.billingCycle ==="annual" ?"$2,000" :"$200") :"$29"}
              </div>
              {billingStatus?.currentTier && (
                <div className="text-sm text-muted-foreground">
                  /{billingStatus?.billingCycle ==="annual" ?"year" :"month"}
                </div>
              )}
            </div>
          </div>

          {billingStatus?.hasActiveSubscription && billingStatus?.nextBillingDate && (
            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Next billing date: {billingStatus?.nextBillingDate ? new Date(billingStatus.nextBillingDate).toLocaleDateString() :'N/A'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Available Plans</h2>
          
          {/* Billing Frequency Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Monthly</span>
            <div
              className="relative inline-flex items-center justify-between w-16 h-8 bg-muted rounded-full cursor-pointer transition-colors duration-200"
              onClick={() => {
                setBillingFrequency(billingFrequency ==='monthly' ?'annual' :'monthly');
              }}
            >
              <div
                className={`absolute w-6 h-6 bg-background rounded-full shadow-md transition-transform duration-200 ${
                  billingFrequency ==='annual' ?'transform translate-x-8' :''
                }`}
              />
            </div>
            <span className="text-sm font-medium">Annual</span>
            <span className="text-xs bg-success/10  text-success-foreground px-2 py-1 rounded-full min-w-[120px] text-center">
              {billingFrequency ==='annual' ? `Save ${calculatePlanAnnualSavings(growPlan)}%` :'Pay monthly'}
            </span>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <Card 
              key={`${plan.tier}-${plan.billingCycle}-${index}`} 
              className={`relative glass border-border/50 hover:glass-strong transition-all duration-300 ${
                plan.current ?'ring-2 ring-primary/50 shadow-xl glass-strong' :
                plan.popular ?'ring-2 ring-success/40 shadow-xl glass-strong border-success/30' :
                plan.recommended ?'ring-2 ring-success/40 shadow-xl glass-strong border-success/30' :
                plan.highlight ?'ring-2 ring-secondary/40 shadow-xl glass-strong border-secondary/30' :'shadow-lg hover:shadow-xl'
              }`}
              data-testid={`card-plan-${plan.tier.toLowerCase()}-${plan.billingCycle}`}
            >
              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="glass-strong bg-gradient-to-r from-primary to-success text-white shadow-lg border-primary/30" data-testid="badge-current-plan">
                    Current Plan
                  </Badge>
                </div>
              )}
              {plan.popular && !plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="glass-strong bg-gradient-to-r from-success to-success/80 text-white shadow-lg border-success/30">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              {plan.recommended && !plan.current && !plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="glass-strong bg-gradient-to-r from-success to-success/80 text-white shadow-lg border-success/30">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              {plan.highlight && !plan.current && !plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="glass-strong bg-gradient-to-r from-secondary to-secondary/80 text-white shadow-lg border-secondary/30">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              {plan.enterprise && !plan.current && !plan.popular && !plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="glass-strong bg-gradient-to-r from-success to-success/80 text-white shadow-lg border-success/30">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              {plan.savings && !plan.current && !plan.popular && !plan.highlight && !plan.enterprise && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="glass-strong bg-gradient-to-r from-success to-success/80 text-white shadow-lg border-success/30">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              {plan.badge && !plan.current && !plan.popular && !plan.highlight && !plan.enterprise && !plan.savings && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="glass-strong bg-gradient-to-r from-muted-foreground to-muted-foreground/80 text-white shadow-lg border-muted-foreground/30">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{plan.name}</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{plan.price}</div>
                    {plan.period && <div className="text-sm text-muted-foreground">{plan.period}</div>}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {typeof plan.memberLimit ==='string' ? plan.memberLimit : `Up to ${plan.memberLimit}`} members
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">
                    No platform fees on payments
                  </span>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Features included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={`feature-${index}-${feature.substring(0, 30)}`} className="flex items-center gap-2 text-sm">
                        <Check className="h-3 w-3 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  {!plan.current && billingStatus?.canUpgrade && (
                    <Button
                      className={`w-full ${
                        plan.popular ?'bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 shadow-lg hover:shadow-xl' :
                        plan.highlight ?'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-lg hover:shadow-xl' :
                        plan.savings ?'bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 shadow-lg hover:shadow-xl' :''
                      }`}
                      onClick={() => {
                        setUpgradeTargetTier(plan.tier);
                        setUpgradeBillingCycle(plan.billingCycle);
                        setShowUpgradeModal(true);
                      }}
                      data-testid={`button-upgrade-${plan.tier.toLowerCase()}-${plan.billingCycle}`}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {plan.tier ==="Grow" ?
                        (plan.billingCycle ==="annual" ?"Get Annual" :"Get Monthly") :
                       plan.tier ==="Unlimited" ?
                        (plan.billingCycle ==="annual" ?"Get Annual" :"Get Expand") :'Upgrade'}
                    </Button>
                  )}
                  {plan.current && (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={handleUpgradeSuccess}
          targetTier={upgradeTargetTier}
          billingCycle={upgradeBillingCycle}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-md glass-strong border-border/50 backdrop-blur-xl shadow-2xl" data-testid="modal-cancel-confirmation">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? Your account access may be restricted until billing is reactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              data-testid="button-cancel-confirmation-cancel"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              data-testid="button-cancel-confirmation-confirm"
            >
              {isCancelling ?"Cancelling..." :"Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillingFallback() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Loading billing information...
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingFallback />}>
      <BillingContent />
    </Suspense>
  );
} 
