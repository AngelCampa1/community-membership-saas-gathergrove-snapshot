/**
 * TagManager tests
 *
 * Boundary mocking: only the apiClient HTTP layer is mocked. The real
 * TagManager, the real tagService, real React Query, and real UI components
 * all run, so these tests exercise genuine component + service behavior
 * against the club-scoped MemberTaggingController contract.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { TagManager } from '../TagManager';
import type { MemberTag, MemberTagUsageStats } from '@/services/tagService';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;

const CLUB_ID = 1;

const tags: MemberTag[] = [
  {
    id: 1,
    clubId: CLUB_ID,
    name: 'VIP Member',
    description: 'High-value member',
    color: '#f59e0b',
    isVisible: true,
    displayOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    createdByUserName: 'Admin',
    updatedAt: '2024-01-01T00:00:00Z',
    usageStats: {
      assignedMemberCount: 15,
      totalMemberCount: 100,
      usagePercentage: 15,
      recentAssignments: 2,
      commonReasons: [],
    },
  },
  {
    id: 2,
    clubId: CLUB_ID,
    name: 'Event Attendee',
    description: 'Regularly attends events',
    color: '#3b82f6',
    isVisible: true,
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    createdByUserName: 'Admin',
    updatedAt: '2024-01-01T00:00:00Z',
    usageStats: {
      assignedMemberCount: 42,
      totalMemberCount: 100,
      usagePercentage: 42,
      recentAssignments: 5,
      commonReasons: [],
    },
  },
];

const usageStats: MemberTagUsageStats = {
  tagId: 0,
  tagName: 'All',
  currentStats: {
    assignedMemberCount: 57,
    totalMemberCount: 100,
    usagePercentage: 57,
    recentAssignments: 7,
    commonReasons: [],
  },
  usageTrends: [],
  tagCorrelations: [],
  calculatedAt: '2024-01-01T00:00:00Z',
};

const routeGet = (impl?: { tags?: MemberTag[]; stats?: MemberTagUsageStats }) => {
  mockGet.mockImplementation((url: string) => {
    if (url.endsWith('/usage-stats')) {
      return Promise.resolve({ data: impl?.stats ?? usageStats });
    }
    return Promise.resolve({ data: impl?.tags ?? tags });
  });
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>);

describe('TagManager', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    routeGet();
  });

  it('renders the tag management interface', async () => {
    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    expect(screen.getByText('Tag Management')).toBeInTheDocument();
    expect(screen.getByLabelText(/search tags/i)).toBeInTheDocument();
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/clubs/1/members/tags'));
  });

  it('fetches tags scoped to the provided clubId', async () => {
    renderWithProviders(<TagManager clubId={42} />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/clubs/42/members/tags'));
    expect(mockGet).toHaveBeenCalledWith('/clubs/42/members/tags/usage-stats');
  });

  it('renders tags returned by the service', async () => {
    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    await waitFor(() => {
      expect(screen.getAllByText('VIP Member').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Event Attendee').length).toBeGreaterThan(0);
  });

  it('renders club tag statistics from the usage-stats endpoint', async () => {
    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    await waitFor(() => expect(screen.getByText('Tag Statistics')).toBeInTheDocument());
    expect(screen.getByText('57')).toBeInTheDocument(); // tagged members
    expect(screen.getByText('57%')).toBeInTheDocument(); // coverage
  });

  it('filters the tag grid by search term', async () => {
    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(2));

    fireEvent.change(screen.getByLabelText(/search tags/i), { target: { value: 'Event' } });

    await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(1));

    const card = screen.getByTestId('tag-item');
    expect(within(card).getByText('Event Attendee')).toBeInTheDocument();
    expect(within(card).queryByText('VIP Member')).not.toBeInTheDocument();
  });

  it('shows an empty state when no tags exist', async () => {
    routeGet({ tags: [] });
    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    await waitFor(() => expect(screen.getByText(/no tags found/i)).toBeInTheDocument());
  });

  it('surfaces an error and retry when the tags request fails', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.endsWith('/usage-stats')) return Promise.resolve({ data: usageStats });
      return Promise.reject(new Error('Server error'));
    });

    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    await waitFor(() => expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument());
  });

  it('validates required fields in the create dialog', async () => {
    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    await user.click(screen.getByRole('button', { name: /create tag/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /create tag/i }));

    expect(await screen.findByText('Tag name is required')).toBeInTheDocument();
  });

  it('exposes accessible region and search labelling', () => {
    renderWithProviders(<TagManager clubId={CLUB_ID} />);

    expect(screen.getByRole('region', { name: /tag management/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search tags/i)).toBeInTheDocument();
  });
});
