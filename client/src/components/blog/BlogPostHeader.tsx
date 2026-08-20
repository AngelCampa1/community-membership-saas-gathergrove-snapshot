import { Calendar, Clock } from'lucide-react'
import type { BlogPost } from'@/lib/data/blog-posts'
import { BlogTagBadge } from'./BlogTagBadge'

interface BlogPostHeaderProps {
  post: BlogPost
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  return (
    <header className="border-b border-gray-200 pb-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-emerald-100  px-3 py-1 text-sm font-semibold text-emerald-800">
          {post.category}
        </span>
      </div>

      <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {post.title}
      </h1>

      <p className="mb-6 text-lg text-gray-600">{post.description}</p>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {new Date(post.datePublished).toLocaleDateString('en-US', {
            year:'numeric',
            month:'long',
            day:'numeric',
          })}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {post.readTime}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <BlogTagBadge key={tag} tag={tag} />
        ))}
      </div>
    </header>
  )
}
