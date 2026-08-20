'use client'

import Link from'next/link'
import { ArrowRight } from'lucide-react'
import posthog from'posthog-js'

interface PseoCtaProps {
  heading: string
  description: string
  ctaText?: string
  ctaHref?: string
}

export function PseoCta({
  heading,
  description,
  ctaText ='Start Free Trial',
  ctaHref ='/register',
}: PseoCtaProps) {
  return (
    <section className="bg-emerald-600 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">{heading}</h2>
        <p className="mb-8 text-lg text-emerald-100">{description}</p>
        <Link
          href={ctaHref}
          className="inline-flex items-center rounded-lg bg-white  px-8 py-3 text-base font-semibold text-emerald-700  shadow-sm hover:bg-emerald-50"
          onClick={() => {
            if (typeof window !=='undefined') {
              posthog.capture('pseo_cta_clicked', { label: ctaText, page: window.location.pathname })
            }
          }}
        >
          {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
