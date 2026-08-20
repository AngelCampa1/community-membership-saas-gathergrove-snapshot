import Link from'next/link'
import { ArrowRight } from'lucide-react'

interface HubEntry {
  id: string
  title: string
  href: string
  description: string
  stageLabel: string
  stageBadgeClass: string
}

const HUB_REGISTRY: HubEntry[] = [
  {
    id:'resources',
    title:'Resources & Guides',
    href:'/resources',
    description:'In-depth guides, best practices, and templates for running a successful club.',
    stageLabel:'Learn',
    stageBadgeClass:'bg-blue-100  text-blue-700',
  },
  {
    id:'glossary',
    title:'Club Management Glossary',
    href:'/glossary',
    description:'Plain-language definitions for membership, governance, and event planning terms.',
    stageLabel:'Learn',
    stageBadgeClass:'bg-blue-100  text-blue-700',
  },
  {
    id:'how-to-start',
    title:'How to Start a Club',
    href:'/how-to-start',
    description:'Step-by-step guides for starting any type of club or community organization.',
    stageLabel:'Learn',
    stageBadgeClass:'bg-blue-100  text-blue-700',
  },
  {
    id:'for',
    title:'Solutions by Club Type',
    href:'/for',
    description:'Purpose-built tools for book clubs, sports leagues, nonprofits, and 80+ organization types.',
    stageLabel:'Explore',
    stageBadgeClass:'bg-emerald-100  text-emerald-700',
  },
  {
    id:'features',
    title:'Platform Features',
    href:'/features',
    description:'Member management, event planning, dues collection, communications, and more.',
    stageLabel:'Explore',
    stageBadgeClass:'bg-emerald-100  text-emerald-700',
  },
  {
    id:'compare',
    title:'Compare Platforms',
    href:'/compare',
    description:'Honest, feature-by-feature comparisons of GatherGrove vs other club management tools.',
    stageLabel:'Compare',
    stageBadgeClass:'bg-orange-100  text-orange-700',
  },
  {
    id:'alternatives',
    title:'Alternative Comparisons',
    href:'/alternatives',
    description:'Honest comparisons of GatherGrove against popular alternatives, so you can choose with confidence.',
    stageLabel:'Compare',
    stageBadgeClass:'bg-orange-100  text-orange-700',
  },
  {
    id:'templates',
    title:'Free Templates',
    href:'/templates',
    description:'Ready-to-use templates for meeting minutes, budgets, rosters, event planning, and more.',
    stageLabel:'Learn',
    stageBadgeClass:'bg-blue-100  text-blue-700',
  },
  {
    id:'volunteer-management',
    title:'Volunteer Management',
    href:'/volunteer-management',
    description:'Tools and guides for recruiting, scheduling, and recognizing volunteers in your organization.',
    stageLabel:'Explore',
    stageBadgeClass:'bg-emerald-100  text-emerald-700',
  },
]

type HubId ='resources' |'glossary' |'how-to-start' |'for' |'features' |'compare' |'alternatives' |'templates' |'volunteer-management'

interface HubCrossLinksProps {
  currentHub: HubId
}

export function HubCrossLinks({ currentHub }: HubCrossLinksProps) {
  const others = HUB_REGISTRY.filter((h) => h.id !== currentHub)

  return (
    <section className="bg-gray-50  py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Explore More Resources
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {others.map((hub) => (
            <Link
              key={hub.id}
              href={hub.href}
              className="group flex flex-col rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${hub.stageBadgeClass}`}>
                  {hub.stageLabel}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400  transition-colors group-hover:text-emerald-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900  group-hover:text-emerald-700">
                {hub.title}
              </h3>
              <p className="text-sm text-gray-600">{hub.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
