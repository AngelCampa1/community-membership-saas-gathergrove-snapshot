/**
 * Mock for react-native-device-info
 */

export default {
  getUniqueId: jest.fn(() => 'mock-unique-id'),
  getDeviceId: jest.fn(() => 'mock-device-id'),
  getModel: jest.fn(() => 'Mock Device'),
  getBrand: jest.fn(() => 'MockBrand'),
  getSystemName: jest.fn(() => 'MockOS'),
  getSystemVersion: jest.fn(() => '1.0.0'),
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getApplicationName: jest.fn(() => 'MockApp'),
  getUserAgent: jest.fn(() => 'MockUserAgent'),
  isTablet: jest.fn(() => false),
};
