/**
 * Tests for ExitIntentTesting.tsx - Exit intent testing interface (smoke tests)
 * Note: This is a development/testing utility component
 * Full testing interface validation deferred
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ExitIntentTesting } from '../ExitIntentTesting';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TestTube: () => <div data-testid="test-tube-icon">TestTube</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  RotateCcw: () => <div data-testid="rotate-icon">Rotate</div>,
}));

describe('ExitIntentTesting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(<ExitIntentTesting />)).not.toThrow();
    });

    it('exports the ExitIntentTesting component', () => {
      expect(ExitIntentTesting).toBeDefined();
      expect(typeof ExitIntentTesting).toBe('function');
    });

    it('has correct component name', () => {
      expect(ExitIntentTesting.name).toBe('ExitIntentTesting');
    });
  });
});
