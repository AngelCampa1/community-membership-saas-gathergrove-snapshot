/**
 * Mock for @react-native-google-signin/google-signin
 * Used for testing SSO functionality without actual Google authentication
 */

const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(() => Promise.resolve(true)),
  signIn: jest.fn(() =>
    Promise.resolve({
      user: {
        id: 'google-user-id',
        email: 'test@example.com',
        name: 'John Doe',
        photo: 'https://example.com/photo.jpg',
      },
      idToken: 'mock-id-token',
      serverAuthCode: 'mock-server-auth-code',
    })
  ),
  signInSilently: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
  revokeAccess: jest.fn(() => Promise.resolve()),
  isSignedIn: jest.fn(() => Promise.resolve(false)),
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
};

const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

const isErrorWithCode = (error) => {
  return error && typeof error.code === 'string';
};

const isSuccessResponse = (response) => {
  return response && response.user;
};

module.exports = {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
};
