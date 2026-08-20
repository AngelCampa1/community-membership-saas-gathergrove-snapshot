import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePickerWithRange, DateRange } from '../date-range-picker';

// Mock the SharedDateRangePicker component
jest.mock('../../shared/DateRangePicker', () => ({
  DateRangePicker: ({ startDate, endDate, onRangeChange, className, placeholder, disabled }: any) => (
    <div
      data-testid="shared-date-range-picker"
      data-start-date={startDate?.toISOString()}
      data-end-date={endDate?.toISOString()}
      data-classname={className}
      data-placeholder={placeholder}
      data-disabled={disabled}
    >
      <button
        onClick={() => {
          if (!disabled && onRangeChange) {
            onRangeChange({
              start: new Date('2026-01-01'),
              end: new Date('2026-01-31')
            });
          }
        }}
      >
        Select Range
      </button>
    </div>
  ),
}));

describe('DatePickerWithRange', () => {
  describe('Rendering', () => {
    it('should render SharedDateRangePicker component', () => {
      render(<DatePickerWithRange />);

      expect(screen.getByTestId('shared-date-range-picker')).toBeInTheDocument();
    });

    it('should render with minimal props', () => {
      render(<DatePickerWithRange />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toBeInTheDocument();
    });
  });

  describe('Value Prop Conversion', () => {
    it('should convert value.from to startDate', () => {
      const value: DateRange = {
        from: new Date('2026-01-15'),
        to: new Date('2026-01-20')
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', value.from.toISOString());
    });

    it('should convert value.to to endDate', () => {
      const value: DateRange = {
        from: new Date('2026-01-15'),
        to: new Date('2026-01-20')
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-end-date', value.to.toISOString());
    });

    it('should handle undefined value', () => {
      render(<DatePickerWithRange value={undefined} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      // When undefined, React doesn't render the attribute (it's null, not "undefined")
      expect(picker.getAttribute('data-start-date')).toBeNull();
      expect(picker.getAttribute('data-end-date')).toBeNull();
    });

    it('should handle partial value (only from)', () => {
      const value = {
        from: new Date('2026-01-15'),
        to: undefined as any
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', value.from.toISOString());
      expect(picker.getAttribute('data-end-date')).toBeNull();
    });

    it('should handle partial value (only to)', () => {
      const value = {
        from: undefined as any,
        to: new Date('2026-01-20')
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker.getAttribute('data-start-date')).toBeNull();
      expect(picker).toHaveAttribute('data-end-date', value.to.toISOString());
    });

    it('should update when value prop changes', () => {
      const initialValue: DateRange = {
        from: new Date('2026-01-01'),
        to: new Date('2026-01-10')
      };

      const { rerender } = render(<DatePickerWithRange value={initialValue} />);

      let picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', initialValue.from.toISOString());

      const newValue: DateRange = {
        from: new Date('2026-02-01'),
        to: new Date('2026-02-10')
      };

      rerender(<DatePickerWithRange value={newValue} />);

      picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', newValue.from.toISOString());
      expect(picker).toHaveAttribute('data-end-date', newValue.to.toISOString());
    });
  });

  describe('onChange Handler', () => {
    it('should convert {start, end} to {from, to} format', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<DatePickerWithRange onChange={onChange} />);

      const button = screen.getByRole('button', { name: 'Select Range' });
      await user.click(button);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31')
      });
    });

    it('should work without onChange handler', async () => {
      const user = userEvent.setup();

      render(<DatePickerWithRange />);

      const button = screen.getByRole('button', { name: 'Select Range' });

      // Should not throw error
      await expect(user.click(button)).resolves.not.toThrow();
    });

    it('should handle multiple onChange calls', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<DatePickerWithRange onChange={onChange} />);

      const button = screen.getByRole('button', { name: 'Select Range' });

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<DatePickerWithRange onChange={onChange} disabled />);

      const button = screen.getByRole('button', { name: 'Select Range' });
      await user.click(button);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Props Forwarding', () => {
    it('should forward className prop', () => {
      render(<DatePickerWithRange className="custom-picker" />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-classname', 'custom-picker');
    });

    it('should forward placeholder prop', () => {
      render(<DatePickerWithRange placeholder="Select date range" />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-placeholder', 'Select date range');
    });

    it('should forward disabled prop', () => {
      render(<DatePickerWithRange disabled />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-disabled', 'true');
    });

    it('should forward multiple props together', () => {
      render(
        <DatePickerWithRange
          className="my-class"
          placeholder="Pick dates"
          disabled={false}
        />
      );

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-classname', 'my-class');
      expect(picker).toHaveAttribute('data-placeholder', 'Pick dates');
      expect(picker).toHaveAttribute('data-disabled', 'false');
    });

    it('should handle undefined props', () => {
      render(
        <DatePickerWithRange
          className={undefined}
          placeholder={undefined}
          disabled={undefined}
        />
      );

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with value and onChange together', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const value: DateRange = {
        from: new Date('2026-01-15'),
        to: new Date('2026-01-20')
      };

      render(<DatePickerWithRange value={value} onChange={onChange} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', value.from.toISOString());
      expect(picker).toHaveAttribute('data-end-date', value.to.toISOString());

      const button = screen.getByRole('button', { name: 'Select Range' });
      await user.click(button);

      expect(onChange).toHaveBeenCalledWith({
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31')
      });
    });

    it('should work with all props together', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const value: DateRange = {
        from: new Date('2026-01-01'),
        to: new Date('2026-01-10')
      };

      render(
        <DatePickerWithRange
          value={value}
          onChange={onChange}
          className="full-featured"
          placeholder="Choose dates"
          disabled={false}
        />
      );

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-classname', 'full-featured');
      expect(picker).toHaveAttribute('data-placeholder', 'Choose dates');
      expect(picker).toHaveAttribute('data-disabled', 'false');

      const button = screen.getByRole('button', { name: 'Select Range' });
      await user.click(button);

      expect(onChange).toHaveBeenCalled();
    });

    it('should maintain state through multiple updates', () => {
      const onChange = jest.fn();
      const initialValue: DateRange = {
        from: new Date('2026-01-01'),
        to: new Date('2026-01-10')
      };

      const { rerender } = render(
        <DatePickerWithRange value={initialValue} onChange={onChange} />
      );

      const newValue: DateRange = {
        from: new Date('2026-02-01'),
        to: new Date('2026-02-28')
      };

      rerender(<DatePickerWithRange value={newValue} onChange={onChange} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', newValue.from.toISOString());
      expect(picker).toHaveAttribute('data-end-date', newValue.to.toISOString());
    });
  });

  describe('Edge Cases', () => {
    it('should handle same from and to dates', () => {
      const sameDate = new Date('2026-01-15');
      const value: DateRange = {
        from: sameDate,
        to: sameDate
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', sameDate.toISOString());
      expect(picker).toHaveAttribute('data-end-date', sameDate.toISOString());
    });

    it('should handle inverted range (to before from)', () => {
      const value: DateRange = {
        from: new Date('2026-01-20'),
        to: new Date('2026-01-10')
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-start-date', value.from.toISOString());
      expect(picker).toHaveAttribute('data-end-date', value.to.toISOString());
    });

    it('should handle dates far in the past', () => {
      const value: DateRange = {
        from: new Date('1900-01-01'),
        to: new Date('1900-12-31')
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toBeInTheDocument();
    });

    it('should handle dates far in the future', () => {
      const value: DateRange = {
        from: new Date('2100-01-01'),
        to: new Date('2100-12-31')
      };

      render(<DatePickerWithRange value={value} />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toBeInTheDocument();
    });

    it('should handle rapid value changes', () => {
      const { rerender } = render(<DatePickerWithRange />);

      for (let i = 1; i <= 10; i++) {
        const value: DateRange = {
          from: new Date(`2026-01-${i.toString().padStart(2, '0')}`),
          to: new Date(`2026-01-${(i + 5).toString().padStart(2, '0')}`)
        };
        rerender(<DatePickerWithRange value={value} />);
      }

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toBeInTheDocument();
    });

    it('should handle empty string className', () => {
      render(<DatePickerWithRange className="" />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-classname', '');
    });

    it('should handle empty string placeholder', () => {
      render(<DatePickerWithRange placeholder="" />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-placeholder', '');
    });

    it('should handle special characters in placeholder', () => {
      render(<DatePickerWithRange placeholder="Select <date> & time" />);

      const picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-placeholder', 'Select <date> & time');
    });

    it('should handle disabled toggle', () => {
      const { rerender } = render(<DatePickerWithRange disabled={false} />);

      let picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-disabled', 'false');

      rerender(<DatePickerWithRange disabled={true} />);

      picker = screen.getByTestId('shared-date-range-picker');
      expect(picker).toHaveAttribute('data-disabled', 'true');
    });
  });
});
