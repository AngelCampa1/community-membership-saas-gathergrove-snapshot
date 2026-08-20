import { render, screen } from '@testing-library/react'
import FreeVolunteerManagementPage, { generateMetadata } from '../page'

describe('FreeVolunteerManagementPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Volunteer Management Software for Small Organizations"', () => {
    render(<FreeVolunteerManagementPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer management software for small organizations/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<FreeVolunteerManagementPage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*affordable volunteer management software/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 6 FAQ items', () => {
    render(<FreeVolunteerManagementPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(6)
  })

  it('renders the Seed Plan features section', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByRole('heading', { name: /what gathergro.*seed plan includes/i })).toBeInTheDocument()
  })

  it('renders Seed Plan feature items', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByText('Volunteer sign-up forms with public link sharing')).toBeInTheDocument()
    expect(screen.getByText('Shift scheduling with slot capacity limits')).toBeInTheDocument()
    expect(screen.getByText('Volunteer hour tracking per person and event')).toBeInTheDocument()
    expect(screen.getByText('30-day free trial - credit card required to start')).toBeInTheDocument()
  })

  it('renders the comparison table', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByRole('heading', { name: /volunteer management software compared/i })).toBeInTheDocument()
  })

  it('renders the "who should use" section', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByRole('heading', { name: /who should use the seed plan/i })).toBeInTheDocument()
    // The "Under 100 members" bullet is rendered as a bold element within the list
    expect(screen.getByText('Under 100 members')).toBeInTheDocument()
  })

  it('renders "Start Free Trial" CTA link pointing to /register', () => {
    render(<FreeVolunteerManagementPage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByRole('link', { name: /volunteer management software overview/i })).toBeInTheDocument()
    const schedulingLinks = screen.getAllByRole('link', { name: /volunteer scheduling software/i })
    expect(schedulingLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(6)
  })

  it('includes SoftwareApplication schema', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const softwareSchema = schemas.find((s) => s['@type'] === 'SoftwareApplication')
    expect(softwareSchema).toBeDefined()
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('free')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })

  it('renders Breadcrumbs component with Home and Volunteer Management links', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    const homeLinks = screen.getAllByRole('link', { name: /^home$/i })
    expect(homeLinks.some(l => l.getAttribute('href') === '/')).toBe(true)
    const vmLinks = screen.getAllByRole('link', { name: /^volunteer management$/i })
    expect(vmLinks.some(l => l.getAttribute('href') === '/volunteer-management')).toBe(true)
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<FreeVolunteerManagementPage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    // Breadcrumb nav should appear before badge in DOM order
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByRole('heading', { name: /start managing volunteers today/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with a link to /register', () => {
    render(<FreeVolunteerManagementPage />)
    const ctaSection = screen.getByRole('heading', { name: /start managing volunteers today/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders the "More Volunteer Management Guides" section heading', () => {
    render(<FreeVolunteerManagementPage />)
    expect(screen.getByText('More Volunteer Management Guides')).toBeInTheDocument()
  })

  it('links to the for-nonprofits sibling page', () => {
    render(<FreeVolunteerManagementPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Management for Nonprofits/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/for-nonprofits')).toBe(true)
  })

  it('links to the scheduling sibling page', () => {
    render(<FreeVolunteerManagementPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Scheduling Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/scheduling')).toBe(true)
  })

  it('links to the hour-tracking sibling page', () => {
    render(<FreeVolunteerManagementPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Hour Tracking/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/hour-tracking')).toBe(true)
  })

  it('links to the best-software sibling page', () => {
    render(<FreeVolunteerManagementPage />)
    const links = screen.getAllByRole('link', { name: /Best Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/best-software')).toBe(true)
  })

  it('does NOT include a self-link to /volunteer-management/free in the sibling section', () => {
    render(<FreeVolunteerManagementPage />)
    const allLinks = screen.getAllByRole('link')
    const selfSiblingLinks = allLinks.filter(
      (l) =>
        l.getAttribute('href') === '/volunteer-management/free' &&
        l.closest('section')?.querySelector('h2')?.textContent?.includes('More Volunteer Management Guides')
    )
    expect(selfSiblingLinks).toHaveLength(0)
  })
})

describe('FreeVolunteerManagementPage generateMetadata', () => {
  it('returns metadata with title containing "Volunteer Management"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/volunteer management/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug "volunteer-management/free"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/free')
  })

  it('returns metadata with volunteer-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/volunteer management/i)
  })
})
