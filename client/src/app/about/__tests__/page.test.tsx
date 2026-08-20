import { render, screen } from '@testing-library/react'
import AboutPage, { generateMetadata } from '../page'

describe('AboutPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<AboutPage />)).not.toThrow()
  })

  it('renders the author name', () => {
    render(<AboutPage />)
    const matches = screen.getAllByText(/Angel Campa/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the Founder role', () => {
    render(<AboutPage />)
    expect(screen.getByText(/Founder/)).toBeInTheDocument()
  })

  it('renders a LinkedIn link with correct href', () => {
    render(<AboutPage />)
    const link = screen.getByRole('link', { name: /linkedin/i })
    expect(link).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/angelcamaudit/'
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders a link to resources', () => {
    render(<AboutPage />)
    const links = screen.getAllByRole('link', { name: /resources/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links.some((l) => l.getAttribute('href') === '/resources')).toBe(true)
  })

  it('renders the breadcrumb navigation', () => {
    render(<AboutPage />)
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    const homeTexts = screen.getAllByText('Home')
    expect(homeTexts.length).toBeGreaterThanOrEqual(1)
    const aboutTexts = screen.getAllByText('About')
    expect(aboutTexts.length).toBeGreaterThanOrEqual(1)
  })

  it('renders at least 3 JSON-LD scripts (Person, Organization, Breadcrumb)', () => {
    const { container } = render(<AboutPage />)
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    )
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('includes Person schema', () => {
    const { container } = render(<AboutPage />)
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    )
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const person = schemas.find((s) => s['@type'] === 'Person')
    expect(person).toBeDefined()
    expect(person.name).toBe('Angel Campa')
    expect(person.jobTitle).toBe('Founder')
  })

  it('includes Organization schema', () => {
    const { container } = render(<AboutPage />)
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    )
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const org = schemas.find((s) => s['@type'] === 'Organization')
    expect(org).toBeDefined()
    expect(org.name).toBe('GatherGrove')
  })

  it('includes BreadcrumbList schema', () => {
    const { container } = render(<AboutPage />)
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    )
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(2)
  })

  it('renders a "Solutions by Club Type" link to /for', () => {
    render(<AboutPage />)
    const link = screen.getByRole('link', { name: /solutions by club type/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/for')
  })

  it('renders a "Platform Features" link to /features', () => {
    render(<AboutPage />)
    const link = screen.getByRole('link', { name: /platform features/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/features')
  })

  it('renders a "Compare Alternatives" link to /compare', () => {
    render(<AboutPage />)
    const link = screen.getByRole('link', { name: /compare alternatives/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/compare')
  })

  it('does not contain fabricated social proof', () => {
    const { container } = render(<AboutPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/thousands of/i)
    expect(text).not.toMatch(/\d+\+\s*(users|clubs|members|organizations)/i)
  })
})

describe('AboutPage generateMetadata', () => {
  it('returns metadata with correct title', () => {
    const metadata = generateMetadata()
    const title = typeof metadata.title === 'string' ? metadata.title : (metadata.title as { absolute: string }).absolute
    expect(title).toContain('About Angel Campa, Founder')
    expect(title).toContain('GatherGrove')
  })

  it('returns metadata with a description', () => {
    const metadata = generateMetadata()
    expect(metadata.description).toBeTruthy()
  })
})
