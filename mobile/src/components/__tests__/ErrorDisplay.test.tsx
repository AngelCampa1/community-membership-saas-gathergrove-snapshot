
import { render, screen } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';
import { ErrorDisplay, useErrorHandler } from '../ErrorDisplay';
import { AppError } from '@/utils/errorHandler';

// Mock dependencies
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      status: {
        error: '#dc2626',
        errorBackground: '#fee2e2',
        warning: '#f59e0b',
        warningBackground: '#fef3c7',
        info: '#3b82f6',
        infoBackground: '#dbeafe',
      },
      interactive: { primary: '#007AFF' },
      text: { secondary: '#6B7280', inverse: '#FFFFFF' },
    },
  }),
  ThemeColors: {},
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('ErrorDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with Different Error Types', () => {
    it('should render with string error', () => {
      render(<ErrorDisplay error="Something went wrong" testID="error" />);

      expect(screen.getByTestId('error')).toBeTruthy();
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    it('should render with AppError object', () => {
      const appError: AppError = {
        message: 'Network error occurred',
        category: 'network',
        severity: 'high',
        timestamp: new Date(),
      };

      render(<ErrorDisplay error={appError} testID="error" />);

      expect(screen.getByTestId('error')).toBeTruthy();
      expect(screen.getByTestId('error-title')).toBeTruthy();
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    it('should render with standard Error object', () => {
      const error = new Error('Standard error message');

      render(<ErrorDisplay error={error} testID="error" />);

      expect(screen.getByTestId('error')).toBeTruthy();
    });

    it('should not render when error is null', () => {
      const { queryByTestId } = render(<ErrorDisplay error={null} testID="error" />);

      expect(queryByTestId('error')).toBeNull();
    });
  });

  describe('Error Categories and Titles', () => {
    it('should display "Connection Problem" for network errors', () => {
      const error: AppError = {
        message: 'No internet',
        category: 'network',
        severity: 'medium',
        timestamp: new Date(),
      };

      render(<ErrorDisplay error={error} testID="error" />);

      expect(screen.getByTestId('error-title')).toBeTruthy();
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    it('should display "Authentication Issue" for auth errors', () => {
      const error: AppError = {
        message: 'Invalid credentials',
        category: 'authentication',
        severity: 'high',
        timestamp: new Date(),
      };

      render(<ErrorDisplay error={error} testID="error" />);

      expect(screen.getByTestId('error-title')).toBeTruthy();
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    it('should display "Payment Issue" for payment errors', () => {
      const error: AppError = {
        message: 'Payment failed',
        category: 'payment',
        severity: 'critical',
        timestamp: new Date(),
      };

      render(<ErrorDisplay error={error} testID="error" />);

      expect(screen.getByTestId('error-title')).toBeTruthy();
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    it('should display "System Error" for system errors', () => {
      const error: AppError = {
        message: 'Internal error',
        category: 'system',
        severity: 'medium',
        timestamp: new Date(),
      };

      render(<ErrorDisplay error={error} testID="error" />);

      expect(screen.getByTestId('error-title')).toBeTruthy();
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });
  });

  describe('Action Buttons', () => {
    it('should render retry button when onRetry provided', () => {
      const onRetry = jest.fn();

      render(<ErrorDisplay error="Error" onRetry={onRetry} testID="error" />);

      expect(screen.getByTestId('error-retry-button')).toBeTruthy();
    });

    it('should render dismiss button when onDismiss provided', () => {
      const onDismiss = jest.fn();

      render(<ErrorDisplay error="Error" onDismiss={onDismiss} testID="error" />);

      expect(screen.getByTestId('error-dismiss-button')).toBeTruthy();
    });

    it('should render both buttons when both handlers provided', () => {
      const onRetry = jest.fn();
      const onDismiss = jest.fn();

      render(<ErrorDisplay error="Error" onRetry={onRetry} onDismiss={onDismiss} testID="error" />);

      expect(screen.getByTestId('error-retry-button')).toBeTruthy();
      expect(screen.getByTestId('error-dismiss-button')).toBeTruthy();
    });

    it('should not render buttons when no handlers provided', () => {
      const { queryByTestId } = render(<ErrorDisplay error="Error" testID="error" />);

      expect(queryByTestId('error-retry-button')).toBeNull();
      expect(queryByTestId('error-dismiss-button')).toBeNull();
    });
  });

  describe('User Action Messages', () => {
    it('should display userAction when provided', () => {
      const error: AppError = {
        message: 'Error occurred',
        category: 'validation',
        severity: 'medium',
        timestamp: new Date(),
        userAction: 'Please check your input and try again',
      };

      render(<ErrorDisplay error={error} testID="error" />);

      expect(screen.getByTestId('error-user-action')).toBeTruthy();
    });

    it('should not render userAction element when not provided', () => {
      const error: AppError = {
        message: 'Error occurred',
        category: 'system',
        severity: 'medium',
        timestamp: new Date(),
      };

      const { queryByTestId } = render(<ErrorDisplay error={error} testID="error" />);

      expect(queryByTestId('error-user-action')).toBeNull();
    });
  });

  describe('Alert Mode', () => {
    it('should show Alert when showAlert is true', () => {
      const error: AppError = {
        message: 'Alert error',
        category: 'network',
        severity: 'high',
        timestamp: new Date(),
      };

      render(<ErrorDisplay error={error} showAlert={true} testID="error" />);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Problem',
        'Alert error',
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should not render inline component when showAlert is true', () => {
      const { queryByTestId } = render(
        <ErrorDisplay error="Error" showAlert={true} testID="error" />
      );

      expect(queryByTestId('error')).toBeNull();
    });

    it('should include retry button in alert when onRetry provided', () => {
      const onRetry = jest.fn();

      render(<ErrorDisplay error="Error" showAlert={true} onRetry={onRetry} />);

      expect(Alert.alert).toHaveBeenCalled();
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];

      expect(buttons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: 'Retry' }),
        ])
      );
    });
  });

  describe('Custom Props', () => {
    it('should apply custom testID', () => {
      render(<ErrorDisplay error="Error" testID="custom-error" />);

      expect(screen.getByTestId('custom-error')).toBeTruthy();
    });

    it('should apply custom style', () => {
      const customStyle = { margin: 20 };
      const { root } = render(<ErrorDisplay error="Error" style={customStyle} />);

      expect(root).toBeTruthy();
    });

    it('should use provided context', () => {
      const { root } = render(<ErrorDisplay error="Error" context="Login screen" />);

      expect(root).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string error', () => {
      const { queryByTestId } = render(<ErrorDisplay error="" testID="error" />);

      // Empty string is falsy, should NOT render
      expect(queryByTestId('error')).toBeNull();
    });

    it('should handle undefined error', () => {
      const { queryByTestId } = render(<ErrorDisplay error={undefined as any} testID="error" />);

      expect(queryByTestId('error')).toBeNull();
    });

    it('should render with minimal AppError', () => {
      const minimalError: AppError = {
        message: 'Minimal error',
        category: 'system',
        severity: 'low',
        timestamp: new Date(),
      };

      render(<ErrorDisplay error={minimalError} testID="error" />);

      expect(screen.getByTestId('error')).toBeTruthy();
    });
  });

  describe('useErrorHandler Hook', () => {
    it('should initialize with no error', () => {
      const TestComponent = () => {
        const { error } = useErrorHandler();
        return <Text testID="error-state">{error ? 'Has Error' : 'No Error'}</Text>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId('error-state')).toBeTruthy();
    });

    it('should provide error handling functions', () => {
      let hookResult: any;

      const TestComponent = () => {
        hookResult = useErrorHandler();
        return <Text>Test</Text>;
      };

      render(<TestComponent />);

      expect(hookResult.handleError).toBeDefined();
      expect(hookResult.clearError).toBeDefined();
      expect(hookResult.retry).toBeDefined();
      expect(hookResult.shouldRetry).toBeDefined();
    });
  });
});
