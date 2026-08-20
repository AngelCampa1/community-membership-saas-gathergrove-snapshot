import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Annual Planning and Strategic Goal Setting for Clubs | GatherGrove' },
  description:
    'Master annual planning and strategic goal setting for your club. Learn how to set SMART goals, create action plans, and measure success throughout the year.',
  keywords:
    'club annual planning, strategic goal setting, club goals, yearly planning, club strategy, nonprofit planning, organization objectives',
  openGraph: {
    title: 'Annual Planning and Strategic Goal Setting for Clubs | GatherGrove',
    description:
      'Master annual planning and strategic goal setting for your club. Set SMART goals and create action plans.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-08-15T00:00:00Z',
    modifiedTime: '2025-06-15T00:00:00Z',
  },
  twitter: {
    title: 'Annual Planning and Strategic Goal Setting for Clubs | GatherGrove',
    description:
      'Master annual planning and strategic goal setting for your club. Set SMART goals and create action plans.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/annual-planning-and-strategic-goal-setting',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
