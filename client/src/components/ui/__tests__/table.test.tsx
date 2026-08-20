import React from 'react';
import { render, screen, within } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../table';

describe('Table', () => {
  describe('Table Component', () => {
    it('should render table element', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('data-slot', 'table');
    });

    it('should have container with data-slot attribute', () => {
      const { container } = render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const tableContainer = container.querySelector('[data-slot="table-container"]');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should apply base styling classes', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('w-full');
      expect(table).toHaveClass('caption-bottom');
      expect(table).toHaveClass('text-sm');
    });

    it('should have scrollable container', () => {
      const { container } = render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const tableContainer = container.querySelector('[data-slot="table-container"]');
      expect(tableContainer).toHaveClass('overflow-x-auto');
      expect(tableContainer).toHaveClass('w-full');
    });

    it('should accept custom className', () => {
      render(
        <Table className="custom-table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
      expect(table).toHaveClass('w-full'); // Still has base classes
    });

    it('should forward HTML table attributes', () => {
      render(
        <Table id="my-table" data-testid="test-table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByTestId('test-table');
      expect(table).toHaveAttribute('id', 'my-table');
    });
  });

  describe('TableHeader Component', () => {
    it('should render thead element', () => {
      render(
        <table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );

      const thead = screen.getByRole('rowgroup');
      expect(thead).toBeInTheDocument();
      expect(thead.tagName).toBe('THEAD');
    });

    it('should have data-slot attribute', () => {
      render(
        <table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );

      const thead = document.querySelector('[data-slot="table-header"]');
      expect(thead).toBeInTheDocument();
    });

    it('should apply border styling to rows', () => {
      const { container } = render(
        <table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );

      const thead = container.querySelector('[data-slot="table-header"]');
      expect(thead?.className).toMatch(/\[&_tr\]:border-b/);
    });

    it('should accept custom className', () => {
      render(
        <table>
          <TableHeader className="custom-header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );

      const thead = document.querySelector('[data-slot="table-header"]');
      expect(thead).toHaveClass('custom-header');
    });
  });

  describe('TableBody Component', () => {
    it('should render tbody element', () => {
      render(
        <table>
          <TableBody>
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </table>
      );

      const tbody = screen.getByRole('rowgroup');
      expect(tbody).toBeInTheDocument();
      expect(tbody.tagName).toBe('TBODY');
    });

    it('should have data-slot attribute', () => {
      render(
        <table>
          <TableBody>
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </table>
      );

      const tbody = document.querySelector('[data-slot="table-body"]');
      expect(tbody).toBeInTheDocument();
    });

    it('should apply border styling for last row', () => {
      const { container } = render(
        <table>
          <TableBody>
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </table>
      );

      const tbody = container.querySelector('[data-slot="table-body"]');
      expect(tbody?.className).toMatch(/\[&_tr:last-child\]:border-0/);
    });

    it('should accept custom className', () => {
      render(
        <table>
          <TableBody className="custom-body">
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </table>
      );

      const tbody = document.querySelector('[data-slot="table-body"]');
      expect(tbody).toHaveClass('custom-body');
    });
  });

  describe('TableFooter Component', () => {
    it('should render tfoot element', () => {
      render(
        <table>
          <TableFooter>
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </table>
      );

      const tfoot = screen.getByRole('rowgroup');
      expect(tfoot).toBeInTheDocument();
      expect(tfoot.tagName).toBe('TFOOT');
    });

    it('should have data-slot attribute', () => {
      render(
        <table>
          <TableFooter>
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </table>
      );

      const tfoot = document.querySelector('[data-slot="table-footer"]');
      expect(tfoot).toBeInTheDocument();
    });

    it('should apply styling classes', () => {
      render(
        <table>
          <TableFooter>
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </table>
      );

      const tfoot = document.querySelector('[data-slot="table-footer"]');
      expect(tfoot).toHaveClass('border-t');
      expect(tfoot).toHaveClass('font-medium');
    });

    it('should accept custom className', () => {
      render(
        <table>
          <TableFooter className="custom-footer">
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </table>
      );

      const tfoot = document.querySelector('[data-slot="table-footer"]');
      expect(tfoot).toHaveClass('custom-footer');
      expect(tfoot).toHaveClass('border-t'); // Still has base classes
    });
  });

  describe('TableRow Component', () => {
    it('should render tr element', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = screen.getByRole('row');
      expect(row).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = document.querySelector('[data-slot="table-row"]');
      expect(row).toBeInTheDocument();
    });

    it('should apply base styling classes', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = document.querySelector('[data-slot="table-row"]');
      expect(row).toHaveClass('border-b');
      expect(row).toHaveClass('transition-colors');
    });

    it('should have hover styling', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = document.querySelector('[data-slot="table-row"]');
      expect(row?.className).toMatch(/hover:bg-muted\/50/);
    });

    it('should have selected state styling', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = document.querySelector('[data-slot="table-row"]');
      expect(row?.className).toMatch(/data-\[state=selected\]:bg-muted/);
    });

    it('should accept custom className', () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-row">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = document.querySelector('[data-slot="table-row"]');
      expect(row).toHaveClass('custom-row');
      expect(row).toHaveClass('border-b'); // Still has base classes
    });

    it('should support data-state attribute', () => {
      render(
        <table>
          <tbody>
            <TableRow data-state="selected">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = document.querySelector('[data-slot="table-row"]');
      expect(row).toHaveAttribute('data-state', 'selected');
    });
  });

  describe('TableHead Component', () => {
    it('should render th element', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = screen.getByRole('columnheader');
      expect(th).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = document.querySelector('[data-slot="table-head"]');
      expect(th).toBeInTheDocument();
    });

    it('should apply styling classes', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = document.querySelector('[data-slot="table-head"]');
      expect(th).toHaveClass('h-10');
      expect(th).toHaveClass('px-2');
      expect(th).toHaveClass('font-medium');
      expect(th).toHaveClass('whitespace-nowrap');
    });

    it('should have checkbox column styling', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = document.querySelector('[data-slot="table-head"]');
      expect(th?.className).toMatch(/\[&:has\(\[role=checkbox\]\)\]:pr-0/);
    });

    it('should accept custom className', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-head">Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = document.querySelector('[data-slot="table-head"]');
      expect(th).toHaveClass('custom-head');
      expect(th).toHaveClass('font-medium'); // Still has base classes
    });
  });

  describe('TableCell Component', () => {
    it('should render td element', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveTextContent('Cell Content');
    });

    it('should have data-slot attribute', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = document.querySelector('[data-slot="table-cell"]');
      expect(cell).toBeInTheDocument();
    });

    it('should apply styling classes', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = document.querySelector('[data-slot="table-cell"]');
      expect(cell).toHaveClass('p-2');
      expect(cell).toHaveClass('align-middle');
      expect(cell).toHaveClass('max-w-xs');
      // Note: truncate is removed by cn() in favor of explicit overflow-hidden + text-ellipsis
    });

    it('should have overflow handling classes', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = document.querySelector('[data-slot="table-cell"]');
      expect(cell).toHaveClass('overflow-hidden');
      expect(cell).toHaveClass('text-ellipsis');
    });

    it('should have checkbox column styling', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = document.querySelector('[data-slot="table-cell"]');
      expect(cell?.className).toMatch(/\[&:has\(\[role=checkbox\]\)\]:pr-0/);
    });

    it('should accept custom className', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell">Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = document.querySelector('[data-slot="table-cell"]');
      expect(cell).toHaveClass('custom-cell');
      expect(cell).toHaveClass('p-2'); // Still has base classes
    });
  });

  describe('TableCaption Component', () => {
    it('should render caption element', () => {
      render(
        <table>
          <TableCaption>Table Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = screen.getByText('Table Caption');
      expect(caption).toBeInTheDocument();
      expect(caption.tagName).toBe('CAPTION');
    });

    it('should have data-slot attribute', () => {
      render(
        <table>
          <TableCaption>Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = document.querySelector('[data-slot="table-caption"]');
      expect(caption).toBeInTheDocument();
    });

    it('should apply styling classes', () => {
      render(
        <table>
          <TableCaption>Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = document.querySelector('[data-slot="table-caption"]');
      expect(caption).toHaveClass('mt-4');
      expect(caption).toHaveClass('text-sm');
    });

    it('should have muted text color', () => {
      render(
        <table>
          <TableCaption>Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = document.querySelector('[data-slot="table-caption"]');
      expect(caption?.className).toMatch(/text-muted-foreground/);
    });

    it('should accept custom className', () => {
      render(
        <table>
          <TableCaption className="custom-caption">Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = document.querySelector('[data-slot="table-caption"]');
      expect(caption).toHaveClass('custom-caption');
      expect(caption).toHaveClass('text-sm'); // Still has base classes
    });
  });

  describe('Integration', () => {
    it('should render complete table structure', () => {
      render(
        <Table>
          <TableCaption>Employee Directory</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Developer</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>Designer</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total: 2 employees</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText('Employee Directory')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Total: 2 employees')).toBeInTheDocument();
    });

    it('should support data-state on rows', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Selected Row</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Normal Row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const rows = document.querySelectorAll('[data-slot="table-row"]');
      expect(rows[0]).toHaveAttribute('data-state', 'selected');
      expect(rows[1]).not.toHaveAttribute('data-state');
    });

    it('should handle empty table', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>No data available</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should support sortable headers', () => {
      const handleSort = jest.fn();

      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={handleSort}>Name</button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const sortButton = screen.getByRole('button', { name: 'Name' });
      sortButton.click();

      expect(handleSort).toHaveBeenCalledTimes(1);
    });

    it('should support checkbox columns', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" role="checkbox" aria-label="Select all" />
              </TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <input type="checkbox" role="checkbox" aria-label="Select row" />
              </TableCell>
              <TableCell>John</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('should handle long text with truncation', () => {
      const longText = 'This is a very long text that should be truncated when it exceeds the maximum width of the table cell';

      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>{longText}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = screen.getByText(longText);
      // Note: truncate is removed by cn() in favor of explicit classes
      expect(cell).toHaveClass('overflow-hidden');
      expect(cell).toHaveClass('text-ellipsis');
      expect(cell).toHaveClass('max-w-xs');
    });
  });
});
