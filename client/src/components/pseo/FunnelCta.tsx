'use client'

import Link from'next/link'
import { ArrowRight } from'lucide-react'
import posthog from'posthog-js'
import type { FunnelStage } from'@/lib/data/content-links'

interface FunnelCtaProps {
  currentStage: FunnelStage
  heading?: string
  description?: string
  nextStepHref?: string
  nextStepText?: string
}

const STAGE_DEFAULTS: Record<
  FunnelStage,
  {
    primaryText: string
    primaryHref: string
    secondaryText: string
    secondaryHref: string
  }
> = {
  tofu: {
    primaryText:'See How GatherGrove Helps',
    primaryHref:'/features',
    secondaryText:'Explore More Guides',
    secondaryHref:'/resources',
  },
  mofu: {
    primaryText:'Start Free Trial',
    primaryHref:'/register',
    secondaryText:'Compare Options',
    secondaryHref:'/compare',
  },
  bofu: {
    primaryText:'Start Free Trial',
    primaryHref:'/register',
    secondaryText:'See Pricing',
    secondaryHref:'/pricing',
  },
}

export function FunnelCta({
  currentStage,
  heading,
  description,
  nextStepHref,
  nextStepText,
}: FunnelCtaProps) {
  const defaults = STAGE_DEFAULTS[currentStage]
  const primaryHref = nextStepHref ?? defaults.primaryHref
  const primaryText = nextStepText ?? defaults.primaryText

  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        {heading && (
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">{heading}</h2>
        )}
        {description && (
          <p className="mb-8 text-lg text-primary-foreground/80">{description}</p>
        )}
        {!heading && !description && (
          <>
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
              Ready to simplify your club management?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Start with a 30-day free trial on any plan. Cancel anytime.
            </p>
          </>
        )}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex items-center rounded-full bg-primary-foreground px-8 py-3 text-base font-semibold text-primary shadow-sm hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              if (typeof window !=='undefined') {
                posthog.capture('pseo_cta_clicked', { stage: currentStage, type:'primary', label: primaryText })
              }
            }}
          >
            {primaryText} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href={defaults.secondaryHref}
            className="inline-flex items-center rounded-full border border-primary-foreground/40 bg-transparent px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              if (typeof window !=='undefined') {
                posthog.capture('pseo_cta_clicked', { stage: currentStage, type:'secondary', label: defaults.secondaryText })
              }
            }}
          >
            {defaults.secondaryText}
          </Link>
        </div>
      </div>
    </section>
  )
}
