'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { DemoVideoModal } from './DemoVideoModal';
import { LeadMagnetModal } from './LeadMagnetModal';
import { ConsultationModal } from './ConsultationModal';
import { logger } from '@/lib/logger';

type ModalType = 'demo' | 'lead-magnet' | 'consultation' | null;

interface ModalContextType {
  openModal: (type: ModalType, options?: ModalOptions) => void;
  closeModal: () => void;
  currentModal: ModalType;
}

interface ModalOptions {
  ctaId?: string;
  magnetType?: 'guide' | 'checklist' | 'template';
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface CTAModalManagerProps {
  children: ReactNode;
}

export function CTAModalManager({ children }: CTAModalManagerProps) {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({});

  const openModal = (type: ModalType, options: ModalOptions = {}) => {
    setCurrentModal(type);
    setModalOptions(options);
  };

  const closeModal = () => {
    setCurrentModal(null);
    setModalOptions({});
  };

  // Listen for global events from CTA configs
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: ModalType } & ModalOptions;
      if (!detail || !detail.type) return;
      openModal(detail.type, detail);
    };
    window.addEventListener('openCTAModal', handler as EventListener);
    return () => window.removeEventListener('openCTAModal', handler as EventListener);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, currentModal }}>
      {children}
      
      {/* Modal Components */}
      <DemoVideoModal
        isOpen={currentModal === 'demo'}
        onClose={closeModal}
        ctaId={modalOptions.ctaId}
      />
      
      <LeadMagnetModal
        isOpen={currentModal === 'lead-magnet'}
        onClose={closeModal}
        ctaId={modalOptions.ctaId}
        magnetType={modalOptions.magnetType}
      />
      
      <ConsultationModal
        isOpen={currentModal === 'consultation'}
        onClose={closeModal}
        ctaId={modalOptions.ctaId}
      />
    </ModalContext.Provider>
  );
}

export function useCTAModals() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useCTAModals must be used within a CTAModalManager');
  }
  return context;
}

// Global modal opener functions for use in CTA configs
export const openDemoModal = (ctaId?: string) => {
  // This will be replaced by the hook in components
  logger.debug('marketing', 'Opening demo modal', { ctaId });
};

export const openLeadMagnetModal = (ctaId?: string, magnetType: 'guide' | 'checklist' | 'template' = 'guide') => {
  logger.debug('marketing', 'Opening lead magnet modal', { ctaId, magnetType });
};

export const openConsultationModal = (ctaId?: string) => {
  logger.debug('marketing', 'Opening consultation modal', { ctaId });
};