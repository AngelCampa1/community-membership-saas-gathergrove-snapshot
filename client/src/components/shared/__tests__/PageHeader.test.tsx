/**
 * Tests for PageHeader.tsx - Simple reusable page header (smoke tests)
 * Note: This is a simple presentational component with minimal logic
 * Full styling and layout testing deferred
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(<PageHeader title="Test Title" />)).not.toThrow();
    });

    it('renders with title prop', () => {
      const { getByText } = render(<PageHeader title="Test Page" />);
      expect(getByText('Test Page')).toBeInTheDocument();
    });

    it('accepts description prop', () => {
      expect(() => render(
        <PageHeader
          title="Test Title"
          description="Test description"
        />
      )).not.toThrow();
    });

    it('renders description when provided', () => {
      const { getByText } = render(
        <PageHeader
          title="Test Title"
          description="This is a test description"
        />
      );
      expect(getByText('This is a test description')).toBeInTheDocument();
    });

    it('accepts children prop', () => {
      expect(() => render(
        <PageHeader title="Test Title">
          <button>Action Button</button>
        </PageHeader>
      )).not.toThrow();
    });

    it('renders children when provided', () => {
      const { getByRole } = render(
        <PageHeader title="Test Title">
          <button>Test Button</button>
        </PageHeader>
      );
      expect(getByRole('button', { name: /test button/i })).toBeInTheDocument();
    });

    it('accepts className prop', () => {
      expect(() => render(
        <PageHeader title="Test Title" className="custom-class" />
      )).not.toThrow();
    });

    it('renders with all props combined', () => {
      const { getByText, getByRole } = render(
        <PageHeader
          title="Complete Header"
          description="Full description"
          className="custom-header"
        >
          <button>Action</button>
        </PageHeader>
      );
      expect(getByText('Complete Header')).toBeInTheDocument();
      expect(getByText('Full description')).toBeInTheDocument();
      expect(getByRole('button')).toBeInTheDocument();
    });
  });
});
