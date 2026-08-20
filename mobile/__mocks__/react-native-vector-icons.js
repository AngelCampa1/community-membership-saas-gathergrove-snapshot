/**
 * Mock for react-native-vector-icons
 */
const React = require('react');

// Mock icon component that returns a proper React element
const createIconSet = (glyphMap, fontFamily) => {
  const Icon = React.forwardRef(({ name, size = 24, color = '#000', style, ...props }, ref) => {
    return React.createElement('div', {
      ...props,
      ref,
      'data-testid': props.testID || `icon-${name}`,
      className: `mock-icon mock-icon-${name}`,
      style: {
        width: size,
        height: size,
        color,
        fontSize: size,
        fontFamily: 'MaterialIcons',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }
    }, name);
  });

  Icon.displayName = `Icon(${fontFamily})`;
  
  // Add static methods
  Icon.getImageSource = jest.fn().mockResolvedValue({ uri: 'mock-icon' });
  Icon.getImageSourceSync = jest.fn().mockReturnValue({ uri: 'mock-icon' });
  Icon.getRawGlyphMap = jest.fn().mockReturnValue(glyphMap || {});
  Icon.getFontFamily = jest.fn().mockReturnValue(fontFamily);

  return Icon;
};

// Create MaterialIcons
const MaterialIconsComponent = createIconSet({}, 'MaterialIcons');

// Export individual icon sets
export const MaterialIcons = MaterialIconsComponent;
export const MaterialCommunityIcons = createIconSet({}, 'MaterialCommunityIcons');
export const FontAwesome = createIconSet({}, 'FontAwesome');
export const FontAwesome5 = createIconSet({}, 'FontAwesome5');
export const Ionicons = createIconSet({}, 'Ionicons');
export const Entypo = createIconSet({}, 'Entypo');
export const AntDesign = createIconSet({}, 'AntDesign');

// Default export
export default MaterialIconsComponent;

// For import statements like 'MaterialIcons'
module.exports = MaterialIconsComponent;
module.exports.MaterialIcons = MaterialIconsComponent;
module.exports.MaterialCommunityIcons = MaterialCommunityIcons;
module.exports.FontAwesome = FontAwesome;
module.exports.FontAwesome5 = FontAwesome5;
module.exports.Ionicons = Ionicons;
module.exports.Entypo = Entypo;
module.exports.AntDesign = AntDesign;