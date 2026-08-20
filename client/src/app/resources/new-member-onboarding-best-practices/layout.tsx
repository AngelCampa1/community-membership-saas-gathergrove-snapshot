import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'New Member Onboarding Best Practices | GatherGrove' },
  description:
    'Create a welcoming onboarding experience that improves new member retention. Learn frameworks for welcome sequences, mentorship programs, and early engagement.',
  keywords:
    'member onboarding, new member welcome, club onboarding process, member orientation, welcome sequence, membership activation',
  openGraph: {
    title: 'New Member Onboarding Best Practices | GatherGrove',
    description:
      'Create a welcoming onboarding experience that improves new member retention.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-05-15T00:00:00Z',
    modifiedTime: '2025-09-15T00:00:00Z',
  },
  twitter: {
    title: 'New Member Onboarding Best Practices | GatherGrove',
    description:
      'Create a welcoming onboarding experience that improves new member retention.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/new-member-onboarding-best-practices',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
