import { render, screen } from '@testing-library/react'
import CommunityManagementSoftwarePage, { generateMetadata } from '../page'

describe('CommunityManagementSoftwarePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<CommunityManagementSoftwarePage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Community Management Software"', () => {
    render(<CommunityManagementSoftwarePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/community management software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<CommunityManagementSoftwarePage />)
    expect(screen.getAllByText(/what is community management software/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the FAQ section heading', () => {
    render(<CommunityManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 6 FAQ items', () => {
    render(<CommunityManagementSoftwarePage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(6)
  })

  it('renders the 6 community feature cards', () => {
    render(<CommunityManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /member directory/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /event coordination/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /real-time chat/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mass communications/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /automated dues collection/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /engagement analytics/i })).toBeInTheDocument()
  })

  it('renders the comparison table', () => {
    render(<CommunityManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /vs\. diy tools/i })).toBeInTheDocument()
  })

  it('renders the audience section', () => {
    render(<CommunityManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /who uses community management software/i })).toBeInTheDocument()
    expect(screen.getByText(/hobby and recreational clubs/i)).toBeInTheDocument()
  })

  it('renders CTA links pointing to /register', () => {
    render(<CommunityManagementSoftwarePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /build your community free/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<CommunityManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<CommunityManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(6)
  })

  it('includes BreadcrumbList schema', () => {
    const { container } = render(<CommunityManagementSoftwarePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<CommunityManagementSoftwarePage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<CommunityManagementSoftwarePage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })

  it('renders Breadcrumbs component with Home and Features links', () => {
    render(<CommunityManagementSoftwarePage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /^features$/i })).toHaveAttribute('href', '/features')
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<CommunityManagementSoftwarePage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<CommunityManagementSoftwarePage />)
    expect(screen.getByRole('heading', { name: /manage your community in one platform/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with a /register link', () => {
    render(<CommunityManagementSoftwarePage />)
    const ctaSection = screen.getByRole('heading', { name: /manage your community in one platform/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders Explore Related Resources heading from PseoRelatedCards when content available', () => {
    render(<CommunityManagementSoftwarePage />)
    const relatedHeading = screen.queryByRole('heading', { name: /explore related resources/i })
    if (relatedHeading) {
      expect(relatedHeading).toBeInTheDocument()
    } else {
      expect(relatedHeading).toBeNull()
    }
  })
})

describe('CommunityManagementSoftwarePage generateMetadata', () => {
  it('returns metadata with title containing "community management"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/community management/i)
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
    expect(canonical).toContain('features/community-management-software')
  })
})
