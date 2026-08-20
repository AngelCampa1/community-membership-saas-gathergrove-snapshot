/**
 * Tests for ConsultationModal.tsx - Consultation booking modal (smoke tests)
 * Note: This component has complex form handling and service integrations
 * Full form submission and validation testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ConsultationModal } from '../ConsultationModal';

// Mock services
jest.mock('@/services/ctaAnalyticsService', () => ({
  ctaAnalyticsService: {
    trackClick: jest.fn(),
    trackSubmit: jest.fn(),
  },
}));

jest.mock('@/services/marketingService', () => ({
  marketingService: {
    submitConsultation: jest.fn(() => Promise.resolve()),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  CheckCircle: () => <div data-testid="check-icon">CheckCircle</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  ExternalLink: () => <div data-testid="external-icon">ExternalLink</div>,
}));

describe('ConsultationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing when closed', () => {
      expect(() => render(
        <ConsultationModal isOpen={false} onClose={jest.fn()} />
      )).not.toThrow();
    });

    it('renders without crashing when open', () => {
      expect(() => render(
        <ConsultationModal isOpen={true} onClose={jest.fn()} />
      )).not.toThrow();
    });

    it('accepts isOpen prop', () => {
      expect(() => render(
        <ConsultationModal isOpen={true} onClose={jest.fn()} />
      )).not.toThrow();
    });

    it('accepts onClose prop', () => {
      const onClose = jest.fn();
      expect(() => render(
        <ConsultationModal isOpen={true} onClose={onClose} />
      )).not.toThrow();
    });

    it('accepts ctaId prop', () => {
      expect(() => render(
        <ConsultationModal isOpen={true} onClose={jest.fn()} ctaId="test-cta-1" />
      )).not.toThrow();
    });

    it('renders with all props combined', () => {
      expect(() => render(
        <ConsultationModal
          isOpen={true}
          onClose={jest.fn()}
          ctaId="test-cta-2"
        />
      )).not.toThrow();
    });
  });
});
