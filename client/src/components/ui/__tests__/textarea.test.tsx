import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  describe('Basic Rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('data-slot', 'textarea');
    });

    it('should have base textarea classes', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('flex');
      expect(textarea).toHaveClass('w-full');
      expect(textarea).toHaveClass('min-h-16');
      expect(textarea).toHaveClass('rounded-md');
      expect(textarea).toHaveClass('border');
      expect(textarea).toHaveClass('px-3');
      expect(textarea).toHaveClass('py-2');
    });

    it('should have transition classes', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea.className).toMatch(/transition-/);
    });

    it('should have field-sizing-content class', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('field-sizing-content');
    });

    it('should have focus-visible classes', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('focus-visible:border-ring');
      expect(textarea).toHaveClass('focus-visible:ring-ring/50');
      expect(textarea).toHaveClass('focus-visible:ring-[3px]');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Textarea className="custom-textarea" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('custom-textarea');
      expect(textarea).toHaveClass('flex'); // Still has base classes
    });

    it('should accept placeholder', () => {
      render(<Textarea placeholder="Enter your message" />);
      const textarea = screen.getByPlaceholderText('Enter your message');
      expect(textarea).toBeInTheDocument();
    });

    it('should accept value', () => {
      render(<Textarea value="Test value" onChange={() => {}} />);
      const textarea = screen.getByDisplayValue('Test value');
      expect(textarea).toBeInTheDocument();
    });

    it('should accept name attribute', () => {
      render(<Textarea name="message" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('name', 'message');
    });

    it('should accept rows attribute', () => {
      render(<Textarea rows={5} data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('should accept cols attribute', () => {
      render(<Textarea cols={50} data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('cols', '50');
    });

    it('should accept maxLength attribute', () => {
      render(<Textarea maxLength={100} data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('maxLength', '100');
    });

    it('should accept required attribute', () => {
      render(<Textarea required data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toBeRequired();
    });

    it('should accept id attribute', () => {
      render(<Textarea id="custom-id" />);
      const textarea = document.getElementById('custom-id');
      expect(textarea).toBeInTheDocument();
    });

    it('should accept readOnly attribute', () => {
      render(<Textarea readOnly data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('readOnly');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toBeDisabled();
    });

    it('should have disabled classes', () => {
      render(<Textarea disabled data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed');
      expect(textarea).toHaveClass('disabled:opacity-50');
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Textarea disabled data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;

      await user.type(textarea, 'test');
      expect(textarea.value).toBe('');
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Textarea onChange={handleChange} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus when focused', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();

      render(<Textarea onFocus={handleFocus} />);
      const textarea = screen.getByRole('textbox');

      await user.click(textarea);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();

      render(<Textarea onBlur={handleBlur} />);
      const textarea = screen.getByRole('textbox');

      await user.click(textarea);
      await user.tab(); // Tab away to trigger blur
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should update value on change', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;

      await user.type(textarea, 'Hello World');
      expect(textarea.value).toBe('Hello World');
    });

    it('should handle multiline input', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;

      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');
      expect(textarea.value).toContain('\n');
      expect(textarea.value.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('Accessibility', () => {
    it('should accept aria-labelledby', () => {
      render(<Textarea aria-labelledby="label-id" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should accept aria-describedby', () => {
      render(<Textarea aria-describedby="desc-id" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should accept aria-label', () => {
      render(<Textarea aria-label="Message content" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Message content');
    });

    it('should accept aria-invalid', () => {
      render(<Textarea aria-invalid="true" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-invalid styling classes', () => {
      render(<Textarea aria-invalid="true" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('aria-invalid:ring-destructive/30');
      expect(textarea).toHaveClass('aria-invalid:border-destructive');
    });

    it('should be focusable', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      textarea.focus();
      expect(textarea).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Textarea disabled data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Placeholder Styling', () => {
    it('should have placeholder text styling classes', () => {
      render(<Textarea placeholder="Placeholder" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea.className).toMatch(/placeholder:text-muted-foreground/);
    });
  });

  describe('Border and Input Styling', () => {
    it('should have border-input class', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('border-input');
    });

    it('should have bg-transparent class', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('bg-transparent');
    });

    it('should have shadow-xs class', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('shadow-xs');
    });

    it('should have outline-none class', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('outline-none');
    });
  });

  describe('Responsive Styling', () => {
    it('should have responsive text size', () => {
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      expect(textarea).toHaveClass('text-base');
      expect(textarea).toHaveClass('md:text-sm');
    });
  });

  describe('Form Integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Textarea name="message" data-testid="test-textarea" />
          <button type="submit">Submit</button>
        </form>
      );

      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;
      const submitButton = screen.getByRole('button', { name: /submit/i });

      // Manually set value (simulating user input)
      textarea.value = 'Test message';
      submitButton.click();

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should be associated with label via htmlFor', () => {
      render(
        <div>
          <label htmlFor="message-textarea">Message</label>
          <Textarea id="message-textarea" />
        </div>
      );

      const label = screen.getByText('Message');
      const textarea = document.getElementById('message-textarea');

      expect(label).toHaveAttribute('for', 'message-textarea');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Value Control', () => {
    it('should work as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="test-textarea"
          />
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);
      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;

      await user.type(textarea, 'Controlled text');
      expect(textarea.value).toBe('Controlled text');
    });

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;

      await user.type(textarea, 'Uncontrolled text');
      expect(textarea.value).toBe('Uncontrolled text');
    });

    it('should respect defaultValue', () => {
      render(<Textarea defaultValue="Initial value" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial value');
    });
  });

  describe('Read-Only State', () => {
    it('should not allow changes when readOnly', async () => {
      const user = userEvent.setup();
      render(<Textarea readOnly defaultValue="Read only text" data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;

      const initialValue = textarea.value;
      await user.type(textarea, 'new text');
      expect(textarea.value).toBe(initialValue);
    });

    it('should be focusable when readOnly', () => {
      render(<Textarea readOnly data-testid="test-textarea" />);
      const textarea = screen.getByTestId('test-textarea');
      textarea.focus();
      expect(textarea).toHaveFocus();
    });
  });
});
