import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Volunteer Management and Leadership Development | GatherGrove' },
  description:
    'Build a strong volunteer program and develop future leaders for your club. Learn recruitment, training, recognition, and succession planning strategies.',
  keywords:
    'volunteer management, club volunteers, leadership development, volunteer recruitment, volunteer training, succession planning, club leadership pipeline',
  openGraph: {
    title: 'Volunteer Management and Leadership Development | GatherGrove',
    description:
      'Build a strong volunteer program and develop future leaders for your club.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-08-01T00:00:00Z',
    modifiedTime: '2025-06-01T00:00:00Z',
  },
  twitter: {
    title: 'Volunteer Management and Leadership Development | GatherGrove',
    description:
      'Build a strong volunteer program and develop future leaders for your club.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/volunteer-management-and-leadership-development',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
