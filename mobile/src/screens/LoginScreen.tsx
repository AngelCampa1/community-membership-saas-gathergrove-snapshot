import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { LoginRequest } from '@/types';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { getTouchTargetStyle, createAccessibilityLabel, getResponsiveStyle } from '../utils/accessibility';
import { ssoService } from '@/services/ssoService';
import { LIGHT_THEME, SPECIAL_COLORS } from '../constants/colors';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onForgotPassword }) => {
  const { colors } = useTheme();
  const { login, loginWithSSO, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<LoginRequest>>({});
  const [ssoLoading, setSsoLoading] = useState<'google' | 'apple' | null>(null);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Create styles with theme colors
  const styles = createStyles(colors);

  // Check SSO availability on mount
  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const checkSSOAvailability = async () => {
      try {
        const [googleOk, appleOk] = await Promise.all([
          ssoService.isGoogleSignInAvailable(),
          ssoService.isAppleSignInAvailable(),
        ]);
        if (!isMounted) return;
        setGoogleAvailable(googleOk);
        setAppleAvailable(appleOk);
      } catch {
        // SSO not available - buttons won't be shown
      }
    };
    checkSSOAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const errors: Partial<LoginRequest> = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      clearError();
      await login(formData);
      onLoginSuccess();
    } catch (err) {
      // Error is handled by useAuth hook and displayed in UI
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof LoginRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear global error when user starts typing
    if (error) {
      clearError();
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    setSsoLoading('google');
    clearError();
    try {
      const userSession = await ssoService.signInWithGoogle();
      // If useAuth has a method to set the session directly, use it
      if (loginWithSSO) {
        await loginWithSSO(userSession);
      }
      onLoginSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      Alert.alert('Sign-In Error', message);
    } finally {
      setSsoLoading(null);
    }
  };

  /**
   * Handle Apple Sign-In
   */
  const handleAppleSignIn = async () => {
    setSsoLoading('apple');
    clearError();
    try {
      const userSession = await ssoService.signInWithApple();
      if (loginWithSSO) {
        await loginWithSSO(userSession);
      }
      onLoginSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      if (!message.includes('cancelled')) {
        Alert.alert('Sign-In Error', message);
      }
    } finally {
      setSsoLoading(null);
    }
  };

  const isAnyLoading = loading || ssoLoading !== null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        testID="screen-login"
      >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} testID="text-app-title">
              GatherGrove
            </Text>
            <Text style={styles.subtitle} testID="text-login-subtitle">
              Sign in to your account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* SSO Buttons */}
            {(googleAvailable || appleAvailable) && (
              <View style={styles.ssoContainer}>
                {/* Apple Sign-In (iOS only, shown first on iOS) */}
                {appleAvailable && (
                  <TouchableOpacity
                    style={[styles.ssoButton, styles.appleButton, getTouchTargetStyle(48)]}
                    onPress={handleAppleSignIn}
                    disabled={isAnyLoading}
                    testID="button-apple-signin"
                    {...createAccessibilityLabel(
                      'Sign in with Apple',
                      'Use your Apple ID to sign in',
                      'button'
                    )}
                  >
                    {ssoLoading === 'apple' ? (
                      <ActivityIndicator size="small" color={SPECIAL_COLORS.socialAuth.appleText} />
                    ) : (
                      <>
                        <Text style={styles.appleIcon}></Text>
                        <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Google Sign-In */}
                {googleAvailable && (
                  <TouchableOpacity
                    style={[styles.ssoButton, styles.googleButton, getTouchTargetStyle(48)]}
                    onPress={handleGoogleSignIn}
                    disabled={isAnyLoading}
                    testID="button-google-signin"
                    {...createAccessibilityLabel(
                      'Sign in with Google',
                      'Use your Google account to sign in',
                      'button'
                    )}
                  >
                    {ssoLoading === 'google' ? (
                      <ActivityIndicator size="small" color={SPECIAL_COLORS.socialAuth.googleText} />
                    ) : (
                      <>
                        <Text style={styles.googleIcon}>G</Text>
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.email ? styles.inputError : null,
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.text.tertiary}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isAnyLoading}
                testID="input-email"
                {...createAccessibilityLabel(
                  'Email address input',
                  'Enter your email address to sign in',
                  'none'
                )}
              />
              {formErrors.email && (
                <Text style={styles.errorText} testID="error-email">
                  {formErrors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.password ? styles.inputError : null,
                ]}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.tertiary}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isAnyLoading}
                testID="input-password"
                {...createAccessibilityLabel(
                  'Password input',
                  'Enter your password to sign in',
                  'none'
                )}
              />
              {formErrors.password && (
                <Text style={styles.errorText} testID="error-password">
                  {formErrors.password}
                </Text>
              )}
            </View>

            {/* Global Error Message */}
            {error && (
              <View style={styles.globalErrorContainer}>
                <Text style={styles.globalErrorText} testID="error-global">
                  {error}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isAnyLoading ? styles.loginButtonDisabled : null,
                getTouchTargetStyle(48),
              ]}
              onPress={handleSubmit}
              disabled={isAnyLoading}
              testID="button-login"
              {...createAccessibilityLabel(
                loading ? 'Signing in...' : 'Sign In',
                'Sign in to your GatherGrove account',
                'button'
              )}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={colors.text.inverse}
                    testID="loading-login"
                  />
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={[styles.forgotPasswordButton, getTouchTargetStyle()]}
              onPress={onForgotPassword || (() => Alert.alert('Password Reset', 'Please contact your club administrator to reset your password, or use the web version of GatherGrove.'))}
              testID="button-forgot-password"
              {...createAccessibilityLabel(
                'Forgot Password?',
                'Get help resetting your password',
                'button'
              )}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => {
  const responsive = getResponsiveStyle();

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: responsive.containerPadding,
    paddingVertical: responsive.spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: responsive.isLargeScreen ? 400 : '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: responsive.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    height: 48,
    minHeight: 48, // Accessibility touch target
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 8,
    paddingHorizontal: responsive.spacing.md,
    fontSize: responsive.textSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.error,
    marginTop: 4,
  },
  globalErrorContainer: {
    backgroundColor: colors.status.errorBackground,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    borderRadius: 8,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.lg,
  },
  globalErrorText: {
    fontSize: 14,
    color: colors.status.error,
    textAlign: 'center',
  },
  loginButton: {
    height: 48,
    minHeight: 48, // Accessibility touch target
    backgroundColor: colors.interactive.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.spacing.md,
    ...colors.shadow.md,
  },
  loginButtonDisabled: {
    backgroundColor: colors.interactive.disabled,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: responsive.spacing.md,
    minHeight: 48, // Accessibility touch target
    justifyContent: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.interactive.primary,
    fontWeight: '600',
  },
  // SSO Styles
  ssoContainer: {
    marginBottom: responsive.spacing.lg,
  },
  ssoButton: {
    height: 48,
    minHeight: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.spacing.md,
    ...colors.shadow.small,
  },
  appleButton: {
    backgroundColor: SPECIAL_COLORS.socialAuth.apple,
  },
  googleButton: {
    backgroundColor: LIGHT_THEME.background.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  appleIcon: {
    fontSize: 18,
    color: SPECIAL_COLORS.socialAuth.appleText,
    marginRight: 8,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SPECIAL_COLORS.socialAuth.google,
    marginRight: 8,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: SPECIAL_COLORS.socialAuth.appleText,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: SPECIAL_COLORS.socialAuth.googleText,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: responsive.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.primary,
  },
  dividerText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginHorizontal: responsive.spacing.md,
    textTransform: 'uppercase',
  },
  });
}; 