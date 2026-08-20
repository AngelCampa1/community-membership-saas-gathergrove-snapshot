// TDD: tests written before implementation of templates/page.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import TemplatesHubPage from '../page'
import { TEMPLATES } from '@/lib/data/templates'

// Mock components that have complex rendering dependencies
jest.mock('@/components/pseo/FunnelCta', () => ({
  FunnelCta: ({ heading }: { heading: string }) => (
    <div data-testid="funnel-cta">{heading}</div>
  ),
}))

jest.mock('@/components/pseo/HubCrossLinks', () => ({
  HubCrossLinks: () => <div data-testid="hub-cross-links" />,
}))

jest.mock('@/components/seo/QuickAnswer', () => ({
  QuickAnswer: ({ question, answer }: { question: string; answer: string }) => (
    <div data-testid="quick-answer">
      <span data-testid="quick-answer-question">{question}</span>
      <span data-testid="quick-answer-answer">{answer}</span>
    </div>
  ),
}))

describe('Templates hub page (/templates)', () => {
  beforeEach(() => {
    render(<TemplatesHubPage />)
  })

  it('renders the main heading', () => {
    expect(
      screen.getByRole('heading', { name: /free club & organization templates/i })
    ).toBeInTheDocument()
  })

  it('renders a QuickAnswer component', () => {
    expect(screen.getByTestId('quick-answer')).toBeInTheDocument()
  })

  it(`renders at least ${TEMPLATES.length} template cards`, () => {
    // Each template card is a link to /templates/[slug]
    const links = screen.getAllByRole('link').filter((l) =>
      (l.getAttribute('href') ?? '').startsWith('/templates/')
    )
    expect(links.length).toBeGreaterThanOrEqual(TEMPLATES.length)
  })

  it('template card links point to /templates/[slug]', () => {
    const slugLinks = screen.getAllByRole('link').filter((l) =>
      /^\/templates\/[a-z0-9-]+$/.test(l.getAttribute('href') ?? '')
    )
    expect(slugLinks.length).toBeGreaterThanOrEqual(TEMPLATES.length)
  })

  it('renders template titles as text', () => {
    // The first template should appear on the page
    expect(screen.getByText('Meeting Minutes Template')).toBeInTheDocument()
  })

  it('renders category badges', () => {
    // At least one "Meetings" category badge should appear
    const meetingsBadges = screen.getAllByText(/meetings/i)
    expect(meetingsBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('renders a FunnelCta component', () => {
    expect(screen.getByTestId('funnel-cta')).toBeInTheDocument()
  })

  it('has a link to the register page', () => {
    const registerLinks = screen.getAllByRole('link').filter((l) =>
      (l.getAttribute('href') ?? '').includes('/register')
    )
    expect(registerLinks.length).toBeGreaterThanOrEqual(1)
  })
})
