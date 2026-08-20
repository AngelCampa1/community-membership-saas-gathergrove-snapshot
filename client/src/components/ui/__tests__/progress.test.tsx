import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '../progress';

describe('Progress', () => {
  describe('Progress Root', () => {
    it('should render without crashing', () => {
      render(<Progress value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Progress value={50} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-slot', 'progress');
    });

    it('should have default styling classes', () => {
      render(<Progress value={50} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveClass('relative');
      expect(progress).toHaveClass('h-2');
      expect(progress).toHaveClass('w-full');
      expect(progress).toHaveClass('overflow-hidden');
      expect(progress).toHaveClass('rounded-full');
    });

    it('should apply custom className', () => {
      render(<Progress value={50} className="custom-progress" data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveClass('custom-progress');
      expect(progress).toHaveClass('relative');
    });

    it('should merge custom className with default classes', () => {
      render(<Progress value={50} className="h-4 w-96" data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveClass('h-4');
      expect(progress).toHaveClass('w-96');
      expect(progress).toHaveClass('relative');
    });

    it('should accept custom props', () => {
      render(<Progress value={50} data-testid="progress" data-custom="value" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-custom', 'value');
    });

    it('should have progressbar role', () => {
      render(<Progress value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Progress Value', () => {
    it('should accept value of 0', () => {
      render(<Progress value={0} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should accept value of 50', () => {
      render(<Progress value={50} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should accept value of 100', () => {
      render(<Progress value={100} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should accept undefined value', () => {
      render(<Progress data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should update when value changes', () => {
      const { rerender } = render(<Progress value={25} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();

      rerender(<Progress value={75} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  describe('Progress Indicator', () => {
    it('should render indicator element', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-slot="progress-indicator"]');
      expect(indicator).toBeInTheDocument();
    });

    it('should have data-slot attribute on indicator', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-slot="progress-indicator"]');
      expect(indicator).toHaveAttribute('data-slot', 'progress-indicator');
    });

    it('should have indicator styling classes', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-slot="progress-indicator"]');
      expect(indicator).toHaveClass('h-full');
      expect(indicator).toHaveClass('w-full');
      expect(indicator).toHaveClass('flex-1');
      expect(indicator).toHaveClass('transition-all');
    });

    it('should have transform style with 0% value', () => {
      const { container } = render(<Progress value={0} />);
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });

    it('should have transform style with 50% value', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-50%)');
    });

    it('should have transform style with 100% value', () => {
      const { container } = render(<Progress value={100} />);
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-0%)');
    });

    it('should handle undefined value (defaults to 0)', () => {
      const { container } = render(<Progress />);
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple progress bar', () => {
      render(<Progress value={30} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should work as a loading indicator', () => {
      render(
        <div>
          <p>Loading...</p>
          <Progress value={60} data-testid="progress" />
        </div>
      );
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should work with custom height', () => {
      render(<Progress value={50} className="h-4" data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveClass('h-4');
    });

    it('should work with custom width', () => {
      render(<Progress value={50} className="w-64" data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveClass('w-64');
    });

    it('should work in a progress tracking context', () => {
      render(
        <div>
          <div>Step 2 of 4</div>
          <Progress value={50} data-testid="progress" />
          <div>50% Complete</div>
        </div>
      );
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
      expect(screen.getByText('50% Complete')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should work as a file upload progress bar', () => {
      render(
        <div>
          <p>Uploading file.pdf</p>
          <Progress value={75} data-testid="progress" />
          <p>75% uploaded</p>
        </div>
      );
      expect(screen.getByText('Uploading file.pdf')).toBeInTheDocument();
      expect(screen.getByText('75% uploaded')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', () => {
      render(
        <Progress
          value={80}
          className="h-6 w-80"
          data-testid="progress"
          data-custom="value"
        />
      );

      const progress = screen.getByTestId('progress');
      expect(progress).toHaveClass('h-6');
      expect(progress).toHaveClass('w-80');
      expect(progress).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Accessibility', () => {
    it('should have progressbar role', () => {
      render(<Progress value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Progress value={50} aria-label="Loading progress" data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('aria-label', 'Loading progress');
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <div id="progress-label">Upload Progress</div>
          <Progress value={50} aria-labelledby="progress-label" data-testid="progress" />
        </div>
      );
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('aria-labelledby', 'progress-label');
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Progress value={50} aria-describedby="progress-desc" data-testid="progress" />
          <div id="progress-desc">Upload in progress</div>
        </div>
      );
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('aria-describedby', 'progress-desc');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative values', () => {
      render(<Progress value={-10} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should handle values over 100', () => {
      render(<Progress value={150} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(<Progress value={33.33} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should handle rapid value changes', () => {
      const { rerender } = render(<Progress value={0} data-testid="progress" />);

      for (let i = 0; i <= 100; i += 10) {
        rerender(<Progress value={i} data-testid="progress" />);
        expect(screen.getByTestId('progress')).toBeInTheDocument();
      }
    });
  });
});
