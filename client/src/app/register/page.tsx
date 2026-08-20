"use client";
import { useState, useEffect, useMemo, Suspense } from"react";
import { trackEvent } from"@/services/frontendTrackingService";
import { useRouter, useSearchParams } from"next/navigation";
import Link from"next/link";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Checkbox } from"@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Alert, AlertDescription } from"@/components/ui/alert";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, ArrowLeft } from"lucide-react";
import { cn } from"@/lib/utils";
import { useAuth } from"@/hooks/useAuth";
import type { RegisterRequest, SSOLoginResponse } from"@/services/authService";
import { SSOButtons, SSODivider } from"@/components/features/auth/sso-buttons";
import { formatPlanPrice, getPricingPlan, type BillingCycle, type PricingPlan } from"@/lib/pricing";

type RegisterFormData = RegisterRequest;

const planIds: PricingPlan['id'][] = ['seed', 'grow', 'unlimited'];

function formatIntendedPlanPrice(tier: string, billing: string) {
  if (!planIds.includes(tier as PricingPlan['id']) || (billing !=='monthly' && billing !=='annual')) {
    return '';
  }

  return ` • ${formatPlanPrice(getPricingPlan(tier as PricingPlan['id']), billing as BillingCycle)}`;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  clubName?: string;
  terms?: string;
  general?: string;
}

interface PasswordValidation {
  length: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName:"",
    email:"",
    password:"",
    clubName:"",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [intendedPlan, setIntendedPlan] = useState<{ tier: string; billing: string } | null>(null);
  const [step, setStep] = useState(1);

  // PostHog: track step 1 on mount
  useEffect(() => {
    if (typeof window !=='undefined') {
      trackEvent('registration_step_viewed', { category:'funnel', customParameters: { step: 1 } });
    }
  }, []);

  // PostHog: track step 2 when step changes to 2
  useEffect(() => {
    if (step === 2 && typeof window !=='undefined') {
      trackEvent('registration_step_viewed', { category:'funnel', customParameters: { step: 2 } });
    }
  }, [step]);

  // Check for plan and billing parameters on component mount
  useEffect(() => {
    const planParam = searchParams?.get('plan');
    const billingParam = searchParams?.get('billing') ||'monthly'; // Default to monthly

    if (planParam && (planParam ==='seed' || planParam ==='grow' || planParam ==='unlimited')) {
      const planConfig = { tier: planParam, billing: billingParam };
      setIntendedPlan(planConfig);
      // Store in sessionStorage so it persists through the registration flow
      sessionStorage.setItem('intended_plan', JSON.stringify(planConfig));
    }
  }, [searchParams]);

  const validatePassword = (password: string): PasswordValidation => ({
    length: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  });

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const isFormComplete = useMemo(() =>
    formData.fullName.trim() &&
    formData.email.trim() &&
    formData.password &&
    formData.clubName.trim() &&
    isPasswordValid &&
    termsAccepted,
    [formData.fullName, formData.email, formData.password, formData.clubName, isPasswordValid, termsAccepted]
  );

  const isStep1Complete = useMemo(() =>
    !!(formData.email.trim() && formData.password && isPasswordValid),
    [formData.email, formData.password, isPasswordValid]
  );

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName ="Full name is required";
    } else if (formData.fullName.length > 100) {
      newErrors.fullName ="Full name cannot exceed 100 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email ="Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email ="Please enter a valid email address";
    } else if (formData.email.length > 255) {
      newErrors.email ="Email cannot exceed 255 characters";
    }

    if (!formData.password) {
      newErrors.password ="Password is required";
    } else if (!isPasswordValid) {
      newErrors.password ="Password does not meet requirements";
    }

    if (!formData.clubName.trim()) {
      newErrors.clubName ="Club name is required";
    } else if (formData.clubName.length > 100) {
      newErrors.clubName ="Club name cannot exceed 100 characters";
    }

    if (!termsAccepted) {
      newErrors.terms ="You must agree to the Terms of Service";
    }

    setErrors(newErrors);
    if (typeof window !=='undefined') {
      Object.keys(newErrors).forEach((field) => {
        trackEvent('registration_validation_error', { category:'error', customParameters: { field } });
      });
    }
    return Object.keys(newErrors).length === 0;
  };

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.email.trim()) {
      newErrors.email ="Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email ="Please enter a valid email address";
    } else if (formData.email.length > 255) {
      newErrors.email ="Email cannot exceed 255 characters";
    }

    if (!formData.password) {
      newErrors.password ="Password is required";
    } else if (!isPasswordValid) {
      newErrors.password ="Password does not meet requirements";
    }

    setErrors(newErrors);
    if (typeof window !=='undefined') {
      Object.keys(newErrors).forEach((field) => {
        trackEvent('registration_validation_error', { category:'error', customParameters: { field } });
      });
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      if (typeof window !=='undefined') {
        trackEvent('registration_step_completed', { category:'funnel', customParameters: { step: 1 } });
      }
      setStep(2);
    }
  };

  const handleSSOSuccess = (_response: SSOLoginResponse) => {
    const storedPlanStr = sessionStorage.getItem('intended_plan');
    if (storedPlanStr) {
      try {
        const storedPlan = JSON.parse(storedPlanStr);
        sessionStorage.removeItem('intended_plan');
        router.push(`/admin/billing?upgrade=${storedPlan.tier}&billing=${storedPlan.billing}&source=signup`);
      } catch {
        router.push('/admin/onboarding');
      }
    } else {
      router.push('/admin/onboarding');
    }
  };

  const handleSSOError = (error: string) => {
    setErrors(prev => ({ ...prev, general: error }));
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    if (field ==="email" && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length > 5) {
      setErrors(prev => ({ ...prev, email:"Please enter a valid email address" }));
    }

    if (field ==="email" && value.length > 255) {
      setErrors(prev => ({ ...prev, email:"Email cannot exceed 255 characters" }));
    }

    if (field ==="fullName" && value.length > 100) {
      setErrors(prev => ({ ...prev, fullName:"Full name cannot exceed 100 characters" }));
    }

    if (field ==="clubName" && value.length > 100) {
      setErrors(prev => ({ ...prev, clubName:"Club name cannot exceed 100 characters" }));
    }

    if (field ==="password" && value && !Object.values(validatePassword(value)).every(Boolean)) {
      setErrors(prev => ({ ...prev, password:"Password does not meet requirements" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      setErrors({});

      // Check if user intended to upgrade to a paid plan
      const storedPlanStr = sessionStorage.getItem('intended_plan');
      if (storedPlanStr) {
        try {
          const storedPlan = JSON.parse(storedPlanStr);
          // Clear the stored plan
          sessionStorage.removeItem('intended_plan');
          // Redirect to billing page with upgrade intent and billing cycle
          router.push(`/admin/billing?upgrade=${storedPlan.tier}&billing=${storedPlan.billing}&source=signup`);
        } catch {
          // Handle legacy'grow' string format
          if (storedPlanStr ==='grow') {
            sessionStorage.removeItem('intended_plan');
            router.push("/admin/billing?upgrade=grow&billing=monthly&source=signup");
          } else {
            router.push("/admin/onboarding");
          }
        }
      } else {
        router.push("/admin/onboarding");
      }
    } catch (error) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 409) {
        setErrors({ email:"A user with this email already exists" });
        setStep(1);
      } else if (err?.status === 400) {
        setErrors({ general: err.message ||"Please check your input and try again" });
      } else {
        setErrors({ general: err?.message ||"Registration failed. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={cn("flex items-center gap-2 text-sm", met ?"text-success" :"text-muted-foreground")}>
      {met ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Enhanced background with gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-success/5"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20  rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-success/20  rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-md mb-4 relative z-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="interactive-lift inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md glass-strong border-border/50 shadow-xl backdrop-blur-xl relative z-10">
        <CardHeader className="text-center">
          {intendedPlan && (
            <div className="mb-4 p-4 glass-soft border border-secondary/50 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 text-secondary-foreground  font-semibold">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary/30 to-accent/20">
                  <span className="text-lg">{intendedPlan.tier ==='unlimited' ?'🚀' :'⬆️'}</span>
                </div>
                <span>Signing up for {intendedPlan.tier.charAt(0).toUpperCase() + intendedPlan.tier.slice(1)} Plan ({intendedPlan.billing})</span>
              </div>
              <p className="text-sm text-secondary-foreground/80  mt-2">
                You'll be redirected to upgrade after creating your account
                {formatIntendedPlanPrice(intendedPlan.tier, intendedPlan.billing)}
              </p>
            </div>
          )}
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Create your GatherGrove account</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Start your 30-day free trial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" role="form">
            {errors.general && (
              <Alert variant="destructive" className="glass-soft border-destructive/50 bg-destructive/5  backdrop-blur-sm">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Progress indicator */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {step} of 2</span>
              <div className="flex gap-1">
                <div className={`h-1.5 w-8 rounded-full ${step >= 1 ?'bg-primary' :'bg-muted'}`} />
                <div className={`h-1.5 w-8 rounded-full ${step >= 2 ?'bg-primary' :'bg-muted'}`} />
              </div>
            </div>

            {step === 1 ? (
              <>
                <SSOButtons
                  onSuccess={handleSSOSuccess}
                  onError={handleSSOError}
                  disabled={isLoading}
                />
                <SSODivider />
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Your Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className={`glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring ${errors.email ?"border-destructive focus:border-destructive" :"focus:border-primary"}`}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ?"text" :"password"}
                      value={formData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("password", e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Create a secure password"
                      autoComplete="new-password"
                      className={cn("pr-10 glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring",
                        errors.password ?"border-destructive focus:border-destructive" :"",
                        formData.password && isPasswordValid ?"border-success focus:border-success" :"",
                        !errors.password && !isPasswordValid && formData.password ?"focus:border-primary" :""
                      )}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                      aria-label={showPassword ?"Hide password" :"Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {(passwordFocused || formData.password) && (
                    <div className="space-y-2 p-4 glass-soft border border-border/50 rounded-lg backdrop-blur-sm">
                      <p className="text-sm font-medium text-foreground">Password requirements:</p>
                      <PasswordRequirement met={passwordValidation.length} text="At least 12 characters" />
                      <PasswordRequirement met={passwordValidation.hasUppercase} text="One uppercase letter" />
                      <PasswordRequirement met={passwordValidation.hasLowercase} text="One lowercase letter" />
                      <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                      <PasswordRequirement met={passwordValidation.hasSpecial} text="One special character" />
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-primary-foreground font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-ring disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                  disabled={!isStep1Complete}
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Your Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={`glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring ${errors.fullName ?"border-destructive focus:border-destructive" :"focus:border-primary"}`}
                    disabled={isLoading}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clubName" className="text-sm font-medium">Your Club&apos;s Name</Label>
                  <Input
                    id="clubName"
                    type="text"
                    value={formData.clubName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("clubName", e.target.value)}
                    placeholder="Enter your club's name"
                    autoComplete="organization"
                    className={`glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring ${errors.clubName ?"border-destructive focus:border-destructive" :"focus:border-primary"}`}
                    disabled={isLoading}
                  />
                  {errors.clubName && (
                    <p className="text-sm text-destructive">{errors.clubName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        setTermsAccepted(isChecked);
                        if (errors.terms && isChecked) {
                          setErrors(prev => ({ ...prev, terms: undefined }));
                        }
                      }}
                      disabled={isLoading}
                      className={errors.terms ?"border-destructive" :""}
                    />
                    <Label htmlFor="terms" className="text-sm leading-5">
                      I agree to the{""}
                      <Link href="/terms-of-service" className="text-primary hover:text-primary/80 underline">
                        Terms of Service
                      </Link>{""}
                      and{""}
                      <Link href="/privacy-policy" className="text-primary hover:text-primary/80 underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-destructive">{errors.terms}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2] bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-primary-foreground font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-ring disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    disabled={!isFormComplete || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Your Account...
                      </>
                    ) : ("Create My Account"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Credit card required to activate your 30-day trial. Cancel anytime.
                </p>
              </>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{""}
                <Link href="/login" className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-all duration-200 px-1 py-0.5 rounded-md hover:bg-primary/5 focus-ring">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RegisterPageFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Enhanced background with gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-success/5"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20  rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-success/20  rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="w-full glass-strong border-border/50 shadow-xl backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
                <div className="relative p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
