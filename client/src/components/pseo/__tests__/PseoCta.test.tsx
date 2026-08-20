import { render, screen } from '@testing-library/react'
import { PseoCta } from '../PseoCta'

describe('PseoCta', () => {
  it('renders heading and description', () => {
    render(<PseoCta heading="Ready to go?" description="Start today." />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ready to go?')
    expect(screen.getByText('Start today.')).toBeInTheDocument()
  })

  it('renders CTA link to /register by default', () => {
    render(<PseoCta heading="Ready?" description="Go." />)
    const link = screen.getByRole('link', { name: /start free trial/i })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('renders custom CTA text and href', () => {
    render(
      <PseoCta
        heading="Ready?"
        description="Go."
        ctaText="Try Now"
        ctaHref="/pricing"
      />
    )
    const link = screen.getByRole('link', { name: /try now/i })
    expect(link).toHaveAttribute('href', '/pricing')
  })
})
