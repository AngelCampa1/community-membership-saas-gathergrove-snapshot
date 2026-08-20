/**
 * MOBILE TEST SETUP - BOUNDARY MOCKING ONLY
 *
 * This file mocks ONLY at system boundaries:
 * - React Native native modules (Platform, AsyncStorage, etc.)
 * - External services (push notifications, keychain)
 * - HTTP calls (via fetch mock)
 *
 * Internal services (memberService, eventService, authService) are NOT mocked.
 * Tests should use real implementations with HTTP mocking at the boundary.
 */

// CRITICAL: Global test environment setup
global.IS_TESTING = true;
global.__DEV__ = true;

// =============================================================================
// HTTP BOUNDARY MOCKING - Default fetch mock
// Tests should override with specific implementations
// =============================================================================

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
  })
);

// =============================================================================
// THEME CONTEXT - Required for component rendering (not a service mock)
// =============================================================================

const mockThemeColors = {
  primary:'#007AFF',
  secondary:'#5856D6',
  background: {
    primary:'#F2F2F7',
    secondary:'#FFFFFF',
    overlay:'rgba(0, 0, 0, 0.5)',
    card:'#FFFFFF',
  },
  text: {
    primary:'#000000',
    secondary:'#666666',
    tertiary:'#999999',
    inverse:'#FFFFFF',
    disabled:'#C7C7CC',
  },
  border: {
    primary:'#C7C7CC',
    secondary:'#E5E5EA',
  },
  interactive: {
    primary:'#007AFF',
    secondary:'#5856D6',
    destructive:'#FF3B30',
  },
  status: {
    success:'#34C759',
    warning:'#FF9500',
    error:'#FF3B30',
    info:'#007AFF',
    successBackground:'#d4edda',
    warningBackground:'#fff3cd',
    errorBackground:'#f8d7da',
    infoBackground:'#cce5ff',
  },
  shadow: {
    medium: {
      shadowColor:'#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    light: {
      shadowColor:'#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  },
};

jest.mock('@/contexts/ThemeContext', () => {
  const React = require('react');
  const RN = require('react-native');

  const ThemeProvider = ({ children }) => {
    return React.createElement(RN.View, { testID:'theme-provider' }, children);
  };

  return {
    ThemeProvider,
    ThemeColors: mockThemeColors, // Export type-compatible object for type imports
    useTheme: () => ({
      colors: mockThemeColors,
    }),
    useThemedStyles: (styleCreator) => styleCreator(mockThemeColors),
  };
});

// =============================================================================
// REACT NATIVE MOCKS - Native modules and APIs
// =============================================================================

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  const mockAccessibilityInfo = {
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  };

  const mockDimensions = {
    get: jest.fn().mockReturnValue({
      fontScale: 1.0,
      width: 375,
      height: 667,
      scale: 1,
    }),
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeEventListener: jest.fn(),
    set: jest.fn(),
  };

  const mockFindNodeHandle = jest.fn().mockReturnValue(123);

  const mockAppState = {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    currentState:'active',
  };

  // Store mocks in global for test access
  global.mockAccessibilityInfo = mockAccessibilityInfo;
  global.mockDimensions = mockDimensions;
  global.mockFindNodeHandle = mockFindNodeHandle;
  global.mockAppState = mockAppState;

  return {
    ...RN,
    AccessibilityInfo: mockAccessibilityInfo,
    Dimensions: mockDimensions,
    useWindowDimensions: () => ({
      fontScale: 1.0,
      width: 375,
      height: 667,
      scale: 1,
    }),
    findNodeHandle: mockFindNodeHandle,
    AppState: mockAppState,
  };
});

// =============================================================================
// NAVIGATION - Framework mock (like next/navigation on frontend)
// =============================================================================

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    canGoBack: jest.fn(() => true),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    setOptions: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => callback()),
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }) => children,
  createNavigationContainerRef: () => ({ current: null }),
}));

// =============================================================================
// EXTERNAL STORAGE - True boundary mocks
// =============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn().mockResolvedValue(true),
  getInternetCredentials: jest.fn().mockResolvedValue(null),
  resetInternetCredentials: jest.fn().mockResolvedValue(true),
  hasInternetCredentials: jest.fn().mockResolvedValue(false),
}));

// =============================================================================
// PUSH NOTIFICATIONS - External service boundary
// =============================================================================

// REMOVED: pushNotificationService global mock (2025-12-24)
// Reason: Violated boundary-only mocking - prevented testing real push notification logic
// Tests should use REAL pushNotificationService with mocked Expo.Notifications boundary
//
// jest.mock('@/services/pushNotificationService', () => ({ ... }));

// =============================================================================
// LEGACY SERVICE MOCKS - DEPRECATED
// These are kept temporarily for backwards compatibility.
// New tests should NOT rely on these - use real services with HTTP mocking.
// =============================================================================

// NOTE: useAuth mock is kept because many components depend on it.
// Tests should eventually migrate to testing auth state via HTTP responses.
const mockAuthUser = {
  token:'mock-token',
  user: {
    userId: 1,
    fullName:'Test User',
    email:'test@example.com',
    role:'Member',
    clubId: 123,
    clubTier:'Grow',
  },
  isAuthenticated: true,
};

const mockAuthState = {
  user: mockAuthUser,
  loading: false,
  error: null,
  login: jest.fn().mockResolvedValue(mockAuthUser),
  logout: jest.fn().mockResolvedValue(undefined),
  checkStoredSession: jest.fn().mockResolvedValue(mockAuthUser),
  clearError: jest.fn(),
};

const mockUseAuth = jest.fn(() => mockAuthState);
jest.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

// Export for test access
global.mockUseAuth = mockUseAuth;
global.mockAuthUser = mockAuthUser;
global.mockAuthState = mockAuthState;
global.mockThemeColors = mockThemeColors;

console.log('📱 Mobile test environment initialized with boundary-only mocking');
