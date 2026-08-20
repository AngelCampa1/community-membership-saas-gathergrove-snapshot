'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { eventService } from '@/services/eventService';
import { PublicEventResponse, MembershipTypeOption, NonMemberEventPaymentResponse } from '@/types/event';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { CHART_SEMANTIC, CHART_BACKGROUNDS, CHART_BORDERS } from '@/utils/chartColors';
import posthog from 'posthog-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PayEventAsGuestProps {
  event: PublicEventResponse;
  onSuccess?: (response: NonMemberEventPaymentResponse) => void;
  onCancel?: () => void;
}

interface GuestFormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  membershipTypeId?: number;
  createAccount: boolean;
  password: string;
  confirmPassword: string;
}

function PayEventAsGuestForm({ event, onSuccess, onCancel }: PayEventAsGuestProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [formData, setFormData] = useState<GuestFormData>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    membershipTypeId: undefined,
    createAccount: false,
    password: '',
    confirmPassword: '',
  });

  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeOption[]>([]);
  const [showMembershipUpgrade, setShowMembershipUpgrade] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<NonMemberEventPaymentResponse | null>(null);
  const [_loadingMembershipTypes, setLoadingMembershipTypes] = useState(false);

  // Track form mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.capture('guest_payment_started');
    }
  }, []);

  // Load membership types when component mounts
  useEffect(() => {
    loadMembershipTypes();
  }, [event.id]);

  const loadMembershipTypes = async () => {
    try {
      setLoadingMembershipTypes(true);
      const types = await eventService.getAvailableMembershipTypes(event.id);
      setMembershipTypes(types);
    } catch (err) {
      logger.error('events', 'Failed to load membership types for guest payment', { error: err, eventId: event.id });
      // Don't show error, just disable membership upgrade option
      setMembershipTypes([]);
    } finally {
      setLoadingMembershipTypes(false);
    }
  };

  const handleInputChange = (field: keyof GuestFormData, value: string | boolean | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const selectedMembershipType = membershipTypes.find(mt => mt.id === formData.membershipTypeId);

  const calculateTotalAmount = (): number => {
    const eventAmount = event.nonMemberPrice || 0;
    const membershipAmount = selectedMembershipType?.duesAmount || 0;
    return eventAmount + membershipAmount;
  };

  const validateForm = (): string | null => {
    if (!formData.guestName.trim()) {
      return 'Please enter your full name';
    }
    if (!formData.guestEmail.trim()) {
      return 'Please enter your email address';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
      return 'Please enter a valid email address';
    }
    if (formData.createAccount) {
      if (!formData.password) {
        return 'Please enter a password to create your account';
      }
      if (formData.password.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!stripe || !elements) {
      setError('Payment system is not ready. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.guestName,
          email: formData.guestEmail,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to process payment');
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Process payment
      const response = await eventService.payForEventAsGuest({
        eventId: event.id,
        paymentMethodId: paymentMethod.id,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone || undefined,
        membershipTypeId: formData.membershipTypeId,
        createAccount: formData.createAccount,
        password: formData.createAccount ? formData.password : undefined,
      });

      setPaymentSuccess(true);
      setPaymentResponse(response);
      if (typeof window !== 'undefined') {
        posthog.capture('guest_payment_completed');
      }

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      logger.error('billing', 'Guest event payment error', { error: err, eventId: event.id, guestEmail: formData.guestEmail, createAccount: formData.createAccount });
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Success screen
  if (paymentSuccess && paymentResponse) {
    return (
      <Card className="w-full max-w-2xl mx-auto" data-testid="payment-success-screen">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: CHART_BACKGROUNDS.success }}>
            <CheckCircle2 className="h-6 w-6" style={{ color: CHART_SEMANTIC.positive }} />
          </div>
          <CardTitle className="text-2xl">Registration Confirmed!</CardTitle>
          <CardDescription>Your payment has been processed successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">Confirmation Number:</span>
              <span className="text-sm font-bold text-foreground" data-testid="confirmation-number">
                {paymentResponse.confirmationNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Paid:</span>
              <span className="text-sm font-bold text-foreground">
                ${paymentResponse.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {paymentResponse.membershipCreated && (
            <Alert className="border" style={{ backgroundColor: CHART_BACKGROUNDS.success, borderColor: CHART_BORDERS.success }} data-testid="membership-success-message">
              <CheckCircle2 className="h-4 w-4" style={{ color: CHART_SEMANTIC.positive }} />
              <AlertDescription style={{ color: CHART_SEMANTIC.positive }}>
                <strong>Welcome as a member!</strong> Your membership has been activated and you now have access to all member benefits.
              </AlertDescription>
            </Alert>
          )}

          {paymentResponse.accountCreated && (
            <Alert className="border" style={{ backgroundColor: CHART_BACKGROUNDS.blue, borderColor: CHART_BORDERS.blue }} data-testid="account-success-message">
              <CheckCircle2 className="h-4 w-4" style={{ color: CHART_SEMANTIC.info }} />
              <AlertDescription style={{ color: CHART_SEMANTIC.info }}>
                <strong>Account Created!</strong> You can now log in at{' '}
                <a href="/login" className="underline">gathergrove.club/login</a> using the email and password you provided.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>A confirmation email has been sent to <strong>{formData.guestEmail}</strong></p>
            <p className="mt-2">We look forward to seeing you at the event!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Payment form
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>Please provide your contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">Full Name *</Label>
            <Input
              id="guestName"
              data-testid="input-guest-name"
              type="text"
              value={formData.guestName}
              onChange={(e) => handleInputChange('guestName', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email Address *</Label>
            <Input
              id="guestEmail"
              data-testid="input-guest-email"
              type="email"
              value={formData.guestEmail}
              onChange={(e) => handleInputChange('guestEmail', e.target.value)}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestPhone">Phone Number (Optional)</Label>
            <Input
              id="guestPhone"
              data-testid="input-guest-phone"
              type="tel"
              value={formData.guestPhone}
              onChange={(e) => handleInputChange('guestPhone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </CardContent>
      </Card>

      {/* Membership Upgrade Option */}
      {membershipTypes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Join as a Member</CardTitle>
                <CardDescription>Get access to exclusive member benefits</CardDescription>
              </div>
              <Checkbox
                data-testid="checkbox-show-membership"
                checked={showMembershipUpgrade}
                onCheckedChange={(checked) => {
                  setShowMembershipUpgrade(checked as boolean);
                  if (!checked) {
                    handleInputChange('membershipTypeId', undefined);
                  }
                }}
              />
            </div>
          </CardHeader>
          {showMembershipUpgrade && (
            <CardContent className="space-y-4">
              <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: CHART_BACKGROUNDS.blue, color: CHART_SEMANTIC.info }}>
                <p className="font-medium mb-2">Member Benefits Include:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Discounted event pricing</li>
                  <li>Exclusive member-only events</li>
                  <li>Access to member directory</li>
                  <li>Priority registration for events</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Label>Select Membership Type *</Label>
                <RadioGroup
                  value={formData.membershipTypeId?.toString()}
                  onValueChange={(value) => handleInputChange('membershipTypeId', parseInt(value))}
                >
                  {membershipTypes.map((type) => (
                    <div key={type.id} className="flex items-start space-x-3 rounded-lg border p-4">
                      <RadioGroupItem value={type.id.toString()} id={`membership-${type.id}`} />
                      <div className="flex-1">
                        <Label htmlFor={`membership-${type.id}`} className="font-medium cursor-pointer">
                          {type.name} - ${type.duesAmount.toFixed(2)}/{type.duesFrequency.toLowerCase()}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Account Creation Option */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Checkbox
              data-testid="checkbox-create-account"
              checked={formData.createAccount}
              onCheckedChange={(checked) => handleInputChange('createAccount', checked as boolean)}
              id="createAccount"
            />
            <Label htmlFor="createAccount" className="cursor-pointer">
              Create an account to manage your registration online
            </Label>
          </div>
        </CardHeader>
        {formData.createAccount && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Minimum 8 characters"
                required={formData.createAccount}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                data-testid="input-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Re-enter your password"
                required={formData.createAccount}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Event Registration:</span>
              <span className="font-medium">${(event.nonMemberPrice || 0).toFixed(2)}</span>
            </div>
            {selectedMembershipType && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{selectedMembershipType.name} Membership:</span>
                <span className="font-medium">${selectedMembershipType.duesAmount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span data-testid="total-amount">${calculateTotalAmount().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Enter your card details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: CHART_SEMANTIC.negative,
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" data-testid="error-message">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isProcessing || !stripe}
          className="flex-1"
          data-testid="button-submit-payment"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay ${calculateTotalAmount().toFixed(2)} and Register
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PayEventAsGuest(props: PayEventAsGuestProps) {
  return (
    <Elements stripe={stripePromise}>
      <PayEventAsGuestForm {...props} />
    </Elements>
  );
}

