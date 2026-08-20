import React, { useState, useEffect, useCallback } from 'react';
import { LoginScreen } from './LoginScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import {
  parseDeepLink,
  getInitialDeepLink,
  subscribeToDeepLinks,
} from '@/utils/deepLinking';

type AuthFlowScreen = 'login' | 'forgotPassword' | 'resetPassword';

interface AuthFlowProps {
  onLoginSuccess: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onLoginSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthFlowScreen>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  /**
   * NAV-03 fix: Handle deep links with extended configuration
   * Supports: /reset-password, /forgot-password
   */
  const handleDeepLink = useCallback((url: string) => {
    const result = parseDeepLink(url);

    switch (result.type) {
      case 'reset-password':
        if (result.isValid && result.token) {
          setResetToken(result.token);
          setCurrentScreen('resetPassword');
        }
        break;

      case 'forgot-password':
        if (result.isValid) {
          setCurrentScreen('forgotPassword');
        }
        break;

      // Other deep link types are handled by RootNavigator for authenticated routes
      default:
        break;
    }
  }, []);

  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    getInitialDeepLink().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep link events while app is open
    const unsubscribe = subscribeToDeepLinks(handleDeepLink);

    return unsubscribe;
  }, [handleDeepLink]);

  /**
   * Navigate to forgot password screen
   */
  const handleForgotPassword = () => {
    setCurrentScreen('forgotPassword');
  };

  /**
   * Navigate back to login screen
   */
  const handleBackToLogin = () => {
    setCurrentScreen('login');
    setResetToken(null);
  };

  /**
   * Handle successful password reset
   */
  const handleResetSuccess = () => {
    setCurrentScreen('login');
    setResetToken(null);
  };

  // Render appropriate screen based on current state
  switch (currentScreen) {
    case 'forgotPassword':
      return (
        <ForgotPasswordScreen
          onBackToLogin={handleBackToLogin}
        />
      );

    case 'resetPassword':
      if (!resetToken) {
        // Redirect to login if no token is available
        return (
          <LoginScreen
            onLoginSuccess={onLoginSuccess}
            onForgotPassword={handleForgotPassword}
          />
        );
      }
      return (
        <ResetPasswordScreen
          token={resetToken}
          onSuccess={handleResetSuccess}
          onBackToLogin={handleBackToLogin}
        />
      );

    case 'login':
    default:
      return (
        <LoginScreen
          onLoginSuccess={onLoginSuccess}
          onForgotPassword={handleForgotPassword}
        />
      );
  }
};