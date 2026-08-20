import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Member Retention Strategies That Actually Work | GatherGrove' },
  description:
    'Evidence-based approaches to keep members engaged and reduce churn in hobby clubs. Learn proven retention strategies that increase member lifetime value.',
  keywords:
    'member retention, reduce member churn, member engagement strategies, club membership retention, community retention tips, nonprofit member retention',
  openGraph: {
    title: 'Member Retention Strategies That Actually Work | GatherGrove',
    description:
      'Evidence-based approaches to keep members engaged and reduce churn in hobby clubs.',
    type: 'article',
    authors: ['https://www.gathergrove.club/about'],
    publishedTime: '2024-03-01T00:00:00Z',
    modifiedTime: '2025-10-01T00:00:00Z',
  },
  twitter: {
    title: 'Member Retention Strategies That Actually Work | GatherGrove',
    description:
      'Evidence-based approaches to keep members engaged and reduce churn in hobby clubs.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/resources/member-retention-strategies',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
