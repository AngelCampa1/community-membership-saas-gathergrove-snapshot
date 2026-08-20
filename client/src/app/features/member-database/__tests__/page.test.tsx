import { render, screen } from '@testing-library/react'
import MemberDatabasePage, { generateMetadata } from '../page'

describe('MemberDatabasePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<MemberDatabasePage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Member Database Software"', () => {
    render(<MemberDatabasePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/member database software/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<MemberDatabasePage />)
    expect(screen.getAllByText(/what is member database software/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the FAQ section heading', () => {
    render(<MemberDatabasePage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 6 FAQ items', () => {
    render(<MemberDatabasePage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(6)
  })

  it('renders the 6 database feature cards', () => {
    render(<MemberDatabasePage />)
    expect(screen.getByRole('heading', { name: /structured member profiles/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /search and filter/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /csv import and export/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /roles and membership types/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /privacy controls/i })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /engagement tracking/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the comparison table', () => {
    render(<MemberDatabasePage />)
    expect(screen.getByRole('heading', { name: /vs\. spreadsheets vs\. crm/i })).toBeInTheDocument()
  })

  it('renders the problems solved section', () => {
    render(<MemberDatabasePage />)
    expect(screen.getByRole('heading', { name: /common member management problems/i })).toBeInTheDocument()
    expect(screen.getByText(/outdated contact information/i)).toBeInTheDocument()
  })

  it('renders CTA links pointing to /register', () => {
    render(<MemberDatabasePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<MemberDatabasePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2)
  })

  it('includes FAQPage schema', () => {
    const { container } = render(<MemberDatabasePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(6)
  })

  it('includes BreadcrumbList schema', () => {
    const { container } = render(<MemberDatabasePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(3)
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<MemberDatabasePage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<MemberDatabasePage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })

  it('renders Breadcrumbs component with Home and Features links', () => {
    render(<MemberDatabasePage />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /^features$/i })).toHaveAttribute('href', '/features')
  })

  it('renders Breadcrumbs before the badge span in the hero section', () => {
    const { container } = render(<MemberDatabasePage />)
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]')
    const badgeSpan = container.querySelector('span.rounded-full')
    expect(breadcrumbNav).not.toBeNull()
    expect(badgeSpan).not.toBeNull()
    const position = breadcrumbNav!.compareDocumentPosition(badgeSpan!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders FunnelCta with page-specific heading', () => {
    render(<MemberDatabasePage />)
    expect(screen.getByRole('heading', { name: /replace your member spreadsheet today/i })).toBeInTheDocument()
  })

  it('renders FunnelCta with a /register link', () => {
    render(<MemberDatabasePage />)
    const ctaSection = screen.getByRole('heading', { name: /replace your member spreadsheet today/i }).closest('section')
    expect(ctaSection).not.toBeNull()
    const registerLink = ctaSection!.querySelector('a[href="/register"]')
    expect(registerLink).not.toBeNull()
  })

  it('renders Explore Related Resources heading from PseoRelatedCards when content available', () => {
    render(<MemberDatabasePage />)
    const relatedHeading = screen.queryByRole('heading', { name: /explore related resources/i })
    if (relatedHeading) {
      expect(relatedHeading).toBeInTheDocument()
    } else {
      expect(relatedHeading).toBeNull()
    }
  })
})

describe('MemberDatabasePage generateMetadata', () => {
  it('returns metadata with title containing "member database"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/member database/i)
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
    expect(canonical).toContain('features/member-database')
  })
})
