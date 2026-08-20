import Link from'next/link'
import { ArrowRight, Calendar, Clock } from'lucide-react'
import type { BlogPost } from'@/lib/data/blog-posts'
import { BlogTagBadge } from'./BlogTagBadge'

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-emerald-100  px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          {post.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {post.readTime}
        </span>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-gray-900  group-hover:text-emerald-700">
        {post.title}
      </h3>

      <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-600">
        {post.excerpt}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <BlogTagBadge key={tag} tag={tag} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100  pt-4">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          {new Date(post.datePublished).toLocaleDateString('en-US', {
            year:'numeric',
            month:'short',
            day:'numeric',
          })}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
          Read more <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}
