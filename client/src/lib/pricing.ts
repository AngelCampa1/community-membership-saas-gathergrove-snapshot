export type BillingCycle = 'monthly' | 'annual'

export interface PricingPlan {
  id: 'seed' | 'grow' | 'unlimited'
  name: string
  monthlyPrice: number
  annualPrice: number
  memberLimit: number
  adminLimit: number | 'Unlimited'
  emailLimit: number
  highlights: string[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'seed',
    name: 'Seed',
    monthlyPrice: 9,
    annualPrice: 90,
    memberLimit: 100,
    adminLimit: 2,
    emailLimit: 1000,
    highlights: ['Member management', 'Dues collection', 'Event management', 'Email communications'],
  },
  {
    id: 'grow',
    name: 'Grow',
    monthlyPrice: 29,
    annualPrice: 290,
    memberLimit: 200,
    adminLimit: 3,
    emailLimit: 3000,
    highlights: ['Mobile app', '3,000 emails/month', 'Analytics', 'Priority support'],
  },
  {
    id: 'unlimited',
    name: 'Expand',
    monthlyPrice: 200,
    annualPrice: 2000,
    memberLimit: 2000,
    adminLimit: 'Unlimited',
    emailLimit: 50000,
    highlights: ['2,000 members', '50,000 emails/month', 'Unlimited events and RSVPs', 'Unlimited custom fields'],
  },
]

export const FREE_TRIAL_DAYS = 30
export const PRICING_CURRENCY = 'USD'
export const PAYMENT_PROCESSOR_COPY = 'Standard Stripe processing rates apply'
export const PLATFORM_FEE_COPY = 'No platform fees on payments'

export function getPricingPlan(id: PricingPlan['id']) {
  const plan = PRICING_PLANS.find((item) => item.id === id)
  if (!plan) {
    throw new Error(`Unknown pricing plan: ${id}`)
  }
  return plan
}

export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number) {
  const annualEquivalentMonthly = monthlyPrice * 12
  const savings = ((annualEquivalentMonthly - annualPrice) / annualEquivalentMonthly) * 100
  return Math.round(Math.max(0, savings))
}

export function calculatePlanAnnualSavings(plan: PricingPlan) {
  return calculateAnnualSavings(plan.monthlyPrice, plan.annualPrice)
}

export function formatPlanPrice(plan: PricingPlan, billingCycle: BillingCycle) {
  const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
  const period = billingCycle === 'annual' ? 'year' : 'month'
  return `$${price.toLocaleString()}/${period}`
}

export function formatPlanMonthlyShort(plan: PricingPlan) {
  return `$${plan.monthlyPrice.toLocaleString()}/mo`
}

export function formatPlanMonthlyLong(plan: PricingPlan) {
  return formatPlanPrice(plan, 'monthly')
}

export function formatPlanAnnualLong(plan: PricingPlan) {
  return formatPlanPrice(plan, 'annual')
}

export function formatPlanMemberLimit(plan: PricingPlan) {
  return `up to ${plan.memberLimit.toLocaleString()} members`
}

export function formatStartingPriceLong() {
  return formatPlanMonthlyLong(getPricingPlan('seed'))
}

export function formatStartingPriceShort() {
  return formatPlanMonthlyShort(getPricingPlan('seed'))
}

export function formatStartingPriceWithLimit() {
  const seedPlan = getPricingPlan('seed')
  return `${formatPlanMonthlyLong(seedPlan)} for ${formatPlanMemberLimit(seedPlan)}`
}

export function formatPlanPriceWithLimit(plan: PricingPlan) {
  return `${formatPlanMonthlyLong(plan)} (${plan.name}, ${formatPlanMemberLimit(plan)})`
}

export function formatCompactPlanPrices() {
  return PRICING_PLANS.map((plan) => `${plan.name} ${formatPlanMonthlyShort(plan)}`).join(', ')
}

export function formatPricingSummary() {
  return PRICING_PLANS.map((plan) => `${plan.name} ${formatPlanPrice(plan, 'monthly')}`).join(', ')
}

export function formatPricingFaqAnswer() {
  const planCopy = PRICING_PLANS.map((plan) => {
    const memberCopy = formatPlanMemberLimit(plan)
    return `${plan.name} ($${plan.monthlyPrice}/month or $${plan.annualPrice.toLocaleString()}/year, ${memberCopy})`
  }).join('; ')

  return `GatherGrove offers three paid plans: ${planCopy}. All plans include a ${FREE_TRIAL_DAYS}-day free trial with full access. Credit card required.`
}

export const SEED_MONTHLY_PRICE_COPY = formatPlanMonthlyLong(getPricingPlan('seed'))
export const GROW_MONTHLY_PRICE_COPY = formatPlanMonthlyLong(getPricingPlan('grow'))
export const UNLIMITED_MONTHLY_PRICE_COPY = formatPlanMonthlyLong(getPricingPlan('unlimited'))
export const SEED_MONTHLY_SHORT_COPY = formatPlanMonthlyShort(getPricingPlan('seed'))
export const GROW_MONTHLY_SHORT_COPY = formatPlanMonthlyShort(getPricingPlan('grow'))
export const UNLIMITED_MONTHLY_SHORT_COPY = formatPlanMonthlyShort(getPricingPlan('unlimited'))
export const SEED_ANNUAL_PRICE_COPY = formatPlanAnnualLong(getPricingPlan('seed'))
export const GROW_ANNUAL_PRICE_COPY = formatPlanAnnualLong(getPricingPlan('grow'))
export const UNLIMITED_ANNUAL_PRICE_COPY = formatPlanAnnualLong(getPricingPlan('unlimited'))
export const STARTING_PRICE_COPY = formatStartingPriceLong()
export const STARTING_PRICE_WITH_LIMIT_COPY = formatStartingPriceWithLimit()
export const COMPACT_PLAN_PRICES_COPY = formatCompactPlanPrices()
