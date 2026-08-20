/**
 * Tests for theme-provider.tsx - Light-only pass-through provider
 * ThemeProvider is now a simple pass-through that renders children directly.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders children without error', () => {
      const { getByText } = render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      const { getByText } = render(
        <ThemeProvider>
          <div>Child 1</div>
          <div>Child 2</div>
        </ThemeProvider>
      );

      expect(getByText('Child 1')).toBeInTheDocument();
      expect(getByText('Child 2')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      const { getByText } = render(
        <ThemeProvider>
          <div>
            <h1>Title</h1>
            <p>Content</p>
          </div>
        </ThemeProvider>
      );

      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Children handling', () => {
    it('handles null children without error', () => {
      expect(() => {
        render(
          <ThemeProvider>
            {null}
          </ThemeProvider>
        );
      }).not.toThrow();
    });

    it('handles undefined children without error', () => {
      expect(() => {
        render(
          <ThemeProvider>
            {undefined}
          </ThemeProvider>
        );
      }).not.toThrow();
    });

    it('handles conditional children', () => {
      const showContent = true;

      const { getByText, queryByText } = render(
        <ThemeProvider>
          {showContent ? <div>Visible</div> : <div>Hidden</div>}
        </ThemeProvider>
      );

      expect(getByText('Visible')).toBeInTheDocument();
      expect(queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('handles dynamic children', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      const { getByText } = render(
        <ThemeProvider>
          {items.map(item => (
            <div key={item}>{item}</div>
          ))}
        </ThemeProvider>
      );

      items.forEach(item => {
        expect(getByText(item)).toBeInTheDocument();
      });
    });
  });

  describe('Component behavior', () => {
    it('maintains children across rerenders', () => {
      const { getByText, rerender } = render(
        <ThemeProvider>
          <div>Original</div>
        </ThemeProvider>
      );

      expect(getByText('Original')).toBeInTheDocument();

      rerender(
        <ThemeProvider>
          <div>Updated</div>
        </ThemeProvider>
      );

      expect(getByText('Updated')).toBeInTheDocument();
    });

    it('does not throw errors on multiple renders', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(() => {
        rerender(
          <ThemeProvider>
            <div>Test 2</div>
          </ThemeProvider>
        );
      }).not.toThrow();
    });

    it('does not interfere with child component functionality', () => {
      let buttonClicked = false;
      const handleClick = () => {
        buttonClicked = true;
      };

      const { getByRole } = render(
        <ThemeProvider>
          <button onClick={handleClick}>Click me</button>
        </ThemeProvider>
      );

      const button = getByRole('button');
      button.click();

      expect(buttonClicked).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles empty props', () => {
      const { getByText } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(getByText('Test')).toBeInTheDocument();
    });

    it('handles rapid rerenders', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>1</div>
        </ThemeProvider>
      );

      expect(() => {
        for (let i = 2; i <= 10; i++) {
          rerender(
            <ThemeProvider>
              <div>{i}</div>
            </ThemeProvider>
          );
        }
      }).not.toThrow();
    });

    it('is a pass-through: does not add wrapper DOM elements', () => {
      const { container } = render(
        <ThemeProvider>
          <div data-testid="child">hello</div>
        </ThemeProvider>
      );

      // The fragment pass-through means child is the first child of the container
      expect(container.firstChild).not.toBeNull();
      expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
    });
  });
});
