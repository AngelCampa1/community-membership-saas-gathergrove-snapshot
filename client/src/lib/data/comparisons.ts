import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY } from '../pricing';
// ---------------------------------------------------------------------------
// Comparison pSEO data - /compare/[slug]
// ---------------------------------------------------------------------------

export interface ComparisonEntry {
  slug: string
  competitorName: string
  title: string
  description: string
  metaDescription: string
  keywords: string[]
  intro: string
  features: Array<{
    feature: string
    gathergrove: string
    competitor: string
  }>
  faq: Array<{ question: string; answer: string }>
  verdict: string
}

export const COMPARISONS: ComparisonEntry[] = [
  {
    slug: 'wild-apricot',
    competitorName: 'Wild Apricot',
    title: 'GatherGrove vs Wild Apricot',
    description: 'Feature-by-feature comparison of GatherGrove and Wild Apricot for club management.',
    metaDescription:
      'Compare GatherGrove vs Wild Apricot for club management. See pricing, features, mobile app, and communication differences side by side.',
    keywords: ['wild apricot alternative', 'wild apricot vs gathergrove', 'club management software comparison'],
    intro:
      'Wild Apricot is one of the most established club management platforms, serving organizations since 2006. GatherGrove is a modern alternative built specifically for hobby clubs and small community organizations. Here is how they compare on features, pricing, and ease of use.',
    features: [
      { feature: 'Starting Price', gathergrove: `${SEED_MONTHLY_PRICE_COPY} (Seed)`, competitor: '$66/month (Personal plan)' },
      { feature: 'Member Limit (entry plan)', gathergrove: '100 members', competitor: '100 contacts' },
      { feature: 'Native Mobile App', gathergrove: 'Yes (iOS & Android)', competitor: 'No (mobile-responsive website only)' },
      { feature: 'Email Communications', gathergrove: 'Built-in', competitor: 'Included' },
      { feature: 'Community Chat', gathergrove: 'Built-in real-time chat', competitor: 'Not available' },
      { feature: 'Event Management', gathergrove: 'RSVP, waitlists, QR check-in', competitor: 'RSVP, waitlists, registration' },
      { feature: 'Payment Processing', gathergrove: 'Stripe (no platform fees)', competitor: 'Built-in (varies by plan)' },
      { feature: 'Email Marketing', gathergrove: 'Templates, scheduling, automation', competitor: 'Templates, scheduling' },
      { feature: 'Website Builder', gathergrove: 'Not included (focused on app)', competitor: 'Included' },
      { feature: 'Free Trial', gathergrove: '30 days', competitor: '30 days' },
      { feature: 'Annual Discount', gathergrove: '17% (save ~2 months)', competitor: 'Varies by plan' },
    ],
    faq: [
      {
        question: 'Is GatherGrove cheaper than Wild Apricot?',
        answer:
          `Yes. GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) and ${GROW_MONTHLY_PRICE_COPY} (Grow plan, up to 200 members). Wild Apricot\'s Personal plan starts at $66/month for 100 contacts. GatherGrove costs a fraction of Wild Apricot for comparable member counts.`,
      },
      {
        question: 'Does Wild Apricot have a mobile app?',
        answer:
          'Wild Apricot does not offer a native mobile app. It provides a mobile-responsive website. GatherGrove includes native iOS and Android apps where members can view events, pay dues, and chat.',
      },
      {
        question: 'Can I switch from Wild Apricot to GatherGrove?',
        answer:
          'Yes. You can export your member data from Wild Apricot as a CSV file and import it into GatherGrove. The GatherGrove support team can help with migration.',
      },
    ],
    verdict:
      'GatherGrove is a strong alternative for clubs that want a native mobile app, email, chat, and a lower price point. Wild Apricot may be better for organizations that need a built-in website builder or have been on the platform for years with complex integrations.',
  },
  {
    slug: 'clubexpress',
    competitorName: 'ClubExpress',
    title: 'GatherGrove vs ClubExpress',
    description: 'Feature-by-feature comparison of GatherGrove and ClubExpress for club management.',
    metaDescription:
      'Compare GatherGrove vs ClubExpress for managing your club. See pricing, features, and setup differences.',
    keywords: ['clubexpress alternative', 'clubexpress vs gathergrove', 'club management comparison'],
    intro:
      'ClubExpress is a feature-rich platform that caters to larger organizations and associations. GatherGrove is designed for simplicity and speed, targeting hobby clubs and small community groups. Here is how they compare.',
    features: [
      { feature: 'Starting Price', gathergrove: `${SEED_MONTHLY_PRICE_COPY} (Seed)`, competitor: 'Quote-based (typically $30-100+/month)' },
      { feature: 'Setup Complexity', gathergrove: '5-minute guided setup', competitor: 'Can require hours of configuration' },
      { feature: 'Native Mobile App', gathergrove: 'Yes (iOS & Android)', competitor: 'No' },
      { feature: 'Email Communications', gathergrove: 'Built-in', competitor: 'Included' },
      { feature: 'Community Chat', gathergrove: 'Built-in', competitor: 'Discussion forums' },
      { feature: 'Event QR Check-in', gathergrove: 'Yes', competitor: 'Limited' },
      { feature: 'Website Builder', gathergrove: 'Not included', competitor: 'Included (extensive)' },
      { feature: 'Payment Processing', gathergrove: 'Stripe', competitor: 'Multiple processors' },
      { feature: 'Analytics', gathergrove: 'Advanced engagement metrics', competitor: 'Standard reporting' },
      { feature: 'Free Trial', gathergrove: '30 days', competitor: 'Demo available' },
    ],
    faq: [
      {
        question: 'Is GatherGrove easier to set up than ClubExpress?',
        answer:
          'Yes. GatherGrove is designed for 5-minute setup with a guided onboarding process. ClubExpress is highly configurable but that often means hours of initial configuration, especially for custom modules.',
      },
      {
        question: 'Does ClubExpress have a mobile app?',
        answer:
          'ClubExpress does not offer a native mobile app. GatherGrove includes iOS and Android apps with push notifications, event RSVP, dues payment, and community chat.',
      },
    ],
    verdict:
      'GatherGrove is ideal for smaller clubs (10-500 members) that want quick setup and modern mobile features. ClubExpress may be better for larger associations that need extensive customization, a built-in website, and support for multiple payment processors.',
  },
  {
    slug: 'memberplanet',
    competitorName: 'MemberPlanet',
    title: 'GatherGrove vs MemberPlanet',
    description: 'Feature-by-feature comparison of GatherGrove and MemberPlanet for club management.',
    metaDescription:
      'Compare GatherGrove vs MemberPlanet for club and membership management. See pricing, features, and capabilities.',
    keywords: ['memberplanet alternative', 'memberplanet vs gathergrove', 'membership management comparison'],
    intro:
      'MemberPlanet provides membership management with a focus on forms, fundraising, and chapter management. GatherGrove focuses on the core needs of hobby clubs: members, dues, events, and communications. Here is how they compare.',
    features: [
      { feature: 'Starting Price', gathergrove: `${SEED_MONTHLY_PRICE_COPY} (Seed)`, competitor: 'Paid plans available (varies)' },
      { feature: 'Native Mobile App', gathergrove: 'Yes (iOS & Android)', competitor: 'Limited mobile features' },
      { feature: 'Dues Automation', gathergrove: 'Stripe with automatic reminders', competitor: 'Basic payment collection' },
      { feature: 'Email Communications', gathergrove: 'Built-in', competitor: 'Included' },
      { feature: 'Community Chat', gathergrove: 'Built-in real-time chat', competitor: 'Not available' },
      { feature: 'Event Management', gathergrove: 'RSVP, waitlists, QR check-in', competitor: 'Basic event management' },
      { feature: 'Analytics', gathergrove: 'Advanced engagement metrics', competitor: 'Basic reporting' },
      { feature: 'Fundraising', gathergrove: 'Via event ticketing', competitor: 'Dedicated fundraising tools' },
      { feature: 'Free Trial', gathergrove: '30 days (full features)', competitor: 'Limited access available' },
    ],
    faq: [
      {
        question: 'Is MemberPlanet free?',
        answer:
          `MemberPlanet has offered limited free access in the past, but full functionality requires a paid plan. GatherGrove offers a 30-day free trial with full access to all features across all plans, starting at ${SEED_MONTHLY_PRICE_COPY} (Seed plan).`,
      },
      {
        question: 'Which is better for hobby clubs?',
        answer:
          'GatherGrove is built for hobby clubs with community chat, a native mobile app, and email tools. MemberPlanet is broader in scope with fundraising features that many hobby clubs do not need.',
      },
    ],
    verdict:
      'GatherGrove is the better choice for hobby clubs and community organizations that need a modern, mobile-first experience with strong communication features. MemberPlanet may be a better fit for organizations focused on fundraising and chapter management.',
  },
  {
    slug: 'spreadsheets',
    competitorName: 'Spreadsheets',
    title: 'GatherGrove vs Spreadsheets (Google Sheets / Excel)',
    description: 'Why clubs should upgrade from spreadsheets to dedicated club management software.',
    metaDescription:
      'Compare GatherGrove vs spreadsheets for club management. See how dedicated software automates dues, events, and communications in one platform.',
    keywords: ['club management spreadsheet', 'replace spreadsheets for club', 'spreadsheet vs club software'],
    intro:
      'Many clubs start with Google Sheets or Excel to track members and events. While spreadsheets are free and familiar, they create data silos, require manual updates, and offer no automation. Here is how a dedicated platform compares.',
    features: [
      { feature: 'Cost', gathergrove: `From ${SEED_MONTHLY_PRICE_COPY} (Seed)`, competitor: 'Free' },
      { feature: 'Member Database', gathergrove: 'Searchable with custom fields, roles, privacy', competitor: 'Rows in a spreadsheet' },
      { feature: 'Dues Collection', gathergrove: 'Automated via Stripe with reminders', competitor: 'Manual tracking, separate payment tool' },
      { feature: 'Event RSVPs', gathergrove: 'Built-in with waitlists and QR check-in', competitor: 'Manual email replies or separate tool' },
      { feature: 'Communications', gathergrove: 'Email, push, and chat', competitor: 'Separate email tool (Mailchimp, etc.)' },
      { feature: 'Mobile App', gathergrove: 'Native iOS & Android', competitor: 'None' },
      { feature: 'Admin Automation', gathergrove: 'Automated reminders, payments, RSVPs', competitor: 'All manual effort' },
      { feature: 'Dues Collection', gathergrove: 'Automated with retry and reminders', competitor: 'Manual follow-up emails' },
      { feature: 'Data Integrity', gathergrove: 'Single source of truth, audit trail', competitor: 'Multiple versions, no history' },
      { feature: 'Member Self-Service', gathergrove: 'Profile updates, payments, RSVPs', competitor: 'Admin does everything' },
    ],
    faq: [
      {
        question: 'When should a club switch from spreadsheets to software?',
        answer:
          `Consider switching when you have 20+ members, collect dues regularly, run monthly events, or spend more than 5 hours per month on administrative tasks. The time savings alone typically justify the ${SEED_MONTHLY_PRICE_COPY} Seed plan cost within the first month.`,
      },
      {
        question: 'Can I import my spreadsheet data into GatherGrove?',
        answer:
          'Yes. Export your spreadsheet as a CSV file and import it directly into GatherGrove. The import wizard helps map columns to fields. Most clubs complete the migration in under 30 minutes.',
      },
      {
        question: `Is ${SEED_MONTHLY_PRICE_COPY} worth it compared to free spreadsheets?`,
        answer:
          'For most clubs, yes. Automating dues collection, event RSVPs, and member communications eliminates hours of manual work each month. Member self-service (payments, profile updates, RSVPs) further reduces admin burden. A 30-day free trial lets you verify the value before paying.',
      },
    ],
    verdict:
      'Spreadsheets work for very small groups (under 20 members) with minimal dues and events. For any club that collects dues, runs regular events, or has 20+ members, dedicated software like GatherGrove automates the repetitive tasks that consume volunteer admin time.',
  },
  {
    slug: 'teamup',
    competitorName: 'TeamUp',
    title: 'GatherGrove vs TeamUp for Club Management',
    description: 'Feature-by-feature comparison of GatherGrove and TeamUp for managing sports clubs and fitness organizations.',
    metaDescription:
      'Compare GatherGrove vs TeamUp for club and sports team management. See pricing, member management, event tools, and communication features side by side.',
    keywords: ['teamup alternative', 'teamup vs gathergrove', 'sports club management software comparison'],
    intro:
      'TeamUp is a scheduling and class-booking platform focused on fitness studios, gyms, and sports academies. GatherGrove is built for membership clubs and community organizations that need member management, dues automation, and multi-channel communications alongside event coordination. Here is how they compare.',
    features: [
      { feature: 'Starting Price', gathergrove: `${SEED_MONTHLY_PRICE_COPY} (Seed)`, competitor: '$99/month (up to 100 members)' },
      { feature: 'Primary Focus', gathergrove: 'Membership clubs & community orgs', competitor: 'Fitness studios & class scheduling' },
      { feature: 'Native Mobile App', gathergrove: 'Yes (iOS & Android)', competitor: 'Yes (iOS & Android)' },
      { feature: 'Member Database', gathergrove: 'Full CRM with custom fields', competitor: 'Customer profiles (fitness-focused)' },
      { feature: 'Dues Automation', gathergrove: 'Stripe recurring with reminders', competitor: 'Stripe recurring billing' },
      { feature: 'Email Communications', gathergrove: 'Built-in', competitor: 'Included' },
      { feature: 'Community Chat', gathergrove: 'Built-in real-time chat', competitor: 'Not available' },
      { feature: 'Event QR Check-in', gathergrove: 'Yes', competitor: 'Yes (class check-in)' },
      { feature: 'Volunteer Coordination', gathergrove: 'Built-in scheduling', competitor: 'Not available' },
      { feature: 'Free Trial', gathergrove: '30 days (full features)', competitor: '30 days' },
    ],
    faq: [
      {
        question: 'Is GatherGrove or TeamUp better for a sports club?',
        answer:
          'It depends on the club type. TeamUp excels for fitness studios and gyms with class-based scheduling. GatherGrove is better for membership clubs - running clubs, youth sports leagues, swim teams - that need member database management, dues automation, volunteer coordination, and community chat alongside event scheduling.',
      },
      {
        question: 'Is GatherGrove cheaper than TeamUp?',
        answer:
          `Yes. GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members). TeamUp starts at $99/month for 100 members. For a typical club with 50-200 members, GatherGrove costs significantly less while including features TeamUp does not offer, such as community chat.`,
      },
      {
        question: 'Does TeamUp support volunteer coordination?',
        answer:
          'TeamUp does not include volunteer coordination tools. GatherGrove provides volunteer shift scheduling, role assignments, hour tracking, and automated reminders - making it a better choice for community organizations that rely on volunteer labor.',
      },
    ],
    verdict:
      'TeamUp is the better choice for fitness studios, yoga studios, and gyms focused on class-based booking. GatherGrove is the better choice for membership clubs, leagues, and community organizations that need a full member management platform with dues automation, volunteer tools, and multi-channel communications.',
  },
  {
    slug: 'eventbrite',
    competitorName: 'Eventbrite',
    title: 'GatherGrove vs Eventbrite for Club Events',
    description: 'Why clubs should use dedicated club management software instead of Eventbrite for recurring member events.',
    metaDescription:
      'Compare GatherGrove vs Eventbrite for managing club events and memberships. See why clubs need more than an event ticketing platform.',
    keywords: ['eventbrite alternative for clubs', 'eventbrite vs gathergrove', 'club event management software'],
    intro:
      'Eventbrite is the most recognized event ticketing platform, built for public one-time events. GatherGrove is built for recurring member events, dues-paying communities, and clubs that need to manage the same group of people across dozens of events per year. Here is how they differ.',
    features: [
      { feature: 'Starting Price', gathergrove: `From ${SEED_MONTHLY_PRICE_COPY} (Seed)`, competitor: 'Free + 3.7% service fee per ticket' },
      { feature: 'Member Database', gathergrove: 'Full CRM with renewal tracking', competitor: 'Attendee list per event only' },
      { feature: 'Recurring Members', gathergrove: 'Automated annual/monthly dues', competitor: 'No membership management' },
      { feature: 'Private Member Events', gathergrove: 'Yes (member-only access)', competitor: 'Limited (password protection)' },
      { feature: 'Native Mobile App', gathergrove: 'Yes (member-facing app)', competitor: 'Yes (organizer & attendee)' },
      { feature: 'Email Communications', gathergrove: 'Built-in', competitor: 'Included' },
      { feature: 'Community Chat', gathergrove: 'Built-in real-time chat', competitor: 'Not available' },
      { feature: 'Waitlist Management', gathergrove: 'Automatic promotion', competitor: 'Manual waitlist' },
      { feature: 'Volunteer Coordination', gathergrove: 'Built-in scheduling', competitor: 'Not available' },
      { feature: 'Analytics', gathergrove: 'Member engagement over time', competitor: 'Per-event ticket sales only' },
    ],
    faq: [
      {
        question: 'Can Eventbrite manage club memberships?',
        answer:
          'Eventbrite is designed for individual event ticketing, not ongoing membership management. It does not support recurring dues collection, member databases with custom fields, or tracking member participation over time. Clubs that use Eventbrite still need separate tools for member management and communications.',
      },
      {
        question: 'Is GatherGrove cheaper than Eventbrite for regular club events?',
        answer:
          `For clubs running frequent events, yes. Eventbrite charges a percentage fee per ticket (3.7% service fee plus payment processing), which adds up quickly for recurring events. GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan) with no platform fees on payments - only standard Stripe processing rates apply, often resulting in lower total cost for clubs with regular member events.`,
      },
      {
        question: 'What does GatherGrove offer that Eventbrite does not?',
        answer:
          'GatherGrove provides membership management, automated dues collection, member directory, volunteer coordination, community chat, and multi-year member engagement tracking. Eventbrite is built for public one-time events. GatherGrove is built for recurring member communities.',
      },
    ],
    verdict:
      'Eventbrite is the right tool for public one-time events where you want broad visibility on the Eventbrite marketplace. GatherGrove is the right tool for clubs and organizations with recurring members who need dues automation, member tracking, and private member events alongside event management - replacing the combination of Eventbrite, Mailchimp, and spreadsheets with one platform.',
  },
  {
    slug: 'teamsnap',
    competitorName: 'TeamSnap',
    title: 'GatherGrove vs TeamSnap',
    description: 'Feature-by-feature comparison of GatherGrove and TeamSnap for sports clubs and community organizations.',
    metaDescription:
      'Compare GatherGrove vs TeamSnap for sports club and team management. See membership management, dues collection, volunteer tools, and pricing side by side.',
    keywords: ['teamsnap alternative', 'teamsnap vs gathergrove', 'sports club management software comparison', 'teamsnap alternatives'],
    intro:
      'TeamSnap is the leading team scheduling app for youth sports, built around game calendars, roster management, and parent communication. GatherGrove is a full club membership platform covering member management, dues automation, volunteer coordination, and multi-channel communications. Here is how they compare for clubs that need more than team scheduling.',
    features: [
      { feature: 'Starting Price', gathergrove: `${SEED_MONTHLY_PRICE_COPY} (Seed, up to 100 members)`, competitor: 'From $9.99/month per team; club plans cost more' },
      { feature: 'Free Trial', gathergrove: '30-day free trial', competitor: 'Limited free plan for 1 team' },
      { feature: 'Primary Focus', gathergrove: 'Membership clubs & community orgs', competitor: 'Sports team scheduling & rosters' },
      { feature: 'Native Mobile App', gathergrove: 'Yes (iOS & Android)', competitor: 'Yes (iOS & Android)' },
      { feature: 'Membership Dues Collection', gathergrove: 'Automated recurring via Stripe', competitor: 'One-time registration fees only' },
      { feature: 'Annual Renewal Automation', gathergrove: 'Yes - with reminders & retry', competitor: 'Not available' },
      { feature: 'Member Database', gathergrove: 'Full CRM with custom fields & renewal tracking', competitor: 'Roster profiles (team-focused)' },
      { feature: 'Volunteer Coordination', gathergrove: 'Shift scheduling, hour tracking, reminders', competitor: 'Not available' },
      { feature: 'Community Chat', gathergrove: 'Built-in real-time chat', competitor: 'Team messaging only' },
      { feature: 'Email Communications', gathergrove: 'Built-in', competitor: 'Team messaging only' },
      { feature: 'Event QR Check-in', gathergrove: 'Yes', competitor: 'Limited' },
      { feature: 'Analytics', gathergrove: 'Member engagement, financial, event metrics', competitor: 'Game and attendance stats' },
      { feature: 'Free Trial', gathergrove: '30 days full features', competitor: '21 days' },
    ],
    faq: [
      {
        question: 'Is GatherGrove or TeamSnap better for a sports club?',
        answer:
          'It depends on what you need. TeamSnap works well for game schedules, availability, and parent updates. GatherGrove is better for sports clubs that also collect annual dues, keep a member database, coordinate volunteers, and send club email.',
      },
      {
        question: 'Does TeamSnap collect membership dues?',
        answer:
          'TeamSnap does not offer automated recurring membership dues. It supports one-time registration fee collection, but annual or monthly membership renewals with automated payment reminders, retry logic, and renewal tracking require a dedicated platform. GatherGrove automates recurring dues collection via Stripe, sends reminders before dues are due, and tracks renewal status in the member database.',
      },
      {
        question: 'Is GatherGrove cheaper than TeamSnap for clubs?',
        answer:
          `For clubs managing members across multiple teams or handling annual dues, GatherGrove is typically more cost-effective. GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (up to 100 members) and includes dues collection, volunteer tools, and member email. TeamSnap\'s per-team pricing adds up quickly for clubs with multiple teams, and club-level plans with membership management are priced higher.`,
      },
      {
        question: 'Can I switch from TeamSnap to GatherGrove?',
        answer:
          'Yes. Export your roster from TeamSnap as a CSV and import it into GatherGrove using the member import wizard. Most clubs complete the migration in under an hour. The GatherGrove support team can assist with the transition.',
      },
    ],
    verdict:
      'TeamSnap is the right tool for teams focused on game scheduling, availability tracking, and parent communication. GatherGrove is the right tool for clubs that need annual dues, a long-term member database, volunteer coordination, and member email. Many youth sports clubs find GatherGrove handles the full club lifecycle while TeamSnap handles game day.',
  },
]

export function getComparisonBySlug(slug: string): ComparisonEntry | undefined {
  return COMPARISONS.find((c) => c.slug === slug)
}

export function getAllComparisonSlugs(): string[] {
  return COMPARISONS.map((c) => c.slug)
}
