/**
 * FeaturesSection tests - TDD Red phase
 *
 * Verifies that each feature card is wrapped in a link (<a>) pointing to
 * the correct feature detail page, and that the CTA buttons use Next.js
 * Link rather than bare <a> tags.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeaturesSection } from '../FeaturesSection';

// framer-motion uses IntersectionObserver/animations; stub it to a passthrough
// so tests don't fail on missing browser APIs.
jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        const React = require('react');
        return React.forwardRef(
          ({ children, ...props }: any, ref: any) =>
            React.createElement(prop as string, { ...props, ref }, children)
        );
      },
    }
  ),
  AnimatePresence: ({ children }: any) => children,
}));

describe('FeaturesSection', () => {
  beforeEach(() => {
    render(<FeaturesSection />);
  });

  // ── Feature card links ────────────────────────────────────────────────────

  it('links "Centralized Member Database" to /features/membership-management', () => {
    const link = screen.getByRole('link', { name: /centralized member database/i });
    expect(link).toHaveAttribute('href', '/features/membership-management');
  });

  it('links "Automated Dues & Payments" to /features/dues-collection', () => {
    const link = screen.getByRole('link', { name: /automated dues/i });
    expect(link).toHaveAttribute('href', '/features/dues-collection');
  });

  it('links "Member Communication" to /features/member-communication', () => {
    const link = screen.getByRole('link', { name: /member communication/i });
    expect(link).toHaveAttribute('href', '/features/member-communication');
  });

  it('links "Event Management with RSVPs" to /features/event-planning', () => {
    const link = screen.getByRole('link', { name: /event management with rsvps/i });
    expect(link).toHaveAttribute('href', '/features/event-planning');
  });

  it('links "Community Chat" to /features/community-chat', () => {
    const link = screen.getByRole('link', { name: /community chat/i });
    expect(link).toHaveAttribute('href', '/features/community-chat');
  });

  it('links "Mobile App Access" to /features/mobile-app', () => {
    const link = screen.getByRole('link', { name: /mobile app access/i });
    expect(link).toHaveAttribute('href', '/features/mobile-app');
  });

  it('links "Digital Membership Cards" to /features/membership-management', () => {
    const link = screen.getByRole('link', { name: /digital membership cards/i });
    expect(link).toHaveAttribute('href', '/features/membership-management');
  });

  it('links "Privacy Controls" to /features/member-directory', () => {
    const link = screen.getByRole('link', { name: /privacy controls/i });
    expect(link).toHaveAttribute('href', '/features/member-directory');
  });

  // ── CTA links ─────────────────────────────────────────────────────────────

  it('renders the "Start Free Trial" CTA as a Link with href="/register"', () => {
    const cta = screen.getByRole('link', { name: /start free trial/i });
    expect(cta).toHaveAttribute('href', '/register');
  });

  it('renders the "see pricing" link as a Link with href="/pricing"', () => {
    const pricing = screen.getByRole('link', { name: /see pricing/i });
    expect(pricing).toHaveAttribute('href', '/pricing');
  });
});
