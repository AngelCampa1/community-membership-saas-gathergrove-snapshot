import { CTAConfig } from '@/types/cta';
import { formatStartingPriceLong } from '@/lib/pricing';

export const CTA_CONFIGS: Record<string, CTAConfig> = {
  // PRIMARY CTAs - Direct trial signup
  'primary-start-free': {
    id: 'primary-start-free',
    tier: 'primary',
    variant: 'high-intent',
    location: 'hero',
    text: 'Start Your Free Trial',
    href: '/register',
    description: 'Credit card required, cancel anytime',
    commitmentLevel: 'high',
    size: 'lg',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'primary',
        cta_text: 'Start Free Trial',
        commitment_level: 'high',
        destination: '/register'
      }
    }
  },
  'primary-create-club': {
    id: 'primary-create-club',
    tier: 'primary',
    variant: 'benefit-focused',
    location: 'hero',
    text: 'Create My Club',
    href: '/register',
    description: 'Set up in under 5 minutes',
    commitmentLevel: 'high',
    size: 'lg',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'primary',
        cta_text: 'Create My Club',
        commitment_level: 'high',
        destination: '/register'
      }
    }
  },
  'primary-get-started': {
    id: 'primary-get-started',
    tier: 'primary',
    variant: 'low-friction',
    location: 'hero',
    text: 'Get Started Now',
    href: '/register',
    description: `30-day free trial, then from ${formatStartingPriceLong()}`,
    commitmentLevel: 'high',
    size: 'lg',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'primary',
        cta_text: 'Get Started Now',
        commitment_level: 'high',
        destination: '/register'
      }
    }
  },

  // SECONDARY CTAs - Product demonstration
  'secondary-watch-demo': {
    id: 'secondary-watch-demo',
    tier: 'secondary',
    variant: 'demo-focused',
    location: 'features',
    text: 'Watch 2-Minute Demo',
    onClick: () => {
      // This will be replaced by modal context in components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('openCTAModal', { 
          detail: { type: 'demo', ctaId: 'secondary-watch-demo' }
        });
        window.dispatchEvent(event);
      }
    },
    description: 'See GatherGrove in action',
    icon: '▶️',
    commitmentLevel: 'medium',
    size: 'md',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'secondary',
        cta_text: 'Watch 2-Minute Demo',
        commitment_level: 'medium',
        engagement_type: 'demo_view'
      }
    }
  },
  'secondary-see-action': {
    id: 'secondary-see-action',
    tier: 'secondary',
    variant: 'demo-focused',
    location: 'features',
    text: 'See It In Action',
    href: '#demo-modal',
    description: 'Interactive product walkthrough',
    icon: '👀',
    commitmentLevel: 'medium',
    size: 'md',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'secondary',
        cta_text: 'See It In Action',
        commitment_level: 'medium',
        engagement_type: 'demo_view'
      }
    }
  },

  // TERTIARY CTAs - Educational lead magnets
  'tertiary-download-guide': {
    id: 'tertiary-download-guide',
    tier: 'tertiary',
    variant: 'educational',
    location: 'features',
    text: 'Download Club Guide',
    onClick: () => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('openCTAModal', { 
          detail: { type: 'lead-magnet', ctaId: 'tertiary-download-guide', magnetType: 'guide' }
        });
        window.dispatchEvent(event);
      }
    },
    description: 'Ultimate club management checklist',
    icon: '📋',
    commitmentLevel: 'low',
    size: 'md',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'tertiary',
        cta_text: 'Download Club Guide',
        commitment_level: 'low',
        engagement_type: 'lead_magnet'
      }
    }
  },
  'tertiary-free-checklist': {
    id: 'tertiary-free-checklist',
    tier: 'tertiary',
    variant: 'educational',
    location: 'footer',
    text: 'Get Free Checklist',
    href: '#lead-magnet-modal',
    description: 'Club management best practices',
    icon: '✅',
    commitmentLevel: 'low',
    size: 'md',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'tertiary',
        cta_text: 'Get Free Checklist',
        commitment_level: 'low',
        engagement_type: 'lead_magnet'
      }
    }
  },

  // SUPPORT CTAs - Personal assistance
  'support-schedule-call': {
    id: 'support-schedule-call',
    tier: 'support',
    variant: 'personal-touch',
    location: 'pricing',
    text: 'Schedule Consultation',
    onClick: () => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('openCTAModal', { 
          detail: { type: 'consultation', ctaId: 'support-schedule-call' }
        });
        window.dispatchEvent(event);
      }
    },
    description: '15-minute setup call',
    icon: '📞',
    commitmentLevel: 'medium',
    size: 'md',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'support',
        cta_text: 'Schedule Consultation',
        commitment_level: 'medium',
        engagement_type: 'consultation_request'
      }
    }
  },
  'support-get-advice': {
    id: 'support-get-advice',
    tier: 'support',
    variant: 'personal-touch',
    location: 'pricing',
    text: 'Get Expert Advice',
    href: '#consultation-modal',
    description: 'Talk to a club management specialist',
    icon: '💬',
    commitmentLevel: 'medium',
    size: 'md',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'support',
        cta_text: 'Get Expert Advice',
        commitment_level: 'medium',
        engagement_type: 'consultation_request'
      }
    }
  },
  'support-get-quote': {
    id: 'support-get-quote',
    tier: 'support',
    variant: 'personal-touch',
    location: 'pricing',
    text: 'Get Enterprise Quote',
    onClick: () => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('openCTAModal', { 
          detail: { type: 'consultation', ctaId: 'support-get-quote' }
        });
        window.dispatchEvent(event);
      }
    },
    description: 'Custom solutions for large clubs',
    icon: '💼',
    commitmentLevel: 'medium',
    size: 'md',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'support',
        cta_text: 'Get Enterprise Quote',
        commitment_level: 'medium',
        engagement_type: 'quote_request'
      }
    }
  },

  // SOCIAL CTAs - Low-commitment engagement
  'social-join-community': {
    id: 'social-join-community',
    tier: 'social',
    variant: 'low-friction',
    location: 'footer',
    text: 'Join Community',
    href: 'https://facebook.com/groups/gathergrove',
    description: 'Connect with other club admins',
    icon: '👥',
    commitmentLevel: 'low',
    size: 'sm',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'social',
        cta_text: 'Join Community',
        commitment_level: 'low',
        engagement_type: 'community_join'
      }
    }
  },
  'social-newsletter': {
    id: 'social-newsletter',
    tier: 'social',
    variant: 'educational',
    location: 'footer',
    text: 'Get Tips & Updates',
    href: '#newsletter-modal',
    description: 'Weekly club management tips',
    icon: '📧',
    commitmentLevel: 'low',
    size: 'sm',
    tracking: {
      eventName: 'cta_click',
      properties: {
        cta_type: 'social',
        cta_text: 'Get Tips & Updates',
        commitment_level: 'low',
        engagement_type: 'newsletter_signup'
      }
    }
  }
};

// CTA variants for A/B testing
export const CTA_VARIANTS = {
  primary: [
    CTA_CONFIGS['primary-start-free'],
    CTA_CONFIGS['primary-create-club'],
    CTA_CONFIGS['primary-get-started']
  ],
  secondary: [
    CTA_CONFIGS['secondary-watch-demo'],
    CTA_CONFIGS['secondary-see-action']
  ],
  tertiary: [
    CTA_CONFIGS['tertiary-download-guide'],
    CTA_CONFIGS['tertiary-free-checklist']
  ],
  support: [
    CTA_CONFIGS['support-schedule-call'],
    CTA_CONFIGS['support-get-advice'],
    CTA_CONFIGS['support-get-quote']
  ],
  social: [
    CTA_CONFIGS['social-join-community'],
    CTA_CONFIGS['social-newsletter']
  ]
};

// Helper function to get CTA config by location and tier
export function getCTAConfig(location: string, tier: string): CTAConfig | undefined {
  return Object.values(CTA_CONFIGS).find(
    config => config.location === location && config.tier === tier
  );
}

// Helper function to get random CTA for A/B testing
export function getRandomCTA(tier: keyof typeof CTA_VARIANTS): CTAConfig {
  const variants = CTA_VARIANTS[tier];
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex];
}
