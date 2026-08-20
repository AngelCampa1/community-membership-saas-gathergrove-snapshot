import { render, screen } from '@testing-library/react'
import VolunteerManagementForNonprofitsPage, { generateMetadata } from '../page'

describe('VolunteerManagementForNonprofitsPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolunteerManagementForNonprofitsPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Volunteer Management" and "Nonprofits"', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer management/i)
    expect(h1).toHaveTextContent(/nonprofits/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*nonprofits/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 6 FAQ items', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(6)
  })

  it('renders the 4 nonprofit feature cards', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByRole('heading', { name: /grant-ready hour reports/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /public volunteer sign-up forms/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /unified member/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /compliance-ready tracking/i })).toBeInTheDocument()
  })

  it('renders the use cases section', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByRole('heading', { name: /volunteer management for every type of nonprofit/i })).toBeInTheDocument()
    expect(screen.getByText('Community food banks')).toBeInTheDocument()
    expect(screen.getByText('Animal shelters')).toBeInTheDocument()
  })

  it('renders the grant reporting section', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByRole('heading', { name: /volunteer hour tracking for grant reporting/i })).toBeInTheDocument()
  })

  it('renders the comparison table', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByRole('heading', { name: /vs\. spreadsheets/i })).toBeInTheDocument()
  })

  it('renders "Start Free" CTA link pointing to /register', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const freeLinks = screen.getAllByRole('link', { name: /free volunteer management software/i })
    expect(freeLinks.length).toBeGreaterThanOrEqual(1)
    const schedulingLinks = screen.getAllByRole('link', { name: /volunteer scheduling software/i })
    expect(schedulingLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<VolunteerManagementForNonprofitsPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<VolunteerManagementForNonprofitsPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(6)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<VolunteerManagementForNonprofitsPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('for-nonprofits')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<VolunteerManagementForNonprofitsPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<VolunteerManagementForNonprofitsPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })

  it('renders Breadcrumbs component with Home and Volunteer Management links', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    const homeLinks = screen.getAllByRole('link', { name: /^home$/i })
    expect(homeLinks.some(l => l.getAttribute('href') === '/')).toBe(true)
    const vmLinks = screen.getAllByRole('link', { name: /^volunteer management$/i })
    expect(vmLinks.some(l => l.getAttribute('href') === '/volunteer-management')).toBe(true)
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<VolunteerManagementForNonprofitsPage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    // Breadcrumb nav should appear before badge in DOM order
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByRole('heading', { name: /free volunteer management for nonprofits/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with Start Free Trial link to /register', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const ctaSection = screen.getByRole('heading', { name: /free volunteer management for nonprofits/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders the "More Volunteer Management Guides" section heading', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    expect(screen.getByText('More Volunteer Management Guides')).toBeInTheDocument()
  })

  it('links to the free sibling page', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const links = screen.getAllByRole('link', { name: /Free Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/free')).toBe(true)
  })

  it('links to the scheduling sibling page', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Scheduling Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/scheduling')).toBe(true)
  })

  it('links to the hour-tracking sibling page', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Hour Tracking/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/hour-tracking')).toBe(true)
  })

  it('links to the best-software sibling page', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const links = screen.getAllByRole('link', { name: /Best Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/best-software')).toBe(true)
  })

  it('does NOT include a self-link to /volunteer-management/for-nonprofits in the sibling section', () => {
    render(<VolunteerManagementForNonprofitsPage />)
    const allLinks = screen.getAllByRole('link')
    const selfSiblingLinks = allLinks.filter(
      (l) =>
        l.getAttribute('href') === '/volunteer-management/for-nonprofits' &&
        l.closest('section')?.querySelector('h2')?.textContent?.includes('More Volunteer Management Guides')
    )
    expect(selfSiblingLinks).toHaveLength(0)
  })
})

describe('VolunteerManagementForNonprofitsPage generateMetadata', () => {
  it('returns metadata with title containing "Nonprofits"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/nonprofits/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug "volunteer-management/for-nonprofits"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/for-nonprofits')
  })

  it('returns metadata with nonprofit-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/nonprofit/i)
  })
})
