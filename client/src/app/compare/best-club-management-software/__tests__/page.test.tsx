import { render, screen } from '@testing-library/react'
import BestClubManagementSoftwarePage, { generateMetadata } from '../page'

describe('BestClubManagementSoftwarePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<BestClubManagementSoftwarePage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Best Club Management Software"', () => {
    render(<BestClubManagementSoftwarePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/best club management software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*club management software/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 5 FAQ items', () => {
    render(<BestClubManagementSoftwarePage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(5)
  })

  it('renders the top tools section', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /top club management software tools/i })).toBeInTheDocument()
  })

  it('renders all 4 tool cards', () => {
    render(<BestClubManagementSoftwarePage />)
    const h3s = screen.getAllByRole('heading', { level: 3 })
    const toolNames = h3s.map((h) => h.textContent ?? '')
    expect(toolNames.some((t) => t === 'GatherGrove')).toBe(true)
    expect(toolNames.some((t) => /wild apricot/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /teamup/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /clubexpress/i.test(t))).toBe(true)
  })

  it('renders the "Best for small clubs" badge on GatherGrove', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.getByText(/best for small clubs/i)).toBeInTheDocument()
  })

  it('renders the feature comparison table', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /feature comparison.*club management/i })).toBeInTheDocument()
  })

  it('renders the "How to Choose" section', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /how to choose club management software/i })).toBeInTheDocument()
  })

  it('renders "Start Free Trial" CTA link pointing to /register', () => {
    render(<BestClubManagementSoftwarePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.getByRole('link', { name: /all software comparisons/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<BestClubManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<BestClubManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<BestClubManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('best-club-management-software')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<BestClubManagementSoftwarePage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<BestClubManagementSoftwarePage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/join \d+\+/i)
    expect(text).not.toMatch(/used by \d+\+/i)
  })

  it('renders visible Breadcrumbs with Home link to /', () => {
    render(<BestClubManagementSoftwarePage />)
    const homeLink = screen.getByRole('link', { name: /^home$/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders visible Breadcrumbs with Compare link to /compare', () => {
    render(<BestClubManagementSoftwarePage />)
    const compareLink = screen.getByRole('link', { name: /^compare$/i })
    expect(compareLink).toHaveAttribute('href', '/compare')
  })

  it('renders PseoRelatedCards with "Explore Related Resources" heading', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /explore related resources/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(
      screen.getByRole('heading', { name: /try the best club management software/i })
    ).toBeInTheDocument()
  })

  it('renders FunnelCta with a link to /register', () => {
    render(<BestClubManagementSoftwarePage />)
    const ctaSection = screen.getByRole('heading', { name: /try the best club management software/i }).closest('section')
    const registerLink = ctaSection?.querySelector('a[href="/register"]')
    expect(registerLink).toBeInTheDocument()
  })

  it('does not render FunnelNextSteps (BOFU page — no mid-funnel nudge)', () => {
    render(<BestClubManagementSoftwarePage />)
    expect(screen.queryByRole('heading', { name: /see how gathergro.*can help/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /compare your options/i })).not.toBeInTheDocument()
  })
})

describe('BestClubManagementSoftwarePage generateMetadata', () => {
  it('returns metadata with title containing "Best Club Management Software"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/best club management software/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug containing "best-club-management-software"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('best-club-management-software')
  })

  it('returns metadata with club-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/club management/i)
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
