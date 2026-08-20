/**
 * Mock for @expo/vector-icons
 */
const React = require('react');

// Mock icon component that returns a proper React element
const createIconSet = (glyphMap, fontFamily) => {
  const Icon = React.forwardRef(({ name, size = 24, color = '#000', style, ...props }, ref) => {
    return React.createElement('div', {
      ...props,
      ref,
      'data-testid': props.testID || `expo-icon-${name}`,
      className: `mock-expo-icon mock-expo-icon-${name}`,
      style: {
        width: size,
        height: size,
        color,
        fontSize: size,
        fontFamily: fontFamily || 'Material Icons',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }
    }, name || 'icon');
  });

  Icon.displayName = `ExpoIcon(${fontFamily})`;
  
  // Add static methods
  Icon.getImageSource = jest.fn().mockResolvedValue({ uri: 'mock-expo-icon' });
  Icon.getImageSourceSync = jest.fn().mockReturnValue({ uri: 'mock-expo-icon' });
  Icon.getRawGlyphMap = jest.fn().mockReturnValue(glyphMap || {});
  Icon.getFontFamily = jest.fn().mockReturnValue(fontFamily);

  return Icon;
};

// Create all icon sets
const MaterialIcons = createIconSet({}, 'MaterialIcons');
const MaterialCommunityIcons = createIconSet({}, 'MaterialCommunityIcons');
const FontAwesome = createIconSet({}, 'FontAwesome');
const FontAwesome5 = createIconSet({}, 'FontAwesome5');
const FontAwesome6 = createIconSet({}, 'FontAwesome6');
const Ionicons = createIconSet({}, 'Ionicons');
const Entypo = createIconSet({}, 'Entypo');
const AntDesign = createIconSet({}, 'AntDesign');
const SimpleLineIcons = createIconSet({}, 'SimpleLineIcons');
const Octicons = createIconSet({}, 'Octicons');
const Foundation = createIconSet({}, 'Foundation');
const EvilIcons = createIconSet({}, 'EvilIcons');
const Feather = createIconSet({}, 'Feather');
const Zocial = createIconSet({}, 'Zocial');

// Export all icon sets
module.exports = {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
  Entypo,
  AntDesign,
  SimpleLineIcons,
  Octicons,
  Foundation,
  EvilIcons,
  Feather,
  Zocial,
  createIconSet,
  default: MaterialIcons
};

// Named exports
exports.MaterialIcons = MaterialIcons;
exports.MaterialCommunityIcons = MaterialCommunityIcons;
exports.FontAwesome = FontAwesome;
exports.FontAwesome5 = FontAwesome5;
exports.FontAwesome6 = FontAwesome6;
exports.Ionicons = Ionicons;
exports.Entypo = Entypo;
exports.AntDesign = AntDesign;
exports.SimpleLineIcons = SimpleLineIcons;
exports.Octicons = Octicons;
exports.Foundation = Foundation;
exports.EvilIcons = EvilIcons;
exports.Feather = Feather;
exports.Zocial = Zocial;
exports.createIconSet = createIconSet;