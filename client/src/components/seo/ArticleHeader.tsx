import Link from 'next/link'
import { SITE_AUTHOR, SITE_AUTHOR_URL } from '@/lib/site-config'

export interface ArticleHeaderProps {
  category: string
  dateModified: string
  title: string
  description: string
  readTime: string
}

export function ArticleHeader({
  category,
  dateModified,
  title,
  description,
  readTime,
}: ArticleHeaderProps) {
  const [year, month] = dateModified.split('-').map(Number)
  const formattedDate = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
            {category}
          </span>
          <span className="text-muted-foreground text-sm">
            Last updated: {formattedDate}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          By{' '}
          <Link href={SITE_AUTHOR_URL} className="underline hover:text-foreground">
            {SITE_AUTHOR}
          </Link>{' '}
          &middot; {readTime}
        </p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
          {title}
        </h1>
        <p
          className="text-xl text-muted-foreground leading-relaxed"
          data-ai-answer="true"
        >
          {description}
        </p>
    </div>
  )
}
