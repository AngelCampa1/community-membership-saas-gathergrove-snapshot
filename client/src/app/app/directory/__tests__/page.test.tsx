// Directory Page Tests - Fixed useAuth mock issue
// The key fix: useAuth mock returns complete AuthContextType with all required properties
// including user, loading, error, and all auth methods

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock dependencies
jest.mock('@/services/featureAnalyticsService', () => ({
  featureAnalyticsService: {
    getFeatureUsageAnalytics: jest.fn(),
    getMemberEngagementAnalytics: jest.fn(),
    calculateEngagementScores: jest.fn(),
    trackFeatureUsage: jest.fn(),
    trackFeature: jest.fn(),
  },
}));


// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock auth hook - use direct return value instead of factory
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      userId: 1,
      clubId: 1,
      clubName: 'Test Club',
      role: 'Member',
      email: 'test@example.com',
      fullName: 'Test User',
      isOnboardingCompleted: true,
    },
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    refreshSession: jest.fn(),
    completeOnboarding: jest.fn(),
    clearError: jest.fn(),
    retryLastOperation: jest.fn(),
  }),
}));

// Mock DirectoryService with successful response
jest.mock('@/services/directoryService', () => ({
  DirectoryService: {
    getMemberDirectory: jest.fn().mockResolvedValue({
      members: [],
      totalMembers: 0,
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error) => error),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    showWarningToast: jest.fn(),
    showInfoToast: jest.fn(),
  },
}));

// Import components after all mocks are set up
import DirectoryPage from '../page';

describe('Directory Page', () => {
  it('should render without crashing', () => {
    // Suppress console errors for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<DirectoryPage />);
    expect(document.body).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should show loading state initially', () => {
    // Suppress console errors
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DirectoryPage />);

    // Should show loading text
    expect(screen.getByText('Loading member directory...')).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
