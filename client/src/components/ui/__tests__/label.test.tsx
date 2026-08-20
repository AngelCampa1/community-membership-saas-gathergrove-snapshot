import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '../label';

describe('Label', () => {
  describe('Basic Rendering', () => {
    it('should render children', () => {
      render(<Label>Email Address</Label>);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should render as label element', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label.tagName).toBe('LABEL');
    });

    it('should have data-slot attribute', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveAttribute('data-slot', 'label');
    });

    it('should have base label classes', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('flex');
      expect(label).toHaveClass('items-center');
      expect(label).toHaveClass('gap-2');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('leading-none');
      expect(label).toHaveClass('font-medium');
      expect(label).toHaveClass('select-none');
    });

    it('should have disabled state classes', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none');
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-50');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Label className="custom-label" data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('custom-label');
      expect(label).toHaveClass('flex'); // Still has base classes
    });

    it('should accept htmlFor attribute', () => {
      render(<Label htmlFor="input-id">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveAttribute('for', 'input-id');
    });

    it('should accept id attribute', () => {
      render(<Label id="label-id">Label</Label>);
      const label = document.getElementById('label-id');
      expect(label).toBeInTheDocument();
    });

    it('should spread additional props', () => {
      render(
        <Label data-testid="test-label" data-custom="value">
          Label
        </Label>
      );
      const label = screen.getByTestId('test-label');
      expect(label).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Label with Input', () => {
    it('should associate with input using htmlFor', () => {
      render(
        <div>
          <Label htmlFor="test-input">Email</Label>
          <input id="test-input" type="email" />
        </div>
      );
      const label = screen.getByText('Email');
      const input = document.getElementById('test-input');
      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toBeInTheDocument();
    });

    // Note: Label click -> input focus is browser behavior, not testable in JSDOM
  });

  describe('Content Types', () => {
    it('should render text content', () => {
      render(<Label>Simple Text</Label>);
      expect(screen.getByText('Simple Text')).toBeInTheDocument();
    });

    it('should render with required indicator', () => {
      render(<Label>Email *</Label>);
      expect(screen.getByText('Email *')).toBeInTheDocument();
    });

    it('should render with icon and text', () => {
      render(
        <Label>
          <span>✓</span> Verified
        </Label>
      );
      expect(screen.getByText(/Verified/)).toBeInTheDocument();
    });

    it('should render with nested elements', () => {
      render(
        <Label>
          <span>Email</span>
          <span className="text-destructive">*</span>
        </Label>
      );
      expect(screen.getByText('Email')).toBeInTheDocument();
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('text-destructive');
    });
  });

  describe('Accessibility', () => {
    it('should work with screen readers', () => {
      render(<Label htmlFor="test-input">Username</Label>);
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('should have proper text sizing for readability', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('text-sm');
    });

    it('should be non-selectable by default', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('select-none');
    });
  });

  describe('Combined with Input States', () => {
    it('should render with disabled input peer', () => {
      render(
        <div>
          <Label htmlFor="test-input" data-testid="test-label">Email</Label>
          <input id="test-input" type="email" disabled className="peer" />
        </div>
      );
      const label = screen.getByTestId('test-label');
      // Label has peer-disabled classes for when input is disabled
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-50');
    });

    it('should render in disabled group', () => {
      render(
        <div data-disabled="true" className="group">
          <Label data-testid="test-label">Email</Label>
          <input type="email" />
        </div>
      );
      const label = screen.getByTestId('test-label');
      // Label has group-data classes for when in disabled group
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none');
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50');
    });
  });

  describe('Styling', () => {
    it('should have medium font weight', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('font-medium');
    });

    it('should have no leading for tight spacing', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('leading-none');
    });

    it('should have gap for icon spacing', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('gap-2');
    });

    it('should be flex container for icon alignment', () => {
      render(<Label data-testid="test-label">Label</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toHaveClass('flex');
      expect(label).toHaveClass('items-center');
    });
  });
});
