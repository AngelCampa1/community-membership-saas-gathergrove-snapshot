import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Financial Management for Small Clubs | GatherGrove' },
  description:
    'Essential financial management strategies for small hobby clubs. Learn budgeting, expense tracking, financial reporting, and treasury best practices.',
  keywords:
    'club finances, small club budget, nonprofit financial management, club treasurer, expense tracking, financial reporting for clubs',
  openGraph: {
    title: 'Financial Management for Small Clubs | GatherGrove',
    description:
      'Essential financial management strategies for small hobby clubs. Budgeting, expense tracking, and treasury best practices.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-06-15T00:00:00Z',
    modifiedTime: '2025-08-15T00:00:00Z',
  },
  twitter: {
    title: 'Financial Management for Small Clubs | GatherGrove',
    description:
      'Essential financial management strategies for small hobby clubs. Budgeting, expense tracking, and treasury best practices.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/financial-management-for-small-clubs',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
