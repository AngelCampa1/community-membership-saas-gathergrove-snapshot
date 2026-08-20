/**
 * EMERGENCY React Native Mock - Nuclear Option
 * Complete React Native mock to avoid window conflicts
 */

// Mock jest if it's not available in the global scope
const mockJest = typeof jest !== 'undefined' ? jest : {
  fn: () => () => {},
};

export const Alert = {
  alert: mockJest.fn(),
};

export const Platform = {
  OS: 'ios',
  select: (specifics) => specifics.ios || specifics.default,
  isPad: false,
  isTVOS: false,
  Version: '14.0',
};

export const Dimensions = {
  get: mockJest.fn(() => ({
    width: 375,
    height: 812,
    scale: 3,
    fontScale: 1,
  })),
  addEventListener: mockJest.fn(),
  removeEventListener: mockJest.fn(),
};

export const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

// Mock all the basic components as proper React elements
const React = require('react');

// Create mock components that work with fireEvent
// CRITICAL: Use actual React components (not string types) to work with React Test Renderer
const mockComponent = (name) => {
  const Component = React.forwardRef((props, ref) => {
    const { children, onPress, onPressIn, onPressOut, onLongPress, testID, ...restProps } = props;

    // Map React Native events to DOM events for actual functionality
    const handlers = {};
    if (onPress) handlers.onClick = onPress;
    if (onPressIn) handlers.onMouseDown = onPressIn;
    if (onPressOut) handlers.onMouseUp = onPressOut;
    if (onLongPress) handlers.onContextMenu = (e) => { e.preventDefault(); onLongPress(); };

    // Use 'div' but the component function itself is the type
    return React.createElement('div', {
      ...restProps,
      ...handlers,
      ref,
      // CRITICAL: Keep React Native event props for fireEvent to find
      onPress,
      onPressIn,
      onPressOut,
      onLongPress,
      // CRITICAL: Keep testID for getByTestId to work
      testID,
      'data-testid': testID || restProps['data-testid'],
      className: `mock-${name.toLowerCase()}`,
      role: restProps.accessibilityRole || (onPress ? 'button' : 'generic')
    }, children);
  });

  Component.displayName = name;
  return Component;
};

export const View = mockComponent('View');
export const Text = mockComponent('Text');

// Special TextInput component that renders as an actual input element
export const TextInput = React.forwardRef(({
  onChangeText,
  value,
  placeholder,
  multiline,
  secureTextEntry,
  keyboardType,
  editable = true,
  maxLength,
  autoCapitalize,
  testID,
  ...props
}, ref) => {
  const handleChange = (e) => {
    if (onChangeText) {
      onChangeText(e.target.value);
    }
  };

  // Use standard HTML input element
  const elementType = multiline ? 'textarea' : 'input';
  const inputProps = {
    ...props,
    ref,
    value: value || '',
    placeholder,
    onChange: handleChange,
    // Preserve React Native-specific props for test access
    onChangeText,
    keyboardType,
    multiline,
    secureTextEntry,
    maxLength,
    autoCapitalize,
    editable,
    disabled: !editable,
    // CRITICAL: Keep testID for getByTestId to work
    testID,
    'data-testid': testID || props['data-testid'],
    className: 'mock-textinput',
  };

  if (!multiline) {
    inputProps.type = secureTextEntry ? 'password' : (keyboardType === 'email-address' ? 'email' : 'text');
  }

  return React.createElement(elementType, inputProps);
});
TextInput.displayName = 'TextInput';

export const ScrollView = mockComponent('ScrollView');
export const TouchableOpacity = mockComponent('TouchableOpacity');
export const TouchableHighlight = mockComponent('TouchableHighlight');
export const TouchableWithoutFeedback = mockComponent('TouchableWithoutFeedback');
export const Pressable = mockComponent('Pressable');
export const Image = mockComponent('Image');
export const Button = mockComponent('Button');
export const ActivityIndicator = mockComponent('ActivityIndicator');

// Special Switch component - Use 'select' to distinguish from TextInput's 'input'
// IMPORTANT: No useState to avoid unmounting during detectHostComponentNames()
export const Switch = React.forwardRef((props, ref) => {
  const {
    onValueChange,
    value = false,
    disabled = false,
    testID,
    ...restProps
  } = props;

  const handleChange = (e) => {
    const newValue = e.target.value === 'true';
    if (onValueChange && !disabled) {
      onValueChange(newValue);
    }
  };

  // Use 'select' element to be unique from TextInput's 'input'
  // Keep original boolean value in props for test assertions
  return React.createElement('select', {
    ...restProps,
    ref,
    value, // Keep original boolean - React will convert for DOM
    onChange: handleChange,
    disabled,
    // CRITICAL: Keep React Native props for fireEvent access
    onValueChange,
    // CRITICAL: Keep testID for getByTestId to work
    testID,
    'data-testid': testID || restProps['data-testid'],
    className: 'mock-switch',
    role: 'switch',
    'aria-checked': value,
  }, [
    React.createElement('option', { key: 'false', value: 'false' }, 'Off'),
    React.createElement('option', { key: 'true', value: 'true' }, 'On')
  ]);
});
Switch.displayName = 'Switch';

// Special Modal component that respects visible prop
export const Modal = React.forwardRef(({ visible = true, children, onRequestClose: _onRequestClose, ...props }, ref) => {
  // Don't render children when not visible
  if (!visible) {
    return null;
  }

  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': props.testID || props['data-testid'],
    className: 'mock-modal',
    role: 'dialog',
  }, children);
});
Modal.displayName = 'Modal';

// FlatList needs special handling for data and renderItem
export const FlatList = React.forwardRef(({ data = [], renderItem, keyExtractor, ListEmptyComponent, ...props }, ref) => {
  const children = data.length > 0
    ? data.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index.toString();
        return React.createElement('div', { key }, renderItem ? renderItem({ item, index }) : null);
      })
    : (ListEmptyComponent ? (typeof ListEmptyComponent === 'function' ? React.createElement(ListEmptyComponent) : ListEmptyComponent) : null);

  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': props.testID || props['data-testid'],
    className: 'mock-flatlist',
  }, children);
});
FlatList.displayName = 'FlatList';

export const RefreshControl = mockComponent('RefreshControl');
export const SafeAreaView = mockComponent('SafeAreaView');
export const KeyboardAvoidingView = mockComponent('KeyboardAvoidingView');

export const Animated = {
  View: mockComponent('Animated.View'),
  Text: mockComponent('Animated.Text'),
  ScrollView: mockComponent('Animated.ScrollView'),
  FlatList: mockComponent('Animated.FlatList'),
  Value: class {
    constructor(value) {
      this._value = value;
    }
    setValue(value) {
      this._value = value;
    }
    addListener() {
      return { remove: jest.fn() };
    }
    removeAllListeners() {}
  },
  timing: () => ({
    start: jest.fn((callback) => callback && callback({ finished: true })),
  }),
  spring: () => ({
    start: jest.fn((callback) => callback && callback({ finished: true })),
  }),
  sequence: () => ({
    start: jest.fn((callback) => callback && callback({ finished: true })),
  }),
  parallel: () => ({
    start: jest.fn((callback) => callback && callback({ finished: true })),
  }),
  createAnimatedComponent: (component) => mockComponent(`Animated.${component.displayName || 'Component'}`),
};

export const Linking = {
  openURL: mockJest.fn(() => Promise.resolve(true)),
  addEventListener: mockJest.fn(),
  removeEventListener: mockJest.fn(),
  getInitialURL: mockJest.fn(() => Promise.resolve(null)),
  canOpenURL: mockJest.fn(() => Promise.resolve(true)),
};

export const Keyboard = {
  addListener: mockJest.fn(() => ({ remove: mockJest.fn() })),
  removeListener: mockJest.fn(),
  dismiss: mockJest.fn(),
};

export const BackHandler = {
  addEventListener: mockJest.fn(() => ({ remove: mockJest.fn() })),
  removeEventListener: mockJest.fn(),
  exitApp: mockJest.fn(),
};

export const Share = {
  share: mockJest.fn(() => Promise.resolve({ action: 'sharedAction' })),
};

// Add Appearance and useColorScheme for theme support
export const Appearance = {
  getColorScheme: mockJest.fn(() => 'light'),
  addChangeListener: mockJest.fn(() => ({ remove: mockJest.fn() })),
  removeChangeListener: mockJest.fn(),
};

export const useColorScheme = mockJest.fn(() => 'light');

// Default export
const ReactNativeMock = {
  Alert,
  Platform,
  Dimensions,
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  Button,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  RefreshControl,
  SafeAreaView,
  KeyboardAvoidingView,
  Animated,
  Linking,
  Share,
  Keyboard,
  BackHandler,
  Appearance,
  useColorScheme,
};

// CommonJS compatibility
module.exports = ReactNativeMock;
module.exports.Alert = Alert;
module.exports.Platform = Platform;
module.exports.Dimensions = Dimensions;
module.exports.StyleSheet = StyleSheet;
module.exports.View = View;
module.exports.Text = Text;
module.exports.TextInput = TextInput;
module.exports.ScrollView = ScrollView;
module.exports.TouchableOpacity = TouchableOpacity;
module.exports.TouchableHighlight = TouchableHighlight;
module.exports.TouchableWithoutFeedback = TouchableWithoutFeedback;
module.exports.Pressable = Pressable;
module.exports.Image = Image;
module.exports.Button = Button;
module.exports.ActivityIndicator = ActivityIndicator;
module.exports.Switch = Switch;
module.exports.Modal = Modal;
module.exports.FlatList = FlatList;
module.exports.RefreshControl = RefreshControl;
module.exports.SafeAreaView = SafeAreaView;
module.exports.KeyboardAvoidingView = KeyboardAvoidingView;
module.exports.Animated = Animated;
module.exports.Linking = Linking;
module.exports.Share = Share;
module.exports.Keyboard = Keyboard;
module.exports.BackHandler = BackHandler;
module.exports.Appearance = Appearance;
module.exports.useColorScheme = useColorScheme;

export default ReactNativeMock;