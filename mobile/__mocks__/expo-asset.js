module.exports = {
  Asset: {
    fromModule: jest.fn(() => ({ uri: 'mock-asset-uri' })),
    loadAsync: jest.fn(() => Promise.resolve()),
  },
}; 