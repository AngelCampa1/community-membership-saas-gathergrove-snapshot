export type CTATier = 'primary' | 'secondary' | 'tertiary' | 'support' | 'social';

export type CTAVariant = 
  | 'high-intent' 
  | 'low-friction' 
  | 'benefit-focused'
  | 'demo-focused'
  | 'educational'
  | 'personal-touch';

export type CTALocation = 
  | 'header'
  | 'hero'
  | 'features'
  | 'pricing'
  | 'footer'
  | 'floating'
  | 'smart-banner'
  | 'exit-intent';

export type CommitmentLevel = 'low' | 'medium' | 'high';

export interface CTAConfig {
  id: string;
  tier: CTATier;
  variant: CTAVariant;
  location: CTALocation;
  text: string;
  href?: string;
  onClick?: () => void;
  description?: string;
  icon?: string;
  commitmentLevel: CommitmentLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tracking: {
    eventName: string;
    properties: Record<string, unknown>;
  };
}

export interface CTAPerformanceMetrics {
  ctaId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  clickThroughRate: number;
  lastUpdated: string;
}

export interface ABTestConfig {
  testId: string;
  variants: CTAConfig[];
  trafficSplit: number[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
  winningVariant?: string;
}