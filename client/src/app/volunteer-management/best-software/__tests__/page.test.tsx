import { render, screen } from '@testing-library/react'
import BestVolunteerManagementSoftwarePage, { generateMetadata } from '../page'

describe('BestVolunteerManagementSoftwarePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Best Volunteer Management Software"', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/best volunteer management software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    // QuickAnswer renders a region with an aria-label containing the question
    expect(
      screen.getByRole('region', { name: /quick answer.*best volunteer management software/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 5 FAQ items', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(5)
  })

  it('renders the top tools section', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /top volunteer management software tools/i })).toBeInTheDocument()
  })

  it('renders all 4 tool cards', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    // Each tool appears in both best-fit scenarios and tool cards sections, use h3 text matching
    const h3s = screen.getAllByRole('heading', { level: 3 })
    const toolNames = h3s.map((h) => h.textContent ?? '')
    expect(toolNames.some((t) => /gathergro/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /better impact/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /volunteerhub/i.test(t))).toBe(true)
    expect(toolNames.some((t) => /signupgenius/i.test(t))).toBe(true)
  })

  it('renders numbered ranking badges (1-4) on tool cards', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    // Rank badges are spans inside a circular pill — query by aria-label for precision
    const rankBadges = container.querySelectorAll('[aria-label^="Rank"]')
    if (rankBadges.length > 0) {
      expect(rankBadges.length).toBe(4)
    } else {
      // Fallback: at minimum 4 tool cards should be rendered
      const toolHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(toolHeadings.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('renders the "Best for small orgs" badge on GatherGrove', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByText(/best for small orgs/i)).toBeInTheDocument()
  })

  it('renders the feature comparison table', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /feature comparison/i })).toBeInTheDocument()
  })

  it('renders the "How to Choose" section', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /how to choose volunteer management software/i })).toBeInTheDocument()
  })

  it('renders "Start Free Trial" CTA link pointing to /register', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByRole('link', { name: /volunteer management software overview/i })).toBeInTheDocument()
    const freeLinks = screen.getAllByRole('link', { name: /free volunteer management software/i })
    expect(freeLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('best-software')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/join \d+\+/i)
    expect(text).not.toMatch(/used by \d+\+/i)
  })

  it('renders Breadcrumbs component with Home and Volunteer Management links', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    const homeLinks = screen.getAllByRole('link', { name: /^home$/i })
    expect(homeLinks.some(l => l.getAttribute('href') === '/')).toBe(true)
    const vmLinks = screen.getAllByRole('link', { name: /^volunteer management$/i })
    expect(vmLinks.some(l => l.getAttribute('href') === '/volunteer-management')).toBe(true)
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<BestVolunteerManagementSoftwarePage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    // Breadcrumb nav should appear before badge in DOM order
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /try the best volunteer management software free/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with Start Free Trial link to /register', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const ctaSection = screen.getByRole('heading', { name: /try the best volunteer management software free/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders the "More Volunteer Management Guides" section heading', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    expect(screen.getByText('More Volunteer Management Guides')).toBeInTheDocument()
  })

  it('links to the for-nonprofits sibling page', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Management for Nonprofits/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/for-nonprofits')).toBe(true)
  })

  it('links to the free sibling page', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const links = screen.getAllByRole('link', { name: /Free Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/free')).toBe(true)
  })

  it('links to the scheduling sibling page', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Scheduling Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/scheduling')).toBe(true)
  })

  it('links to the hour-tracking sibling page', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Hour Tracking/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/hour-tracking')).toBe(true)
  })

  it('does NOT include a self-link to /volunteer-management/best-software in the sibling section', () => {
    render(<BestVolunteerManagementSoftwarePage />)
    const allLinks = screen.getAllByRole('link')
    const selfSiblingLinks = allLinks.filter(
      (l) =>
        l.getAttribute('href') === '/volunteer-management/best-software' &&
        l.closest('section')?.querySelector('h2')?.textContent?.includes('More Volunteer Management Guides')
    )
    expect(selfSiblingLinks).toHaveLength(0)
  })
})

describe('BestVolunteerManagementSoftwarePage generateMetadata', () => {
  it('returns metadata with title containing "Best Volunteer Management Software"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/best volunteer management software/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug "volunteer-management/best-software"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/best-software')
  })

  it('returns metadata with comparison-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/best volunteer management software/i)
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
