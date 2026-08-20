import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../client/src/contexts/AuthContext';
import memberSegmentationService from '../../../client/src/services/memberSegmentationService';
import { billingService } from '../../../client/src/services/billingService';

// Mock dependencies
jest.mock('../../../client/src/services/memberSegmentationService');
jest.mock('../../../client/src/services/billingService');
jest.mock('../../../client/src/hooks/useToast');

const mockedSegmentationService = memberSegmentationService as jest.Mocked<typeof memberSegmentationService>;
const mockedBillingService = billingService as jest.Mocked<typeof billingService>;

// Mock component - this would be imported from actual component
const MemberSegmentationDashboard: React.FC<{ clubId: number }> = ({ clubId }) => {
  const [segments, setSegments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedSegment, setSelectedSegment] = React.useState(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [filterCriteria, setFilterCriteria] = React.useState({});

  React.useEffect(() => {
    loadSegments();
  }, [clubId]);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const data = await mockedSegmentationService.getSegments(clubId);
      setSegments(data);
    } catch (error) {
      console.error('Failed to load segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = async (segmentData) => {
    try {
      await mockedSegmentationService.createSegment(clubId, segmentData);
      await loadSegments();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create segment:', error);
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    try {
      await mockedSegmentationService.deleteSegment(clubId, segmentId);
      await loadSegments();
    } catch (error) {
      console.error('Failed to delete segment:', error);
    }
  };

  const handlePreviewSegment = async (criteria) => {
    try {
      const preview = await mockedSegmentationService.previewSegment(clubId, criteria);
      return preview;
    } catch (error) {
      console.error('Failed to preview segment:', error);
      return null;
    }
  };

  if (loading) {
    return <div data-testid="loading-spinner">Loading segments...</div>;
  }

  return (
    <div data-testid="member-segmentation-dashboard">
      <div className="header">
        <h1>Member Segmentation</h1>
        <button 
          data-testid="create-segment-button"
          onClick={() => setShowCreateDialog(true)}
        >
          Create New Segment
        </button>
      </div>

      <div className="segments-list" data-testid="segments-list">
        {segments.length === 0 ? (
          <div data-testid="empty-state">
            No segments found. Create your first segment to get started.
          </div>
        ) : (
          segments.map((segment) => (
            <div key={segment.id} data-testid={`segment-${segment.id}`} className="segment-card">
              <h3>{segment.name}</h3>
              <p>{segment.description}</p>
              <div className="segment-stats">
                <span data-testid={`segment-${segment.id}-count`}>
                  {segment.memberCount} members
                </span>
                <span className={`status ${segment.isActive ? 'active' : 'inactive'}`}>
                  {segment.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="segment-actions">
                <button 
                  data-testid={`view-segment-${segment.id}`}
                  onClick={() => setSelectedSegment(segment)}
                >
                  View Members
                </button>
                <button 
                  data-testid={`edit-segment-${segment.id}`}
                  onClick={() => {/* Edit logic */}}
                >
                  Edit
                </button>
                <button 
                  data-testid={`delete-segment-${segment.id}`}
                  onClick={() => handleDeleteSegment(segment.id)}
                  className="danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateDialog && (
        <div data-testid="create-segment-dialog" className="dialog">
          <div className="dialog-content">
            <h2>Create New Segment</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const segmentData = {
                name: formData.get('name'),
                description: formData.get('description'),
                filterCriteria: filterCriteria
              };
              handleCreateSegment(segmentData);
            }}>
              <div className="form-group">
                <label htmlFor="segment-name">Segment Name</label>
                <input 
                  id="segment-name"
                  name="name"
                  data-testid="segment-name-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="segment-description">Description</label>
                <textarea 
                  id="segment-description"
                  name="description"
                  data-testid="segment-description-input"
                />
              </div>
              <div className="form-group">
                <label>Filter Criteria</label>
                <div data-testid="filter-criteria-section">
                  <select 
                    data-testid="status-filter"
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <select 
                    data-testid="engagement-filter"
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      engagementLevel: e.target.value
                    }))}
                  >
                    <option value="">All Engagement Levels</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="dialog-actions">
                <button 
                  type="button"
                  data-testid="preview-segment-button"
                  onClick={() => handlePreviewSegment(filterCriteria)}
                >
                  Preview
                </button>
                <button 
                  type="button"
                  data-testid="cancel-create-button"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  data-testid="create-segment-submit"
                >
                  Create Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSegment && (
        <div data-testid="segment-members-dialog" className="dialog">
          <div className="dialog-content">
            <h2>{selectedSegment.name} - Members</h2>
            <div data-testid="segment-members-list">
              {/* Members list would be rendered here */}
            </div>
            <button 
              data-testid="close-members-dialog"
              onClick={() => setSelectedSegment(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('MemberSegmentationDashboard', () => {
  const mockClubId = 1;
  const user = userEvent.setup();

  const mockSegments = [
    {
      id: 1,
      clubId: mockClubId,
      name: 'Active Members',
      description: 'All currently active members',
      memberCount: 150,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      filterCriteria: { status: 'Active' }
    },
    {
      id: 2,
      clubId: mockClubId,
      name: 'High Engagement',
      description: 'Members with high engagement scores',
      memberCount: 75,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      filterCriteria: { engagementLevel: 'high' }
    }
  ];

  const mockBillingStatus = {
    currentTier: 'Unlimited',
    isActive: true,
    nextBillingDate: '2024-02-01T00:00:00Z',
    features: ['segmentation']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedBillingService.getBillingStatus.mockResolvedValue(mockBillingStatus);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the dashboard with header and create button', async () => {
      mockedSegmentationService.getSegments.mockResolvedValue(mockSegments);

      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      expect(screen.getByText('Member Segmentation')).toBeInTheDocument();
      expect(screen.getByTestId('create-segment-button')).toBeInTheDocument();
      expect(screen.getByText('Create New Segment')).toBeInTheDocument();
    });

    it('shows loading state while fetching segments', () => {
      mockedSegmentationService.getSegments.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSegments), 100))
      );

      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading segments...')).toBeInTheDocument();
    });

    it('displays empty state when no segments exist', async () => {
      mockedSegmentationService.getSegments.mockResolvedValue([]);

      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No segments found. Create your first segment to get started.')).toBeInTheDocument();
      });
    });

    it('displays segment list when segments exist', async () => {
      mockedSegmentationService.getSegments.mockResolvedValue(mockSegments);

      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('segments-list')).toBeInTheDocument();
        expect(screen.getByText('Active Members')).toBeInTheDocument();
        expect(screen.getByText('High Engagement')).toBeInTheDocument();
      });
    });
  });

  describe('Segment Display', () => {
    beforeEach(async () => {
      mockedSegmentationService.getSegments.mockResolvedValue(mockSegments);
      
      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Active Members')).toBeInTheDocument();
      });
    });

    it('displays segment information correctly', () => {
      const activeSegment = screen.getByTestId('segment-1');
      
      expect(within(activeSegment).getByText('Active Members')).toBeInTheDocument();
      expect(within(activeSegment).getByText('All currently active members')).toBeInTheDocument();
      expect(within(activeSegment).getByText('150 members')).toBeInTheDocument();
      expect(within(activeSegment).getByText('Active')).toBeInTheDocument();
    });

    it('displays action buttons for each segment', () => {
      expect(screen.getByTestId('view-segment-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-segment-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-segment-1')).toBeInTheDocument();
    });

    it('shows correct member counts for each segment', () => {
      expect(screen.getByTestId('segment-1-count')).toHaveTextContent('150 members');
      expect(screen.getByTestId('segment-2-count')).toHaveTextContent('75 members');
    });
  });

  describe('Create Segment Dialog', () => {
    beforeEach(async () => {
      mockedSegmentationService.getSegments.mockResolvedValue([]);
      
      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('create-segment-button')).toBeInTheDocument();
      });
    });

    it('opens create dialog when create button is clicked', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      expect(screen.getByTestId('create-segment-dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Segment')).toBeInTheDocument();
    });

    it('renders form fields in create dialog', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      expect(screen.getByTestId('segment-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('segment-description-input')).toBeInTheDocument();
      expect(screen.getByTestId('filter-criteria-section')).toBeInTheDocument();
    });

    it('has filter criteria dropdowns', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      expect(screen.getByTestId('engagement-filter')).toBeInTheDocument();

      const statusFilter = screen.getByTestId('status-filter');
      expect(within(statusFilter).getByText('All Status')).toBeInTheDocument();
      expect(within(statusFilter).getByText('Active')).toBeInTheDocument();
      expect(within(statusFilter).getByText('Inactive')).toBeInTheDocument();
    });

    it('closes dialog when cancel button is clicked', async () => {
      await user.click(screen.getByTestId('create-segment-button'));
      
      expect(screen.getByTestId('create-segment-dialog')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('cancel-create-button'));
      
      expect(screen.queryByTestId('create-segment-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Segment Creation', () => {
    beforeEach(async () => {
      mockedSegmentationService.getSegments.mockResolvedValue([]);
      mockedSegmentationService.createSegment.mockResolvedValue({
        id: 3,
        clubId: mockClubId,
        name: 'New Segment',
        description: 'New segment description',
        memberCount: 0,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        filterCriteria: { status: 'Active' }
      });
      
      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('create-segment-button')).toBeInTheDocument();
      });
    });

    it('creates segment with valid form data', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      // Fill form fields
      await user.type(screen.getByTestId('segment-name-input'), 'New Test Segment');
      await user.type(screen.getByTestId('segment-description-input'), 'Test description');
      await user.selectOptions(screen.getByTestId('status-filter'), 'Active');

      // Submit form
      await user.click(screen.getByTestId('create-segment-submit'));

      expect(mockedSegmentationService.createSegment).toHaveBeenCalledWith(mockClubId, {
        name: 'New Test Segment',
        description: 'Test description',
        filterCriteria: { status: 'Active' }
      });
    });

    it('requires segment name', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      // Try to submit without name
      await user.click(screen.getByTestId('create-segment-submit'));

      // Form should not submit (HTML5 validation)
      expect(mockedSegmentationService.createSegment).not.toHaveBeenCalled();
    });

    it('updates filter criteria when dropdowns change', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      // Change status filter
      await user.selectOptions(screen.getByTestId('status-filter'), 'Active');
      // Change engagement filter
      await user.selectOptions(screen.getByTestId('engagement-filter'), 'high');

      // Fill required fields and submit
      await user.type(screen.getByTestId('segment-name-input'), 'Test Segment');
      await user.click(screen.getByTestId('create-segment-submit'));

      expect(mockedSegmentationService.createSegment).toHaveBeenCalledWith(mockClubId, {
        name: 'Test Segment',
        description: '',
        filterCriteria: { status: 'Active', engagementLevel: 'high' }
      });
    });
  });

  describe('Segment Preview', () => {
    beforeEach(async () => {
      mockedSegmentationService.getSegments.mockResolvedValue([]);
      mockedSegmentationService.previewSegment.mockResolvedValue({
        totalCount: 25,
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      });
      
      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('create-segment-button')).toBeInTheDocument();
      });
    });

    it('calls preview service when preview button is clicked', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      // Set some filter criteria
      await user.selectOptions(screen.getByTestId('status-filter'), 'Active');

      // Click preview
      await user.click(screen.getByTestId('preview-segment-button'));

      expect(mockedSegmentationService.previewSegment).toHaveBeenCalledWith(
        mockClubId,
        { status: 'Active' }
      );
    });
  });

  describe('Segment Deletion', () => {
    beforeEach(async () => {
      mockedSegmentationService.getSegments
        .mockResolvedValueOnce(mockSegments)
        .mockResolvedValueOnce([]); // After deletion
      mockedSegmentationService.deleteSegment.mockResolvedValue({ success: true });
      
      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Active Members')).toBeInTheDocument();
      });
    });

    it('deletes segment when delete button is clicked', async () => {
      await user.click(screen.getByTestId('delete-segment-1'));

      expect(mockedSegmentationService.deleteSegment).toHaveBeenCalledWith(mockClubId, 1);
      
      // Should reload segments after deletion
      await waitFor(() => {
        expect(mockedSegmentationService.getSegments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('View Segment Members', () => {
    beforeEach(async () => {
      mockedSegmentationService.getSegments.mockResolvedValue(mockSegments);
      
      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Active Members')).toBeInTheDocument();
      });
    });

    it('opens members dialog when view button is clicked', async () => {
      await user.click(screen.getByTestId('view-segment-1'));

      expect(screen.getByTestId('segment-members-dialog')).toBeInTheDocument();
      expect(screen.getByText('Active Members - Members')).toBeInTheDocument();
    });

    it('closes members dialog when close button is clicked', async () => {
      await user.click(screen.getByTestId('view-segment-1'));
      
      expect(screen.getByTestId('segment-members-dialog')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-members-dialog'));
      
      expect(screen.queryByTestId('segment-members-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles segment loading errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedSegmentationService.getSegments.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load segments:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles segment creation errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedSegmentationService.getSegments.mockResolvedValue([]);
      mockedSegmentationService.createSegment.mockRejectedValue(new Error('Creation Error'));

      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('create-segment-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('create-segment-button'));
      await user.type(screen.getByTestId('segment-name-input'), 'Test Segment');
      await user.click(screen.getByTestId('create-segment-submit'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create segment:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large number of segments', async () => {
      const largeSegmentList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        clubId: mockClubId,
        name: `Segment ${i + 1}`,
        description: `Description for segment ${i + 1}`,
        memberCount: Math.floor(Math.random() * 1000),
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        filterCriteria: { status: 'Active' }
      }));

      mockedSegmentationService.getSegments.mockResolvedValue(largeSegmentList);

      const startTime = performance.now();

      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Segment 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getAllByTestId(/^segment-\d+$/)).toHaveLength(100);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockedSegmentationService.getSegments.mockResolvedValue(mockSegments);
      
      render(
        <TestWrapper>
          <MemberSegmentationDashboard clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Active Members')).toBeInTheDocument();
      });
    });

    it('has proper heading structure', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Member Segmentation');
    });

    it('has accessible form labels', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      expect(screen.getByLabelText('Segment Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter Criteria')).toBeInTheDocument();
    });

    it('has proper button roles and text', () => {
      const createButton = screen.getByTestId('create-segment-button');
      expect(createButton).toHaveAttribute('type', 'button');
      expect(createButton).toHaveTextContent('Create New Segment');
    });

    it('has accessible dialog structure', async () => {
      await user.click(screen.getByTestId('create-segment-button'));

      const dialog = screen.getByTestId('create-segment-dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByRole('heading', { level: 2 })).toHaveTextContent('Create New Segment');
    });
  });
});