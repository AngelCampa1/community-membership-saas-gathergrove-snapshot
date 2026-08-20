/**
 * Web compatibility stubs for native-only React Native modules
 * This file provides mock implementations for native modules that don't work on web
 */

// Mock for codegenNativeCommands
const mockCodegenNativeCommands = () => ({
  blur: () => {},
  focus: () => {},
});

// Mock for codegenNativeComponent
const mockCodegenNativeComponent = () => {
  // Return a basic web-compatible component
  return function MockComponent() {
    return null;
  };
};

// Mock NativeCardForm
const mockNativeCardForm = {
  Commands: {
    blur: () => {},
    focus: () => {},
  },
  __INTERNAL_VIEW_CONFIG: {
    uiViewClassName: 'CardForm',
    directEventTypes: {},
    validAttributes: {},
  },
  default: function MockCardForm() {
    return null;
  },
};

// Mock NativeStripeSdkModule
const mockNativeStripeSdkModule = {
  default: {
    initPaymentSheet: () => Promise.resolve(),
    presentPaymentSheet: () => Promise.resolve(),
    confirmPaymentSheetPayment: () => Promise.resolve(),
    createPaymentMethod: () => Promise.resolve({
      paymentMethod: { id: 'pm_mock_web' },
      error: null,
    }),
  },
};

// Mock for useStripe hook
const mockUseStripe = () => ({
  createPaymentMethod: () => Promise.resolve({
    paymentMethod: { id: 'pm_mock_web' },
    error: null,
  }),
  confirmPayment: () => Promise.resolve({
    paymentIntent: { id: 'pi_mock_web' },
    error: null,
  }),
});

// Mock for StripeProvider
const mockStripeProvider = ({ children }) => children;

// Mock NativeStripeContainer
const mockNativeStripeContainer = {
  default: function MockStripeContainer() {
    return null;
  },
};

// Export appropriate mocks based on what's being imported
module.exports = mockCodegenNativeCommands;
module.exports.default = mockCodegenNativeCommands;
module.exports.Commands = mockNativeCardForm.Commands;
module.exports.__INTERNAL_VIEW_CONFIG = mockNativeCardForm.__INTERNAL_VIEW_CONFIG;
module.exports.useStripe = mockUseStripe;
module.exports.StripeProvider = mockStripeProvider;
module.exports.CardField = mockNativeCardForm.default;

// Make all mock functions available
Object.assign(module.exports, {
  mockCodegenNativeCommands,
  mockCodegenNativeComponent,
  mockNativeCardForm,
  mockNativeStripeSdkModule,
  mockNativeStripeContainer,
  mockUseStripe,
  mockStripeProvider,
});