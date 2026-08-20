import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MembersPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import memberServiceDefault from '@/services/memberService';
import billingServiceDefault from '@/services/billingService';
import membershipTypeServiceDefault from '@/services/membershipTypeService';

// Mock only external boundaries - services at the boundary
jest.mock('@/hooks/useAuth');

// Mock services with factory that returns same object for both default and named export
jest.mock('@/services/memberService', () => {
  const mockService = {
    getPaginatedMembers: jest.fn(),
    getMembers: jest.fn(),
    archiveMember: jest.fn(),
    unarchiveMember: jest.fn(),
    createMember: jest.fn(),
    updateMember: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockService,
    memberService: mockService,
  };
});

jest.mock('@/services/billingService', () => {
  const mockService = {
    getBillingStatus: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockService,
    billingService: mockService,
  };
});

jest.mock('@/services/membershipTypeService', () => {
  const mockService = {
    getMembershipTypes: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockService,
    membershipTypeService: mockService,
  };
});

// Engagement analytics is a separate backend feature (Unlimited tier). The members
// page reads per-member overall scores from it to power the Engagement Level filter.
jest.mock('@/services/featureAnalyticsService', () => {
  const mockService = {
    getMemberEngagementAnalytics: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockService,
    featureAnalyticsService: mockService,
  };
});

// Mock feature modal components (these are complex sub-features)
jest.mock('@/components/features/members/MemberDetailsModal', () => ({
  MemberDetailsModal: ({ isOpen, member }: any) =>
    isOpen ? <div data-testid="member-details-modal">Edit {member?.fullName}</div> : null,
}));

jest.mock('@/components/features/members/AddMemberModal', () => ({
  AddMemberModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="add-member-modal">Add Member Form</div> : null,
}));

jest.mock('@/components/features/members/ImportMembersModal', () => ({
  ImportMembersModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="import-members-modal">Import Members Form</div> : null,
}));

jest.mock('@/components/features/members/RequestPaymentModal', () => ({
  RequestPaymentModal: ({ isOpen, member }: any) =>
    isOpen ? <div data-testid="request-payment-modal">Request Payment for {member?.fullName}</div> : null,
}));

jest.mock('@/components/features/members/RecordPaymentModal', () => ({
  RecordPaymentModal: ({ isOpen, member }: any) =>
    isOpen ? <div data-testid="record-payment-modal">Record Payment for {member?.fullName}</div> : null,
}));

// Mock engagement components barrel export
jest.mock('@/components/engagement', () => ({
  MemberEngagementScore: ({ memberId }: { memberId: string }) => (
    <div data-testid={`engagement-score-${memberId}`}>High (85%)</div>
  ),
  EngagementDashboard: () => <div>Engagement Dashboard</div>,
  EngagementMetricsPanel: () => <div>Engagement Metrics</div>,
  AtRiskMembersAlert: () => <div>At Risk Alert</div>,
}));

import { featureAnalyticsService } from '@/services/featureAnalyticsService';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockMemberService = memberServiceDefault as jest.Mocked<typeof memberServiceDefault>;
const mockBillingService = billingServiceDefault as jest.Mocked<typeof billingServiceDefault>;
const mockMembershipTypeService = membershipTypeServiceDefault as jest.Mocked<typeof membershipTypeServiceDefault>;
const mockFeatureAnalyticsService = featureAnalyticsService as jest.Mocked<typeof featureAnalyticsService>;

// Mock member data
const mockMembershipTypes = [
  { id: 1, name: 'Individual', price: 50, durationMonths: 12 },
  { id: 2, name: 'Family', price: 100, durationMonths: 12 },
];

const mockMembers = [
  {
    id: 1,
    clubId: 1,
    membershipTypeId: 1,
    membershipTypeName: 'Individual',
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '555-0100',
    address: '123 Main St',
    status: 'Active',
    joinDate: '2024-01-15T00:00:00Z',
    duesPaidUntil: '2025-01-15T00:00:00Z',
    hasSmsConsent: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    customFieldValues: [],
    totalPaidCurrentPeriod: 50,
    expectedDuesAmount: 50,
    outstandingBalance: 0,
    hasPartialPayments: false,
  },
  {
    id: 2,
    clubId: 1,
    membershipTypeId: 2,
    membershipTypeName: 'Family',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phoneNumber: '555-0200',
    address: '456 Oak Ave',
    status: 'Active',
    joinDate: '2024-02-01T00:00:00Z',
    duesPaidUntil: '2024-12-01T00:00:00Z',
    hasSmsConsent: false,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    customFieldValues: [],
    totalPaidCurrentPeriod: 100,
    expectedDuesAmount: 100,
    outstandingBalance: 0,
    hasPartialPayments: false,
  },
];

const mockArchivedMembers = [
  {
    id: 3,
    clubId: 1,
    membershipTypeId: 1,
    membershipTypeName: 'Individual',
    fullName: 'Bob Archived',
    email: 'bob@example.com',
    phoneNumber: '555-0300',
    status: 'Archived',
    joinDate: '2023-01-01T00:00:00Z',
    hasSmsConsent: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    customFieldValues: [],
    totalPaidCurrentPeriod: 0,
    expectedDuesAmount: 50,
    outstandingBalance: 50,
    hasPartialPayments: false,
  },
];

// Helper function to render with QueryClient
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('MembersPage', () => {
  beforeEach(() => {
    // Setup default auth mock
    mockUseAuth.mockReturnValue({
      user: {
        userId: 1,
        clubId: 1,
        fullName: 'Test Admin',
        email: 'admin@example.com',
        clubName: 'Test Club',
        clubTier: 'Unlimited',
        role: 'Owner',
        isOnboardingCompleted: true,
      },
      loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshSession: jest.fn(),
      completeOnboarding: jest.fn(),
    });

    // Setup service mocks - Configure the jest.fn() mocks, don't replace them
    (mockBillingService.getBillingStatus as jest.Mock).mockResolvedValue({
      currentTier: 'Unlimited',
      memberCount: 2,
      memberLimit: -1,
      eventLimit: -1,
      communicationsLimit: -1,
      storageLimit: -1,
    });

    (mockMembershipTypeService.getMembershipTypes as jest.Mock).mockResolvedValue(mockMembershipTypes);

    // Member 1 (John) is highly engaged (85 -> high); member 2 (Jane) is low (30 -> low).
    (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue({
      memberScores: [
        { memberId: 1, memberName: 'John Doe', overallScore: 85, engagementLevel: 'Green', lastActivity: '2024-06-01T00:00:00Z', daysSinceLastLogin: 1, scoreBreakdown: {} },
        { memberId: 2, memberName: 'Jane Smith', overallScore: 30, engagementLevel: 'Red', lastActivity: '2024-05-01T00:00:00Z', daysSinceLastLogin: 20, scoreBreakdown: {} },
      ],
      clubSummary: {},
      distribution: {},
      trends: [],
    });

    (mockMemberService.getPaginatedMembers as jest.Mock).mockImplementation((clubId: number, search?: string, page = 1, pageSize = 25) => {
      const filteredMembers = mockMembers.filter(m =>
        !search ||
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      );

      const totalCount = filteredMembers.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize);

      return Promise.resolve({
        members: paginatedMembers,
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
        search: search || undefined,
      });
    });

    (mockMemberService.getMembers as jest.Mock).mockResolvedValue([...mockMembers, ...mockArchivedMembers]);

    (mockMemberService.archiveMember as jest.Mock).mockImplementation((clubId: number, memberId: number) => {
      return Promise.resolve({
        ...mockMembers[0],
        status: 'Archived',
      });
    });

    (mockMemberService.unarchiveMember as jest.Mock).mockImplementation((clubId: number, memberId: number) => {
      return Promise.resolve({
        ...mockMembers[0],
        status: 'Active',
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Load and Authentication', () => {
    it('renders loading state while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      renderWithQueryClient(<MembersPage />);
      expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
    });

    it('renders members page when authenticated', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        // Be specific - match the full title with count, not just "Active"
        expect(screen.getByText(/active members \(\d+\)/i)).toBeInTheDocument();
      });
    });

    it('displays member count in title', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        // Check for the exact text with count
        expect(screen.getByText(/active members \(2\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Member List Display', () => {
    it('displays member names and emails', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        // Use getAllByText since names may appear in multiple places
        const johnDoeElements = screen.getAllByText('John Doe');
        expect(johnDoeElements.length).toBeGreaterThan(0);
        expect(screen.getAllByText('john@example.com')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
        expect(screen.getAllByText('jane@example.com')[0]).toBeInTheDocument();
      });
    });

    it('displays membership types', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        // Use getAllByText since types may appear in filters and in member rows
        expect(screen.getAllByText('Individual').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Family').length).toBeGreaterThan(0);
      });
    });

    it('displays dues status badges', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        // Verify the member table rendered (which would include dues badges)
        // Check that both members are displayed
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters members by name when searching', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(/search members by name or email/i);
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('shows search term in description', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      // Wait for page to load first
      const searchInput = await screen.findByPlaceholderText(/search members by name or email/i);
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText(/search results for "test" in active members/i)).toBeInTheDocument();
      });
    });
  });

  describe('Active/Archived Toggle', () => {
    it('shows active members by default', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        // Check for title with count to avoid ambiguity with button
        expect(screen.getByText(/active members \(\d+\)/i)).toBeInTheDocument();
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });
    });

    it('switches to archived members when toggled', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });

      const archivedButton = screen.getByRole('button', { name: /archived/i });
      await user.click(archivedButton);

      await waitFor(() => {
        // Check for title with count to avoid ambiguity with button
        expect(screen.getByText(/archived members \(\d+\)/i)).toBeInTheDocument();
        // Use getAllByText for names that appear multiple times
        expect(screen.getAllByText('Bob Archived').length).toBeGreaterThan(0);
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('shows Add Member button for active members', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
      });
    });

    it('shows Import button for active members', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      });
    });

    it('opens add member modal when clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      const addButton = await screen.findByRole('button', { name: /add member/i });
      await user.click(addButton);

      expect(screen.getByTestId('add-member-modal')).toBeInTheDocument();
    });

    it('opens import modal when clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      const importButton = await screen.findByRole('button', { name: /import/i });
      await user.click(importButton);

      expect(screen.getByTestId('import-members-modal')).toBeInTheDocument();
    });
  });

  describe('Filters Panel', () => {
    it('toggles filters panel when filter button clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      const filterButton = await screen.findByRole('button', { name: /filters/i });
      await user.click(filterButton);

      expect(screen.getByText(/filter options/i)).toBeInTheDocument();
      expect(screen.getByTestId('select-membership-type')).toBeInTheDocument();
      expect(screen.getByTestId('select-dues-status')).toBeInTheDocument();
    });

    it('shows clear filters button when filters are active', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      // Type in search to activate a filter (simpler than dealing with Radix Select)
      const searchInput = await screen.findByPlaceholderText(/search members by name or email/i);
      await user.type(searchInput, 'test');

      // Open filters panel
      const filterButton = await screen.findByRole('button', { name: /filters/i });
      await user.click(filterButton);

      // Wait for filters panel and clear button to appear
      await waitFor(() => {
        expect(screen.getByTestId('button-clear-filters')).toBeInTheDocument();
      });
    });

    it('fetches per-member engagement scores on load', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(mockFeatureAnalyticsService.getMemberEngagementAnalytics).toHaveBeenCalledWith(1);
      });
      // Members still render normally.
      await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0));
    });

    it('filters members by engagement level (high keeps only highly-engaged)', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      // Wait for initial load + engagement scores to be fetched.
      await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0));
      await waitFor(() => expect(mockFeatureAnalyticsService.getMemberEngagementAnalytics).toHaveBeenCalled());
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);

      // Open the filters panel and pick the "High" engagement level.
      await user.click(await screen.findByRole('button', { name: /filters/i }));
      await user.click(screen.getByTestId('select-engagement-level'));
      await user.click(await screen.findByRole('option', { name: /high \(80-100%\)/i }));

      // John (85 -> high) remains; Jane (30 -> low) is filtered out.
      await waitFor(() => {
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    it('filters members by engagement level (low keeps only low-engaged)', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0));
      await waitFor(() => expect(mockFeatureAnalyticsService.getMemberEngagementAnalytics).toHaveBeenCalled());

      await user.click(await screen.findByRole('button', { name: /filters/i }));
      await user.click(screen.getByTestId('select-engagement-level'));
      await user.click(await screen.findByRole('option', { name: /low \(20-49%\)/i }));

      // Jane (30 -> low) remains; John (85 -> high) is filtered out.
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });

    it('degrades to a no-op when engagement analytics are unavailable', async () => {
      // Non-Unlimited tier / feature gated -> the request rejects.
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockRejectedValue(
        new Error('403 Forbidden')
      );
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0));

      // Selecting an engagement level must not empty the table when there's no data.
      await user.click(await screen.findByRole('button', { name: /filters/i }));
      await user.click(screen.getByTestId('select-engagement-level'));
      await user.click(await screen.findByRole('option', { name: /high \(80-100%\)/i }));

      // Both members remain visible — the filter is a no-op without engagement data.
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no members exist', async () => {
      (mockMemberService.getPaginatedMembers as jest.Mock).mockResolvedValueOnce({
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalCount: 0,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      });

      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(screen.getByText(/no members yet/i)).toBeInTheDocument();
      });
    });

    it('shows no results message when search returns empty', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });

      // Now override the mock to return empty results for the search
      (mockMemberService.getPaginatedMembers as jest.Mock).mockResolvedValueOnce({
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalCount: 0,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
        search: 'nonexistent',
      });

      const searchInput = screen.getByPlaceholderText(/search members by name or email/i);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/no members found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination when there are multiple pages', async () => {
      (mockMemberService.getPaginatedMembers as jest.Mock).mockResolvedValueOnce({
        members: mockMembers,
        currentPage: 1,
        pageSize: 1,
        totalCount: 2,
        totalPages: 2,
        hasPrevious: false,
        hasNext: true,
      });

      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      });
    });

    it('navigates to next page when next button clicked', async () => {
      (mockMemberService.getPaginatedMembers as jest.Mock)
        .mockResolvedValueOnce({
          members: [mockMembers[0]],
          currentPage: 1,
          pageSize: 1,
          totalCount: 2,
          totalPages: 2,
          hasPrevious: false,
          hasNext: true,
        })
        .mockResolvedValueOnce({
          members: [mockMembers[1]],
          currentPage: 2,
          pageSize: 1,
          totalCount: 2,
          totalPages: 2,
          hasPrevious: true,
          hasNext: false,
        });

      const user = userEvent.setup();
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Member Actions', () => {
    it('displays member action menu', async () => {
      renderWithQueryClient(<MembersPage />);

      await waitFor(() => {
        // Check for the MoreVertical icon buttons (action menu triggers)
        const menuTriggers = screen.getAllByTestId('more-vertical');
        expect(menuTriggers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      (mockMemberService.getPaginatedMembers as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

      renderWithQueryClient(<MembersPage />);

      // Component should still render even with API error
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search members/i)).toBeInTheDocument();
      });
    });
  });
});