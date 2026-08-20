"use client";

import React, { useState, useEffect } from"react";
import posthog from"posthog-js";
import { useRouter, useSearchParams } from"next/navigation";
import Link from"next/link";
import Image from"next/image";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Checkbox } from"@/components/ui/checkbox";
import { Card, CardContent } from"@/components/ui/card";
import { Alert, AlertDescription } from"@/components/ui/alert";
import { ThemeToggle } from"@/components/shared/ThemeToggle";
import { ArrowLeft, Eye, EyeOff } from"lucide-react";
import { useAuth } from"@/hooks/useAuth";
import { LoginRequest, SSOLoginResponse } from"@/services/authService";
import { ValidationService } from"@/lib/validationService";
import { useFormValidation } from"@/hooks/useFormValidation";
import { useGoogleAnalytics } from"@/hooks/useGoogleAnalytics";
import { SSOButtons, SSODivider } from"./sso-buttons";

interface LoginFormData extends LoginRequest {
  rememberMe?: boolean;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justActivated = searchParams?.get("activated") ==="true";
  const { login, user, logout, error: authError } = useAuth();
  const { trackLogin, trackError } = useGoogleAnalytics();
  const [formData, setFormData] = useState<LoginFormData>({
    email:"",
    password:"",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Use ValidationService for form validation
  const loginValidationRules = {
    email: (value: unknown) => {
      return ValidationService.rules.required('Email')(value) || ValidationService.rules.email()(value);
    },
    password: ValidationService.rules.required('Password')
  };

  const { errors: validationErrors, validateForm: validateFormFields, clearErrors } = useFormValidation({
    validationRules: loginValidationRules
  });

  useEffect(() => {
    if (typeof window !=='undefined') {
      posthog.capture('login_form_viewed');
    }
  }, []);

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

    // Clear field-specific validation error when user types
    clearErrors(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form using ValidationService
    const validationResult = validateFormFields({ ...formData });
    if (!validationResult.isValid) {
      if (validationResult.firstError) {
        ValidationService.showValidationError(validationResult.firstError);
      }
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      const response = await login(formData);
      
      // Track successful login
      trackLogin('email');
      
      // Role-based redirection (success toast handled by useAuth hook)
      const dashboardRoute = response.role ==="Admin" ?"/admin/dashboard" :"/app/dashboard";
      router.push(dashboardRoute);
    } catch (error) {
      // The useAuth hook already processes the error, so we can use it directly
      let errorMessage ='Login failed. Please check your credentials and try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error ==='object' && error !== null &&'message' in error) {
        errorMessage = String(error.message);
      }
      
      // Add context prefix for display (tests expect this format)
      setGeneralError(`Error during login: ${errorMessage}`);
      
      // Track login error
      trackError(`Login failed: ${errorMessage}`, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOSuccess = (response: SSOLoginResponse) => {
    setIsSSOLoading(true);
    setGeneralError("");

    try {
      // Track successful SSO login
      const provider = response.wasLinked ?"sso_linked" : response.isNewUser ?"sso_new" :"sso";
      trackLogin(provider);

      // Role-based redirection
      const dashboardRoute = response.role ==="Admin" ?"/admin/dashboard" :"/app/dashboard";
      router.push(dashboardRoute);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :"Failed to redirect after sign-in";
      setGeneralError(errorMessage);
    } finally {
      setIsSSOLoading(false);
    }
  };

  const handleSSOError = (errorMessage: string) => {
    setGeneralError(`SSO Error: ${errorMessage}`);
    trackError(`SSO failed: ${errorMessage}`, false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Enhanced background with gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-success/5"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20  rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-success/20  rounded-full blur-3xl animate-pulse"></div>
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Already authenticated notice with actions */}
        {user && (
          <Alert>
            <AlertDescription className="flex flex-col gap-3 text-left">
              <span>You are already signed in as {user.fullName}.</span>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={() => router.push(user.role ==="Admin" ?"/admin/dashboard" :"/app/dashboard")}
                >
                  Continue to dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await logout();
                  }}
                >
                  Switch account
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Account activation success banner (A-001) */}
        {justActivated && !generalError && !authError && (
          <Alert>
            <AlertDescription>
              Your account has been activated! Please sign in with your new password.
            </AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <Card className="glass-strong border-border/50 shadow-xl backdrop-blur-xl">
          <CardContent>
            {/* SSO Sign-In Options */}
            <SSOButtons
              onSuccess={handleSSOSuccess}
              onError={handleSSOError}
              disabled={isLoading || isSSOLoading}
            />

            <SSODivider />

            <form onSubmit={handleSubmit} method="post" className="space-y-4">
              {/* General Error Alert */}
              {(generalError || authError) && (
                <Alert variant="destructive">
                  <AlertDescription>{generalError || authError}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@yourclub.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`transition-all duration-200 focus-ring ${validationErrors.email ?"border-destructive focus:border-destructive" :"focus:border-primary"}`}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ?"text" :"password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`transition-all duration-200 focus-ring pr-10 ${validationErrors.password ?"border-destructive focus:border-destructive" :"focus:border-primary"}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ?"Hide password" :"Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(value) => setFormData(prev => ({
                    ...prev,
                    rememberMe: value === true,
                  }))}
                  className="transition-all duration-200 focus-ring"
                />
                <Label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer select-none">Remember me</Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-ring"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : ("Sign In"
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-all duration-200 px-2 py-1 rounded-md hover:bg-primary/5 focus-ring"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{""}
                <Link
                  href="/register"
                  className="text-primary hover:underline underline-offset-4 font-medium transition-all duration-200 px-2 py-1 rounded-md hover:bg-primary/5 focus-ring"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 