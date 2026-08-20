/**
 * Tests for MinimalistHeader.tsx - Simplified header variant (smoke tests)
 * Note: This component has glassmorphism effects and theme-aware styling
 * Full styling and theme testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MinimalistHeader } from '../MinimalistHeader';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
}));

describe('MinimalistHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(<MinimalistHeader />)).not.toThrow();
    });

    it('renders header element', () => {
      const { container } = render(<MinimalistHeader />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('accepts title prop', () => {
      expect(() => render(<MinimalistHeader title="Test Title" />)).not.toThrow();
    });

    it('accepts title prop without crashing', () => {
      expect(() => render(<MinimalistHeader title="My App" />)).not.toThrow();
    });

    it('accepts showThemeToggle prop', () => {
      expect(() => render(<MinimalistHeader showThemeToggle={true} />)).not.toThrow();
      expect(() => render(<MinimalistHeader showThemeToggle={false} />)).not.toThrow();
    });

    it('accepts children prop', () => {
      expect(() => render(
        <MinimalistHeader>
          <button>Action</button>
        </MinimalistHeader>
      )).not.toThrow();
    });

    it('accepts children without crashing', () => {
      expect(() => render(
        <MinimalistHeader>
          <button>Test Button</button>
        </MinimalistHeader>
      )).not.toThrow();
    });

    it('accepts className prop', () => {
      expect(() => render(<MinimalistHeader className="custom-header" />)).not.toThrow();
    });

    it('renders with multiple props combined', () => {
      expect(() => render(
        <MinimalistHeader
          title="Complete Header"
          showThemeToggle={true}
          className="custom-class"
        >
          <button>Action</button>
        </MinimalistHeader>
      )).not.toThrow();
    });
  });
});
