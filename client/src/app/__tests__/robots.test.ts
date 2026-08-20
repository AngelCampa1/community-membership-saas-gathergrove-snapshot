import robots from '../robots'

describe('robots', () => {
  const result = robots()

  it('returns rules array', () => {
    expect(result.rules).toBeDefined()
    expect(Array.isArray(result.rules)).toBe(true)
  })

  it('has a single wildcard rule that covers all bots including AI', () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    expect(rules).toHaveLength(1)
    const defaultRule = rules[0]
    expect(defaultRule.userAgent).toBe('*')
    expect(defaultRule.allow).toContain('/')
  })

  it('does not have a separate restrictive AI bot rule', () => {
    // AI bots should use the same permissive wildcard rule as all other crawlers.
    // A separate AI bot rule with narrow allow list would block AI bots from
    // crawling content pages (resources, club types, use cases).
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const aiRule = rules.find((r) => Array.isArray(r.userAgent))
    expect(aiRule).toBeUndefined()
  })

  it('disallows admin, api, app, and payment routes', () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const defaultRule = rules.find((r) => r.userAgent === '*')
    const disallow = defaultRule!.disallow as string[]
    expect(disallow).toContain('/admin/')
    expect(disallow).toContain('/api/')
    expect(disallow).toContain('/app/')
    expect(disallow).toContain('/activate-account/')
    expect(disallow).toContain('/payment/')
    expect(disallow).toContain('/events/pay/')
  })

  it('includes sitemap URL', () => {
    expect(result.sitemap).toContain('/sitemap.xml')
    expect(result.sitemap).toContain('https://')
  })
})
