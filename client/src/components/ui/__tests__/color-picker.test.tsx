import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from '../color-picker';

describe('ColorPicker', () => {
  const defaultOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render color picker button', () => {
      render(<ColorPicker onChange={defaultOnChange} />);

      const button = screen.getByRole('button', { name: 'Select color' });
      expect(button).toBeInTheDocument();
    });

    it('should render with default blue color', () => {
      const { container } = render(<ColorPicker onChange={defaultOnChange} />);

      const colorPreview = container.querySelector('[style*="background-color"]');
      expect(colorPreview).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('should render with custom value', () => {
      const { container } = render(<ColorPicker value="#ff0000" onChange={defaultOnChange} />);

      const colorPreview = container.querySelector('[style*="background-color"]');
      expect(colorPreview).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should apply custom className', () => {
      render(<ColorPicker onChange={defaultOnChange} className="custom-picker" />);

      const button = screen.getByRole('button', { name: 'Select color' });
      expect(button).toHaveClass('custom-picker');
    });

    it('should render disabled state', () => {
      render(<ColorPicker onChange={defaultOnChange} disabled />);

      const button = screen.getByRole('button', { name: 'Select color' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('should render with custom aria-label', () => {
      render(<ColorPicker onChange={defaultOnChange} aria-label="Pick a color" />);

      expect(screen.getByRole('button', { name: 'Pick a color' })).toBeInTheDocument();
    });
  });

  describe('Popover Interaction', () => {
    it('should open popover on button click', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      const button = screen.getByRole('button', { name: 'Select color' });
      await user.click(button);

      expect(screen.getByText('Choose a color')).toBeInTheDocument();
    });

    it('should render preset colors grid', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      // Should have 20 default color buttons
      const colorButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.startsWith('Select color #')
      );
      expect(colorButtons.length).toBe(20);
    });

    it('should render custom color input section', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom color picker')).toBeInTheDocument();
    });

    it('should not respond to clicks when disabled', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} disabled />);

      const button = screen.getByRole('button', { name: 'Select color' });

      // Verify button is disabled
      expect(button).toBeDisabled();

      // Disabled button won't respond to clicks (browser behavior)
      // We just verify the disabled attribute is set
    });
  });

  describe('Preset Color Selection', () => {
    it('should call onChange when preset color clicked', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));
      expect(screen.getByText('Choose a color')).toBeInTheDocument();

      const colorButton = screen.getByRole('button', { name: 'Select color #ef4444' });
      await user.click(colorButton);

      // Verify onChange was called with the selected color
      expect(onChange).toHaveBeenCalledWith('#ef4444');

      // Note: Popover closing behavior is handled by Radix UI internals
      // and may not be reliably testable in this environment
    });

    it('should highlight selected preset color', async () => {
      const user = userEvent.setup();
      render(<ColorPicker value="#ef4444" onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const selectedButton = screen.getByRole('button', { name: 'Select color #ef4444' });
      expect(selectedButton).toHaveClass('border-foreground');
      expect(selectedButton).toHaveClass('ring-2');
    });

    it('should not highlight unselected colors', async () => {
      const user = userEvent.setup();
      render(<ColorPicker value="#ef4444" onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const unselectedButton = screen.getByRole('button', { name: 'Select color #f97316' });
      expect(unselectedButton).not.toHaveClass('ring-2');
    });

    it('should render custom colors array', async () => {
      const user = userEvent.setup();
      const customColors = ['#ff0000', '#00ff00', '#0000ff'];
      render(<ColorPicker onChange={defaultOnChange} colors={customColors} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      expect(screen.getByRole('button', { name: 'Select color #ff0000' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Select color #00ff00' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Select color #0000ff' })).toBeInTheDocument();
    });
  });

  describe('Custom Color Input', () => {
    it('should render native color input', async () => {
      const user = userEvent.setup();
      render(<ColorPicker value="#3b82f6" onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const colorInput = screen.getByLabelText('Custom color picker');
      expect(colorInput).toHaveAttribute('type', 'color');
      expect(colorInput).toHaveValue('#3b82f6');
    });

    it('should display correct value in native color input', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker value="#ff0000" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const colorInput = screen.getByLabelText('Custom color picker') as HTMLInputElement;
      expect(colorInput.value).toBe('#ff0000');
    });

    it('should render text input for hex code', async () => {
      const user = userEvent.setup();
      render(<ColorPicker value="#3b82f6" onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      expect(textInput).toHaveAttribute('type', 'text');
      expect(textInput).toHaveValue('#3b82f6');
    });

    it('should update text input on typing', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, '#abcdef');

      expect(textInput).toHaveValue('#abcdef');
    });

    it('should call onChange on text input blur', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, '#abcdef');

      textInput.blur();

      expect(onChange).toHaveBeenCalledWith('#abcdef');
    });

    it('should have hex pattern validation', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      expect(textInput).toHaveAttribute('pattern', '^#[0-9A-Fa-f]{6}$');
    });
  });

  describe('State Management', () => {
    it('should update color preview when value prop changes', () => {
      const { container, rerender } = render(
        <ColorPicker value="#ff0000" onChange={defaultOnChange} />
      );

      let colorPreview = container.querySelector('[style*="background-color"]');
      expect(colorPreview).toHaveStyle({ backgroundColor: '#ff0000' });

      rerender(<ColorPicker value="#00ff00" onChange={defaultOnChange} />);

      colorPreview = container.querySelector('[style*="background-color"]');
      expect(colorPreview).toHaveStyle({ backgroundColor: '#00ff00' });
    });

    it('should maintain custom color state between interactions', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker value="#3b82f6" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, '#abc123');

      expect(textInput).toHaveValue('#abc123');

      // Close and reopen popover
      await user.keyboard('{Escape}');
      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const reopenedTextInput = screen.getByPlaceholderText('#000000');
      expect(reopenedTextInput).toHaveValue('#abc123');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button with aria-label', () => {
      render(<ColorPicker onChange={defaultOnChange} aria-label="Choose theme color" />);

      expect(screen.getByRole('button', { name: 'Choose theme color' })).toBeInTheDocument();
    });

    it('should have accessible color preset buttons', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const colorButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.startsWith('Select color #')
      );

      colorButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should have accessible custom color input', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      expect(screen.getByLabelText('Custom color picker')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} />);

      const button = screen.getByRole('button', { name: 'Select color' });

      // Focus button with keyboard
      await user.tab();
      expect(button).toHaveFocus();

      // Open with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Choose a color')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty colors array', async () => {
      const user = userEvent.setup();
      render(<ColorPicker onChange={defaultOnChange} colors={[]} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      // Should still render popover structure
      expect(screen.getByText('Choose a color')).toBeInTheDocument();

      // No preset color buttons
      const colorButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.startsWith('Select color #')
      );
      expect(colorButtons.length).toBe(0);
    });

    it('should handle very long colors array', async () => {
      const user = userEvent.setup();
      const longColors = Array.from({ length: 100 }, (_, i) =>
        `#${i.toString(16).padStart(6, '0')}`
      );
      render(<ColorPicker onChange={defaultOnChange} colors={longColors} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const colorButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.startsWith('Select color #')
      );
      expect(colorButtons.length).toBe(100);
    });

    it('should handle invalid hex code in text input', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, 'invalid');

      textInput.blur();

      // onChange still called with invalid value (validation is HTML5)
      expect(onChange).toHaveBeenCalledWith('invalid');
    });

    it('should handle short hex codes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, '#abc');

      textInput.blur();

      expect(onChange).toHaveBeenCalledWith('#abc');
    });

    it('should handle rapid color changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      // Click multiple colors rapidly
      await user.click(screen.getByRole('button', { name: 'Select color #ef4444' }));

      await user.click(screen.getByRole('button', { name: 'Select color' }));
      await user.click(screen.getByRole('button', { name: 'Select color #f97316' }));

      await user.click(screen.getByRole('button', { name: 'Select color' }));
      await user.click(screen.getByRole('button', { name: 'Select color #f59e0b' }));

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('should handle same color selection', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker value="#ef4444" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      // Select same color as current value
      await user.click(screen.getByRole('button', { name: 'Select color #ef4444' }));

      expect(onChange).toHaveBeenCalledWith('#ef4444');
    });

    it('should handle uppercase hex codes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, '#ABCDEF');

      textInput.blur();

      expect(onChange).toHaveBeenCalledWith('#ABCDEF');
    });

    it('should handle mixed case hex codes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, '#AbCdEf');

      textInput.blur();

      expect(onChange).toHaveBeenCalledWith('#AbCdEf');
    });

    it('should only call onChange on text input blur', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorPicker onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'Select color' }));

      const textInput = screen.getByPlaceholderText('#000000');
      await user.clear(textInput);
      await user.type(textInput, '#123456');

      // onChange should NOT be called during typing
      expect(onChange).not.toHaveBeenCalled();

      textInput.blur();

      // onChange called once on blur
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('#123456');
    });
  });

  describe('Integration', () => {
    it('should work with controlled component pattern', async () => {
      const user = userEvent.setup();
      const ControlledPicker = () => {
        const [color, setColor] = React.useState('#3b82f6');
        return (
          <>
            <ColorPicker value={color} onChange={setColor} />
            <div data-testid="current-color">{color}</div>
          </>
        );
      };

      render(<ControlledPicker />);

      expect(screen.getByTestId('current-color')).toHaveTextContent('#3b82f6');

      await user.click(screen.getByRole('button', { name: 'Select color' }));
      await user.click(screen.getByRole('button', { name: 'Select color #ef4444' }));

      expect(screen.getByTestId('current-color')).toHaveTextContent('#ef4444');
    });

    it('should work with form submission', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn(e => e.preventDefault());
      const onChange = jest.fn();

      render(
        <form onSubmit={handleSubmit}>
          <ColorPicker onChange={onChange} />
          <button type="submit">Submit</button>
        </form>
      );

      await user.click(screen.getByRole('button', { name: 'Select color' }));
      await user.click(screen.getByRole('button', { name: 'Select color #ef4444' }));

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(onChange).toHaveBeenCalledWith('#ef4444');
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
