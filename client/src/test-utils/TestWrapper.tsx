/**
 * Test Wrapper for React Query and Context Providers
 * Provides necessary providers for testing analytics components
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Mock providers for testing

interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
};

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  queryClient = createTestQueryClient() 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock user for testing
export const mockUnlimitedUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  tier: 'unlimited' as const,
  permissions: ['analytics:advanced', 'reports:export'],
};

// Mock club data for testing
export const mockClubData = {
  id: 1,
  name: 'Test Club',
  memberCount: 150,
  eventsThisMonth: 8,
  tier: 'unlimited' as const,
};

export default TestWrapper;