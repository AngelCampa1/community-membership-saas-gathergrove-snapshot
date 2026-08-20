import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Crisis Management and Emergency Planning for Clubs | GatherGrove' },
  description:
    'Prepare your club for unexpected challenges with comprehensive crisis management and emergency planning strategies. Build resilience and ensure member safety.',
  keywords:
    'club crisis management, emergency planning, club safety, risk management, crisis communication, disaster preparedness, nonprofit emergency plan',
  openGraph: {
    title: 'Crisis Management and Emergency Planning for Clubs | GatherGrove',
    description:
      'Prepare your club for unexpected challenges with comprehensive crisis management and emergency planning.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-07-01T00:00:00Z',
    modifiedTime: '2025-07-01T00:00:00Z',
  },
  twitter: {
    title: 'Crisis Management and Emergency Planning for Clubs | GatherGrove',
    description:
      'Prepare your club for unexpected challenges with comprehensive crisis management and emergency planning.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/crisis-management-and-emergency-planning',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
