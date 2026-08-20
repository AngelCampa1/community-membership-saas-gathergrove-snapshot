import { render, screen } from '@testing-library/react'
import BestMembershipManagementSoftwarePage, { generateMetadata } from '../page'

describe('BestMembershipManagementSoftwarePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<BestMembershipManagementSoftwarePage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Best Membership Management Software"', () => {
    render(<BestMembershipManagementSoftwarePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/best membership management software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*membership management software/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 5 FAQ items', () => {
    render(<BestMembershipManagementSoftwarePage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(5)
  })

  it('renders the top tools section', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /top membership management software tools/i })).toBeInTheDocument()
  })

  it('renders all 4 tool cards', () => {
    render(<BestMembershipManagementSoftwarePage />)
    // Each tool appears in both best-fit scenarios and tool cards sections, use getAllByRole
    const h3s = screen.getAllByRole('heading', { level: 3 })
    const toolNames = h3s.map((h) => h.textContent ?? '')
    expect(toolNames.some((t) => /gathergro/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /wild apricot/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /memberclicks/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /memberplanet/i.test(t))).toBe(true)
  })

  it('renders the "Best for small orgs" badge on GatherGrove', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.getByText(/best for small orgs/i)).toBeInTheDocument()
  })

  it('renders the feature comparison table', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /feature comparison.*membership management/i })).toBeInTheDocument()
  })

  it('renders the "How to Choose" section', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /how to choose membership management software/i })).toBeInTheDocument()
  })

  it('renders "Start Free Trial" CTA link pointing to /register', () => {
    render(<BestMembershipManagementSoftwarePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.getByRole('link', { name: /all software comparisons/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /wild apricot/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<BestMembershipManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<BestMembershipManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('includes ItemList schema with 4 tools', () => {
    const { container } = render(<BestMembershipManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const itemListSchema = schemas.find((s) => s['@type'] === 'ItemList')
    expect(itemListSchema).toBeDefined()
    expect(itemListSchema.itemListElement.length).toBe(4)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<BestMembershipManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('best-membership-management-software')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<BestMembershipManagementSoftwarePage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<BestMembershipManagementSoftwarePage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/join \d+\+/i)
    expect(text).not.toMatch(/used by \d+\+/i)
  })

  it('renders visible Breadcrumbs with Home link to /', () => {
    render(<BestMembershipManagementSoftwarePage />)
    const homeLink = screen.getByRole('link', { name: /^home$/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders visible Breadcrumbs with Compare link to /compare', () => {
    render(<BestMembershipManagementSoftwarePage />)
    const compareLink = screen.getByRole('link', { name: /^compare$/i })
    expect(compareLink).toHaveAttribute('href', '/compare')
  })

  it('renders PseoRelatedCards with "Explore Related Resources" heading', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /explore related resources/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(
      screen.getByRole('heading', { name: /try the best membership management software - free trial/i })
    ).toBeInTheDocument()
  })

  it('renders FunnelCta with a link to /register', () => {
    render(<BestMembershipManagementSoftwarePage />)
    const ctaSection = screen.getByRole('heading', { name: /try the best membership management software - free trial/i }).closest('section')
    const registerLink = ctaSection?.querySelector('a[href="/register"]')
    expect(registerLink).toBeInTheDocument()
  })

  it('does not render FunnelNextSteps (BOFU page — no mid-funnel nudge)', () => {
    render(<BestMembershipManagementSoftwarePage />)
    expect(screen.queryByRole('heading', { name: /see how gathergro.*can help/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /compare your options/i })).not.toBeInTheDocument()
  })
})

describe('BestMembershipManagementSoftwarePage generateMetadata', () => {
  it('returns metadata with title containing "Best Membership Management Software"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/best membership management software/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug containing "best-membership-management-software"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('best-membership-management-software')
  })

  it('returns metadata with membership-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/membership management/i)
  })

  it('title does not contain double GatherGrove branding', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    const gatherGroveCount = (title.match(/GatherGrove/gi) ?? []).length
    expect(gatherGroveCount).toBeLessThanOrEqual(1)
  })

  it('description is under 155 characters', () => {
    const meta = generateMetadata()
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).length).toBeLessThanOrEqual(155)
  })
})
