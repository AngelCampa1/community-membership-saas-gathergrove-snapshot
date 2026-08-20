import { render, screen } from '@testing-library/react'
import VolunteerSchedulingPage, { generateMetadata } from '../page'

describe('VolunteerSchedulingPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Volunteer Scheduling Software"', () => {
    render(<VolunteerSchedulingPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer scheduling software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByText(/what does volunteer scheduling software do/i)).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 6 FAQ items', () => {
    render(<VolunteerSchedulingPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(6)
  })

  it('renders the 4 scheduling feature cards', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByRole('heading', { name: /visual shift builder/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /slot capacity management/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /automated shift reminders/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /hour logging after shifts/i })).toBeInTheDocument()
  })

  it('renders the how-to steps section', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByRole('heading', { name: /how to schedule volunteers/i })).toBeInTheDocument()
    // First step should be present
    expect(screen.getByText(/create your volunteer opportunity/i)).toBeInTheDocument()
  })

  it('renders the comparison table', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByRole('heading', { name: /vs\. manual methods/i })).toBeInTheDocument()
  })

  it('renders the common problems section', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByRole('heading', { name: /common volunteer scheduling problems/i })).toBeInTheDocument()
    expect(screen.getByText(/overbooking shifts/i)).toBeInTheDocument()
    expect(screen.getByText(/no-shows on event day/i)).toBeInTheDocument()
  })

  it('renders "Start Free Trial" CTA link pointing to /register', () => {
    render(<VolunteerSchedulingPage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders related resources links', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByRole('link', { name: /volunteer management software overview/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(6)
  })

  it('includes HowTo schema with correct steps', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const howToSchema = schemas.find((s) => s['@type'] === 'HowTo')
    expect(howToSchema).toBeDefined()
    expect(howToSchema.step.length).toBe(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
    expect(breadcrumb.itemListElement[2].item).toContain('scheduling')
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })

  it('renders Breadcrumbs component with Home and Volunteer Management links', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    const homeLinks = screen.getAllByRole('link', { name: /^home$/i })
    expect(homeLinks.some(l => l.getAttribute('href') === '/')).toBe(true)
    const vmLinks = screen.getAllByRole('link', { name: /^volunteer management$/i })
    expect(vmLinks.some(l => l.getAttribute('href') === '/volunteer-management')).toBe(true)
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<VolunteerSchedulingPage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    // Breadcrumb nav should appear before badge in DOM order
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByRole('heading', { name: /replace your scheduling spreadsheet today/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with Start Free Trial link to /register', () => {
    render(<VolunteerSchedulingPage />)
    const ctaSection = screen.getByRole('heading', { name: /replace your scheduling spreadsheet today/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders the "More Volunteer Management Guides" section heading', () => {
    render(<VolunteerSchedulingPage />)
    expect(screen.getByText('More Volunteer Management Guides')).toBeInTheDocument()
  })

  it('links to the for-nonprofits sibling page', () => {
    render(<VolunteerSchedulingPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Management for Nonprofits/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/for-nonprofits')).toBe(true)
  })

  it('links to the free sibling page', () => {
    render(<VolunteerSchedulingPage />)
    const links = screen.getAllByRole('link', { name: /Free Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/free')).toBe(true)
  })

  it('links to the hour-tracking sibling page', () => {
    render(<VolunteerSchedulingPage />)
    const links = screen.getAllByRole('link', { name: /Volunteer Hour Tracking/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/hour-tracking')).toBe(true)
  })

  it('links to the best-software sibling page', () => {
    render(<VolunteerSchedulingPage />)
    const links = screen.getAllByRole('link', { name: /Best Volunteer Management Software/i })
    expect(links.some((l) => l.getAttribute('href') === '/volunteer-management/best-software')).toBe(true)
  })

  it('does NOT include a self-link to /volunteer-management/scheduling in the sibling section', () => {
    render(<VolunteerSchedulingPage />)
    const allLinks = screen.getAllByRole('link')
    const selfSiblingLinks = allLinks.filter(
      (l) =>
        l.getAttribute('href') === '/volunteer-management/scheduling' &&
        l.closest('section')?.querySelector('h2')?.textContent?.includes('More Volunteer Management Guides')
    )
    expect(selfSiblingLinks).toHaveLength(0)
  })
})

describe('VolunteerSchedulingPage generateMetadata', () => {
  it('returns metadata with title containing "scheduling"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/scheduling/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
  })

  it('returns metadata with canonical slug "volunteer-management/scheduling"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/scheduling')
  })

  it('returns metadata with scheduling-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/scheduling/i)
  })
})
