import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonGlass, SkeletonCard } from '../skeleton';

describe('Skeleton', () => {
  describe('Basic Skeleton', () => {
    it('should render without crashing', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).toHaveClass('bg-muted');
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-skeleton');
      expect(skeleton).toHaveClass('animate-pulse'); // Should still have default classes
    });

    it('should merge custom className with default classes', () => {
      render(<Skeleton className="h-4 w-full" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should accept custom props', () => {
      render(<Skeleton data-testid="skeleton" data-custom="value" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('data-custom', 'value');
    });

    it('should render as div element', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.tagName).toBe('DIV');
    });

    it('should accept aria attributes', () => {
      render(<Skeleton aria-label="Loading content" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should accept aria-busy attribute', () => {
      render(<Skeleton aria-busy="true" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('SkeletonGlass', () => {
    it('should render without crashing', () => {
      render(<SkeletonGlass data-testid="skeleton-glass" />);
      expect(screen.getByTestId('skeleton-glass')).toBeInTheDocument();
    });

    it('should have glassmorphism styling classes', () => {
      render(<SkeletonGlass data-testid="skeleton-glass" />);
      const skeleton = screen.getByTestId('skeleton-glass');
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).toHaveClass('glass-soft');
      expect(skeleton).toHaveClass('backdrop-blur-sm');
    });

    it('should have shimmer effect classes', () => {
      render(<SkeletonGlass data-testid="skeleton-glass" />);
      const skeleton = screen.getByTestId('skeleton-glass');
      expect(skeleton).toHaveClass('relative');
      expect(skeleton).toHaveClass('overflow-hidden');
    });

    it('should have before pseudo-element classes for shimmer', () => {
      render(<SkeletonGlass data-testid="skeleton-glass" />);
      const skeleton = screen.getByTestId('skeleton-glass');
      // These classes create the shimmer effect via before pseudo-element
      const classString = skeleton.className;
      expect(classString).toContain('before:absolute');
      expect(classString).toContain('before:inset-0');
      expect(classString).toContain('before:translate-x-[-100%]');
    });

    it('should apply custom className', () => {
      render(<SkeletonGlass className="custom-glass" data-testid="skeleton-glass" />);
      const skeleton = screen.getByTestId('skeleton-glass');
      expect(skeleton).toHaveClass('custom-glass');
      expect(skeleton).toHaveClass('glass-soft');
    });

    it('should merge custom className with default classes', () => {
      render(<SkeletonGlass className="h-8 w-32" data-testid="skeleton-glass" />);
      const skeleton = screen.getByTestId('skeleton-glass');
      expect(skeleton).toHaveClass('h-8');
      expect(skeleton).toHaveClass('w-32');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should accept custom props', () => {
      render(<SkeletonGlass data-testid="skeleton-glass" data-custom="value" />);
      const skeleton = screen.getByTestId('skeleton-glass');
      expect(skeleton).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('SkeletonCard', () => {
    it('should render without crashing', () => {
      render(<SkeletonCard data-testid="skeleton-card" />);
      expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
    });

    it('should have card styling classes', () => {
      render(<SkeletonCard data-testid="skeleton-card" />);
      const card = screen.getByTestId('skeleton-card');
      expect(card).toHaveClass('glass-soft');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('p-6');
      expect(card).toHaveClass('animate-pulse');
    });

    it('should render internal structure', () => {
      const { container } = render(<SkeletonCard />);
      const spaceY = container.querySelector('.space-y-4');
      expect(spaceY).toBeInTheDocument();
    });

    it('should render multiple skeleton elements inside', () => {
      const { container } = render(<SkeletonCard />);
      // Card should contain multiple SkeletonGlass elements
      const glassElements = container.querySelectorAll('.glass-soft');
      expect(glassElements.length).toBeGreaterThan(1); // Card itself + internal skeletons
    });

    it('should apply custom className to card wrapper', () => {
      render(<SkeletonCard className="custom-card" data-testid="skeleton-card" />);
      const card = screen.getByTestId('skeleton-card');
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('glass-soft');
    });

    it('should merge custom className with default classes', () => {
      render(<SkeletonCard className="my-4 mx-auto" data-testid="skeleton-card" />);
      const card = screen.getByTestId('skeleton-card');
      expect(card).toHaveClass('my-4');
      expect(card).toHaveClass('mx-auto');
      expect(card).toHaveClass('rounded-xl');
    });

    it('should accept custom props', () => {
      render(<SkeletonCard data-testid="skeleton-card" data-custom="value" />);
      const card = screen.getByTestId('skeleton-card');
      expect(card).toHaveAttribute('data-custom', 'value');
    });

    it('should render internal skeleton with h-4 w-3/4', () => {
      const { container } = render(<SkeletonCard />);
      const skeleton = container.querySelector('.h-4.w-3\\/4');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render internal skeleton with h-4 w-1/2', () => {
      const { container } = render(<SkeletonCard />);
      const skeleton = container.querySelector('.h-4.w-1\\/2');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render internal skeleton with h-32 w-full', () => {
      const { container } = render(<SkeletonCard />);
      const skeleton = container.querySelector('.h-32.w-full');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render flex container with buttons', () => {
      const { container } = render(<SkeletonCard />);
      const flexContainer = container.querySelector('.flex.space-x-4');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should render button skeletons', () => {
      const { container } = render(<SkeletonCard />);
      const buttonSkeletons = container.querySelectorAll('.h-8.w-20');
      expect(buttonSkeletons.length).toBe(2);
    });
  });

  describe('Usage Examples', () => {
    it('should work as text line skeleton', () => {
      render(<Skeleton className="h-4 w-full" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
    });

    it('should work as circle skeleton for avatar', () => {
      render(<Skeleton className="h-12 w-12 rounded-full" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('w-12');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should work as button skeleton', () => {
      render(<Skeleton className="h-10 w-24" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-24');
    });

    it('should work in loading list', () => {
      render(
        <div>
          <Skeleton className="h-4 w-full mb-2" data-testid="skeleton-1" />
          <Skeleton className="h-4 w-5/6 mb-2" data-testid="skeleton-2" />
          <Skeleton className="h-4 w-4/6" data-testid="skeleton-3" />
        </div>
      );

      expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-2')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-3')).toBeInTheDocument();
    });

    it('should work as card loading state', () => {
      render(
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" data-testid="image-skeleton" />
          <Skeleton className="h-6 w-3/4" data-testid="title-skeleton" />
          <Skeleton className="h-4 w-full" data-testid="line1-skeleton" />
          <Skeleton className="h-4 w-5/6" data-testid="line2-skeleton" />
        </div>
      );

      expect(screen.getByTestId('image-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('title-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('line1-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('line2-skeleton')).toBeInTheDocument();
    });

    it('should work as table loading state', () => {
      render(
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      );

      const circles = document.querySelectorAll('.rounded-full');
      expect(circles.length).toBe(3);
    });

    it('should work with SkeletonGlass for premium effect', () => {
      render(
        <div>
          <SkeletonGlass className="h-6 w-32 mb-4" data-testid="glass-1" />
          <SkeletonGlass className="h-4 w-full mb-2" data-testid="glass-2" />
          <SkeletonGlass className="h-4 w-5/6" data-testid="glass-3" />
        </div>
      );

      expect(screen.getByTestId('glass-1')).toHaveClass('glass-soft');
      expect(screen.getByTestId('glass-2')).toHaveClass('glass-soft');
      expect(screen.getByTestId('glass-3')).toHaveClass('glass-soft');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label for screen readers', () => {
      render(<Skeleton aria-label="Loading user profile" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAccessibleName('Loading user profile');
    });

    it('should support aria-busy attribute', () => {
      render(<Skeleton aria-busy="true" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should support role attribute', () => {
      render(<Skeleton role="status" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
    });

    it('should work with aria-live for dynamic content', () => {
      render(<Skeleton aria-live="polite" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Combined Props and States', () => {
    it('should handle all custom props together', () => {
      render(
        <Skeleton
          className="h-4 w-full my-2"
          data-testid="skeleton"
          aria-label="Loading"
          aria-busy="true"
          role="status"
        />
      );

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('my-2');
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveAccessibleName('Loading');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
      expect(skeleton).toHaveAttribute('role', 'status');
    });

    it('should handle SkeletonGlass with all props', () => {
      render(
        <SkeletonGlass
          className="h-8 w-32 my-4"
          data-testid="skeleton-glass"
          aria-label="Loading button"
        />
      );

      const skeleton = screen.getByTestId('skeleton-glass');
      expect(skeleton).toHaveClass('h-8');
      expect(skeleton).toHaveClass('w-32');
      expect(skeleton).toHaveClass('glass-soft');
      expect(skeleton).toHaveAccessibleName('Loading button');
    });

    it('should handle SkeletonCard with all props', () => {
      render(
        <SkeletonCard
          className="max-w-md mx-auto"
          data-testid="skeleton-card"
          aria-label="Loading card content"
        />
      );

      const card = screen.getByTestId('skeleton-card');
      expect(card).toHaveClass('max-w-md');
      expect(card).toHaveClass('mx-auto');
      expect(card).toHaveClass('glass-soft');
      expect(card).toHaveAccessibleName('Loading card content');
    });
  });
});
