import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Free Club Management Tools - Calculators & Planners',
  description:
    'Free tools for club admins. Calculate the right dues amount, compare your tool stack costs, and plan event budgets - no signup required.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Free Club Management Tools - Calculators & Planners | GatherGrove',
    description:
      'Free tools for club admins. Calculate the right dues amount, compare your tool stack costs, and plan event budgets - no signup required.',
    url: 'https://www.gathergrove.club/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Club Management Tools - Calculators & Planners | GatherGrove',
    description:
      'Free tools for club admins. Calculate the right dues amount, compare your tool stack costs, and plan event budgets - no signup required.',
  },
}

const tools = [
  {
    name: 'Club Dues Calculator',
    href: '/tools/club-dues-calculator',
    description:
      'Calculate the right monthly and annual dues amount based on your club\'s actual expenses. Free, takes 2 minutes.',
  },
  {
    name: 'Tool Stack Cost Calculator',
    href: '/tools/tool-stack-cost-calculator',
    description:
      'See how much your club spends across Eventbrite, Mailchimp, TeamSnap, and other tools - and what you\'d save with one platform.',
  },
  {
    name: 'Event Budget Planner',
    href: '/tools/event-budget-planner',
    description:
      'Find your event\'s break-even attendee count, project profit/loss, and compare platform fee costs.',
  },
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Free Club Management Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Practical calculators for club admins. No signup, no email required - just useful tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col bg-card rounded-xl border border-border p-6 hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-4">
                {tool.name}
              </h2>
              <p className="text-muted-foreground text-sm mb-6 flex-1">
                {tool.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Try it free <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
