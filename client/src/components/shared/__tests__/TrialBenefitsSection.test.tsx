import React from 'react';

jest.mock('lucide-react', () => ({
  Zap: (props: any) => <svg data-testid="zap-icon" {...props} />,
  Calendar: (props: any) => <svg data-testid="calendar-icon" {...props} />,
  MessageSquare: (props: any) => <svg data-testid="message-icon" {...props} />,
  Smartphone: (props: any) => <svg data-testid="smartphone-icon" {...props} />,
  Users: (props: any) => <svg data-testid="users-icon" {...props} />,
  Download: (props: any) => <svg data-testid="download-icon" {...props} />,
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      return React.forwardRef(({ children, initial, animate, transition, whileHover, ...rest }: any, ref: any) => {
        const Element = prop as string;
        return React.createElement(Element, { ref, ...rest }, children);
      });
    }
  });
  return { motion, AnimatePresence: ({ children }: any) => children };
});

import { render, screen } from '@testing-library/react';
import { TrialBenefitsSection } from '../TrialBenefitsSection';

describe('TrialBenefitsSection', () => {
  it('renders heading and all 6 benefit cards', () => {
    render(<TrialBenefitsSection />);

    expect(screen.getByRole('heading', { name: /your 30-day free trial/i })).toBeInTheDocument();
    expect(screen.getByText('Full Feature Access')).toBeInTheDocument();
    expect(screen.getByText('Unlimited Events')).toBeInTheDocument();
    expect(screen.getByText('Email And Chat')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Access')).toBeInTheDocument();
    expect(screen.getByText('Community Chat')).toBeInTheDocument();
    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
  });
});
