import React from 'react'
import { render, screen } from '@testing-library/react'
import { KeyTakeaways } from '../KeyTakeaways'

describe('KeyTakeaways', () => {
  const takeaways = ['First takeaway', 'Second takeaway', 'Third takeaway']

  it('renders all takeaways', () => {
    render(<KeyTakeaways takeaways={takeaways} />)
    expect(screen.getByText('First takeaway')).toBeInTheDocument()
    expect(screen.getByText('Second takeaway')).toBeInTheDocument()
    expect(screen.getByText('Third takeaway')).toBeInTheDocument()
  })

  it('has id="key-takeaways" for speakable schema targeting', () => {
    const { container } = render(<KeyTakeaways takeaways={takeaways} />)
    expect(container.querySelector('#key-takeaways')).toBeInTheDocument()
  })

  it('renders Key Takeaways heading', () => {
    render(<KeyTakeaways takeaways={takeaways} />)
    expect(screen.getByText('Key Takeaways')).toBeInTheDocument()
  })

  it('renders list items for each takeaway', () => {
    render(<KeyTakeaways takeaways={takeaways} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('handles empty takeaways array', () => {
    const { container } = render(<KeyTakeaways takeaways={[]} />)
    expect(container.querySelector('#key-takeaways')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
