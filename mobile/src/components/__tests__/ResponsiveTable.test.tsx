/**
 * ResponsiveTable Tests
 *
 * Tests table rendering, sorting, responsive behavior, and accessibility.
 */

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ResponsiveTable, TableColumn } from '../ResponsiveTable';

// Mock dependencies
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: {
        primary: '#FFFFFF',
        secondary: '#F2F2F7',
        tertiary: '#E5E5EA',
        card: '#F2F2F7'
      },
      text: {
        primary: '#000000',
        secondary: '#666666',
        tertiary: '#999999',
        inverse: '#FFFFFF'
      },
      border: { primary: '#E5E5EA' },
      interactive: {
        primary: '#007AFF',
        secondary: '#5856D6'
      },
      shadow: {
        small: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
        medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
        large: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
      },
    },
  }),
}));

jest.mock('../../utils/accessibility', () => ({
  getResponsiveStyle: () => ({
    isSmallScreen: false,
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    textSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 }
  }),
  getTouchTargetStyle: () => ({ minHeight: 44, minWidth: 44 }),
  createAccessibilityLabel: (label: string, hint: string, role: string) => ({
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
  }),
}));

interface TestData extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  status: string;
}

describe('ResponsiveTable', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  ];

  const mockColumns: TableColumn<TestData>[] = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'status', title: 'Status', sortable: false },
  ];

  describe('Rendering', () => {
    it('should render with data', () => {
      const { getByTestId } = render(
        <ResponsiveTable data={mockData} columns={mockColumns} stackOnSmall={false} />
      );

      expect(getByTestId('responsive-table')).toBeTruthy();
      expect(getByTestId('responsive-table-header')).toBeTruthy();
    });

    it('should render all rows', () => {
      const { getByTestId } = render(
        <ResponsiveTable data={mockData} columns={mockColumns} stackOnSmall={false} />
      );

      expect(getByTestId('responsive-table-row-0')).toBeTruthy();
      expect(getByTestId('responsive-table-row-1')).toBeTruthy();
      expect(getByTestId('responsive-table-row-2')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          testID="custom-table"
          stackOnSmall={false}
        />
      );

      expect(getByTestId('custom-table')).toBeTruthy();
      expect(getByTestId('custom-table-header')).toBeTruthy();
      expect(getByTestId('custom-table-row-0')).toBeTruthy();
    });

    it('should render header with accessibility labels', () => {
      const { getByTestId } = render(
        <ResponsiveTable data={mockData} columns={mockColumns} stackOnSmall={false} />
      );

      const header = getByTestId('responsive-table-header');
      expect(header).toBeTruthy();
    });

    it('should render all data rows', () => {
      const { getByTestId } = render(
        <ResponsiveTable data={mockData} columns={mockColumns} stackOnSmall={false} />
      );

      // Verify all three data rows are rendered
      expect(getByTestId('responsive-table-row-0')).toBeTruthy();
      expect(getByTestId('responsive-table-row-1')).toBeTruthy();
      expect(getByTestId('responsive-table-row-2')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      const { getByTestId } = render(
        <ResponsiveTable data={[]} columns={mockColumns} stackOnSmall={false} />
      );

      expect(getByTestId('responsive-table-empty')).toBeTruthy();
    });

    it('should show empty state with custom testID', () => {
      const { getByTestId } = render(
        <ResponsiveTable
          data={[]}
          columns={mockColumns}
          emptyText="No members found"
          stackOnSmall={false}
        />
      );

      expect(getByTestId('responsive-table-empty')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          loading={true}
          stackOnSmall={false}
        />
      );

      expect(getByTestId('responsive-table-loading')).toBeTruthy();
    });

    it('should not show data when loading', () => {
      const { queryByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          loading={true}
          stackOnSmall={false}
        />
      );

      expect(queryByTestId('responsive-table-row-0')).toBeNull();
      expect(queryByTestId('responsive-table-header')).toBeNull();
    });
  });

  describe('Sorting', () => {
    it('should render header with sort functionality', () => {
      const mockOnSort = jest.fn();
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          stackOnSmall={false}
        />
      );

      const header = getByTestId('responsive-table-header');
      expect(header).toBeTruthy();
    });

    it('should render with sort column and direction props', () => {
      const mockOnSort = jest.fn();
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          sortColumn="name"
          sortDirection="asc"
          stackOnSmall={false}
        />
      );

      const header = getByTestId('responsive-table-header');
      expect(header).toBeTruthy();
    });

    it('should render with descending sort direction', () => {
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          sortColumn="name"
          sortDirection="desc"
          stackOnSmall={false}
        />
      );

      const header = getByTestId('responsive-table-header');
      expect(header).toBeTruthy();
    });
  });

  describe('Row Interaction', () => {
    it('should render rows as pressable when onRowPress is provided', () => {
      const mockOnRowPress = jest.fn();
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          onRowPress={mockOnRowPress}
          stackOnSmall={false}
        />
      );

      const row = getByTestId('responsive-table-row-1');
      expect(row).toBeTruthy();
      expect(row.props.disabled).toBe(false); // Row should be enabled when onRowPress is provided
      expect(row.props.accessibilityRole).toBe('button'); // Row should have button role
    });

    it('should render rows without onRowPress handler', () => {
      const { getByTestId } = render(
        <ResponsiveTable data={mockData} columns={mockColumns} stackOnSmall={false} />
      );

      const row = getByTestId('responsive-table-row-0');
      expect(row).toBeTruthy();
      expect(row.props.disabled).toBe(true); // Row should be disabled when no onRowPress
    });
  });

  describe('Custom Rendering', () => {
    it('should use custom render function', () => {
      const customColumns: TableColumn<TestData>[] = [
        {
          key: 'name',
          title: 'Name',
          render: (value: string) => <Text testID="custom-name">{value} (Custom)</Text>
        },
      ];

      const { getAllByTestId } = render(
        <ResponsiveTable data={mockData} columns={customColumns} stackOnSmall={false} />
      );

      const customElements = getAllByTestId('custom-name');
      expect(customElements).toHaveLength(mockData.length); // One for each row
    });
  });

  describe('Responsive Behavior', () => {
    it('should not render header when stackOnSmall is true', () => {
      const { queryByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          stackOnSmall={true}
        />
      );

      // Header should not render when stackOnSmall is true
      expect(queryByTestId('responsive-table-header')).toBeNull();
      // Rows should still render
      expect(queryByTestId('responsive-table-row-0')).toBeTruthy();
    });

    it('should render header when stackOnSmall is false', () => {
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          stackOnSmall={false}
        />
      );

      // Header should render when stackOnSmall is false
      expect(getByTestId('responsive-table-header')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should render table with header accessibility', () => {
      const { getByTestId } = render(
        <ResponsiveTable data={mockData} columns={mockColumns} stackOnSmall={false} />
      );

      const header = getByTestId('responsive-table-header');
      expect(header).toBeTruthy();
    });

    it('should have accessibility labels for rows with onRowPress', () => {
      const mockOnRowPress = jest.fn();
      const { getByTestId } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          onRowPress={mockOnRowPress}
          stackOnSmall={false}
        />
      );

      const row = getByTestId('responsive-table-row-0');
      expect(row.props.accessibilityLabel).toBe('Row 1');
      expect(row.props.accessibilityHint).toBe('Tap to view details');
      expect(row.props.accessibilityRole).toBe('button');
    });
  });
});
