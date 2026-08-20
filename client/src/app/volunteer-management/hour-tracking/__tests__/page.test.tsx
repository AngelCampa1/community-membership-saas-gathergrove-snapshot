import { render, screen } from '@testing-library/react'
import VolunteerHourTrackingPage, { generateMetadata } from '../page'

describe('VolunteerHourTrackingPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Volunteer Hour Tracking Software"', () => {
    render(<VolunteerHourTrackingPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer hour tracking software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByText(/what does volunteer hour tracking software do/i)).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 7 FAQ items', () => {
    render(<VolunteerHourTrackingPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(7)
  })

  it('renders the 6 tracking feature cards', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByRole('heading', { name: /automatic shift-based logging/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /manual hour entry/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /per-volunteer and per-event reports/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /csv export for grant applications/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mobile hour submission/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /connected to your member directory/i })).toBeInTheDocument()
  })

  it('renders the how-to steps section', () => {
    render(<VolunteerHourTrackingPage />)
    const headings = screen.getAllByRole('heading', { name: /how to track volunteer hours/i })
    expect(headings.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/create your organization in gathergrove/i)).toBeInTheDocument()
  })

  it('renders the comparison table', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByRole('heading', { name: /vs\. spreadsheets/i })).toBeInTheDocument()
  })

  it('renders the use cases section', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByRole('heading', { name: /who needs volunteer hour tracking/i })).toBeInTheDocument()
    expect(screen.getByText(/nonprofits applying for grants/i)).toBeInTheDocument()
  })

  it('renders CTA links pointing to /register', () => {
    render(<VolunteerHourTrackingPage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByRole('link', { name: /volunteer management software overview/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(7)
  })

  it('includes HowTo schema with correct steps', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const howToSchema = schemas.find((s) => s['@type'] === 'HowTo')
    expect(howToSchema).toBeDefined()
    expect(howToSchema.step.length).toBe(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('hour-tracking')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })

  it('renders Breadcrumbs component with Home and Volunteer Management links', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    const homeLinks = screen.getAllByRole('link', { name: /^home$/i })
    expect(homeLinks.some(l => l.getAttribute('href') === '/')).toBe(true)
    const vmLinks = screen.getAllByRole('link', { name: /^volunteer management$/i })
    expect(vmLinks.some(l => l.getAttribute('href') === '/volunteer-management')).toBe(true)
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<VolunteerHourTrackingPage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    // Breadcrumb nav should appear before badge in DOM order
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByRole('heading', { name: /replace your volunteer hour spreadsheet today/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with Start Free Trial link to /register', () => {
    render(<VolunteerHourTrackingPage />)
    const ctaSection = screen.getByRole('heading', { name: /replace your volunteer hour spreadsheet today/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders the "More Volunteer Management Guides" section heading', () => {
    render(<VolunteerHourTrackingPage />)
    expect(screen.getByText('More Volunteer Management Guides')).toBeInTheDocument()
  })

  it('links to the for-nonprofits sibling page', () => {
    render(<VolunteerHourTrackingPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Management for Nonprofits/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/for-nonprofits')).toBe(true)
  })

  it('links to the free sibling page', () => {
    render(<VolunteerHourTrackingPage />)
    const links = screen.getAllByRole('link', { name: /Free Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/free')).toBe(true)
  })

  it('links to the scheduling sibling page', () => {
    render(<VolunteerHourTrackingPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Scheduling Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/scheduling')).toBe(true)
  })

  it('links to the best-software sibling page', () => {
    render(<VolunteerHourTrackingPage />)
    const links = screen.getAllByRole('link', { name: /Best Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/best-software')).toBe(true)
  })

  it('does NOT include a self-link to /volunteer-management/hour-tracking in the sibling section', () => {
    render(<VolunteerHourTrackingPage />)
    const allLinks = screen.getAllByRole('link')
    const selfSiblingLinks = allLinks.filter(
      (l) =>
        l.getAttribute('href') === '/volunteer-management/hour-tracking' &&
        l.closest('section')?.querySelector('h2')?.textContent?.includes('More Volunteer Management Guides')
    )
    expect(selfSiblingLinks).toHaveLength(0)
  })
})

describe('VolunteerHourTrackingPage generateMetadata', () => {
  it('returns metadata with title containing "hour tracking"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/hour tracking/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug "volunteer-management/hour-tracking"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/hour-tracking')
  })
})
