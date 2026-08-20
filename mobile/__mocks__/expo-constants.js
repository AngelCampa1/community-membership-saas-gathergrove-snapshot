// Complete Expo Constants mock for testing
const Constants = {
  expoConfig: {
    extra: {
      production: {
        apiBaseUrl: 'https://api.gathergrove.club'
      },
      development: {
        apiBaseUrl: 'http://localhost:5284'
      },
      expoProjectId: 'mock-project-id'
    }
  },
  manifest: {
    extra: {
      production: {
        apiBaseUrl: 'https://api.gathergrove.club'
      },
      development: {
        apiBaseUrl: 'http://localhost:5284'
      },
      expoProjectId: 'mock-project-id'
    }
  },
  sessionId: 'mock-session-id',
  deviceName: 'Mock Device',
  appOwnership: 'expo'
};

module.exports = Constants;
module.exports.default = Constants; 