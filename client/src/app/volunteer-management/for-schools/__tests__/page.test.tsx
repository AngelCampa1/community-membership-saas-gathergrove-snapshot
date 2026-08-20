import { render, screen } from '@testing-library/react'
import VolunteerManagementForSchoolsPage, { generateMetadata } from '../page'

describe('VolunteerManagementForSchoolsPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolunteerManagementForSchoolsPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing school volunteer management content', () => {
    render(<VolunteerManagementForSchoolsPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer management software for schools/i)
  })

  it('renders the QuickAnswer section', () => {
    render(<VolunteerManagementForSchoolsPage />)
    expect(
      screen.getByRole('region', { name: /quick answer.*best volunteer management software for schools/i })
    ).toBeInTheDocument()
  })

  it('renders the FAQ section heading', () => {
    render(<VolunteerManagementForSchoolsPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 5 FAQ items', () => {
    render(<VolunteerManagementForSchoolsPage />)
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(faqHeadings.length).toBeGreaterThanOrEqual(5)
  })

  it('renders the features section for schools and PTAs', () => {
    render(<VolunteerManagementForSchoolsPage />)
    expect(screen.getByRole('heading', { name: /built for school and pta volunteer coordination/i })).toBeInTheDocument()
  })

  it('renders feature cards for sign-up forms, parent directory, hour tracking, and event coordination', () => {
    render(<VolunteerManagementForSchoolsPage />)
    expect(screen.getByRole('heading', { name: /event-based sign-up forms/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /parent directory/i })).toBeInTheDocument()
    const hourTrackingHeadings = screen.getAllByRole('heading', { name: /volunteer hour tracking/i })
    expect(hourTrackingHeadings.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('heading', { name: /school event coordination/i })).toBeInTheDocument()
  })

  it('renders use cases section', () => {
    render(<VolunteerManagementForSchoolsPage />)
    expect(screen.getByRole('heading', { name: /school volunteer coordination for every program/i })).toBeInTheDocument()
  })

  it('renders the GatherGrove vs SignUpGenius comparison table', () => {
    render(<VolunteerManagementForSchoolsPage />)
    expect(screen.getByRole('heading', { name: /gathergro.* vs.*signupgenius for schools/i })).toBeInTheDocument()
  })

  it('renders CTA links pointing to /register', () => {
    render(<VolunteerManagementForSchoolsPage />)
    const registerLinks = screen.getAllByRole('link').filter((l) =>
      l.getAttribute('href') === '/register'
    )
    expect(registerLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the PTA/PTO link in related resources', () => {
    render(<VolunteerManagementForSchoolsPage />)
    expect(screen.getByRole('link', { name: /pta.*pto/i })).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<VolunteerManagementForSchoolsPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes FAQPage schema with at least 5 questions', () => {
    const { container } = render(<VolunteerManagementForSchoolsPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('includes BreadcrumbList schema with correct path', () => {
    const { container } = render(<VolunteerManagementForSchoolsPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    const items = breadcrumb.itemListElement
    const paths = items.map((i: { item: string }) => i.item)
    expect(paths.some((p: string) => p.includes('for-schools'))).toBe(true)
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<VolunteerManagementForSchoolsPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<VolunteerManagementForSchoolsPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/join \d+\+/i)
    expect(text).not.toMatch(/used by \d+\+/i)
  })
})

describe('VolunteerManagementForSchoolsPage generateMetadata', () => {
  it('returns metadata with title containing "Volunteer Management Software for Schools"', () => {
    const meta = generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/volunteer management software for schools/i)
  })

  it('returns metadata with description mentioning schools or PTAs', () => {
    const meta = generateMetadata()
    expect(meta.description).toBeTruthy()
    expect(meta.description).toMatch(/school|pta|pto/i)
  })

  it('returns metadata with canonical slug "volunteer-management/for-schools"', () => {
    const meta = generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management/for-schools')
  })

  it('returns metadata with school-related keywords', () => {
    const meta = generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/school/i)
  })
})
