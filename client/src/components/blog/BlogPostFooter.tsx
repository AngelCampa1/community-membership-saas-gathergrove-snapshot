import type { BlogPost } from '@/lib/data/blog-posts'
import { getBlogPostBySlug } from '@/lib/data/blog-posts'
import { getResourceBySlug } from '@/lib/data/resources'
import { PseoRelatedCards } from '@/components/pseo/PseoRelatedCards'
import { FunnelCta } from '@/components/pseo/FunnelCta'

interface BlogPostFooterProps {
  post: BlogPost
}

function mapBuyerStageToFunnel(
  stage: BlogPost['buyerStage']
): 'tofu' | 'mofu' | 'bofu' {
  switch (stage) {
    case 'awareness':
      return 'tofu'
    case 'consideration':
      return 'mofu'
    case 'decision':
      return 'bofu'
  }
}

export function BlogPostFooter({ post }: BlogPostFooterProps) {
  const relatedPosts = (post.relatedSlugs ?? [])
    .map((slug) => getBlogPostBySlug(slug))
    .filter((p): p is BlogPost => p !== undefined)
    .map((p) => ({
      title: p.title,
      href: `/blog/${p.slug}`,
      description: p.excerpt,
    }))

  const relatedResources = (post.relatedResourceSlugs ?? [])
    .map((slug) => {
      const resource = getResourceBySlug(slug)
      if (!resource) return null
      return {
        title: resource.title,
        href: `/resources/${resource.slug}`,
        description: resource.description,
      }
    })
    .filter(
      (r): r is { title: string; href: string; description: string } =>
        r !== null
    )

  const funnelStage = mapBuyerStageToFunnel(post.buyerStage)

  return (
    <footer>
      {relatedPosts.length > 0 && (
        <PseoRelatedCards heading="Related Articles" items={relatedPosts} />
      )}

      {relatedResources.length > 0 && (
        <PseoRelatedCards
          heading="Related Guides"
          items={relatedResources}
          subtitle="Resource Guide"
        />
      )}

      <FunnelCta
        currentStage={funnelStage}
        heading="Ready to simplify your club management?"
        description="Start with a 30-day free trial on any plan. Cancel anytime."
      />
    </footer>
  )
}
