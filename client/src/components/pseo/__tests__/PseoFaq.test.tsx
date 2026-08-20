import { render, screen } from '@testing-library/react'
import { PseoFaq } from '../PseoFaq'

describe('PseoFaq', () => {
  const questions = [
    { question: 'What is GatherGrove?', answer: 'A club management platform.' },
    { question: 'How much does it cost?', answer: '$29/month or $200/month.' },
  ]

  it('renders FAQ heading', () => {
    render(<PseoFaq questions={questions} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Frequently Asked Questions'
    )
  })

  it('renders all questions as h3', () => {
    render(<PseoFaq questions={questions} />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(2)
    expect(headings[0]).toHaveTextContent('What is GatherGrove?')
    expect(headings[1]).toHaveTextContent('How much does it cost?')
  })

  it('renders all answers', () => {
    render(<PseoFaq questions={questions} />)
    expect(screen.getByText('A club management platform.')).toBeInTheDocument()
    expect(screen.getByText('$29/month or $200/month.')).toBeInTheDocument()
  })

  it('renders nothing when questions array is empty', () => {
    const { container } = render(<PseoFaq questions={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('accepts a custom heading', () => {
    render(<PseoFaq questions={questions} heading="Common Questions" />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Common Questions')
  })
})
