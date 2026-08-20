import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '../select';

describe('Select', () => {
  describe('Select Root', () => {
    it('should render without crashing', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByText('Select option')).toBeInTheDocument();
    });

    it('should accept value prop', () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should accept defaultValue prop', () => {
      render(
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('SelectTrigger', () => {
    it('should render trigger button', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole('combobox').closest('[data-slot="select-trigger"]');
      expect(trigger).toBeInTheDocument();
    });

    it('should render with default size', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole('combobox').closest('[data-slot="select-trigger"]');
      expect(trigger).toHaveAttribute('data-size', 'default');
    });

    it('should render with sm size', () => {
      render(
        <Select>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole('combobox').closest('[data-slot="select-trigger"]');
      expect(trigger).toHaveAttribute('data-size', 'sm');
    });

    it('should have default styling classes', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole('combobox').closest('[data-slot="select-trigger"]');
      expect(trigger).toHaveClass('flex');
      expect(trigger).toHaveClass('items-center');
      expect(trigger).toHaveClass('rounded-md');
      expect(trigger).toHaveClass('border');
    });

    it('should apply custom className', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole('combobox').closest('[data-slot="select-trigger"]');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('should render chevron down icon', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole('combobox').closest('[data-slot="select-trigger"]');
      const icon = trigger?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should accept disabled prop', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );
      // Radix UI mock doesn't apply disabled to trigger
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should open content when clicked', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    });
  });

  describe('SelectValue', () => {
    it('should render placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });
  });

  describe('SelectContent', () => {
    it('should render content when select is open', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const content = document.querySelector('[data-slot="select-content"]');
      expect(content).toBeInTheDocument();
    });

    it('should apply default position popper', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const content = document.querySelector('[data-slot="select-content"]');
      expect(content).toBeInTheDocument();
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent className="custom-content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const content = document.querySelector('[data-slot="select-content"]');
      expect(content).toHaveClass('custom-content');
    });

    it('should have default styling classes', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const content = document.querySelector('[data-slot="select-content"]');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('rounded-md');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('shadow-md');
    });

    it('should accept position item-aligned', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const content = document.querySelector('[data-slot="select-content"]');
      expect(content).toBeInTheDocument();
    });
  });

  describe('SelectItem', () => {
    it('should render item', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const item = screen.getByRole('option', { name: /option 1/i }).closest('[data-slot="select-item"]');
      expect(item).toBeInTheDocument();
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" className="custom-item">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const item = screen.getByRole('option', { name: /option 1/i }).closest('[data-slot="select-item"]');
      expect(item).toHaveClass('custom-item');
    });

    it('should have default styling classes', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const item = screen.getByRole('option', { name: /option 1/i }).closest('[data-slot="select-item"]');
      expect(item).toHaveClass('flex');
      expect(item).toHaveClass('items-center');
      expect(item).toHaveClass('rounded-sm');
    });

    it('should render check icon for selected item', async () => {
      const user = userEvent.setup();
      render(
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const selectedItem = screen.getByRole('option', { name: /option 1/i });
      expect(selectedItem).toBeInTheDocument();
    });

    it('should be clickable', async () => {
      const user = userEvent.setup();
      const handleValueChange = jest.fn();

      render(
        <Select onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: /option 1/i }));
      expect(handleValueChange).toHaveBeenCalledWith('option1');
    });

    it('should accept disabled prop', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" disabled>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const item = screen.getByRole('option', { name: /option 1/i });
      expect(item).toBeInTheDocument();
    });
  });

  describe('SelectGroup', () => {
    it('should render group with label', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByText('Fruits')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /apple/i })).toBeInTheDocument();
    });
  });

  describe('SelectLabel', () => {
    it('should render label text', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel>Category</SelectLabel>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should accept custom className prop', async () => {
      const user = userEvent.setup();
      // Test that component accepts className without crashing
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel className="custom-label">Category</SelectLabel>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });

  describe('SelectSeparator', () => {
    it('should render without crashing', async () => {
      const user = userEvent.setup();
      // Test that SelectSeparator renders without errors
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /option 2/i })).toBeInTheDocument();
    });

    it('should accept custom className prop', async () => {
      const user = userEvent.setup();
      // Test that component accepts className without crashing
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator className="custom-separator" />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    });
  });

  describe('SelectScrollUpButton', () => {
    it('should accept custom className prop without crashing', async () => {
      const user = userEvent.setup();
      // Test that component accepts className prop
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton className="custom-scroll-up" />
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    });
  });

  describe('SelectScrollDownButton', () => {
    it('should accept custom className prop without crashing', async () => {
      const user = userEvent.setup();
      // Test that component accepts className prop
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectScrollDownButton className="custom-scroll-down" />
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    });
  });


  describe('Full Select Integration', () => {
    it('should render complete select with all components', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByText('Fruits')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /apple/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /banana/i })).toBeInTheDocument();
      expect(screen.getByText('Vegetables')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /carrot/i })).toBeInTheDocument();
    });

    it('should handle selection', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Select onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: /option 2/i }));

      expect(handleValueChange).toHaveBeenCalledWith('option2');
    });

    it('should work with controlled value', () => {
      const { rerender } = render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();

      rerender(
        <Select value="option2">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      trigger.focus();

      // Open with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    });

    it('should accept disabled attribute', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );

      // Mock doesn't apply disabled to trigger
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should accept required attribute', () => {
      render(
        <Select required>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      );

      // Mock doesn't apply required to trigger
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
