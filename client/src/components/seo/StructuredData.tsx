import { JsonLd } from './JsonLd'
import {
  buildOrganizationSchema,
  buildWebsiteSchema,
} from '@/lib/schema'

// Global schemas - Organization + WebSite only (rendered on every page).
// Page-specific schemas (FAQ, Article, SoftwareApplication, Service, Person)
// are now rendered contextually by their respective pages.
export const schemas = {
  organization: buildOrganizationSchema(),
  website: buildWebsiteSchema(),
}

export function StructuredData() {
  return (
    <>
      <JsonLd schema={schemas.organization} />
      <JsonLd schema={schemas.website} />
    </>
  )
}
