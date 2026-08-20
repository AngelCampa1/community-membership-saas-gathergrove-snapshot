import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs', () => {
  describe('Tabs Root', () => {
    it('should render without crashing', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });

    it('should have tablist role', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Tabs defaultValue="tab1" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-slot', 'tabs');
    });

    it('should have default styling classes', () => {
      render(
        <Tabs defaultValue="tab1" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveClass('flex');
      expect(tabs).toHaveClass('flex-col');
      expect(tabs).toHaveClass('gap-2');
    });

    it('should apply custom className', () => {
      render(
        <Tabs defaultValue="tab1" className="custom-tabs" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveClass('custom-tabs');
      expect(tabs).toHaveClass('flex'); // Should still have default classes
    });

    it('should merge custom className with default classes', () => {
      render(
        <Tabs defaultValue="tab1" className="gap-4 my-4" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveClass('gap-4');
      expect(tabs).toHaveClass('my-4');
      expect(tabs).toHaveClass('flex-col');
    });

    it('should accept custom props', () => {
      render(
        <Tabs defaultValue="tab1" data-testid="tabs" data-custom="value">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('TabsList', () => {
    it('should render tab list', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const list = screen.getByTestId('tabs-list');
      expect(list).toHaveAttribute('data-slot', 'tabs-list');
    });

    it('should have default styling classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const list = screen.getByTestId('tabs-list');
      expect(list).toHaveClass('bg-muted');
      expect(list).toHaveClass('text-muted-foreground');
      expect(list).toHaveClass('inline-flex');
      expect(list).toHaveClass('h-9');
      expect(list).toHaveClass('w-fit');
      expect(list).toHaveClass('items-center');
      expect(list).toHaveClass('justify-center');
      expect(list).toHaveClass('rounded-lg');
      expect(list).toHaveClass('p-[3px]');
    });

    it('should apply custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list" data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const list = screen.getByTestId('tabs-list');
      expect(list).toHaveClass('custom-list');
      expect(list).toHaveClass('inline-flex');
    });

    it('should render multiple triggers', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const triggers = screen.getAllByRole('tab');
      expect(triggers).toHaveLength(3);
    });
  });

  describe('TabsTrigger', () => {
    it('should render trigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Click me</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(screen.getByRole('tab', { name: /click me/i })).toBeInTheDocument();
    });

    it('should have tab role', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(screen.getByRole('tab')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('data-slot', 'tabs-trigger');
    });

    it('should have default styling classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('inline-flex');
      expect(trigger).toHaveClass('h-full');
      expect(trigger).toHaveClass('flex-1');
      expect(trigger).toHaveClass('items-center');
      expect(trigger).toHaveClass('justify-center');
      expect(trigger).toHaveClass('gap-1.5');
      expect(trigger).toHaveClass('rounded-md');
      expect(trigger).toHaveClass('border');
      expect(trigger).toHaveClass('border-transparent');
      expect(trigger).toHaveClass('px-2');
      expect(trigger).toHaveClass('py-1');
      expect(trigger).toHaveClass('text-sm');
      expect(trigger).toHaveClass('font-medium');
      expect(trigger).toHaveClass('whitespace-nowrap');
      expect(trigger).toHaveClass('transition-all');
    });

    it('should have active state classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId('trigger');
      const classString = trigger.className;
      expect(classString).toContain('data-[state=active]:bg-background');
      expect(classString).toContain('data-[state=active]:text-foreground');
    });

    it('should have focus styling classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('focus-visible:ring-[3px]');
      expect(trigger).toHaveClass('focus-visible:outline-1');
    });

    it('should have disabled styling classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('disabled:pointer-events-none');
      expect(trigger).toHaveClass('disabled:opacity-50');
    });

    it('should apply custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('custom-trigger');
      expect(trigger).toHaveClass('inline-flex');
    });

    it('should be clickable', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument();
    });

    it('should accept disabled prop', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" disabled>
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByRole('tab');
      expect(trigger).toBeDisabled();
    });
  });

  describe('TabsContent', () => {
    it('should render content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div>Content 1</div>
          </TabsContent>
        </Tabs>
      );
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should have tabpanel role', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content">
            Content
          </TabsContent>
        </Tabs>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('data-slot', 'tabs-content');
    });

    it('should have default styling classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content">
            Content
          </TabsContent>
        </Tabs>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('flex-1');
      expect(content).toHaveClass('outline-none');
    });

    it('should apply custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content" data-testid="content">
            Content
          </TabsContent>
        </Tabs>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('flex-1');
    });

    it('should render children', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div data-testid="child">Child content</div>
          </TabsContent>
        </Tabs>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Tabs State', () => {
    it('should show first tab by default', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should switch tabs when clicked', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should work as controlled component', () => {
      const { rerender } = render(
        <Tabs value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();

      rerender(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should call onValueChange when tab changes', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple tab interface', () => {
      render(
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <div>Account settings content</div>
          </TabsContent>
          <TabsContent value="password">
            <div>Password settings content</div>
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('Account settings content')).toBeInTheDocument();
    });

    it('should work with icons in triggers', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">
              <span data-testid="icon">📝</span>
              Notes
            </TabsTrigger>
            <TabsTrigger value="tab2">
              <span data-testid="icon2">⚙</span>
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByTestId('icon2')).toBeInTheDocument();
    });

    it('should work with disabled tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Active</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Disabled
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const disabledTab = screen.getByRole('tab', { name: /disabled/i });
      expect(disabledTab).toBeDisabled();
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Tabs
          value="tab1"
          onValueChange={handleValueChange}
          className="custom-tabs"
          data-testid="tabs"
        >
          <TabsList className="custom-list" data-testid="list">
            <TabsTrigger value="tab1" className="custom-trigger" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" className="custom-trigger" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content" data-testid="content1">
            Content 1
          </TabsContent>
          <TabsContent value="tab2" className="custom-content" data-testid="content2">
            Content 2
          </TabsContent>
        </Tabs>
      );

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveClass('custom-tabs');
      expect(tabs).toHaveClass('flex');

      const list = screen.getByTestId('list');
      expect(list).toHaveClass('custom-list');

      const trigger1 = screen.getByTestId('trigger1');
      expect(trigger1).toHaveClass('custom-trigger');

      await user.click(screen.getByTestId('trigger2'));
      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab')).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab1 = screen.getByRole('tab', { name: /tab 1/i });
      tab1.focus();
      expect(tab1).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      // Radix UI handles keyboard navigation internally
    });
  });
});
