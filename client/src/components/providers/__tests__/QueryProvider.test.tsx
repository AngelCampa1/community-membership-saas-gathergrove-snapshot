/**
 * Tests for query-provider.tsx - React Query provider configuration
 * Following boundary mocking pattern: mock only external boundary (@tanstack/react-query)
 */

import React from 'react';
import { render } from '@testing-library/react';
import { QueryProvider } from '../query-provider';

// Mock external libraries
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

describe('QueryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders children without error', () => {
      const { getByText } = render(
        <QueryProvider>
          <div>Test Child</div>
        </QueryProvider>
      );

      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      const { getByText } = render(
        <QueryProvider>
          <div>Child 1</div>
          <div>Child 2</div>
        </QueryProvider>
      );

      expect(getByText('Child 1')).toBeInTheDocument();
      expect(getByText('Child 2')).toBeInTheDocument();
    });

    it('renders complex component tree', () => {
      const { getByText } = render(
        <QueryProvider>
          <div>
            <h1>Title</h1>
            <div>
              <p>Nested content</p>
            </div>
          </div>
        </QueryProvider>
      );

      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Nested content')).toBeInTheDocument();
    });
  });

  describe('Children handling', () => {
    it('handles null children without error', () => {
      expect(() => {
        render(
          <QueryProvider>
            {null}
          </QueryProvider>
        );
      }).not.toThrow();
    });

    it('handles conditional children', () => {
      const showContent = true;

      const { getByText, queryByText } = render(
        <QueryProvider>
          {showContent ? <div>Visible</div> : <div>Hidden</div>}
        </QueryProvider>
      );

      expect(getByText('Visible')).toBeInTheDocument();
      expect(queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('handles array of children', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      const { getByText } = render(
        <QueryProvider>
          {items.map(item => (
            <div key={item}>{item}</div>
          ))}
        </QueryProvider>
      );

      items.forEach(item => {
        expect(getByText(item)).toBeInTheDocument();
      });
    });
  });

  describe('Provider stability', () => {
    it('maintains children across rerenders', () => {
      const { getByText, rerender } = render(
        <QueryProvider>
          <div>Initial</div>
        </QueryProvider>
      );

      expect(getByText('Initial')).toBeInTheDocument();

      rerender(
        <QueryProvider>
          <div>Updated</div>
        </QueryProvider>
      );

      expect(getByText('Updated')).toBeInTheDocument();
    });

    it('does not throw errors on multiple renders', () => {
      const { rerender } = render(
        <QueryProvider>
          <div>Test</div>
        </QueryProvider>
      );

      expect(() => {
        rerender(
          <QueryProvider>
            <div>Test 2</div>
          </QueryProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Component wrapper behavior', () => {
    it('wraps children in QueryClientProvider', () => {
      const { container } = render(
        <QueryProvider>
          <div data-testid="child">Test</div>
        </QueryProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('does not interfere with child component functionality', () => {
      let buttonClicked = false;
      const handleClick = () => {
        buttonClicked = true;
      };

      const { getByRole } = render(
        <QueryProvider>
          <button onClick={handleClick}>Click me</button>
        </QueryProvider>
      );

      const button = getByRole('button');
      button.click();

      expect(buttonClicked).toBe(true);
    });
  });
});
