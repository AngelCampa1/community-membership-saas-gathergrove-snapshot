/**
 * Tests for LeadMagnetModal.tsx - Lead magnet download modal (smoke tests)
 * Note: This component has lead capture and file download functionality
 * Full download and tracking testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { LeadMagnetModal } from '../LeadMagnetModal';

// Mock services
jest.mock('@/services/ctaAnalyticsService', () => ({
  ctaAnalyticsService: {
    trackView: jest.fn(),
    trackClick: jest.fn(),
    trackSubmit: jest.fn(),
    trackDismiss: jest.fn(),
  },
}));

jest.mock('@/services/marketingService', () => ({
  marketingService: {
    submitLead: jest.fn(() => Promise.resolve({ downloadUrl: 'https://example.com/download' })),
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
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
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

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  FileText: () => <div data-testid="file-icon">FileText</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  CheckCircle: () => <div data-testid="check-icon">CheckCircle</div>,
}));

describe('LeadMagnetModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing when closed', () => {
      expect(() => render(
        <LeadMagnetModal isOpen={false} onClose={jest.fn()} />
      )).not.toThrow();
    });

    it('renders without crashing when open', () => {
      expect(() => render(
        <LeadMagnetModal isOpen={true} onClose={jest.fn()} />
      )).not.toThrow();
    });

    it('accepts isOpen prop', () => {
      expect(() => render(
        <LeadMagnetModal isOpen={true} onClose={jest.fn()} />
      )).not.toThrow();
    });

    it('accepts onClose prop', () => {
      const onClose = jest.fn();
      expect(() => render(
        <LeadMagnetModal isOpen={true} onClose={onClose} />
      )).not.toThrow();
    });

    it('accepts onOpenConsultation prop', () => {
      expect(() => render(
        <LeadMagnetModal
          isOpen={true}
          onClose={jest.fn()}
          onOpenConsultation={jest.fn()}
        />
      )).not.toThrow();
    });

    it('renders with all props combined', () => {
      expect(() => render(
        <LeadMagnetModal
          isOpen={true}
          onClose={jest.fn()}
          onOpenConsultation={jest.fn()}
        />
      )).not.toThrow();
    });
  });
});
