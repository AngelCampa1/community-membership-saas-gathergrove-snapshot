import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '25 Fundraising Ideas for Clubs and Nonprofits [2026 Guide] | GatherGrove' },
  description:
    'Practical fundraising ideas for clubs, associations, and nonprofits of every size. From classic bake sales to digital crowdfunding, find the right fundraiser for your group.',
  keywords:
    'fundraising ideas, fundraising ideas for clubs, nonprofit fundraising ideas, club fundraiser ideas, easy fundraising ideas, fundraising events for nonprofits',
  openGraph: {
    title: '25 Fundraising Ideas for Clubs and Nonprofits [2026 Guide] | GatherGrove',
    description:
      'Practical fundraising ideas for clubs, associations, and nonprofits of every size. From classic bake sales to digital crowdfunding, find the right fundraiser for your group.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-09-15T00:00:00Z',
    modifiedTime: '2025-05-15T00:00:00Z',
  },
  twitter: {
    title: '25 Fundraising Ideas for Clubs and Nonprofits [2026 Guide] | GatherGrove',
    description:
      'Practical fundraising ideas for clubs, associations, and nonprofits of every size. From classic bake sales to digital crowdfunding, find the right fundraiser for your group.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/fundraising-ideas-for-clubs-and-nonprofits',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
