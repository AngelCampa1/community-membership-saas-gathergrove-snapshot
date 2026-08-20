import {
  buildOrganizationSchema,
  buildPersonSchema,
  buildSoftwareApplicationSchema,
  buildWebsiteSchema,
  buildFAQPageSchema,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildEventSchema,
  buildHowToSchema,
  buildItemListSchema,
  buildDefinedTermSchema,
  buildClubTypeHowToSchema,
  DEFAULT_FAQ_QUESTIONS,
} from '../schema'
import { SITE_URL } from '../site-config'

describe('schema builders', () => {
  describe('buildOrganizationSchema', () => {
    const schema = buildOrganizationSchema()

    it('returns valid Organization schema', () => {
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('GatherGrove')
    })

    it('uses SITE_URL for url and logo', () => {
      expect(schema.url).toBe(SITE_URL)
      expect(schema.logo).toContain(SITE_URL)
    })

    it('includes social profiles in sameAs', () => {
      expect(schema.sameAs.length).toBeGreaterThan(0)
      schema.sameAs.forEach((url) => expect(url).toMatch(/^https:\/\//))
    })

    it('includes contactPoint', () => {
      expect(schema.contactPoint['@type']).toBe('ContactPoint')
      expect(schema.contactPoint.email).toMatch(/@/)
    })
  })

  describe('buildPersonSchema', () => {
    const schema = buildPersonSchema()

    it('returns valid Person schema', () => {
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Person')
      expect(schema.name).toBe('Angel Campa')
    })

    it('includes job title and worksFor', () => {
      expect(schema.jobTitle).toBe('Founder')
      expect(schema.worksFor['@type']).toBe('Organization')
      expect(schema.worksFor.name).toBe('GatherGrove')
    })

    it('includes sameAs with social profiles', () => {
      expect(schema.sameAs.length).toBeGreaterThan(0)
      schema.sameAs.forEach((url) => expect(url).toMatch(/^https:\/\//))
    })

    it('includes URL pointing to about page', () => {
      expect(schema.url).toContain('/about')
    })
  })

  describe('buildSoftwareApplicationSchema', () => {
    const schema = buildSoftwareApplicationSchema()

    it('returns valid SoftwareApplication schema', () => {
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('SoftwareApplication')
      expect(schema.applicationCategory).toBe('BusinessApplication')
    })

    it('includes all pricing tiers', () => {
      expect(schema.offers).toHaveLength(3)
      expect(schema.offers[0].name).toBe('Seed Plan')
      expect(schema.offers[0].price).toBe('9')
      expect(schema.offers[1].name).toBe('Grow Plan')
      expect(schema.offers[1].price).toBe('29')
      expect(schema.offers[2].name).toBe('Expand Plan')
      expect(schema.offers[2].price).toBe('200')
    })

    it('includes feature list', () => {
      expect(schema.featureList.length).toBeGreaterThan(0)
    })
  })

  describe('buildWebsiteSchema', () => {
    const schema = buildWebsiteSchema()

    it('returns valid WebSite schema', () => {
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('WebSite')
      expect(schema.name).toBe('GatherGrove')
      expect(schema.url).toBe(SITE_URL)
    })

    it('includes SearchAction potentialAction', () => {
      expect(schema.potentialAction).toBeDefined()
      expect(schema.potentialAction['@type']).toBe('SearchAction')
      expect(schema.potentialAction.target).toContain('/resources?q=')
    })
  })

  describe('buildFAQPageSchema', () => {
    it('maps questions to FAQ schema', () => {
      const questions = [
        { question: 'Q1?', answer: 'A1' },
        { question: 'Q2?', answer: 'A2' },
      ]
      const schema = buildFAQPageSchema(questions)
      expect(schema['@type']).toBe('FAQPage')
      expect(schema.mainEntity).toHaveLength(2)
      expect(schema.mainEntity[0].name).toBe('Q1?')
      expect(schema.mainEntity[0].acceptedAnswer.text).toBe('A1')
    })

    it('handles empty questions array', () => {
      const schema = buildFAQPageSchema([])
      expect(schema.mainEntity).toHaveLength(0)
    })
  })

  describe('buildArticleSchema', () => {
    const schema = buildArticleSchema({
      title: 'Test Article',
      description: 'A test',
      slug: 'resources/test-article',
      datePublished: '2024-01-01',
      dateModified: '2025-06-01',
      keywords: ['test', 'article'],
    })

    it('returns valid Article schema', () => {
      expect(schema['@type']).toBe('Article')
      expect(schema.headline).toBe('Test Article')
      expect(schema.url).toBe(`${SITE_URL}/resources/test-article`)
    })

    it('includes dates', () => {
      expect(schema.datePublished).toBe('2024-01-01')
      expect(schema.dateModified).toBe('2025-06-01')
    })

    it('includes author and publisher', () => {
      expect(schema.author['@type']).toBe('Person')
      expect(schema.publisher['@type']).toBe('Organization')
    })

    it('includes keywords when provided', () => {
      expect(schema.keywords).toEqual(['test', 'article'])
    })

    it('omits keywords when not provided', () => {
      const noKeywords = buildArticleSchema({
        title: 'T',
        description: 'D',
        slug: 's',
        datePublished: '2024-01-01',
        dateModified: '2024-01-01',
      })
      expect(noKeywords.keywords).toBeUndefined()
    })
  })

  describe('buildBreadcrumbSchema', () => {
    it('builds correct breadcrumb with positions', () => {
      const schema = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Resources', url: '/resources' },
        { name: 'Guide', url: '/resources/guide' },
      ])
      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(3)
      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[2].position).toBe(3)
    })

    it('prepends SITE_URL to relative paths', () => {
      const schema = buildBreadcrumbSchema([{ name: 'Home', url: '/' }])
      expect(schema.itemListElement[0].item).toBe(`${SITE_URL}/`)
    })

    it('preserves absolute URLs', () => {
      const schema = buildBreadcrumbSchema([{ name: 'External', url: 'https://example.com' }])
      expect(schema.itemListElement[0].item).toBe('https://example.com')
    })
  })

  describe('buildServiceSchema', () => {
    const schema = buildServiceSchema()

    it('returns valid Service schema', () => {
      expect(schema['@type']).toBe('Service')
      expect(schema.serviceType).toBe('Membership Management Software')
    })

    it('includes offer catalog with all paid plans', () => {
      expect(schema.hasOfferCatalog.itemListElement).toHaveLength(3)
      expect(schema.hasOfferCatalog.itemListElement[0].name).toBe('Seed Plan')
      expect(schema.hasOfferCatalog.itemListElement[1].name).toBe('Grow Plan')
      expect(schema.hasOfferCatalog.itemListElement[2].name).toBe('Expand Plan')
    })

    it('has correct termsOfService URL', () => {
      expect(schema.termsOfService).toBe(`${SITE_URL}/terms-of-service`)
    })
  })

  describe('buildEventSchema', () => {
    const schema = buildEventSchema()

    it('returns valid Event schema', () => {
      expect(schema['@type']).toBe('Event')
      expect(schema.eventAttendanceMode).toContain('schema.org')
    })
  })

  describe('buildArticleSchema with speakable', () => {
    it('includes speakable when speakableCssSelectors provided', () => {
      const schema = buildArticleSchema({
        title: 'Test',
        description: 'Desc',
        slug: 'resources/test',
        datePublished: '2024-01-01',
        dateModified: '2024-06-01',
        speakableCssSelectors: ['#key-takeaways', 'h1'],
      })
      expect(schema.speakable).toBeDefined()
      expect(schema.speakable!['@type']).toBe('SpeakableSpecification')
      expect(schema.speakable!.cssSelector).toEqual(['#key-takeaways', 'h1'])
    })

    it('omits speakable when not provided', () => {
      const schema = buildArticleSchema({
        title: 'Test',
        description: 'Desc',
        slug: 'resources/test',
        datePublished: '2024-01-01',
        dateModified: '2024-06-01',
      })
      expect(schema.speakable).toBeUndefined()
    })
  })

  describe('buildItemListSchema', () => {
    it('returns valid ItemList schema', () => {
      const schema = buildItemListSchema({
        name: 'Club Types',
        description: 'All club types supported by GatherGrove',
        items: [
          { name: 'Book Clubs', url: '/for/book-clubs', description: 'Manage book clubs' },
          { name: 'Running Clubs', url: '/for/running-clubs', description: 'Manage running clubs' },
        ],
      })
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('ItemList')
      expect(schema.name).toBe('Club Types')
      expect(schema.numberOfItems).toBe(2)
    })

    it('creates ListItem elements with correct positions', () => {
      const schema = buildItemListSchema({
        name: 'Test',
        description: 'Test list',
        items: [
          { name: 'First', url: '/first', description: 'First item' },
          { name: 'Second', url: '/second', description: 'Second item' },
          { name: 'Third', url: '/third', description: 'Third item' },
        ],
      })
      expect(schema.itemListElement).toHaveLength(3)
      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[1].position).toBe(2)
      expect(schema.itemListElement[2].position).toBe(3)
    })

    it('prepends SITE_URL to relative URLs', () => {
      const schema = buildItemListSchema({
        name: 'Test',
        description: 'Test',
        items: [{ name: 'Item', url: '/for/test', description: 'Test item' }],
      })
      expect(schema.itemListElement[0].url).toBe(`${SITE_URL}/for/test`)
    })

    it('preserves absolute URLs', () => {
      const schema = buildItemListSchema({
        name: 'Test',
        description: 'Test',
        items: [{ name: 'External', url: 'https://example.com', description: 'External' }],
      })
      expect(schema.itemListElement[0].url).toBe('https://example.com')
    })

    it('handles empty items array', () => {
      const schema = buildItemListSchema({
        name: 'Empty',
        description: 'No items',
        items: [],
      })
      expect(schema.itemListElement).toHaveLength(0)
      expect(schema.numberOfItems).toBe(0)
    })
  })

  describe('buildDefinedTermSchema', () => {
    it('returns DefinedTerm schema with required fields', () => {
      const schema = buildDefinedTermSchema({
        term: 'Bylaws',
        definition: 'The rules governing an organization.',
        slug: 'bylaws',
        category: 'governance',
      })
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('DefinedTerm')
      expect(schema.name).toBe('Bylaws')
      expect(schema.description).toBe('The rules governing an organization.')
      expect(schema.url).toBe(`${SITE_URL}/glossary/bylaws`)
      expect(schema.inDefinedTermSet).toEqual({
        '@type': 'DefinedTermSet',
        name: 'Club Management Glossary',
        url: `${SITE_URL}/glossary`,
      })
    })

    it('includes category in termCode', () => {
      const schema = buildDefinedTermSchema({
        term: 'Dues',
        definition: 'Fees paid by members.',
        slug: 'dues',
        category: 'financial',
      })
      expect(schema.termCode).toBe('financial')
    })
  })

  describe('buildHowToSchema', () => {
    it('returns HowTo schema with steps', () => {
      const schema = buildHowToSchema({
        name: 'How to Start a Running Club',
        description: 'A step-by-step guide.',
        slug: 'how-to-start/running-club',
        steps: [
          { title: 'Choose a name', description: 'Pick something memorable.' },
          { title: 'Recruit members', description: 'Spread the word.' },
        ],
        estimatedCost: '$50-$200',
      })
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('HowTo')
      expect(schema.name).toBe('How to Start a Running Club')
      expect(schema.url).toBe(`${SITE_URL}/how-to-start/running-club`)
      expect(schema.step).toHaveLength(2)
      expect(schema.step[0]['@type']).toBe('HowToStep')
      expect(schema.step[0].position).toBe(1)
      expect(schema.step[0].name).toBe('Choose a name')
      expect(schema.step[0].text).toBe('Pick something memorable.')
    })

    it('includes estimatedCost when provided', () => {
      const schema = buildHowToSchema({
        name: 'How to Start a Running Club',
        description: 'Guide.',
        slug: 'how-to-start/running-club',
        steps: [{ title: 'Step 1', description: 'Do it.' }],
        estimatedCost: '$50-$200',
      })
      expect(schema.estimatedCost).toEqual({
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '$50-$200',
      })
    })

    it('omits estimatedCost when not provided', () => {
      const schema = buildHowToSchema({
        name: 'How to Start a Book Club',
        description: 'Guide.',
        slug: 'book-club',
        steps: [{ title: 'Step 1', description: 'Do it.' }],
      })
      expect(schema.estimatedCost).toBeUndefined()
    })
  })

  describe('DEFAULT_FAQ_QUESTIONS', () => {
    it('has 5 questions', () => {
      expect(DEFAULT_FAQ_QUESTIONS).toHaveLength(5)
    })

    it('each has question and answer strings', () => {
      DEFAULT_FAQ_QUESTIONS.forEach((q) => {
        expect(q.question).toBeTruthy()
        expect(q.answer).toBeTruthy()
      })
    })

    it('pricing question answer mentions current paid plans', () => {
      const pricingQ = DEFAULT_FAQ_QUESTIONS.find(q =>
        q.question.toLowerCase().includes('cost') || q.question.toLowerCase().includes('price')
      )
      expect(pricingQ).toBeDefined()
      expect(pricingQ!.answer).toContain('$29')
      expect(pricingQ!.answer).toContain('Grow')
      expect(pricingQ!.answer).toContain('$200')
      expect(pricingQ!.answer).toContain('Expand')
    })
  })

  describe('buildClubTypeHowToSchema', () => {
    const schema = buildClubTypeHowToSchema({
      clubTypeName: 'Running Clubs',
      slug: 'running-clubs',
      features: ['Event scheduling', 'Route sharing', 'Participation tracking'],
    })

    it('returns HowTo schema type', () => {
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('HowTo')
    })

    it('includes club type name in name and description', () => {
      expect(schema.name).toContain('Running Clubs')
      expect(schema.description).toContain('running clubs')
    })

    it('generates steps derived from features', () => {
      expect(schema.step.length).toBeGreaterThan(3)
      schema.step.forEach((s) => {
        expect(s['@type']).toBe('HowToStep')
        expect(s.name).toBeTruthy()
        expect(s.text).toBeTruthy()
        expect(typeof s.position).toBe('number')
      })
    })

    it('includes the club type page URL', () => {
      expect(schema.url).toContain(`${SITE_URL}/for/running-clubs`)
    })

    it('steps include core onboarding steps', () => {
      const names = schema.step.map((s) => s.name.toLowerCase())
      expect(names.some((n) => n.includes('account') || n.includes('create'))).toBe(true)
      expect(names.some((n) => n.includes('member') || n.includes('import'))).toBe(true)
    })
  })
})
