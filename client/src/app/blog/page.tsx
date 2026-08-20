import { MinimalistHeader } from'@/components/shared/MinimalistHeader'
import { Footer } from'@/components/shared/Footer'
import { BLOG_POSTS } from'@/lib/data/blog-posts'
import { FunnelCta } from'@/components/pseo/FunnelCta'
import { Breadcrumbs } from'@/components/seo/Breadcrumbs'
import { JsonLd } from'@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from'@/lib/schema'
import { SITE_URL } from'@/lib/site-config'
import { BlogIndexContent } from'./_shared/BlogIndexContent'

export default function BlogPage() {
  const categories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)))

  const blogListSchema = {'@context':'https://schema.org','@type':'Blog',
    name:'Club Management Blog',
    description:'Practical tips, templates, and how-to guides for volunteer club admins.',
    url: `${SITE_URL}/blog`,
    blogPost: BLOG_POSTS.map((post) => ({'@type':'BlogPosting',
      headline: post.seoTitle,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      description: post.description,
    })),
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />

      <JsonLd
        schema={buildBreadcrumbSchema([
          { name:'Home', url:'/' },
          { name:'Blog', url:'/blog' },
        ])}
      />
      <JsonLd schema={blogListSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumbs
              items={[
                { name:'Home', href:'/' },
                { name:'Blog', href:'/blog' },
              ]}
            />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
            Club Management Blog
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Practical tips, templates, and how-to guides for volunteer club
            admins.
          </p>
        </div>
      </section>

      {/* Blog listing with category filter */}
      <BlogIndexContent posts={BLOG_POSTS} categories={categories} />

      <FunnelCta
        currentStage="tofu"
        heading="Ready to simplify your club management?"
        description="Start with a 30-day free trial on any plan. Cancel anytime."
      />

      <Footer />
    </main>
  )
}
