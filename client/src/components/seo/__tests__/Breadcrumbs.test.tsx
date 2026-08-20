import React from 'react'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '../Breadcrumbs'

describe('Breadcrumbs', () => {
  const items = [
    { name: 'Home', href: '/' },
    { name: 'Resources', href: '/resources' },
    { name: 'Guide', href: '/resources/guide' },
  ]

  it('renders navigation with breadcrumb label', () => {
    render(<Breadcrumbs items={items} />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
  })

  it('renders all breadcrumb items', () => {
    render(<Breadcrumbs items={items} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Resources')).toBeInTheDocument()
    expect(screen.getByText('Guide')).toBeInTheDocument()
  })

  it('last item has aria-current="page"', () => {
    render(<Breadcrumbs items={items} />)
    expect(screen.getByText('Guide')).toHaveAttribute('aria-current', 'page')
  })

  it('non-last items are links', () => {
    render(<Breadcrumbs items={items} />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders BreadcrumbList schema via microdata', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const list = container.querySelector('[itemtype="https://schema.org/BreadcrumbList"]')
    expect(list).toBeInTheDocument()
  })
})
