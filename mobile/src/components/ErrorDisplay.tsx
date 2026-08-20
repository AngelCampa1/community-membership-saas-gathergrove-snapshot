import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { AppError, ErrorHandler } from '@/utils/errorHandler';
import { ERROR_SEVERITY } from '@/constants';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

interface ErrorDisplayProps {
  error: AppError | Error | string | null;
  context?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showAlert?: boolean; // Show as alert instead of inline
  style?: ViewStyle | TextStyle;
  testID?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  context,
  onRetry,
  onDismiss,
  showAlert = false,
  style,
  testID = 'error-display'
}) => {
  const { colors } = useTheme();

  // Convert different error types to AppError
  const appError: AppError | null = React.useMemo(() => {
    if (!error) return null;
    if (typeof error === 'string') {
      return {
        message: error,
        category: 'system' as const,
        severity: 'medium' as const,
        timestamp: new Date()
      };
    }
    
    if ('message' in error && 'category' in error && 'severity' in error) {
      return error as AppError;
    }
    
    // Handle regular Error objects
    return ErrorHandler.handleApiError(error, context);
  }, [error, context]);

  // Show alert if requested
  React.useEffect(() => {
    if (showAlert && appError) {
      const buttons = [];
      
      if (onRetry) {
        buttons.push({
          text: 'Retry',
          onPress: onRetry,
          style: 'default' as const
        });
      }
      
      buttons.push({
        text: 'OK',
        onPress: onDismiss,
        style: 'cancel' as const
      });

      Alert.alert(
        getErrorTitle(appError),
        appError.message,
        buttons,
        { cancelable: true }
      );
    }
  }, [showAlert, appError, onRetry, onDismiss]);

  // Don't render if no error
  if (!appError) return null;

  // Don't render inline component if showing alert
  if (showAlert) return null;

  const errorStyle = getErrorStyle(appError.severity, colors);

  return (
    <View style={[styles.container, errorStyle.container, style]} testID={testID}>
      <View style={styles.content}>
        <Text style={[styles.title, errorStyle.title]} testID={`${testID}-title`}>
          {getErrorTitle(appError)}
        </Text>
        <Text style={[styles.message, errorStyle.message]} testID={`${testID}-message`}>
          {appError.message}
        </Text>
        
        {appError.userAction && (
          <Text style={[styles.userAction, errorStyle.userAction]} testID={`${testID}-user-action`}>
            {appError.userAction}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.interactive.primary }]}
            onPress={onRetry}
            testID={`${testID}-retry-button`}
          >
            <Text style={[styles.retryButtonText, { color: colors.text.inverse }]}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.text.secondary }]}
            onPress={onDismiss}
            testID={`${testID}-dismiss-button`}
          >
            <Text style={[styles.dismissButtonText, { color: colors.text.inverse }]}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Helper function to get appropriate title based on error category
const getErrorTitle = (error: AppError): string => {
  switch (error.category) {
    case 'network':
      return 'Connection Problem';
    case 'authentication':
      return 'Authentication Issue';
    case 'authorization':
      return 'Access Denied';
    case 'validation':
      return 'Input Error';
    case 'payment':
      return 'Payment Issue';
    case 'data':
      return 'Data Problem';
    case 'system':
      return 'System Error';
    case 'user_input':
      return 'Input Error';
    default:
      return 'Error';
  }
};

// Helper function to get styling based on error severity
const getErrorStyle = (severity: string, colors: ThemeColors) => {
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      return {
        container: { 
          backgroundColor: colors.status.errorBackground,
          borderColor: colors.status.error,
          borderWidth: 2,
        },
        title: { color: colors.status.error },
        message: { color: colors.status.error },
        userAction: { color: colors.status.error }
      };
    case ERROR_SEVERITY.HIGH:
      return {
        container: { 
          backgroundColor: colors.status.errorBackground,
          borderColor: colors.status.error,
          borderWidth: 1,
        },
        title: { color: colors.status.error },
        message: { color: colors.status.error },
        userAction: { color: colors.status.error }
      };
    case ERROR_SEVERITY.MEDIUM:
      return {
        container: { 
          backgroundColor: colors.status.warningBackground,
          borderColor: colors.status.warning,
          borderWidth: 1,
        },
        title: { color: colors.status.warning },
        message: { color: colors.status.warning },
        userAction: { color: colors.status.warning }
      };
    case ERROR_SEVERITY.LOW:
      return {
        container: { 
          backgroundColor: colors.status.infoBackground,
          borderColor: colors.status.info,
          borderWidth: 1,
        },
        title: { color: colors.status.info },
        message: { color: colors.status.info },
        userAction: { color: colors.status.info }
      };
    default:
      return {
        container: { 
          backgroundColor: colors.status.warningBackground,
          borderColor: colors.status.warning,
          borderWidth: 1,
        },
        title: { color: colors.status.warning },
        message: { color: colors.status.warning },
        userAction: { color: colors.status.warning }
      };
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  userAction: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// Hook for easy error handling in components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<AppError | null>(null);

  const handleError = React.useCallback((error: unknown, context?: string) => {
    const appError = ErrorHandler.handleApiError(error, context);
    setError(appError);
    
    // Auto-logout for authentication errors
    if (ErrorHandler.shouldLogout(appError)) {
      // You can add logout logic here or emit an event
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retry = React.useCallback((retryAction: () => void | Promise<void>) => {
    if (error && ErrorHandler.shouldRetry(error)) {
      clearError();
      retryAction();
    }
  }, [error, clearError]);

  return {
    error,
    handleError,
    clearError,
    retry,
    shouldRetry: error ? ErrorHandler.shouldRetry(error) : false
  };
};

export default ErrorDisplay; 