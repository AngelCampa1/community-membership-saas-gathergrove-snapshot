export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.gathergrove.club'

let _displayDomain: string
try {
  _displayDomain = new URL(SITE_URL).host
} catch {
  throw new Error(
    `Invalid NEXT_PUBLIC_SITE_URL: "${SITE_URL}". Must be a fully-qualified URL (e.g., https://www.gathergrove.club).`
  )
}
export const SITE_DISPLAY_DOMAIN = _displayDomain

export const SITE_NAME = 'GatherGrove'
export const SITE_DESCRIPTION = 'Club management software for hobby communities'
export const SITE_TAGLINE = 'Club Management Software for Hobby Communities'
export const SITE_AUTHOR = 'Angel Campa, Founder'
export const SITE_AUTHOR_NAME = 'Angel Campa'
export const SITE_AUTHOR_URL = '/about'
export const SITE_AUTHOR_LINKEDIN = 'https://www.linkedin.com/in/angelcamaudit/'
export const TWITTER_HANDLE = '@gathergrove'
export const TWITTER_CREATOR = '@gathergrove'
export const TWITTER_PROFILE_URL = 'https://twitter.com/gathergrove'
export const LINKEDIN_URL = 'https://linkedin.com/company/gathergrove'
export const LOGO_PATH = '/logos/horizontal-logo.png'
export const OG_IMAGE_PATH = '/og-image.png'
export const SUPPORT_EMAIL = 'support@gathergrove.club'
export const PROGRAMMATIC_PAGES_LAST_UPDATED = '2026-03-16'
// Per-content-type last-modified dates for sitemap differentiation
export const GLOSSARY_LAST_UPDATED = '2026-03-25'
export const HOW_TO_START_LAST_UPDATED = '2026-03-21'
export const CLUB_TYPES_LAST_UPDATED = '2026-03-16'
export const COMPARISONS_LAST_UPDATED = '2026-03-16'
export const ALTERNATIVES_LAST_UPDATED = '2026-03-25'
export const TEMPLATES_LAST_UPDATED = '2026-03-25'
export const VOLUNTEER_MGMT_LAST_UPDATED = '2026-03-21'
export const BLOG_LAST_UPDATED = '2026-03-31'
export const CURRENT_YEAR = new Date().getFullYear()
