import {
  SITE_URL,
  SITE_DISPLAY_DOMAIN,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
  SITE_AUTHOR_URL,
  SITE_AUTHOR_LINKEDIN,
  TWITTER_HANDLE,
  TWITTER_CREATOR,
  LOGO_PATH,
  OG_IMAGE_PATH,
  SUPPORT_EMAIL,
  CURRENT_YEAR,
  PROGRAMMATIC_PAGES_LAST_UPDATED,
} from '../site-config'

describe('site-config', () => {
  it('exports a valid SITE_URL', () => {
    expect(() => new URL(SITE_URL)).not.toThrow()
    expect(SITE_URL).not.toMatch(/\/$/) // no trailing slash
  })

  it('derives SITE_DISPLAY_DOMAIN from SITE_URL', () => {
    expect(SITE_DISPLAY_DOMAIN).toBe('www.gathergrove.club')
  })

  it('exports core identity constants', () => {
    expect(SITE_NAME).toBe('GatherGrove')
    expect(SITE_DESCRIPTION).toBeTruthy()
    expect(SITE_AUTHOR).toBeTruthy()
    expect(SITE_AUTHOR_URL).toMatch(/^\//) // relative path to /about page
  })

  it('exports SITE_AUTHOR_LINKEDIN as a LinkedIn URL', () => {
    expect(SITE_AUTHOR_LINKEDIN).toMatch(/^https:\/\/www\.linkedin\.com\//)
  })

  it('exports social handles', () => {
    expect(TWITTER_HANDLE).toMatch(/^@/)
    expect(TWITTER_CREATOR).toMatch(/^@/)
  })

  it('exports asset paths starting with /', () => {
    expect(LOGO_PATH).toMatch(/^\//)
    expect(OG_IMAGE_PATH).toMatch(/^\//)
  })

  it('exports a valid support email', () => {
    expect(SUPPORT_EMAIL).toMatch(/@/)
  })

  it('exports CURRENT_YEAR as a 4-digit number', () => {
    expect(CURRENT_YEAR).toBeGreaterThanOrEqual(2024)
    expect(CURRENT_YEAR).toBeLessThanOrEqual(2100)
  })

  it('exports PROGRAMMATIC_PAGES_LAST_UPDATED as ISO date', () => {
    expect(PROGRAMMATIC_PAGES_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(PROGRAMMATIC_PAGES_LAST_UPDATED).toString()).not.toBe('Invalid Date')
  })
})
