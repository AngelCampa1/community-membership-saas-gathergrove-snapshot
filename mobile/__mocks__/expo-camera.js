/**
 * Mock for expo-camera
 */
const React = require('react');

const MockCamera = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': props.testID || 'mock-camera',
    className: 'mock-camera',
    style: {
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      ...props.style
    }
  }, 'Mock Camera');
});

MockCamera.displayName = 'MockCamera';

// Mock constants
const PermissionStatus = {
  UNDETERMINED: 'undetermined',
  GRANTED: 'granted',
  DENIED: 'denied'
};

const CameraType = {
  back: 'back',
  front: 'front'
};

const FlashMode = {
  off: 'off',
  on: 'on',
  auto: 'auto',
  torch: 'torch'
};

const BarCodeType = {
  qr: 'qr',
  pdf417: 'pdf417',
  datamatrix: 'datamatrix',
  code128: 'code128',
  code39: 'code39',
  code93: 'code93',
  codabar: 'codabar',
  ean13: 'ean13',
  ean8: 'ean8',
  itf14: 'itf14',
  upc_a: 'upc_a',
  upc_e: 'upc_e'
};

// Mock functions
const requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: 'never'
});

const getCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: 'never'
});

const takePictureAsync = jest.fn().mockResolvedValue({
  uri: 'mock://camera/photo.jpg',
  width: 1920,
  height: 1080
});

module.exports = {
  Camera: MockCamera,
  PermissionStatus,
  CameraType,
  FlashMode,
  BarCodeType,
  requestCameraPermissionsAsync,
  getCameraPermissionsAsync,
  takePictureAsync,
  default: MockCamera
};