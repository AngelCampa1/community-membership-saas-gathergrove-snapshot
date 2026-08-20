import { Linking } from 'react-native';
import {
  DEEP_LINK_PATHS,
  TOKEN_PATTERNS,
  validateToken,
  validateNumericId,
  normalizeDeepLinkUrl,
  parseQueryParam,
  parsePathParam,
  parseDeepLink,
  createLinkingConfig,
  getInitialDeepLink,
  subscribeToDeepLinks,
} from '../deepLinking';

// Mock React Native Linking
jest.mock('react-native', () => ({
  Linking: {
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

describe('deepLinking', () => {
  describe('Constants', () => {
    it('should export deep link paths', () => {
      expect(DEEP_LINK_PATHS.RESET_PASSWORD).toBe('/reset-password');
      expect(DEEP_LINK_PATHS.FORGOT_PASSWORD).toBe('/forgot-password');
      expect(DEEP_LINK_PATHS.EVENT_DETAILS).toBe('/event/');
      expect(DEEP_LINK_PATHS.PAY_DUES).toBe('/payment/');
      expect(DEEP_LINK_PATHS.MEMBERSHIP_CARD).toBe('/membership-card');
      expect(DEEP_LINK_PATHS.PROFILE).toBe('/profile');
    });

    it('should export token patterns', () => {
      expect(TOKEN_PATTERNS.STANDARD).toBeInstanceOf(RegExp);
      expect(TOKEN_PATTERNS.NUMERIC_ID).toBeInstanceOf(RegExp);
    });
  });

  describe('validateToken', () => {
    it('should return false for undefined token', () => {
      expect(validateToken(undefined)).toBe(false);
    });

    it('should return false for null token', () => {
      expect(validateToken(null)).toBe(false);
    });

    it('should return false for empty token', () => {
      expect(validateToken('')).toBe(false);
    });

    it('should return false for token shorter than minLength', () => {
      expect(validateToken('abc', 10)).toBe(false);
      expect(validateToken('short', 10)).toBe(false);
    });

    it('should return true for valid alphanumeric token', () => {
      expect(validateToken('abcdefghij')).toBe(true);
      expect(validateToken('ABC123DEF456')).toBe(true);
    });

    it('should return true for token with hyphens and underscores', () => {
      expect(validateToken('abc-def_123')).toBe(true);
      expect(validateToken('token_123-abc')).toBe(true);
    });

    it('should return false for token with invalid characters', () => {
      expect(validateToken('abc def ghi')).toBe(false); // space
      expect(validateToken('abc@def.com')).toBe(false); // @ and .
      expect(validateToken('abc!def#123')).toBe(false); // ! and #
    });

    it('should respect custom minLength', () => {
      expect(validateToken('abc', 3)).toBe(true);
      expect(validateToken('abc', 5)).toBe(false);
    });
  });

  describe('validateNumericId', () => {
    it('should return false for undefined ID', () => {
      expect(validateNumericId(undefined)).toBe(false);
    });

    it('should return false for null ID', () => {
      expect(validateNumericId(null)).toBe(false);
    });

    it('should return false for empty ID', () => {
      expect(validateNumericId('')).toBe(false);
    });

    it('should return true for valid numeric ID', () => {
      expect(validateNumericId('123')).toBe(true);
      expect(validateNumericId('1')).toBe(true);
      expect(validateNumericId('9999999')).toBe(true);
    });

    it('should return false for non-numeric ID', () => {
      expect(validateNumericId('abc')).toBe(false);
      expect(validateNumericId('123abc')).toBe(false);
      expect(validateNumericId('12.34')).toBe(false);
    });
  });

  describe('parseQueryParam', () => {
    it('should extract query parameter from URL', () => {
      const url = 'https://gathergrove.club/path?token=abc123';
      expect(parseQueryParam(url, 'token')).toBe('abc123');
    });

    it('should extract query parameter with multiple params', () => {
      const url = 'https://gathergrove.club/path?foo=bar&token=xyz789&other=value';
      expect(parseQueryParam(url, 'token')).toBe('xyz789');
    });

    it('should decode URL-encoded parameter values', () => {
      const url = 'https://gathergrove.club/path?message=hello%20world';
      expect(parseQueryParam(url, 'message')).toBe('hello world');
    });

    it('should return null for missing parameter', () => {
      const url = 'https://gathergrove.club/path?foo=bar';
      expect(parseQueryParam(url, 'token')).toBeNull();
    });

    it('should handle parameter at the end of URL', () => {
      const url = 'https://gathergrove.club/path?token=end';
      expect(parseQueryParam(url, 'token')).toBe('end');
    });

    it('should handle ampersand separator', () => {
      const url = 'https://gathergrove.club/path?a=1&token=test&b=2';
      expect(parseQueryParam(url, 'token')).toBe('test');
    });
  });

  describe('normalizeDeepLinkUrl', () => {
    it('should normalize app custom scheme links into app paths', () => {
      const result = normalizeDeepLinkUrl('gathergrove://event/123');

      expect(result?.pathname).toBe('/event/123');
    });

    it('should reject dangerous URL schemes', () => {
      expect(normalizeDeepLinkUrl('javascript:alert(1)')).toBeNull();
      expect(normalizeDeepLinkUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should reject https links from untrusted hosts', () => {
      expect(normalizeDeepLinkUrl('https://attacker.example/reset-password?token=abcdefghij123')).toBeNull();
      expect(normalizeDeepLinkUrl('https://gathergrove.club.evil.example/payment/token123')).toBeNull();
      expect(normalizeDeepLinkUrl('https://gathergrove.local/payment/token123')).toBeNull();
    });
  });

  describe('parsePathParam', () => {
    it('should extract path parameter after base path', () => {
      const url = 'https://gathergrove.club/event/123';
      expect(parsePathParam(url, '/event/')).toBe('123');
    });

    it('should extract parameter before query string', () => {
      const url = 'https://gathergrove.club/payment/token123?foo=bar';
      expect(parsePathParam(url, '/payment/')).toBe('token123');
    });

    it('should extract parameter before trailing slash', () => {
      const url = 'https://gathergrove.club/event/456/';
      expect(parsePathParam(url, '/event/')).toBe('456');
    });

    it('should return null when base path not found', () => {
      const url = 'https://gathergrove.club/other/123';
      expect(parsePathParam(url, '/event/')).toBeNull();
    });

    it('should return null when no parameter after base path', () => {
      const url = 'https://gathergrove.club/event/';
      expect(parsePathParam(url, '/event/')).toBeNull();
    });
  });

  describe('parseDeepLink', () => {
    describe('reset-password', () => {
      it('should parse valid reset password link', () => {
        const result = parseDeepLink('https://gathergrove.club/reset-password?token=abcdefghij123');
        expect(result).toEqual({
          type: 'reset-password',
          token: 'abcdefghij123',
          isValid: true,
        });
      });

      it('should mark as invalid if token is too short', () => {
        const result = parseDeepLink('https://gathergrove.club/reset-password?token=abc');
        expect(result).toEqual({
          type: 'reset-password',
          token: 'abc',
          isValid: false,
        });
      });

      it('should mark as invalid if token is missing', () => {
        const result = parseDeepLink('https://gathergrove.club/reset-password');
        expect(result).toEqual({
          type: 'reset-password',
          token: undefined,
          isValid: false,
        });
      });
    });

    describe('forgot-password', () => {
      it('should parse forgot password link', () => {
        const result = parseDeepLink('https://gathergrove.club/forgot-password');
        expect(result).toEqual({
          type: 'forgot-password',
          isValid: true,
        });
      });
    });

    describe('event', () => {
      it('should parse valid event details link', () => {
        const result = parseDeepLink('https://gathergrove.club/event/123');
        expect(result).toEqual({
          type: 'event',
          eventId: 123,
          isValid: true,
        });
      });

      it('should not parse event path from attacker-controlled query strings', () => {
        const result = parseDeepLink('https://attacker.example/redirect?next=/event/123');

        expect(result).toEqual({
          type: 'unknown',
          isValid: false,
        });
      });

      it('should reject event links from attacker-controlled hosts', () => {
        const result = parseDeepLink('https://attacker.example/event/123');

        expect(result).toEqual({
          type: 'unknown',
          isValid: false,
        });
      });

      it('should parse custom scheme event links', () => {
        const result = parseDeepLink('gathergrove://event/123');

        expect(result).toEqual({
          type: 'event',
          eventId: 123,
          isValid: true,
        });
      });

      it('should mark as invalid for non-numeric event ID', () => {
        const result = parseDeepLink('https://gathergrove.club/event/abc');
        expect(result.type).toBe('event');
        expect(result.isValid).toBe(false);
      });

      it('should mark as invalid for zero event ID', () => {
        const result = parseDeepLink('https://gathergrove.club/event/0');
        expect(result).toEqual({
          type: 'event',
          eventId: 0,
          isValid: false,
        });
      });

      it('should mark as invalid for negative event ID', () => {
        const result = parseDeepLink('https://gathergrove.club/event/-5');
        expect(result.type).toBe('event');
        expect(result.isValid).toBe(false);
      });
    });

    describe('payment', () => {
      it('should parse valid payment link', () => {
        const result = parseDeepLink('https://gathergrove.club/payment/token123');
        expect(result).toEqual({
          type: 'payment',
          token: 'token123',
          isValid: true,
        });
      });

      it('should accept shorter payment tokens (min 5 chars)', () => {
        const result = parseDeepLink('https://gathergrove.club/payment/abc12');
        expect(result.isValid).toBe(true);
      });

      it('should mark as invalid if payment token too short', () => {
        const result = parseDeepLink('https://gathergrove.club/payment/abc');
        expect(result.isValid).toBe(false);
      });

      it('should reject payment links from attacker-controlled hosts', () => {
        const result = parseDeepLink('https://attacker.example/payment/token123');

        expect(result).toEqual({
          type: 'unknown',
          isValid: false,
        });
      });
    });

    describe('membership-card', () => {
      it('should parse membership card link', () => {
        const result = parseDeepLink('https://gathergrove.club/membership-card');
        expect(result).toEqual({
          type: 'membership-card',
          isValid: true,
        });
      });
    });

    describe('profile', () => {
      it('should parse profile link', () => {
        const result = parseDeepLink('https://gathergrove.club/profile');
        expect(result).toEqual({
          type: 'profile',
          isValid: true,
        });
      });
    });

    describe('unknown', () => {
      it('should return unknown for empty URL', () => {
        const result = parseDeepLink('');
        expect(result).toEqual({
          type: 'unknown',
          isValid: false,
        });
      });

      it('should return unknown for unrecognized path', () => {
        const result = parseDeepLink('https://gathergrove.club/unknown/path');
        expect(result).toEqual({
          type: 'unknown',
          isValid: false,
        });
      });
    });
  });

  describe('createLinkingConfig', () => {
    it('should create linking config with given prefixes', () => {
      const prefixes = ['https://gathergrove.club', 'gathergrove://'];
      const config = createLinkingConfig(prefixes);

      expect(config.prefixes).toEqual(prefixes);
      expect(config.config).toBeDefined();
    });

    it('should configure main tab screens', () => {
      const config = createLinkingConfig(['test://']);

      expect(config.config.screens.Main).toBeDefined();
      expect((config.config.screens.Main as any).screens).toEqual({
        Dashboard: 'dashboard',
        Events: 'events',
        Directory: 'directory',
        Profile: 'profile',
      });
    });

    it('should configure event details with parameter parsing', () => {
      const config = createLinkingConfig(['test://']);

      expect(config.config.screens.EventDetails).toEqual({
        path: 'event/:eventId',
        parse: {
          eventId: expect.any(Function),
        },
      });
    });

    it('should parse eventId to number', () => {
      const config = createLinkingConfig(['test://']);
      const parseEventId = (config.config.screens.EventDetails as any).parse.eventId;

      expect(parseEventId('123')).toBe(123);
      expect(parseEventId('456')).toBe(456);
    });

    it('should configure payment route with token parameter', () => {
      const config = createLinkingConfig(['test://']);

      expect(config.config.screens.PayDues).toEqual({
        path: 'payment/:token',
      });
    });

    it('should configure static routes', () => {
      const config = createLinkingConfig(['test://']);

      expect(config.config.screens.MembershipCard).toBe('membership-card');
      expect(config.config.screens.EditProfile).toBe('edit-profile');
      expect(config.config.screens.DirectorySettings).toBe('directory-settings');
      expect(config.config.screens.ThemeSettings).toBe('theme-settings');
      expect(config.config.screens.Auth).toBe('auth');
    });
  });

  describe('getInitialDeepLink', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return initial URL from Linking.getInitialURL', async () => {
      const mockUrl = 'https://gathergrove.club/event/123';
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(mockUrl);

      const result = await getInitialDeepLink();

      expect(result).toBe(mockUrl);
      expect(Linking.getInitialURL).toHaveBeenCalled();
    });

    it('should return null when no initial URL', async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);

      const result = await getInitialDeepLink();

      expect(result).toBeNull();
    });

    it('should return null when Linking.getInitialURL throws error', async () => {
      (Linking.getInitialURL as jest.Mock).mockRejectedValue(new Error('Failed'));

      const result = await getInitialDeepLink();

      expect(result).toBeNull();
    });
  });

  describe('subscribeToDeepLinks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should subscribe to URL events', () => {
      const mockCallback = jest.fn();
      const mockRemove = jest.fn();
      const mockSubscription = { remove: mockRemove };

      (Linking.addEventListener as jest.Mock).mockReturnValue(mockSubscription);

      subscribeToDeepLinks(mockCallback);

      expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
    });

    it('should call callback when URL event is triggered', () => {
      const mockCallback = jest.fn();
      const mockRemove = jest.fn();
      const mockSubscription = { remove: mockRemove };
      let eventHandler: ((event: { url: string }) => void) | undefined;

      (Linking.addEventListener as jest.Mock).mockImplementation((eventName, handler) => {
        eventHandler = handler;
        return mockSubscription;
      });

      subscribeToDeepLinks(mockCallback);

      const testUrl = 'https://gathergrove.club/event/456';
      eventHandler?.({ url: testUrl });

      expect(mockCallback).toHaveBeenCalledWith(testUrl);
    });

    it('should not call callback for unsafe URL events', () => {
      const mockCallback = jest.fn();
      const mockRemove = jest.fn();
      const mockSubscription = { remove: mockRemove };
      let eventHandler: ((event: { url: string }) => void) | undefined;

      (Linking.addEventListener as jest.Mock).mockImplementation((eventName, handler) => {
        eventHandler = handler;
        return mockSubscription;
      });

      subscribeToDeepLinks(mockCallback);

      eventHandler?.({ url: 'javascript:alert(1)' });
      eventHandler?.({ url: 'https://attacker.example/redirect?next=/payment/token123' });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const mockCallback = jest.fn();
      const mockRemove = jest.fn();
      const mockSubscription = { remove: mockRemove };

      (Linking.addEventListener as jest.Mock).mockReturnValue(mockSubscription);

      const unsubscribe = subscribeToDeepLinks(mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove subscription when unsubscribe is called', () => {
      const mockCallback = jest.fn();
      const mockRemove = jest.fn();
      const mockSubscription = { remove: mockRemove };

      (Linking.addEventListener as jest.Mock).mockReturnValue(mockSubscription);

      const unsubscribe = subscribeToDeepLinks(mockCallback);
      unsubscribe();

      expect(mockRemove).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      const mockCallback = jest.fn();
      const mockRemove = jest.fn(() => {
        throw new Error('Cleanup error');
      });
      const mockSubscription = { remove: mockRemove };

      (Linking.addEventListener as jest.Mock).mockReturnValue(mockSubscription);

      const unsubscribe = subscribeToDeepLinks(mockCallback);

      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
