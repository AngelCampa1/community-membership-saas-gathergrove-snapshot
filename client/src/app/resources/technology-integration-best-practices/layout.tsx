import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Technology Integration Best Practices for Clubs | GatherGrove' },
  description:
    'Guide to integrating technology into your club operations. Learn how to evaluate, implement, and optimize digital tools for member management and engagement.',
  keywords:
    'club technology, digital transformation, club software integration, membership software, club management tools, tech adoption for nonprofits',
  openGraph: {
    title: 'Technology Integration Best Practices for Clubs | GatherGrove',
    description:
      'Guide to integrating technology into your club operations. Evaluate and implement digital tools effectively.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-07-15T00:00:00Z',
    modifiedTime: '2025-07-15T00:00:00Z',
  },
  twitter: {
    title: 'Technology Integration Best Practices for Clubs | GatherGrove',
    description:
      'Guide to integrating technology into your club operations. Evaluate and implement digital tools effectively.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/technology-integration-best-practices',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
