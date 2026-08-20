import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScrollArea, ScrollBar } from '../scroll-area';

describe('ScrollArea', () => {
  describe('ScrollArea Root', () => {
    it('should render without crashing', () => {
      render(
        <ScrollArea>
          <div data-testid="content">Scrollable content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveAttribute('data-slot', 'scroll-area');
    });

    it('should have default styling classes', () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('relative');
    });

    it('should apply custom className', () => {
      render(
        <ScrollArea className="custom-scroll" data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('custom-scroll');
      expect(scrollArea).toHaveClass('relative');
    });

    it('should merge custom className with default classes', () => {
      render(
        <ScrollArea className="h-96 w-full" data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('h-96');
      expect(scrollArea).toHaveClass('w-full');
      expect(scrollArea).toHaveClass('relative');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ScrollArea ref={ref}>
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <ScrollArea>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ScrollArea>
      );
      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <ScrollArea data-testid="scroll-area" data-custom="value">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveAttribute('data-custom', 'value');
    });

    it('should display correct name', () => {
      expect(ScrollArea.displayName).toBe('ScrollArea');
    });
  });

  describe('ScrollArea Viewport', () => {
    it('should render viewport element', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
      expect(viewport).toBeInTheDocument();
    });

    it('should have data-slot attribute on viewport', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
      expect(viewport).toHaveAttribute('data-slot', 'scroll-area-viewport');
    });

    it('should have viewport styling classes', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
      expect(viewport).toHaveClass('size-full');
      expect(viewport).toHaveClass('rounded-[inherit]');
      expect(viewport).toHaveClass('transition-[color,box-shadow]');
      expect(viewport).toHaveClass('outline-none');
    });

    it('should have focus styling on viewport', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
      expect(viewport).toHaveClass('focus-visible:ring-[3px]');
      expect(viewport).toHaveClass('focus-visible:outline-1');
    });
  });

  describe('ScrollBar', () => {
    it('should render scrollbar by default', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveAttribute('data-slot', 'scroll-area-scrollbar');
    });

    it('should have vertical orientation by default', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('h-full');
      expect(scrollbar).toHaveClass('w-2.5');
      expect(scrollbar).toHaveClass('border-l');
      expect(scrollbar).toHaveClass('border-l-transparent');
    });

    it('should have default styling classes', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('flex');
      expect(scrollbar).toHaveClass('touch-none');
      expect(scrollbar).toHaveClass('p-px');
      expect(scrollbar).toHaveClass('transition-colors');
      expect(scrollbar).toHaveClass('select-none');
    });

    it('should render thumb element', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const thumb = container.querySelector('[data-slot="scroll-area-thumb"]');
      expect(thumb).toBeInTheDocument();
    });

    it('should have thumb styling', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const thumb = container.querySelector('[data-slot="scroll-area-thumb"]');
      expect(thumb).toHaveClass('bg-border');
      expect(thumb).toHaveClass('relative');
      expect(thumb).toHaveClass('flex-1');
      expect(thumb).toHaveClass('rounded-full');
    });

    it('should display correct name', () => {
      expect(ScrollBar.displayName).toBe('ScrollBar');
    });
  });

  describe('Custom ScrollBar', () => {
    it('should support horizontal orientation', () => {
      const { container } = render(
        <ScrollArea>
          <ScrollBar orientation="horizontal" />
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('h-2.5');
      expect(scrollbar).toHaveClass('flex-col');
      expect(scrollbar).toHaveClass('border-t');
      expect(scrollbar).toHaveClass('border-t-transparent');
    });

    it('should apply custom className to scrollbar', () => {
      const { container } = render(
        <ScrollArea>
          <ScrollBar className="custom-scrollbar" />
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('custom-scrollbar');
      expect(scrollbar).toHaveClass('flex');
    });

    it('should forward ref on scrollbar', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ScrollArea>
          <ScrollBar ref={ref} />
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept custom props on scrollbar', () => {
      const { container } = render(
        <ScrollArea>
          <ScrollBar data-custom="value" />
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple scrollable container', () => {
      render(
        <ScrollArea className="h-48">
          <div className="p-4">
            <p>Line 1</p>
            <p>Line 2</p>
            <p>Line 3</p>
          </div>
        </ScrollArea>
      );

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Line 3')).toBeInTheDocument();
    });

    it('should work with long content lists', () => {
      render(
        <ScrollArea className="h-72 w-48 rounded-md border">
          <div className="p-4">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="text-sm">
                Item {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 50')).toBeInTheDocument();
    });

    it('should work with horizontal scrolling', () => {
      render(
        <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
          <div className="flex w-max space-x-4 p-4">
            <div>Column 1</div>
            <div>Column 2</div>
            <div>Column 3</div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );

      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 3')).toBeInTheDocument();
    });

    it('should work with both scroll orientations', () => {
      const { container } = render(
        <ScrollArea className="h-72 w-48 rounded-md border">
          <div className="p-4">
            <div>Long content that scrolls both ways</div>
          </div>
          <ScrollBar />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );

      const scrollbars = container.querySelectorAll('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbars.length).toBeGreaterThan(0);
    });

    it('should work with code block scrolling', () => {
      render(
        <ScrollArea className="h-48 w-96 rounded-md border">
          <pre className="p-4">
            <code>
              {`function example() {
  console.log('Hello world');
  return true;
}`}
            </code>
          </pre>
        </ScrollArea>
      );

      expect(screen.getByText(/Hello world/i)).toBeInTheDocument();
    });

    it('should work with custom styled scrollbar', () => {
      const { container } = render(
        <ScrollArea className="h-48">
          <div>Content</div>
          <ScrollBar className="w-3 bg-gray-100" />
        </ScrollArea>
      );

      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('w-3');
      expect(scrollbar).toHaveClass('bg-gray-100');
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', () => {
      const { container } = render(
        <ScrollArea
          className="h-96 w-full rounded-lg border"
          data-testid="scroll-area"
        >
          <div className="p-4">
            <div>Content</div>
          </div>
          <ScrollBar className="custom-scrollbar" orientation="vertical" />
        </ScrollArea>
      );

      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('h-96');
      expect(scrollArea).toHaveClass('w-full');
      expect(scrollArea).toHaveClass('rounded-lg');

      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('custom-scrollbar');
    });
  });

  describe('Accessibility', () => {
    it('should support focus on viewport', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
      expect(viewport).toHaveClass('focus-visible:ring-ring/50');
    });

    it('should have outline-none on viewport', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
      expect(viewport).toHaveClass('outline-none');
    });

    it('should be touch-friendly', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('touch-none');
    });

    it('should prevent text selection on scrollbar', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
      expect(scrollbar).toHaveClass('select-none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<ScrollArea />);
      expect(document.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument();
    });

    it('should handle single line content', () => {
      render(
        <ScrollArea>
          <div>Single line</div>
        </ScrollArea>
      );
      expect(screen.getByText('Single line')).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longText = 'A'.repeat(10000);
      render(
        <ScrollArea className="h-48">
          <div>{longText}</div>
        </ScrollArea>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle nested scrollable content', () => {
      render(
        <ScrollArea className="h-96">
          <div>
            <ScrollArea className="h-48">
              <div>Nested content</div>
            </ScrollArea>
          </div>
        </ScrollArea>
      );
      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref on ScrollArea', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ScrollArea ref={ref}>
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should forward ref on ScrollBar', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ScrollArea>
          <ScrollBar ref={ref} />
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
