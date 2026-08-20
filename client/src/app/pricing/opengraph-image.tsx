import { buildOgImageResponse } from '@/lib/og-image-template'
import { FREE_TRIAL_DAYS, formatCompactPlanPrices, formatStartingPriceShort } from '@/lib/pricing'

export const alt = `GatherGrove Pricing | Plans from ${formatStartingPriceShort()}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return buildOgImageResponse({
    title: 'Club Management Software Pricing',
    subtitle: `${formatCompactPlanPrices()} | ${FREE_TRIAL_DAYS}-day free trial`,
    category: 'Pricing',
  })
}
