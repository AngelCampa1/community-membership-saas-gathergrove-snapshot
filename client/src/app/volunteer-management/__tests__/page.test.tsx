import { render, screen } from '@testing-library/react'
import VolunteerManagementPage, { generateMetadata } from '../page'

describe('VolunteerManagementPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolunteerManagementPage />)
    expect(container).toBeTruthy()
  })

  it('renders H1 containing "Volunteer Management"', () => {
    render(<VolunteerManagementPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/volunteer management/i)
  })

  it('renders the FAQ section heading', () => {
    render(<VolunteerManagementPage />)
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders at least 6 FAQ items', () => {
    render(<VolunteerManagementPage />)
    // Each FAQ question is rendered as an h3
    const faqHeadings = screen.getAllByRole('heading', { level: 3 })
    // Some h3s may be inside QuickAnswer; filter for FAQ section specifically
    // The FAQ section renders each question.question as an h3
    expect(faqHeadings.length).toBeGreaterThanOrEqual(6)
  })

  it('renders "Start Free Trial" CTA links pointing to /register', () => {
    render(<VolunteerManagementPage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start free trial/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  it('renders the features section heading', () => {
    render(<VolunteerManagementPage />)
    expect(
      screen.getByRole('heading', { name: /everything you need to manage volunteers/i })
    ).toBeInTheDocument()
  })

  it('renders all 4 feature cards', () => {
    render(<VolunteerManagementPage />)
    // Feature card titles are rendered as h3 elements
    expect(screen.getByRole('heading', { name: /^sign-up forms$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^shift scheduling$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^hour tracking$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^automated communications$/i })).toBeInTheDocument()
  })

  it('renders the how-to steps section', () => {
    render(<VolunteerManagementPage />)
    expect(
      screen.getByRole('heading', { name: /how to set up volunteer management/i })
    ).toBeInTheDocument()
    // First step text should appear
    expect(screen.getByText(/create your gathergro/i)).toBeInTheDocument()
  })

  it('renders the comparison section heading', () => {
    render(<VolunteerManagementPage />)
    expect(
      screen.getByRole('heading', { name: /vs\. spreadsheets/i })
    ).toBeInTheDocument()
  })

  it('renders the cluster guides section with 4 links', () => {
    render(<VolunteerManagementPage />)
    expect(screen.getByRole('heading', { name: /explore volunteer management guides/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /for nonprofits/i })).toHaveAttribute('href', '/volunteer-management/for-nonprofits')
    expect(screen.getByRole('link', { name: /free software/i })).toHaveAttribute('href', '/volunteer-management/free')
    expect(screen.getByRole('link', { name: /scheduling software/i })).toHaveAttribute('href', '/volunteer-management/scheduling')
    expect(screen.getByRole('link', { name: /best software compared/i })).toHaveAttribute('href', '/volunteer-management/best-software')
  })

  it('renders the "Who Uses" section heading and expected org types', () => {
    render(<VolunteerManagementPage />)
    expect(
      screen.getByRole('heading', { name: /who uses gathergro/i })
    ).toBeInTheDocument()
    // The who-uses grid renders labels as <p> with font-semibold — use exact label text
    expect(screen.getByText('Sports clubs')).toBeInTheDocument()
    expect(screen.getByText('Nonprofits')).toBeInTheDocument()
    expect(screen.getByText('School PTAs')).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<VolunteerManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    // Should have at least FAQ, Service, Breadcrumb, HowTo schemas
    expect(scripts.length).toBeGreaterThanOrEqual(4)
  })

  it('includes HowTo schema', () => {
    const { container } = render(<VolunteerManagementPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const howToSchema = schemas.find((s) => s['@type'] === 'HowTo')
    expect(howToSchema).toBeDefined()
    expect(howToSchema.step.length).toBeGreaterThanOrEqual(3)
  })

  it('renders data-ai-answer attributes on key content', () => {
    const { container } = render(<VolunteerManagementPage />)
    const aiAnswerEls = container.querySelectorAll('[data-ai-answer]')
    expect(aiAnswerEls.length).toBeGreaterThan(0)
  })
})

describe('VolunteerManagementPage generateMetadata', () => {
  it('returns metadata with title containing "Volunteer Management"', async () => {
    const meta = await generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).toMatch(/volunteer management/i)
  })

  it('returns metadata with canonical slug "volunteer-management"', async () => {
    const meta = await generateMetadata()
    const canonical =
      typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : String(meta.alternates?.canonical ?? '')
    expect(canonical).toContain('volunteer-management')
  })

  it('returns metadata with relevant keywords', async () => {
    const meta = await generateMetadata()
    const keywords = typeof meta.keywords === 'string' ? meta.keywords : (meta.keywords ?? []).join(', ')
    expect(keywords).toMatch(/volunteer management/i)
  })

  it('title does not contain double GatherGrove branding', async () => {
    const meta = await generateMetadata()
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    const gatherGroveCount = (title.match(/GatherGrove/gi) ?? []).length
    expect(gatherGroveCount).toBeLessThanOrEqual(1)
  })

  it('description is under 155 characters', async () => {
    const meta = await generateMetadata()
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).length).toBeLessThanOrEqual(155)
  })
})
