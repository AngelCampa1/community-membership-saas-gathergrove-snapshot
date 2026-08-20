import Link from 'next/link'
import { getResourceBySlug, type ResourceEntry } from '@/lib/data/resources'
import { getRelatedContent } from '@/lib/data/content-links'
import { PseoRelatedCards } from '@/components/pseo/PseoRelatedCards'
import { FunnelCta } from '@/components/pseo/FunnelCta'
import { FunnelNextSteps } from '@/components/pseo/FunnelNextSteps'

interface ResourceArticleFooterProps {
  resource: ResourceEntry
}

export function ResourceArticleFooter({ resource }: ResourceArticleFooterProps) {
  const relatedArticles = (resource.relatedSlugs ?? [])
    .map((s) => getResourceBySlug(s))
    .filter(Boolean)

  const crossSiloLinks = getRelatedContent({
    keywords: resource.keywords,
    currentType: 'resources',
    currentSlug: resource.slug,
    maxResults: 6,
  })

  return (
    <>
      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedArticles.map((r) =>
              r ? (
                <Link
                  key={r.slug}
                  href={`/resources/${r.slug}`}
                  className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="text-xs text-muted-foreground">{r.category}</span>
                  <h4 className="font-semibold mt-1">{r.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Cross-Silo Explore More */}
      <PseoRelatedCards
        heading="Explore More"
        items={crossSiloLinks}
      />

      {/* Funnel Progression */}
      <FunnelNextSteps
        keywords={resource.keywords}
        currentType="resources"
        currentSlug={resource.slug}
      />

      {/* Funnel CTA */}
      <FunnelCta
        currentStage="tofu"
        heading="Ready to put these strategies into practice?"
        description="GatherGrove gives you the tools to manage members, run events, and grow your club - all in one place. Start free for 30 days."
      />
    </>
  )
}
