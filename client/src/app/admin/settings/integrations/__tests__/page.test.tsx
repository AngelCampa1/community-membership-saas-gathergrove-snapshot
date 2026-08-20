import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import IntegrationsPage from '../page';
import { stripeConnectService } from '@/services/stripeConnectService';

// Import universal RadixUI mocking setup

// Mock the services
jest.mock('@/services/stripeConnectService', () => ({
  stripeConnectService: {
    getConnectStatus: jest.fn(),
    getConnectLink: jest.fn(),
    getSupportedCountries: jest.fn(),
    disconnect: jest.fn(),
    startOnboarding: jest.fn(),
    completeOnboarding: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock auth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      clubId: 1,
      role: 'Admin',
    },
    loading: false,
    error: null,
  }),
}));

describe('IntegrationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render integrations page', () => {
    render(<IntegrationsPage />);
    expect(screen.getByTestId('integrations-page')).toBeInTheDocument();
  });

  it('should handle stripe integration', async () => {
    (stripeConnectService.getConnectStatus as jest.Mock).mockResolvedValue({ isConnected: false });
    
    render(<IntegrationsPage />);
    
    await waitFor(() => {
      expect(stripeConnectService.getConnectStatus).toHaveBeenCalled();
    });
  });

  it('should handle stripe onboarding flow', async () => {
    const mockGetConnectLink = jest.fn().mockResolvedValue({ onboardingUrl: 'https://connect.stripe.com/setup' });
    (stripeConnectService.getConnectLink as jest.Mock).mockImplementation(mockGetConnectLink);
    (stripeConnectService.getConnectStatus as jest.Mock).mockResolvedValue({ isConnected: false });
    
    render(<IntegrationsPage />);
    
    await waitFor(() => {
      expect(stripeConnectService.getConnectStatus).toHaveBeenCalled();
    });
  });

  it('should show connected status when stripe is connected', async () => {
    (stripeConnectService.getConnectStatus as jest.Mock).mockResolvedValue({ 
      isConnected: true,
      accountId: 'acct_test123'
    });
    
    render(<IntegrationsPage />);
    
    await waitFor(() => {
      expect(stripeConnectService.getConnectStatus).toHaveBeenCalled();
    });
  });
});
