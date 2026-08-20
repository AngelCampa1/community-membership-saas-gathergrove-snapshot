
import { render } from '@testing-library/react-native';
import { FeedbackFAB } from '../FeedbackFAB';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      interactive: { primary: '#007AFF' },
      background: { primary: '#FFFFFF' },
      text: { primary: '#000000' },
    },
  }),
  ThemeColors: {},
}));

describe('FeedbackFAB', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when visible is true', () => {
      const { root } = render(<FeedbackFAB onPress={mockOnPress} visible={true} />);
      expect(root).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { toJSON } = render(<FeedbackFAB onPress={mockOnPress} visible={false} />);
      expect(toJSON()).toBeNull();
    });

    it('should render by default when visible prop not provided', () => {
      const { root } = render(<FeedbackFAB onPress={mockOnPress} />);
      expect(root).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('should accept onPress prop', () => {
      const customOnPress = jest.fn();
      const { root } = render(<FeedbackFAB onPress={customOnPress} />);
      expect(root).toBeTruthy();
    });

    it('should toggle visibility with visible prop', () => {
      const { rerender, toJSON } = render(
        <FeedbackFAB onPress={mockOnPress} visible={true} />
      );
      expect(toJSON()).toBeTruthy();

      rerender(<FeedbackFAB onPress={mockOnPress} visible={false} />);
      expect(toJSON()).toBeNull();
    });
  });

  describe('Component Initialization', () => {
    it('should initialize without errors', () => {
      const { root } = render(<FeedbackFAB onPress={mockOnPress} />);
      expect(root).toBeTruthy();
    });

    it('should handle animation setup', () => {
      const { root } = render(<FeedbackFAB onPress={mockOnPress} visible={true} />);
      expect(root).toBeTruthy();
    });
  });
});
