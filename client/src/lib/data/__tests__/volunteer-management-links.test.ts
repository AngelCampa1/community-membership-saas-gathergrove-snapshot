import { VOLUNTEER_MANAGEMENT_LINKS, type VolunteerManagementLink } from '../volunteer-management-links'

describe('VOLUNTEER_MANAGEMENT_LINKS', () => {
  it('exports exactly 5 items', () => {
    expect(VOLUNTEER_MANAGEMENT_LINKS).toHaveLength(5)
  })

  it('each item has href, title, and description', () => {
    VOLUNTEER_MANAGEMENT_LINKS.forEach((link: VolunteerManagementLink) => {
      expect(link.href).toBeTruthy()
      expect(link.title).toBeTruthy()
      expect(link.description).toBeTruthy()
    })
  })

  it('all hrefs start with /volunteer-management/', () => {
    VOLUNTEER_MANAGEMENT_LINKS.forEach((link) => {
      expect(link.href).toMatch(/^\/volunteer-management\//)
    })
  })

  it('contains the for-nonprofits entry', () => {
    const item = VOLUNTEER_MANAGEMENT_LINKS.find((l) => l.href === '/volunteer-management/for-nonprofits')
    expect(item).toBeDefined()
    expect(item?.title).toBeTruthy()
    expect(item?.description).toBeTruthy()
  })

  it('contains the free entry', () => {
    const item = VOLUNTEER_MANAGEMENT_LINKS.find((l) => l.href === '/volunteer-management/free')
    expect(item).toBeDefined()
    expect(item?.title).toBeTruthy()
    expect(item?.description).toBeTruthy()
  })

  it('contains the scheduling entry', () => {
    const item = VOLUNTEER_MANAGEMENT_LINKS.find((l) => l.href === '/volunteer-management/scheduling')
    expect(item).toBeDefined()
    expect(item?.title).toBeTruthy()
    expect(item?.description).toBeTruthy()
  })

  it('contains the hour-tracking entry', () => {
    const item = VOLUNTEER_MANAGEMENT_LINKS.find((l) => l.href === '/volunteer-management/hour-tracking')
    expect(item).toBeDefined()
    expect(item?.title).toBeTruthy()
    expect(item?.description).toBeTruthy()
  })

  it('contains the best-software entry', () => {
    const item = VOLUNTEER_MANAGEMENT_LINKS.find((l) => l.href === '/volunteer-management/best-software')
    expect(item).toBeDefined()
    expect(item?.title).toBeTruthy()
    expect(item?.description).toBeTruthy()
  })

  it('has no duplicate hrefs', () => {
    const hrefs = VOLUNTEER_MANAGEMENT_LINKS.map((l) => l.href)
    const unique = new Set(hrefs)
    expect(unique.size).toBe(VOLUNTEER_MANAGEMENT_LINKS.length)
  })
})
