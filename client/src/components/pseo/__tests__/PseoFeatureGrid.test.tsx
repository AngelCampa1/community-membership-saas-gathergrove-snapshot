import { render, screen } from '@testing-library/react'
import { PseoFeatureGrid } from '../PseoFeatureGrid'

describe('PseoFeatureGrid', () => {
  const features = ['Member management', 'Dues collection', 'Event planning']

  it('renders heading', () => {
    render(<PseoFeatureGrid heading="What You Get" features={features} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What You Get')
  })

  it('renders all feature items', () => {
    render(<PseoFeatureGrid heading="Features" features={features} />)
    expect(screen.getByText('Member management')).toBeInTheDocument()
    expect(screen.getByText('Dues collection')).toBeInTheDocument()
    expect(screen.getByText('Event planning')).toBeInTheDocument()
  })

  it('renders checkmark icons for each feature', () => {
    const { container } = render(<PseoFeatureGrid heading="Features" features={features} />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs).toHaveLength(3)
  })

  it('renders nothing when features array is empty', () => {
    const { container } = render(<PseoFeatureGrid heading="Features" features={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
