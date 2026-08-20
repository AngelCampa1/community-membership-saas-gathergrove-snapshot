import { GROW_MONTHLY_PRICE_COPY } from '../pricing';
export interface UseCaseEntry {
  slug: string
  title: string
  description: string
  problem: string
  solution: string
  longDescription: string
  features: string[]
  benefits: string[]
  keywords: string[]
  relatedClubTypes: string[]
  faqs?: Array<{ question: string; answer: string }>
}

export const USE_CASES: UseCaseEntry[] = [
  {
    slug: 'membership-management',
    title: 'Membership Management',
    description: 'Organize your member database with custom fields, roles, segments, and automated workflows.',
    problem: 'Member records spread across spreadsheets, inboxes, and old rosters make every renewal, lookup, and handoff harder than it needs to be.',
    solution: 'GatherGrove keeps profiles, roles, custom fields, renewals, and digital cards in one member database that volunteer admins can update quickly.',
    longDescription:
      'Stop managing members in spreadsheets. GatherGrove gives you a complete member database with custom fields, role assignments, bulk operations, advanced segmentation, and import/export capabilities. Track member status, manage renewals, and create digital membership cards - all from one dashboard.',
    features: ['Custom member fields', 'Role-based access', 'Bulk operations', 'Advanced segmentation', 'Import/export', 'Digital membership cards'],
    benefits: ['Save 10+ hours per week on admin tasks', 'Reduce data entry errors by 90%', 'Instant member lookup and filtering', 'Automated renewal reminders'],
    keywords: ['membership management software', 'member database', 'membership tracking', 'member management system'],
    relatedClubTypes: ['social-clubs', 'professional-associations', 'nonprofit-organizations'],
    faqs: [
      {
        question: 'What is the best membership management software for small clubs?',
        answer: `GatherGrove is purpose-built for clubs with 10-500 members. It provides a full member database with custom fields, automated renewal reminders, role-based access, and digital membership cards - at ${GROW_MONTHLY_PRICE_COPY} for up to 200 members.`,
      },
      {
        question: 'How do clubs manage member renewals automatically?',
        answer: 'GatherGrove automates membership renewals through Stripe recurring billing. Members receive email reminders 30, 14, and 3 days before expiration. Admins see real-time renewal status on a dashboard and can send manual reminders or process offline payments as needed.',
      },
      {
        question: 'Can I import existing member data into GatherGrove?',
        answer: 'Yes. Export your existing member data as a CSV from your spreadsheet or previous platform. GatherGrove\'s import wizard maps columns to fields and flags any issues before importing. Most clubs complete migration in under 30 minutes.',
      },
    ],
  },
  {
    slug: 'event-planning',
    title: 'Event Planning & Management',
    description: 'Plan, promote, and execute events with RSVP tracking, ticketing, QR check-in, and analytics.',
    problem: 'Event signups often live in one form, payments in another tool, and check-in on a paper list, so admins lose time stitching the day together.',
    solution: 'GatherGrove connects event pages, RSVPs, payments, QR check-in, waitlists, reminders, and reports to the same member records.',
    longDescription:
      'GatherGrove keeps event pages, RSVPs, ticket sales, waitlists, QR check-in, feedback, and attendance reports tied to the same member records. Multi-session support also helps clubs manage recurring meetings without rebuilding the event every time.',
    features: ['RSVP tracking', 'Ticketing via Stripe', 'QR code check-in', 'Waitlist management', 'Multi-session events', 'Feedback collection'],
    benefits: ['95% reduction in no-shows with reminders', 'Instant check-in with QR codes', 'Real-time attendance tracking', 'Post-event analytics'],
    keywords: ['event planning software', 'event management tool', 'RSVP tracking', 'event ticketing platform'],
    relatedClubTypes: ['social-clubs', 'youth-sports-leagues', 'professional-associations'],
    faqs: [
      {
        question: 'How does GatherGrove handle event RSVPs and waitlists?',
        answer: 'GatherGrove creates event pages with RSVP forms, capacity limits, and automatic waitlisting. When a spot opens, the next person on the waitlist receives an automatic invitation. Admins see real-time RSVP counts and can export the attendee list at any time.',
      },
      {
        question: 'Can clubs sell tickets to events through GatherGrove?',
        answer: 'Yes. GatherGrove integrates with Stripe for paid event ticketing. Set a ticket price, limit capacity, and members pay at registration. Attendees receive digital tickets and a QR code for check-in. The platform supports both free and paid events, and member-only pricing.',
      },
      {
        question: 'What is the easiest way to check in attendees at a club event?',
        answer: 'GatherGrove generates a unique QR code for each registered attendee. At the event, an admin scans the code using the GatherGrove mobile app to record instant check-in. Attendance data is saved automatically and available in post-event reports.',
      },
    ],
  },
  {
    slug: 'dues-collection',
    title: 'Automated Dues Collection',
    description: 'Automate membership fee collection with Stripe, recurring payments, reminders, and financial reporting.',
    problem: 'Manual dues collection turns treasurers into payment chasers and leaves leaders guessing who is paid, late, or about to renew.',
    solution: 'GatherGrove automates dues with Stripe, recurring billing, reminders, receipts, payment status, and financial reports in one workflow.',
    longDescription:
      'Never chase payments again. GatherGrove integrates directly with Stripe to automate dues collection, manage recurring subscriptions, send payment reminders, and generate financial reports. Support multiple payment tiers, offer discounts, and track who has paid - all automatically.',
    features: ['Stripe integration', 'Recurring payments', 'Payment reminders', 'Multiple tiers', 'Financial reporting', 'Invoice generation'],
    benefits: ['Collect 40% faster than manual methods', 'Reduce late payments by 60%', 'Automatic receipt generation', 'Real-time financial dashboard'],
    keywords: ['dues collection software', 'membership payment system', 'automated payment collection', 'club billing software'],
    relatedClubTypes: ['running-clubs', 'swimming-clubs', 'professional-associations'],
    faqs: [
      {
        question: 'How do clubs automate dues collection online?',
        answer: 'GatherGrove integrates with Stripe to set up recurring dues billing. Members enter payment details once and are charged automatically at renewal. The platform sends reminder emails before each charge and notifies admins of failed payments for follow-up.',
      },
      {
        question: 'What payment methods can clubs accept through GatherGrove?',
        answer: 'Through Stripe, GatherGrove accepts all major credit and debit cards, Apple Pay, Google Pay, and ACH bank transfers. Members choose their preferred payment method when setting up dues. The platform is PCI-compliant and never stores card details directly.',
      },
    ],
  },
  {
    slug: 'volunteer-coordination',
    title: 'Volunteer Coordination',
    description: 'Recruit, schedule, and manage volunteers with role assignments, hour tracking, and recognition programs.',
    problem: 'Volunteer work falls through the cracks when signups, shift reminders, role assignments, and hour reports are handled by hand.',
    solution: 'GatherGrove helps teams publish shifts, match people to roles, track hours, send reminders, and recognize reliable volunteers.',
    longDescription:
      'Volunteer programs get harder to run when shifts, roles, reminders, and hours live in separate lists. GatherGrove helps teams recruit volunteers, assign roles, schedule shifts, track hours, send reminders, and generate volunteer hour reports.',
    features: ['Volunteer scheduling', 'Role assignment', 'Hour tracking', 'Skill matching', 'Automated reminders', 'Recognition programs'],
    benefits: ['Fill 80% more volunteer slots', 'Reduce no-shows with reminders', 'Fair workload distribution', 'Volunteer appreciation tracking'],
    keywords: ['volunteer management software', 'volunteer coordination tool', 'volunteer scheduling app', 'volunteer tracking system'],
    relatedClubTypes: ['nonprofit-organizations', 'youth-sports-leagues', 'garden-clubs'],
    faqs: [
      {
        question: 'How does GatherGrove help organizations manage volunteers?',
        answer: 'GatherGrove lets organizations create volunteer opportunities with shifts, role requirements, and capacity limits. Volunteers sign up online, receive automated reminders, and their hours are tracked automatically. Admins can view volunteer history per person and generate hour reports for grant applications.',
      },
      {
        question: 'Can GatherGrove match volunteers to shifts based on their skills?',
        answer: 'Yes. GatherGrove stores custom fields per member including skills, certifications, and availability. When creating volunteer opportunities, admins can filter eligible volunteers by field values and send targeted invitations to the right people.',
      },
    ],
  },
  {
    slug: 'member-communication',
    title: 'Member Communication',
    description: 'Reach members with email, in-app messages, templates, scheduling, and A/B testing.',
    problem: 'Important updates get missed when clubs rely on one crowded inbox, scattered group chats, or messages sent to the wrong list.',
    solution: 'GatherGrove lets admins segment members, schedule email, reuse templates, and measure what people open.',
    longDescription:
      'When updates go to the wrong list, members miss them. GatherGrove lets admins send email and in-app messages by segment, reuse templates, schedule reminders, and track opens.',
    features: ['Email templates', 'In-app messages', 'A/B testing', 'Scheduling', 'Audience segmentation', 'Open rate tracking'],
    benefits: ['3x higher engagement than generic emails', 'Reach members on their preferred channel', 'Save hours with templates', 'Data-driven optimization'],
    keywords: ['member communication software', 'club email tool', 'membership messaging', 'organization communication platform'],
    relatedClubTypes: ['book-clubs', 'alumni-associations', 'social-clubs'],
  },
  {
    slug: 'attendance-tracking',
    title: 'Attendance Tracking',
    description: 'Track event attendance, member participation rates, and engagement patterns with automated check-in.',
    problem: 'Clubs cannot improve attendance or retention when they only know who registered, not who actually showed up over time.',
    solution: 'GatherGrove records QR check-ins, participation rates, member activity scores, and attendance reports tied to each profile.',
    longDescription:
      'Knowing who shows up, and how often, helps clubs spot retention problems early. GatherGrove provides QR code check-in, automatic attendance records, participation rates, and engagement analytics. Identify active members, notice declining engagement, and plan events from real attendance data.',
    features: ['QR code check-in', 'Automatic recording', 'Participation rates', 'Engagement trends', 'Member activity scores', 'Attendance reports'],
    benefits: ['Instant check-in (under 3 seconds)', 'Identify at-risk members early', 'Optimize event scheduling', 'Accurate participation records'],
    keywords: ['attendance tracking software', 'event check-in app', 'member attendance system', 'participation tracking tool'],
    relatedClubTypes: ['swimming-clubs', 'running-clubs', 'chess-clubs'],
  },
  {
    slug: 'member-directory',
    title: 'Member Directory',
    description: 'Provide members with a searchable, privacy-respecting directory to connect with each other.',
    problem: 'Members struggle to connect when the directory is outdated, hard to search, or shared as a spreadsheet with too much private information.',
    solution: 'GatherGrove gives members a searchable directory with profile controls, privacy settings, contact sharing, and admin visibility rules.',
    longDescription:
      'Help members find and connect with each other through a searchable member directory with privacy controls. GatherGrove lets members choose what to share, search by interest or location, and connect directly. Administrators can manage visibility rules, require profile completion, and export directory data when needed.',
    features: ['Searchable directory', 'Privacy controls', 'Profile customization', 'Interest-based search', 'Contact sharing', 'Admin controls'],
    benefits: ['Stronger member connections', 'Privacy-first design', 'Reduced admin directory requests', 'Always up-to-date information'],
    keywords: ['member directory software', 'membership directory app', 'club directory tool', 'organization member lookup'],
    relatedClubTypes: ['alumni-associations', 'professional-associations', 'social-clubs'],
  },
  {
    slug: 'club-analytics',
    title: 'Club Analytics & Reporting',
    description: 'Track membership growth, engagement metrics, financial health, and event performance with dashboards.',
    problem: 'Boards ask for growth, revenue, and engagement reports, but the data is usually scattered across payment exports and event spreadsheets.',
    solution: 'GatherGrove turns member, event, payment, and communication activity into dashboards and board-ready reports.',
    longDescription:
      'Make decisions from the numbers your club already creates. GatherGrove reports on membership growth, engagement, financial health, event performance, and communication results. Track event ROI, compare performance over time, and generate board reports in seconds.',
    features: ['Growth dashboards', 'Engagement metrics', 'Financial reports', 'Event analytics', 'Communication tracking', 'Board reports'],
    benefits: ['Instant board-ready reports', 'Identify growth opportunities', 'Track ROI on every event', 'Data-driven programming decisions'],
    keywords: ['club analytics software', 'membership analytics', 'organization reporting tool', 'club performance dashboard'],
    relatedClubTypes: ['nonprofit-organizations', 'professional-associations', 'youth-sports-leagues'],
  },
  {
    slug: 'mobile-app',
    title: 'Mobile App Access',
    description: 'Give members iOS and Android access to events, dues, directories, cards, chat, and notifications.',
    problem: 'Members miss updates when every task requires a desktop login or a buried email link.',
    solution: 'GatherGrove gives members a mobile app for events, dues, directories, digital cards, chat, and push notifications.',
    longDescription:
      'Give members a simpler way to participate from their phones. GatherGrove mobile app access helps members RSVP to events, pay dues, view the directory, open digital membership cards, receive push notifications, and join community conversations without waiting until they are back at a computer.',
    features: ['iOS and Android access', 'Event RSVP', 'Dues payment', 'Member directory', 'Digital membership cards', 'Push notifications'],
    benefits: ['Higher member participation on phones', 'Fewer missed announcements', 'Less admin follow-up', 'Better access for members away from a desktop'],
    keywords: ['club mobile app', 'membership mobile app', 'member app for clubs', 'nonprofit mobile app'],
    relatedClubTypes: ['running-clubs', 'book-clubs', 'youth-sports-leagues'],
  },
  {
    slug: 'multi-location-management',
    title: 'Multi-Location Management',
    description: 'Manage chapters, branches, venues, and member transfers without duplicating records.',
    problem: 'Multi-location clubs often keep separate rosters, separate event calendars, and separate handoff notes for the same organization.',
    solution: 'GatherGrove supports multiple venues and chapters with shared member data, location-based events, and member transfers.',
    longDescription:
      'Run chapters, venues, and branches without rebuilding the same system in every location. GatherGrove helps admins manage location-based membership, transfer members between groups, coordinate events by venue, and keep reporting consistent across the whole organization.',
    features: ['Location-based membership', 'Chapter organization', 'Member transfers', 'Venue-specific events', 'Shared reporting', 'Role-based administration'],
    benefits: ['Cleaner chapter handoffs', 'Less duplicate member data', 'Consistent reporting across locations', 'Simpler growth into new venues'],
    keywords: ['multi location club management', 'chapter management software', 'multi chapter membership software', 'club venue management'],
    relatedClubTypes: ['book-clubs', 'professional-associations', 'youth-sports-leagues'],
  },
  {
    slug: 'community-chat',
    title: 'Community Chat',
    description: 'Keep member conversations inside your club platform with real-time chat and notifications.',
    problem: 'Club conversations get split across private texts, social threads, and emails that new members never see.',
    solution: 'GatherGrove keeps community chat, direct messages, event updates, and real-time notifications tied to member accounts.',
    longDescription:
      'Community chat gives members a place to talk without sending them to another social platform. GatherGrove supports real-time group conversations, direct messages, event-related updates, and notifications connected to the same member directory leaders already manage.',
    features: ['Group chat', 'Direct messaging', 'Event conversations', 'Real-time notifications', 'Member-linked profiles', 'Admin visibility controls'],
    benefits: ['Less scattered communication', 'Faster answers for members', 'Better onboarding into club conversations', 'Cleaner separation from personal social accounts'],
    keywords: ['community chat software', 'club chat app', 'member messaging app', 'real time community chat'],
    relatedClubTypes: ['social-clubs', 'book-clubs', 'alumni-associations'],
  },
  {
    slug: 'billing-payment-processing',
    title: 'Billing and Payment Processing',
    description: 'Process dues, event tickets, invoices, and receipts through Stripe without platform payment fees.',
    problem: 'Payments become hard to reconcile when dues, tickets, refunds, receipts, and invoices live in separate systems.',
    solution: 'GatherGrove connects Stripe payments to member records, dues status, event registrations, invoices, receipts, and reports.',
    longDescription:
      'GatherGrove billing and payment processing helps clubs collect dues, sell event tickets, issue receipts, and reconcile payments through Stripe. Admins can see payment status by member or event, track failed payments, and export financial reports without copying data between tools.',
    features: ['Stripe Connect', 'Dues payments', 'Event ticket payments', 'Invoices and receipts', 'Failed payment tracking', 'Financial exports'],
    benefits: ['Cleaner payment reconciliation', 'Fewer manual receipt requests', 'Better treasurer reporting', 'No GatherGrove platform fees on payments'],
    keywords: ['club payment processing', 'membership billing software', 'club billing software', 'nonprofit payment processing'],
    relatedClubTypes: ['professional-associations', 'nonprofit-organizations', 'running-clubs'],
  },
]

export function getUseCaseBySlug(slug: string): UseCaseEntry | undefined {
  return USE_CASES.find((uc) => uc.slug === slug)
}

export function getAllUseCaseSlugs(): string[] {
  return USE_CASES.map((uc) => uc.slug)
}
