import Link from'next/link'
import { ArrowRight } from'lucide-react'

interface PseoHeroProps {
  badge: string
  title: string
  description: string
  lastUpdated?: string
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
}

export function PseoHero({
  badge,
  title,
  description,
  lastUpdated,
  ctaText ='Start Free Trial',
  ctaHref ='/register',
  secondaryCtaText,
  secondaryCtaHref,
}: PseoHeroProps) {
  return (
    <section className="bg-gradient-to-br from-emerald-50 to-teal-50   py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <span className="mb-4 inline-block rounded-full bg-emerald-100  px-4 py-1 text-sm font-medium text-emerald-700">
          {badge}
        </span>
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900  md:text-5xl">
          {title}
        </h1>
        {lastUpdated && (
          <p className="mb-6 text-sm text-gray-400">
            Last updated:{''}
            {new Date(lastUpdated).toLocaleDateString('en-US', {
              month:'long',
              year:'numeric',
            })}
          </p>
        )}
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">{description}</p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={ctaHref}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          {secondaryCtaText && secondaryCtaHref && (
            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center rounded-lg border border-gray-300  bg-white  px-6 py-3 text-base font-semibold text-gray-700  shadow-sm hover:bg-gray-50"
            >
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
