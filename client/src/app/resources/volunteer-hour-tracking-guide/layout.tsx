import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Track Volunteer Hours (And Why It Matters) | GatherGrove',
  description:
    'How to track volunteer hours accurately for grant reporting, IRS compliance, and board presentations - from manual methods to automated software.',
  keywords:
    'volunteer hour tracking, how to track volunteer hours, volunteer hours for grant reporting, volunteer hour tracking software, volunteer hours nonprofit',
  openGraph: {
    title: 'Volunteer Hour Tracking: Complete Guide [+ Free Templates & Grant Reports]',
    description:
      'How to track volunteer hours accurately for grant reporting, IRS compliance, and board presentations.',
    images: ['/og-image.png'],
  },
  twitter: {
    title: 'Volunteer Hour Tracking: Complete Guide [+ Free Templates & Grant Reports]',
    description:
      'How to track volunteer hours accurately for grant reporting, IRS compliance, and board presentations.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/volunteer-hour-tracking-guide',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
