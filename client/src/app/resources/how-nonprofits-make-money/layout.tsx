import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'How Nonprofits Make Money: 8 Revenue Streams Explained [2026] | GatherGrove' },
  description:
    'A clear explanation of the eight main ways nonprofits generate revenue - from membership dues and individual donations to grants, corporate sponsorships, and earned income.',
  keywords:
    'how nonprofits make money, nonprofit revenue, nonprofit income sources, how do nonprofits make money, nonprofit funding sources, nonprofit revenue streams',
  openGraph: {
    title: 'How Nonprofits Make Money: 8 Revenue Streams Explained [2026] | GatherGrove',
    description:
      'A clear explanation of the eight main ways nonprofits generate revenue - from membership dues and individual donations to grants, corporate sponsorships, and earned income.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-10-01T00:00:00Z',
    modifiedTime: '2025-05-01T00:00:00Z',
  },
  twitter: {
    title: 'How Nonprofits Make Money: 8 Revenue Streams Explained [2026] | GatherGrove',
    description:
      'A clear explanation of the eight main ways nonprofits generate revenue - from membership dues and individual donations to grants, corporate sponsorships, and earned income.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/how-nonprofits-make-money',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
