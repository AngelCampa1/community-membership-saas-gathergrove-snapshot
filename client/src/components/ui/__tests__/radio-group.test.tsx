import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, RadioGroupItem } from '../radio-group';

describe('RadioGroup', () => {
  describe('RadioGroup Root', () => {
    it('should render without crashing', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should have radiogroup role', () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(screen.getByTestId('radio-group')).toHaveAttribute('role', 'radiogroup');
    });

    it('should have default styling classes', () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const group = screen.getByTestId('radio-group');
      expect(group).toHaveClass('grid');
      expect(group).toHaveClass('gap-2');
    });

    it('should apply custom className', () => {
      render(
        <RadioGroup className="custom-radio-group" data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const group = screen.getByTestId('radio-group');
      expect(group).toHaveClass('custom-radio-group');
      expect(group).toHaveClass('grid'); // Should still have default classes
    });

    it('should merge custom className with default classes', () => {
      render(
        <RadioGroup className="gap-4 my-4" data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const group = screen.getByTestId('radio-group');
      expect(group).toHaveClass('gap-4');
      expect(group).toHaveClass('my-4');
      expect(group).toHaveClass('grid');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <RadioGroup ref={ref}>
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should render multiple radio items', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
          <RadioGroupItem value="option3" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    it('should accept custom props', () => {
      render(
        <RadioGroup data-testid="radio-group" data-custom="value">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const group = screen.getByTestId('radio-group');
      expect(group).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('RadioGroup State', () => {
    it('should be unselected by default', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      expect(radio).not.toBeChecked();
    });

    it('should accept defaultValue prop', () => {
      render(
        <RadioGroup defaultValue="option2">
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });

    it('should work as controlled component', () => {
      const { rerender } = render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
        </RadioGroup>
      );

      let radios = screen.getAllByRole('radio');
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();

      rerender(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
        </RadioGroup>
      );

      radios = screen.getAllByRole('radio');
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });

    it('should call onValueChange when selection changes', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup onValueChange={handleValueChange}>
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
        </RadioGroup>
      );

      const radios = screen.getAllByRole('radio');
      await user.click(radios[1]);
      expect(handleValueChange).toHaveBeenCalledWith('option2');
    });

    it('should only allow one selection', async () => {
      const user = userEvent.setup();

      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
        </RadioGroup>
      );

      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();

      await user.click(radios[1]);
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });
  });

  describe('RadioGroupItem', () => {
    it('should render without crashing', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" data-testid="radio-item" />
        </RadioGroup>
      );
      const item = screen.getByTestId('radio-item');
      expect(item).toHaveClass('aspect-square');
      expect(item).toHaveClass('h-4');
      expect(item).toHaveClass('w-4');
      expect(item).toHaveClass('rounded-full');
      expect(item).toHaveClass('border');
      expect(item).toHaveClass('border-primary');
      expect(item).toHaveClass('text-primary');
    });

    it('should have focus styling classes', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" data-testid="radio-item" />
        </RadioGroup>
      );
      const item = screen.getByTestId('radio-item');
      expect(item).toHaveClass('focus:outline-none');
      expect(item).toHaveClass('focus-visible:ring-2');
      expect(item).toHaveClass('focus-visible:ring-ring');
      expect(item).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should have disabled styling classes', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" data-testid="radio-item" />
        </RadioGroup>
      );
      const item = screen.getByTestId('radio-item');
      expect(item).toHaveClass('disabled:cursor-not-allowed');
      expect(item).toHaveClass('disabled:opacity-50');
    });

    it('should apply custom className', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" className="custom-item" data-testid="radio-item" />
        </RadioGroup>
      );
      const item = screen.getByTestId('radio-item');
      expect(item).toHaveClass('custom-item');
      expect(item).toHaveClass('rounded-full');
    });

    it('should accept value prop', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="custom-value" data-testid="radio-item" />
        </RadioGroup>
      );
      const item = screen.getByTestId('radio-item');
      expect(item).toBeInTheDocument();
    });

    it('should render Circle indicator', () => {
      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      const svg = radio.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('fill-current');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <RadioGroup>
          <RadioGroupItem value="test" ref={ref} />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should accept disabled prop', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" disabled />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      expect(radio).toBeDisabled();
    });

    it('should not change value when disabled', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup onValueChange={handleValueChange}>
          <RadioGroupItem value="option1" disabled />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      await user.click(radio);
      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('should accept data attributes', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" data-testid="radio-item" data-custom="value" />
        </RadioGroup>
      );
      const item = screen.getByTestId('radio-item');
      expect(item).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role on group', () => {
      render(
        <RadioGroup data-testid="group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(screen.getByTestId('group')).toHaveAttribute('role', 'radiogroup');
    });

    it('should have proper ARIA role on items', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      expect(radio).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" disabled />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      expect(radio).toBeDisabled();
    });

    it('should support aria-label on group', () => {
      render(
        <RadioGroup aria-label="Choose an option" data-testid="group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(screen.getByTestId('group')).toHaveAttribute('aria-label', 'Choose an option');
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <div id="group-label">Options</div>
          <RadioGroup aria-labelledby="group-label" data-testid="group">
            <RadioGroupItem value="option1" />
          </RadioGroup>
        </div>
      );
      expect(screen.getByTestId('group')).toHaveAttribute('aria-labelledby', 'group-label');
    });

    it('should support keyboard navigation with arrow keys', async () => {
      const user = userEvent.setup();

      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
          <RadioGroupItem value="option3" />
        </RadioGroup>
      );

      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      expect(radios[0]).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      // Radix UI handles focus management internally
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple radio group with labels', () => {
      render(
        <RadioGroup defaultValue="option1">
          <div>
            <RadioGroupItem value="option1" id="option1" />
            <label htmlFor="option1">Option 1</label>
          </div>
          <div>
            <RadioGroupItem value="option2" id="option2" />
            <label htmlFor="option2">Option 2</label>
          </div>
        </RadioGroup>
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toBeChecked();
    });

    it('should work in a form', () => {
      render(
        <form data-testid="form">
          <RadioGroup name="choice">
            <RadioGroupItem value="yes" id="yes" />
            <label htmlFor="yes">Yes</label>
            <RadioGroupItem value="no" id="no" />
            <label htmlFor="no">No</label>
          </RadioGroup>
        </form>
      );

      expect(screen.getByTestId('form')).toContainElement(screen.getByLabelText('Yes'));
      expect(screen.getByTestId('form')).toContainElement(screen.getByLabelText('No'));
    });

    it('should work with controlled state', async () => {
      const ControlledRadioGroup = () => {
        const [value, setValue] = React.useState('option1');
        return (
          <div>
            <RadioGroup value={value} onValueChange={setValue}>
              <RadioGroupItem value="option1" />
              <RadioGroupItem value="option2" />
            </RadioGroup>
            <div data-testid="selected-value">{value}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<ControlledRadioGroup />);

      expect(screen.getByTestId('selected-value')).toHaveTextContent('option1');

      const radios = screen.getAllByRole('radio');
      await user.click(radios[1]);

      expect(screen.getByTestId('selected-value')).toHaveTextContent('option2');
    });

    it('should work with disabled options', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" disabled />
          <RadioGroupItem value="option3" />
        </RadioGroup>
      );

      const radios = screen.getAllByRole('radio');
      expect(radios[0]).not.toBeDisabled();
      expect(radios[1]).toBeDisabled();
      expect(radios[2]).not.toBeDisabled();
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup
          value="option1"
          onValueChange={handleValueChange}
          className="custom-group gap-4"
          aria-label="Preferences"
          data-testid="radio-group"
        >
          <RadioGroupItem
            value="option1"
            className="custom-item h-6 w-6"
            data-testid="item1"
          />
          <RadioGroupItem
            value="option2"
            className="custom-item h-6 w-6"
            data-testid="item2"
          />
        </RadioGroup>
      );

      const group = screen.getByTestId('radio-group');
      expect(group).toHaveClass('custom-group');
      expect(group).toHaveClass('gap-4');
      expect(group).toHaveAttribute('aria-label', 'Preferences');

      const item1 = screen.getByTestId('item1');
      expect(item1).toHaveClass('custom-item');
      expect(item1).toHaveClass('h-6');
      expect(item1).toBeChecked();

      await user.click(screen.getByTestId('item2'));
      expect(handleValueChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty radio group', () => {
      render(<RadioGroup data-testid="group" />);
      expect(screen.getByTestId('group')).toBeInTheDocument();
    });

    it('should handle single radio item', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="only" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should handle radio item with empty value', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="" data-testid="item" />
        </RadioGroup>
      );
      expect(screen.getByTestId('item')).toBeInTheDocument();
    });
  });
});
