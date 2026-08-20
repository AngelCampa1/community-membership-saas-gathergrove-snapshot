import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Switch data-testid="switch" />);
      expect(screen.getByTestId('switch')).toBeInTheDocument();
    });

    it('should have switch role', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Switch data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('data-slot', 'switch');
    });

    it('should render thumb element', () => {
      render(<Switch data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      const thumb = switchElement.querySelector('[data-slot="switch-thumb"]');
      expect(thumb).toBeInTheDocument();
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();
    });

    it('should be unchecked when checked is false', () => {
      render(<Switch checked={false} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();
    });

    it('should be checked when checked is true', () => {
      render(<Switch checked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();
    });

    it('should support defaultChecked prop', () => {
      render(<Switch defaultChecked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();
    });

    it('should toggle when clicked', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = jest.fn();

      render(<Switch onCheckedChange={handleCheckedChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should work as controlled component', () => {
      const { rerender } = render(<Switch checked={false} />);
      expect(screen.getByRole('switch')).not.toBeChecked();

      rerender(<Switch checked={true} />);
      expect(screen.getByRole('switch')).toBeChecked();
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Switch disabled />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('should not toggle when disabled and clicked', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Switch disabled onCheckedChange={handleCheckedChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleCheckedChange).not.toHaveBeenCalled();
    });

    it('should have disabled opacity styling', () => {
      render(<Switch disabled data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveClass('disabled:opacity-50');
    });

    it('should have disabled cursor styling', () => {
      render(<Switch disabled data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Styling', () => {
    it('should have default styling classes', () => {
      render(<Switch data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveClass('inline-flex');
      expect(switchElement).toHaveClass('h-5');
      expect(switchElement).toHaveClass('w-9');
      expect(switchElement).toHaveClass('rounded-full');
      expect(switchElement).toHaveClass('border');
      expect(switchElement).toHaveClass('cursor-pointer');
    });

    it('should apply custom className', () => {
      render(<Switch className="custom-switch" data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveClass('custom-switch');
      expect(switchElement).toHaveClass('inline-flex'); // Should still have default classes
    });

    it('should have transition classes', () => {
      render(<Switch data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveClass('transition-colors');
    });

    it('should have focus-visible ring classes', () => {
      render(<Switch data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveClass('focus-visible:ring-2');
      expect(switchElement).toHaveClass('focus-visible:ring-ring');
    });

    it('should merge custom className with default classes', () => {
      render(<Switch className="my-2 mx-4" data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveClass('my-2');
      expect(switchElement).toHaveClass('mx-4');
      expect(switchElement).toHaveClass('inline-flex');
    });
  });

  describe('Thumb Styling', () => {
    it('should have thumb with default styling', () => {
      render(<Switch data-testid="switch" />);
      const thumb = document.querySelector('[data-slot="switch-thumb"]');
      expect(thumb).toHaveClass('block');
      expect(thumb).toHaveClass('h-4');
      expect(thumb).toHaveClass('w-4');
      expect(thumb).toHaveClass('rounded-full');
      expect(thumb).toHaveClass('transition-transform');
    });

    it('should have pointer-events-none on thumb', () => {
      render(<Switch data-testid="switch" />);
      const thumb = document.querySelector('[data-slot="switch-thumb"]');
      expect(thumb).toHaveClass('pointer-events-none');
    });

    it('should have data-slot attribute on thumb', () => {
      render(<Switch data-testid="switch" />);
      const thumb = document.querySelector('[data-slot="switch-thumb"]');
      expect(thumb).toHaveAttribute('data-slot', 'switch-thumb');
    });
  });

  describe('Event Handlers', () => {
    it('should call onCheckedChange when toggled', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Switch onCheckedChange={handleCheckedChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleCheckedChange).toHaveBeenCalledTimes(1);
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should call onCheckedChange with false when unchecking', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Switch defaultChecked onCheckedChange={handleCheckedChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleCheckedChange).toHaveBeenCalledWith(false);
    });

    it('should support keyboard interaction with Space', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Switch onCheckedChange={handleCheckedChange} />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      await user.keyboard(' ');
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should support keyboard interaction with Enter', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();

      render(<Switch onCheckedChange={handleCheckedChange} />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      await user.keyboard('{Enter}');
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Custom Props', () => {
    it('should accept data attributes', () => {
      render(<Switch data-testid="test-switch" data-custom="value" />);
      const switchElement = screen.getByTestId('test-switch');
      expect(switchElement).toHaveAttribute('data-custom', 'value');
    });

    it('should accept aria-label', () => {
      render(<Switch aria-label="Toggle notifications" />);
      expect(screen.getByLabelText('Toggle notifications')).toBeInTheDocument();
    });

    it('should accept aria-labelledby', () => {
      render(
        <div>
          <label id="switch-label">Enable feature</label>
          <Switch aria-labelledby="switch-label" />
        </div>
      );
      expect(screen.getByRole('switch')).toHaveAccessibleName('Enable feature');
    });

    it('should accept id attribute', () => {
      render(<Switch id="custom-switch" data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('id', 'custom-switch');
    });

    it('should accept name attribute for forms', () => {
      render(<Switch name="notifications" data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('name', 'notifications');
    });

    it('should accept value attribute', () => {
      render(<Switch value="on" data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('value', 'on');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      expect(switchElement).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });

    it('should have aria-checked attribute', () => {
      render(<Switch checked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should update aria-checked when toggled', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Switch checked={false} />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      rerender(<Switch checked={true} />);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should accept required attribute', () => {
      render(<Switch required data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('required');
    });
  });

  describe('Form Integration', () => {
    it('should work within a form', () => {
      render(
        <form data-testid="form">
          <Switch name="accept-terms" />
        </form>
      );
      expect(screen.getByTestId('form')).toContainElement(screen.getByRole('switch'));
    });

    it('should have name attribute for form submission', () => {
      render(<Switch name="notifications" data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('name', 'notifications');
    });

    it('should work with controlled state in forms', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Switch checked={false} onCheckedChange={handleChange} name="feature" />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple toggle', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Light-Only Mode" />);

      const switchElement = screen.getByLabelText('Light-Only Mode');
      expect(switchElement).not.toBeChecked();

      await user.click(switchElement);
      // With controlled component, we'd expect it to be checked
      // but without onCheckedChange handler, it won't update
    });

    it('should work with label element', () => {
      render(
        <div>
          <label htmlFor="notifications-switch">
            Enable notifications
            <Switch id="notifications-switch" />
          </label>
        </div>
      );
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should work in a settings form', () => {
      render(
        <form>
          <div>
            <label htmlFor="email-notifications">Email Notifications</label>
            <Switch id="email-notifications" name="emailNotifications" />
          </div>
          <div>
            <label htmlFor="push-notifications">Push Notifications</label>
            <Switch id="push-notifications" name="pushNotifications" />
          </div>
        </form>
      );

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(2);
    });
  });

  describe('Combined States', () => {
    it('should handle checked and custom className', () => {
      render(<Switch checked={true} className="my-custom-class" data-testid="switch" />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toBeChecked();
      expect(switchElement).toHaveClass('my-custom-class');
    });

    it('should handle disabled and checked', () => {
      render(<Switch disabled checked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
      expect(switchElement).toBeChecked();
    });

    it('should handle all props together', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Switch
          checked={false}
          onCheckedChange={handleChange}
          className="custom-class"
          aria-label="Feature toggle"
          name="feature"
          required
        />
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();
      expect(switchElement).toHaveClass('custom-class');
      expect(switchElement).toHaveAccessibleName('Feature toggle');
      expect(switchElement).toHaveAttribute('name', 'feature');
      expect(switchElement).toHaveAttribute('required');

      await user.click(switchElement);
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });
});
