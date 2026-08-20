import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Modern Dues Collection Best Practices | GatherGrove' },
  description:
    'Proven strategies to improve payment collection rates and streamline financial management for hobby clubs. Automate dues collection and reduce administrative burden.',
  keywords:
    'dues collection, automated payment collection, club financial management, membership dues software, payment processing for clubs, nonprofit dues management',
  openGraph: {
    title: 'Modern Dues Collection Best Practices | GatherGrove',
    description:
      'Proven strategies to improve payment collection rates and streamline financial management for hobby clubs.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-03-15T00:00:00Z',
    modifiedTime: '2025-10-15T00:00:00Z',
  },
  twitter: {
    title: 'Modern Dues Collection Best Practices | GatherGrove',
    description:
      'Proven strategies to improve payment collection rates and streamline financial management for hobby clubs.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/modern-dues-collection-best-practices',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
