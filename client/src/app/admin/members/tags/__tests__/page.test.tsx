/**
 * TagsPage wrapper tests
 *
 * Boundary mocking: only the apiClient HTTP layer plus the auth/tier
 * boundaries (useAuth, TierGate) are mocked. The real TagsPage, the real
 * TagManager, the real tagService, real React Query, and real UI components
 * all render, so the page -> TagManager -> tagService -> apiClient wiring is
 * genuinely exercised against the club-scoped MemberTaggingController contract.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TagsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/apiClient';

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
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGet = apiClient.get as jest.Mock;

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
      <TagsPage />
    </QueryClientProvider>,
  );

describe('TagsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(tierGateProps)) delete tierGateProps[key];
    mockGet.mockImplementation((url: string) => {
      if (url.endsWith('/usage-stats')) {
        return Promise.resolve({
          data: {
            tagId: 0,
            tagName: 'All',
            currentStats: {
              assignedMemberCount: 0,
              totalMemberCount: 0,
              usagePercentage: 0,
              recentAssignments: 0,
              commonReasons: [],
            },
            usageTrends: [],
            tagCorrelations: [],
            calculatedAt: '2024-01-01T00:00:00Z',
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders the TagManager scoped to the authenticated club', async () => {
    mockUseAuth.mockReturnValue({ user: { clubId: 7 } } as ReturnType<typeof useAuth>);

    renderPage();

    expect(screen.getByText('Tag Management')).toBeInTheDocument();
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/clubs/7/members/tags'));
  });

  it('gates the page behind the Expand tier', () => {
    mockUseAuth.mockReturnValue({ user: { clubId: 7 } } as ReturnType<typeof useAuth>);

    renderPage();

    expect(tierGateProps.requiredTier).toBe('Expand');
    expect(tierGateProps.feature).toBe('member-tagging');
  });

  it('shows a loading placeholder until the club id is known', () => {
    mockUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    renderPage();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Tag Management')).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
