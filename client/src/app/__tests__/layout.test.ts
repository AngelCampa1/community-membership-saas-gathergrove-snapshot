import { metadata } from '../layout'

describe('root layout metadata', () => {
  it('has robots metadata with index and follow', () => {
    expect(metadata.robots).toBeDefined()
    const robots = metadata.robots as { index: boolean; follow: boolean; googleBot: Record<string, unknown> }
    expect(robots.index).toBe(true)
    expect(robots.follow).toBe(true)
  })

  it('has googleBot with max-snippet=-1', () => {
    const robots = metadata.robots as { googleBot: Record<string, unknown> }
    expect(robots.googleBot['max-snippet']).toBe(-1)
  })

  it('has googleBot with max-image-preview=large', () => {
    const robots = metadata.robots as { googleBot: Record<string, unknown> }
    expect(robots.googleBot['max-image-preview']).toBe('large')
  })

  it('has googleBot with max-video-preview=-1', () => {
    const robots = metadata.robots as { googleBot: Record<string, unknown> }
    expect(robots.googleBot['max-video-preview']).toBe(-1)
  })
})
