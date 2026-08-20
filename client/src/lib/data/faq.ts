import { PAYMENT_PROCESSOR_COPY, PLATFORM_FEE_COPY, formatPricingFaqAnswer } from '@/lib/pricing';

export interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'features' | 'getting-started' | 'security';
}

export const FAQ_CATEGORIES = {
  general: 'General',
  pricing: 'Pricing & Plans',
  features: 'Features',
  'getting-started': 'Getting Started',
  security: 'Security & Privacy',
} as const;

export const FAQ_DATA: FAQItem[] = [
  // General
  {
    question: 'What is GatherGrove?',
    answer:
      'GatherGrove is a comprehensive membership and event management platform for organizations of all types. It helps administrators streamline member management, automate payment collection, coordinate events, and improve communication - all in one integrated platform. Unlike traditional spreadsheet-based approaches, GatherGrove provides an all-in-one solution for clubs, associations, non-profits, community groups, and membership organizations.',
    category: 'general',
  },
  {
    question: 'What types of organizations use GatherGrove?',
    answer:
      'GatherGrove is used by a wide variety of organizations including recreational clubs, professional associations, non-profits, community groups, alumni associations, hobby clubs, sports leagues, volunteer organizations, and membership-based communities. The platform is designed for small to medium-sized organizations that need member management, event coordination, and communication tools without enterprise complexity.',
    category: 'general',
  },
  {
    question: 'How does GatherGrove save time for administrators?',
    answer:
      'GatherGrove saves administrators an average of 10+ hours per month compared to manual spreadsheet management. The platform automates dues collection and payment reminders, streamlines member communications with bulk messaging, simplifies event coordination with built-in RSVP tracking, eliminates repetitive data entry with automated member onboarding, and consolidates multiple tools into one integrated solution.',
    category: 'general',
  },
  {
    question: 'How is GatherGrove different from other club management tools?',
    answer:
      'GatherGrove is built for hobby clubs and small groups. It combines member records, events, dues, email, chat, and a mobile app in one tool. Many other tools cost more or make you connect several apps.',
    category: 'general',
  },

  // Pricing
  {
    question: 'How much does GatherGrove cost?',
    answer:
      `${formatPricingFaqAnswer()} There are no setup fees or long-term contracts.`,
    category: 'pricing',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes, all paid plans come with a 30-day free trial with full access to all features. You can evaluate the entire platform, including member management, event coordination, communications, and the mobile app, before committing to a subscription. A credit card is required to start your trial.',
    category: 'pricing',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, you can cancel your GatherGrove subscription at any time with no penalties or cancellation fees. Your data remains accessible for 90 days after cancellation, allowing you to export member information and organization records.',
    category: 'pricing',
  },
  {
    question: 'What is the difference between the Grow and Expand plans?',
    answer:
      'Seed supports up to 100 members, 2 admin users, and 1,000 emails per month. Grow supports up to 200 members, 3 admin users, and 3,000 emails per month. Expand supports up to 2,000 members, unlimited admin users, and 50,000 emails per month. Expand also includes unlimited custom fields, events, and RSVPs.',
    category: 'pricing',
  },
  {
    question: 'How does payment processing work?',
    answer:
      `${PLATFORM_FEE_COPY}. ${PAYMENT_PROCESSOR_COPY}.`,
    category: 'pricing',
  },
  {
    question: 'Do you offer annual billing discounts?',
    answer:
      'Yes. Seed, Grow, and Expand have annual billing. Choose it at signup. You can also change it in account settings.',
    category: 'pricing',
  },

  // Features
  {
    question: 'Is there a mobile app for members?',
    answer:
      'Yes, GatherGrove includes a mobile app for members on both plans. Members can view and RSVP to events, pay dues securely, access the member directory, receive push notifications, participate in community chat, and view their digital membership cards - all directly on their iOS or Android devices.',
    category: 'features',
  },
  {
    question: 'What communication features are included?',
    answer:
      'GatherGrove includes bulk email, email templates, push notifications, community chat, event invites, RSVP tracking, and payment reminders. Messages are logged for your records.',
    category: 'features',
  },
  {
    question: 'Can I import my existing member data?',
    answer:
      'Yes, GatherGrove provides data import tools to help you migrate from spreadsheets or other management systems. You can import member contact information, membership status, payment history, and custom field data via CSV upload. Our support team can assist with data migration to ensure a smooth transition from your current system.',
    category: 'features',
  },
  {
    question: 'Does GatherGrove support event management?',
    answer:
      'Yes, GatherGrove includes full event management capabilities: create and manage events with RSVP tracking, support for multi-session events, waitlists, QR code check-in, paid events with Stripe integration, attendee feedback collection, and detailed event analytics. Events integrate seamlessly with member communications and the mobile app.',
    category: 'features',
  },
  {
    question: 'Can I manage multiple locations?',
    answer:
      'Yes, GatherGrove supports multi-location management. Organizations can set up and manage multiple venues, transfer members between locations, and run location-specific events and communications - all from a single dashboard.',
    category: 'features',
  },

  // Getting Started
  {
    question: 'How long does setup take?',
    answer:
      'Most organizations are up and running within 5 minutes. The setup process includes creating your organization profile, importing member data (optional), configuring membership types and dues structure, customizing communication templates, and inviting members to join. Our step-by-step setup wizard guides you through each step.',
    category: 'getting-started',
  },
  {
    question: 'What support is available?',
    answer:
      'GatherGrove provides multiple support channels: a comprehensive knowledge base with setup guides and tutorials, email support for all users (24-48 hour response), priority email support for Grow plan users (4-8 hour response), live chat support during business hours, onboarding assistance for new organizations, and regular webinars covering best practices for membership management.',
    category: 'getting-started',
  },
  {
    question: 'Do I need technical skills to use GatherGrove?',
    answer:
      'No. GatherGrove is designed for non-technical administrators. The interface is intuitive and requires no coding or technical knowledge. The setup wizard walks you through every step, and our resource guides cover everything from member management basics to advanced communication strategies.',
    category: 'getting-started',
  },

  // Security
  {
    question: 'Is my club data secure and private?',
    answer:
      'Yes, GatherGrove takes data security seriously. All data is encrypted in transit and at rest, hosted on monitored secure cloud infrastructure, regularly backed up with disaster recovery procedures, and compliant with privacy regulations including GDPR. Members control their privacy settings and can choose what information to share. Administrators have granular access controls.',
    category: 'security',
  },
  {
    question: 'Is GatherGrove GDPR compliant?',
    answer:
      'Yes. GatherGrove is fully compliant with GDPR and other privacy regulations. Members can request data export, deletion, and manage their consent preferences. Administrators can configure data retention policies and manage member privacy settings from the admin dashboard.',
    category: 'security',
  },
  {
    question: 'How are payments secured?',
    answer:
      'All payment processing is handled through Stripe, a PCI Level 1 certified payment processor (the highest level of security certification). GatherGrove never stores credit card numbers on its servers. All payment data is encrypted end-to-end, and Stripe handles PCI compliance automatically.',
    category: 'security',
  },
];
