import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Club Management Template Library | GatherGrove' },
  description:
    'Free downloadable templates for club management including meeting agendas, budget spreadsheets, event checklists, and communication templates. Save hours of administrative work.',
  keywords:
    'club templates, meeting agenda template, club budget template, event checklist, communication templates, nonprofit templates, club forms',
  openGraph: {
    title: 'Club Management Template Library | GatherGrove',
    description:
      'Free downloadable templates for club management including meeting agendas, budgets, event checklists, and more.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-09-01T00:00:00Z',
    modifiedTime: '2025-06-01T00:00:00Z',
  },
  twitter: {
    title: 'Club Management Template Library | GatherGrove',
    description:
      'Free downloadable templates for club management including meeting agendas, budgets, event checklists, and more.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/template-library',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
