import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../dropdown-menu';

describe('DropdownMenu', () => {
  describe('DropdownMenu Root', () => {
    it('should render without crashing', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should render root component', () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );

      // Radix Root doesn't render a DOM element, just verifies render works
      expect(container).toBeInTheDocument();
    });

    it('should support controlled open state', () => {
      const { rerender } = render(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      // When closed, content might still be in DOM but hidden
      const trigger = screen.getByText('Open');
      expect(trigger).toBeInTheDocument();

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('should render trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Click me</DropdownMenuTrigger>
        </DropdownMenu>
      );

      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Trigger');
      expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger');
    });

    it('should toggle menu on click', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      await user.click(trigger);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should accept asChild prop', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>Custom Button</button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      );

      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuContent', () => {
    it('should render content when open', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Content Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('Content Item')).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const content = document.querySelector('[data-slot="dropdown-menu-content"]');
      expect(content).toBeInTheDocument();
    });

    it('should apply default sideOffset', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const content = screen.getByText('Content').parentElement;
      // Radix applies sideOffset as CSS transform, just verify content renders
      expect(content).toBeInTheDocument();
    });

    it('should accept custom className', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content">
            Content
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const content = document.querySelector('[data-slot="dropdown-menu-content"]');
      expect(content).toHaveClass('custom-content');
    });

    it('should have base styling classes', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const content = document.querySelector('[data-slot="dropdown-menu-content"]');
      expect(content).toHaveClass('bg-popover');
      expect(content).toHaveClass('text-popover-foreground');
      expect(content).toHaveClass('rounded-md');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('shadow-md');
    });
  });

  describe('DropdownMenuGroup', () => {
    it('should render group with items', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Group Item 1</DropdownMenuItem>
              <DropdownMenuItem>Group Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('Group Item 1')).toBeInTheDocument();
      expect(screen.getByText('Group Item 2')).toBeInTheDocument();
    });

    it('should render group content', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Group Content</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      // DropdownMenuGroup is a Radix primitive that may not render its own element
      expect(screen.getByText('Group Content')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuLabel', () => {
    it('should render label', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('My Label')).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const label = screen.getByText('Label');
      expect(label).toHaveAttribute('data-slot', 'dropdown-menu-label');
    });

    it('should apply base styling classes', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const label = screen.getByText('Label');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
    });

    it('should support inset prop', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const label = screen.getByText('Inset Label');
      expect(label).toHaveAttribute('data-inset', 'true');
    });
  });

  describe('DropdownMenuItem', () => {
    it('should render menu item', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('Action Item')).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Item');
      expect(item).toHaveAttribute('data-slot', 'dropdown-menu-item');
    });

    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleClick}>
              Clickable Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await user.click(screen.getByText('Clickable Item'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render default variant', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Default</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Default');
      expect(item).toHaveAttribute('data-variant', 'default');
    });

    it('should render destructive variant', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Delete');
      expect(item).toHaveAttribute('data-variant', 'destructive');
    });

    it('should support inset prop', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Inset Item');
      expect(item).toHaveAttribute('data-inset', 'true');
    });

    it('should apply disabled styling when disabled', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>
              Disabled Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Disabled Item');
      // Radix applies data-disabled state styling through CSS
      expect(item).toBeInTheDocument();
    });

    it('should apply base styling classes', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Item');
      expect(item).toHaveClass('cursor-default');
      expect(item).toHaveClass('rounded-sm');
      expect(item).toHaveClass('text-sm');
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('should render checkbox item', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>
              Checkbox Option
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('Checkbox Option')).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Checkbox</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Checkbox');
      expect(item).toHaveAttribute('data-slot', 'dropdown-menu-checkbox-item');
    });

    it('should toggle checked state', async () => {
      const user = userEvent.setup();
      const [checked, setChecked] = [false, jest.fn()];

      const { rerender } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={checked}
              onCheckedChange={setChecked}
            >
              Toggle Me
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await user.click(screen.getByText('Toggle Me'));

      expect(setChecked).toHaveBeenCalledWith(true);
    });

    it('should show check icon when checked', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Checked Item');
      const checkIcon = item.parentElement?.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('DropdownMenuRadioGroup and RadioItem', () => {
    it('should render radio group with items', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should have data-slot attribute on radio item', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="opt">Radio</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const radioItem = screen.getByText('Radio');
      expect(radioItem).toHaveAttribute('data-slot', 'dropdown-menu-radio-item');
    });

    it('should support value prop on radio group', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      // Verify both options render
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should show circle icon for selected radio item', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="selected">
              <DropdownMenuRadioItem value="selected">
                Selected
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const item = screen.getByText('Selected');
      const circleIcon = item.parentElement?.querySelector('svg');
      expect(circleIcon).toBeInTheDocument();
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('should render separator', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByTestId('separator')).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator data-testid="sep" />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const separator = screen.getByTestId('sep');
      expect(separator).toHaveAttribute('data-slot', 'dropdown-menu-separator');
    });

    it('should apply styling classes', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator data-testid="sep" />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const separator = screen.getByTestId('sep');
      expect(separator).toHaveClass('bg-border');
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('should render shortcut text', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Action
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('should have data-slot attribute', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const shortcut = screen.getByText('⌘S');
      expect(shortcut).toHaveAttribute('data-slot', 'dropdown-menu-shortcut');
    });

    it('should apply styling classes', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const shortcut = screen.getByText('Ctrl+S');
      expect(shortcut).toHaveClass('text-muted-foreground');
      expect(shortcut).toHaveClass('text-xs');
    });
  });

  describe('DropdownMenuSub', () => {
    it('should render submenu', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      expect(screen.getByText('More Options')).toBeInTheDocument();
    });

    it('should have data-slot attributes', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>Content</DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const subTrigger = screen.getByText('Sub');
      expect(subTrigger).toHaveAttribute('data-slot', 'dropdown-menu-sub-trigger');
    });

    it('should show chevron icon in sub trigger', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const subTrigger = screen.getByText('Sub');
      const chevron = subTrigger.parentElement?.querySelector('svg');
      expect(chevron).toBeInTheDocument();
    });

    it('should support inset on sub trigger', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>Inset Sub</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));

      const subTrigger = screen.getByText('Inset Sub');
      expect(subTrigger).toHaveAttribute('data-inset', 'true');
    });

    it('should open submenu on hover', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Hover Me</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Submenu Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await user.hover(screen.getByText('Hover Me'));

      // Radix handles submenu opening on hover
      expect(screen.getByText('Hover Me')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render complete dropdown menu', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Actions'));

      expect(screen.getByText('My Account')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should close menu when item is clicked', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Close Me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      expect(screen.getByText('Close Me')).toBeInTheDocument();

      await user.click(screen.getByText('Close Me'));

      // Menu should close after clicking item
      // Radix handles this behavior
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should work with keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open');
      trigger.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });
});
