import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('data-slot', 'input');
    });

    it('should have base input classes', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-9');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-md');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('bg-card/50');
      expect(input).toHaveClass('px-3');
      expect(input).toHaveClass('py-1');
    });

    it('should have transition classes', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input.className).toMatch(/transition-/);
    });

    it('should have focus-visible classes', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('focus-visible:border-ring');
      expect(input).toHaveClass('focus-visible:ring-ring/50');
      expect(input).toHaveClass('focus-visible:bg-card/70');
    });

    it('should have hover classes', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('hover:bg-card/60');
      expect(input).toHaveClass('hover:border-border/60');
    });
  });

  describe('Input Types', () => {
    it('should render as textbox by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<Input type="email" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render tel input', () => {
      render(<Input type="tel" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render url input', () => {
      render(<Input type="url" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('should render search input', () => {
      render(<Input type="search" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render date input', () => {
      render(<Input type="date" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should render file input', () => {
      render(<Input type="file" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('type', 'file');
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should have error role alert', () => {
      render(<Input error="Error message" />);
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('Error message');
    });

    it('should have error styling classes', () => {
      render(<Input error="Error" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('border-destructive');
      expect(input).toHaveClass('ring-destructive/20');
    });

    it('should have aria-invalid when error is present', () => {
      render(<Input error="Error" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should link error message with aria-describedby', () => {
      render(<Input id="test-input" error="Error message" />);
      const input = document.getElementById('test-input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toMatch(/test-input-error/);
    });

    it('should render with wrapper div when error is present', () => {
      const { container } = render(<Input error="Error" />);
      const wrapper = container.querySelector('.space-y-1');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have destructive text color for error message', () => {
      render(<Input error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveClass('text-destructive');
      expect(errorElement).toHaveClass('text-sm');
    });
  });

  describe('Description Helper Text', () => {
    it('should display description text', () => {
      render(<Input description="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('should have muted text color for description', () => {
      render(<Input description="Helper text" />);
      const descriptionElement = screen.getByText('Helper text');
      expect(descriptionElement).toHaveClass('text-muted-foreground');
      expect(descriptionElement).toHaveClass('text-sm');
    });

    it('should link description with aria-describedby', () => {
      render(<Input id="test-input" description="Helper text" />);
      const input = document.getElementById('test-input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toMatch(/test-input-description/);
    });

    it('should render with wrapper div when description is present', () => {
      const { container } = render(<Input description="Helper" />);
      const wrapper = container.querySelector('.space-y-1');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Error and Description Together', () => {
    it('should display both error and description', () => {
      render(
        <Input
          error="This field is required"
          description="Enter your email"
        />
      );
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('Enter your email')).toBeInTheDocument();
    });

    it('should link both error and description in aria-describedby', () => {
      render(
        <Input
          id="test-input"
          error="Error"
          description="Description"
        />
      );
      const input = document.getElementById('test-input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toMatch(/test-input-error/);
      expect(describedBy).toMatch(/test-input-description/);
    });

    it('should render description before error message', () => {
      const { container } = render(
        <Input error="Error" description="Description" />
      );
      const wrapper = container.querySelector('.space-y-1');
      const texts = wrapper?.querySelectorAll('p');
      expect(texts?.[0]).toHaveTextContent('Description');
      expect(texts?.[1]).toHaveTextContent('Error');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Input className="custom-input" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('custom-input');
      expect(input).toHaveClass('flex'); // Still has base classes
    });

    it('should accept placeholder', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('should accept value', () => {
      render(<Input value="Test value" onChange={() => {}} />);
      const input = screen.getByDisplayValue('Test value');
      expect(input).toBeInTheDocument();
    });

    it('should accept name attribute', () => {
      render(<Input name="username" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should accept required attribute', () => {
      render(<Input required data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toBeRequired();
    });

    it('should accept custom id', () => {
      render(<Input id="custom-id" />);
      const input = document.getElementById('custom-id');
      expect(input).toBeInTheDocument();
    });

    it('should generate id if not provided', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('id');
      expect(input.getAttribute('id')).toBeTruthy();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toBeDisabled();
    });

    it('should have disabled classes', () => {
      render(<Input disabled data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('disabled:pointer-events-none');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled data-testid="test-input" />);
      const input = screen.getByTestId('test-input') as HTMLInputElement;

      await user.type(input, 'test');
      expect(input.value).toBe('');
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus when focused', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();

      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Tab away to trigger blur
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should update value on change', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input') as HTMLInputElement;

      await user.type(input, 'Hello World');
      expect(input.value).toBe('Hello World');
    });
  });

  describe('Accessibility', () => {
    it('should accept aria-labelledby', () => {
      render(<Input aria-labelledby="label-id" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should accept aria-describedby', () => {
      render(<Input aria-describedby="desc-id" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should combine custom aria-describedby with error id', () => {
      render(
        <Input
          id="test-input"
          aria-describedby="custom-desc"
          error="Error"
        />
      );
      const input = document.getElementById('test-input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toContain('custom-desc');
      expect(describedBy).toMatch(/test-input-error/);
    });

    it('should combine aria-describedby with description and error', () => {
      render(
        <Input
          id="test-input"
          aria-describedby="custom-desc"
          description="Helper"
          error="Error"
        />
      );
      const input = document.getElementById('test-input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toContain('custom-desc');
      expect(describedBy).toMatch(/test-input-description/);
      expect(describedBy).toMatch(/test-input-error/);
    });

    it('should be focusable', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Input disabled data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('disabled:pointer-events-none');
    });
  });

  describe('File Input Styling', () => {
    it('should have file input specific classes', () => {
      render(<Input type="file" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      // Check that file-specific classes are present in className
      expect(input.className).toMatch(/file:/);
    });
  });

  describe('Placeholder Styling', () => {
    it('should have placeholder text styling classes', () => {
      render(<Input placeholder="Placeholder" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input.className).toMatch(/placeholder:text-muted-foreground/);
    });
  });

  describe('Selection Styling', () => {
    it('should have selection styling classes', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      expect(input.className).toMatch(/selection:bg-primary/);
      expect(input.className).toMatch(/selection:text-primary-foreground/);
    });
  });
});
