import { Metadata } from'next'
import { notFound } from'next/navigation'
import dynamic from'next/dynamic'
import { BLOG_POSTS, getBlogPostBySlug } from'@/lib/data/blog-posts'
import { createPageMetadata } from'@/lib/marketing-metadata'
import { buildBreadcrumbSchema } from'@/lib/schema'
import { JsonLd } from'@/components/seo/JsonLd'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { BlogPostHeader } from'@/components/blog/BlogPostHeader'
import { BlogPostFooter } from'@/components/blog/BlogPostFooter'
import { BlogPostJsonLd } from'@/components/blog/BlogPostJsonLd'
import { FunnelNextSteps } from'@/components/pseo/FunnelNextSteps'

// Content component mapping - each post has its own content module
const POST_COMPONENTS: Record<string, React.ComponentType> = {'online-registration-setup-guide': dynamic(
    () => import('../_posts/online-registration-setup-guide')
  ),'dues-reminder-email-templates': dynamic(
    () => import('../_posts/dues-reminder-email-templates')
  ),'why-new-members-quit': dynamic(
    () => import('../_posts/why-new-members-quit')
  ),'youth-sports-season-kickoff': dynamic(
    () => import('../_posts/youth-sports-season-kickoff')
  ),'volunteer-signup-that-fills': dynamic(
    () => import('../_posts/volunteer-signup-that-fills')
  ),'rec-league-scheduling-guide': dynamic(
    () => import('../_posts/rec-league-scheduling-guide')
  ),'real-cost-of-spreadsheets': dynamic(
    () => import('../_posts/real-cost-of-spreadsheets')
  ),'club-newsletter-tips': dynamic(
    () => import('../_posts/club-newsletter-tips')
  ),'end-of-season-member-retention': dynamic(
    () => import('../_posts/end-of-season-member-retention')
  ),'starting-a-book-club-guide': dynamic(
    () => import('../_posts/starting-a-book-club-guide')
  ),'handling-late-dues': dynamic(
    () => import('../_posts/handling-late-dues')
  ),'fundraising-ideas-small-clubs': dynamic(
    () => import('../_posts/fundraising-ideas-small-clubs')
  ),'volunteer-hour-tracking-comparison': dynamic(
    () => import('../_posts/volunteer-hour-tracking-comparison')
  ),'club-annual-calendar-template': dynamic(
    () => import('../_posts/club-annual-calendar-template')
  ),'paper-to-digital-transition': dynamic(
    () => import('../_posts/paper-to-digital-transition')
  ),
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return {}

  return createPageMetadata({
    title: post.seoTitle,
    description: post.description,
    slug: `blog/${post.slug}`,
    keywords: post.keywords.join(','),
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()

  const PostContent = POST_COMPONENTS[slug]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />

      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Blog', url:'/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />
      <BlogPostJsonLd post={post} />

      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-8">
        <div className="mx-auto max-w-3xl px-4">
          <Breadcrumbs
            items={[
              { name:'Home', href:'/' },
              { name:'Blog', href:'/blog' },
              { name: post.title, href: `/blog/${post.slug}` },
            ]}
          />
        </div>
      </section>

      <article className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <BlogPostHeader post={post} />

          {PostContent ? (
            <div className="prose prose-lg prose-emerald  mt-8 max-w-none">
              <PostContent />
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-amber-200  bg-amber-50  p-6 text-center text-amber-800">
              <p>This article is coming soon. Check back shortly.</p>
            </div>
          )}
        </div>
      </article>

      <BlogPostFooter post={post} />

      <FunnelNextSteps
        keywords={post.keywords}
        currentType={'blog'}
        currentSlug={post.slug}
      />

      <Footer />
    </main>
  )
}
