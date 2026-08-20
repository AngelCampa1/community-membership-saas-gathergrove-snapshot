import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Leadership and Governance Frameworks for Clubs | GatherGrove' },
  description:
    'Build sustainable leadership structures and governance processes for growing clubs. Learn how to create effective board structures, succession plans, and decision-making processes.',
  keywords:
    'club leadership, club governance, board structure, nonprofit governance, club succession planning, volunteer leadership, club bylaws',
  openGraph: {
    title: 'Leadership and Governance Frameworks for Clubs | GatherGrove',
    description:
      'Build sustainable leadership structures and governance processes for growing clubs.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-05-01T00:00:00Z',
    modifiedTime: '2025-09-01T00:00:00Z',
  },
  twitter: {
    title: 'Leadership and Governance Frameworks for Clubs | GatherGrove',
    description:
      'Build sustainable leadership structures and governance processes for growing clubs.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/leadership-governance-frameworks',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
