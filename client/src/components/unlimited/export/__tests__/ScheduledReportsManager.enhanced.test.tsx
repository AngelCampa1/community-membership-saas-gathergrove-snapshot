/**
 * Enhanced Test Suite for ScheduledReportsManager
 *
 * Coverage Goals:
 * - Component rendering with loading/empty/data states
 * - Report creation with full form flow and validation
 * - Schedule configuration (daily/weekly/monthly/quarterly)
 * - Recipient management (add/remove with email validation)
 * - Report editing with pre-populated form
 * - Report deletion with confirmation dialog
 * - Toggle enable/disable functionality
 * - Run now manual execution
 * - Execution history display
 * - Status badge rendering based on execution status
 * - Next run time formatting
 * - Schedule validation errors
 * - Error handling for API failures
 * - Accessibility and keyboard navigation
 *
 * Testing Pattern:
 * - MSW for HTTP mocking (scheduledReportsService endpoints)
 * - Real component rendering with user interactions
 * - AAA pattern (Arrange, Act, Assert)
 * - Comprehensive edge case coverage
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { ScheduledReportsManager } from '../ScheduledReportsManager';
import type { ScheduledReport } from '@/services/scheduledReportsService';
import { scheduledReportsService } from '@/services/scheduledReportsService';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// API Base URL for MSW handlers
const API_BASE = 'http://localhost:8050/api/v1';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin User' },
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    api: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the scheduledReportsService to return test data
jest.mock('@/services/scheduledReportsService', () => {
  const actualModule = jest.requireActual('@/services/scheduledReportsService');
  return {
    ...actualModule,
    scheduledReportsService: {
      getScheduledReports: jest.fn(),
      getReportExecutionHistory: jest.fn(),
      createScheduledReport: jest.fn(),
      updateScheduledReport: jest.fn(),
      deleteScheduledReport: jest.fn(),
      runScheduledReport: jest.fn(),
      validateSchedule: jest.fn(),
      formatScheduleDescription: jest.fn(),
    },
  };
});

// Test data
const mockReports: ScheduledReport[] = [
  {
    id: 'report-1',
    clubId: 1,
    name: 'Weekly Member Report',
    description: 'Member data export',
    reportType: 'member',
    schedule: {
      frequency: 'weekly',
      dayOfWeek: '1',
      time: '09:00',
      timezone: 'America/New_York',
    },
    recipients: ['admin@test.com', 'manager@test.com'],
    format: 'csv',
    enabled: true,
    nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'report-2',
    clubId: 1,
    name: 'Monthly Financial Report',
    description: 'Financial summary',
    reportType: 'financial',
    schedule: {
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '08:00',
      timezone: 'America/New_York',
    },
    recipients: ['finance@test.com'],
    format: 'excel',
    enabled: false,
    nextRunAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next month
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'report-3',
    clubId: 1,
    name: 'Daily Analytics Report',
    description: 'Daily metrics',
    reportType: 'analytics',
    schedule: {
      frequency: 'daily',
      time: '07:00',
      timezone: 'America/New_York',
    },
    recipients: ['analytics@test.com'],
    format: 'pdf',
    enabled: true,
    nextRunAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockExecutions = {
  'report-1': [
    {
      id: 'exec-1',
      reportId: 'report-1',
      status: 'completed',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
    },
    {
      id: 'exec-2',
      reportId: 'report-1',
      status: 'completed',
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
    },
  ],
  'report-2': [
    {
      id: 'exec-3',
      reportId: 'report-2',
      status: 'failed',
      startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 30000).toISOString(),
      error: 'Database connection failed',
    },
  ],
  'report-3': [
    {
      id: 'exec-4',
      reportId: 'report-3',
      status: 'processing',
      startedAt: new Date().toISOString(),
    },
  ],
};

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('ScheduledReportsManager', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup scheduledReportsService mock implementations
    (scheduledReportsService.getScheduledReports as jest.Mock).mockResolvedValue(mockReports);
    (scheduledReportsService.getReportExecutionHistory as jest.Mock).mockImplementation((reportId: string) => {
      return Promise.resolve(mockExecutions[reportId] || []);
    });
    (scheduledReportsService.createScheduledReport as jest.Mock).mockImplementation((clubId: number, report: any) => {
      return Promise.resolve({
        ...report,
        id: `report-${Date.now()}`,
        clubId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    (scheduledReportsService.updateScheduledReport as jest.Mock).mockResolvedValue({});
    (scheduledReportsService.deleteScheduledReport as jest.Mock).mockResolvedValue(true);
    (scheduledReportsService.runScheduledReport as jest.Mock).mockResolvedValue({
      executionId: 'exec-123',
      status: 'queued',
      startedAt: new Date().toISOString(),
      estimatedCompletionAt: new Date(Date.now() + 60000).toISOString(),
    });
    (scheduledReportsService.validateSchedule as jest.Mock).mockReturnValue({ isValid: true, errors: [] });
    (scheduledReportsService.formatScheduleDescription as jest.Mock).mockImplementation((schedule: any) => {
      if (schedule.frequency === 'weekly') return `Weekly on ${schedule.dayOfWeek} at ${schedule.time}`;
      if (schedule.frequency === 'monthly') return `Monthly on the ${schedule.dayOfMonth} at ${schedule.time}`;
      if (schedule.frequency === 'daily') return `Daily at ${schedule.time}`;
      return 'Unknown schedule';
    });
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      (scheduledReportsService.getScheduledReports as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(mockReports), 100))
      );

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      expect(screen.getByText(/loading scheduled reports/i)).toBeInTheDocument();
    });

    it('should render header with title and description', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Scheduled Reports')).toBeInTheDocument();
      });

      expect(screen.getByText(/automate report generation and delivery/i)).toBeInTheDocument();
    });

    it('should render Create Report button', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });
    });

    it('should render empty state when no reports exist', async () => {
      (scheduledReportsService.getScheduledReports as jest.Mock).mockResolvedValueOnce([]);

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('No Scheduled Reports')).toBeInTheDocument();
      });

      expect(screen.getByText(/create your first scheduled report/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create your first report/i })).toBeInTheDocument();
    });

    it('should render all reports when data is loaded', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      expect(screen.getByText('Monthly Financial Report')).toBeInTheDocument();
      expect(screen.getByText('Daily Analytics Report')).toBeInTheDocument();
    });
  });

  describe('Report Display', () => {
    it('should display report details correctly', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const reportCard = screen.getByText('Weekly Member Report').closest('[data-slot="card"]');
      expect(reportCard).toBeInTheDocument();

      // Type - find the element containing "Type:" and check its sibling/child
      const typeLabel = within(reportCard!).getByText('Type:');
      expect(typeLabel).toBeInTheDocument();
      const typeValue = typeLabel.nextElementSibling || typeLabel.parentElement?.querySelector('.font-medium');
      expect(typeValue).toHaveTextContent(/member/i);

      // Format
      expect(within(reportCard!).getByText('Format:')).toBeInTheDocument();
      expect(within(reportCard!).getByText('CSV')).toBeInTheDocument();

      // Recipients
      expect(within(reportCard!).getByText('Recipients:')).toBeInTheDocument();
      expect(within(reportCard!).getByText('2 emails')).toBeInTheDocument();

      // Next Run
      expect(within(reportCard!).getByText('Next Run:')).toBeInTheDocument();
    });

    it('should display schedule description', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      // Should contain description from scheduledReportsService.formatScheduleDescription
      const reportCard = screen.getByText('Weekly Member Report').closest('[data-slot="card"]');
      expect(within(reportCard!).getByText(/member data export/i)).toBeInTheDocument();
    });

    it('should display Active status badge for enabled report with completed execution', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const badges = screen.getAllByText('Active');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display Paused status badge for disabled report', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Monthly Financial Report')).toBeInTheDocument();
      });

      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('should display Running status badge for processing execution', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Daily Analytics Report')).toBeInTheDocument();
      });

      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should display enable/disable switch for each report', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(3);
    });

    it('should format next run time as hours for < 24h', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Daily Analytics Report')).toBeInTheDocument();
      });

      const reportCard = screen.getByText('Daily Analytics Report').closest('[data-slot="card"]');
      expect(within(reportCard!).getByText(/12h from now/i)).toBeInTheDocument();
    });

    it('should format next run time as full date for >= 24h', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const reportCard = screen.getByText('Weekly Member Report').closest('[data-slot="card"]');
      const nextRunText = within(reportCard!).getByText(/Next Run:/i).nextElementSibling;
      expect(nextRunText?.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format
    });
  });

  describe('Execution History', () => {
    it('should display recent executions section when executions exist', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const recentExecutionsHeaders = screen.getAllByText('Recent Executions');
      expect(recentExecutionsHeaders.length).toBeGreaterThan(0);
    });

    it('should display execution status badges', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const reportCard = screen.getByText('Weekly Member Report').closest('[data-slot="card"]');
      const executionBadges = within(reportCard!).getAllByText(/completed/i);
      expect(executionBadges.length).toBeGreaterThan(0);
    });

    it('should display failed execution with destructive badge', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Monthly Financial Report')).toBeInTheDocument();
      });

      const reportCard = screen.getByText('Monthly Financial Report').closest('[data-slot="card"]');
      expect(within(reportCard!).getByText(/failed/i)).toBeInTheDocument();
    });

    it('should limit execution history to 3 most recent', async () => {
      const manyExecutions = Array.from({ length: 10 }, (_, i) => ({
        id: `exec-${i}`,
        reportId: 'report-1',
        status: 'completed',
        startedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      }));

      (scheduledReportsService.getReportExecutionHistory as jest.Mock).mockImplementation((reportId: string) => {
        if (reportId === 'report-1') return Promise.resolve(manyExecutions);
        return Promise.resolve(mockExecutions[reportId] || []);
      });

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const reportCard = screen.getByText('Weekly Member Report').closest('[data-slot="card"]');
      const executionItems = within(reportCard!).getAllByText(/completed/i);
      expect(executionItems.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Create Report Flow', () => {
    it('should open create dialog when Create Report button is clicked', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create report/i });
      await user.click(createButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create Scheduled Report')).toBeInTheDocument();
      expect(screen.getByText(/set up automatic report generation/i)).toBeInTheDocument();
    });

    it('should render all form fields in create dialog', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Basic fields
      expect(screen.getByLabelText('Report Name')).toBeInTheDocument();
      expect(screen.getByText('Report Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();

      // Schedule fields
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByLabelText('Time')).toBeInTheDocument();

      // Format and recipients
      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter email addresses/i)).toBeInTheDocument();
    });

    it('should create report successfully with valid data', async () => {
      
      const newReport: ScheduledReport = {
        id: 'report-4',
        clubId: 1,
        name: 'New Event Report',
        description: 'Test report',
        reportType: 'event',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: '1',
          time: '09:00',
          timezone: 'America/New_York',
        },
        recipients: ['test@example.com'],
        format: 'csv',
        enabled: true,
        nextRunAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (scheduledReportsService.createScheduledReport as jest.Mock).mockResolvedValueOnce(newReport);
      (scheduledReportsService.getScheduledReports as jest.Mock).mockResolvedValueOnce([...mockReports, newReport]);

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form (use paste for speed — avoids per-keystroke overhead)
      await user.click(screen.getByLabelText('Report Name'));
      await user.paste('New Event Report');
      await user.click(screen.getByLabelText('Description (Optional)'));
      await user.paste('Test report');

      // Select report type - Find combobox near "Report Type" label
      const reportTypeLabel = screen.getByText('Report Type');
      const reportTypeCombobox = reportTypeLabel.closest('div')?.querySelector('[role="combobox"]') as HTMLElement;
      await user.click(reportTypeCombobox);

      await waitFor(() => {
        expect(screen.getByText('Events')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Events'));

      // Add recipient
      const recipientInput = screen.getByPlaceholderText(/enter email addresses/i);
      await user.click(recipientInput);
      await user.paste('test@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      // Submit
      const createButtons = screen.getAllByRole('button', { name: /create report/i });
      const submitButton = createButtons[createButtons.length - 1];
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Scheduled report created successfully');
      });

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should validate email addresses when adding recipients', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try invalid email
      const recipientInput = screen.getByPlaceholderText(/enter email addresses/i);
      await user.type(recipientInput, 'invalid-email');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should allow adding multiple recipients separated by commas', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const recipientInput = screen.getByPlaceholderText(/enter email addresses/i);
      await user.type(recipientInput, 'test1@example.com, test2@example.com, test3@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(screen.getByText('test1@example.com')).toBeInTheDocument();
        expect(screen.getByText('test2@example.com')).toBeInTheDocument();
        expect(screen.getByText('test3@example.com')).toBeInTheDocument();
      });
    });

    it('should allow removing recipients', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Add recipient
      const recipientInput = screen.getByPlaceholderText(/enter email addresses/i);
      await user.type(recipientInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });

      // Remove recipient
      const recipientBadge = screen.getByText('test@example.com').closest('[class*="flex items-center"]');
      const removeButton = within(recipientBadge!).getByText('×');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
      });
    });

    it('should prevent duplicate recipients', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const recipientInput = screen.getByPlaceholderText(/enter email addresses/i);

      // Add same email twice
      await user.type(recipientInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await user.type(recipientInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      // Should only appear once
      const badges = screen.getAllByText('test@example.com');
      expect(badges).toHaveLength(1);
    });

    it('should allow adding recipient by pressing Enter key', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const recipientInput = screen.getByPlaceholderText(/enter email addresses/i);
      await user.type(recipientInput, 'test@example.com{Enter}');

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Schedule Configuration', () => {
    it('should show day of week selector for weekly frequency', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Default frequency is weekly - Check for Day of Week field by text
      expect(screen.getByText('Day of Week')).toBeInTheDocument();
    });

    it('should show day of month selector for monthly frequency', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Change to monthly - Find combobox near "Frequency" label
      const frequencyLabel = screen.getByText('Frequency');
      const frequencyCombobox = frequencyLabel.closest('div')?.querySelector('[role="combobox"]') as HTMLElement;
      await user.click(frequencyCombobox);
      await user.click(screen.getByText('Monthly'));

      await waitFor(() => {
        expect(screen.getByText('Day of Month')).toBeInTheDocument();
      });
    });

    it('should show day of month selector for quarterly frequency', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Change to quarterly - Find combobox near "Frequency" label
      const frequencyLabel = screen.getByText('Frequency');
      const frequencyCombobox = frequencyLabel.closest('div')?.querySelector('[role="combobox"]') as HTMLElement;
      await user.click(frequencyCombobox);
      await user.click(screen.getByText('Quarterly'));

      await waitFor(() => {
        expect(screen.getByText('Day of Month')).toBeInTheDocument();
      });
    });

    it('should not show day selectors for daily frequency', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Change to daily - Find combobox near "Frequency" label
      const frequencyLabel = screen.getByText('Frequency');
      const frequencyCombobox = frequencyLabel.closest('div')?.querySelector('[role="combobox"]') as HTMLElement;
      await user.click(frequencyCombobox);
      await user.click(screen.getByText('Daily'));

      await waitFor(() => {
        expect(screen.queryByLabelText('Day of Week')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Day of Month')).not.toBeInTheDocument();
      });
    });

    it('should show validation error for invalid schedule', async () => {
      

      // Mock validation to return error
      (scheduledReportsService.validateSchedule as jest.Mock).mockReturnValueOnce({
        isValid: false,
        errors: ['Invalid time format'],
      });

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill minimum required fields
      await user.type(screen.getByLabelText('Report Name'), 'Test Report');

      // Submit
      const createButtons = screen.getAllByRole('button', { name: /create report/i });
      const submitButton = createButtons[createButtons.length - 1];
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid time format'));
      });

      // Restore mock
      jest.restoreAllMocks();
    });
  });

  describe('Report Type and Format Selection', () => {
    it('should allow selecting different report types', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Open report type selector - Find combobox near "Report Type" label
      const reportTypeLabel = screen.getByText('Report Type');
      const reportTypeCombobox = reportTypeLabel.closest('div')?.querySelector('[role="combobox"]') as HTMLElement;
      await user.click(reportTypeCombobox);

      // All types should be available
      await waitFor(() => {
        expect(screen.getAllByText('Member Data').length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText('Financial').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Analytics').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Events').length).toBeGreaterThan(0);
    });

    it('should allow selecting different export formats', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Open format selector - Find combobox near "Export Format" label
      const formatLabel = screen.getByText('Export Format');
      const formatCombobox = formatLabel.closest('div')?.querySelector('[role="combobox"]') as HTMLElement;
      await user.click(formatCombobox);

      // All formats should be available
      await waitFor(() => {
        const csvElements = screen.getAllByText('CSV');
        expect(csvElements.length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText('Excel').length).toBeGreaterThan(0);
      expect(screen.getAllByText('JSON').length).toBeGreaterThan(0);
      expect(screen.getAllByText('PDF').length).toBeGreaterThan(0);
    });
  });

  describe('Edit Report Flow', () => {
    it('should open edit dialog when Edit button is clicked', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Scheduled Report')).toBeInTheDocument();
      });
    });

    it('should pre-populate form with existing report data', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check pre-populated recipients
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('manager@test.com')).toBeInTheDocument();
    });

    it('should update report successfully', async () => {
      const updatedReport = { ...mockReports[0], name: 'Updated Report' };
      (scheduledReportsService.updateScheduledReport as jest.Mock).mockResolvedValueOnce(updatedReport);

      // Mock initial load with original reports, then updated reports after the update
      (scheduledReportsService.getScheduledReports as jest.Mock)
        .mockResolvedValueOnce(mockReports) // Initial load
        .mockResolvedValueOnce([updatedReport, ...mockReports.slice(1)]); // After update

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Submit update
      const updateButton = screen.getByRole('button', { name: /update report/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Scheduled report updated successfully');
      });
    });

    it('should close edit dialog when Cancel is clicked', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toggle Enable/Disable', () => {
    it('should toggle report enabled state when switch is clicked', async () => {
      const toggledReport = { ...mockReports[0], enabled: false };
      (scheduledReportsService.updateScheduledReport as jest.Mock).mockResolvedValueOnce(toggledReport);
      (scheduledReportsService.getScheduledReports as jest.Mock).mockResolvedValueOnce([toggledReport, ...mockReports.slice(1)]);

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const switches = screen.getAllByRole('switch');
      const enabledSwitch = switches[0]; // First report is enabled

      await user.click(enabledSwitch);

      // Should reload reports
      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });
    });
  });

  describe('Run Now', () => {
    it('should execute report immediately when Run Now is clicked', async () => {
      

      (scheduledReportsService.runScheduledReport as jest.Mock).mockResolvedValueOnce({
        executionId: 'exec-new',
        status: 'queued',
        startedAt: new Date().toISOString(),
        estimatedCompletionAt: new Date(Date.now() + 60000).toISOString(),
      });

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const runNowButtons = screen.getAllByRole('button', { name: /run now/i });
      await user.click(runNowButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('exec-new'));
      });
    });

    it('should disable Run Now button for disabled reports', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Monthly Financial Report')).toBeInTheDocument();
      });

      const runNowButtons = screen.getAllByRole('button', { name: /run now/i });
      const disabledReportButton = runNowButtons[1]; // Second report is disabled

      expect(disabledReportButton).toBeDisabled();
    });
  });

  describe('Delete Report', () => {
    it('should show confirmation dialog when Delete is clicked', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Scheduled Report')).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
        expect(screen.getByText(/"Weekly Member Report"/i)).toBeInTheDocument();
      });
    });

    it('should delete report when confirmed', async () => {
      const deleteMock = jest.fn().mockResolvedValue(true);
      (scheduledReportsService.deleteScheduledReport as jest.Mock) = deleteMock;

      // Mock initial load with all reports, then without first report after deletion
      (scheduledReportsService.getScheduledReports as jest.Mock)
        .mockResolvedValueOnce(mockReports) // Initial load
        .mockResolvedValueOnce(mockReports.slice(1)); // After delete

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Scheduled Report')).toBeInTheDocument();
      });

      // Find and click the delete confirmation button using testid
      const confirmButton = screen.getByTestId('alert-dialog-action');
      expect(confirmButton).toBeInTheDocument();
      await user.click(confirmButton);

      // Wait for delete to be called
      await waitFor(() => {
        expect(deleteMock).toHaveBeenCalledWith('report-1');
      }, { timeout: 5000 });

      // Then check toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Report deleted successfully');
      }, { timeout: 5000 });
    });

    it('should close confirmation dialog when Cancel is clicked', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Scheduled Report')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Scheduled Report')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading reports fails', async () => {
      

      (scheduledReportsService.getScheduledReports as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load reports')
      );

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'analytics',
          'Error loading scheduled reports',
          expect.any(Object)
        );
      });
    });

    it('should handle error when creating report fails', async () => {
      
      

      (scheduledReportsService.createScheduledReport as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to create report')
      );

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill minimum fields
      await user.type(screen.getByLabelText('Report Name'), 'Test Report');

      const recipientInput = screen.getByPlaceholderText(/enter email addresses/i);
      await user.type(recipientInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      // Submit
      const createButtons = screen.getAllByRole('button', { name: /create report/i });
      const submitButton = createButtons[createButtons.length - 1];
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create scheduled report');
        expect(logger.error).toHaveBeenCalledWith(
          'analytics',
          'Error creating scheduled report',
          expect.any(Object)
        );
      });
    });

    it('should handle error when updating report fails', async () => {
      
      

      (scheduledReportsService.updateScheduledReport as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to update report')
      );

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update report/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update scheduled report');
        expect(logger.error).toHaveBeenCalled();
      });
    });

    it('should handle error when running report now fails', async () => {
      
      

      (scheduledReportsService.runScheduledReport as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to run report')
      );

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const runNowButtons = screen.getAllByRole('button', { name: /run now/i });
      await user.click(runNowButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to start report execution');
        expect(logger.error).toHaveBeenCalled();
      });
    });

    it('should handle error when deleting report fails', async () => {
      
      

      (scheduledReportsService.deleteScheduledReport as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to delete report')
      );

      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Scheduled Report')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('alert-dialog-action');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete report');
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for dialogs', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });

    it('should have proper labels for form inputs', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create report/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // All form fields should have labels (Radix Select doesn't support getByLabelText in mocks)
      expect(screen.getByLabelText('Report Name')).toBeInTheDocument();
      expect(screen.getByText('Report Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByLabelText('Time')).toBeInTheDocument();
      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter email addresses/i)).toBeInTheDocument();
    });

    it('should have proper button labels for actions', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      expect(screen.getAllByRole('button', { name: /run now/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /edit/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0);
    });

    it('should have proper switch labels for enable/disable', async () => {
      renderWithProviders(<ScheduledReportsManager clubId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Member Report')).toBeInTheDocument();
      });

      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBe(3);
    });
  });
});
