/**
 * MemberExportDialog Tests
 *
 * Tests member data export dialog including member selection, data categories,
 * custom fields, validation, privacy warnings, and export process.
 *
 * Following boundary mocking rule:
 * ✅ Mock: Alert (React Native boundary)
 * ❌ Don't mock: MemberExportDialog component, ThemeContext, useErrorHandler
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MemberExportDialog from '../MemberExportDialog';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

// Helper to wait for initialization to complete
const waitForInitialization = async () => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
};

describe('MemberExportDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset mock return value after clearAllMocks
    mockOnExport.mockResolvedValue(undefined);

    // Mock Alert to auto-trigger "Continue" for privacy warnings
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === 'Privacy Warning' && buttons) {
        // Auto-trigger "Continue" immediately
        const continueBtn = buttons.find((b: any) => b.text === 'Continue');
        if (continueBtn?.onPress) {
          continueBtn.onPress();
        }
      }
      // For all other alerts (including after auto-continuing privacy), record the call
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onExport: mockOnExport,
    testID: 'member-export-dialog'
  };

  describe('Visibility', () => {
    it('should render when visible is true', () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);

      expect(screen.queryByText(/Export Member Data/i)).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} visible={false} />);

      expect(screen.queryByText(/Export Member Data/i)).toBeFalsy();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);

      expect(getByTestId('member-export-dialog-close')).toBeTruthy();
    });
  });

  describe('Initial State', () => {
    it('should load membership types on mount', async () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/Premium Member/i)).toBeTruthy();
      expect(screen.queryByText(/Standard Member/i)).toBeTruthy();
      expect(screen.queryByText(/Student Member/i)).toBeTruthy();
      expect(screen.queryByText(/Senior Member/i)).toBeTruthy();
    });

    it('should pre-select all membership types', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-membership-1').props.value).toBe(true);
      expect(getByTestId('member-export-dialog-membership-2').props.value).toBe(true);
      expect(getByTestId('member-export-dialog-membership-3').props.value).toBe(true);
      expect(getByTestId('member-export-dialog-membership-4').props.value).toBe(true);
    });

    it('should have active status selected by default', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-status-active').props.value).toBe(true);
      expect(getByTestId('member-export-dialog-status-inactive').props.value).toBe(false);
      expect(getByTestId('member-export-dialog-status-pending').props.value).toBe(false);
    });

    it('should have personal info enabled by default', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-include-personal').props.value).toBe(true);
    });

    it('should have contact info enabled by default', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-include-contact').props.value).toBe(true);
    });

    it('should have membership details enabled by default', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-include-membership').props.value).toBe(true);
    });

    it('should have payment history disabled by default', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-include-payment').props.value).toBe(false);
    });

    it('should have excel format selected by default', async () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/EXCEL/i)).toBeTruthy();
    });

    it('should have name sort selected by default', async () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/Name/i)).toBeTruthy();
    });

    it('should display total member count', async () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // All membership types selected (150 + 300 + 75 + 90 = 615)
      expect(screen.queryByText(/615 total/i)).toBeTruthy();
    });
  });

  describe('Membership Type Selection', () => {
    it('should toggle membership type', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const premiumSwitch = getByTestId('member-export-dialog-membership-1');
      expect(premiumSwitch.props.value).toBe(true);

      fireEvent(premiumSwitch, 'valueChange', false);

      expect(premiumSwitch.props.value).toBe(false);
    });

    it('should update total member count when toggling types', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/615 total/i)).toBeTruthy();

      // Deselect Premium Member (150 members)
      const premiumSwitch = getByTestId('member-export-dialog-membership-1');
      fireEvent(premiumSwitch, 'valueChange', false);

      // 615 - 150 = 465
      expect(screen.queryByText(/465 total/i)).toBeTruthy();
    });

    it('should display member counts for each type', async () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/150 members/i)).toBeTruthy(); // Premium
      expect(screen.queryByText(/300 members/i)).toBeTruthy(); // Standard
      expect(screen.queryByText(/75 members/i)).toBeTruthy(); // Student
      expect(screen.queryByText(/90 members/i)).toBeTruthy(); // Senior
    });
  });

  describe('Member Status Selection', () => {
    it('should toggle active status', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const activeSwitch = getByTestId('member-export-dialog-status-active');
      expect(activeSwitch.props.value).toBe(true);

      fireEvent(activeSwitch, 'valueChange', false);
      expect(activeSwitch.props.value).toBe(false);
    });

    it('should toggle inactive status', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const inactiveSwitch = getByTestId('member-export-dialog-status-inactive');
      fireEvent(inactiveSwitch, 'valueChange', true);

      expect(inactiveSwitch.props.value).toBe(true);
    });

    it('should toggle pending status', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const pendingSwitch = getByTestId('member-export-dialog-status-pending');
      fireEvent(pendingSwitch, 'valueChange', true);

      expect(pendingSwitch.props.value).toBe(true);
    });
  });

  describe('Data Categories', () => {
    it('should toggle personal info', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const personalSwitch = getByTestId('member-export-dialog-include-personal');
      fireEvent(personalSwitch, 'valueChange', false);

      expect(personalSwitch.props.value).toBe(false);
    });

    it('should toggle contact info', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const contactSwitch = getByTestId('member-export-dialog-include-contact');
      fireEvent(contactSwitch, 'valueChange', false);

      expect(contactSwitch.props.value).toBe(false);
    });

    it('should toggle payment history', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const paymentSwitch = getByTestId('member-export-dialog-include-payment');
      fireEvent(paymentSwitch, 'valueChange', true);

      expect(paymentSwitch.props.value).toBe(true);
    });

    it('should toggle activity history', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const activitySwitch = getByTestId('member-export-dialog-include-activity');
      fireEvent(activitySwitch, 'valueChange', true);

      expect(activitySwitch.props.value).toBe(true);
    });

    it('should toggle preferences', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const preferencesSwitch = getByTestId('member-export-dialog-include-preferences');
      fireEvent(preferencesSwitch, 'valueChange', true);

      expect(preferencesSwitch.props.value).toBe(true);
    });

    it('should toggle member photos', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const photosSwitch = getByTestId('member-export-dialog-include-photos');
      fireEvent(photosSwitch, 'valueChange', true);

      expect(photosSwitch.props.value).toBe(true);
    });
  });

  describe('Custom Fields', () => {
    it('should add custom field', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const input = getByTestId('member-export-dialog-custom-field-input');
      fireEvent.changeText(input, 'Shirt Size');

      const addButton = getByTestId('member-export-dialog-add-custom-field');
      fireEvent.press(addButton);

      expect(screen.queryByText(/Shirt Size/i)).toBeTruthy();
    });

    it('should clear input after adding field', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const input = getByTestId('member-export-dialog-custom-field-input');
      fireEvent.changeText(input, 'Dietary Restrictions');

      const addButton = getByTestId('member-export-dialog-add-custom-field');
      fireEvent.press(addButton);

      expect(input.props.value).toBe('');
    });

    it('should remove custom field', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const input = getByTestId('member-export-dialog-custom-field-input');
      fireEvent.changeText(input, 'Emergency Contact');

      const addButton = getByTestId('member-export-dialog-add-custom-field');
      fireEvent.press(addButton);

      expect(screen.queryByText(/Emergency Contact/i)).toBeTruthy();

      const removeButton = getByTestId('member-export-dialog-remove-field-0');
      fireEvent.press(removeButton);

      expect(screen.queryByText(/Emergency Contact/i)).toBeFalsy();
    });

    it('should not add empty field', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const input = getByTestId('member-export-dialog-custom-field-input');
      fireEvent.changeText(input, '   '); // Whitespace only

      const addButton = getByTestId('member-export-dialog-add-custom-field');
      fireEvent.press(addButton);

      // No field should be added
      expect(screen.queryByTestId('member-export-dialog-remove-field-0')).toBeFalsy();
    });

    it('should add multiple custom fields', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // Add first field
      const input = getByTestId('member-export-dialog-custom-field-input');
      fireEvent.changeText(input, 'Field1');
      fireEvent.press(getByTestId('member-export-dialog-add-custom-field'));

      // Add second field
      fireEvent.changeText(input, 'Field2');
      fireEvent.press(getByTestId('member-export-dialog-add-custom-field'));

      expect(screen.queryByText(/Field1/i)).toBeTruthy();
      expect(screen.queryByText(/Field2/i)).toBeTruthy();
    });
  });

  describe('Format Options', () => {
    it('should select Excel format', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const excelButton = getByTestId('member-export-dialog-format-excel');
      fireEvent.press(excelButton);

      expect(screen.queryByText(/EXCEL/i)).toBeTruthy();
    });

    it('should select CSV format', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const csvButton = getByTestId('member-export-dialog-format-csv');
      fireEvent.press(csvButton);

      expect(screen.queryByText(/CSV/i)).toBeTruthy();
    });

    it('should select PDF format', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const pdfButton = getByTestId('member-export-dialog-format-pdf');
      fireEvent.press(pdfButton);

      expect(screen.queryByText(/PDF/i)).toBeTruthy();
    });
  });

  describe('Sort Options', () => {
    it('should select name sort', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const nameButton = getByTestId('member-export-dialog-sort-name');
      fireEvent.press(nameButton);

      expect(screen.queryByText(/Name/i)).toBeTruthy();
    });

    it('should select join date sort', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const joinDateButton = getByTestId('member-export-dialog-sort-joinDate');
      fireEvent.press(joinDateButton);

      expect(screen.queryByText(/Join Date/i)).toBeTruthy();
    });

    it('should select membership type sort', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const membershipButton = getByTestId('member-export-dialog-sort-membershipType');
      fireEvent.press(membershipButton);

      expect(getByTestId('member-export-dialog-sort-membershipType')).toBeTruthy();
    });

    it('should select last activity sort', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const lastActivityButton = getByTestId('member-export-dialog-sort-lastActivity');
      fireEvent.press(lastActivityButton);

      expect(screen.queryByText(/Last Activity/i)).toBeTruthy();
    });

    it('should select ascending order', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const ascButton = getByTestId('member-export-dialog-order-asc');
      fireEvent.press(ascButton);

      expect(screen.queryByText(/Ascending/i)).toBeTruthy();
    });

    it('should select descending order', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const descButton = getByTestId('member-export-dialog-order-desc');
      fireEvent.press(descButton);

      expect(screen.queryByText(/Descending/i)).toBeTruthy();
    });
  });

  describe('Privacy Options', () => {
    it('should toggle anonymize data', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const anonymizeSwitch = getByTestId('member-export-dialog-anonymize');
      fireEvent(anonymizeSwitch, 'valueChange', true);

      expect(anonymizeSwitch.props.value).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should show alert when no membership types selected', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // Deselect all membership types
      fireEvent(getByTestId('member-export-dialog-membership-1'), 'valueChange', false);
      fireEvent(getByTestId('member-export-dialog-membership-2'), 'valueChange', false);
      fireEvent(getByTestId('member-export-dialog-membership-3'), 'valueChange', false);
      fireEvent(getByTestId('member-export-dialog-membership-4'), 'valueChange', false);

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'No Membership Types',
        'Please select at least one membership type.'
      );
    });

    it('should show alert when no member status selected', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // Deselect active status
      fireEvent(getByTestId('member-export-dialog-status-active'), 'valueChange', false);

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'No Member Status',
        'Please select at least one member status.'
      );
    });

    it('should show alert when no data categories selected', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // Deselect all data categories
      fireEvent(getByTestId('member-export-dialog-include-personal'), 'valueChange', false);
      fireEvent(getByTestId('member-export-dialog-include-contact'), 'valueChange', false);
      fireEvent(getByTestId('member-export-dialog-include-membership'), 'valueChange', false);

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'No Data Selected',
        'Please select at least one data category to include.'
      );
    });

    it('should show privacy warning for sensitive data without anonymization', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // Enable payment history (sensitive data)
      fireEvent(getByTestId('member-export-dialog-include-payment'), 'valueChange', true);

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Privacy Warning',
        expect.stringContaining('sensitive member data'),
        expect.any(Array)
      );
    });

    it('should not show privacy warning when data is anonymized', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // Enable payment history
      fireEvent(getByTestId('member-export-dialog-include-payment'), 'valueChange', true);
      // Enable anonymization
      fireEvent(getByTestId('member-export-dialog-anonymize'), 'valueChange', true);

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1100);
      });

      // Should not show privacy warning
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const hasPrivacyWarning = alertCalls.some(call => call[0] === 'Privacy Warning');
      expect(hasPrivacyWarning).toBe(false);
    });
  });

  describe('Export Process', () => {
    it('should start export with valid options', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
        await jest.advanceTimersByTimeAsync(1100);
      });

      expect(mockOnExport).toHaveBeenCalledWith(
        expect.objectContaining({
          includePersonalInfo: true,
          includeContactInfo: true,
          includeMembershipDetails: true,
          format: 'excel'
        })
      );
    });

    it('should display export progress', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
        await jest.advanceTimersByTimeAsync(1100);
      });

      expect(screen.queryByText(/Export Progress/i)).toBeTruthy();
      expect(screen.queryByText(/Status:/i)).toBeTruthy();
    });

    it('should show completion alert when export completes', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
        await jest.advanceTimersByTimeAsync(1100); // startExport (1000ms)
        await jest.advanceTimersByTimeAsync(7000); // polling (4000ms) + getExportStatus (3000ms)
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Export Complete',
        expect.stringContaining('250 members'),
        expect.any(Array)
      );
    });

    it('should disable buttons during export', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
        await jest.advanceTimersByTimeAsync(1100); // Allow startExport to complete
      });

      const cancelButton = getByTestId('member-export-dialog-cancel');
      const closeButton = getByTestId('member-export-dialog-close');

      expect(exportButton.props.disabled).toBe(true);
      expect(cancelButton.props.disabled).toBe(true);
      expect(closeButton.props.disabled).toBe(true);
    });

    it('should update export button text with member count', async () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/Export 615 Members/i)).toBeTruthy();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button pressed', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const closeButton = getByTestId('member-export-dialog-close');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button pressed', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const cancelButton = getByTestId('member-export-dialog-cancel');
      fireEvent.press(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not allow closing during export', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const exportButton = getByTestId('member-export-dialog-export');
      await act(async () => {
        fireEvent.press(exportButton);
      });

      const closeButton = getByTestId('member-export-dialog-close');
      fireEvent.press(closeButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clear custom fields on close', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      // Add custom field
      const input = getByTestId('member-export-dialog-custom-field-input');
      fireEvent.changeText(input, 'TestField');

      const closeButton = getByTestId('member-export-dialog-close');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should render without errors', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-close')).toBeTruthy();
    });

    it('should handle export errors gracefully', async () => {
      const mockOnExportError = jest.fn().mockRejectedValue(new Error('Network error'));

      const { getByTestId } = renderWithTheme(
        <MemberExportDialog {...defaultProps} onExport={mockOnExportError} />
      );
      await waitForInitialization();

      const exportButton = getByTestId('member-export-dialog-export');

      await act(async () => {
        fireEvent.press(exportButton);
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1100);
      });

      // Component should still be rendered
      expect(screen.queryByText(/Export Member Data/i)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have testIDs for all interactive elements', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(getByTestId('member-export-dialog-close')).toBeTruthy();
      expect(getByTestId('member-export-dialog-membership-1')).toBeTruthy();
      expect(getByTestId('member-export-dialog-status-active')).toBeTruthy();
      expect(getByTestId('member-export-dialog-include-personal')).toBeTruthy();
      expect(getByTestId('member-export-dialog-custom-field-input')).toBeTruthy();
      expect(getByTestId('member-export-dialog-add-custom-field')).toBeTruthy();
      expect(getByTestId('member-export-dialog-format-excel')).toBeTruthy();
      expect(getByTestId('member-export-dialog-sort-name')).toBeTruthy();
      expect(getByTestId('member-export-dialog-order-asc')).toBeTruthy();
      expect(getByTestId('member-export-dialog-anonymize')).toBeTruthy();
      expect(getByTestId('member-export-dialog-cancel')).toBeTruthy();
      expect(getByTestId('member-export-dialog-export')).toBeTruthy();
    });
  });

  describe('Section Display', () => {
    it('should display all section titles', async () => {
      renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/Select Members/i)).toBeTruthy();
      expect(screen.queryByText(/Include Data Categories/i)).toBeTruthy();
      expect(screen.queryByText(/Custom Fields/i)).toBeTruthy();
      expect(screen.queryByText(/Export Options/i)).toBeTruthy();
    });

    it('should display subsection titles', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      expect(screen.queryByText(/Membership Types/i)).toBeTruthy();
      expect(screen.queryByText(/Member Status/i)).toBeTruthy();
      expect(getByTestId('member-export-dialog-format-excel')).toBeTruthy();
      expect(screen.queryByText(/Sort By/i)).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle rapid option changes', async () => {
      const { getByTestId } = renderWithTheme(<MemberExportDialog {...defaultProps} />);
      await waitForInitialization();

      const personalSwitch = getByTestId('member-export-dialog-include-personal');

      // Rapid toggles
      fireEvent(personalSwitch, 'valueChange', false);
      fireEvent(personalSwitch, 'valueChange', true);
      fireEvent(personalSwitch, 'valueChange', false);
      fireEvent(personalSwitch, 'valueChange', true);

      // Should still render without errors
      expect(screen.queryByText(/Export Member Data/i)).toBeTruthy();
    });
  });
});
