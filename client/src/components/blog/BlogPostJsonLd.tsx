import type { BlogPost } from '@/lib/data/blog-posts'
import { buildBlogPostingSchema } from '@/lib/schema'
import { JsonLd } from '@/components/seo/JsonLd'

interface BlogPostJsonLdProps {
  post: BlogPost
}

export function BlogPostJsonLd({ post }: BlogPostJsonLdProps) {
  const schema = buildBlogPostingSchema({
    title: post.seoTitle,
    description: post.description,
    slug: post.slug,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    keywords: post.keywords,
  })

  return <JsonLd schema={schema} />
}
