import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from '../calendar';

describe('Calendar', () => {
  describe('Rendering', () => {
    it('should render calendar with default props', () => {
      render(<Calendar />);

      // Check for day headers
      expect(screen.getByText('Su')).toBeInTheDocument();
      expect(screen.getByText('Mo')).toBeInTheDocument();
      expect(screen.getByText('Tu')).toBeInTheDocument();
      expect(screen.getByText('We')).toBeInTheDocument();
      expect(screen.getByText('Th')).toBeInTheDocument();
      expect(screen.getByText('Fr')).toBeInTheDocument();
      expect(screen.getByText('Sa')).toBeInTheDocument();
    });

    it('should render current month and year', () => {
      render(<Calendar />);

      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      expect(screen.getByText(monthYear)).toBeInTheDocument();
    });

    it('should render 42 date buttons (6 weeks)', () => {
      const { container } = render(<Calendar />);

      const buttons = container.querySelectorAll('button');
      // 42 date buttons
      expect(buttons.length).toBe(42);
    });

    it('should apply custom className', () => {
      const { container } = render(<Calendar className="custom-class" />);

      const calendar = container.firstChild;
      expect(calendar).toHaveClass('custom-class');
      expect(calendar).toHaveClass('p-4');
      expect(calendar).toHaveClass('border');
      expect(calendar).toHaveClass('rounded-md');
    });

    it('should render without custom className', () => {
      const { container } = render(<Calendar />);

      const calendar = container.firstChild;
      expect(calendar).toHaveClass('p-4');
      expect(calendar).toHaveClass('border');
    });

    it('should pass through additional props', () => {
      const { container } = render(
        <Calendar data-testid="calendar-test" aria-label="Test calendar" />
      );

      const calendar = container.firstChild;
      expect(calendar).toHaveAttribute('data-testid', 'calendar-test');
      expect(calendar).toHaveAttribute('aria-label', 'Test calendar');
    });
  });

  describe('Date Selection', () => {
    it('should highlight selected date', () => {
      // Use current month to ensure date is visible in calendar
      const currentDate = new Date();
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      render(<Calendar selected={selectedDate} />);

      const dateButton = screen.getByRole('button', { name: '15' });
      expect(dateButton).toHaveClass('bg-primary');
      expect(dateButton).toHaveClass('text-primary-foreground');
    });

    it('should call onSelect when date is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(<Calendar onSelect={onSelect} />);

      const currentDate = new Date();
      const dateButton = screen.getByRole('button', { name: '15' });
      await user.click(dateButton);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(expect.any(Date));

      const calledDate = onSelect.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(15);
    });

    it('should work without onSelect callback', async () => {
      const user = userEvent.setup();
      render(<Calendar />);

      const dateButton = screen.getByRole('button', { name: '15' });

      // Should not throw error
      await expect(user.click(dateButton)).resolves.not.toThrow();
    });

    it('should handle Date array as selected', () => {
      // Use current month dates
      const currentDate = new Date();
      const selectedDates = [
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
      ];

      render(<Calendar selected={selectedDates} />);

      // Only checks for Date instance, not array, so no dates will be highlighted
      const button15 = screen.getByRole('button', { name: '15' });
      const button20 = screen.getByRole('button', { name: '20' });

      expect(button15).not.toHaveClass('bg-primary');
      expect(button20).not.toHaveClass('bg-primary');
    });

    it('should render without selected date', () => {
      render(<Calendar />);

      const buttons = screen.getAllByRole('button');
      const primaryButtons = buttons.filter(btn =>
        btn.className.includes('bg-primary')
      );

      expect(primaryButtons.length).toBe(0);
    });

    it('should update when selected date changes', () => {
      // Use current month dates
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const { rerender } = render(<Calendar selected={new Date(year, month, 15)} />);

      let dateButton = screen.getByRole('button', { name: '15' });
      expect(dateButton).toHaveClass('bg-primary');

      rerender(<Calendar selected={new Date(year, month, 20)} />);

      dateButton = screen.getByRole('button', { name: '15' });
      expect(dateButton).not.toHaveClass('bg-primary');

      dateButton = screen.getByRole('button', { name: '20' });
      expect(dateButton).toHaveClass('bg-primary');
    });
  });

  describe('Disabled Dates', () => {
    it('should disable dates based on disabled prop', () => {
      const disabledFn = (date: Date) => date.getDate() === 15;
      render(<Calendar disabled={disabledFn} />);

      const dateButton = screen.getByRole('button', { name: '15' });
      expect(dateButton).toBeDisabled();
    });

    it('should not disable other dates', () => {
      const disabledFn = (date: Date) => date.getDate() === 15;
      render(<Calendar disabled={disabledFn} />);

      const dateButton = screen.getByRole('button', { name: '20' });
      expect(dateButton).not.toBeDisabled();
    });

    it('should not call onSelect for disabled dates', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      const disabledFn = (date: Date) => date.getDate() === 15;

      render(<Calendar onSelect={onSelect} disabled={disabledFn} />);

      const dateButton = screen.getByRole('button', { name: '15' });
      await user.click(dateButton);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should disable multiple dates', () => {
      const disabledFn = (date: Date) => [15, 20, 25].includes(date.getDate());
      render(<Calendar disabled={disabledFn} />);

      // Use getAllByRole since dates can appear multiple times (prev/next month)
      const button15s = screen.getAllByRole('button', { name: '15' });
      const button20s = screen.getAllByRole('button', { name: '20' });
      const button25s = screen.getAllByRole('button', { name: '25' });

      // At least one of each should be disabled
      expect(button15s.some(btn => btn.disabled)).toBe(true);
      expect(button20s.some(btn => btn.disabled)).toBe(true);
      expect(button25s.some(btn => btn.disabled)).toBe(true);
    });

    it('should work without disabled prop', () => {
      render(<Calendar />);

      const buttons = screen.getAllByRole('button');
      const disabledButtons = buttons.filter(btn => btn.disabled);

      expect(disabledButtons.length).toBe(0);
    });

    it('should disable all weekends', () => {
      const disabledFn = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      };

      render(<Calendar disabled={disabledFn} />);

      const buttons = screen.getAllByRole('button');
      const disabledButtons = buttons.filter(btn => btn.disabled);

      // Should have disabled weekend dates
      expect(disabledButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Date Display', () => {
    it('should show dates from current month', () => {
      render(<Calendar />);

      const currentDate = new Date();
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();

      // Should have buttons for all days in month (using getAllByRole since some dates may appear in prev/next month too)
      for (let day = 1; day <= daysInMonth; day++) {
        const buttons = screen.getAllByRole('button', { name: day.toString() });
        expect(buttons.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should dim dates from previous month', () => {
      const { container } = render(<Calendar />);

      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      // Check if previous month dates have muted class
      const buttons = container.querySelectorAll('button');
      const mutedButtons = Array.from(buttons).filter(btn =>
        btn.className.includes('text-muted-foreground/50')
      );

      // Should have some muted buttons (previous/next month dates)
      expect(mutedButtons.length).toBeGreaterThan(0);
    });

    it('should dim dates from next month', () => {
      const { container } = render(<Calendar />);

      const buttons = container.querySelectorAll('button');
      const mutedButtons = Array.from(buttons).filter(btn =>
        btn.className.includes('text-muted-foreground/50')
      );

      expect(mutedButtons.length).toBeGreaterThan(0);
    });

    it('should show correct date numbers', () => {
      render(<Calendar />);

      const currentDate = new Date();
      const today = currentDate.getDate();

      const todayButton = screen.getAllByRole('button', { name: today.toString() })[0];
      expect(todayButton).toBeInTheDocument();
      expect(todayButton.textContent).toBe(today.toString());
    });
  });

  describe('Mode Prop', () => {
    it('should accept single mode', () => {
      render(<Calendar mode="single" />);

      // Should render without error
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });

    it('should accept multiple mode', () => {
      render(<Calendar mode="multiple" />);

      // Should render without error (mode is not actively used yet)
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });

    it('should accept range mode', () => {
      render(<Calendar mode="range" />);

      // Should render without error (mode is not actively used yet)
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });

    it('should default to single mode', () => {
      render(<Calendar />);

      // Should render without error
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('should use default variant for selected date', () => {
      // Use current month date
      const currentDate = new Date();
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      render(<Calendar selected={selectedDate} />);

      const dateButton = screen.getByRole('button', { name: '15' });

      // Check for variant attribute or class
      expect(dateButton).toHaveClass('bg-primary');
    });

    it('should use ghost variant for unselected dates', () => {
      render(<Calendar />);

      const dateButton = screen.getByRole('button', { name: '15' });

      // Ghost variant doesn't add bg-primary
      expect(dateButton).not.toHaveClass('bg-primary');
    });

    it('should apply small size to all date buttons', () => {
      render(<Calendar />);

      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveClass('h-9');
        expect(button).toHaveClass('w-9');
        expect(button).toHaveClass('p-0');
      });
    });

    it('should apply font-normal to all date buttons', () => {
      render(<Calendar />);

      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveClass('font-normal');
      });
    });
  });

  describe('Day Headers', () => {
    it('should render all 7 day headers', () => {
      render(<Calendar />);

      const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

      dayHeaders.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('should style day headers correctly', () => {
      const { container } = render(<Calendar />);

      const dayHeader = screen.getByText('Su');

      expect(dayHeader).toHaveClass('p-2');
      expect(dayHeader).toHaveClass('text-sm');
      expect(dayHeader).toHaveClass('font-medium');
      expect(dayHeader).toHaveClass('text-muted-foreground');
    });

    it('should render day headers in grid', () => {
      const { container } = render(<Calendar />);

      const grid = container.querySelector('.grid-cols-7');
      expect(grid).toBeInTheDocument();

      const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      dayHeaders.forEach(day => {
        const header = screen.getByText(day);
        expect(grid).toContainElement(header);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined selected date', () => {
      render(<Calendar selected={undefined} />);

      const buttons = screen.getAllByRole('button');
      const primaryButtons = buttons.filter(btn =>
        btn.className.includes('bg-primary')
      );

      expect(primaryButtons.length).toBe(0);
    });

    it('should handle onSelect with undefined', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(<Calendar onSelect={onSelect} />);

      const dateButton = screen.getByRole('button', { name: '15' });
      await user.click(dateButton);

      expect(onSelect).toHaveBeenCalled();
    });

    it('should handle empty modifiersClassNames', () => {
      render(<Calendar modifiersClassNames={{}} />);

      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });

    it('should handle custom modifiersClassNames', () => {
      render(<Calendar modifiersClassNames={{ today: 'bg-accent' }} />);

      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });

    it('should handle dates at month boundaries', () => {
      render(<Calendar />);

      // First day of month - may appear multiple times (prev month too), use getAllByRole
      const firstDayButtons = screen.getAllByRole('button', { name: '1' });
      expect(firstDayButtons.length).toBeGreaterThanOrEqual(1);

      // Last day of month - may appear multiple times (next month too), use getAllByRole
      const currentDate = new Date();
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();

      const lastDayButtons = screen.queryAllByRole('button', { name: lastDay.toString() });
      expect(lastDayButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle year boundaries', () => {
      // Render calendar for December
      const decemberDate = new Date(2025, 11, 15); // Dec 15, 2025
      render(<Calendar selected={decemberDate} />);

      // Should render without error
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });

    it('should handle rapid date selection', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(<Calendar onSelect={onSelect} />);

      const button1 = screen.getByRole('button', { name: '15' });
      const button2 = screen.getByRole('button', { name: '20' });

      await user.click(button1);
      await user.click(button2);
      await user.click(button1);

      expect(onSelect).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration', () => {
    it('should work with selected date and disabled dates together', () => {
      // Use current month dates
      const currentDate = new Date();
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      const disabledFn = (date: Date) => date.getDate() === 20;

      render(<Calendar selected={selectedDate} disabled={disabledFn} />);

      const selectedButton = screen.getByRole('button', { name: '15' });
      expect(selectedButton).toHaveClass('bg-primary');
      expect(selectedButton).not.toBeDisabled();

      const disabledButton = screen.getByRole('button', { name: '20' });
      expect(disabledButton).toBeDisabled();
      expect(disabledButton).not.toHaveClass('bg-primary');
    });

    it('should handle selecting a disabled date', () => {
      // Use current month dates
      const currentDate = new Date();
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      const disabledFn = (date: Date) => date.getDate() === 15;

      render(<Calendar selected={selectedDate} disabled={disabledFn} />);

      const dateButton = screen.getByRole('button', { name: '15' });

      // Date is both selected and disabled
      expect(dateButton).toHaveClass('bg-primary');
      expect(dateButton).toBeDisabled();
    });

    it('should work with custom className and selected date', () => {
      // Use current month dates
      const currentDate = new Date();
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      const { container } = render(
        <Calendar selected={selectedDate} className="custom-calendar" />
      );

      const calendar = container.firstChild;
      expect(calendar).toHaveClass('custom-calendar');

      const selectedButton = screen.getByRole('button', { name: '15' });
      expect(selectedButton).toHaveClass('bg-primary');
    });

    it('should maintain state consistency across multiple interactions', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      // Use current month dates
      const currentDate = new Date();
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);

      const { rerender } = render(
        <Calendar selected={selectedDate} onSelect={onSelect} />
      );

      let button20 = screen.getByRole('button', { name: '20' });
      await user.click(button20);

      expect(onSelect).toHaveBeenCalledTimes(1);

      const newDate = onSelect.mock.calls[0][0];
      rerender(<Calendar selected={newDate} onSelect={onSelect} />);

      button20 = screen.getByRole('button', { name: '20' });
      expect(button20).toHaveClass('bg-primary');
    });
  });
});
