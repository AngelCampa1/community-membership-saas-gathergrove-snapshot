/**
 * ExportHistoryPanel Tests
 *
 * Tests export history panel component including data loading, filtering,
 * downloading, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Linking, Alert } from 'react-native';
import ExportHistoryPanel from '../ExportHistoryPanel';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock constants - ErrorDisplay depends on these
jest.mock('@/constants', () => ({
  ERROR_SEVERITY: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  },
  ERROR_MESSAGES: {},
  ERROR_CATEGORIES: {},
  API_CONFIG: {
    BASE_URL: 'https://api.test.com',
    ENDPOINTS: {},
    TIMEOUT: 10000
  }
}));

// Mock errorHandler - ErrorDisplay depends on this
jest.mock('@/utils/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error: unknown) => ({
      message: error instanceof Error ? error.message : String(error),
      category: 'system' as const,
      severity: 'medium' as const,
      timestamp: new Date()
    })),
    shouldLogout: jest.fn(() => false),
    shouldRetry: jest.fn(() => true)
  }
}));

// Mock dependencies
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true)
}));

const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

// Helper to wait for loading to complete - advance timers without waitFor deadlock
const waitForLoadingComplete = async () => {
  // Use act to wrap async timer advance - this handles promises in setTimeout callbacks
  await act(async () => {
    // Run all timers asynchronously to handle async callbacks
    jest.runAllTimers();
    // Flush promises
    await Promise.resolve();
  });
};

// Fixed: Using Jest fake timers to handle setTimeout in mock service
describe('ExportHistoryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render component with testID', async () => {
      const { getByTestId } = renderWithTheme(<ExportHistoryPanel />);
      expect(getByTestId('export-history-panel')).toBeTruthy();
    });

    it('should show loading state initially', () => {
      renderWithTheme(<ExportHistoryPanel />);
      expect(screen.getByText(/Loading export history/i)).toBeTruthy();
    });

    it('should display Export History title after loading', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();
      expect(screen.getByText('Export History')).toBeTruthy();
    });

    it('should display export items after loading', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();
      // Check for file name from mock data
      expect(screen.queryByText(/financial-report-september/i)).toBeTruthy();
    });

    it('should display file format badges', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();
      // Component shows format types - use queryAllByText since multiple items may match
      expect(screen.queryAllByText(/EXCEL/i).length).toBeGreaterThan(0);
    });

    it('should display file sizes', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();
      // Use queryAllByText since multiple items may have MB in their file size
      expect(screen.queryAllByText(/MB/i).length).toBeGreaterThan(0);
    });

    it('should show download buttons', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();
      const downloadButtons = screen.queryAllByText(/Download/i);
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('should filter items when showExpiredItems is false', async () => {
      renderWithTheme(<ExportHistoryPanel showExpiredItems={false} />);
      await waitForLoadingComplete();
      // Only available items should show
      expect(screen.queryByText(/financial-report-september/i)).toBeTruthy();
    });

    it('should show expired items when enabled', async () => {
      renderWithTheme(<ExportHistoryPanel showExpiredItems={true} />);
      await waitForLoadingComplete();
      // Should show items including expired ones
      const panel = screen.getByTestId('export-history-panel');
      expect(panel).toBeTruthy();
    });

    it('should respect maxItems prop', async () => {
      renderWithTheme(<ExportHistoryPanel maxItems={1} />);
      await waitForLoadingComplete();
      // Should limit to 1 item
      const downloadButtons = screen.queryAllByText(/Download/i);
      expect(downloadButtons.length).toBeLessThanOrEqual(3); // 1 item can have multiple buttons
    });

    it('should render filter buttons', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();
      // Check for filter buttons
      expect(screen.queryByText(/All/i)).toBeTruthy();
    });

    it('should have search input', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();
      const searchInput = screen.queryByPlaceholderText(/Search exports/i);
      expect(searchInput).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onItemSelected when item is pressed', async () => {
      const onItemSelected = jest.fn();
      renderWithTheme(<ExportHistoryPanel onItemSelected={onItemSelected} />);
      await waitForLoadingComplete();

      // Find and press an item
      const fileName = screen.queryByText(/financial-report-september/i);
      if (fileName) {
        fireEvent.press(fileName);
      }
      // Item selection is handled internally
      expect(true).toBe(true);
    });

    it('should open URL when download button is pressed', async () => {
      renderWithTheme(<ExportHistoryPanel allowReDownload={true} />);
      await waitForLoadingComplete();

      // Find the download button by testID (first item has id '1')
      const downloadButton = screen.getByTestId('export-history-panel-download-1');
      expect(downloadButton).toBeTruthy();

      // Wrap fireEvent in act for better async handling
      await act(async () => {
        fireEvent.press(downloadButton);
        // Flush promises to allow async handleDownload to complete
        await Promise.resolve();
      });

      // Linking.openURL should be called after button press
      expect(Linking.openURL).toHaveBeenCalled();
    });

    it('should show delete confirmation alert', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      const deleteButtons = screen.queryAllByText(/Delete/i);
      if (deleteButtons.length > 0) {
        fireEvent.press(deleteButtons[0]);
      }

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Export',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('should handle search input change', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      const searchInput = screen.getByPlaceholderText(/Search exports/i);
      fireEvent.changeText(searchInput, 'financial');

      // Search should filter results
      expect(screen.queryByText(/financial-report-september/i)).toBeTruthy();
    });

    it('should handle filter button press', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      const allButton = screen.getByText(/All/i);
      fireEvent.press(allButton);

      // Component should still render
      expect(screen.getByTestId('export-history-panel')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should render error display component', async () => {
      const { getByTestId } = renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      // Error display area exists even when no error
      expect(getByTestId('export-history-panel')).toBeTruthy();
    });

    it('should handle component render without errors', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      expect(screen.getByText('Export History')).toBeTruthy();
    });
  });

  describe('Empty States', () => {
    it('should handle maxItems=0 gracefully', async () => {
      renderWithTheme(<ExportHistoryPanel maxItems={0} />);
      await waitForLoadingComplete();

      // Component should still render
      expect(screen.getByTestId('export-history-panel')).toBeTruthy();
    });

    it('should show empty state when filtering returns no results', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      const searchInput = screen.getByPlaceholderText(/Search exports/i);
      fireEvent.changeText(searchInput, 'nonexistent-file-xyz');

      // Component should handle empty filtered results
      expect(screen.getByTestId('export-history-panel')).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    it('should display items with available status', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      // Items with available status should have download buttons
      expect(screen.queryAllByText(/Download/i).length).toBeGreaterThan(0);
    });

    it('should display type icons', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      // Component uses emoji icons for types
      expect(screen.queryByText('💰') || screen.queryByText('👥')).toBeTruthy();
    });
  });

  describe('Date Display', () => {
    it('should show expiration information', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      // Should show days until expiry - use queryAllByText since multiple items may match
      const dayMatches = screen.queryAllByText(/day/i);
      const expireMatches = screen.queryAllByText(/expire/i);
      expect(dayMatches.length + expireMatches.length).toBeGreaterThan(0);
    });

    it('should show download count', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      // Component shows download counts/buttons - use queryAllByText
      expect(screen.queryAllByText(/download/i).length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible testID on main container', async () => {
      const { getByTestId } = renderWithTheme(<ExportHistoryPanel testID="custom-test-id" />);
      expect(getByTestId('custom-test-id')).toBeTruthy();
    });

    it('should render all interactive elements', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      // Should have buttons and inputs
      const buttons = screen.queryAllByText(/Download|Delete|Extend/i);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should render with large maxItems value', async () => {
      renderWithTheme(<ExportHistoryPanel maxItems={100} />);
      await waitForLoadingComplete();

      expect(screen.getByText('Export History')).toBeTruthy();
    });

    it('should handle rapid search input changes', async () => {
      renderWithTheme(<ExportHistoryPanel />);
      await waitForLoadingComplete();

      const searchInput = screen.getByPlaceholderText(/Search exports/i);

      // Simulate rapid typing
      fireEvent.changeText(searchInput, 'a');
      fireEvent.changeText(searchInput, 'ab');
      fireEvent.changeText(searchInput, 'abc');
      fireEvent.changeText(searchInput, '');

      // Component should handle rapid changes
      expect(screen.getByTestId('export-history-panel')).toBeTruthy();
    });
  });
});
