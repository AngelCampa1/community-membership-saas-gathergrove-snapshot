import React from 'react'
import { render, screen } from '@testing-library/react'
import { ArticleHeader } from '../ArticleHeader'

const defaultProps = {
  category: 'Best Practices',
  dateModified: '2025-10-01',
  title: 'Member Retention Strategies That Actually Work',
  description: 'Evidence-based approaches to keeping your members engaged and reducing churn.',
  readTime: '12 min read',
}

describe('ArticleHeader', () => {
  it('renders the category badge', () => {
    render(<ArticleHeader {...defaultProps} />)
    expect(screen.getByText('Best Practices')).toBeInTheDocument()
  })

  it('renders the formatted date from dateModified prop', () => {
    render(<ArticleHeader {...defaultProps} />)
    expect(screen.getByText(/October 2025/)).toBeInTheDocument()
  })

  it('renders "Last updated:" prefix with the date', () => {
    render(<ArticleHeader {...defaultProps} />)
    expect(screen.getByText(/Last updated: October 2025/)).toBeInTheDocument()
  })

  it('renders the author name with a link to /about', () => {
    render(<ArticleHeader {...defaultProps} />)
    const authorLink = screen.getByRole('link', { name: /Angel Campa/i })
    expect(authorLink).toBeInTheDocument()
    expect(authorLink).toHaveAttribute('href', '/about')
  })

  it('renders the read time', () => {
    render(<ArticleHeader {...defaultProps} />)
    expect(screen.getByText(/12 min read/)).toBeInTheDocument()
  })

  it('renders the h1 title', () => {
    render(<ArticleHeader {...defaultProps} />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Member Retention Strategies That Actually Work')
  })

  it('renders the description', () => {
    render(<ArticleHeader {...defaultProps} />)
    expect(screen.getByText(/Evidence-based approaches/)).toBeInTheDocument()
  })

  it('applies data-ai-answer attribute to the description paragraph', () => {
    render(<ArticleHeader {...defaultProps} />)
    const description = screen.getByText(/Evidence-based approaches/)
    expect(description).toHaveAttribute('data-ai-answer')
  })

  it('renders as a div (parent page provides the semantic header)', () => {
    const { container } = render(<ArticleHeader {...defaultProps} />)
    const wrapper = container.firstElementChild
    expect(wrapper?.tagName).toBe('DIV')
  })

  it('formats different date strings correctly', () => {
    render(<ArticleHeader {...defaultProps} dateModified="2026-03-15" />)
    expect(screen.getByText(/Last updated: March 2026/)).toBeInTheDocument()
  })
})
