/**
 * Mock implementation of AuthContext for testing
 * @description Provides consistent mock auth data for tests
 * @author Claude Code - QA Testing Agent
 */

import React from 'react';
import type { AuthContextType, Club, UserSession } from '../../hooks/useAuth';

// Mock club data
const mockClub: Club = {
  id: 1,
  name: 'Test Club',
  tier: 'Unlimited'
};

// Mock user session data
const mockUserSession: UserSession = {
  userId: 1,
  clubId: 1,
  clubName: 'Test Club',
  clubTier: 'Unlimited',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'Owner',
  isOnboardingCompleted: true
};

// Mock auth context
const mockAuthContext: AuthContextType = {
  user: mockUserSession,
  loading: false,
  error: null,
  login: jest.fn().mockResolvedValue({ success: true, token: 'mock-token', user: mockUserSession }),
  logout: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue({ success: true, user: mockUserSession }),
  refreshSession: jest.fn().mockResolvedValue(undefined),
  completeOnboarding: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
  retryLastOperation: jest.fn().mockResolvedValue(undefined)
};

// Mock useAuth hook
export const useAuth = jest.fn(() => mockAuthContext);

// Mock AuthContext hook
export const useAuthContext = jest.fn(() => mockAuthContext);

// Mock AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Mock the actual context
export const AuthContext = React.createContext(mockAuthContext);

// Export types and defaults
export { mockUserSession, mockClub, mockAuthContext };
export type { Club, AuthContextType, UserSession };

// Default export
const AuthContextMock = {
  useAuth,
  AuthProvider,
  mockUserSession,
  mockClub,
  mockAuthContext
};

export default AuthContextMock;