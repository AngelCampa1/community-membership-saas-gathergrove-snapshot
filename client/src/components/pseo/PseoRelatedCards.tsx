import Link from'next/link'

interface RelatedItem {
  title: string
  href: string
  description: string
}

interface PseoRelatedCardsProps {
  heading: string
  items: RelatedItem[]
  subtitle?: string
}

export function PseoRelatedCards({ heading, items, subtitle }: PseoRelatedCardsProps) {
  if (items.length === 0) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">{heading}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-gray-200  bg-white  p-6 transition-shadow hover:shadow-md"
            >
              {subtitle && (
                <span className="text-xs text-gray-500">{subtitle}</span>
              )}
              <h3 className="mb-2 font-semibold text-gray-900">{item.title}</h3>
              <p className="line-clamp-2 text-sm text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
