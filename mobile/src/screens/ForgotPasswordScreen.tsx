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

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin
}) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  // MEM-11 fix: Track mounted state to prevent state updates on unmounted component
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create styles with theme colors
  const styles = createStyles(colors);

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Clear previous error
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      // MEM-11 fix: Only update state if component is still mounted
      if (isMountedRef.current) {
        setEmailSent(true);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  /**
   * Handle input change
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  /**
   * Handle resend email
   */
  const handleResendEmail = () => {
    setEmailSent(false);
    setEmail('');
    setError('');
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Success State */}
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            
            <Text style={styles.successTitle} testID="text-email-sent-title">
              Check Your Email
            </Text>
            
            <Text style={styles.successMessage} testID="text-email-sent-message">
              If an account with that email exists, we&apos;ve sent you a password reset link.
            </Text>
            
            <Text style={styles.successSubtext}>
              Didn&apos;t receive the email? Check your spam folder or try again.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleResendEmail}
              testID="button-resend-email"
            >
              <Text style={styles.primaryButtonText}>Send Another Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onBackToLogin}
              testID="button-back-to-login"
            >
              <Text style={styles.secondaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
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
        testID="screen-forgot-password"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title} testID="text-forgot-password-title">
                Forgot Password?
              </Text>
              <Text style={styles.subtitle} testID="text-forgot-password-subtitle">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    error ? styles.inputError : null,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  testID="input-email"
                />
                {error && (
                  <Text style={styles.errorText} testID="error-email">
                    {error}
                  </Text>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading ? styles.submitButtonDisabled : null,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                testID="button-send-reset-email"
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color={colors.text.inverse}
                      testID="loading-send-email"
                    />
                    <Text style={styles.submitButtonText}>Sending...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Send Reset Email</Text>
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
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.status.error,
    marginTop: 4,
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
    marginBottom: 40,
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
    marginBottom: 12,
    marginHorizontal: 20,
  },
  successSubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.interactive.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
});