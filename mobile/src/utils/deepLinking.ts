/**
 * NAV-03 fix: Deep linking configuration and utilities
 * Extends deep linking beyond just /reset-password
 */

import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { Linking } from 'react-native';

// Supported deep link paths
export const DEEP_LINK_PATHS = {
  RESET_PASSWORD: '/reset-password',
  FORGOT_PASSWORD: '/forgot-password',
  EVENT_DETAILS: '/event/',
  PAY_DUES: '/payment/',
  MEMBERSHIP_CARD: '/membership-card',
  PROFILE: '/profile',
} as const;

// Token validation regex patterns
export const TOKEN_PATTERNS = {
  // Standard JWT or URL-safe token (at least 10 chars, alphanumeric with - and _)
  STANDARD: /^[a-zA-Z0-9-_]+$/,
  // Numeric ID
  NUMERIC_ID: /^\d+$/,
} as const;

const ALLOWED_DEEP_LINK_PROTOCOLS = new Set(['http:', 'https:', 'gathergrove:']);
const ALLOWED_HTTPS_DEEP_LINK_HOSTS = new Set([
  'gathergrove.club',
  'www.gathergrove.club',
  'staging.gathergrove.club',
]);

/**
 * Validates a token string format
 */
export const validateToken = (token: string | undefined | null, minLength = 10): boolean => {
  if (!token) return false;
  if (token.length < minLength) return false;
  return TOKEN_PATTERNS.STANDARD.test(token);
};

/**
 * Validates a numeric ID
 */
export const validateNumericId = (id: string | undefined | null): boolean => {
  if (!id) return false;
  return TOKEN_PATTERNS.NUMERIC_ID.test(id);
};

/**
 * Normalizes a supported app deep link into a path/search pair.
 */
export const normalizeDeepLinkUrl = (url: string): URL | null => {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (!ALLOWED_DEEP_LINK_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }

    if (parsed.protocol === 'gathergrove:') {
      const customSchemePath = `/${parsed.hostname}${parsed.pathname}`.replace(/\/+/g, '/');
      return new URL(`${customSchemePath}${parsed.search}${parsed.hash}`, 'https://gathergrove.local');
    }

    if (!ALLOWED_HTTPS_DEEP_LINK_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }

    return parsed;
  } catch {
    try {
      return new URL(url.startsWith('/') ? url : `/${url}`, 'https://gathergrove.local');
    } catch {
      return null;
    }
  }
};

/**
 * Parses query parameter from URL
 */
export const parseQueryParam = (url: string, param: string): string | null => {
  const parsed = normalizeDeepLinkUrl(url);
  return parsed?.searchParams.get(param) || null;
};

/**
 * Parses path parameter from URL
 * e.g., /event/123 -> returns '123'
 */
export const parsePathParam = (url: string, basePath: string): string | null => {
  const parsed = normalizeDeepLinkUrl(url);
  if (!parsed || !parsed.pathname.startsWith(basePath)) return null;

  return parsePathParamFromUrl(parsed, basePath);
};

const parsePathParamFromUrl = (parsed: URL, basePath: string): string | null => {
  const afterPath = parsed.pathname.substring(basePath.length);
  // Extract until next / or query string
  const match = afterPath.match(/^([^/]+)/);
  return match ? match[1] : null;
};

/**
 * Deep link result for processing
 */
export interface DeepLinkResult {
  type: 'reset-password' | 'forgot-password' | 'event' | 'payment' | 'membership-card' | 'profile' | 'unknown';
  token?: string;
  eventId?: number;
  isValid: boolean;
}

/**
 * Parses a deep link URL and returns structured result
 */
export const parseDeepLink = (url: string): DeepLinkResult => {
  const parsed = normalizeDeepLinkUrl(url);

  if (!parsed) {
    return { type: 'unknown', isValid: false };
  }

  const path = parsed.pathname;

  // Reset password
  if (path === DEEP_LINK_PATHS.RESET_PASSWORD) {
    const token = parsed.searchParams.get('token');
    return {
      type: 'reset-password',
      token: token || undefined,
      isValid: validateToken(token),
    };
  }

  // Forgot password (no token needed)
  if (path === DEEP_LINK_PATHS.FORGOT_PASSWORD) {
    return {
      type: 'forgot-password',
      isValid: true,
    };
  }

  // Event details
  if (path.startsWith(DEEP_LINK_PATHS.EVENT_DETAILS)) {
    const eventIdStr = parsePathParamFromUrl(parsed, DEEP_LINK_PATHS.EVENT_DETAILS);
    const eventId = eventIdStr ? parseInt(eventIdStr, 10) : NaN;
    return {
      type: 'event',
      eventId: isNaN(eventId) ? undefined : eventId,
      isValid: !isNaN(eventId) && eventId > 0,
    };
  }

  // Payment
  if (path.startsWith(DEEP_LINK_PATHS.PAY_DUES)) {
    const token = parsePathParamFromUrl(parsed, DEEP_LINK_PATHS.PAY_DUES);
    return {
      type: 'payment',
      token: token || undefined,
      isValid: validateToken(token, 5), // Payment tokens may be shorter
    };
  }

  // Membership card
  if (path === DEEP_LINK_PATHS.MEMBERSHIP_CARD) {
    return {
      type: 'membership-card',
      isValid: true,
    };
  }

  // Profile
  if (path === DEEP_LINK_PATHS.PROFILE) {
    return {
      type: 'profile',
      isValid: true,
    };
  }

  return { type: 'unknown', isValid: false };
};

/**
 * React Navigation linking configuration for authenticated routes
 */
export const createLinkingConfig = (prefixes: string[]): LinkingOptions<RootStackParamList> => ({
  prefixes,
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Events: 'events',
          Directory: 'directory',
          Profile: 'profile',
        },
      },
      EventDetails: {
        path: 'event/:eventId',
        parse: {
          eventId: (eventId: string) => parseInt(eventId, 10),
        },
      },
      PayDues: {
        path: 'payment/:token',
      },
      MembershipCard: 'membership-card',
      EditProfile: 'edit-profile',
      DirectorySettings: 'directory-settings',
      ThemeSettings: 'theme-settings',
      // Auth screen handles its own deep links
      Auth: 'auth',
    },
  },
});

/**
 * Get the initial deep link URL
 */
export const getInitialDeepLink = async (): Promise<string | null> => {
  try {
    return await Linking.getInitialURL();
  } catch {
    return null;
  }
};

/**
 * Subscribe to deep link events
 */
export const subscribeToDeepLinks = (
  callback: (url: string) => void
): (() => void) => {
  const subscription = Linking.addEventListener('url', (event) => {
    if (parseDeepLink(event.url).isValid) {
      callback(event.url);
    }
  });

  return () => {
    try {
      subscription?.remove();
    } catch {
      // Gracefully handle cleanup errors
    }
  };
};
