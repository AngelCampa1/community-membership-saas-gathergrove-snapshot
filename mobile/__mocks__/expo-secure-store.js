/**
 * Mock for expo-secure-store - External storage boundary
 */

const mockStore = {};

module.exports = {
  getItemAsync: jest.fn((key) => Promise.resolve(mockStore[key] || null)),
  setItemAsync: jest.fn((key, value) => {
    mockStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  WHEN_UNLOCKED: 0,
  AFTER_FIRST_UNLOCK: 1,
  ALWAYS: 2,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 3,
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 4,
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 5,
  ALWAYS_THIS_DEVICE_ONLY: 6,
};
