import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Complete Guide to Club Management 2026 | GatherGrove' },
  description:
    'Comprehensive 8,000+ word guide covering everything about modern club management. From member recruitment and retention to financial management and digital transformation for hobby clubs.',
  keywords:
    'club management guide, hobby club administration, member management, club financial planning, club digital transformation, nonprofit management guide',
  openGraph: {
    title: 'The Complete Guide to Club Management | GatherGrove',
    description:
      'A comprehensive guide covering everything you need to know about modern club management. Member recruitment, retention, finances, and digital tools.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-01-01T00:00:00Z',
    modifiedTime: '2025-12-01T00:00:00Z',
  },
  twitter: {
    title: 'The Complete Guide to Club Management | GatherGrove',
    description:
      'A comprehensive guide covering everything you need to know about modern club management. Member recruitment, retention, finances, and digital tools.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/complete-guide-club-management',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
