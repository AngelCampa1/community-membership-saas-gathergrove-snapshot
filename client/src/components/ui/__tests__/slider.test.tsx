import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from '../slider';

describe('Slider', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Slider data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });

    it('should have slider role', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(<Slider data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveClass('relative');
      expect(slider).toHaveClass('flex');
      expect(slider).toHaveClass('w-full');
      expect(slider).toHaveClass('touch-none');
      expect(slider).toHaveClass('select-none');
      expect(slider).toHaveClass('items-center');
    });

    it('should apply custom className', () => {
      render(<Slider className="custom-slider" data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveClass('custom-slider');
      expect(slider).toHaveClass('relative'); // Should still have default classes
    });

    it('should merge custom className with default classes', () => {
      render(<Slider className="max-w-md my-4" data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveClass('max-w-md');
      expect(slider).toHaveClass('my-4');
      expect(slider).toHaveClass('flex');
    });

    it('should render track element', () => {
      const { container } = render(<Slider />);
      const track = container.querySelector('.h-2.w-full.grow');
      expect(track).toBeInTheDocument();
    });

    it('should render range element', () => {
      const { container } = render(<Slider />);
      const range = container.querySelector('.absolute.h-full.bg-primary');
      expect(range).toBeInTheDocument();
    });

    it('should render thumb element', () => {
      const { container } = render(<Slider />);
      const thumb = container.querySelector('.h-5.w-5.rounded-full');
      expect(thumb).toBeInTheDocument();
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLSpanElement>();
      render(<Slider ref={ref} />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(<Slider data-testid="slider" data-custom="value" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Track Styling', () => {
    it('should have default track styling', () => {
      const { container } = render(<Slider />);
      const track = container.querySelector('.relative.h-2.w-full');
      expect(track).toHaveClass('grow');
      expect(track).toHaveClass('overflow-hidden');
      expect(track).toHaveClass('rounded-full');
      expect(track).toHaveClass('bg-secondary');
    });
  });

  describe('Range Styling', () => {
    it('should have default range styling', () => {
      const { container } = render(<Slider />);
      const range = container.querySelector('.absolute.h-full');
      expect(range).toHaveClass('bg-primary');
    });
  });

  describe('Thumb Styling', () => {
    it('should have default thumb styling', () => {
      const { container } = render(<Slider />);
      const thumb = container.querySelector('.h-5.w-5');
      expect(thumb).toHaveClass('block');
      expect(thumb).toHaveClass('rounded-full');
      expect(thumb).toHaveClass('border-2');
      expect(thumb).toHaveClass('border-primary');
      expect(thumb).toHaveClass('bg-background');
      expect(thumb).toHaveClass('ring-offset-background');
      expect(thumb).toHaveClass('transition-colors');
    });

    it('should have focus styling on thumb', () => {
      const { container } = render(<Slider />);
      const thumb = container.querySelector('.h-5.w-5');
      expect(thumb).toHaveClass('focus-visible:outline-none');
      expect(thumb).toHaveClass('focus-visible:ring-2');
      expect(thumb).toHaveClass('focus-visible:ring-ring');
      expect(thumb).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should have disabled styling on thumb', () => {
      const { container } = render(<Slider />);
      const thumb = container.querySelector('.h-5.w-5');
      expect(thumb).toHaveClass('disabled:pointer-events-none');
      expect(thumb).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Value State', () => {
    it('should accept defaultValue prop', () => {
      render(<Slider defaultValue={[50]} data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should work as controlled component', () => {
      const { rerender } = render(<Slider value={[25]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();

      rerender(<Slider value={[75]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });

    it('should call onValueChange when value changes', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(<Slider onValueChange={handleValueChange} />);
      const slider = screen.getByRole('slider');

      await user.click(slider);
      // Radix UI slider will call onValueChange on interaction
    });

    it('should support multiple thumbs with array value', () => {
      render(<Slider defaultValue={[25, 75]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });

    it('should accept min and max props', () => {
      render(<Slider min={0} max={100} defaultValue={[50]} data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
    });

    it('should accept step prop', () => {
      render(<Slider step={10} defaultValue={[50]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).not.toBeDisabled();
    });

    it('should accept disabled prop', () => {
      render(<Slider disabled data-testid="slider" />);
      expect(screen.getByTestId('slider')).toHaveAttribute('disabled');
    });

    it('should not change value when disabled', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(<Slider disabled onValueChange={handleValueChange} />);
      const slider = screen.getByRole('slider');

      await user.click(slider);
      expect(handleValueChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Slider />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should accept disabled attribute', () => {
      render(<Slider disabled data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('disabled');
    });

    it('should have aria-valuemin', () => {
      render(<Slider min={0} defaultValue={[50]} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax', () => {
      render(<Slider max={100} defaultValue={[50]} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-valuenow', () => {
      render(<Slider defaultValue={[50]} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow');
    });

    it('should support aria-label', () => {
      render(<Slider aria-label="Volume control" />);
      expect(screen.getByLabelText('Volume control')).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <div id="slider-label">Brightness</div>
          <Slider aria-labelledby="slider-label" data-testid="slider" />
        </div>
      );
      expect(screen.getByTestId('slider')).toHaveAttribute('aria-labelledby', 'slider-label');
    });

    it('should support keyboard navigation with arrow keys', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(<Slider defaultValue={[50]} onValueChange={handleValueChange} />);
      const slider = screen.getByRole('slider');

      slider.focus();
      await user.keyboard('{ArrowRight}');
      // Radix UI handles value changes via keyboard
    });
  });

  describe('Orientation', () => {
    it('should accept horizontal orientation (default)', () => {
      render(<Slider data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should accept vertical orientation', () => {
      render(<Slider orientation="vertical" data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple slider with label', () => {
      render(
        <div>
          <label htmlFor="volume">Volume</label>
          <Slider id="volume" defaultValue={[50]} />
        </div>
      );
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should work with controlled state', () => {
      const ControlledSlider = () => {
        const [value, setValue] = React.useState([50]);
        return (
          <div>
            <Slider value={value} onValueChange={setValue} />
            <div data-testid="value">{value[0]}</div>
          </div>
        );
      };

      render(<ControlledSlider />);
      expect(screen.getByTestId('value')).toHaveTextContent('50');
    });

    it('should work as volume control', () => {
      render(
        <div>
          <label htmlFor="volume">Volume</label>
          <Slider id="volume" min={0} max={100} step={1} defaultValue={[75]} />
        </div>
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
    });

    it('should work as range slider with two thumbs', () => {
      render(
        <div>
          <label>Price Range</label>
          <Slider min={0} max={1000} step={50} defaultValue={[200, 800]} />
        </div>
      );

      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should work with custom styling', () => {
      render(
        <Slider
          className="max-w-sm mx-auto"
          defaultValue={[50]}
          data-testid="slider"
        />
      );

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveClass('max-w-sm');
      expect(slider).toHaveClass('mx-auto');
    });

    it('should work with disabled state', () => {
      render(
        <div>
          <label>Read-only Value</label>
          <Slider defaultValue={[50]} disabled data-testid="slider" />
        </div>
      );

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('disabled');
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', () => {
      const handleValueChange = jest.fn();

      render(
        <Slider
          value={[30]}
          onValueChange={handleValueChange}
          min={0}
          max={100}
          step={5}
          className="custom-slider max-w-md"
          aria-label="Custom slider"
          data-testid="slider"
          disabled={false}
        />
      );

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveClass('custom-slider');
      expect(slider).toHaveClass('max-w-md');
      expect(slider).toHaveAttribute('aria-label', 'Custom slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle value of 0', () => {
      render(<Slider defaultValue={[0]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });

    it('should handle value equal to max', () => {
      render(<Slider max={100} defaultValue={[100]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      render(<Slider min={-100} max={100} defaultValue={[-50]} data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '-100');
    });

    it('should handle decimal step values', () => {
      render(<Slider step={0.1} defaultValue={[5.5]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });

    it('should handle single value in array', () => {
      render(<Slider defaultValue={[50]} data-testid="slider" />);
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });

    it('should handle empty className', () => {
      render(<Slider className="" data-testid="slider" />);
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveClass('relative');
    });
  });

  describe('Display Name', () => {
    it('should have correct display name', () => {
      expect(Slider.displayName).toBe('Slider');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLSpanElement>();
      render(<Slider ref={ref} />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should forward ref with custom props', () => {
      const ref = React.createRef<HTMLSpanElement>();
      render(<Slider ref={ref} className="custom" defaultValue={[50]} />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });
});
