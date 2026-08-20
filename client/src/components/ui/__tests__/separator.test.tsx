import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from '../separator';

describe('Separator', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Separator data-testid="separator" />);
      expect(screen.getByTestId('separator')).toBeInTheDocument();
    });

    it('should render with default orientation', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  describe('Orientation', () => {
    it('should render horizontal by default', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('should render horizontal when orientation is horizontal', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('should render vertical when orientation is vertical', () => {
      render(<Separator orientation="vertical" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });

    it('should apply horizontal styles by default', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('h-[1px]');
      expect(separator).toHaveClass('w-full');
    });

    it('should apply horizontal styles when orientation is horizontal', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('h-[1px]');
      expect(separator).toHaveClass('w-full');
    });

    it('should apply vertical styles when orientation is vertical', () => {
      render(<Separator orientation="vertical" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('h-full');
      expect(separator).toHaveClass('w-[1px]');
    });
  });

  describe('Decorative Prop', () => {
    it('should accept decorative prop as true by default', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toBeInTheDocument();
    });

    it('should accept decorative prop explicitly', () => {
      render(<Separator decorative={true} data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toBeInTheDocument();
    });

    it('should accept decorative as false', () => {
      render(<Separator decorative={false} data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have default styling classes', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('shrink-0');
      expect(separator).toHaveClass('bg-border');
    });

    it('should apply custom className', () => {
      render(<Separator className="custom-separator" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('custom-separator');
      expect(separator).toHaveClass('shrink-0'); // Should still have default classes
    });

    it('should merge custom className with default classes', () => {
      render(<Separator className="my-2 mx-4" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('my-2');
      expect(separator).toHaveClass('mx-4');
      expect(separator).toHaveClass('bg-border');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = React.createRef<React.ElementRef<'div'>>();
      render(<Separator ref={ref} data-testid="separator" />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current).toBe(screen.getByTestId('separator'));
    });

    it('should allow ref access to DOM element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Separator ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Custom Props', () => {
    it('should accept data attributes', () => {
      render(<Separator data-testid="test-separator" data-custom="value" />);
      const separator = screen.getByTestId('test-separator');
      expect(separator).toHaveAttribute('data-custom', 'value');
    });

    it('should accept aria attributes', () => {
      render(<Separator aria-label="Content divider" decorative={false} />);
      expect(screen.getByLabelText('Content divider')).toBeInTheDocument();
    });

    it('should accept id attribute', () => {
      render(<Separator id="custom-separator" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('id', 'custom-separator');
    });
  });

  describe('Combined Props', () => {
    it('should handle vertical orientation with custom className', () => {
      render(<Separator orientation="vertical" className="bg-gray-500" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
      expect(separator).toHaveClass('h-full');
      expect(separator).toHaveClass('w-[1px]');
      expect(separator).toHaveClass('bg-gray-500');
    });

    it('should handle non-decorative with horizontal orientation', () => {
      render(<Separator decorative={false} orientation="horizontal" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).not.toHaveAttribute('aria-hidden', 'true');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
      expect(separator).toHaveClass('h-[1px]');
    });

    it('should handle all custom props together', () => {
      render(
        <Separator
          orientation="vertical"
          decorative={false}
          className="my-custom-class"
          data-testid="separator"
          aria-label="Divider"
        />
      );
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
      expect(separator).not.toHaveAttribute('aria-hidden', 'true');
      expect(separator).toHaveClass('my-custom-class');
      expect(separator).toHaveAccessibleName('Divider');
    });
  });

  describe('Display Name', () => {
    it('should have correct display name', () => {
      expect(Separator.displayName).toBeDefined();
      expect(typeof Separator.displayName).toBe('string');
    });
  });

  describe('Accessibility', () => {
    it('should render with proper orientation attribute', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('should support aria-label when not decorative', () => {
      render(<Separator decorative={false} aria-label="Section divider" />);
      expect(screen.getByLabelText('Section divider')).toBeInTheDocument();
    });

    it('should support vertical orientation attribute', () => {
      render(<Separator orientation="vertical" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });

    it('should be accessible with proper labeling', () => {
      render(<Separator decorative={false} aria-label="Content divider" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAccessibleName('Content divider');
    });
  });

  describe('Usage Examples', () => {
    it('should work as horizontal divider between content', () => {
      render(
        <div>
          <div>Content 1</div>
          <Separator data-testid="separator" />
          <div>Content 2</div>
        </div>
      );
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should work as vertical divider in flex layout', () => {
      render(
        <div style={{ display: 'flex' }}>
          <div>Left</div>
          <Separator orientation="vertical" data-testid="separator" />
          <div>Right</div>
        </div>
      );
      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
    });

    it('should work with semantic sections', () => {
      render(
        <article>
          <section>
            <h2>Section 1</h2>
            <p>Content</p>
          </section>
          <Separator decorative={false} aria-label="End of section 1" />
          <section>
            <h2>Section 2</h2>
            <p>Content</p>
          </section>
        </article>
      );
      expect(screen.getByLabelText('End of section 1')).toBeInTheDocument();
    });
  });
});
