import Link from'next/link'
import { ArrowRight } from'lucide-react'
import {
  getNextFunnelContent,
  getFunnelStageForType,
  type ContentPageType,
} from'@/lib/data/content-links'

interface FunnelNextStepsProps {
  keywords: string[]
  currentType: ContentPageType
  currentSlug: string
  maxResults?: number
}

const STAGE_HEADINGS: Record<string, string> = {
  tofu:'See How GatherGrove Can Help',
  mofu:'Compare Your Options',
}

export function FunnelNextSteps({
  keywords,
  currentType,
  currentSlug,
  maxResults = 3,
}: FunnelNextStepsProps) {
  const currentStage = getFunnelStageForType(currentType)
  if (currentStage ==='bofu') return null

  const items = getNextFunnelContent({ keywords, currentType, currentSlug, maxResults })
  if (items.length === 0) return null

  const heading = STAGE_HEADINGS[currentStage]

  return (
    <section className="bg-emerald-50  py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">{heading}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col rounded-lg border border-emerald-200  bg-white  p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="mb-2 font-semibold text-gray-900  group-hover:text-emerald-700">
                {item.title}
              </h3>
              <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-600">
                {item.description}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-emerald-600">
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
