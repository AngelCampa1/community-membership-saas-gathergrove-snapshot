import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '14 Free Club Management Guides & Templates [2026] | GatherGrove' },
  description:
    'Free guides, templates, and best practices for hobby club management. Learn member retention strategies, dues collection, event planning, and community building from experts.',
  keywords:
    'club management guides, hobby club resources, member management tips, dues collection best practices, event planning templates, nonprofit management resources',
  openGraph: {
    title: '14 Free Club Management Guides & Templates [2026] | GatherGrove',
    description:
      'Free guides, templates, and best practices for hobby club management. Expert resources for member retention, financial management, and community building.',
    images: ['/og-image.png'],
  },
  twitter: {
    title: '14 Free Club Management Guides & Templates [2026] | GatherGrove',
    description:
      'Free guides, templates, and best practices for hobby club management. Expert resources for member retention, financial management, and community building.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources',
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
