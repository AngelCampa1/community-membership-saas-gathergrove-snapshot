import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationPreview } from '../ValidationPreview';

// Import universal RadixUI mocking setup

// Mock the memberImportService module
jest.mock('@/services/memberImportService', () => ({
  ImportValidationResult: {},
  memberImportService: {
    validateImportData: jest.fn(),
    importMembers: jest.fn(),
  },
}));

// Mock lucide-react icons that may not be covered by universal mocks
jest.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-circle">CheckCircle</div>,
  AlertTriangle: () => <div data-testid="alert-triangle">AlertTriangle</div>,
  XCircle: () => <div data-testid="x-circle">XCircle</div>,
  ChevronDown: () => <div data-testid="chevron-down">ChevronDown</div>,
  ChevronRight: () => <div data-testid="chevron-right">ChevronRight</div>,
  Info: () => <div data-testid="info">Info</div>,
  Download: () => <div data-testid="download">Download</div>,
  // Icons used by shadcn Checkbox component
  CheckIcon: (props: any) => <svg data-testid="check-icon" {...props} />,
}));

// Mock shadcn Checkbox component
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id, ...props }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="checkbox"
      {...props}
    />
  ),
}));

describe('ValidationPreview', () => {
  const mockOnSkipDuplicatesChange = jest.fn();
  const mockOnSkipInvalidChange = jest.fn();
  const mockOnNotifyMembersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultValidationResult = {
    isValid: true,
    totalRows: 5,
    validRows: 4,
    invalidRows: 1,
    duplicateEmails: 1,
    validationErrors: [
      {
        rowNumber: 3,
        field: 'Email',
        value: 'invalid-email',
        error: 'Invalid email format',
      },
    ],
    warnings: [
      {
        rowNumber: 5,
        field: 'PhoneNumber',
        value: '123',
        warning: 'Phone number appears to be incomplete',
      },
    ],
  };

  const renderComponent = (props = {}) => {
    const defaultProps = {
      validationResult: defaultValidationResult,
      skipDuplicates: false,
      skipInvalid: false,
      notifyMembers: false,
      onSkipDuplicatesChange: mockOnSkipDuplicatesChange,
      onSkipInvalidChange: mockOnSkipInvalidChange,
      onNotifyMembersChange: mockOnNotifyMembersChange,
    };

    return render(<ValidationPreview {...defaultProps} {...props} />);
  };

  describe('Summary Cards', () => {
    it('should display summary statistics', () => {
      renderComponent();

      expect(screen.getByText('5')).toBeInTheDocument(); // Total rows
      expect(screen.getByText('Total Rows')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Valid rows
      expect(screen.getByText('Valid Rows')).toBeInTheDocument();
      expect(screen.getAllByText('1')).toHaveLength(4); // Invalid rows, duplicates, and their badges show 1
      expect(screen.getByText('Invalid Rows')).toBeInTheDocument();
      expect(screen.getByText('Duplicates')).toBeInTheDocument();
    });

    it('should not show invalid rows card when there are no invalid rows', () => {
      const validResult = {
        ...defaultValidationResult,
        invalidRows: 0,
        validationErrors: [],
      };

      renderComponent({ validationResult: validResult });

      expect(screen.getByText('Total Rows')).toBeInTheDocument();
      expect(screen.getByText('Valid Rows')).toBeInTheDocument();
      expect(screen.queryByText('Invalid Rows')).not.toBeInTheDocument();
    });

    it('should not show duplicates card when there are no duplicates', () => {
      const noDuplicatesResult = {
        ...defaultValidationResult,
        duplicateEmails: 0,
      };

      renderComponent({ validationResult: noDuplicatesResult });

      expect(screen.queryByText('Duplicates')).not.toBeInTheDocument();
    });
  });

  describe('Overall Status', () => {
    it('should show validation passed status when valid', () => {
      const validResult = {
        ...defaultValidationResult,
        isValid: true,
      };

      renderComponent({ validationResult: validResult });

      expect(screen.getByText('Validation Passed')).toBeInTheDocument();
      expect(screen.getByText(/ready to import/i)).toBeInTheDocument();
    });

    it('should show validation issues status when invalid', () => {
      const invalidResult = {
        ...defaultValidationResult,
        isValid: false,
      };

      renderComponent({ validationResult: invalidResult });

      expect(screen.getByText('Validation Issues Found')).toBeInTheDocument();
      expect(screen.getByText(/contain.*errors that must be fixed/i)).toBeInTheDocument();
    });
  });

  describe('Import Options', () => {
    it('should render all import option checkboxes', () => {
      renderComponent();

      expect(screen.getByLabelText(/skip duplicate emails/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/skip invalid rows/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send welcome emails/i)).toBeInTheDocument();
    });

    it('should call handlers when checkboxes are clicked', () => {
      renderComponent();

      // Find checkboxes by their IDs (using the ID attribute as fallback)
      const skipDuplicatesCheckbox = screen.getByLabelText(/skip duplicate emails/i);
      const skipInvalidCheckbox = screen.getByLabelText(/skip invalid rows/i);
      const notifyMembersCheckbox = screen.getByLabelText(/send welcome emails/i);

      fireEvent.click(skipDuplicatesCheckbox);
      fireEvent.click(skipInvalidCheckbox);
      fireEvent.click(notifyMembersCheckbox);

      expect(mockOnSkipDuplicatesChange).toHaveBeenCalledWith(true);
      expect(mockOnSkipInvalidChange).toHaveBeenCalledWith(true);
      expect(mockOnNotifyMembersChange).toHaveBeenCalledWith(true);
    });

    it('should reflect current checkbox states', () => {
      renderComponent({
        skipDuplicates: true,
        skipInvalid: true,
        notifyMembers: true,
      });

      expect(screen.getByLabelText(/skip duplicate emails/i)).toBeChecked();
      expect(screen.getByLabelText(/skip invalid rows/i)).toBeChecked();
      expect(screen.getByLabelText(/send welcome emails/i)).toBeChecked();
    });

    it('should show duplicate count in skip duplicates option', () => {
      renderComponent();

      expect(screen.getAllByText(/\(1 found\)/)).toHaveLength(2); // Both duplicates and invalid show (1 found)
    });

    it('should show invalid count in skip invalid option', () => {
      renderComponent();

      expect(screen.getAllByText(/\(1 found\)/)).toHaveLength(2); // Both duplicates and invalid show (1 found)
    });
  });

  describe('Validation Errors Section', () => {
    it('should show validation errors when present', () => {
      renderComponent();

      expect(screen.getByText(/1 Validation Error/)).toBeInTheDocument();
    });

    it('should expand errors when clicked', () => {
      renderComponent();

      const errorsButton = screen.getByText(/1 Validation Error/);
      fireEvent.click(errorsButton);

      expect(screen.getByText('Row 3 - Email')).toBeInTheDocument();
      expect(screen.getByText(/Value: "invalid-email" - Invalid email format/)).toBeInTheDocument();
    });

    it('should not show errors section when no errors', () => {
      const noErrorsResult = {
        ...defaultValidationResult,
        validationErrors: [],
      };

      renderComponent({ validationResult: noErrorsResult });

      expect(screen.queryByText(/Validation Error/)).not.toBeInTheDocument();
    });

    it('should handle multiple errors', () => {
      const multipleErrorsResult = {
        ...defaultValidationResult,
        validationErrors: [
          {
            rowNumber: 2,
            field: 'FirstName',
            value: '',
            error: 'First name is required',
          },
          {
            rowNumber: 3,
            field: 'Email',
            value: 'invalid-email',
            error: 'Invalid email format',
          },
        ],
      };

      renderComponent({ validationResult: multipleErrorsResult });

      expect(screen.getByText(/2 Validation Errors/)).toBeInTheDocument();

      const errorsButton = screen.getByText(/2 Validation Errors/);
      fireEvent.click(errorsButton);

      expect(screen.getByText('Row 2 - FirstName')).toBeInTheDocument();
      expect(screen.getByText('Row 3 - Email')).toBeInTheDocument();
    });
  });

  describe('Validation Warnings Section', () => {
    it('should show validation warnings when present', () => {
      renderComponent();

      expect(screen.getByText(/1 Warning/)).toBeInTheDocument();
    });

    it('should expand warnings when clicked', () => {
      renderComponent();

      const warningsButton = screen.getByText(/1 Warning/);
      fireEvent.click(warningsButton);

      expect(screen.getByText('Row 5 - PhoneNumber')).toBeInTheDocument();
      expect(screen.getByText(/Value: "123" - Phone number appears to be incomplete/)).toBeInTheDocument();
    });

    it('should not show warnings section when no warnings', () => {
      const noWarningsResult = {
        ...defaultValidationResult,
        warnings: [],
      };

      renderComponent({ validationResult: noWarningsResult });

      expect(screen.queryByText(/Warning/)).not.toBeInTheDocument();
    });
  });

  describe('Error Report Download', () => {
    beforeEach(() => {
      // Mock URL.createObjectURL which is not available in JSDOM
      global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
      global.URL.revokeObjectURL = jest.fn();
    });

    it('should download error report when button is clicked', () => {
      renderComponent();

      const errorsButton = screen.getByText(/1 Validation Error/);
      fireEvent.click(errorsButton);

      const downloadButton = screen.getByText('Download Report');
      expect(downloadButton).toBeInTheDocument();
      
      // Click the download button and verify it doesn't throw
      expect(() => fireEvent.click(downloadButton)).not.toThrow();
      
      // Verify URL.createObjectURL was called
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Import Preview', () => {
    it('should show correct import count without options', () => {
      renderComponent();

      expect(screen.getByText(/4 members will be imported/)).toBeInTheDocument();
    });

    it('should show correct import count with skip duplicates', () => {
      renderComponent({ skipDuplicates: true });

      expect(screen.getByText(/3 members will be imported/)).toBeInTheDocument();
      expect(screen.getByText(/1 duplicate will be skipped/)).toBeInTheDocument();
    });

    it('should show correct import count with skip invalid', () => {
      renderComponent({ skipInvalid: true });

      expect(screen.getByText(/4 members will be imported/)).toBeInTheDocument();
      expect(screen.getByText(/1 invalid row will be skipped/)).toBeInTheDocument();
    });

    it('should show correct import count with both options', () => {
      renderComponent({ skipDuplicates: true, skipInvalid: true });

      expect(screen.getByText(/3 members will be imported/)).toBeInTheDocument();
      expect(screen.getByText(/1 duplicate will be skipped/)).toBeInTheDocument();
      expect(screen.getByText(/1 invalid row will be skipped/)).toBeInTheDocument();
    });

    it('should handle singular vs plural text correctly', () => {
      const singleResult = {
        ...defaultValidationResult,
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateEmails: 0,
        validationErrors: [],
        warnings: [],
      };

      renderComponent({ validationResult: singleResult });

      expect(screen.getByText(/1 member will be imported/)).toBeInTheDocument();
    });
  });
});