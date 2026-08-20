/**
 * Tests for Hotjar.tsx - Hotjar analytics script injection (smoke tests)
 * Note: This component injects Hotjar tracking script based on environment variables
 * Full integration testing deferred due to third-party script complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import Hotjar from '../Hotjar';

// Mock Next.js Script component
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <script {...props} data-testid="hotjar-script">
      {children}
    </script>
  ),
}));

describe('Hotjar', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Smoke tests', () => {
    it('renders without crashing without env vars', () => {
      delete process.env.NEXT_PUBLIC_HOTJAR_ID;
      delete process.env.NEXT_PUBLIC_HOTJAR_SV;
      expect(() => render(<Hotjar />)).not.toThrow();
    });

    it('returns null when env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_HOTJAR_ID;
      delete process.env.NEXT_PUBLIC_HOTJAR_SV;
      const { container } = render(<Hotjar />);
      expect(container.firstChild).toBeNull();
    });
  });
});
