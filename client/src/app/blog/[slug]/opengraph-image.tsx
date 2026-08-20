import { getBlogPostBySlug, BLOG_POSTS } from '@/lib/data/blog-posts'
import { buildOgImageResponse } from '@/lib/og-image-template'

export const alt = 'Blog post preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }))
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) {
    return buildOgImageResponse({ title: 'Blog | GatherGrove' })
  }

  return buildOgImageResponse({
    title: post.title,
    subtitle: post.description,
    category: post.category,
  })
}
