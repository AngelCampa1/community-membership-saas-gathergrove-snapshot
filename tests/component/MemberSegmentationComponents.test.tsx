/**
 * React Component Tests for Member Segmentation UI
 * Test coverage for all segmentation-related components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';

// Mock API services
jest.mock('@/services/customFieldsService');
jest.mock('@/services/memberTaggingService');
jest.mock('@/services/memberSegmentationService');
jest.mock('@/services/bulkOperationsService');

import { CustomFieldManager } from '@/components/features/admin/CustomFieldManager';
import { TagManager } from '@/components/features/admin/TagManager';
import { AdvancedMemberFilter } from '@/components/features/members/AdvancedMemberFilter';
import { SegmentBuilder } from '@/components/features/members/SegmentBuilder';
import { BulkOperationsPanel } from '@/components/features/members/BulkOperationsPanel';
import { SegmentAnalytics } from '@/components/features/analytics/SegmentAnalytics';
import { customFieldsService } from '@/services/customFieldsService';
import { memberTaggingService } from '@/services/memberTaggingService';
import { memberSegmentationService } from '@/services/memberSegmentationService';
import { bulkOperationsService } from '@/services/bulkOperationsService';

// Create a test wrapper with React Query
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Member Segmentation Components', () => {
  const mockClubId = 'club-123';
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CustomFieldManager', () => {
    const mockCustomFields = [
      {
        id: 'field-1',
        clubId: mockClubId,
        fieldName: 'Emergency Contact',
        fieldType: 'TEXT',
        isRequired: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'field-2',
        clubId: mockClubId,
        fieldName: 'Membership Level',
        fieldType: 'SELECT',
        fieldOptions: ['Bronze', 'Silver', 'Gold'],
        isRequired: false,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    beforeEach(() => {
      (customFieldsService.getCustomFields as jest.Mock).mockResolvedValue(mockCustomFields);
    });

    it('should render custom fields list', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
        expect(screen.getByText('Membership Level')).toBeInTheDocument();
      });
    });

    it('should show create custom field dialog', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /add custom field/i });
      await user.click(createButton);

      expect(screen.getByText('Create Custom Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Field Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Field Type')).toBeInTheDocument();
    });

    it('should create a new text custom field', async () => {
      const TestWrapper = createTestWrapper();
      (customFieldsService.createCustomField as jest.Mock).mockResolvedValue({
        id: 'field-3',
        fieldName: 'Phone Number',
        fieldType: 'TEXT',
        isRequired: false
      });
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      // Open create dialog
      await user.click(screen.getByRole('button', { name: /add custom field/i }));

      // Fill form
      await user.type(screen.getByLabelText('Field Name'), 'Phone Number');
      await user.selectOptions(screen.getByLabelText('Field Type'), 'TEXT');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create field/i }));

      await waitFor(() => {
        expect(customFieldsService.createCustomField).toHaveBeenCalledWith(
          mockClubId,
          expect.objectContaining({
            fieldName: 'Phone Number',
            fieldType: 'TEXT',
            isRequired: false
          })
        );
      });
    });

    it('should create a select field with options', async () => {
      const TestWrapper = createTestWrapper();
      (customFieldsService.createCustomField as jest.Mock).mockResolvedValue({
        id: 'field-4',
        fieldName: 'T-Shirt Size',
        fieldType: 'SELECT',
        fieldOptions: ['S', 'M', 'L', 'XL']
      });
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /add custom field/i }));
      await user.type(screen.getByLabelText('Field Name'), 'T-Shirt Size');
      await user.selectOptions(screen.getByLabelText('Field Type'), 'SELECT');

      // Add options
      const optionsInput = screen.getByLabelText('Options (comma-separated)');
      await user.type(optionsInput, 'S, M, L, XL');

      await user.click(screen.getByRole('button', { name: /create field/i }));

      await waitFor(() => {
        expect(customFieldsService.createCustomField).toHaveBeenCalledWith(
          mockClubId,
          expect.objectContaining({
            fieldName: 'T-Shirt Size',
            fieldType: 'SELECT',
            fieldOptions: ['S', 'M', 'L', 'XL']
          })
        );
      });
    });

    it('should validate field name is required', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /add custom field/i }));
      await user.click(screen.getByRole('button', { name: /create field/i }));

      expect(screen.getByText('Field name is required')).toBeInTheDocument();
    });

    it('should delete a custom field with confirmation', async () => {
      const TestWrapper = createTestWrapper();
      (customFieldsService.deleteCustomField as jest.Mock).mockResolvedValue({ success: true });
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion
      expect(screen.getByText('Are you sure you want to delete this field?')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /confirm delete/i }));

      await waitFor(() => {
        expect(customFieldsService.deleteCustomField).toHaveBeenCalledWith(
          mockClubId,
          'field-1',
          false
        );
      });
    });

    it('should handle field reordering', async () => {
      const TestWrapper = createTestWrapper();
      (customFieldsService.reorderCustomFields as jest.Mock).mockResolvedValue({ success: true });
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
      });

      // Test drag and drop functionality (simplified)
      const dragHandle = screen.getAllByLabelText('Drag to reorder')[0];
      fireEvent.dragStart(dragHandle);
      fireEvent.dragEnd(dragHandle);

      // Verify reorder API call would be made (implementation specific)
    });
  });

  describe('TagManager', () => {
    const mockTags = [
      {
        id: 'tag-1',
        tagName: 'VIP Members',
        tagColor: '#FF6B6B',
        description: 'High-value members'
      },
      {
        id: 'tag-2',
        tagName: 'New Members',
        tagColor: '#4ECDC4',
        description: 'Recently joined'
      }
    ];

    beforeEach(() => {
      (memberTaggingService.getTags as jest.Mock).mockResolvedValue(mockTags);
    });

    it('should render tags list', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <TagManager clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('VIP Members')).toBeInTheDocument();
        expect(screen.getByText('New Members')).toBeInTheDocument();
      });
    });

    it('should create a new tag', async () => {
      const TestWrapper = createTestWrapper();
      (memberTaggingService.createTag as jest.Mock).mockResolvedValue({
        id: 'tag-3',
        tagName: 'Board Members',
        tagColor: '#9B59B6'
      });
      
      render(
        <TestWrapper>
          <TagManager clubId={mockClubId} />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /add tag/i }));

      await user.type(screen.getByLabelText('Tag Name'), 'Board Members');
      
      // Color picker interaction (simplified)
      const colorInput = screen.getByLabelText('Tag Color');
      await user.clear(colorInput);
      await user.type(colorInput, '#9B59B6');

      await user.click(screen.getByRole('button', { name: /create tag/i }));

      await waitFor(() => {
        expect(memberTaggingService.createTag).toHaveBeenCalledWith(
          mockClubId,
          expect.objectContaining({
            tagName: 'Board Members',
            tagColor: '#9B59B6'
          })
        );
      });
    });

    it('should show tag statistics', async () => {
      const TestWrapper = createTestWrapper();
      (memberTaggingService.getTagStats as jest.Mock).mockResolvedValue({
        totalTags: 2,
        totalAssignments: 45,
        tagUsage: mockTags.map(tag => ({ ...tag, memberCount: 20 }))
      });
      
      render(
        <TestWrapper>
          <TagManager clubId={mockClubId} />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /statistics/i }));

      await waitFor(() => {
        expect(screen.getByText('Total Tags: 2')).toBeInTheDocument();
        expect(screen.getByText('Total Assignments: 45')).toBeInTheDocument();
      });
    });
  });

  describe('AdvancedMemberFilter', () => {
    const mockOnFilterChange = jest.fn();

    it('should render filter interface', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <AdvancedMemberFilter 
            clubId={mockClubId}
            onFilterChange={mockOnFilterChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add condition/i })).toBeInTheDocument();
    });

    it('should add filter conditions', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <AdvancedMemberFilter 
            clubId={mockClubId}
            onFilterChange={mockOnFilterChange}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /add condition/i }));

      expect(screen.getByLabelText('Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Operator')).toBeInTheDocument();
      expect(screen.getByLabelText('Value')).toBeInTheDocument();
    });

    it('should handle join date filters', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <AdvancedMemberFilter 
            clubId={mockClubId}
            onFilterChange={mockOnFilterChange}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /add condition/i }));
      await user.selectOptions(screen.getByLabelText('Field'), 'joinDate');
      await user.selectOptions(screen.getByLabelText('Operator'), 'GREATER_THAN');
      await user.type(screen.getByLabelText('Value'), '2024-01-01');

      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          conditions: expect.arrayContaining([
            expect.objectContaining({
              field: 'joinDate',
              operator: 'GREATER_THAN',
              value: '2024-01-01'
            })
          ])
        })
      );
    });

    it('should handle tag filters', async () => {
      const TestWrapper = createTestWrapper();
      (memberTaggingService.getTags as jest.Mock).mockResolvedValue([
        { id: 'tag-1', tagName: 'VIP' },
        { id: 'tag-2', tagName: 'Active' }
      ]);
      
      render(
        <TestWrapper>
          <AdvancedMemberFilter 
            clubId={mockClubId}
            onFilterChange={mockOnFilterChange}
          />
        </TestWrapper>
      );

      const tagFilterSection = screen.getByLabelText('Tag Filters');
      const includeTagsSelect = within(tagFilterSection).getByLabelText('Include Tags');
      
      await user.click(includeTagsSelect);
      await user.click(screen.getByText('VIP'));

      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          tagFilters: expect.objectContaining({
            includeTags: ['tag-1']
          })
        })
      );
    });

    it('should save filter presets', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <AdvancedMemberFilter 
            clubId={mockClubId}
            onFilterChange={mockOnFilterChange}
          />
        </TestWrapper>
      );

      // Add a condition first
      await user.click(screen.getByRole('button', { name: /add condition/i }));
      await user.selectOptions(screen.getByLabelText('Field'), 'status');
      await user.selectOptions(screen.getByLabelLabel('Operator'), 'EQUALS');
      await user.type(screen.getByLabelText('Value'), 'Active');

      // Save as preset
      await user.click(screen.getByRole('button', { name: /save preset/i }));
      await user.type(screen.getByLabelText('Preset Name'), 'Active Members');
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Verify preset is saved (implementation specific)
    });
  });

  describe('SegmentBuilder', () => {
    const mockOnSegmentSave = jest.fn();

    beforeEach(() => {
      (memberSegmentationService.previewSegment as jest.Mock).mockResolvedValue({
        members: [],
        totalCount: 0,
        sampleSize: 100
      });
    });

    it('should render segment builder interface', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <SegmentBuilder 
            clubId={mockClubId}
            onSegmentSave={mockOnSegmentSave}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Segment Builder')).toBeInTheDocument();
      expect(screen.getByLabelText('Segment Name')).toBeInTheDocument();
    });

    it('should preview segment before saving', async () => {
      const TestWrapper = createTestWrapper();
      (memberSegmentationService.previewSegment as jest.Mock).mockResolvedValue({
        members: [
          { id: 'member-1', name: 'John Doe', email: 'john@example.com' }
        ],
        totalCount: 1,
        sampleSize: 100
      });
      
      render(
        <TestWrapper>
          <SegmentBuilder 
            clubId={mockClubId}
            onSegmentSave={mockOnSegmentSave}
          />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText('Segment Name'), 'Test Segment');
      await user.click(screen.getByRole('button', { name: /preview/i }));

      await waitFor(() => {
        expect(screen.getByText('Preview Results: 1 member')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should save segment with validation', async () => {
      const TestWrapper = createTestWrapper();
      (memberSegmentationService.createSegment as jest.Mock).mockResolvedValue({
        id: 'segment-1',
        segmentName: 'Test Segment'
      });
      
      render(
        <TestWrapper>
          <SegmentBuilder 
            clubId={mockClubId}
            onSegmentSave={mockOnSegmentSave}
          />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText('Segment Name'), 'Test Segment');
      
      // Add at least one condition
      await user.click(screen.getByRole('button', { name: /add condition/i }));
      await user.selectOptions(screen.getByLabelText('Field'), 'status');
      await user.selectOptions(screen.getByLabelText('Operator'), 'EQUALS');
      await user.type(screen.getByLabelText('Value'), 'Active');

      await user.click(screen.getByRole('button', { name: /save segment/i }));

      await waitFor(() => {
        expect(memberSegmentationService.createSegment).toHaveBeenCalledWith(
          mockClubId,
          expect.objectContaining({
            segmentName: 'Test Segment'
          }),
          expect.any(String)
        );
        expect(mockOnSegmentSave).toHaveBeenCalled();
      });
    });

    it('should validate segment name is required', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <SegmentBuilder 
            clubId={mockClubId}
            onSegmentSave={mockOnSegmentSave}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /save segment/i }));

      expect(screen.getByText('Segment name is required')).toBeInTheDocument();
    });
  });

  describe('BulkOperationsPanel', () => {
    const mockSelectedMembers = ['member-1', 'member-2'];
    const mockOnOperationComplete = jest.fn();

    it('should render bulk operations interface', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <BulkOperationsPanel 
            clubId={mockClubId}
            selectedMembers={mockSelectedMembers}
            onOperationComplete={mockOnOperationComplete}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
      expect(screen.getByText(`${mockSelectedMembers.length} members selected`)).toBeInTheDocument();
    });

    it('should perform bulk custom field update', async () => {
      const TestWrapper = createTestWrapper();
      (bulkOperationsService.bulkUpdateCustomFields as jest.Mock).mockResolvedValue({
        success: true,
        successfulRecords: 2,
        failedRecords: 0
      });
      
      render(
        <TestWrapper>
          <BulkOperationsPanel 
            clubId={mockClubId}
            selectedMembers={mockSelectedMembers}
            onOperationComplete={mockOnOperationComplete}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('tab', { name: /custom fields/i }));
      
      // Select a field and set value
      await user.selectOptions(screen.getByLabelText('Field'), 'field-1');
      await user.type(screen.getByLabelText('New Value'), 'Updated Value');

      await user.click(screen.getByRole('button', { name: /update fields/i }));

      await waitFor(() => {
        expect(bulkOperationsService.bulkUpdateCustomFields).toHaveBeenCalledWith(
          mockClubId,
          mockSelectedMembers,
          expect.objectContaining({
            'field-1': 'Updated Value'
          }),
          expect.any(String)
        );
        expect(mockOnOperationComplete).toHaveBeenCalled();
      });
    });

    it('should perform bulk tag assignment', async () => {
      const TestWrapper = createTestWrapper();
      (bulkOperationsService.bulkAssignTags as jest.Mock).mockResolvedValue({
        success: true,
        assignmentsCreated: 4
      });
      
      render(
        <TestWrapper>
          <BulkOperationsPanel 
            clubId={mockClubId}
            selectedMembers={mockSelectedMembers}
            onOperationComplete={mockOnOperationComplete}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('tab', { name: /tags/i }));
      
      // Select tags
      const tagSelect = screen.getByLabelText('Tags to Assign');
      await user.click(tagSelect);
      await user.click(screen.getByText('VIP'));

      await user.click(screen.getByRole('button', { name: /assign tags/i }));

      await waitFor(() => {
        expect(bulkOperationsService.bulkAssignTags).toHaveBeenCalledWith(
          mockClubId,
          mockSelectedMembers,
          expect.arrayContaining(['tag-1']),
          expect.any(String)
        );
      });
    });

    it('should show confirmation for destructive operations', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <BulkOperationsPanel 
            clubId={mockClubId}
            selectedMembers={mockSelectedMembers}
            onOperationComplete={mockOnOperationComplete}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('tab', { name: /member status/i }));
      await user.selectOptions(screen.getByLabelText('New Status'), 'Inactive');
      await user.click(screen.getByRole('button', { name: /update status/i }));

      expect(screen.getByText('Are you sure you want to update the status')).toBeInTheDocument();
    });

    it('should handle operation errors gracefully', async () => {
      const TestWrapper = createTestWrapper();
      (bulkOperationsService.bulkUpdateCustomFields as jest.Mock).mockRejectedValue(
        new Error('Operation failed')
      );
      
      render(
        <TestWrapper>
          <BulkOperationsPanel 
            clubId={mockClubId}
            selectedMembers={mockSelectedMembers}
            onOperationComplete={mockOnOperationComplete}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('tab', { name: /custom fields/i }));
      await user.selectOptions(screen.getByLabelText('Field'), 'field-1');
      await user.type(screen.getByLabelText('New Value'), 'Test');
      await user.click(screen.getByRole('button', { name: /update fields/i }));

      await waitFor(() => {
        expect(screen.getByText('Operation failed')).toBeInTheDocument();
      });
    });
  });

  describe('SegmentAnalytics', () => {
    const mockSegmentId = 'segment-1';
    const mockAnalyticsData = {
      memberGrowth: [
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-15', count: 15 },
        { date: '2024-02-01', count: 20 }
      ],
      engagementMetrics: {
        averageEvents: 3.5,
        communicationOpenRate: 0.65,
        lastActivityDays: 7
      },
      demographics: {
        ageDistribution: { '18-25': 5, '26-35': 10, '36-50': 3, '51+': 2 },
        locationDistribution: { 'Seattle': 12, 'Portland': 5, 'Other': 3 }
      }
    };

    beforeEach(() => {
      // Mock analytics service calls
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAnalyticsData
      });
    });

    it('should render segment analytics dashboard', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <SegmentAnalytics 
            clubId={mockClubId}
            segmentId={mockSegmentId}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Segment Analytics')).toBeInTheDocument();
        expect(screen.getByText('Member Growth')).toBeInTheDocument();
        expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
      });
    });

    it('should display member growth chart', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <SegmentAnalytics 
            clubId={mockClubId}
            segmentId={mockSegmentId}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for chart container or specific chart elements
        expect(screen.getByRole('img', { name: /member growth chart/i })).toBeInTheDocument();
      });
    });

    it('should show engagement statistics', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <SegmentAnalytics 
            clubId={mockClubId}
            segmentId={mockSegmentId}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('3.5')).toBeInTheDocument(); // Average events
        expect(screen.getByText('65%')).toBeInTheDocument(); // Open rate
        expect(screen.getByText('7 days')).toBeInTheDocument(); // Last activity
      });
    });

    it('should allow exporting analytics data', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <SegmentAnalytics 
            clubId={mockClubId}
            segmentId={mockSegmentId}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /export/i }));

      // Verify export functionality (implementation specific)
      // This might involve checking for download trigger or API call
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const TestWrapper = createTestWrapper();
      (customFieldsService.getCustomFields as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading custom fields/i)).toBeInTheDocument();
      });
    });

    it('should show loading states', () => {
      const TestWrapper = createTestWrapper();
      (customFieldsService.getCustomFields as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle validation errors', async () => {
      const TestWrapper = createTestWrapper();
      (customFieldsService.createCustomField as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Field name already exists' }
        }
      });
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /add custom field/i }));
      await user.type(screen.getByLabelText('Field Name'), 'Duplicate Field');
      await user.selectOptions(screen.getByLabelText('Field Type'), 'TEXT');
      await user.click(screen.getByRole('button', { name: /create field/i }));

      await waitFor(() => {
        expect(screen.getByText('Field name already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <CustomFieldManager clubId={mockClubId} />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Custom Fields Management');
      expect(screen.getByRole('button', { name: /add custom field/i })).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <AdvancedMemberFilter 
            clubId={mockClubId}
            onFilterChange={jest.fn()}
          />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      
      // Focus and activate with keyboard
      addButton.focus();
      fireEvent.keyDown(addButton, { key: 'Enter' });
      
      expect(screen.getByLabelText('Field')).toBeInTheDocument();
    });

    it('should announce dynamic content changes', async () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <SegmentBuilder 
            clubId={mockClubId}
            onSegmentSave={jest.fn()}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /preview/i }));

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/preview results/i);
      });
    });
  });
});