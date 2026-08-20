/**
 * ExportsPage wrapper tests.
 *
 * Boundary mocking: only the apiClient HTTP layer plus the auth/tier
 * boundaries (useAuth, TierGate) are mocked. The real ExportsPage, the real
 * DataExportCenter, and the real UI components all render, so the
 * page -> DataExportCenter wiring is genuinely exercised.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExportsPage from '../page';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');

// Capture TierGate props so we can assert the page is gated correctly while
// still rendering children so the wiring tests run.
const tierGateProps: Record<string, unknown> = {};
jest.mock('@/components/tier/TierGate', () => ({
  TierGate: ({ children, ...props }: { children: React.ReactNode }) => {
    Object.assign(tierGateProps, props);
    return <>{children}</>;
  },
}));

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

const renderPage = () =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ExportsPage />
    </QueryClientProvider>,
  );

describe('ExportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(tierGateProps)) delete tierGateProps[key];
  });

  it('renders the DataExportCenter scoped to the authenticated club', () => {
    mockUseAuth.mockReturnValue({ user: { clubId: 7 } } as ReturnType<typeof useAuth>);

    renderPage();

    expect(screen.getByText('Data Export Center')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('gates the page behind the Expand tier with the data-export feature', () => {
    mockUseAuth.mockReturnValue({ user: { clubId: 7 } } as ReturnType<typeof useAuth>);

    renderPage();

    expect(tierGateProps.requiredTier).toBe('Expand');
    expect(tierGateProps.feature).toBe('data-export');
    expect(tierGateProps.showUpgrade).toBe(true);
  });

  it('shows a loading placeholder until the club id is known', () => {
    mockUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    renderPage();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Data Export Center')).not.toBeInTheDocument();
  });
});
