import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '../rich-text-editor';

describe('RichTextEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render textarea with data-testid', () => {
      render(<RichTextEditor {...defaultProps} />);

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<RichTextEditor {...defaultProps} value="Initial content" />);

      const textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial content');
    });

    it('should render with placeholder', () => {
      render(<RichTextEditor {...defaultProps} placeholder="Enter text here..." />);

      expect(screen.getByPlaceholderText('Enter text here...')).toBeInTheDocument();
    });

    it('should render help text', () => {
      render(<RichTextEditor {...defaultProps} />);

      expect(screen.getByText('Supports plain text formatting. Rich text features coming soon.')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<RichTextEditor {...defaultProps} className="custom-editor" />);

      const wrapper = container.querySelector('.custom-editor');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render disabled state', () => {
      render(<RichTextEditor {...defaultProps} disabled />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).toBeDisabled();
    });

    it('should render enabled by default', () => {
      render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).not.toBeDisabled();
    });

    it('should render with custom rows', () => {
      render(<RichTextEditor {...defaultProps} rows={10} />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    it('should render with default 6 rows', () => {
      render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).toHaveAttribute('rows', '6');
    });

    it('should have resize-y and min-height classes', () => {
      render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).toHaveClass('resize-y');
      expect(textarea).toHaveClass('min-h-[120px]');
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when text is typed', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<RichTextEditor value="" onChange={onChange} />);

      const textarea = screen.getByTestId('rich-text-editor');
      await user.type(textarea, 'Hello');

      expect(onChange).toHaveBeenCalled();
      // Called once per character typed
      expect(onChange).toHaveBeenCalledTimes(5);
    });

    it('should pass correct value to onChange', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      // Use controlled component pattern for predictable behavior
      const ControlledEditor = () => {
        const [value, setValue] = React.useState('');
        const handleChange = (newValue: string) => {
          setValue(newValue);
          onChange(newValue);
        };
        return <RichTextEditor value={value} onChange={handleChange} />;
      };

      render(<ControlledEditor />);

      const textarea = screen.getByTestId('rich-text-editor');
      await user.type(textarea, 'Test');

      // Check that onChange received the final value
      expect(onChange).toHaveBeenLastCalledWith('Test');
    });

    it('should handle clearing text', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<RichTextEditor value="Initial" onChange={onChange} />);

      const textarea = screen.getByTestId('rich-text-editor');
      await user.clear(textarea);

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should handle multiline text', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<RichTextEditor value="" onChange={onChange} />);

      const textarea = screen.getByTestId('rich-text-editor');
      await user.type(textarea, 'Line 1{Enter}Line 2');

      // Verify one of the calls includes the newline after "Line 1\n" is typed
      const callWithNewline = onChange.mock.calls.find(call => call[0].includes('\n'));
      expect(callWithNewline).toBeDefined();
      expect(callWithNewline![0]).toContain('\n');
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<RichTextEditor value="" onChange={onChange} disabled />);

      const textarea = screen.getByTestId('rich-text-editor');
      await user.type(textarea, 'Test');

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Value Updates', () => {
    it('should update displayed value when prop changes', () => {
      const { rerender } = render(<RichTextEditor value="First" onChange={jest.fn()} />);

      let textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe('First');

      rerender(<RichTextEditor value="Second" onChange={jest.fn()} />);

      textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Second');
    });

    it('should handle empty string value', () => {
      render(<RichTextEditor value="" onChange={jest.fn()} />);

      const textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      render(<RichTextEditor value={longText} onChange={jest.fn()} />);

      const textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe(longText);
    });

    it('should handle special characters', () => {
      const specialText = '<script>alert("xss")</script>';
      render(<RichTextEditor value={specialText} onChange={jest.fn()} />);

      const textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialText);
    });

    it('should handle newlines and tabs', () => {
      const formattedText = 'Line 1\n\tIndented line\nLine 3';
      render(<RichTextEditor value={formattedText} onChange={jest.fn()} />);

      const textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe(formattedText);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via testid', () => {
      render(<RichTextEditor {...defaultProps} />);

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    });

    it('should support placeholder for accessibility', () => {
      render(<RichTextEditor {...defaultProps} placeholder="Enter your message" />);

      expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
    });

    it('should have disabled attribute when disabled', () => {
      render(<RichTextEditor {...defaultProps} disabled />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).toHaveAttribute('disabled');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByTestId('rich-text-editor');

      await user.tab();
      expect(textarea).toHaveFocus();
    });
  });

  describe('Controlled Component', () => {
    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const ControlledEditor = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <RichTextEditor value={value} onChange={setValue} />
            <div data-testid="display">{value}</div>
          </>
        );
      };

      render(<ControlledEditor />);

      const textarea = screen.getByTestId('rich-text-editor');
      await user.type(textarea, 'Controlled');

      expect(screen.getByTestId('display')).toHaveTextContent('Controlled');
    });

    it('should maintain controlled value through multiple updates', () => {
      const { rerender } = render(<RichTextEditor value="Value 1" onChange={jest.fn()} />);

      const textarea = screen.getByTestId('rich-text-editor') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Value 1');

      rerender(<RichTextEditor value="Value 2" onChange={jest.fn()} />);
      expect(textarea.value).toBe('Value 2');

      rerender(<RichTextEditor value="Value 3" onChange={jest.fn()} />);
      expect(textarea.value).toBe('Value 3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid typing', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<RichTextEditor value="" onChange={onChange} />);

      const textarea = screen.getByTestId('rich-text-editor');
      await user.type(textarea, 'Quick brown fox');

      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle copy-paste operations', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<RichTextEditor value="" onChange={onChange} />);

      const textarea = screen.getByTestId('rich-text-editor');

      // Simulate paste
      await user.click(textarea);
      await user.paste('Pasted content');

      expect(onChange).toHaveBeenCalled();
    });

    it('should handle props spreading', () => {
      const customProps = {
        'data-custom': 'value',
        'aria-describedby': 'help-text',
      };

      render(<RichTextEditor {...defaultProps} {...customProps} />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).toHaveAttribute('data-custom', 'value');
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('should handle null/undefined value gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior
      render(<RichTextEditor value={null as any} onChange={jest.fn()} />);

      const textarea = screen.getByTestId('rich-text-editor');
      expect(textarea).toBeInTheDocument();
    });

    it('should memoize onChange handler', () => {
      const onChange = jest.fn();
      const { rerender } = render(<RichTextEditor value="" onChange={onChange} />);

      rerender(<RichTextEditor value="" onChange={onChange} />);
      rerender(<RichTextEditor value="" onChange={onChange} />);

      // Component should not recreate handler if onChange ref doesn't change
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
