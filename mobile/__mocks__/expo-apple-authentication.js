/**
 * Mock for expo-apple-authentication
 * Used for testing SSO functionality without actual Apple authentication
 */

module.exports = {
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  signInAsync: jest.fn(() =>
    Promise.resolve({
      user: 'apple-user-id',
      email: 'test@privaterelay.appleid.com',
      fullName: {
        givenName: 'John',
        familyName: 'Doe',
      },
      identityToken: 'mock-identity-token',
      authorizationCode: 'mock-auth-code',
    })
  ),
  AppleAuthenticationScope: {
    FULL_NAME: 'fullName',
    EMAIL: 'email',
  },
  AppleAuthenticationCredential: {},
  AppleAuthenticationUserDetectionStatus: {
    UNSUPPORTED: 'unsupported',
    UNKNOWN: 'unknown',
    LIKELY_REAL: 'likelyReal',
  },
  AppleAuthenticationOperation: {
    IMPLICIT: 'implicit',
    LOGIN: 'login',
    REFRESH: 'refresh',
    LOGOUT: 'logout',
  },
};
