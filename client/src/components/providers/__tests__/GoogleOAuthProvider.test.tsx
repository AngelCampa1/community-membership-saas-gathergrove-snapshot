/**
 * Tests for google-oauth-provider.tsx - Google OAuth provider wrapper
 * Following boundary mocking pattern: mock only external boundary (@react-oauth/google)
 */

import React from 'react';
import { render } from '@testing-library/react';
import { GoogleOAuthProvider } from '../google-oauth-provider';

// Mock the external library
jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: any) => <div>{children}</div>,
}));

describe('GoogleOAuthProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('With client ID configured', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id-123';
    });

    it('renders children without error', () => {
      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>Test Child</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>Child 1</div>
          <div>Child 2</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Child 1')).toBeInTheDocument();
      expect(getByText('Child 2')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>
            <h1>Title</h1>
            <p>Content</p>
          </div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Without client ID configured', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    });

    it('renders children without GoogleOAuthProvider wrapper', () => {
      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>Test Child</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('allows app to work without Google SSO', () => {
      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>App Content</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('App Content')).toBeInTheDocument();
    });
  });

  describe('Environment variable handling', () => {
    it('handles undefined client ID', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = undefined;

      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>Test</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Test')).toBeInTheDocument();
    });

    it('handles empty string client ID', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = '';

      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>Test</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Test')).toBeInTheDocument();
    });

    it('handles valid client ID', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'valid-client-id';

      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>Test</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Children rendering', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
    });

    it('renders complex children structure', () => {
      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>
            <h1>Title</h1>
            <p>Content</p>
          </div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
    });

    it('renders conditional children', () => {
      const showContent = true;

      const { getByText, queryByText } = render(
        <GoogleOAuthProvider>
          {showContent ? <div>Visible</div> : <div>Hidden</div>}
        </GoogleOAuthProvider>
      );

      expect(getByText('Visible')).toBeInTheDocument();
      expect(queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('renders array of children', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      const { getByText } = render(
        <GoogleOAuthProvider>
          {items.map(item => (
            <div key={item}>{item}</div>
          ))}
        </GoogleOAuthProvider>
      );

      items.forEach(item => {
        expect(getByText(item)).toBeInTheDocument();
      });
    });
  });

  describe('Graceful degradation', () => {
    it('works when Google OAuth is not configured', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      const { getByText } = render(
        <GoogleOAuthProvider>
          <div>Application works</div>
        </GoogleOAuthProvider>
      );

      expect(getByText('Application works')).toBeInTheDocument();
    });

    it('does not throw error with missing client ID', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      expect(() => {
        render(
          <GoogleOAuthProvider>
            <div>Test</div>
          </GoogleOAuthProvider>
        );
      }).not.toThrow();
    });
  });
});
