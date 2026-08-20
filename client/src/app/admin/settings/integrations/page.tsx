'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, ExternalLink, AlertCircle, CreditCard } from "lucide-react";
import { stripeConnectService, StripeConnectStatusResponse, CountryInfo } from '@/services/stripeConnectService';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/errorHandler';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function IntegrationsContent() {
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showCountryDialog, setShowCountryDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    // Check if we're returning from Stripe Connect
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const refresh = urlParams.get('refresh');
    
    if (connected === 'true' || refresh === 'true') {
      // Redirect to the dues page with the same parameters
      // This handles the old Stripe Connect URLs that still point here
      window.location.replace(`/admin/dues?${urlParams.toString()}`);
      return;
    }
    
    loadStripeStatus();
  }, []);

  const loadStripeStatus = async () => {
    try {
      setIsLoading(true);
      const status = await stripeConnectService.getConnectStatus();
      setStripeStatus(status);
    } catch (error) {
      logger.error('integrations', 'Error loading Stripe status', { error });
      const apiError = ErrorHandler.handleApiError(error, { context: 'loading Stripe connection status' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await stripeConnectService.getSupportedCountries();
      setCountries(response.countries);
      // Select US as default if available
      const defaultCountry = response.countries.find(c => c.code === 'US')?.code || response.countries[0]?.code || '';
      setSelectedCountry(defaultCountry);
    } catch (error) {
      logger.error('integrations', 'Error loading countries', { error });
      toast.error('Failed to load supported countries');
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleConnectStripe = async () => {
    // First show country selection dialog
    if (!stripeStatus?.isConnected) {
      setShowCountryDialog(true);
      if (countries.length === 0) {
        await loadCountries();
      }
      return;
    }

    // If already connected, just get the link (for management)
    try {
      setIsConnecting(true);
      const response = await stripeConnectService.getConnectLink();
      
      // Check if this is a platform setup required response
      if (response.onboardingUrl.includes('status=platform_setup_required')) {
        toast.info("Payment system is currently being configured. Please try again later.", {
          duration: 5000
        });
        setIsConnecting(false);
        return;
      }
      
      // Redirect to Stripe Connect onboarding
      window.location.assign(response.onboardingUrl);
    } catch (error: unknown) {
      logger.error('integrations', 'Error connecting to Stripe', { error });

      // Check if this is a Stripe Connect setup error
      if (error && typeof error === 'object' && 'response' in error) {
        const errorObj = error as { response?: { status?: number; data?: { isConnectSetupRequired?: boolean; setupUrl?: string; error?: string; isRetryable?: boolean; actionRequired?: string; userMessage?: string } } };
        
        if (errorObj.response?.status === 503) {
          const data = errorObj.response.data;
          
          if (data?.isConnectSetupRequired) {
            const setupUrl = data.setupUrl;
            const message = data.error;
            
            toast.error(message || 'Stripe Connect setup required', {
              duration: 10000,
              action: {
                label: 'Setup Stripe Connect',
                onClick: () => window.open(setupUrl, '_blank')
              }
            });
          } else if (data?.actionRequired === 'platform_profile_setup') {
            // Platform profile setup - this is for the platform admin
            toast.error(data.userMessage || data.error || 'Payment system is being configured. Please try again later.', {
              duration: 8000
            });
          }
        } else if (errorObj.response?.status === 400) {
          const data = errorObj.response.data;
          
          if (data?.isRetryable) {
            toast.error(data.error || 'Failed to create payment account. Please try again.');
          } else {
            const apiError = ErrorHandler.handleBillingError(error, 'connecting to Stripe');
            ErrorHandler.showErrorToast(apiError);
          }
        } else {
          const apiError = ErrorHandler.handleBillingError(error, 'connecting to Stripe');
          ErrorHandler.showErrorToast(apiError);
        }
      } else {
        const apiError = ErrorHandler.handleBillingError(error, 'connecting to Stripe');
        ErrorHandler.showErrorToast(apiError);
      }
      setIsConnecting(false);
    }
  };

  const handleDisconnectStripe = async () => {
    try {
      setIsDisconnecting(true);
      await stripeConnectService.disconnect();
      
      toast.success("Stripe account disconnected successfully");
      
      // Reload status
      await loadStripeStatus();
    } catch (error) {
      logger.error('integrations', 'Error disconnecting Stripe', { error });
      const apiError = ErrorHandler.handleBillingError(error, 'disconnecting Stripe account');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const proceedWithCountry = async () => {
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }

    setShowCountryDialog(false);

    try {
      setIsConnecting(true);
      const response = await stripeConnectService.getConnectLink({ country: selectedCountry });
      
      // Check if this is a platform setup required response
      if (response.onboardingUrl.includes('status=platform_setup_required')) {
        toast.info("Payment system is currently being configured. Please try again later.", {
          duration: 5000
        });
        setIsConnecting(false);
        return;
      }
      
      // Redirect to Stripe Connect onboarding
      window.location.assign(response.onboardingUrl);
    } catch (error: unknown) {
      logger.error('integrations', 'Error connecting to Stripe with country', { error, country: selectedCountry });

      // Use the same error handling as before
      if (error && typeof error === 'object' && 'response' in error) {
        const errorObj = error as { response?: { status?: number; data?: { isConnectSetupRequired?: boolean; setupUrl?: string; error?: string; isRetryable?: boolean; actionRequired?: string; userMessage?: string } } };
        
        if (errorObj.response?.status === 503) {
          const data = errorObj.response.data;
          
          if (data?.isConnectSetupRequired) {
            const setupUrl = data.setupUrl;
            const message = data.error;
            
            toast.error(message || 'Stripe Connect setup required', {
              duration: 10000,
              action: {
                label: 'Setup Stripe Connect',
                onClick: () => window.open(setupUrl, '_blank')
              }
            });
          } else if (data?.actionRequired === 'platform_profile_setup') {
            toast.error(data.userMessage || data.error || 'Payment system is being configured. Please try again later.', {
              duration: 8000
            });
          }
        } else if (errorObj.response?.status === 400) {
          const data = errorObj.response.data;
          
          if (data?.isRetryable) {
            toast.error(data.error || 'Failed to create payment account. Please try again.');
          } else {
            const apiError = ErrorHandler.handleBillingError(error, 'connecting to Stripe');
            ErrorHandler.showErrorToast(apiError);
          }
        } else {
          const apiError = ErrorHandler.handleBillingError(error, 'connecting to Stripe');
          ErrorHandler.showErrorToast(apiError);
        }
      } else {
        const apiError = ErrorHandler.handleBillingError(error, 'connecting to Stripe');
        ErrorHandler.showErrorToast(apiError);
      }
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="integrations-page">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect external services to enhance your club management
        </p>
      </div>

      <div className="grid gap-6">
        {/* Stripe Connect Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              Stripe Connect
              {stripeStatus?.isConnected && (
                <Badge variant="default" className="bg-success/10 text-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              {stripeStatus && !stripeStatus.isConnected && (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to accept online dues payments from your members. 
              This enables secure credit card processing with automatic payment tracking.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {stripeStatus?.isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="h-4 w-4" />
                      Your Stripe account is connected and ready to accept payments
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleConnectStripe}
                        variant="outline"
                        disabled={isConnecting}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {isConnecting ? 'Generating Link...' : 'Manage Account'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            disabled={isDisconnecting}
                            data-testid="disconnect-trigger"
                          >
                            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect Stripe Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to disconnect your Stripe account? This will disable online payment collection for your club.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDisconnectStripe}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-testid="disconnect-confirm"
                            >
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-warning">
                      <AlertCircle className="h-4 w-4" />
                      Connect your Stripe account to enable online payment collection
                    </div>
                    
                    <Button
                      onClick={handleConnectStripe}
                      disabled={isConnecting}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {isConnecting ? 'Generating Link...' : 'Connect with Stripe'}
                    </Button>
                  </div>
                )}
              </>
            )}

            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <h4 className="text-sm font-medium text-primary mb-2">
                What happens when you connect?
              </h4>
              <ul className="text-xs text-primary space-y-1">
                <li>• You&apos;ll be redirected to Stripe&apos;s secure website</li>
                <li>• Create or connect your existing Stripe account</li>
                <li>• Complete Stripe&apos;s verification process</li>
                <li>• Return to GatherGrove with payment processing enabled</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Future Integrations Placeholder */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              More Integrations Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We&apos;re working on additional integrations to help you manage your club more effectively. 
              Stay tuned for email marketing, push alerts, and more.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Country Selection Dialog */}
      <Dialog open={showCountryDialog} onOpenChange={setShowCountryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Your Country</DialogTitle>
            <DialogDescription>
              Choose the country where your club operates. This determines your payment processing region.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              {loadingCountries ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex justify-between items-center w-full">
                          <span>{country.name}</span>
                          {!country.supportsApplicationFees && (
                            <span className="text-xs text-muted-foreground ml-2">(Manual transfers)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {selectedCountry && countries.find(c => c.code === selectedCountry && !c.supportsApplicationFees) && (
              <div className="p-3 bg-warning/10 rounded-lg">
                <p className="text-xs text-warning">
                  <strong>Note:</strong> Cross-region payments will use manual transfers.
                  Payments will be processed by the platform and transferred to your account.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCountryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={proceedWithCountry} disabled={!selectedCountry || isConnecting}>
              {isConnecting ? 'Connecting...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
} 
