"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { CheckCircle } from "lucide-react";
import { ValidationService } from "@/lib/validationService";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ErrorHandler } from "@/lib/errorHandler";
import authService from "@/services/authService";

interface ForgotPasswordFormData {
  email: string;
}

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Use ValidationService for form validation
  const forgotPasswordValidationRules = {
    email: ValidationService.rules.email()
  };

  const { errors: validationErrors, validateForm: validateFormFields } = useFormValidation({
    validationRules: forgotPasswordValidationRules
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
      await authService.forgotPassword(formData);
      setIsSuccess(true);
    } catch (error) {
      const apiError = ErrorHandler.handleAuthError(error, 'during password reset request');
      setGeneralError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        {/* Header with Logo and Theme Toggle */}
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

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to reset your password. If you don&apos;t see the email, check your spam folder.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link href="/login">
                  Back to Login
                </Link>
              </Button>
              
              <Button variant="outline" onClick={() => {
                setIsSuccess(false);
                setFormData({ email: "" });
              }}>
                Try a different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Logo and Theme Toggle */}
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

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Forgot Password Form */}
      <Card>
        <CardHeader>
          <CardTitle>Password Reset</CardTitle>
          <CardDescription>
            We&apos;ll email you instructions to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} method="post" className="space-y-4">
            {/* General Error Alert */}
            {generalError && (
              <Alert variant="destructive">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                className={validationErrors.email ? "border-destructive" : ""}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline underline-offset-4"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}