"use client";

import React, { useState } from "react";
import { trackEvent } from "@/services/frontendTrackingService";
import { useGoogleLogin } from "@react-oauth/google";
import AppleSignin from "react-apple-signin-auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import authService, { SSOLoginResponse } from "@/services/authService";

/**
 * Generate a cryptographically secure random string for nonce/state
 * Uses crypto.randomUUID() which is available in modern browsers
 */
function generateSecureRandom(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

interface SSOButtonsProps {
  onSuccess: (response: SSOLoginResponse) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * SSO authentication buttons for Google and Apple Sign-In
 */
export function SSOButtons({ onSuccess, onError, disabled = false, className = "" }: SSOButtonsProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);

  // Generate secure nonce and state for Apple Sign-In
  // These are generated once per component mount and stored for validation
  const [appleAuthParams] = useState(() => ({
    nonce: generateSecureRandom(),
    state: generateSecureRandom(),
  }));

  // Google login hook - uses implicit flow to get id_token directly
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setSsoError(null);

      try {
        // For implicit flow, we get access_token. We need to exchange it for user info
        // and then authenticate with our backend
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to get user info from Google');
        }

        const userInfo = await userInfoResponse.json();

        // Use the access token to authenticate with our backend.
        // The backend re-validates the token and derives email/googleId from it;
        // only fullName is forwarded (used for first-time user registration).
        const response = await authService.loginWithGoogle({
          idToken: tokenResponse.access_token,
          platform: "web",
          fullName: userInfo.name,
        });

        if (response.success) {
          onSuccess(response);
        } else {
          const errorMessage = response.message || "Google sign-in failed";
          setSsoError(errorMessage);
          onError(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Google sign-in failed";
        setSsoError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      const errorMessage = "Google sign-in was cancelled or failed";
      setSsoError(errorMessage);
      onError(errorMessage);
    },
    flow: 'implicit',
  });

  const handleAppleSuccess = async (response: { authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }) => {
    if (!response.authorization?.id_token) {
      const errorMessage = "No token received from Apple";
      setSsoError(errorMessage);
      onError(errorMessage);
      return;
    }

    setIsAppleLoading(true);
    setSsoError(null);

    try {
      // Apple only provides the name on first sign-in
      let fullName: string | undefined;
      if (response.user?.name) {
        const { firstName, lastName } = response.user.name;
        fullName = [firstName, lastName].filter(Boolean).join(" ") || undefined;
      }

      const ssoResponse = await authService.loginWithApple({
        idToken: response.authorization.id_token,
        platform: "web",
        fullName,
        nonce: appleAuthParams.nonce, // Pass nonce for server-side validation
      });

      if (ssoResponse.success) {
        onSuccess(ssoResponse);
      } else {
        const errorMessage = ssoResponse.message || "Apple sign-in failed";
        setSsoError(errorMessage);
        onError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Apple sign-in failed";
      setSsoError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleAppleError = (error: unknown) => {
    // User cancelled or error occurred
    const errorMessage = error instanceof Error ? error.message : "Apple sign-in was cancelled or failed";
    setSsoError(errorMessage);
    onError(errorMessage);
  };

  const isLoading = isGoogleLoading || isAppleLoading;

  return (
    <div className={`space-y-4 ${className}`}>
      {ssoError && (
        <Alert variant="destructive">
          <AlertDescription>{ssoError}</AlertDescription>
        </Alert>
      )}

      {/* Google Sign-In - Custom button matching Apple style */}
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-10 flex items-center justify-center gap-2 border-border hover:bg-muted/50"
          disabled={disabled || isLoading}
          onClick={() => {
            if (typeof window !== 'undefined') {
              trackEvent('login_method_selected', { category: 'auth', customParameters: { method: 'google' } });
            }
            googleLogin();
          }}
        >
          {isGoogleLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </Button>
      )}

      {/* Apple Sign-In */}
      <AppleSignin
        authOptions={{
          clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "",
          scope: "email name",
          redirectURI: typeof window !== "undefined" ? `${window.location.origin}/api/auth/apple/callback` : "",
          state: appleAuthParams.state, // Cryptographically secure random state for CSRF protection
          nonce: appleAuthParams.nonce, // Cryptographically secure random nonce for replay protection
          usePopup: true,
        }}
        uiType="dark"
        className="w-full"
        noDefaultStyle={true}
        onSuccess={handleAppleSuccess}
        onError={handleAppleError}
        render={(props: { onClick?: (e: React.MouseEvent) => void }) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            className="w-full h-10 flex items-center justify-center gap-2 border-border hover:bg-muted/50"
            disabled={disabled || isLoading}
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                trackEvent('login_method_selected', { category: 'auth', customParameters: { method: 'apple' } });
              }
              if (props.onClick) props.onClick(e);
            }}
          >
            {isAppleLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Sign in with Apple</span>
              </>
            )}
          </Button>
        )}
      />
    </div>
  );
}

/**
 * Divider component for separating SSO from email/password login
 */
export function SSODivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
      </div>
    </div>
  );
}
