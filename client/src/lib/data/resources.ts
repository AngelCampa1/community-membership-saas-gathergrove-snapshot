export interface ResourceEntry {
  slug: string
  title: string
  /** SEO-optimized title for SERP display (uses number + bracket formula for CTR) */
  seoTitle: string
  description: string
  category: string
  readTime: string
  datePublished: string
  dateModified: string
  keywords: string[]
  featured?: boolean
  relatedSlugs?: string[]
}

export const RESOURCES: ResourceEntry[] = [
  {
    slug: 'complete-guide-club-management',
    title: 'The Complete Guide to Club Management',
    seoTitle: 'Complete Club Management Guide [2026]: 8 Chapters for New Admins',
    description:
      'Our flagship 8,000+ word comprehensive guide covering everything from member management to financial planning. The ultimate resource for hobby club administrators.',
    category: 'Ultimate Guide',
    readTime: '30 min read',
    datePublished: '2024-01-01',
    dateModified: '2025-12-01',
    keywords: [
      'club management guide',
      'hobby club administration',
      'membership management',
    ],
    featured: true,
    relatedSlugs: [
      'member-retention-strategies',
      'event-planning-mastery',
      'financial-management-for-small-clubs',
    ],
  },
  {
    slug: 'member-retention-strategies',
    title: 'Member Retention Strategies That Actually Work',
    seoTitle: '7 Member Retention Strategies That Actually Work [Data-Backed]',
    description: 'Evidence-based approaches to keep members engaged and reduce churn in hobby clubs.',
    category: 'Best Practices',
    readTime: '8 min read',
    datePublished: '2024-03-01',
    dateModified: '2025-10-01',
    keywords: ['member retention', 'reduce churn', 'member engagement'],
    relatedSlugs: [
      'community-building-strategies',
      'new-member-onboarding-best-practices',
      'digital-communication-tools',
    ],
  },
  {
    slug: 'modern-dues-collection-best-practices',
    title: 'Modern Dues Collection Best Practices',
    seoTitle: 'Modern Dues Collection: 5 Best Practices [With Templates]',
    description: 'Proven strategies to improve payment collection rates and streamline financial management.',
    category: 'Financial Management',
    readTime: '12 min read',
    datePublished: '2024-03-15',
    dateModified: '2025-10-15',
    keywords: ['dues collection', 'payment processing', 'club finances'],
    relatedSlugs: [
      'financial-management-for-small-clubs',
      'technology-integration-best-practices',
      'template-library',
    ],
  },
  {
    slug: 'event-planning-mastery',
    title: 'Event Planning Mastery for Club Administrators',
    seoTitle: 'Event Planning Mastery: 10-Step Checklist for Club Admins [Free Template]',
    description: 'Complete guide to planning, promoting, and executing successful club events.',
    category: 'Event Planning',
    readTime: '15 min read',
    datePublished: '2024-04-01',
    dateModified: '2025-10-01',
    keywords: ['event planning', 'club events', 'event management'],
    relatedSlugs: [
      'volunteer-management-and-leadership-development',
      'community-building-strategies',
      'digital-communication-tools',
    ],
  },
  {
    slug: 'digital-communication-tools',
    title: 'Digital Communication Tools for Clubs',
    seoTitle: '6 Digital Communication Tools Every Club Needs [2026 Guide]',
    description: 'Use email, mobile apps, and chat to keep members connected.',
    category: 'Communication',
    readTime: '14 min read',
    datePublished: '2024-04-15',
    dateModified: '2025-09-15',
    keywords: ['club communication', 'email marketing', 'member messaging'],
    relatedSlugs: [
      'member-retention-strategies',
      'community-building-strategies',
      'technology-integration-best-practices',
    ],
  },
  {
    slug: 'leadership-governance-frameworks',
    title: 'Leadership and Governance Frameworks',
    seoTitle: 'Club Leadership & Governance: 5 Frameworks That Work [With Examples]',
    description: 'Build sustainable leadership structures and governance processes for growing clubs.',
    category: 'Leadership & Governance',
    readTime: '16 min read',
    datePublished: '2024-05-01',
    dateModified: '2025-09-01',
    keywords: ['club leadership', 'governance', 'board management'],
    relatedSlugs: [
      'volunteer-management-and-leadership-development',
      'annual-planning-and-strategic-goal-setting',
      'crisis-management-and-emergency-planning',
    ],
  },
  {
    slug: 'new-member-onboarding-best-practices',
    title: 'New Member Onboarding Best Practices',
    seoTitle: 'New Member Onboarding: 8 Best Practices to Boost Retention [Checklist]',
    description: 'Transform new member integration with systematic onboarding that increases retention.',
    category: 'Member Onboarding',
    readTime: '13 min read',
    datePublished: '2024-05-15',
    dateModified: '2025-09-15',
    keywords: [
      'member onboarding',
      'new member welcome',
      'onboarding process',
    ],
    relatedSlugs: [
      'member-retention-strategies',
      'community-building-strategies',
      'template-library',
    ],
  },
  {
    slug: 'community-building-strategies',
    title: 'Community Building Strategies',
    seoTitle: '9 Community Building Strategies for Thriving Clubs [Proven Methods]',
    description: 'Create vibrant, connected communities that members are passionate about supporting.',
    category: 'Community Building',
    readTime: '17 min read',
    datePublished: '2024-06-01',
    dateModified: '2025-08-01',
    keywords: [
      'community building',
      'member engagement',
      'social connection',
    ],
    relatedSlugs: [
      'member-retention-strategies',
      'new-member-onboarding-best-practices',
      'event-planning-mastery',
    ],
  },
  {
    slug: 'financial-management-for-small-clubs',
    title: 'Financial Management for Small Clubs',
    seoTitle: 'Small Club Financial Management: Complete Guide [Budget Templates]',
    description: 'Comprehensive financial planning, budgeting, reporting, and cash flow management strategies.',
    category: 'Financial Management',
    readTime: '18 min read',
    datePublished: '2024-06-15',
    dateModified: '2025-08-15',
    keywords: ['club finances', 'budgeting', 'financial planning'],
    relatedSlugs: [
      'modern-dues-collection-best-practices',
      'annual-planning-and-strategic-goal-setting',
      'technology-integration-best-practices',
      'fundraising-ideas-for-clubs-and-nonprofits',
      'how-nonprofits-make-money',
    ],
  },
  {
    slug: 'crisis-management-and-emergency-planning',
    title: 'Crisis Management and Emergency Planning',
    seoTitle: 'Club Crisis Management: 6-Step Emergency Plan [Free Template]',
    description: 'Prepare for and respond to emergencies, conflicts, and unexpected challenges effectively.',
    category: 'Crisis Management',
    readTime: '16 min read',
    datePublished: '2024-07-01',
    dateModified: '2025-07-01',
    keywords: ['crisis management', 'emergency planning', 'risk management'],
    relatedSlugs: [
      'leadership-governance-frameworks',
      'community-building-strategies',
      'volunteer-management-and-leadership-development',
    ],
  },
  {
    slug: 'technology-integration-best-practices',
    title: 'Technology Integration Best Practices',
    seoTitle: 'Club Technology Integration: 7 Best Practices [2026 Stack Guide]',
    description: 'Leverage modern tools and platforms to streamline operations and enhance member experience.',
    category: 'Technology',
    readTime: '15 min read',
    datePublished: '2024-07-15',
    dateModified: '2025-07-15',
    keywords: ['club technology', 'digital tools', 'software integration'],
    relatedSlugs: [
      'modern-dues-collection-best-practices',
      'digital-communication-tools',
      'financial-management-for-small-clubs',
    ],
  },
  {
    slug: 'volunteer-management-and-leadership-development',
    title: 'Volunteer Management and Leadership Development',
    seoTitle: 'Volunteer Management: How to Recruit & Retain 2x More Volunteers [Guide]',
    description: 'Recruit, train, and retain volunteers while developing future club leaders.',
    category: 'Leadership Development',
    readTime: '17 min read',
    datePublished: '2024-08-01',
    dateModified: '2025-06-01',
    keywords: [
      'volunteer management',
      'leadership development',
      'volunteer recruitment',
    ],
    relatedSlugs: [
      'leadership-governance-frameworks',
      'event-planning-mastery',
      'community-building-strategies',
    ],
  },
  {
    slug: 'annual-planning-and-strategic-goal-setting',
    title: 'Annual Planning and Strategic Goal Setting',
    seoTitle: 'Club Annual Planning: 5-Step Strategic Goal Setting Framework [2026]',
    description: 'Create comprehensive annual plans that align club activities with long-term objectives.',
    category: 'Strategic Planning',
    readTime: '20 min read',
    datePublished: '2024-08-15',
    dateModified: '2025-06-15',
    keywords: ['annual planning', 'strategic goals', 'club objectives'],
    relatedSlugs: [
      'leadership-governance-frameworks',
      'financial-management-for-small-clubs',
      'volunteer-management-and-leadership-development',
    ],
  },
  {
    slug: 'template-library',
    title: 'Club Management Template Library',
    seoTitle: '20+ Free Club Management Templates [Download Instantly]',
    description:
      '20+ professional templates including welcome emails, event invitations, payment reminders, and planning checklists.',
    category: 'Templates',
    readTime: 'Download',
    datePublished: '2024-09-01',
    dateModified: '2025-12-01',
    keywords: ['club templates', 'email templates', 'planning checklists'],
    relatedSlugs: [
      'complete-guide-club-management',
      'new-member-onboarding-best-practices',
      'modern-dues-collection-best-practices',
    ],
  },
  {
    slug: 'volunteer-hour-tracking-guide',
    title: 'How to Track Volunteer Hours (And Why It Matters)',
    seoTitle: 'Volunteer Hour Tracking: Complete Guide [+ Free Templates & Grant Reports]',
    description: 'How to track volunteer hours accurately for grant reporting, IRS compliance, and board presentations - from manual methods to automated software.',
    category: 'Volunteer Management',
    readTime: '12 min read',
    datePublished: '2026-03-21',
    dateModified: '2026-03-21',
    keywords: [
      'volunteer hour tracking',
      'volunteer hours for grant reporting',
      'how to track volunteer hours',
      'volunteer hour tracking software',
      'volunteer hours nonprofit',
    ],
    relatedSlugs: [
      'volunteer-management-and-leadership-development',
      'nonprofit-membership-management-guide',
      'financial-management-for-small-clubs',
    ],
  },
  {
    slug: 'how-nonprofits-make-money',
    title: 'How Nonprofits Make Money: Revenue Streams Explained',
    seoTitle: 'How Nonprofits Make Money [2026]: 8 Revenue Streams Explained',
    description: 'A clear breakdown of how nonprofit organizations generate revenue - from membership dues and donations to grants, events, and earned income strategies.',
    category: 'Financial Management',
    readTime: '12 min read',
    datePublished: '2025-10-01',
    dateModified: '2026-02-01',
    keywords: [
      'how nonprofits make money',
      'nonprofit revenue streams',
      'nonprofit funding sources',
      'nonprofit income',
      'nonprofit business model',
    ],
    relatedSlugs: [
      'fundraising-ideas-for-clubs-and-nonprofits',
      'financial-management-for-small-clubs',
      'modern-dues-collection-best-practices',
    ],
  },
  {
    slug: 'fundraising-ideas-for-clubs-and-nonprofits',
    title: '25 Fundraising Ideas for Clubs and Nonprofits',
    seoTitle: '25 Fundraising Ideas for Clubs & Nonprofits [2026]: Low-Cost to High-Return',
    description: 'A practical guide to raising money for your club or nonprofit - from low-effort classics to digital campaigns that reach supporters anywhere.',
    category: 'Financial Management',
    readTime: '15 min read',
    datePublished: '2025-09-01',
    dateModified: '2026-03-01',
    keywords: [
      'fundraising ideas for clubs',
      'nonprofit fundraising ideas',
      'club fundraiser',
      'raise money for nonprofit',
      'fundraising strategies',
    ],
    relatedSlugs: [
      'financial-management-for-small-clubs',
      'modern-dues-collection-best-practices',
      'event-planning-mastery',
    ],
  },
  {
    slug: 'nonprofit-membership-management-guide',
    title: 'Nonprofit Membership Management: A Complete Guide',
    seoTitle: 'Nonprofit Membership Management Guide [2026]: From Dues to Retention',
    description: 'How to manage nonprofit members effectively - collecting dues, tracking renewals, communicating with members, and choosing the right membership software.',
    category: 'Membership Management',
    readTime: '14 min read',
    datePublished: '2026-03-21',
    dateModified: '2026-03-21',
    keywords: [
      'nonprofit membership management',
      'membership software for nonprofits',
      'nonprofit member management',
      'how to manage nonprofit members',
      'nonprofit dues collection',
    ],
    relatedSlugs: [
      'volunteer-hour-tracking-guide',
      'volunteer-management-and-leadership-development',
      'modern-dues-collection-best-practices',
    ],
  },
]

export function getResourceBySlug(
  slug: string
): ResourceEntry | undefined {
  return RESOURCES.find((r) => r.slug === slug)
}

export function getAllResourceSlugs(): string[] {
  return RESOURCES.map((r) => r.slug)
}

export function getFeaturedResource(): ResourceEntry | undefined {
  return RESOURCES.find((r) => r.featured)
}
