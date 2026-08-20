import { render, screen } from '@testing-library/react'
import { PseoRelatedCards } from '../PseoRelatedCards'

describe('PseoRelatedCards', () => {
  const items = [
    { title: 'Book Clubs', href: '/for/book-clubs', description: 'Manage book clubs' },
    { title: 'Running Clubs', href: '/for/running-clubs', description: 'Manage running clubs' },
  ]

  it('renders section heading', () => {
    render(<PseoRelatedCards heading="Also Popular" items={items} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Also Popular')
  })

  it('renders all items as links', () => {
    render(<PseoRelatedCards heading="Related" items={items} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/for/book-clubs')
    expect(links[1]).toHaveAttribute('href', '/for/running-clubs')
  })

  it('renders titles and descriptions', () => {
    render(<PseoRelatedCards heading="Related" items={items} />)
    expect(screen.getByText('Book Clubs')).toBeInTheDocument()
    expect(screen.getByText('Manage book clubs')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <PseoRelatedCards
        heading="Related"
        items={items}
        subtitle="Category"
      />
    )
    const subtitles = screen.getAllByText('Category')
    expect(subtitles.length).toBeGreaterThan(0)
  })

  it('renders nothing when items array is empty', () => {
    const { container } = render(<PseoRelatedCards heading="Related" items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
