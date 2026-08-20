// React Native global variables
import type { MemberProfileResponse } from './index';

declare global {
  const __DEV__: boolean;

  // Test environment globals (populated by jest.mobile-mocks.js)
  interface GlobalTestMocks {
    mockAuthUser: {
      id: string;
      email: string;
      clubId: string;
      role: string;
    };
    mockAuthState: {
      isAuthenticated: boolean;
      token: string | null;
    };
    mockMemberProfile: MemberProfileResponse;
    mockTheme: {
      colors: Record<string, unknown>;
    };
  }

  // Extend global to include test mocks
  // eslint-disable-next-line no-var
  var mockAuthUser: GlobalTestMocks['mockAuthUser'];
  // eslint-disable-next-line no-var
  var mockAuthState: GlobalTestMocks['mockAuthState'];
  // eslint-disable-next-line no-var
  var mockMemberProfile: GlobalTestMocks['mockMemberProfile'];
  // eslint-disable-next-line no-var
  var mockTheme: GlobalTestMocks['mockTheme'];
}

export {}; 
