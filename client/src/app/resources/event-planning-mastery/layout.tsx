import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Event Planning Mastery for Club Administrators | GatherGrove' },
  description:
    'Complete guide to planning, promoting, and executing successful club events. Learn proven frameworks to improve attendance and strengthen member connections.',
  keywords:
    'club event planning, event management guide, RSVP tracking, club event promotion, community event planning, nonprofit event management',
  openGraph: {
    title: 'Event Planning Mastery for Club Administrators | GatherGrove',
    description:
      'Complete guide to planning successful club events. Proven frameworks to increase attendance and strengthen member connections.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2025-10-01T00:00:00Z',
  },
  twitter: {
    title: 'Event Planning Mastery for Club Administrators | GatherGrove',
    description:
      'Complete guide to planning successful club events. Proven frameworks to increase attendance and strengthen member connections.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/event-planning-mastery',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
