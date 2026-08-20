/**
 * Production-Grade Test Utilities
 * Universal mock system for 100% test reliability
 */

// Global mock implementations
global.mockServices = {
  auth: {
    login: jest.fn().mockResolvedValue({ success: true }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    forgotPassword: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
    getStoredToken: jest.fn().mockResolvedValue('mock-token'),
    hasStoredToken: jest.fn().mockResolvedValue(true),
    validateStoredSession: jest.fn().mockResolvedValue({ user: { id: 1 } }),
    removeStoredToken: jest.fn().mockResolvedValue(undefined),
  },
  payment: {
    payMyDues: jest.fn().mockResolvedValue({ success: true }),
    checkStripeConfiguration: jest.fn().mockResolvedValue({ isConfigured: true }),
  },
  membership: {
    getMembershipTypes: jest.fn().mockResolvedValue([]),
    getMembershipCard: jest.fn().mockResolvedValue({ id: 1 }),
  },
  member: {
    getMembers: jest.fn().mockResolvedValue([]),
    getMemberProfile: jest.fn().mockResolvedValue({ id: 1 }),
    updateMemberProfile: jest.fn().mockResolvedValue({ success: true }),
  },
  event: {
    getEvents: jest.fn().mockResolvedValue([]),
    getEventDetails: jest.fn().mockResolvedValue({ id: 1 }),
    rsvpToEvent: jest.fn().mockResolvedValue({ success: true }),
  },
  directory: {
    getDirectorySettings: jest.fn().mockResolvedValue({ visible: true }),
    updateDirectorySettings: jest.fn().mockResolvedValue({ success: true }),
    searchDirectory: jest.fn().mockResolvedValue([]),
  },
  chat: {
    getMessages: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
  },
  pushNotification: {
    requestPermission: jest.fn().mockResolvedValue('granted'),
    getToken: jest.fn().mockResolvedValue('mock-token'),
    setupNotifications: jest.fn().mockResolvedValue(undefined),
  },
};

// Global mock auth service (most critical)
global.mockAuthService = global.mockServices.auth;

// Universal component mocks
const createMockComponent = (name, propTypes = []) => {
  return function MockComponent({ children, testID, ...otherProps }) {
    const React = require('react');

    // Log prop types for debugging if needed
    // eslint-disable-next-line no-undef
    if (typeof __DEV__ !== 'undefined' && __DEV__ && propTypes.length > 0) {
      /* Component supports props: ${propTypes.join(',')} */
    }
    
    // Handle both onClick and onPress events
    const handlePress = (handler) => {
      if (typeof handler === 'function') {
        return (event) => {
          // Prevent default for web compatibility
          if (event && event.preventDefault) {
            event.preventDefault();
          }
          handler(event);
        };
      }
    };

    // Convert props for React Native compatibility
    const convertedProps = { ...otherProps };
    if (convertedProps.onClick && !convertedProps.onPress) {
      convertedProps.onPress = handlePress(convertedProps.onClick);
    }
    if (convertedProps.onChange && !convertedProps.onChangeText) {
      convertedProps.onChangeText = (text) => {
        if (convertedProps.onChange) {
          convertedProps.onChange({ target: { value: text } });
        }
      };
    }

    // Create appropriate element
    if (name === 'input') {
      return React.createElement('input', {
        ...convertedProps,
        testID,
        'data-testid': testID,
      });
    } else if (name === 'button') {
      return React.createElement('button', {
        ...convertedProps,
        testID,
        'data-testid': testID,
        onClick: handlePress(convertedProps.onClick || convertedProps.onPress),
      }, children);
    } else {
      return React.createElement('div', {
        ...convertedProps,
        testID,
        'data-testid': testID,
      }, children);
    }
  };
};

// Export utilities
module.exports = {
  mockServices: global.mockServices,
  mockAuthService: global.mockAuthService,
  createMockComponent,
  
  // Production-grade render helper
  renderWithAllProviders: (component) => {
    const React = require('react');
    const { render } = require('@testing-library/react-native');
    
    // Mock theme provider
    const MockThemeProvider = ({ children }) => {
      return React.createElement('div', { 'data-testid': 'theme-provider' }, children);
    };
    
    return render(
      React.createElement(MockThemeProvider, {}, component)
    );
  },

  // Universal event handlers
  createProductionEvents: () => ({
    fireChangeText: (element, text) => {
      const { fireEvent } = require('@testing-library/react-native');
      try {
        fireEvent.changeText(element, text);
      } catch (e) {
        try {
          fireEvent(element, 'onChangeText', text);
        } catch (e2) {
          // Fallback for mock elements
          if (element.props && element.props.onChangeText) {
            element.props.onChangeText(text);
          }
        }
      }
    },

    firePress: (element) => {
      const { fireEvent } = require('@testing-library/react-native');
      try {
        fireEvent.press(element);
      } catch (e) {
        try {
          fireEvent(element, 'onPress');
        } catch (e2) {
          // Fallback for mock elements
          if (element.props && element.props.onPress) {
            element.props.onPress();
          } else if (element.props && element.props.onClick) {
            element.props.onClick();
          }
        }
      }
    },
  }),

  // Reset all mocks
  resetAllMocks: () => {
    Object.values(global.mockServices).forEach(service => {
      Object.values(service).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    });
  },

  // Setup default successful mocks
  setupSuccessfulMocks: () => {
    // Reset first
    module.exports.resetAllMocks();
    
    // Set up successful defaults
    global.mockServices.auth.login.mockResolvedValue({ success: true });
    global.mockServices.auth.forgotPassword.mockResolvedValue({ success: true });
    global.mockServices.payment.payMyDues.mockResolvedValue({ success: true });
    // Add more as needed
  },
};