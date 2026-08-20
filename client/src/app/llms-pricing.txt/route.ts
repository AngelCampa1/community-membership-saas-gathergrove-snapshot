import { SITE_URL, PROGRAMMATIC_PAGES_LAST_UPDATED } from '@/lib/site-config'
import {
  FREE_TRIAL_DAYS,
  PAYMENT_PROCESSOR_COPY,
  PLATFORM_FEE_COPY,
  PRICING_PLANS,
  calculateAnnualSavings,
} from '@/lib/pricing'

export function GET() {
  const planSections = PRICING_PLANS.map((plan) => `### ${plan.name} Plan
- **Monthly**: $${plan.monthlyPrice}/month
- **Annual**: $${plan.annualPrice.toLocaleString()}/year (${calculateAnnualSavings(plan.monthlyPrice, plan.annualPrice)}% savings)
- **Members**: Up to ${plan.memberLimit.toLocaleString()}
- **Admins**: ${plan.adminLimit === 'Unlimited' ? 'Unlimited' : `Up to ${plan.adminLimit}`}
- **Emails/month**: ${plan.emailLimit.toLocaleString()}
- **Features**: ${plan.highlights.join(', ')}
- **Free trial**: ${FREE_TRIAL_DAYS} days (credit card required)`).join('\n\n')

  const comparisonRows = PRICING_PLANS.map((plan) =>
    `| ${plan.name} | $${plan.monthlyPrice}/mo | $${plan.annualPrice.toLocaleString()}/yr | ${
      `Up to ${plan.memberLimit.toLocaleString()}`
    } | ${FREE_TRIAL_DAYS} days |`
  ).join('\n')

  const content = `# GatherGrove Pricing

> Last updated: ${PROGRAMMATIC_PAGES_LAST_UPDATED}
> Version: 1.0

## Plans

${planSections}

## Fees

- ${PLATFORM_FEE_COPY}
- ${PAYMENT_PROCESSOR_COPY}
- No setup fees
- No cancellation fees
- Data export always available

## Comparison

| Plan | Monthly | Annual | Members | Free trial |
|------|---------|--------|---------|------------|
${comparisonRows}

## Links

- Pricing page: ${SITE_URL}/pricing
- Start free trial: ${SITE_URL}/register
- Full product details: ${SITE_URL}/llms-full.txt
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'max-age=86400',
      'Last-Modified': new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toUTCString(),
    },
  })
}
