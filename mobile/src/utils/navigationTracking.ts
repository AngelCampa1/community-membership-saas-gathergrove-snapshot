/**
 * Navigation Tracking Utility
 *
 * Provides utilities for tracking screen navigation in Application Insights
 * - Extracts active route name from navigation state
 * - Tracks screen views with metadata
 */

import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

/**
 * Navigation state type (simplified)
 * Compatible with React Navigation's NavigationState and PartialState types
 */
interface NavigationState {
  index?: number;
  routes?: Array<{
    name: string;
    state?: NavigationState | null;
  }>;
}

/**
 * Extract the active route name from navigation state
 * Handles nested navigation by recursively traversing the state tree
 *
 * @param state - The navigation state object
 * @returns The name of the active route, or 'Unknown' if not found
 */
export function getActiveRouteName(state: NavigationState | undefined | null): string {
  if (!state) {
    return 'Unknown';
  }

  if (!state.routes || state.routes.length === 0) {
    return 'Unknown';
  }

  // Handle optional index - default to 0 if not provided
  const index = state.index ?? 0;
  const route = state.routes[index];

  if (!route) {
    return 'Unknown';
  }

  // If this route has nested state, recurse
  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
}

/**
 * Track a screen view in Application Insights
 * Includes screen name, timestamp, and platform information
 *
 * @param screenName - The name of the screen being viewed
 */
export function trackScreenView(screenName: string): void {
  try {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: screenName,
      data: {
        screenName,
        timestamp: Date.now(),
        platform: Platform.OS,
      },
      level: 'info',
    });
  } catch {
    // Never let telemetry crash the app
  }
}
