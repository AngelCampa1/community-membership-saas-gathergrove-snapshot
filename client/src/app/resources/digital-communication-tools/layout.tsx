import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Digital Communication Tools for Clubs | GatherGrove' },
  description:
    'Use email, push alerts, apps, and chat. Keep club members in the loop. Learn how to build a simple club communication plan.',
  keywords:
    'club communication tools, member communication, email marketing for clubs, push notifications, club mobile app, community chat',
  openGraph: {
    title: 'Digital Communication Tools for Clubs | GatherGrove',
    description:
      'Use email, push alerts, apps, and chat. Keep club members in the loop.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-04-15T00:00:00Z',
    modifiedTime: '2025-09-15T00:00:00Z',
  },
  twitter: {
    title: 'Digital Communication Tools for Clubs | GatherGrove',
    description:
      'Use email, push alerts, apps, and chat. Keep club members in the loop.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/digital-communication-tools',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
