import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Community Building Strategies for Clubs | GatherGrove' },
  description:
    'Learn proven strategies for building thriving club communities. Foster member connections, increase engagement, and create a sense of belonging in your hobby club.',
  keywords:
    'community building, member engagement, club community, member connections, club culture, hobby community, social clubs',
  openGraph: {
    title: 'Community Building Strategies for Clubs | GatherGrove',
    description:
      'Learn proven strategies for building thriving club communities and fostering member connections.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-06-01T00:00:00Z',
    modifiedTime: '2025-08-01T00:00:00Z',
  },
  twitter: {
    title: 'Community Building Strategies for Clubs | GatherGrove',
    description:
      'Learn proven strategies for building thriving club communities and fostering member connections.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/community-building-strategies',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
