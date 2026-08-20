import { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Club Management Blog - Tips, Templates & How-Tos | GatherGrove' },
  description:
    'Practical tips, templates, and how-to guides for club admins. Manage members, collect dues, plan events, and grow your community.',
  keywords:
    'club management blog, club admin tips, membership management, dues collection, event planning',
  openGraph: {
    title: 'Club Management Blog - Tips, Templates & How-Tos | GatherGrove',
    description: 'Practical tips, templates, and how-to guides for club admins.',
    images: ['/og-image.png'],
  },
  twitter: {
    title: 'Club Management Blog - Tips, Templates & How-Tos | GatherGrove',
    description: 'Practical tips, templates, and how-to guides for club admins.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/blog',
    types: { 'application/rss+xml': '/feed.xml' },
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
