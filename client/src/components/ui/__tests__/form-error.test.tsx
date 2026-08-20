import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormError, FieldError } from '../form-error';

describe('FormError', () => {
  describe('FormError Component', () => {
    describe('Rendering', () => {
      it('should render without crashing with string message', () => {
        render(<FormError message="Error message" />);
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });

      it('should not render when message is undefined', () => {
        const { container } = render(<FormError />);
        expect(container.firstChild).toBeNull();
      });

      it('should not render when message is empty string', () => {
        const { container } = render(<FormError message="" />);
        expect(container.firstChild).toBeNull();
      });

      it('should render with array of messages', () => {
        render(<FormError message={['Error 1', 'Error 2']} />);
        expect(screen.getByText('Error 1')).toBeInTheDocument();
        expect(screen.getByText('Error 2')).toBeInTheDocument();
      });

      it('should render AlertCircle icon', () => {
        const { container } = render(<FormError message="Error" />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    describe('Inline Variant', () => {
      it('should render inline variant by default', () => {
        const { container } = render(<FormError message="Error message" />);
        const wrapper = container.querySelector('.space-y-1');
        expect(wrapper).toBeInTheDocument();
      });

      it('should render single inline error with icon', () => {
        const { container } = render(<FormError message="Single error" variant="inline" />);
        expect(screen.getByText('Single error')).toBeInTheDocument();
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('h-3');
        expect(svg).toHaveClass('w-3');
      });

      it('should render multiple inline errors', () => {
        render(<FormError message={['Error 1', 'Error 2', 'Error 3']} variant="inline" />);
        expect(screen.getByText('Error 1')).toBeInTheDocument();
        expect(screen.getByText('Error 2')).toBeInTheDocument();
        expect(screen.getByText('Error 3')).toBeInTheDocument();
      });

      it('should apply custom className to inline variant', () => {
        const { container } = render(<FormError message="Error" variant="inline" className="custom-class" />);
        const wrapper = container.querySelector('.custom-class');
        expect(wrapper).toBeInTheDocument();
      });
    });

    describe('Card Variant', () => {
      it('should render card variant', () => {
        const { container } = render(<FormError message="Error message" variant="card" />);
        const wrapper = container.querySelector('.rounded-md');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveClass('border');
        expect(wrapper).toHaveClass('p-3');
      });

      it('should have destructive styling in card variant', () => {
        const { container } = render(<FormError message="Error" variant="card" />);
        const wrapper = container.querySelector('.rounded-md');
        expect(wrapper).toHaveClass('border-destructive/20');
        expect(wrapper).toHaveClass('bg-destructive/10');
      });

      it('should render single error as paragraph in card variant', () => {
        render(<FormError message="Single error" variant="card" />);
        const paragraph = screen.getByText('Single error');
        expect(paragraph.tagName).toBe('P');
        expect(paragraph).toHaveClass('text-destructive');
      });

      it('should render multiple errors as list in card variant', () => {
        const { container } = render(<FormError message={['Error 1', 'Error 2']} variant="card" />);
        const list = container.querySelector('ul');
        expect(list).toBeInTheDocument();
        expect(list).toHaveClass('list-disc');
        expect(list).toHaveClass('list-inside');
        expect(list).toHaveClass('text-destructive');
      });

      it('should render AlertCircle icon with correct size in card variant', () => {
        const { container } = render(<FormError message="Error" variant="card" />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('h-4');
        expect(svg).toHaveClass('w-4');
        expect(svg).toHaveClass('text-destructive');
      });

      it('should apply custom className to card variant', () => {
        const { container } = render(<FormError message="Error" variant="card" className="custom-card" />);
        const wrapper = container.querySelector('.custom-card');
        expect(wrapper).toBeInTheDocument();
      });
    });

    describe('Message Handling', () => {
      it('should handle empty array', () => {
        const { container } = render(<FormError message={[]} />);
        // Empty array is truthy in JS, so component renders empty wrapper
        expect(container.querySelector('.space-y-1')).toBeInTheDocument();
      });

      it('should handle single item array', () => {
        render(<FormError message={['Single error']} />);
        expect(screen.getByText('Single error')).toBeInTheDocument();
      });

      it('should handle array with many errors', () => {
        const errors = Array.from({ length: 10 }, (_, i) => `Error ${i + 1}`);
        render(<FormError message={errors} variant="card" />);
        errors.forEach(error => {
          expect(screen.getByText(error)).toBeInTheDocument();
        });
      });

      it('should handle very long error message', () => {
        const longMessage = 'A'.repeat(500);
        render(<FormError message={longMessage} />);
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });

      it('should handle special characters in message', () => {
        const specialMessage = '<script>alert("test")</script>';
        render(<FormError message={specialMessage} />);
        expect(screen.getByText(specialMessage)).toBeInTheDocument();
      });
    });

    describe('Custom Props', () => {
      it('should apply className prop', () => {
        const { container } = render(<FormError message="Error" className="my-custom" />);
        const wrapper = container.querySelector('.my-custom');
        expect(wrapper).toBeInTheDocument();
      });

      it('should merge className with default classes', () => {
        const { container } = render(<FormError message="Error" className="my-4 mx-2" />);
        const wrapper = container.querySelector('.my-4');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveClass('mx-2');
      });
    });
  });

  describe('FieldError Component', () => {
    describe('Rendering', () => {
      it('should render without crashing', () => {
        render(<FieldError name="email" errors={{ email: 'Invalid email' }} />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });

      it('should not render when errors is undefined', () => {
        const { container } = render(<FieldError name="email" />);
        expect(container.firstChild).toBeNull();
      });

      it('should not render when field has no error', () => {
        const { container } = render(<FieldError name="email" errors={{ password: 'Wrong password' }} />);
        expect(container.firstChild).toBeNull();
      });

      it('should render error for specific field', () => {
        render(<FieldError name="username" errors={{ username: 'Username required' }} />);
        expect(screen.getByText('Username required')).toBeInTheDocument();
      });
    });

    describe('Error Types', () => {
      it('should handle string error', () => {
        render(<FieldError name="email" errors={{ email: 'Invalid email' }} />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });

      it('should handle array of errors', () => {
        render(<FieldError name="password" errors={{ password: ['Too short', 'No numbers'] }} />);
        expect(screen.getByText('Too short')).toBeInTheDocument();
        expect(screen.getByText('No numbers')).toBeInTheDocument();
      });

      it('should render with inline variant by default', () => {
        const { container } = render(<FieldError name="email" errors={{ email: 'Error' }} />);
        const wrapper = container.querySelector('.space-y-1');
        expect(wrapper).toBeInTheDocument();
      });
    });

    describe('Multiple Fields', () => {
      it('should render error for correct field when multiple errors exist', () => {
        const errors = {
          email: 'Invalid email',
          password: 'Password too short',
          username: 'Username taken'
        };

        render(<FieldError name="password" errors={errors} />);
        expect(screen.getByText('Password too short')).toBeInTheDocument();
        expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
        expect(screen.queryByText('Username taken')).not.toBeInTheDocument();
      });

      it('should handle nested field names', () => {
        render(<FieldError name="user.email" errors={{ 'user.email': 'Invalid' }} />);
        expect(screen.getByText('Invalid')).toBeInTheDocument();
      });
    });

    describe('Custom Props', () => {
      it('should apply custom className', () => {
        const { container } = render(<FieldError name="email" errors={{ email: 'Error' }} className="custom-field-error" />);
        const wrapper = container.querySelector('.custom-field-error');
        expect(wrapper).toBeInTheDocument();
      });

      it('should pass className to FormError', () => {
        const { container } = render(<FieldError name="email" errors={{ email: 'Error' }} className="mt-2" />);
        const wrapper = container.querySelector('.mt-2');
        expect(wrapper).toBeInTheDocument();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty errors object', () => {
        const { container } = render(<FieldError name="email" errors={{}} />);
        expect(container.firstChild).toBeNull();
      });

      it('should handle null error value', () => {
        const { container } = render(<FieldError name="email" errors={{ email: null as any }} />);
        expect(container.firstChild).toBeNull();
      });

      it('should handle undefined error value', () => {
        const { container } = render(<FieldError name="email" errors={{ email: undefined }} />);
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Integration', () => {
    it('should work together in a form context', () => {
      const errors = {
        email: 'Invalid email',
        password: ['Too short', 'No special characters']
      };

      render(
        <form>
          <div>
            <label>Email</label>
            <input name="email" />
            <FieldError name="email" errors={errors} />
          </div>
          <div>
            <label>Password</label>
            <input name="password" />
            <FieldError name="password" errors={errors} />
          </div>
        </form>
      );

      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.getByText('Too short')).toBeInTheDocument();
      expect(screen.getByText('No special characters')).toBeInTheDocument();
    });

    it('should render card variant FormError with multiple errors', () => {
      const { container } = render(
        <div>
          <FormError
            message={['Error 1', 'Error 2', 'Error 3']}
            variant="card"
          />
        </div>
      );

      const list = container.querySelector('ul.list-disc');
      expect(list).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });
  });
});
