import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nonprofit Membership Management: A Complete Guide | GatherGrove',
  description:
    'How to manage nonprofit members effectively - collecting dues, tracking renewals, communicating with members, and choosing the right membership software.',
  keywords:
    'nonprofit membership management, membership software for nonprofits, nonprofit member management, how to manage nonprofit members, nonprofit dues collection',
  openGraph: {
    title: 'Nonprofit Membership Management Guide [2026]: From Dues to Retention',
    description:
      'How to manage nonprofit members effectively - collecting dues, tracking renewals, communicating with members, and choosing the right membership software.',
    images: ['/og-image.png'],
  },
  twitter: {
    title: 'Nonprofit Membership Management Guide [2026]: From Dues to Retention',
    description:
      'How to manage nonprofit members effectively - collecting dues, tracking renewals, and choosing the right membership software.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/nonprofit-membership-management-guide',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
