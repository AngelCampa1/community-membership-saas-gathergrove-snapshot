import React from'react';
import { render, screen } from'@testing-library/react';
import { TrustSymbols } from'../trust-symbols';

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('TrustSymbols', () => {
  describe('Rendering', () => {
    it('should render trust symbols component', () => {
      const { container } = render(<TrustSymbols />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render all four trust items', () => {
      render(<TrustSymbols />);

      expect(screen.getByText('No Risk')).toBeInTheDocument();
      expect(screen.getByText('Free Trial')).toBeInTheDocument();
      expect(screen.getByText('5 Min Setup')).toBeInTheDocument();
      expect(screen.getByText('From $9/mo')).toBeInTheDocument();
    });

    it('should render subtexts for all items', () => {
      render(<TrustSymbols />);

      expect(screen.getByText('Cancel anytime')).toBeInTheDocument();
      expect(screen.getByText('30 days, cancel anytime')).toBeInTheDocument();
      expect(screen.getByText('Start immediately')).toBeInTheDocument();
      expect(screen.getByText('Plans that scale with you')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      const { container } = render(<TrustSymbols />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid');
      expect(wrapper).toHaveClass('gap-3');
      expect(wrapper).toHaveClass('sm:gap-4');
    });
  });

  describe('Layout Prop', () => {
    it('should render horizontal layout by default', () => {
      const { container } = render(<TrustSymbols />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-2');
      expect(wrapper).toHaveClass('sm:grid-cols-4');
    });

    it('should render horizontal layout explicitly', () => {
      const { container } = render(<TrustSymbols layout="horizontal" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-2');
      expect(wrapper).toHaveClass('sm:grid-cols-4');
    });

    it('should render vertical layout', () => {
      const { container } = render(<TrustSymbols layout="vertical" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-1');
      expect(wrapper).toHaveClass('space-y-2');
    });

    it('should not have horizontal classes in vertical layout', () => {
      const { container } = render(<TrustSymbols layout="vertical" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass('grid-cols-2');
      expect(wrapper).not.toHaveClass('sm:grid-cols-4');
    });
  });

  describe('Icons Display', () => {
    it('should show icons by default', () => {
      const { container } = render(<TrustSymbols />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(4);
    });

    it('should show icons explicitly when showIcons is true', () => {
      const { container } = render(<TrustSymbols showIcons={true} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(4);
    });

    it('should hide icons when showIcons is false', () => {
      const { container } = render(<TrustSymbols showIcons={false} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(0);
    });

    it('should still show text when icons are hidden', () => {
      render(<TrustSymbols showIcons={false} />);

      expect(screen.getByText('No Risk')).toBeInTheDocument();
      expect(screen.getByText('Free Trial')).toBeInTheDocument();
      expect(screen.getByText('5 Min Setup')).toBeInTheDocument();
      expect(screen.getByText('From $9/mo')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<TrustSymbols className="custom-trust" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-trust');
    });

    it('should preserve default classes with custom className', () => {
      const { container } = render(<TrustSymbols className="custom-trust" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-trust');
      expect(wrapper).toHaveClass('grid');
      expect(wrapper).toHaveClass('gap-3');
    });

    it('should render without custom className', () => {
      const { container } = render(<TrustSymbols />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid');
    });
  });

  describe('Trust Items Structure', () => {
    it('should render all items with proper styling', () => {
      const { container } = render(<TrustSymbols />);

      const items = container.querySelectorAll('.flex.items-center');
      expect(items.length).toBe(4);

      items.forEach(item => {
        expect(item).toHaveClass('gap-3');
        expect(item).toHaveClass('p-3');
        expect(item).toHaveClass('rounded-lg');
      });
    });

    it('should have correct text styling', () => {
      render(<TrustSymbols />);

      const noRisk = screen.getByText('No Risk');
      expect(noRisk).toHaveClass('font-medium');
      expect(noRisk).toHaveClass('text-sm');
    });

    it('should have correct subtext styling', () => {
      render(<TrustSymbols />);

      const cancelAnytime = screen.getByText('Cancel anytime');
      expect(cancelAnytime).toHaveClass('text-xs');
      expect(cancelAnytime).toHaveClass('truncate');
    });

    it('should render icon containers when icons are shown', () => {
      const { container } = render(<TrustSymbols showIcons={true} />);

      const iconContainers = container.querySelectorAll('.flex-shrink-0');
      expect(iconContainers.length).toBe(4);
    });

    it('should not render icon containers when icons are hidden', () => {
      const { container } = render(<TrustSymbols showIcons={false} />);

      const iconContainers = container.querySelectorAll('.flex-shrink-0');
      expect(iconContainers.length).toBe(0);
    });
  });

  describe('Trust Items Content', () => {
    it('should display"No Risk" with correct subtext', () => {
      render(<TrustSymbols />);

      expect(screen.getByText('No Risk')).toBeInTheDocument();
      expect(screen.getByText('Cancel anytime')).toBeInTheDocument();
    });

    it('should display"Free Trial" with correct subtext', () => {
      render(<TrustSymbols />);

      expect(screen.getByText('Free Trial')).toBeInTheDocument();
      expect(screen.getByText('30 days, cancel anytime')).toBeInTheDocument();
    });

    it('should display"5 Min Setup" with correct subtext', () => {
      render(<TrustSymbols />);

      expect(screen.getByText('5 Min Setup')).toBeInTheDocument();
      expect(screen.getByText('Start immediately')).toBeInTheDocument();
    });

    it('should display"From $9/mo" with correct subtext', () => {
      render(<TrustSymbols />);

      expect(screen.getByText('From $9/mo')).toBeInTheDocument();
      expect(screen.getByText('Plans that scale with you')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive gap classes', () => {
      const { container } = render(<TrustSymbols />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('gap-3');
      expect(wrapper).toHaveClass('sm:gap-4');
    });

    it('should have responsive grid columns in horizontal layout', () => {
      const { container } = render(<TrustSymbols layout="horizontal" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-2');
      expect(wrapper).toHaveClass('sm:grid-cols-4');
    });

    it('should have single column in vertical layout', () => {
      const { container } = render(<TrustSymbols layout="vertical" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle both layout and showIcons props together', () => {
      const { container } = render(
        <TrustSymbols layout="vertical" showIcons={false} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-1');

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(0);

      expect(screen.getByText('No Risk')).toBeInTheDocument();
    });

    it('should handle all props together', () => {
      const { container } = render(
        <TrustSymbols
          layout="horizontal"
          showIcons={true}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
      expect(wrapper).toHaveClass('grid-cols-2');

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(4);
    });

    it('should render consistently with default props', () => {
      const { container: container1 } = render(<TrustSymbols />);
      const { container: container2 } = render(<TrustSymbols />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle empty className', () => {
      const { container } = render(<TrustSymbols className="" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid');
    });

    it('should render all items in order', () => {
      const { container } = render(<TrustSymbols />);

      const texts = Array.from(container.querySelectorAll('.font-medium')).map(
        el => el.textContent
      );

      expect(texts).toEqual(['No Risk','Free Trial','5 Min Setup','From $9/mo'
      ]);
    });
  });

  describe('Icon Styling', () => {
    it('should apply correct icon classes', () => {
      const { container } = render(<TrustSymbols />);

      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon).toHaveClass('w-5');
        expect(icon).toHaveClass('h-5');
        expect(icon).toHaveClass('text-primary');
      });
    });

    it('should render exactly 4 icons when enabled', () => {
      const { container } = render(<TrustSymbols showIcons={true} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(4);
    });

    it('should render 0 icons when disabled', () => {
      const { container } = render(<TrustSymbols showIcons={false} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(0);
    });
  });

  describe('Light-Only Mode Classes', () => {
    it('should include light-mode classes for backgrounds', () => {
      const { container } = render(<TrustSymbols />);

      const items = container.querySelectorAll('.flex.items-center');
      items.forEach(item => {
        const classNames = item.className;
        expect(classNames).toContain('bg-primary/5');
        expect(classNames).toContain('border-primary/20');
      });
    });

    it('should include light-mode classes for text', () => {
      render(<TrustSymbols />);

      const noRisk = screen.getByText('No Risk');
      expect(noRisk.className).toContain('text-primary');

      const cancelAnytime = screen.getByText('Cancel anytime');
      expect(cancelAnytime.className).toContain('text-primary/70');
    });

    it('should include light-mode classes for icons', () => {
      const { container } = render(<TrustSymbols />);

      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon.classList.contains('text-primary')).toBe(true);
      });
    });
  });

  describe('Integration', () => {
    it('should work in different layouts with icons toggled', () => {
      const { rerender, container } = render(
        <TrustSymbols layout="horizontal" showIcons={true} />
      );

      let wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-2');
      expect(container.querySelectorAll('svg').length).toBe(4);

      rerender(<TrustSymbols layout="vertical" showIcons={false} />);

      wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid-cols-1');
      expect(container.querySelectorAll('svg').length).toBe(0);
    });

    it('should maintain content integrity across prop changes', () => {
      const { rerender } = render(<TrustSymbols />);

      expect(screen.getByText('No Risk')).toBeInTheDocument();
      expect(screen.getByText('From $9/mo')).toBeInTheDocument();

      rerender(<TrustSymbols layout="vertical" />);

      expect(screen.getByText('No Risk')).toBeInTheDocument();
      expect(screen.getByText('From $9/mo')).toBeInTheDocument();

      rerender(<TrustSymbols showIcons={false} />);

      expect(screen.getByText('No Risk')).toBeInTheDocument();
      expect(screen.getByText('From $9/mo')).toBeInTheDocument();
    });
  });
});
