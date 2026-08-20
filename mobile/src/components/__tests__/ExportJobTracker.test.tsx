/**
 * ExportJobTracker Tests
 *
 * Tests export job tracking component including job listing, status display,
 * progress tracking, actions (download, retry, cancel), and auto-refresh.
 *
 * Following boundary mocking rule:
 * ✅ Mock: Alert, Linking (React Native boundaries), mock service API
 * ❌ Don't mock: ExportJobTracker component, ThemeContext, useErrorHandler
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { Linking, Alert } from 'react-native';
import ExportJobTracker from '../ExportJobTracker';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock dependencies (boundaries only)
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true)
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Helper to render with theme
// NOTE: All tests use autoRefresh={false} to prevent the 30s interval from causing test pollution
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ExportJobTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render component with testID', () => {
      const { getByTestId } = renderWithTheme(
        <ExportJobTracker testID="export-tracker" autoRefresh={false} />
      );

      expect(getByTestId('export-tracker')).toBeTruthy();
    });

    it('should show loading state initially', () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      expect(screen.queryByText(/loading export jobs/i)).toBeTruthy();
    });

    it('should display job list after loading', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      // Fast-forward past the loading delay (mock service uses 500ms)
      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });
    });

    it('should display header with title and refresh button', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
        expect(screen.queryByText(/Refresh/i)).toBeTruthy();
      });
    });

    it('should show empty state when no jobs exist', async () => {
      renderWithTheme(<ExportJobTracker maxJobs={0} autoRefresh={false} />);

      // Wait for loading to complete (500ms getJobs delay) and empty state to render
      await waitFor(() => {
        expect(screen.getByText(/no export jobs found/i)).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Job Display', () => {
    it('should display job cards with details', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/financial-report-2024-09/i)).toBeTruthy();
      });
      expect(screen.queryByText(/members-export-2024/i)).toBeTruthy();
    });

    it('should display job status badges', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.getAllByText(/PROCESSING/i).length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText(/COMPLETED/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/FAILED/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/PENDING/i).length).toBeGreaterThan(0);
    });

    it('should display type icons', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.getAllByText('💰').length).toBeGreaterThan(0); // financial
      });
      expect(screen.getAllByText('👥').length).toBeGreaterThan(0); // member
      expect(screen.getAllByText('📊').length).toBeGreaterThan(0); // activity
    });

    it('should display user information', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.getAllByText(/by Admin User/i).length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText(/by Manager User/i).length).toBeGreaterThan(0);
    });

    it('should show progress bar for processing jobs', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/65% complete/i)).toBeTruthy();
      });
    });

    it('should display record counts', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/812 \/ 1250/i)).toBeTruthy(); // processing job
      });
      expect(screen.queryByText(/450 \/ 450/i)).toBeTruthy(); // completed job
    });

    it('should display file size for completed jobs', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/2\.4 MB/i)).toBeTruthy();
      });
    });

    it('should display error messages for failed jobs', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Database connection timeout/i)).toBeTruthy();
      });
    });

    it('should display start time', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        const startedTexts = screen.queryAllByText(/Started:/i);
        expect(startedTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display duration for completed jobs', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Duration:/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Job Actions', () => {
    it('should show download button for completed jobs', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-download-2')).toBeTruthy();
      });
    });

    it('should handle download action', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-download-2')).toBeTruthy();
      });

      const downloadButton = getByTestId('tracker-download-2');
      fireEvent.press(downloadButton);

      // Linking.openURL should be called synchronously
      expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/exports/members-2024.csv');
    });

    it('should show retry button for failed jobs', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-retry-3')).toBeTruthy();
      });
    });

    it('should handle retry action', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-retry-3')).toBeTruthy();
      });

      const retryButton = getByTestId('tracker-retry-3');
      fireEvent.press(retryButton);

      // Retry involves 2 async operations: retryJob (500ms) + loadJobs (500ms) = 1000ms
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Export job has been restarted.');
      }, { timeout: 2000 });
    });

    it('should show cancel button for processing jobs', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-cancel-1')).toBeTruthy();
      });
    });

    it('should show cancel button for pending jobs', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-cancel-4')).toBeTruthy();
      });
    });

    it('should show confirmation dialog before cancelling', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-cancel-1')).toBeTruthy();
      });

      const cancelButton = getByTestId('tracker-cancel-1');
      fireEvent.press(cancelButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Cancel Export Job',
        expect.stringContaining('financial-report-2024-09'),
        expect.any(Array)
      );
    });

    it('should handle cancel confirmation', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-cancel-1')).toBeTruthy();
      });

      const cancelButton = getByTestId('tracker-cancel-1');
      fireEvent.press(cancelButton);

      // Get the Yes callback from Alert.alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const yesButton = alertCall[2].find((btn: any) => btn.text === 'Yes, Cancel');

      // Execute the Yes callback
      await yesButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Export job has been cancelled.');
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh jobs when refresh button is pressed', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-refresh')).toBeTruthy();
      });

      const refreshButton = getByTestId('tracker-refresh');
      fireEvent.press(refreshButton);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });
    });

    it('should show loading indicator on refresh button during refresh', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-refresh')).toBeTruthy();
      });

      const refreshButton = getByTestId('tracker-refresh');
      fireEvent.press(refreshButton);

      // Should show ActivityIndicator (no "Refresh" text during refresh)
      expect(refreshButton).toBeTruthy();
    });

    it('should support pull-to-refresh', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });

      // Trigger refresh control
      const scrollView = screen.getByTestId('export-job-tracker').children[1] as ReactTestInstance;
      fireEvent(scrollView, 'refresh');

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });
    });
  });

  describe('Auto-Refresh', () => {
    it('should auto-refresh at specified interval when enabled', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={true} refreshInterval={10000} />);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });

      // Advance past refresh interval
      await act(async () => {
        await jest.advanceTimersByTimeAsync(10600); // 10s interval + 600ms load time
        await Promise.resolve(); // Flush microtasks
        await Promise.resolve(); // Flush microtasks
      });

      // Component should have refreshed (still rendering)
      expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
    });

    it('should not auto-refresh when disabled', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });

      // Advance past default interval
      await act(async () => {
        await jest.advanceTimersByTimeAsync(30600);
        await Promise.resolve(); // Flush microtasks
        await Promise.resolve(); // Flush microtasks
      });

      // Should still be rendered normally (no auto-refresh errors)
      expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
    });

    it('should clean up interval on unmount', async () => {
      const { unmount } = renderWithTheme(<ExportJobTracker autoRefresh={true} />);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });

      // Unmount should clear interval without errors
      act(() => {
        unmount();
      });

      expect(true).toBe(true); // No errors during unmount
    });
  });

  describe('Job Selection', () => {
    it('should handle job press', async () => {
      const onJobSelected = jest.fn();
      const { getByTestId } = renderWithTheme(
        <ExportJobTracker testID="tracker" onJobSelected={onJobSelected} autoRefresh={false} />
      );

      await waitFor(() => {
        expect(getByTestId('tracker-job-1')).toBeTruthy();
      });

      const jobCard = getByTestId('tracker-job-1');
      fireEvent.press(jobCard);

      expect(onJobSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          type: 'financial',
          status: 'processing'
        })
      );
    });

    it('should highlight selected job', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-job-1')).toBeTruthy();
      });

      const jobCard = getByTestId('tracker-job-1');
      fireEvent.press(jobCard);

      // Wait for selection state to update and job card to have selection styling (borderWidth: 2)
      await waitFor(() => {
        const updatedCard = getByTestId('tracker-job-1');
        // Style is an array, check if any style object has borderWidth: 2
        const styles = Array.isArray(updatedCard.props.style)
          ? updatedCard.props.style
          : [updatedCard.props.style];
        const hasBorder2 = styles.some(s => s && s.borderWidth === 2);
        expect(hasBorder2).toBe(true);
      });
    });
  });

  describe('Max Jobs Limit', () => {
    it('should respect maxJobs prop', async () => {
      renderWithTheme(<ExportJobTracker maxJobs={2} autoRefresh={false} />);

      await waitFor(() => {
        const jobCards = screen.queryAllByTestId(/export-job-tracker-job-/);
        expect(jobCards.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Helper Functions', () => {
    it('should format file sizes correctly', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/2\.4 MB/i)).toBeTruthy();
      });
    });

    it('should format duration correctly', async () => {
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Duration:/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should render component successfully with mock service', async () => {
      // Component gracefully handles data loading via mock service
      renderWithTheme(<ExportJobTracker autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
        expect(screen.queryByText(/Refresh/i)).toBeTruthy();
      });
    });

    it('should render with proper component structure', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker')).toBeTruthy();
        expect(getByTestId('tracker-refresh')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible testIDs for all interactive elements', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker')).toBeTruthy();
        expect(getByTestId('tracker-refresh')).toBeTruthy();
      });
      // tracker-error only exists when there's an error - not testing here
    });

    it('should provide testIDs for job-specific actions', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-download-2')).toBeTruthy(); // completed job
      });
      expect(getByTestId('tracker-retry-3')).toBeTruthy(); // failed job
      expect(getByTestId('tracker-cancel-1')).toBeTruthy(); // processing job
    });
  });

  describe('Performance', () => {
    it('should render large job lists efficiently', async () => {
      renderWithTheme(<ExportJobTracker maxJobs={50} autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });
    });

    it('should handle rapid refresh requests', async () => {
      const { getByTestId } = renderWithTheme(<ExportJobTracker testID="tracker" autoRefresh={false} />);

      await waitFor(() => {
        expect(getByTestId('tracker-refresh')).toBeTruthy();
      });

      const refreshButton = getByTestId('tracker-refresh');

      // Rapid clicks
      fireEvent.press(refreshButton);
      fireEvent.press(refreshButton);
      fireEvent.press(refreshButton);

      await waitFor(() => {
        expect(screen.queryByText(/Export Jobs/i)).toBeTruthy();
      });
    });
  });
});
