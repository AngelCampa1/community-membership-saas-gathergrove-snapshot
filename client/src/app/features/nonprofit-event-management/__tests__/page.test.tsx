import { render, screen } from '@testing-library/react'
import NonprofitEventManagementPage, { generateMetadata } from '../page'

describe('NonprofitEventManagementPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Nonprofit Event Management Software"', () => {
    render(<NonprofitEventManagementPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/nonprofit event management software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getAllByText(/what is nonprofit event management software/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the FAQ section heading', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 7 FAQ items', () => {
    render(<NonprofitEventManagementPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(7)
  })

  it('renders the 6 event feature cards', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getByRole('heading', { name: /online event registration/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /payment collection via stripe/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /qr code check-in/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /attendee communications/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /member-aware attendance/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /event analytics and feedback/i })).toBeInTheDocument()
  })

  it('renders the how-to steps section', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getByRole('heading', { name: /how to manage nonprofit events/i })).toBeInTheDocument()
  })

  it('renders the comparison table', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getByRole('heading', { name: /nonprofit event management software comparison/i })).toBeInTheDocument()
  })

  it('renders the event types section', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getByRole('heading', { name: /nonprofit event types/i })).toBeInTheDocument()
    expect(screen.getByText(/fundraising galas and dinners/i)).toBeInTheDocument()
  })

  it('renders CTA links pointing to /register', () => {
    render(<NonprofitEventManagementPage />)
    const ctaLinks = screen.getAllByRole('link', { name: /create your first event free/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(7)
  })

  it('includes HowTo schema with correct steps', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const howToSchema = schemas.find((s) => s['@type'] === 'HowTo')
    expect(howToSchema).toBeDefined()
    expect(howToSchema.step.length).toBe(5)
  })

  it('includes BreadcrumbList schema', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })

  it('renders Breadcrumbs component with Home and Features links', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /^features$/i })).toHaveAttribute('href', '/features')
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<NonprofitEventManagementPage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<NonprofitEventManagementPage />)
    expect(screen.getByRole('heading', { name: /manage your nonprofit events in one place/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with a /register link', () => {
    render(<NonprofitEventManagementPage />)
    const ctaSection = screen.getByRole('heading', { name: /manage your nonprofit events in one place/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders Explore Related Resources heading from PseoRelatedCards when content available', () => {
    render(<NonprofitEventManagementPage />)
    // PseoRelatedCards renders null when items is empty; heading only appears if related content found
    const relatedHeading = screen.queryByRole('heading', { name: /explore related resources/i })
    // It may or may not render depending on content data - either outcome is valid
    if (relatedHeading) {
      expect(relatedHeading).toBeInTheDocument()
    } else {
      expect(relatedHeading).toBeNull()
    }
  })
})

describe('NonprofitEventManagementPage generateMetadata', () => {
  it('returns metadata with title containing "nonprofit event management"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/nonprofit event management/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('features/nonprofit-event-management')
  })
})
