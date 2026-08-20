import React from 'react';
import { render, screen } from '@testing-library/react';
import { SetupProgress } from '../setup-progress';

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

describe('SetupProgress', () => {
  describe('Rendering', () => {
    it('should render setup progress component', () => {
      const { container } = render(<SetupProgress />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render header with time estimate', () => {
      render(<SetupProgress />);

      expect(screen.getByText('Ready in just 5 minutes')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<SetupProgress />);

      expect(screen.getByText('Simple setup process - no technical expertise required')).toBeInTheDocument();
    });

    it('should render footer message', () => {
      render(<SetupProgress />);

      expect(screen.getByText('Most clubs are up and running in under 3 minutes!')).toBeInTheDocument();
    });
  });

  describe('Setup Steps', () => {
    it('should render all 5 setup steps', () => {
      render(<SetupProgress />);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Club Details')).toBeInTheDocument();
      expect(screen.getByText('Payment Setup')).toBeInTheDocument();
      expect(screen.getByText('Import Members')).toBeInTheDocument();
      expect(screen.getByText('First Event')).toBeInTheDocument();
    });

    it('should render step times', () => {
      render(<SetupProgress />);

      const thirtySeconds = screen.getAllByText('30 seconds');
      expect(thirtySeconds.length).toBe(2); // Create Account and First Event

      const oneMinute = screen.getAllByText('1 minute');
      expect(oneMinute.length).toBe(2); // Club Details and Import Members

      expect(screen.getByText('2 minutes')).toBeInTheDocument(); // Payment Setup
    });

    it('should show Create Account as completed', () => {
      render(<SetupProgress />);

      const createAccount = screen.getByText('Create Account');
      expect(createAccount).toBeInTheDocument();

      // Should have CheckCircle icon with success color
      const { container } = render(<SetupProgress />);
      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      const firstStep = steps[0];
      const icon = firstStep.querySelector('svg');
      expect(icon).toHaveClass('text-success');
    });

    it('should show Club Details as completed', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      const secondStep = steps[1];
      const icon = secondStep.querySelector('svg');
      expect(icon).toHaveClass('text-success');
    });

    it('should show Payment Setup as not completed', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      const thirdStep = steps[2];
      const icon = thirdStep.querySelector('svg');
      expect(icon).toHaveClass('text-muted-foreground');
      expect(icon).not.toHaveClass('text-success');
    });

    it('should show Import Members as not completed', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      const fourthStep = steps[3];
      const icon = fourthStep.querySelector('svg');
      expect(icon).toHaveClass('text-muted-foreground');
    });

    it('should show First Event as not completed', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      const fifthStep = steps[4];
      const icon = fifthStep.querySelector('svg');
      expect(icon).toHaveClass('text-muted-foreground');
    });
  });

  describe('Icons', () => {
    it('should render Clock icon in header', () => {
      const { container } = render(<SetupProgress />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);

      // First icon should be Clock (in header)
      const clockIcon = icons[0];
      expect(clockIcon).toHaveClass('w-4');
      expect(clockIcon).toHaveClass('h-4');
    });

    it('should render CheckCircle icons for all steps', () => {
      const { container } = render(<SetupProgress />);

      const checkIcons = container.querySelectorAll('.flex-shrink-0 svg');
      expect(checkIcons.length).toBe(5); // One for each step
    });

    it('should style CheckCircle icons correctly', () => {
      const { container } = render(<SetupProgress />);

      const checkIcons = container.querySelectorAll('.flex-shrink-0 svg');
      checkIcons.forEach(icon => {
        expect(icon).toHaveClass('w-5');
        expect(icon).toHaveClass('h-5');
      });
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress dots for incomplete steps', () => {
      const { container } = render(<SetupProgress />);

      // 3 incomplete steps should have progress dots
      const progressDots = container.querySelectorAll('.bg-primary.rounded-full');
      expect(progressDots.length).toBe(3);
    });

    it('should not show progress dots for completed steps', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');

      // First two steps are completed, should not have progress dots
      const firstStepDot = steps[0].querySelector('.bg-primary.rounded-full');
      const secondStepDot = steps[1].querySelector('.bg-primary.rounded-full');

      expect(firstStepDot).toBeNull();
      expect(secondStepDot).toBeNull();
    });

    it('should style progress dots correctly', () => {
      const { container } = render(<SetupProgress />);

      const progressDots = container.querySelectorAll('.bg-primary.rounded-full');
      progressDots.forEach(dot => {
        expect(dot).toHaveClass('w-2');
        expect(dot).toHaveClass('h-2');
      });
    });
  });

  describe('Animated Prop', () => {
    it('should enable animations by default', () => {
      render(<SetupProgress />);

      // Component should render normally with animations
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('should enable animations explicitly', () => {
      render(<SetupProgress animated={true} />);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('should disable animations when animated is false', () => {
      render(<SetupProgress animated={false} />);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('should render all content regardless of animation state', () => {
      const { rerender } = render(<SetupProgress animated={true} />);

      expect(screen.getByText('Ready in just 5 minutes')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      rerender(<SetupProgress animated={false} />);

      expect(screen.getByText('Ready in just 5 minutes')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<SetupProgress className="custom-progress" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-progress');
    });

    it('should preserve default classes with custom className', () => {
      const { container } = render(<SetupProgress className="custom-progress" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-progress');
      expect(wrapper).toHaveClass('space-y-4');
    });

    it('should render without custom className', () => {
      const { container } = render(<SetupProgress />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4');
    });

    it('should handle empty className', () => {
      const { container } = render(<SetupProgress className="" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4');
    });
  });

  describe('Step Styling', () => {
    it('should apply correct container classes to steps', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      steps.forEach(step => {
        expect(step).toHaveClass('p-3');
        expect(step).toHaveClass('rounded-lg');
        expect(step).toHaveClass('border');
        expect(step).toHaveClass('bg-card');
      });
    });

    it('should apply correct text styling to step titles', () => {
      render(<SetupProgress />);

      const createAccount = screen.getByText('Create Account');
      expect(createAccount).toHaveClass('font-medium');
      expect(createAccount).toHaveClass('text-sm');
    });

    it('should apply correct text styling to step times', () => {
      render(<SetupProgress />);

      const thirtySeconds = screen.getAllByText('30 seconds')[0];
      expect(thirtySeconds).toHaveClass('text-xs');
      expect(thirtySeconds).toHaveClass('text-muted-foreground');
    });
  });

  describe('Header Styling', () => {
    it('should style time badge correctly', () => {
      const { container } = render(<SetupProgress />);

      const timeBadge = container.querySelector('.inline-flex.items-center.gap-2');
      expect(timeBadge).toHaveClass('px-4');
      expect(timeBadge).toHaveClass('py-2');
      expect(timeBadge).toHaveClass('bg-primary/10');
      expect(timeBadge).toHaveClass('text-primary');
      expect(timeBadge).toHaveClass('rounded-full');
      expect(timeBadge).toHaveClass('text-sm');
      expect(timeBadge).toHaveClass('font-medium');
      expect(timeBadge).toHaveClass('border');
      expect(timeBadge).toHaveClass('border-primary/20');
    });

    it('should style subtitle correctly', () => {
      render(<SetupProgress />);

      const subtitle = screen.getByText('Simple setup process - no technical expertise required');
      expect(subtitle).toHaveClass('text-sm');
      expect(subtitle).toHaveClass('text-muted-foreground');
    });

    it('should center header content', () => {
      const { container } = render(<SetupProgress />);

      const header = container.querySelector('.text-center.space-y-2');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Footer Styling', () => {
    it('should style footer text correctly', () => {
      render(<SetupProgress />);

      const footer = screen.getByText('Most clubs are up and running in under 3 minutes!');
      expect(footer).toHaveClass('text-xs');
      expect(footer).toHaveClass('text-muted-foreground');
    });

    it('should center footer content', () => {
      const { container } = render(<SetupProgress />);

      const footer = container.querySelector('.text-center.pt-2');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have correct overall structure', () => {
      const { container } = render(<SetupProgress />);

      // Main container
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('space-y-4');

      // Header section
      const header = container.querySelector('.text-center.space-y-2');
      expect(header).toBeInTheDocument();

      // Steps container
      const stepsContainer = container.querySelector('.space-y-3');
      expect(stepsContainer).toBeInTheDocument();

      // Footer section
      const footer = container.querySelector('.text-center.pt-2');
      expect(footer).toBeInTheDocument();
    });

    it('should render steps in correct order', () => {
      const { container } = render(<SetupProgress />);

      // Query within steps container only
      const stepsContainer = container.querySelector('.space-y-3');
      const stepTitles = Array.from(
        stepsContainer!.querySelectorAll('.font-medium.text-sm')
      ).map(el => el.textContent);

      expect(stepTitles).toEqual([
        'Create Account',
        'Club Details',
        'Payment Setup',
        'Import Members',
        'First Event'
      ]);
    });

    it('should have exactly 5 steps', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      expect(steps.length).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle both className and animated props together', () => {
      const { container } = render(
        <SetupProgress className="custom" animated={false} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom');
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('should render consistently', () => {
      const { container: container1 } = render(<SetupProgress />);
      const { container: container2 } = render(<SetupProgress />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle prop changes', () => {
      const { rerender, container } = render(<SetupProgress animated={true} />);

      let wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4');

      rerender(<SetupProgress animated={false} className="updated" />);

      wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('updated');
      expect(wrapper).toHaveClass('space-y-4');
    });

    it('should maintain content integrity across rerenders', () => {
      const { rerender } = render(<SetupProgress />);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('First Event')).toBeInTheDocument();

      rerender(<SetupProgress animated={false} />);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('First Event')).toBeInTheDocument();

      rerender(<SetupProgress className="custom" />);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('First Event')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      const { container } = render(<SetupProgress />);

      // Should use divs for structure (no special a11y requirements for progress display)
      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      expect(steps.length).toBe(5);

      steps.forEach(step => {
        expect(step.tagName).toBe('DIV');
      });
    });

    it('should have readable text content', () => {
      render(<SetupProgress />);

      // All text should be visible
      expect(screen.getByText('Ready in just 5 minutes')).toBeVisible();
      expect(screen.getByText('Create Account')).toBeVisible();
      // "30 seconds" appears twice (Create Account and First Event)
      const thirtySeconds = screen.getAllByText('30 seconds');
      expect(thirtySeconds[0]).toBeVisible();
    });
  });

  describe('Completion Status', () => {
    it('should show 2 completed steps', () => {
      const { container } = render(<SetupProgress />);

      const completedIcons = container.querySelectorAll('.text-success');
      expect(completedIcons.length).toBe(2);
    });

    it('should show 3 incomplete steps', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');
      const incompleteSteps = Array.from(steps).filter(step => {
        const icon = step.querySelector('svg');
        return icon?.classList.contains('text-muted-foreground');
      });

      expect(incompleteSteps.length).toBe(3);
    });

    it('should show progress indicators only for incomplete steps', () => {
      const { container } = render(<SetupProgress />);

      const steps = container.querySelectorAll('.flex.items-center.gap-3');

      // Check first two steps (completed) - no progress dots
      expect(steps[0].querySelector('.bg-primary.rounded-full')).toBeNull();
      expect(steps[1].querySelector('.bg-primary.rounded-full')).toBeNull();

      // Check last three steps (incomplete) - should have progress dots
      expect(steps[2].querySelector('.bg-primary.rounded-full')).not.toBeNull();
      expect(steps[3].querySelector('.bg-primary.rounded-full')).not.toBeNull();
      expect(steps[4].querySelector('.bg-primary.rounded-full')).not.toBeNull();
    });
  });
});
