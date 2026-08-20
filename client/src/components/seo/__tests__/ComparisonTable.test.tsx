import React from 'react'
import { render, screen } from '@testing-library/react'
import { ComparisonTable } from '../ComparisonTable'

describe('ComparisonTable', () => {
  const defaultProps = {
    headers: ['Feature', 'GatherGrove', 'Spreadsheets'],
    rows: [
      { Feature: 'Dues Collection', GatherGrove: 'Automated', Spreadsheets: 'Manual' },
      { Feature: 'RSVP Tracking', GatherGrove: 'Built-in', Spreadsheets: 'None' },
    ],
  }

  it('renders headers and rows in mobile cards and the desktop table', () => {
    render(<ComparisonTable {...defaultProps} />)
    expect(screen.getByText('Feature')).toBeInTheDocument()
    expect(screen.getAllByText('GatherGrove')).toHaveLength(3)
    expect(screen.getAllByText('Automated')).toHaveLength(2)
  })

  it('has data-ai-comparison attribute', () => {
    const { container } = render(<ComparisonTable {...defaultProps} />)
    expect(container.querySelector('[data-ai-comparison="true"]')).toBeInTheDocument()
  })

  it('renders caption for mobile cards and desktop table when provided', () => {
    render(<ComparisonTable {...defaultProps} caption="Feature comparison" />)
    expect(screen.getAllByText('Feature comparison')).toHaveLength(2)
  })

  it('does not render caption when not provided', () => {
    const { container } = render(<ComparisonTable {...defaultProps} />)
    expect(container.querySelector('caption')).not.toBeInTheDocument()
  })

  it('renders accessible table element', () => {
    render(<ComparisonTable {...defaultProps} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('handles missing cell values with fallback copy', () => {
    const props = {
      headers: ['A', 'B'],
      rows: [{ A: 'val' }],
    }
    render(<ComparisonTable {...props} />)
    expect(screen.getAllByText('Not listed')).toHaveLength(2)
  })

  it('handles empty rows', () => {
    render(<ComparisonTable headers={['A']} rows={[]} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
