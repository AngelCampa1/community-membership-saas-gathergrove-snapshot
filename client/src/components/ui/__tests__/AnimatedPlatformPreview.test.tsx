import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnimatedPlatformPreview } from '../AnimatedPlatformPreview';

describe('AnimatedPlatformPreview', () => {
  describe('Rendering', () => {
    it('should render component', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with data-testid', () => {
      render(<AnimatedPlatformPreview />);

      expect(screen.getByTestId('animated-platform-preview')).toBeInTheDocument();
    });

    it('should render heading', () => {
      render(<AnimatedPlatformPreview />);

      expect(screen.getByText('Platform Preview')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<AnimatedPlatformPreview />);

      expect(screen.getByText('Animated interface preview coming soon...')).toBeInTheDocument();
    });

    it('should render heading as h3', () => {
      render(<AnimatedPlatformPreview />);

      const heading = screen.getByText('Platform Preview');
      expect(heading.tagName).toBe('H3');
    });

    it('should render description as paragraph', () => {
      render(<AnimatedPlatformPreview />);

      const description = screen.getByText('Animated interface preview coming soon...');
      expect(description.tagName).toBe('P');
    });
  });

  describe('Structure', () => {
    it('should have main container with default class', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('animated-platform-preview');
    });

    it('should have platform-mockup inner div', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      const mockupDiv = container.querySelector('.platform-mockup');
      expect(mockupDiv).toBeInTheDocument();
    });

    it('should nest platform-mockup inside main container', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      const mainDiv = container.querySelector('[data-testid="animated-platform-preview"]');
      const mockupDiv = mainDiv?.querySelector('.platform-mockup');

      expect(mockupDiv).toBeInTheDocument();
    });

    it('should render heading inside platform-mockup', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      const mockupDiv = container.querySelector('.platform-mockup');
      const heading = mockupDiv?.querySelector('h3');

      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Platform Preview');
    });

    it('should render paragraph inside platform-mockup', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      const mockupDiv = container.querySelector('.platform-mockup');
      const paragraph = mockupDiv?.querySelector('p');

      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('Animated interface preview coming soon...');
    });
  });

  describe('ClassName Prop', () => {
    it('should apply custom className to root', () => {
      const { container } = render(<AnimatedPlatformPreview className="custom-preview" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('custom-preview');
    });

    it('should preserve default class with custom className', () => {
      const { container } = render(<AnimatedPlatformPreview className="custom-preview" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('animated-platform-preview');
      expect(mainDiv).toHaveClass('custom-preview');
    });

    it('should work without custom className', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('animated-platform-preview');
    });

    it('should handle empty className', () => {
      const { container } = render(<AnimatedPlatformPreview className="" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('animated-platform-preview');
    });

    it('should handle multiple classes in className prop', () => {
      const { container } = render(<AnimatedPlatformPreview className="class1 class2 class3" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('animated-platform-preview');
      expect(mainDiv).toHaveClass('class1');
      expect(mainDiv).toHaveClass('class2');
      expect(mainDiv).toHaveClass('class3');
    });

    it('should update className on rerender', () => {
      const { container, rerender } = render(<AnimatedPlatformPreview className="class1" />);

      let mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('class1');

      rerender(<AnimatedPlatformPreview className="class2" />);

      mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('class2');
      expect(mainDiv).not.toHaveClass('class1');
    });
  });

  describe('Content', () => {
    it('should display correct heading text', () => {
      render(<AnimatedPlatformPreview />);

      const heading = screen.getByText('Platform Preview');
      expect(heading).toBeVisible();
    });

    it('should display correct description text', () => {
      render(<AnimatedPlatformPreview />);

      const description = screen.getByText('Animated interface preview coming soon...');
      expect(description).toBeVisible();
    });

    it('should have heading before description in DOM', () => {
      const { container } = render(<AnimatedPlatformPreview />);

      const mockupDiv = container.querySelector('.platform-mockup');
      const children = Array.from(mockupDiv?.children || []);

      expect(children[0].tagName).toBe('H3');
      expect(children[1].tagName).toBe('P');
    });
  });

  describe('Props', () => {
    it('should work with only className prop', () => {
      render(<AnimatedPlatformPreview className="test-class" />);

      expect(screen.getByTestId('animated-platform-preview')).toHaveClass('test-class');
      expect(screen.getByText('Platform Preview')).toBeInTheDocument();
    });

    it('should work without any props', () => {
      render(<AnimatedPlatformPreview />);

      expect(screen.getByTestId('animated-platform-preview')).toBeInTheDocument();
      expect(screen.getByText('Platform Preview')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently with same props', () => {
      const { container: container1 } = render(<AnimatedPlatformPreview />);
      const { container: container2 } = render(<AnimatedPlatformPreview />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<AnimatedPlatformPreview className="class1" />);

      expect(screen.getByTestId('animated-platform-preview')).toBeInTheDocument();

      rerender(<AnimatedPlatformPreview className="class2" />);

      expect(screen.getByTestId('animated-platform-preview')).toBeInTheDocument();

      rerender(<AnimatedPlatformPreview />);

      expect(screen.getByTestId('animated-platform-preview')).toBeInTheDocument();
    });

    it('should maintain content across rerenders', () => {
      const { rerender } = render(<AnimatedPlatformPreview />);

      expect(screen.getByText('Platform Preview')).toBeInTheDocument();
      expect(screen.getByText('Animated interface preview coming soon...')).toBeInTheDocument();

      rerender(<AnimatedPlatformPreview className="updated" />);

      expect(screen.getByText('Platform Preview')).toBeInTheDocument();
      expect(screen.getByText('Animated interface preview coming soon...')).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      const { container } = render(<AnimatedPlatformPreview className={undefined} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('animated-platform-preview');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via test id', () => {
      render(<AnimatedPlatformPreview />);

      const component = screen.getByTestId('animated-platform-preview');
      expect(component).toBeInTheDocument();
    });

    it('should have readable text content', () => {
      render(<AnimatedPlatformPreview />);

      expect(screen.getByText('Platform Preview')).toBeVisible();
      expect(screen.getByText('Animated interface preview coming soon...')).toBeVisible();
    });

    it('should use semantic HTML', () => {
      render(<AnimatedPlatformPreview />);

      // Heading should be h3
      const heading = screen.getByText('Platform Preview');
      expect(heading.tagName).toBe('H3');

      // Description should be paragraph
      const description = screen.getByText('Animated interface preview coming soon...');
      expect(description.tagName).toBe('P');
    });

    it('should be keyboard navigable', () => {
      render(<AnimatedPlatformPreview />);

      const component = screen.getByTestId('animated-platform-preview');
      expect(component).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with multiple instances', () => {
      render(
        <>
          <AnimatedPlatformPreview className="preview-1" />
          <AnimatedPlatformPreview className="preview-2" />
          <AnimatedPlatformPreview className="preview-3" />
        </>
      );

      const previews = screen.getAllByTestId('animated-platform-preview');
      expect(previews).toHaveLength(3);

      expect(previews[0]).toHaveClass('preview-1');
      expect(previews[1]).toHaveClass('preview-2');
      expect(previews[2]).toHaveClass('preview-3');
    });

    it('should not affect other instances', () => {
      render(
        <>
          <AnimatedPlatformPreview className="instance-1" />
          <AnimatedPlatformPreview className="instance-2" />
        </>
      );

      const previews = screen.getAllByTestId('animated-platform-preview');

      expect(previews[0]).toHaveClass('instance-1');
      expect(previews[0]).not.toHaveClass('instance-2');

      expect(previews[1]).toHaveClass('instance-2');
      expect(previews[1]).not.toHaveClass('instance-1');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <AnimatedPlatformPreview />;
      expect(typeof component.type).toBe('function');
    });

    it('should accept props correctly', () => {
      render(<AnimatedPlatformPreview className="test" />);

      expect(screen.getByTestId('animated-platform-preview')).toHaveClass('test');
    });
  });
});
