import { render, screen } from '@testing-library/react'
import BestEventRegistrationSoftwarePage, { generateMetadata } from '../page'

describe('BestEventRegistrationSoftwarePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<BestEventRegistrationSoftwarePage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Best Event Registration Software"', () => {
    render(<BestEventRegistrationSoftwarePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/best event registration software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*event registration software/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 5 FAQ items', () => {
    render(<BestEventRegistrationSoftwarePage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(5)
  })

  it('renders the top tools section', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(screen.getByRole('heading', { name: /top event registration software tools/i })).toBeInTheDocument()
  })

  it('renders all 4 tool cards', () => {
    render(<BestEventRegistrationSoftwarePage />)
    // GatherGrove appears multiple times (tool card + best-fit scenarios), so use getAllByRole
    const gatherGroveHeadings = screen.getAllByRole('heading', { name: /^gathergro/i })
    expect(gatherGroveHeadings.length).toBeGreaterThanOrEqual(1)
    // Tool card headings are h3 with exact tool name — use level to distinguish from FAQ h3
    const h3s = screen.getAllByRole('heading', { level: 3 })
    const toolNames = h3s.map((h) => h.textContent ?? '')
    expect(toolNames).toContain('Eventbrite')
    expect(toolNames).toContain('RSVPify')
    expect(toolNames).toContain('Whova')
  })

  it('renders the "Best for member orgs" badge on GatherGrove', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(screen.getByText(/best for member orgs/i)).toBeInTheDocument()
  })

  it('renders the feature comparison table', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(screen.getByRole('heading', { name: /feature comparison.*event registration/i })).toBeInTheDocument()
  })

  it('renders the "How to Choose" section', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(screen.getByRole('heading', { name: /how to choose event registration software/i })).toBeInTheDocument()
  })

  it('renders "Start Free Trial" CTA link pointing to /register', () => {
    render(<BestEventRegistrationSoftwarePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<BestEventRegistrationSoftwarePage />)
    // Multiple "All Software Comparisons" links appear in the related resources section
    const compareLinks = screen.getAllByRole('link', { name: /all software comparisons/i })
    expect(compareLinks.length).toBeGreaterThanOrEqual(1)
    compareLinks.forEach((link) => expect(link).toHaveAttribute('href', '/compare'))
    // Event Planning Features link is present in the related resources section
    expect(screen.getByRole('link', { name: /event planning features/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<BestEventRegistrationSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<BestEventRegistrationSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<BestEventRegistrationSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('best-event-registration-software')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<BestEventRegistrationSoftwarePage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<BestEventRegistrationSoftwarePage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/join \d+\+/i)
    expect(text).not.toMatch(/used by \d+\+/i)
  })

  it('renders visible Breadcrumbs with Home link to /', () => {
    render(<BestEventRegistrationSoftwarePage />)
    const homeLink = screen.getByRole('link', { name: /^home$/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders visible Breadcrumbs with Compare link to /compare', () => {
    render(<BestEventRegistrationSoftwarePage />)
    const compareLink = screen.getByRole('link', { name: /^compare$/i })
    expect(compareLink).toHaveAttribute('href', '/compare')
  })

  it('renders PseoRelatedCards with "Explore Related Resources" heading', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(screen.getByRole('heading', { name: /explore related resources/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(
      screen.getByRole('heading', { name: /try the best event registration software/i })
    ).toBeInTheDocument()
  })

  it('renders FunnelCta with a link to /register', () => {
    render(<BestEventRegistrationSoftwarePage />)
    const ctaSection = screen.getByRole('heading', { name: /try the best event registration software/i }).closest('section')
    const registerLink = ctaSection?.querySelector('a[href="/register"]')
    expect(registerLink).toBeInTheDocument()
  })

  it('does not render FunnelNextSteps (BOFU page — no mid-funnel nudge)', () => {
    render(<BestEventRegistrationSoftwarePage />)
    expect(screen.queryByRole('heading', { name: /see how gathergro.*can help/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /compare your options/i })).not.toBeInTheDocument()
  })
})

describe('BestEventRegistrationSoftwarePage generateMetadata', () => {
  it('returns metadata with title containing "Best Event Registration Software"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/best event registration software/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug containing "best-event-registration-software"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('best-event-registration-software')
  })

  it('returns metadata with event-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/event registration/i)
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
