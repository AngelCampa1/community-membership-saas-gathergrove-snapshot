/**
 * SegmentsPage wrapper tests
 *
 * Boundary mocking: only the apiClient HTTP layer plus the auth/tier
 * boundaries (useAuth, TierGate) are mocked. The real SegmentsPage, the real
 * SegmentManager, the real memberSegmentationService, and real UI components
 * all render, so the page -> SegmentManager -> memberSegmentationService ->
 * apiClient wiring is genuinely exercised against the club-scoped segments
 * contract.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SegmentsPage from '../page';
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

describe('SegmentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(tierGateProps)) delete tierGateProps[key];
    // memberSegmentationService gates on the real billingService tier check
    // (GET .../status) before loading the club-scoped segment list
    // (GET /clubs/{clubId}/segments). Branch on URL so both real services run.
    mockGet.mockImplementation((url: string) => {
      if (url.endsWith('/status')) {
        return Promise.resolve({ data: { currentTier: 'Expand' } });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders the SegmentManager scoped to the authenticated club', async () => {
    mockUseAuth.mockReturnValue({ user: { clubId: 7 } } as ReturnType<typeof useAuth>);

    render(<SegmentsPage />);

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/clubs/7/segments'),
      ),
    );
    expect(await screen.findByText(/Member Segments \(0\)/)).toBeInTheDocument();
  });

  it('gates the page behind the Expand tier with the member-segmentation feature', () => {
    mockUseAuth.mockReturnValue({ user: { clubId: 7 } } as ReturnType<typeof useAuth>);

    render(<SegmentsPage />);

    expect(tierGateProps.requiredTier).toBe('Expand');
    expect(tierGateProps.feature).toBe('member-segmentation');
    expect(tierGateProps.showUpgrade).toBe(true);
  });

  it('shows a loading placeholder until the club id is known', () => {
    mockUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    render(<SegmentsPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText(/Member Segments/)).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
