"use client";

import React, { useState, useEffect } from"react";
import { useRouter, useSearchParams } from"next/navigation";
import Link from"next/link";
import Image from"next/image";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Alert, AlertDescription } from"@/components/ui/alert";
import { ThemeToggle } from"@/components/shared/ThemeToggle";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Mail
} from"lucide-react";
import authService, { type ActivateAccountRequest } from"@/services/authService";
import { ValidationService } from"@/lib/validationService";
import { useFormValidation } from"@/hooks/useFormValidation";
import { cn } from"@/lib/utils";
import posthog from"posthog-js";

interface ActivateFormData {
  activationToken: string;
  newPassword: string;
  confirmPassword: string;
  phone?: string;
  hasSmsConsent: boolean;
}

interface PasswordValidation {
  length: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<ActivateFormData>({
    activationToken:"",
    newPassword:"",
    confirmPassword:"",
    phone:"",
    hasSmsConsent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [memberEmail, setMemberEmail] = useState("");

  // Extract token from URL on mount
  useEffect(() => {
    const token = searchParams?.get('token');
    if (token) {
      setFormData(prev => ({ ...prev, activationToken: token }));
    } else {
      setGeneralError("No activation token provided. Please check your activation email for the correct link.");
    }
  }, [searchParams]);

  // Validate password requirements in real-time
  useEffect(() => {
    const password = formData.newPassword;
    setPasswordValidation({
      length: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  }, [formData.newPassword]);

  // Validation rules
  const validationRules = {
    activationToken: ValidationService.rules.required('Activation token'),
    newPassword: ValidationService.rules.password(),
    confirmPassword: (value: unknown) => {
      if (value !== formData.newPassword) {
        return"Passwords do not match";
      }
      return null;
    },
    phone: (value: unknown) => {
      // Phone is optional, but if provided, must be valid
      if (value && typeof value ==='string' && value.trim()) {
        return ValidationService.rules.phone()(value);
      }
      return null;
    }
  };

  const { errors: validationErrors, validateForm: validateFormFields } = useFormValidation({
    validationRules
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear general error when user modifies form
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationResult = validateFormFields({ ...formData });
    if (!validationResult.isValid) {
      if (validationResult.firstError) {
        ValidationService.showValidationError(validationResult.firstError);
      }
      return;
    }

    // Check all password requirements are met
    const allRequirementsMet = Object.values(passwordValidation).every(v => v);
    if (!allRequirementsMet) {
      setGeneralError("Please meet all password requirements");
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      // Activate account
      const activationRequest: ActivateAccountRequest = {
        activationToken: formData.activationToken,
        newPassword: formData.newPassword,
      };

      const response = await authService.activateAccount(activationRequest);

      if (response.success) {
        if (typeof window !=='undefined') {
          posthog.capture('account_activated');
        }
        // Activation succeeded. The activate endpoint does not return the
        // member's email or a session token, so client-side auto-login is not
        // possible. Show a success state and redirect to the login page, which
        // surfaces an activation-success banner via ?activated=true.
        setIsSuccess(true);

        setTimeout(() => {
          router.push("/login?activated=true");
        }, 2000);
      } else {
        setGeneralError(response.message ||"Activation failed. Please try again.");
      }
    } catch (error) {
      let errorMessage ="Failed to activate account. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error ==='object' && error !== null &&'message' in error) {
        errorMessage = String(error.message);
      }

      setGeneralError(errorMessage);
      // Offer a way out when the activation token itself is no longer usable.
      const lowered = errorMessage.toLowerCase();
      if (lowered.includes("expired") || lowered.includes("invalid")) {
        setShowResend(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendActivation = async () => {
    if (!memberEmail) {
      setGeneralError("Please enter your email address to resend the activation link.");
      return;
    }

    setIsResending(true);
    setGeneralError("");
    setResendSuccess(false);

    try {
      await authService.resendActivation(memberEmail);
      setResendSuccess(true);
      setGeneralError("");
    } catch (error) {
      let errorMessage ="Failed to resend activation email. Please try again or contact your club administrator.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setGeneralError(errorMessage);
      setResendSuccess(false);
    } finally {
      setIsResending(false);
    }
  };

  const isFormComplete =
    formData.activationToken &&
    formData.newPassword &&
    formData.confirmPassword &&
    Object.values(passwordValidation).every(v => v);

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10  rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary/15  rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card className="glass-strong border-border/50 shadow-xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-success/10  rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Account Activated!</h2>
                  <p className="text-muted-foreground mt-2">
                    Your account has been successfully activated.
                  </p>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Redirecting you to login...
                  </p>
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Enhanced background with gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10  rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary/15  rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Back to Home Button */}
        <div className="flex justify-start">
          <Link href="/">
            <Button variant="ghost" size="sm" className="interactive-lift flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header with Logo and Theme Toggle */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                <Image
                  src="/logos/logo-1024x1024.png"
                  alt="GatherGrove"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <span className="font-bold text-xl">GatherGrove</span>
            </Link>
            <ThemeToggle />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activate Your Account</h1>
            <p className="text-muted-foreground mt-2">
              Set your password to access the member portal
            </p>
          </div>
        </div>

        {/* Activation Form */}
        <Card className="glass-strong border-border/50 shadow-xl backdrop-blur-xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl font-semibold text-center">Create Your Password</CardTitle>
            <CardDescription className="text-center">
              Complete your account setup to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error Alert */}
              {resendSuccess && (
                <Alert className="border-success bg-success/10">
                  <AlertDescription className="text-success">
                    Activation email has been resent! Please check your inbox and spam folder.
                  </AlertDescription>
                </Alert>
              )}

              {generalError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <span>{generalError}</span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Resend activation link - shown when the token is expired or
                  invalid. Kept independent of the error message so the form and
                  its loading state stay visible while the request is in flight. */}
              {showResend && (
                <div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/30">
                  <Label htmlFor="resendEmail" className="text-sm font-medium">
                    Enter your email to request a new link
                  </Label>
                  <Input
                    id="resendEmail"
                    name="resendEmail"
                    type="email"
                    placeholder="you@yourclub.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    disabled={isResending}
                    autoComplete="email"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendActivation}
                    disabled={isResending || !memberEmail.trim()}
                    className="w-fit"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Request New Activation Link
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ?"text" :"password"}
                    placeholder="Create a strong password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={cn("transition-all duration-200 focus-ring pr-10",
                      validationErrors.newPassword ?"border-destructive focus:border-destructive" :"focus:border-primary"
                    )}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {formData.newPassword && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Password must contain:</p>
                  <div className="space-y-1">
                    <PasswordRequirement met={passwordValidation.length} text="At least 12 characters" />
                    <PasswordRequirement met={passwordValidation.hasUppercase} text="One uppercase letter" />
                    <PasswordRequirement met={passwordValidation.hasLowercase} text="One lowercase letter" />
                    <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                    <PasswordRequirement met={passwordValidation.hasSpecial} text="One special character (!@#$%^&*)" />
                  </div>
                </div>
              )}

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ?"text" :"password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={cn("transition-all duration-200 focus-ring pr-10",
                      validationErrors.confirmPassword ?"border-destructive focus:border-destructive" :"focus:border-primary"
                    )}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Optional: Phone Number */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Optional: Complete Your Profile</p>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="transition-all duration-200 focus-ring"
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  You can update your profile information later in your account settings
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={!isFormComplete || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating Account...
                  </>
                ) : ("Activate Account"
                )}
              </Button>

              {/* Help Text */}
              <p className="text-sm text-center text-muted-foreground mt-4">
                Having trouble?{""}
                <Link href="/support" className="text-primary hover:underline">
                  Contact Support
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm transition-colors",
      met ?"text-success" :"text-muted-foreground"
    )}>
      {met ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}
