'use client'

import { useState } from'react'
import type { BlogPost } from'@/lib/data/blog-posts'
import { BlogPostCard } from'@/components/blog/BlogPostCard'
import { BlogCategoryFilter } from'@/components/blog/BlogCategoryFilter'

interface BlogIndexContentProps {
  posts: BlogPost[]
  categories: string[]
}

export function BlogIndexContent({ posts, categories }: BlogIndexContentProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredPosts = activeCategory
    ? posts.filter((p) => p.category === activeCategory)
    : posts

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 flex justify-center">
          <BlogCategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <p className="py-12 text-center text-gray-500">
            No articles found in this category.
          </p>
        )}
      </div>
    </section>
  )
}
