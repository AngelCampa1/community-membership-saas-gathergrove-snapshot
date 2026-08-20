module.exports = {
  getAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  askAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  NOTIFICATIONS: 'notifications',
}; 