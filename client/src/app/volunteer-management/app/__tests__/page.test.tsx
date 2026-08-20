import { render, screen } from '@testing-library/react'
import VolunteerManagementAppPage, { generateMetadata } from '../page'

describe('VolunteerManagementAppPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolunteerManagementAppPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing volunteer management app content', () => {
    render(<VolunteerManagementAppPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer management app/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<VolunteerManagementAppPage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*best volunteer management app/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<VolunteerManagementAppPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 5 FAQ items', () => {
    render(<VolunteerManagementAppPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(5)
  })

  it('renders the features section', () => {
    render(<VolunteerManagementAppPage />)
    expect(screen.getByRole('heading', { name: /what the gathergro.* volunteer app includes/i })).toBeInTheDocument()
  })

  it('renders feature cards for iOS/Android, push notifications, QR check-in, and shift scheduling', () => {
    render(<VolunteerManagementAppPage />)
    expect(screen.getByRole('heading', { name: /native ios.*android app/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /push notifications/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /qr code check-in/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /shift scheduling/i })).toBeInTheDocument()
  })

  it('renders the use cases section', () => {
    render(<VolunteerManagementAppPage />)
    expect(screen.getByRole('heading', { name: /how organizations use the volunteer management app/i })).toBeInTheDocument()
  })

  it('renders the comparison table', () => {
    render(<VolunteerManagementAppPage />)
    expect(screen.getByRole('heading', { name: /gathergro.* vs.*signupgenius mobile/i })).toBeInTheDocument()
  })

  it('renders CTA links pointing to /register', () => {
    render(<VolunteerManagementAppPage />)
    const registerLinks = screen.getAllByRole('link').filter((l) =>
      l.getAttribute('href') === '/register'
    )
    expect(registerLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('renders related resources section', () => {
    render(<VolunteerManagementAppPage />)
    expect(screen.getByRole('heading', { name: /related resources/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<VolunteerManagementAppPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema with at least 5 questions', () => {
    const { container } = render(<VolunteerManagementAppPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<VolunteerManagementAppPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    const items = breadcrumb.itemListElement
    expect(items.length).toBeGreaterThanOrEqual(2)
    const paths = items.map((i: { item: string }) => i.item)
    expect(paths.some((p: string) => p.includes('volunteer-management'))).toBe(true)
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<VolunteerManagementAppPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<VolunteerManagementAppPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/join \d+\+/i)
    expect(text).not.toMatch(/used by \d+\+/i)
  })
})

describe('VolunteerManagementAppPage generateMetadata', () => {
  it('returns metadata with title containing "Volunteer Management App"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/volunteer management app/i)
  })

  it('returns metadata with description', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
    expect(meta.description).toMatch(/volunteer/i)
  })

  it('returns metadata with canonical slug "volunteer-management/app"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/app')
  })

  it('returns metadata with mobile/app-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/volunteer management app/i)
  })
})
