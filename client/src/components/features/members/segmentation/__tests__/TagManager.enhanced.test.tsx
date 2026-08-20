/**
 * TagManager - Enhanced interaction coverage
 *
 * Boundary mocking: only the apiClient HTTP layer is mocked. The real
 * TagManager, real tagService, real React Query and real UI components run.
 * This suite focuses on the mutation/interaction flows (create, edit, delete,
 * bulk assign/remove) against the club-scoped MemberTaggingController contract.
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { TagManager } from '../TagManager';
import type { MemberTag, MemberTagUsageStats } from '@/services/tagService';
import type { Member } from '../types';

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
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const CLUB_ID = 1;

const mockTags: MemberTag[] = [
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
    usageStats: { assignedMemberCount: 15, totalMemberCount: 100, usagePercentage: 15, recentAssignments: 1, commonReasons: [] },
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
    usageStats: { assignedMemberCount: 42, totalMemberCount: 100, usagePercentage: 42, recentAssignments: 4, commonReasons: [] },
  },
  {
    id: 3,
    clubId: CLUB_ID,
    name: 'Newsletter Subscriber',
    description: 'Subscribed to newsletter',
    color: '#10b981',
    isVisible: true,
    displayOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    createdByUserName: 'Admin',
    updatedAt: '2024-01-01T00:00:00Z',
    usageStats: { assignedMemberCount: 128, totalMemberCount: 200, usagePercentage: 64, recentAssignments: 9, commonReasons: [] },
  },
];

const mockStats: MemberTagUsageStats = {
  tagId: 0,
  tagName: 'All',
  currentStats: { assignedMemberCount: 57, totalMemberCount: 100, usagePercentage: 57, recentAssignments: 7, commonReasons: [] },
  usageTrends: [],
  tagCorrelations: [],
  calculatedAt: '2024-01-01T00:00:00Z',
};

const mockMembers: Member[] = [
  {
    id: '11', firstName: 'John', lastName: 'Doe', email: 'john@example.com',
    membershipType: 'Premium', status: 'active', joinDate: '2024-01-01',
    tags: [], customFields: {}, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '12', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com',
    membershipType: 'Basic', status: 'active', joinDate: '2024-01-02',
    tags: [], customFields: {}, createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z',
  },
];

const routeGet = (tags: MemberTag[] = mockTags) => {
  mockGet.mockImplementation((url: string) => {
    if (url.endsWith('/usage-stats')) return Promise.resolve({ data: mockStats });
    return Promise.resolve({ data: tags });
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

describe('TagManager - Enhanced Coverage Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    routeGet();
    mockPost.mockResolvedValue({ data: { message: 'ok' } });
    mockPut.mockResolvedValue({ data: mockTags[0] });
    mockDelete.mockResolvedValue({ data: { message: 'ok' } });
  });

  describe('Tag Display', () => {
    it('renders all tags returned by the service', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
    });

    it('shows member counts from usageStats', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() => expect(screen.getAllByText('15 members').length).toBeGreaterThan(0));
      expect(screen.getAllByText('42 members').length).toBeGreaterThan(0);
      expect(screen.getAllByText('128 members').length).toBeGreaterThan(0);
    });

    it('sorts tags by member count descending', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
      const items = screen.getAllByTestId('tag-item');
      expect(within(items[0]).getByText('Newsletter Subscriber')).toBeInTheDocument();
      expect(within(items[1]).getByText('Event Attendee')).toBeInTheDocument();
      expect(within(items[2]).getByText('VIP Member')).toBeInTheDocument();
    });

    it('renders the Most Used Tags section', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() => expect(screen.getByText('Most Used Tags')).toBeInTheDocument());
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  describe('Tag Creation', () => {
    it('creates a tag scoped to the club via POST', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await user.click(screen.getByRole('button', { name: /create tag/i }));

      const nameInput = await screen.findByLabelText('Tag Name *');
      await user.type(nameInput, 'New Tag');
      await user.type(screen.getByLabelText('Description'), 'A new tag');

      const buttons = screen.getAllByRole('button', { name: /create tag/i });
      await user.click(buttons[buttons.length - 1]);

      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith(
          '/clubs/1/members/tags',
          expect.objectContaining({ name: 'New Tag', description: 'A new tag' }),
        ),
      );
    });

    it('blocks duplicate tag names', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await user.click(screen.getByRole('button', { name: /create tag/i }));

      const nameInput = await screen.findByLabelText('Tag Name *');
      await user.type(nameInput, 'VIP Member');

      const buttons = screen.getAllByRole('button', { name: /create tag/i });
      await user.click(buttons[buttons.length - 1]);

      expect(await screen.findByText('A tag with this name already exists')).toBeInTheDocument();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('shows a live preview of the tag name', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await user.click(screen.getByRole('button', { name: /create tag/i }));
      const nameInput = await screen.findByLabelText('Tag Name *');
      await user.type(nameInput, 'Preview Test');

      await waitFor(() => expect(screen.getByText('Preview Test')).toBeInTheDocument());
    });

    it('closes the dialog on cancel', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await user.click(screen.getByRole('button', { name: /create tag/i }));
      await screen.findByLabelText('Tag Name *');

      const cancelButtons = await screen.findAllByRole('button', { name: /cancel/i });
      await user.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => expect(screen.queryByLabelText('Tag Name *')).not.toBeInTheDocument());
    });
  });

  describe('Tag Editing', () => {
    it('opens the edit dialog populated with existing data and updates via PUT', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));

      const items = screen.getAllByTestId('tag-item');
      const vipItem = items.find((i) => within(i).queryByText('VIP Member'))!;
      await user.click(within(vipItem).getByLabelText(/edit vip member/i));

      const nameInput = (await screen.findByLabelText('Tag Name *')) as HTMLInputElement;
      expect(nameInput.value).toBe('VIP Member');

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated VIP');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(mockPut).toHaveBeenCalledWith(
          '/clubs/1/members/tags/1',
          expect.objectContaining({ name: 'Updated VIP' }),
        ),
      );
    });
  });

  describe('Tag Deletion', () => {
    it('confirms before deleting and shows the member count', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
      const items = screen.getAllByTestId('tag-item');
      const newsletterItem = items.find((i) => within(i).queryByText('Newsletter Subscriber'))!;

      await user.click(within(newsletterItem).getByLabelText(/delete newsletter subscriber/i));

      expect(await screen.findByText(/this will remove the tag from 128 members/i)).toBeInTheDocument();
    });

    it('deletes the tag when confirmed via DELETE', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
      const items = screen.getAllByTestId('tag-item');
      const vipItem = items.find((i) => within(i).queryByText('VIP Member'))!;

      await user.click(within(vipItem).getByLabelText(/delete vip member/i));
      const confirm = await screen.findByRole('button', { name: /confirm/i });
      await user.click(confirm);

      await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/clubs/1/members/tags/1'));
    });
  });

  describe('Bulk Actions', () => {
    it('hides bulk actions until a tag is selected', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} showBulkActions selectedMembers={mockMembers} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
      expect(screen.queryByText('Bulk Actions')).not.toBeInTheDocument();
    });

    it('fans out assignment to each (member, tag) pair', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} showBulkActions selectedMembers={mockMembers} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
      const items = screen.getAllByTestId('tag-item');
      await user.click(within(items[0]).getByRole('checkbox'));

      const assign = await screen.findByRole('button', { name: /assign selected tags/i });
      await user.click(assign);

      await waitFor(() => {
        // 1 selected tag x 2 members = 2 assign calls
        const assignCalls = mockPost.mock.calls.filter(([url]) => /\/assign\//.test(url));
        expect(assignCalls).toHaveLength(2);
      });
    });

    it('fans out removal to each (member, tag) pair', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} showBulkActions selectedMembers={mockMembers} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
      const items = screen.getAllByTestId('tag-item');
      await user.click(within(items[0]).getByRole('checkbox'));

      const remove = await screen.findByRole('button', { name: /remove selected tags/i });
      await user.click(remove);

      await waitFor(() => {
        const removeCalls = mockDelete.mock.calls.filter(([url]) => /\/remove\//.test(url));
        expect(removeCalls).toHaveLength(2);
      });
    });

    it('shows selected tag and member counts', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} showBulkActions selectedMembers={mockMembers} />);

      await waitFor(() => expect(screen.getAllByTestId('tag-item')).toHaveLength(3));
      const items = screen.getAllByTestId('tag-item');
      await user.click(within(items[0]).getByRole('checkbox'));
      await user.click(within(items[1]).getByRole('checkbox'));

      expect(await screen.findByText(/2 tags selected/i)).toBeInTheDocument();
      expect(screen.getByText(/2 members selected/i)).toBeInTheDocument();
    });
  });

  describe('Empty and error states', () => {
    it('shows the empty state and opens create from it', async () => {
      routeGet([]);
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      const createFirst = await screen.findByRole('button', { name: /create first tag/i });
      await user.click(createFirst);

      expect(await screen.findByLabelText('Tag Name *')).toBeInTheDocument();
    });

    it('shows retry when the tags request fails', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.endsWith('/usage-stats')) return Promise.resolve({ data: mockStats });
        return Promise.reject(new Error('Server error'));
      });

      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /try again|retry/i })).toBeInTheDocument(),
      );
    });
  });

  describe('Accessibility', () => {
    it('exposes region and accessible edit/delete controls', async () => {
      renderWithProviders(<TagManager clubId={CLUB_ID} />);

      expect(screen.getByRole('region', { name: /tag management/i })).toBeInTheDocument();
      await waitFor(() => expect(screen.getAllByLabelText(/edit/i).length).toBeGreaterThan(0));
      expect(screen.getAllByLabelText(/delete/i).length).toBeGreaterThan(0);
    });
  });
});
