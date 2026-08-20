/**
 * FeedbackModal Tests
 *
 * Simplified test suite focusing on reliably testable functionality.
 * Note: Text queries (getByText/getAllByText) have limitations with deeply
 * nested React Native components. Tests focus on testIDs, accessibility
 * labels, and behavior verification.
 */

import { render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { FeedbackModal } from '../FeedbackModal';
import * as Haptics from 'expo-haptics';

/**
 * Helper to safely trigger onChangeText for TextInput elements
 * Workaround for RNTL limitation where fireEvent.changeText sometimes receives undefined elements
 */
const changeTextSafely = (element: any, text: string) => {
  if (element && element.props && element.props.onChangeText) {
    element.props.onChangeText(text);
  } else {
    throw new Error(`Cannot change text - element or onChangeText handler not found`);
  }
};

/**
 * Helper to safely trigger onPress for pressable elements
 * Workaround for RNTL limitation where fireEvent.press sometimes fails with mock components
 */
const pressSafely = (element: any) => {
  if (element && element.props && element.props.onPress) {
    element.props.onPress();
  } else {
    throw new Error(`Cannot press - element or onPress handler not found`);
  }
};

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/services/apiClient');
jest.mock('expo-haptics');
jest.mock('../../utils/logger', () => ({
  logger: { error: jest.fn() },
}));

// Mock ThemeContext
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: { primary: '#FFFFFF', secondary: '#F2F2F7' },
      text: { primary: '#000000', secondary: '#666666', tertiary: '#999999', inverse: '#FFFFFF' },
      border: { primary: '#E5E5EA' },
      interactive: { primary: '#007AFF' },
    },
  }),
}));

// Import mocked modules
import { useAuth } from '@/hooks/useAuth';

describe('FeedbackModal', () => {
  const mockOnClose = jest.fn();
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockHapticImpact = Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false } as any);
    mockHapticImpact.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  describe('Rendering', () => {
    it('should render when visible is true', () => {
      const { getByLabelText } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      // Verify modal renders by checking for star rating
      expect(getByLabelText('Rate 1 out of 5 stars')).toBeTruthy();
      expect(getByLabelText('Rate 5 out of 5 stars')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByLabelText } = render(
        <FeedbackModal visible={false} onClose={mockOnClose} />
      );

      expect(queryByLabelText('Rate 1 out of 5 stars')).toBeNull();
    });

    it('should render all star ratings', () => {
      const { getByLabelText } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      for (let i = 1; i <= 5; i++) {
        expect(getByLabelText(`Rate ${i} out of 5 stars`)).toBeTruthy();
      }
    });

    it('should render form inputs for guests', () => {
      const { getByTestId } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      expect(getByTestId('feedback-message-input')).toBeTruthy();
      expect(getByTestId('feedback-name-input')).toBeTruthy();
      expect(getByTestId('feedback-email-input')).toBeTruthy();
    });

    it('should render and unmount without errors', () => {
      const { unmount } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Guest User Form', () => {
    it('should show name and email fields for guests', () => {
      mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false } as any);

      const { getByTestId } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      expect(getByTestId('feedback-name-input')).toBeTruthy();
      expect(getByTestId('feedback-email-input')).toBeTruthy();
    });

    it('should allow guest to enter name', async () => {
      const { getByTestId } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      const nameInput = getByTestId('feedback-name-input');

      // Verify the input exists and has the onChangeText handler
      expect(nameInput).toBeTruthy();
      expect(nameInput.props.onChangeText).toBeDefined();

      // Change the text (this updates component state)
      changeTextSafely(nameInput, 'John Doe');

      // Wait for React to re-render with new state, then verify value
      await waitFor(() => {
        const updatedInput = getByTestId('feedback-name-input');
        expect(updatedInput.props.value).toBe('John Doe');
      });
    });

    it('should allow guest to enter email', async () => {
      const { getByTestId } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      const emailInput = getByTestId('feedback-email-input');

      // Verify the input exists and has the onChangeText handler
      expect(emailInput).toBeTruthy();
      expect(emailInput.props.onChangeText).toBeDefined();

      // Change the text (this updates component state)
      changeTextSafely(emailInput, 'john@example.com');

      // Wait for React to re-render with new state, then verify value
      await waitFor(() => {
        const updatedInput = getByTestId('feedback-email-input');
        expect(updatedInput.props.value).toBe('john@example.com');
      });
    });
  });

  describe('Authenticated User Form', () => {
    it('should not show name/email fields for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: { user: { fullName: 'Jane Smith', email: 'jane@example.com' } },
        isAuthenticated: true,
      } as any);

      const { queryByTestId } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      expect(queryByTestId('feedback-name-input')).toBeNull();
      expect(queryByTestId('feedback-email-input')).toBeNull();
    });
  });

  describe('Star Rating', () => {
    it('should trigger haptic feedback on star press', async () => {
      const { getByLabelText } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      const star4 = getByLabelText('Rate 4 out of 5 stars');
      pressSafely(star4);

      await waitFor(() => {
        expect(mockHapticImpact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
      });
    });

    it('should allow rating selection', async () => {
      const { getByLabelText } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      pressSafely(getByLabelText('Rate 2 out of 5 stars'));
      await waitFor(() => expect(mockHapticImpact).toHaveBeenCalled());

      mockHapticImpact.mockClear();
      pressSafely(getByLabelText('Rate 5 out of 5 stars'));
      await waitFor(() => expect(mockHapticImpact).toHaveBeenCalled());
    });
  });

  describe('Message Input', () => {
    it('should allow entering feedback message', async () => {
      const { getByTestId } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      const messageInput = getByTestId('feedback-message-input');

      // Verify the input exists and has the onChangeText handler
      expect(messageInput).toBeTruthy();
      expect(messageInput.props.onChangeText).toBeDefined();

      // Change the text (this updates component state)
      changeTextSafely(messageInput, 'This is my feedback message');

      // Wait for React to re-render with new state, then verify value
      await waitFor(() => {
        const updatedInput = getByTestId('feedback-message-input');
        expect(updatedInput.props.value).toBe('This is my feedback message');
      });
    });
  });

  describe('Error Handling', () => {
    it('should not crash if haptics fail', async () => {
      mockHapticImpact.mockRejectedValue(new Error('Haptics unavailable'));

      const { getByLabelText } = render(
        <FeedbackModal visible={true} onClose={mockOnClose} />
      );

      // Even if haptics fail, the star press should still work
      const star5 = getByLabelText('Rate 5 out of 5 stars');
      pressSafely(star5);

      // The haptic should have been attempted (and failed silently)
      await waitFor(() => {
        expect(mockHapticImpact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
      });
    });
  });
});
