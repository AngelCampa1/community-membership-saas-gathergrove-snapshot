/**
 * Tests for CTAModalManager.tsx - CTA modal orchestration (smoke tests)
 * Note: This component manages multiple modal states and timing
 * Full modal coordination testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import * as CTAModalManager from '../CTAModalManager';

// Mock modal components
jest.mock('../ExitIntentModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => (
    isOpen ? <div data-testid="exit-intent-modal">ExitIntentModal</div> : null
  ),
}));

jest.mock('../DemoVideoModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => (
    isOpen ? <div data-testid="demo-video-modal">DemoVideoModal</div> : null
  ),
}));

jest.mock('../LeadMagnetModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onOpenConsultation }: any) => (
    isOpen ? <div data-testid="lead-magnet-modal">LeadMagnetModal</div> : null
  ),
}));

jest.mock('../ConsultationModal', () => ({
  ConsultationModal: ({ isOpen, onClose }: any) => (
    isOpen ? <div data-testid="consultation-modal">ConsultationModal</div> : null
  ),
}));

describe('CTAModalManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('exports openDemoModal function', () => {
      expect(CTAModalManager.openDemoModal).toBeDefined();
      expect(typeof CTAModalManager.openDemoModal).toBe('function');
    });

    it('exports openLeadMagnetModal function', () => {
      expect(CTAModalManager.openLeadMagnetModal).toBeDefined();
      expect(typeof CTAModalManager.openLeadMagnetModal).toBe('function');
    });

    it('exports openConsultationModal function', () => {
      expect(CTAModalManager.openConsultationModal).toBeDefined();
      expect(typeof CTAModalManager.openConsultationModal).toBe('function');
    });
  });
});
