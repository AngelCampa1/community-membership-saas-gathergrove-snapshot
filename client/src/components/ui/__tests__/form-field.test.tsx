import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormField, FormGroup } from '../form-field';
import { Input } from '../input';
import { Textarea } from '../textarea';

describe('FormField', () => {
  describe('Basic Rendering', () => {
    it('should render with label', () => {
      render(<FormField label="Username" />);

      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should render default input when no children provided', () => {
      render(<FormField label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should generate unique ID for field', () => {
      render(<FormField label="Name" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id');
      expect(input.id).toBeTruthy();
    });

    it('should generate different IDs for multiple fields', () => {
      render(
        <>
          <FormField label="Field 1" />
          <FormField label="Field 2" />
        </>
      );

      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0].id).not.toBe(inputs[1].id);
    });

    it('should apply custom className', () => {
      const { container } = render(<FormField label="Test" className="custom-field" />);

      const fieldWrapper = container.querySelector('.custom-field');
      expect(fieldWrapper).toBeInTheDocument();
      expect(fieldWrapper).toHaveClass('space-y-2'); // Still has base class
    });
  });

  describe('Required Field', () => {
    it('should display asterisk when required', () => {
      render(<FormField label="Password" required />);

      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-destructive');
    });

    it('should have aria-label on required asterisk', () => {
      render(<FormField label="Email" required />);

      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveAttribute('aria-label', 'required');
    });

    it('should set aria-required on input', () => {
      render(<FormField label="Name" required />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should not display asterisk when not required', () => {
      render(<FormField label="Optional" required={false} />);

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      render(<FormField label="Email" error="Invalid email address" />);

      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    it('should display error with role alert', () => {
      render(<FormField label="Email" error="Error message" />);

      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Error message');
    });

    it('should apply destructive text color to error', () => {
      render(<FormField label="Field" error="Error" />);

      const error = screen.getByRole('alert');
      expect(error).toHaveClass('text-destructive');
      expect(error).toHaveClass('text-sm');
    });

    it('should link error with aria-describedby', () => {
      render(<FormField label="Email" error="Invalid" />);

      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toContain('-error');
    });

    it('should set aria-invalid when error exists', () => {
      render(<FormField label="Email" error="Error" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not set aria-invalid when no error', () => {
      render(<FormField label="Email" />);

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('Description Text', () => {
    it('should display description', () => {
      render(<FormField label="Password" description="Must be at least 8 characters" />);

      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('should apply muted text styling to description', () => {
      render(<FormField label="Field" description="Help text" />);

      const description = screen.getByText('Help text');
      expect(description).toHaveClass('text-muted-foreground');
      expect(description).toHaveClass('text-sm');
    });

    it('should link description with aria-describedby', () => {
      render(<FormField label="Email" description="Enter your email" />);

      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toContain('-description');
    });

    it('should render description before error', () => {
      const { container } = render(
        <FormField
          label="Field"
          description="Description"
          error="Error"
        />
      );

      const texts = Array.from(container.querySelectorAll('p'));
      const descriptionIndex = texts.findIndex(p => p.textContent === 'Description');
      const errorIndex = texts.findIndex(p => p.textContent === 'Error');

      expect(descriptionIndex).toBeGreaterThan(-1);
      expect(errorIndex).toBeGreaterThan(-1);
      expect(descriptionIndex).toBeLessThan(errorIndex);
    });
  });

  describe('Combined Error and Description', () => {
    it('should display both error and description', () => {
      render(
        <FormField
          label="Password"
          description="Min 8 characters"
          error="Password too short"
        />
      );

      expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Password too short')).toBeInTheDocument();
    });

    it('should include both IDs in aria-describedby', () => {
      render(
        <FormField
          label="Email"
          description="Your email"
          error="Invalid"
        />
      );

      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toContain('-description');
      expect(describedBy).toContain('-error');
    });
  });

  describe('Custom Children', () => {
    it('should render custom input component', () => {
      render(
        <FormField label="Message">
          <Textarea />
        </FormField>
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should clone child element with proper props', () => {
      render(
        <FormField label="Email">
          <Input type="email" placeholder="user@example.com" />
        </FormField>
      );

      const input = screen.getByPlaceholderText('user@example.com');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('id');
      expect(input).toHaveAttribute('aria-labelledby');
    });

    it('should pass aria-describedby to custom children', () => {
      render(
        <FormField label="Field" description="Help text">
          <Input />
        </FormField>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('should pass aria-invalid to custom children when error', () => {
      render(
        <FormField label="Field" error="Error message">
          <Input />
        </FormField>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should pass aria-required to custom children', () => {
      render(
        <FormField label="Field" required>
          <Input />
        </FormField>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should work with select elements', () => {
      render(
        <FormField label="Country">
          <select>
            <option>USA</option>
            <option>Canada</option>
          </select>
        </FormField>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id');
      expect(select).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Label Association', () => {
    it('should associate label with input via htmlFor', () => {
      render(<FormField label="Username" />);

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('should have aria-labelledby on input', () => {
      render(<FormField label="Email" />);

      const input = screen.getByRole('textbox');
      const labelledBy = input.getAttribute('aria-labelledby');

      expect(labelledBy).toContain('-label');
    });
  });

  describe('Accessibility', () => {
    it('should have complete ARIA attributes', () => {
      render(
        <FormField
          label="Email"
          required
          description="Enter your email"
          error="Invalid email"
        />
      );

      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('id');
      expect(input).toHaveAttribute('aria-labelledby');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should handle keyboard navigation', () => {
      render(<FormField label="Name" />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(input).toHaveFocus();
    });

    it('should support screen reader announcement for required', () => {
      render(<FormField label="Required Field" required />);

      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveAttribute('aria-label', 'required');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      render(<FormField label="" />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle very long labels', () => {
      const longLabel = 'This is a very long label that might wrap to multiple lines in the UI';

      render(<FormField label={longLabel} />);

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      render(<FormField label="Email <user@example.com>" />);

      expect(screen.getByText('Email <user@example.com>')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      render(
        <FormField label="Field">
          {null}
        </FormField>
      );

      // Should render default input when children is null
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });
});

describe('FormGroup', () => {
  describe('Basic Rendering', () => {
    it('should render fieldset element', () => {
      render(
        <FormGroup>
          <FormField label="Field 1" />
        </FormGroup>
      );

      const fieldset = document.querySelector('fieldset');
      expect(fieldset).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <FormGroup>
          <FormField label="First Name" />
          <FormField label="Last Name" />
        </FormGroup>
      );

      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
    });

    it('should apply base styling classes', () => {
      const { container } = render(
        <FormGroup>
          <div>Content</div>
        </FormGroup>
      );

      const fieldset = container.querySelector('fieldset');
      expect(fieldset).toHaveClass('space-y-4');
      expect(fieldset).toHaveClass('border-0');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <FormGroup className="custom-group">
          <div>Content</div>
        </FormGroup>
      );

      const fieldset = container.querySelector('fieldset');
      expect(fieldset).toHaveClass('custom-group');
      expect(fieldset).toHaveClass('space-y-4'); // Still has base classes
    });
  });

  describe('Title and Legend', () => {
    it('should render title as legend', () => {
      render(
        <FormGroup title="Personal Information">
          <FormField label="Name" />
        </FormGroup>
      );

      const legend = screen.getByText('Personal Information');
      expect(legend.tagName).toBe('LEGEND');
    });

    it('should apply styling to legend', () => {
      render(
        <FormGroup title="Contact Details">
          <div>Content</div>
        </FormGroup>
      );

      const legend = screen.getByText('Contact Details');
      expect(legend).toHaveClass('text-lg');
      expect(legend).toHaveClass('font-semibold');
    });

    it('should link legend with fieldset via aria-labelledby', () => {
      render(
        <FormGroup title="Section Title">
          <div>Content</div>
        </FormGroup>
      );

      const fieldset = document.querySelector('fieldset');
      const legend = screen.getByText('Section Title');

      expect(fieldset).toHaveAttribute('aria-labelledby', legend.id);
    });

    it('should not render legend when no title', () => {
      render(
        <FormGroup>
          <div>Content</div>
        </FormGroup>
      );

      const legends = document.querySelectorAll('legend');
      expect(legends.length).toBe(0);
    });

    it('should not have aria-labelledby when no title', () => {
      render(
        <FormGroup>
          <div>Content</div>
        </FormGroup>
      );

      const fieldset = document.querySelector('fieldset');
      expect(fieldset).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('Description', () => {
    it('should render description text', () => {
      render(
        <FormGroup
          title="Account Settings"
          description="Manage your account preferences"
        >
          <div>Content</div>
        </FormGroup>
      );

      expect(screen.getByText('Manage your account preferences')).toBeInTheDocument();
    });

    it('should apply muted styling to description', () => {
      render(
        <FormGroup description="Description text">
          <div>Content</div>
        </FormGroup>
      );

      const description = screen.getByText('Description text');
      expect(description).toHaveClass('text-muted-foreground');
      expect(description).toHaveClass('text-sm');
    });

    it('should render description without title', () => {
      render(
        <FormGroup description="Standalone description">
          <div>Content</div>
        </FormGroup>
      );

      expect(screen.getByText('Standalone description')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should group multiple FormFields', () => {
      render(
        <FormGroup title="User Details">
          <FormField label="First Name" required />
          <FormField label="Last Name" required />
          <FormField label="Email" />
        </FormGroup>
      );

      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should work with nested FormGroups', () => {
      render(
        <FormGroup title="Main Group">
          <FormField label="Field 1" />
          <FormGroup title="Sub Group">
            <FormField label="Field 2" />
          </FormGroup>
        </FormGroup>
      );

      expect(screen.getByText('Main Group')).toBeInTheDocument();
      expect(screen.getByText('Sub Group')).toBeInTheDocument();
      expect(screen.getByText('Field 1')).toBeInTheDocument();
      expect(screen.getByText('Field 2')).toBeInTheDocument();
    });

    it('should handle form submission with grouped fields', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <FormGroup title="Login">
            <FormField label="Username" required />
            <FormField label="Password" required />
          </FormGroup>
          <button type="submit">Submit</button>
        </form>
      );

      const submit = screen.getByText('Submit');
      submit.click();

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic fieldset structure', () => {
      render(
        <FormGroup title="Address">
          <FormField label="Street" />
          <FormField label="City" />
        </FormGroup>
      );

      const fieldset = document.querySelector('fieldset');
      const legend = document.querySelector('legend');

      expect(fieldset).toBeInTheDocument();
      expect(legend).toBeInTheDocument();
      expect(fieldset).toContainElement(legend);
    });

    it('should generate unique IDs for multiple groups', () => {
      render(
        <>
          <FormGroup title="Group 1">
            <div>Content 1</div>
          </FormGroup>
          <FormGroup title="Group 2">
            <div>Content 2</div>
          </FormGroup>
        </>
      );

      const legend1 = screen.getByText('Group 1');
      const legend2 = screen.getByText('Group 2');
      expect(legend1.id).not.toBe(legend2.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<FormGroup title="Empty Group" />);

      expect(screen.getByText('Empty Group')).toBeInTheDocument();
    });

    it('should handle mixed content', () => {
      render(
        <FormGroup title="Mixed Content">
          <FormField label="Field" />
          <p>Some text</p>
          <button>Button</button>
        </FormGroup>
      );

      expect(screen.getByText('Field')).toBeInTheDocument();
      expect(screen.getByText('Some text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
    });
  });
});
