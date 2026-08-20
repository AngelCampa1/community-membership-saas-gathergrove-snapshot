import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY } from '../pricing';
// ---------------------------------------------------------------------------
// Alternatives pSEO data - /alternatives/[slug]
// "Best alternatives to X" reverse-intent pages
// ---------------------------------------------------------------------------

export interface AlternativesEntry {
  slug: string
  competitorName: string
  title: string
  metaDescription: string
  bluf: string
  intro: string
  whySwitchReasons: string[]
  alternatives: Array<{
    name: string
    bestFor: string
    pricing: string
  }>
  faq: Array<{ question: string; answer: string }>
  keywords: string[]
  compareSlug?: string
}

export const ALTERNATIVES: AlternativesEntry[] = [
  {
    slug: 'wild-apricot',
    competitorName: 'Wild Apricot',
    title: 'Best Wild Apricot Alternatives in 2026',
    metaDescription:
      `Looking for a Wild Apricot alternative? Compare the top club management platforms by price, features, and mobile app support. GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY}.`,
    bluf: `The best Wild Apricot alternatives in 2026 are GatherGrove (${SEED_MONTHLY_PRICE_COPY}, native mobile app), ClubExpress (feature-rich, association-focused), and MemberPlanet (paid plans available). Wild Apricot starts at $66/month and lacks a native mobile app.`,
    intro:
      'Wild Apricot is old club software. Clubs often switch when they want a lower price. They may also need a mobile app, email, and push alerts. This guide compares top alternatives by price and features.',
    whySwitchReasons: [
      'Wild Apricot starts at $66/month - roughly twice the price of alternatives for the same member count',
      'No native mobile app - Wild Apricot is mobile-responsive but lacks iOS and Android apps',
      'No push alerts',
      'Community chat features are not available on the platform',
      'The interface has not changed significantly in several years',
    ],
    alternatives: [
      {
        name: 'GatherGrove',
        bestFor: 'Clubs that want a mobile app, email, push alerts, and lower pricing',
        pricing: `From ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) - 30-day free trial`,
      },
      {
        name: 'ClubExpress',
        bestFor: 'Larger associations that need a built-in website and extensive customization',
        pricing: 'Quote-based, typically $30-100+/month',
      },
      {
        name: 'MemberPlanet',
        bestFor: 'Organizations focused on fundraising and chapter management',
        pricing: 'Paid plans available; pricing varies by feature tier',
      },
    ],
    faq: [
      {
        question: 'Why do clubs switch away from Wild Apricot?',
        answer:
          `Clubs often switch from Wild Apricot because it starts at $66/month. It also has no native mobile app or push alerts. Other tools start at ${SEED_MONTHLY_PRICE_COPY}.`,
      },
      {
        question: 'What is the cheapest Wild Apricot alternative?',
        answer:
          `GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members). It includes iOS and Android apps. It also has email, push alerts, Stripe dues, and QR check-in.`,
      },
      {
        question: 'Does any Wild Apricot alternative have a mobile app?',
        answer:
          'Yes. GatherGrove includes native iOS and Android apps on all paid plans. Members can RSVP to events, pay dues, view the member directory, and receive push notifications. Wild Apricot does not have a native mobile app - it provides a mobile-responsive website only.',
      },
    ],
    keywords: ['wild apricot alternative', 'wild apricot alternatives 2026', 'wild apricot replacement', 'club management alternative to wild apricot'],
    compareSlug: 'wild-apricot',
  },
  {
    slug: 'clubexpress',
    competitorName: 'ClubExpress',
    title: 'Best ClubExpress Alternatives in 2026',
    metaDescription:
      'Looking for a ClubExpress alternative? Compare the top club management platforms by ease of setup, pricing, and mobile features. GatherGrove is designed for quick setup without technical expertise.',
    bluf: `The best ClubExpress alternatives in 2026 are GatherGrove (quick setup, from ${SEED_MONTHLY_PRICE_COPY}), Wild Apricot (established platform, includes website builder), and MemberPlanet (paid plans available). ClubExpress can take hours to configure and does not include a native mobile app.`,
    intro:
      'ClubExpress is a feature-rich platform, but clubs frequently seek alternatives when setup complexity or the lack of a mobile app becomes a barrier. This guide compares the leading ClubExpress alternatives with accurate pricing and feature information.',
    whySwitchReasons: [
      'Setup requires hours of configuration - not suitable for volunteer-run clubs without technical staff',
      'No native mobile app for members',
      'Pricing is quote-based, making it hard to compare without a sales call',
      'Interface can feel dated compared to newer platforms',
      'No built-in push alerts',
    ],
    alternatives: [
      {
        name: 'GatherGrove',
        bestFor: 'Clubs that want quick setup and modern mobile features without technical expertise',
        pricing: `From ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) - 30-day free trial`,
      },
      {
        name: 'Wild Apricot',
        bestFor: 'Organizations that need a built-in website builder and have technical staff for setup',
        pricing: 'Starting at $66/month for 100 contacts',
      },
      {
        name: 'MemberPlanet',
        bestFor: 'Organizations focused on fundraising with optional paid plan upgrades',
        pricing: 'Paid plans available; pricing varies by feature tier',
      },
    ],
    faq: [
      {
        question: 'Why do organizations look for ClubExpress alternatives?',
        answer:
          'The two most common reasons are setup complexity and the lack of a native mobile app. ClubExpress is highly configurable but requires significant time investment to set up. Many volunteer-run clubs need software that works out of the box in minutes, not days.',
      },
      {
        question: 'What ClubExpress alternative is easiest to set up?',
        answer:
          'GatherGrove is designed for quick setup with a guided onboarding flow. No technical expertise is required. Import members from a CSV, connect Stripe for dues, and your club is ready. ClubExpress setup can take hours of configuration.',
      },
      {
        question: 'Is there a ClubExpress alternative with a mobile app?',
        answer:
          'Yes. GatherGrove includes native iOS and Android apps on all paid plans. ClubExpress does not offer a native mobile app.',
      },
    ],
    keywords: ['clubexpress alternative', 'clubexpress alternatives 2026', 'clubexpress replacement', 'alternative to clubexpress'],
    compareSlug: 'clubexpress',
  },
  {
    slug: 'memberplanet',
    competitorName: 'MemberPlanet',
    title: 'Best MemberPlanet Alternatives in 2026',
    metaDescription:
      'Looking for a MemberPlanet alternative? Compare the top club management platforms for community organizations. See features, pricing, and mobile app support.',
    bluf: `The best MemberPlanet alternatives in 2026 are GatherGrove (native mobile app, from ${SEED_MONTHLY_PRICE_COPY}), Wild Apricot (includes website builder), and ClubExpress (association-focused). MemberPlanet lacks community chat and a native mobile app.`,
    intro:
      'MemberPlanet works for some organizations but clubs that need a native mobile app, built-in community chat, or stronger dues automation often look elsewhere. This guide covers the top MemberPlanet alternatives with honest feature comparisons.',
    whySwitchReasons: [
      'No native mobile app for members',
      'Community chat is not available',
      'Dues automation is more basic than dedicated platforms',
      'Advanced analytics and engagement metrics require higher-tier plans',
      'The platform is not optimized for mobile-first member experiences',
    ],
    alternatives: [
      {
        name: 'GatherGrove',
        bestFor: 'Hobby clubs and community organizations that need a mobile-first experience with strong communication tools',
        pricing: `From ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) - 30-day free trial`,
      },
      {
        name: 'Wild Apricot',
        bestFor: 'Organizations that need a built-in website alongside membership management',
        pricing: 'Starting at $66/month for 100 contacts',
      },
      {
        name: 'ClubExpress',
        bestFor: 'Larger associations that need extensive customization and multiple payment processors',
        pricing: 'Quote-based, typically $30-100+/month',
      },
    ],
    faq: [
      {
        question: 'Does MemberPlanet have a free plan?',
        answer:
          `MemberPlanet has offered limited free access in the past, but most clubs find they need a paid plan for full dues, event, and communications management. GatherGrove offers a 30-day free trial with full access to all features before committing, starting at ${SEED_MONTHLY_PRICE_COPY} (Seed plan).`,
      },
      {
        question: 'What is the best MemberPlanet alternative for hobby clubs?',
        answer:
          'GatherGrove is purpose-built for hobby clubs and community organizations. It includes a native mobile app, email and push alerts, community chat, automated dues collection via Stripe, and event management with QR check-in - all features not available on MemberPlanet.',
      },
    ],
    keywords: ['memberplanet alternative', 'memberplanet alternatives 2026', 'memberplanet replacement', 'alternative to memberplanet'],
    compareSlug: 'memberplanet',
  },
  {
    slug: 'spreadsheets',
    competitorName: 'Spreadsheets',
    title: 'Move Your Club Off Spreadsheets - Best Alternatives',
    metaDescription:
      'Ready to replace spreadsheets for club management? Compare dedicated club management platforms that automate dues, events, and member tracking in one place.',
    bluf: `The best alternatives to spreadsheets for club management are GatherGrove (from ${SEED_MONTHLY_PRICE_COPY}), Wild Apricot ($66/month), and MemberPlanet (paid plans). Unlike spreadsheets, these platforms automate dues collection, event RSVPs, and member communications in one integrated system.`,
    intro:
      'Spreadsheets are free and familiar, but they require manual updates, create data silos, and offer no automation. When a club hits 20+ members or starts collecting dues regularly, a dedicated platform saves hours of admin work per week. This guide covers the top alternatives to spreadsheet-based club management.',
    whySwitchReasons: [
      'No automation - every member update, payment record, and RSVP requires manual entry',
      'Data silos - member list, payment records, and event attendance live in separate files',
      'No member self-service - members cannot update their own profiles, RSVP, or pay online',
      'No communications - separate email tool (Mailchimp, Gmail) required',
      'No mobile access - members cannot check schedules or directories on their phones',
    ],
    alternatives: [
      {
        name: 'GatherGrove',
        bestFor: 'Clubs of all types that want to automate dues, events, and communications in one platform',
        pricing: `From ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) - 30-day free trial`,
      },
      {
        name: 'Wild Apricot',
        bestFor: 'Organizations that also need a built-in website alongside membership management',
        pricing: 'Starting at $66/month for 100 contacts',
      },
      {
        name: 'MemberPlanet',
        bestFor: 'Organizations that need fundraising tools alongside membership management',
        pricing: 'Paid plans available; pricing varies by feature tier',
      },
    ],
    faq: [
      {
        question: 'When should a club switch from spreadsheets to dedicated software?',
        answer:
          `Consider switching when you have 20+ members, collect dues regularly, run monthly events, or spend more than 5 hours per month on administrative tasks. The time savings from automating dues reminders, event RSVPs, and member communications typically justify the ${SEED_MONTHLY_PRICE_COPY} Seed plan cost within the first month.`,
      },
      {
        question: 'How do I migrate my spreadsheet data to a club management platform?',
        answer:
          'Export your spreadsheet as a CSV file and import it into GatherGrove using the import wizard. Most clubs complete migration in under 30 minutes. The wizard maps spreadsheet columns to member fields and flags any issues before importing.',
      },
      {
        question: 'What features do clubs get by switching from spreadsheets to GatherGrove?',
        answer:
          'Switching from spreadsheets to GatherGrove adds automated dues collection via Stripe, event management with RSVP tracking and QR check-in, email and push updates, a native mobile app for members, a searchable member directory, and real-time analytics dashboards - none of which are possible with spreadsheets alone.',
      },
    ],
    keywords: ['replace spreadsheets club management', 'club management software vs spreadsheets', 'alternative to spreadsheets for clubs', 'club software instead of excel'],
    compareSlug: 'spreadsheets',
  },
  {
    slug: 'signupgenius',
    competitorName: 'SignUpGenius',
    title: 'Best SignUpGenius Alternatives in 2026',
    metaDescription:
      'Looking for a SignUpGenius alternative? Compare the top platforms for membership management, volunteer coordination, and event registration. GatherGrove includes member tracking, dues collection, and automated reminders that SignUpGenius lacks.',
    bluf: `The best SignUpGenius alternatives in 2026 are GatherGrove (full membership + volunteer management, from ${SEED_MONTHLY_PRICE_COPY}), Wild Apricot (association-focused, $66/month), and Memberful (paid membership communities). SignUpGenius is a sign-up sheet tool - not a membership management platform.`,
    intro:
      'SignUpGenius is a popular tool for creating quick online sign-up sheets, but clubs and nonprofits frequently outgrow it when they need real member management, volunteer hour tracking, dues collection, or automated reminders. This guide covers the best SignUpGenius alternatives for organizations that need more than a sign-up sheet.',
    whySwitchReasons: [
      'No member database - SignUpGenius tracks individual sign-ups but has no ongoing member records, profiles, or dues history',
      'No volunteer hour tracking - hours cannot be logged, aggregated, or exported for grant reporting',
      'Automated reminders require a paid plan - the free tier does not send shift reminders',
      'No dues collection - cannot collect recurring membership fees or process payments beyond event tickets',
      'No mobile app for members - mobile experience is web-only with no push notifications',
    ],
    alternatives: [
      {
        name: 'GatherGrove',
        bestFor: 'Clubs and nonprofits that need member management, volunteer hour tracking, dues collection, and automated reminders in one platform',
        pricing: `From ${SEED_MONTHLY_PRICE_COPY} (Seed, up to 100 members) or ${GROW_MONTHLY_PRICE_COPY} (Grow, up to 200 members). 30-day free trial.`,
      },
      {
        name: 'Wild Apricot',
        bestFor: 'Associations and nonprofits that need a website builder alongside membership and event management',
        pricing: 'Starting at $66/month for 100 contacts',
      },
      {
        name: 'Memberful',
        bestFor: 'Creators and online communities selling paid membership subscriptions',
        pricing: 'Free plan + 10% transaction fee; paid plans from $49/month',
      },
    ],
    faq: [
      {
        question: 'What is the best alternative to SignUpGenius for nonprofits?',
        answer:
          `GatherGrove is the best SignUpGenius alternative for nonprofits. Unlike SignUpGenius, GatherGrove includes a full member database, volunteer hour tracking with grant-ready export reports, automated shift reminders (included on all plans), and recurring dues collection via Stripe - starting at ${SEED_MONTHLY_PRICE_COPY} with a 30-day free trial.`,
      },
      {
        question: 'Why do organizations switch away from SignUpGenius?',
        answer:
          'Organizations typically switch from SignUpGenius when they need more than a sign-up sheet. Common reasons include: needing volunteer hour tracking for grant compliance, wanting a member directory with dues history, needing automated reminders without upgrading to a paid plan, and wanting a mobile app where members receive push notifications about upcoming shifts.',
      },
      {
        question: 'Does SignUpGenius track volunteer hours?',
        answer:
          'No. SignUpGenius does not track volunteer hours. It records who signed up for a shift but does not log time worked or generate hour reports. Organizations that need hour documentation for grant applications, IRS Form 990, or annual reports need a dedicated volunteer management platform like GatherGrove.',
      },
      {
        question: 'What does GatherGrove have that SignUpGenius does not?',
        answer:
          'GatherGrove adds a full member database with custom fields and dues history, automated recurring dues collection via Stripe, volunteer hour tracking with exportable reports, email and push updates, a native iOS and Android app for members, and real-time community chat - none of which are available in SignUpGenius.',
      },
      {
        question: 'Is there a free SignUpGenius alternative with hour tracking?',
        answer:
          `GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} and includes volunteer hour tracking, shift scheduling, and automated reminders - with a 30-day free trial to test the platform before committing.`,
      },
    ],
    keywords: ['signupgenius alternative', 'signupgenius alternatives 2026', 'signupgenius replacement', 'alternative to signupgenius', 'signupgenius for membership management'],
  },
  {
    slug: 'teamsnap',
    competitorName: 'TeamSnap',
    title: 'Best TeamSnap Alternatives in 2026',
    metaDescription:
      'Looking for a TeamSnap alternative? Compare the best club management platforms for sports leagues, youth teams, and community clubs. GatherGrove includes member management and dues collection that TeamSnap lacks.',
    bluf: `The best TeamSnap alternatives in 2026 are GatherGrove (full membership + dues management, from ${SEED_MONTHLY_PRICE_COPY}), Wild Apricot (association-focused, includes website), and SportsEngine (league management at scale). TeamSnap is built for team scheduling - not full club membership management.`,
    intro:
      'TeamSnap is the most recognized name in youth sports team management, built around game schedules, rosters, and parent communication. Clubs that need membership databases, dues automation, volunteer coordination, or multi-channel communications frequently look for alternatives. This guide covers the best TeamSnap alternatives for clubs that need more than team scheduling.',
    whySwitchReasons: [
      'No membership management - TeamSnap manages team rosters but has no dues collection, renewal tracking, or member database with custom fields',
      'No recurring dues automation - cannot set up automatic annual membership renewal payments',
      'Higher cost at scale - TeamSnap\'s paid plans start around $9.99/month for small teams, but club-level plans cost significantly more',
      'No community chat. Communications are limited to team messaging and email',
      'No volunteer coordination tools - shift scheduling, hour tracking, and role assignments are not available',
    ],
    alternatives: [
      {
        name: 'GatherGrove',
        bestFor: 'Sports clubs and leagues that need member management, automated dues collection, and volunteer coordination alongside event scheduling',
        pricing: `From ${SEED_MONTHLY_PRICE_COPY} (Seed, up to 100 members) or ${GROW_MONTHLY_PRICE_COPY} (Grow, up to 200 members). 30-day free trial.`,
      },
      {
        name: 'Wild Apricot',
        bestFor: 'Sports associations and leagues that also need a built-in website and event registration',
        pricing: 'Starting at $66/month for 100 contacts',
      },
      {
        name: 'SportsEngine',
        bestFor: 'Large youth sports associations managing multiple teams and club-level registrations at scale',
        pricing: 'Quote-based, typically higher cost for associations',
      },
    ],
    faq: [
      {
        question: 'What is the best alternative to TeamSnap for club membership management?',
        answer:
          'GatherGrove is the best TeamSnap alternative for clubs that need membership management alongside scheduling. It adds a full member database with custom fields, automated dues collection via Stripe, volunteer coordination tools, community chat, and push alerts - all features not available in TeamSnap.',
      },
      {
        question: 'Does TeamSnap collect membership dues?',
        answer:
          'TeamSnap does not offer automated recurring membership dues collection. It can process one-time registration fees, but ongoing annual or monthly membership renewals with automated reminders and retry logic require a dedicated membership management platform like GatherGrove.',
      },
      {
        question: 'Is GatherGrove cheaper than TeamSnap?',
        answer:
          `For clubs managing the full member lifecycle (not just team scheduling), GatherGrove is more cost-effective. GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (up to 100 members) and includes member management, dues collection, volunteer tools, and multi-channel communications. TeamSnap\'s club-level plans for managing multiple teams and member databases cost significantly more.`,
      },
      {
        question: 'What does TeamSnap not do that GatherGrove does?',
        answer:
          'GatherGrove adds automated recurring dues collection with Stripe, a full member database with renewal tracking and custom fields, volunteer shift scheduling and hour tracking, community chat, push alerts, and a member directory - none of which are available in TeamSnap\'s core platform.',
      },
    ],
    keywords: ['teamsnap alternative', 'teamsnap alternatives 2026', 'teamsnap replacement', 'alternative to teamsnap', 'teamsnap for clubs'],
    compareSlug: 'teamsnap',
  },
]

export function getAlternativeBySlug(slug: string): AlternativesEntry | undefined {
  return ALTERNATIVES.find((a) => a.slug === slug)
}

export function getAllAlternativeSlugs(): string[] {
  return ALTERNATIVES.map((a) => a.slug)
}
