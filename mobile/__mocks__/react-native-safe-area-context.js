/**
 * Complete mock for react-native-safe-area-context
 * Fixes TypeError: (0, _codegenNativeComponent.default) is not a function
 */

const React = require('react');

// Mock SafeAreaProvider as a simple React component
export const SafeAreaProvider = React.forwardRef(({ children, ...props }, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': props.testID || 'safe-area-provider',
    className: 'mock-safe-area-provider'
  }, children);
});
SafeAreaProvider.displayName = 'SafeAreaProvider';

// Mock SafeAreaView as a simple React component
export const SafeAreaView = React.forwardRef(({ children, ...props }, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': props.testID || 'safe-area-view',
    className: 'mock-safe-area-view'
  }, children);
});
SafeAreaView.displayName = 'SafeAreaView';

// Mock useSafeAreaInsets hook
export const useSafeAreaInsets = () => ({
  top: 44,
  bottom: 34,
  left: 0,
  right: 0
});

// Mock useSafeAreaFrame hook
export const useSafeAreaFrame = () => ({
  x: 0,
  y: 0,
  width: 390,
  height: 844
});

// Mock initialWindowMetrics
export const initialWindowMetrics = {
  insets: { top: 44, bottom: 34, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 }
};

// Default export for CommonJS compatibility
const SafeAreaContext = {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics
};

module.exports = SafeAreaContext;
module.exports.SafeAreaProvider = SafeAreaProvider;
module.exports.SafeAreaView = SafeAreaView;
module.exports.useSafeAreaInsets = useSafeAreaInsets;
module.exports.useSafeAreaFrame = useSafeAreaFrame;
module.exports.initialWindowMetrics = initialWindowMetrics;

// Make sure hooks are available as direct exports
module.exports.default = {
  ...SafeAreaContext,
  useSafeAreaInsets,
  useSafeAreaFrame
};

// ES6 default export
export default SafeAreaContext;