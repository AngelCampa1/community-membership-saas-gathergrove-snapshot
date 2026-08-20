import { render, screen } from '@testing-library/react'
import VolunteerManagementForChurchesPage, { generateMetadata } from '../page'

describe('VolunteerManagementForChurchesPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolunteerManagementForChurchesPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing church volunteer management content', () => {
    render(<VolunteerManagementForChurchesPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer management software for churches/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<VolunteerManagementForChurchesPage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*best volunteer management software for churches/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<VolunteerManagementForChurchesPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 5 FAQ items', () => {
    render(<VolunteerManagementForChurchesPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(5)
  })

  it('renders the features section for faith-based organizations', () => {
    render(<VolunteerManagementForChurchesPage />)
    expect(screen.getByRole('heading', { name: /built for faith-based volunteer coordination/i })).toBeInTheDocument()
  })

  it('renders feature cards for recurring scheduling, reminders, sign-up links, and multi-ministry', () => {
    render(<VolunteerManagementForChurchesPage />)
    expect(screen.getByRole('heading', { name: /recurring shift scheduling/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /automated reminders/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /public sign-up links/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /multi-ministry organization/i })).toBeInTheDocument()
  })

  it('renders use cases section', () => {
    render(<VolunteerManagementForChurchesPage />)
    expect(screen.getByRole('heading', { name: /volunteer coordination for every ministry/i })).toBeInTheDocument()
  })

  it('renders the comparison table heading', () => {
    render(<VolunteerManagementForChurchesPage />)
    expect(screen.getByRole('heading', { name: /gathergro.* vs.*spreadsheets/i })).toBeInTheDocument()
  })

  it('renders CTA links pointing to /register', () => {
    render(<VolunteerManagementForChurchesPage />)
    const registerLinks = screen.getAllByRole('link').filter((l) =>
      l.getAttribute('href') === '/register'
    )
    expect(registerLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('renders related resources section', () => {
    render(<VolunteerManagementForChurchesPage />)
    expect(screen.getByRole('heading', { name: /related resources/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<VolunteerManagementForChurchesPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema with at least 5 questions', () => {
    const { container } = render(<VolunteerManagementForChurchesPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<VolunteerManagementForChurchesPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    const items = breadcrumb.itemListElement
    const paths = items.map((i: { item: string }) => i.item)
    expect(paths.some((p: string) => p.includes('for-churches'))).toBe(true)
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<VolunteerManagementForChurchesPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<VolunteerManagementForChurchesPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/join \d+\+/i)
    expect(text).not.toMatch(/used by \d+\+/i)
  })
})

describe('VolunteerManagementForChurchesPage generateMetadata', () => {
  it('returns metadata with title containing "Volunteer Management Software for Churches"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/volunteer management software for churches/i)
  })

  it('returns metadata with description mentioning churches or faith-based', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
    expect(meta.description).toMatch(/church|faith/i)
  })

  it('returns metadata with canonical slug "volunteer-management/for-churches"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/for-churches')
  })

  it('returns metadata with church-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/church/i)
  })
})
