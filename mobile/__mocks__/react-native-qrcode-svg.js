/**
 * Mock for react-native-qrcode-svg
 * Prevents QR code generation errors in tests
 */

const React = require('react');

const QRCode = React.forwardRef(({ value, size = 100, color = '#000', backgroundColor = '#fff', ...props }, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': props.testID || 'qr-code',
    className: 'mock-qr-code',
    style: {
      width: size,
      height: size,
      backgroundColor: backgroundColor,
      color: color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ccc',
      ...props.style
    }
  }, `QR: ${value}`);
});

QRCode.displayName = 'QRCode';

module.exports = QRCode;
module.exports.default = QRCode;

export default QRCode;