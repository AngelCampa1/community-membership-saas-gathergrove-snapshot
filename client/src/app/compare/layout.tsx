import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Compare Club Management Software | GatherGrove' },
  description:
    'Compare GatherGrove with other club management platforms. Feature-by-feature comparisons to help you choose the right software for your organization.',
}

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
