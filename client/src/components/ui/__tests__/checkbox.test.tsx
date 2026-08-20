import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Checkbox data-testid="checkbox" />);
      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });

    it('should have checkbox role', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('data-slot', 'checkbox');
    });

    it('should render indicator element', () => {
      render(<Checkbox data-testid="checkbox" />);
      const indicator = document.querySelector('[data-slot="checkbox-indicator"]');
      expect(indicator).toBeInTheDocument();
    });

    it('should render CheckIcon inside indicator', () => {
      render(<Checkbox checked data-testid="checkbox" />);
      const indicator = document.querySelector('[data-slot="checkbox-indicator"]');
      const icon = indicator?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should be unchecked when checked is false', () => {
      render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should be checked when checked is true', () => {
      render(<Checkbox checked={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should support defaultChecked prop', () => {
      render(<Checkbox defaultChecked={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should toggle when clicked', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = jest.fn();

      render(<Checkbox onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should work as controlled component', () => {
      const { rerender } = render(<Checkbox checked={false} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();

      rerender(<Checkbox checked={true} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should support indeterminate state', () => {
      render(<Checkbox checked="indeterminate" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Checkbox disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('should not toggle when disabled and clicked', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Checkbox disabled onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleCheckedChange).not.toHaveBeenCalled();
    });

    it('should have disabled opacity styling', () => {
      render(<Checkbox disabled data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('disabled:opacity-50');
    });

    it('should have disabled cursor styling', () => {
      render(<Checkbox disabled data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Styling', () => {
    it('should have default styling classes', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('h-4');
      expect(checkbox).toHaveClass('w-4');
      expect(checkbox).toHaveClass('rounded');
      expect(checkbox).toHaveClass('border');
      expect(checkbox).toHaveClass('cursor-pointer');
    });

    it('should apply custom className', () => {
      render(<Checkbox className="custom-checkbox" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('custom-checkbox');
      expect(checkbox).toHaveClass('h-4'); // Should still have default classes
    });

    it('should have transition classes', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('transition-colors');
    });

    it('should have focus-visible ring classes', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('focus-visible:ring-2');
      expect(checkbox).toHaveClass('focus-visible:ring-ring');
    });

    it('should merge custom className with default classes', () => {
      render(<Checkbox className="my-2 mx-4" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('my-2');
      expect(checkbox).toHaveClass('mx-4');
      expect(checkbox).toHaveClass('h-4');
    });

    it('should have peer class for styling label', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('peer');
    });
  });

  describe('Indicator Styling', () => {
    it('should have indicator with default styling', () => {
      render(<Checkbox data-testid="checkbox" />);
      const indicator = document.querySelector('[data-slot="checkbox-indicator"]');
      expect(indicator).toHaveClass('flex');
      expect(indicator).toHaveClass('items-center');
      expect(indicator).toHaveClass('justify-center');
      expect(indicator).toHaveClass('text-current');
    });

    it('should have data-slot attribute on indicator', () => {
      render(<Checkbox data-testid="checkbox" />);
      const indicator = document.querySelector('[data-slot="checkbox-indicator"]');
      expect(indicator).toHaveAttribute('data-slot', 'checkbox-indicator');
    });
  });

  describe('Event Handlers', () => {
    it('should call onCheckedChange when checked', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Checkbox onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleCheckedChange).toHaveBeenCalledTimes(1);
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should call onCheckedChange with false when unchecking', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Checkbox defaultChecked onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleCheckedChange).toHaveBeenCalledWith(false);
    });

    it('should support keyboard interaction with Space', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Checkbox onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      await user.keyboard(' ');
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should support keyboard interaction with Enter', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Checkbox onCheckedChange={handleCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      await user.keyboard('{Enter}');
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Custom Props', () => {
    it('should accept data attributes', () => {
      render(<Checkbox data-testid="test-checkbox" data-custom="value" />);
      const checkbox = screen.getByTestId('test-checkbox');
      expect(checkbox).toHaveAttribute('data-custom', 'value');
    });

    it('should accept aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />);
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('should accept aria-labelledby', () => {
      render(
        <div>
          <label id="checkbox-label">I agree to terms</label>
          <Checkbox aria-labelledby="checkbox-label" />
        </div>
      );
      expect(screen.getByRole('checkbox')).toHaveAccessibleName('I agree to terms');
    });

    it('should accept id attribute', () => {
      render(<Checkbox id="custom-checkbox" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('id', 'custom-checkbox');
    });

    it('should accept name attribute for forms', () => {
      render(<Checkbox name="terms" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('name', 'terms');
    });

    it('should accept value attribute', () => {
      render(<Checkbox value="yes" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('value', 'yes');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('should have aria-checked attribute', () => {
      render(<Checkbox checked={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('should update aria-checked when toggled', async () => {
      const { rerender } = render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      rerender(<Checkbox checked={true} />);
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('should support aria-invalid for form validation', () => {
      render(<Checkbox aria-invalid data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    it('should accept required attribute', () => {
      render(<Checkbox required data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('required');
    });
  });

  describe('Form Integration', () => {
    it('should work within a form', () => {
      render(
        <form data-testid="form">
          <Checkbox name="accept-terms" />
        </form>
      );
      expect(screen.getByTestId('form')).toContainElement(screen.getByRole('checkbox'));
    });

    it('should have name attribute for form submission', () => {
      render(<Checkbox name="terms" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('name', 'terms');
    });

    it('should work with controlled state in forms', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Checkbox checked={false} onCheckedChange={handleChange} name="terms" />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should work with label element using htmlFor', () => {
      render(
        <div>
          <Checkbox id="terms-checkbox" />
          <label htmlFor="terms-checkbox">I accept the terms</label>
        </div>
      );

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('I accept the terms');

      expect(checkbox).toHaveAttribute('id', 'terms-checkbox');
      expect(label).toHaveAttribute('for', 'terms-checkbox');
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple checkbox', async () => {
      const user = userEvent.setup();
      render(<Checkbox aria-label="Subscribe to newsletter" />);

      const checkbox = screen.getByLabelText('Subscribe to newsletter');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      // Without handler, checkbox won't update (needs controlled state)
    });

    it('should work with inline label', () => {
      render(
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Checkbox id="newsletter" />
          <span>Subscribe to newsletter</span>
        </label>
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Subscribe to newsletter')).toBeInTheDocument();
    });

    it('should work in a form with multiple checkboxes', () => {
      render(
        <form>
          <div>
            <Checkbox id="email" name="notifications[]" value="email" />
            <label htmlFor="email">Email notifications</label>
          </div>
          <div>
            <Checkbox id="sms" name="notifications[]" value="sms" />
            <label htmlFor="sms">SMS notifications</label>
          </div>
        </form>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('should work with error state in forms', () => {
      render(<Checkbox aria-invalid aria-describedby="error-message" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
      expect(checkbox).toHaveAttribute('aria-describedby', 'error-message');
    });
  });

  describe('Combined States', () => {
    it('should handle checked and custom className', () => {
      render(<Checkbox checked={true} className="my-custom-class" data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toBeChecked();
      expect(checkbox).toHaveClass('my-custom-class');
    });

    it('should handle disabled and checked', () => {
      render(<Checkbox disabled checked={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toBeChecked();
    });

    it('should handle indeterminate and disabled', () => {
      render(<Checkbox checked="indeterminate" disabled data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
      expect(checkbox).toBeDisabled();
    });

    it('should handle all props together', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Checkbox
          checked={false}
          onCheckedChange={handleChange}
          className="custom-class"
          aria-label="Feature checkbox"
          name="feature"
          value="enabled"
          required
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
      expect(checkbox).toHaveClass('custom-class');
      expect(checkbox).toHaveAccessibleName('Feature checkbox');
      expect(checkbox).toHaveAttribute('name', 'feature');
      expect(checkbox).toHaveAttribute('value', 'enabled');
      expect(checkbox).toHaveAttribute('required');

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });
});
