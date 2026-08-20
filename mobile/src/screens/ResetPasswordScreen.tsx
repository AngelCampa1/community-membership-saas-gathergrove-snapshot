import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { authService } from '@/services/authService';
import { ResetPasswordRequest } from '@/types';

interface ResetPasswordScreenProps {
  token: string;
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  token,
  onSuccess,
  onBackToLogin
}) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // MEM-10 fix: Track timeout for cleanup
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // MEM-10 fix: Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Create styles with theme colors
  const styles = createStyles(colors);

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return null;
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate new password
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const request: ResetPasswordRequest = {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };

      await authService.resetPassword(request);
      setSuccess(true);

      // MEM-10 fix: Store timeout ref for cleanup on unmount
      redirectTimeoutRef.current = setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: undefined,
      }));
    }
  };

  /**
   * Check if form is valid for submission
   */
  const isFormValid = formData.newPassword && formData.confirmPassword;

  // Check if token is provided
  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Invalid Reset Link</Text>
            <Text style={styles.errorMessage}>
              This password reset link is invalid or has expired. Please request a new one.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onBackToLogin}
              testID="button-back-to-login"
            >
              <Text style={styles.primaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            
            <Text style={styles.successTitle} testID="text-success-title">
              Password Reset Successful
            </Text>
            
            <Text style={styles.successMessage} testID="text-success-message">
              Your password has been successfully reset. You will be redirected to the login screen.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        testID="screen-reset-password"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title} testID="text-reset-password-title">
                Reset Password
              </Text>
              <Text style={styles.subtitle} testID="text-reset-password-subtitle">
                Enter your new password below.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* New Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      errors.newPassword ? styles.inputError : null,
                    ]}
                    placeholder="Enter new password"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.newPassword}
                    onChangeText={(value) => handleInputChange('newPassword', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    testID="input-new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    testID="button-toggle-password"
                  >
                    <Text style={styles.eyeButtonText}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <Text style={styles.errorText} testID="error-new-password">
                    {errors.newPassword}
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      errors.confirmPassword ? styles.inputError : null,
                    ]}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    testID="input-confirm-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    testID="button-toggle-confirm-password"
                  >
                    <Text style={styles.eyeButtonText}>
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText} testID="error-confirm-password">
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* General Error Message */}
              {errors.general && (
                <View style={styles.generalErrorContainer}>
                  <Text style={styles.generalErrorText} testID="error-general">
                    {errors.general}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isFormValid || loading) ? styles.submitButtonDisabled : null,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid || loading}
                testID="button-reset-password"
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color={colors.text.inverse}
                      testID="loading-reset-password"
                    />
                    <Text style={styles.submitButtonText}>Resetting...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackToLogin}
                testID="button-back-to-login-link"
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginHorizontal: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.status.error,
    marginTop: 4,
  },
  generalErrorContainer: {
    padding: 12,
    backgroundColor: colors.status.errorBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  generalErrorText: {
    fontSize: 14,
    color: colors.status.error,
    textAlign: 'center',
  },
  submitButton: {
    height: 50,
    backgroundColor: colors.interactive.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.interactive.primary,
    fontWeight: '500',
  },
  
  // Success state styles
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 40,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginHorizontal: 20,
  },
  
  // Error state styles
  errorContainer: {
    alignItems: 'center',
    gap: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginHorizontal: 20,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    minWidth: 200,
  },
  primaryButton: {
    backgroundColor: colors.interactive.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});