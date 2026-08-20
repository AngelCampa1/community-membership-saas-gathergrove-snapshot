// ---------------------------------------------------------------------------
// Templates pSEO data - 6 free club & organization templates
// Primary target keyword: "meeting minutes template" (22,200 searches/month, KD 5)
// ---------------------------------------------------------------------------

export const TEMPLATE_CATEGORIES = [
  'meetings',
  'events',
  'finance',
  'members',
  'volunteers',
  'governance',
] as const

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

export interface TemplateEntry {
  slug: string
  title: string
  description: string
  category: TemplateCategory
  keywords: string[]
  bluf: string            // one-sentence direct answer (40-80 words) for QuickAnswer
  keyTakeaways: string[]  // 3-5 bullet points
  sections: string[]      // H2 section titles for this template page
  steps: Array<{ title: string; description: string }>  // How to use the template
  templateBody: string    // The actual template text (plain text, copyable)
  faqQuestions: Array<{ question: string; answer: string }>
  relatedTemplates: string[]   // slugs of related templates
  relatedResources: string[]   // slugs of related resource articles
}

export const TEMPLATES: TemplateEntry[] = [
  // ── MEETINGS ────────────────────────────────────────────────────────────
  {
    slug: 'meeting-minutes-template',
    title: 'Meeting Minutes Template',
    description:
      'A free, ready-to-use meeting minutes template for clubs and organizations. Capture decisions, action items, and attendees in a clear, professional format that everyone can reference after the meeting.',
    category: 'meetings',
    keywords: [
      'meeting minutes template',
      'minutes of meeting template',
      'meeting minutes format',
      'club meeting minutes',
      'how to write meeting minutes',
      'meeting minutes example',
    ],
    bluf:
      'A meeting minutes template is a pre-formatted document that records who attended, what was discussed, what decisions were made, and what action items were assigned - so every member stays accountable and informed even if they could not attend. Use this template before, during, and immediately after every club meeting.',
    keyTakeaways: [
      'Meeting minutes create an official record that protects your club from disputes about what was decided.',
      'Recording action items with a responsible person and due date is the most important part of effective minutes.',
      'Minutes should be distributed within 24-48 hours while the meeting is still fresh.',
      'Keep minutes factual and concise - record decisions and actions, not verbatim conversation.',
    ],
    sections: [
      'What are meeting minutes?',
      'Meeting Minutes Template',
      'How to use this template',
      'Tips for taking better meeting minutes',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'Prepare before the meeting',
        description:
          'Fill in the meeting name, date, time, location, and expected attendees before the meeting starts. Print or open a digital copy of the template and review the agenda so you know which topics to expect.',
      },
      {
        title: 'Record attendance at the start',
        description:
          'As members arrive, mark them present in the Attendees section. Note any members who sent regrets (apologies) or who arrived late. Accurate attendance records matter for quorum and voting records.',
      },
      {
        title: 'Capture agenda items and discussion summaries',
        description:
          'For each agenda item, write a brief summary of the discussion - not a verbatim transcript. Focus on the key points raised, any motions proposed, and the outcome (approved, tabled, referred, etc.).',
      },
      {
        title: 'Record decisions and votes precisely',
        description:
          'For every formal decision, record the exact wording of the motion, who moved it, who seconded it, and the vote tally (e.g., "Carried 8-2" or "Unanimous"). Precision here prevents future disputes.',
      },
      {
        title: 'Assign action items before adjourning',
        description:
          'Before closing, confirm every action item aloud: who is responsible, exactly what they will do, and by what date. Record these in the Action Items table. This is the single most important step for follow-through.',
      },
      {
        title: 'Distribute and file within 48 hours',
        description:
          'Send the completed minutes to all members (including those who were absent) within 48 hours. File a copy in your club records. At the next meeting, the minutes will be formally approved - note any corrections at that time.',
      },
    ],
    templateBody: `MEETING MINUTES
===============================================================

MEETING INFORMATION
-------------------
Organization Name: _________________________________
Meeting Type:       [ ] Regular  [ ] Special  [ ] Annual
Date:               _________________________________
Start Time:         _____________  End Time: _____________
Location:           _________________________________
Meeting Called By:  _________________________________
Facilitator:        _________________________________
Minutes Recorded By: ________________________________

ATTENDEES
---------
Present:
Name                          | Role / Title
------------------------------|------------------------------
                              |
                              |
                              |
                              |
                              |

Absent / Regrets:
Name                          | Reason (optional)
------------------------------|------------------------------
                              |
                              |

Guests / Visitors:
Name                          | Affiliation
------------------------------|------------------------------
                              |

Quorum achieved: [ ] Yes  [ ] No
Total members present: _______

CALL TO ORDER
-------------
The meeting was called to order at ________ by ________________________.

APPROVAL OF PREVIOUS MINUTES
-----------------------------
Minutes from the meeting held on _______________ were:
[ ] Approved as presented
[ ] Approved with the following corrections: ____________________________
[ ] Deferred to next meeting

REPORTS
-------
Treasurer's Report:
  Current balance:   $___________
  Income since last meeting:  $___________
  Expenses since last meeting: $___________
  Notes: _____________________________________________________________

Other Reports:
  Officer / Committee       | Summary
  --------------------------|------------------------------------------
                            |
                            |

AGENDA ITEMS
------------
Item 1: _____________________________________________________________
  Discussion summary:
  ___________________________________________________________________
  ___________________________________________________________________
  Motion (if any): __________________________________________________
  Moved by: ________________________  Seconded by: __________________
  Vote: [ ] Carried unanimously  [ ] Carried ______ to ______  [ ] Failed
  Decision / outcome: _______________________________________________

Item 2: _____________________________________________________________
  Discussion summary:
  ___________________________________________________________________
  ___________________________________________________________________
  Motion (if any): __________________________________________________
  Moved by: ________________________  Seconded by: __________________
  Vote: [ ] Carried unanimously  [ ] Carried ______ to ______  [ ] Failed
  Decision / outcome: _______________________________________________

Item 3: _____________________________________________________________
  Discussion summary:
  ___________________________________________________________________
  ___________________________________________________________________
  Motion (if any): __________________________________________________
  Moved by: ________________________  Seconded by: __________________
  Vote: [ ] Carried unanimously  [ ] Carried ______ to ______  [ ] Failed
  Decision / outcome: _______________________________________________

(Add rows as needed)

ACTION ITEMS
------------
#  | Responsible Person       | Action Required             | Due Date
---|--------------------------|-----------------------------|-----------
1  |                          |                             |
2  |                          |                             |
3  |                          |                             |
4  |                          |                             |
5  |                          |                             |

ANNOUNCEMENTS
-------------
1. ___________________________________________________________________
2. ___________________________________________________________________
3. ___________________________________________________________________

NEXT MEETING
------------
Date: _______________________  Time: ________________________________
Location: _____________________________________________________________
Proposed agenda items for next meeting:
  - __________________________________________________________________
  - __________________________________________________________________

ADJOURNMENT
-----------
Motion to adjourn: ___________________  Seconded: ___________________
Meeting adjourned at: _____________

Respectfully submitted by: ____________________________
Date submitted: ____________________________

Minutes approved at the ___________________ meeting on: _______________
Approved by: ____________________________
`,
    faqQuestions: [
      {
        question: 'How long should meeting minutes be?',
        answer:
          'Meeting minutes should be as concise as possible while capturing all decisions and action items. For most club meetings, one to three pages is typical. Minutes are a record of decisions, not a transcript of the conversation - aim for clarity over completeness.',
      },
      {
        question: 'Who should take meeting minutes?',
        answer:
          'Traditionally, the club secretary is responsible for taking meeting minutes. If no secretary has been elected, rotate the responsibility or assign a dedicated note-taker before each meeting. The note-taker should not also be the meeting facilitator, since doing both roles simultaneously leads to incomplete records.',
      },
      {
        question: "What's the difference between meeting minutes and meeting notes?",
        answer:
          'Meeting minutes are an official, formal record of a meeting - they document decisions, motions, votes, and action items and are typically approved at the following meeting. Meeting notes are informal summaries used for personal reference. For most clubs and organizations, meeting minutes are the appropriate standard.',
      },
      {
        question: 'Do club meetings need formal minutes?',
        answer:
          "Any club that collects dues, votes on decisions, or operates as a nonprofit should keep formal meeting minutes. Minutes protect officers from liability, provide continuity when leadership changes, and are often required if your club is incorporated or tax-exempt. Even informal clubs benefit from recording action items.",
      },
      {
        question: 'How do I share meeting minutes after a meeting?',
        answer:
          'Email a PDF or shared document link to all members within 24-48 hours of the meeting. For clubs using management software, you can post minutes in the member portal or announcement feed so they are permanently accessible. Keep a signed copy in your club archives for the current and at least the past three years.',
      },
    ],
    relatedTemplates: [
      'annual-meeting-agenda-template',
      'meeting-agenda-template',
      'event-planning-template',
    ],
    relatedResources: [],
  },

  // ── EVENTS ──────────────────────────────────────────────────────────────
  {
    slug: 'event-planning-template',
    title: 'Event Planning Template',
    description:
      'A comprehensive event planning template for clubs and organizations. Covers goals, budget, venue, timeline, volunteer assignments, marketing, and post-event debrief so nothing falls through the cracks.',
    category: 'events',
    keywords: [
      'event planning template',
      'event plan template',
      'club event planning',
      'event checklist template',
      'event planning checklist',
      'nonprofit event planning',
    ],
    bluf:
      'An event planning template helps clubs coordinate every detail of an event - from venue booking and budget to volunteer assignments and marketing - in a single document so the whole team stays aligned and nothing is forgotten. Start filling it out at least eight weeks before your event date.',
    keyTakeaways: [
      'Starting event planning 8-12 weeks out gives you time to book venues, promote the event, and recruit volunteers.',
      'A written budget with realistic income and expense estimates prevents the club from losing money on events.',
      'Assigning a named owner to every task on the checklist eliminates "I thought someone else was doing that" failures.',
      'A post-event debrief section helps your club improve each time and captures institutional knowledge.',
    ],
    sections: [
      'Event Planning Template',
      'How to use this template',
      'Event planning timeline checklist',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'Define goals and scope (10+ weeks out)',
        description:
          'Before anything else, agree on what success looks like: How many attendees? What is the purpose - fundraiser, social, competition? What is the maximum budget? Write these down in the Goals section so every decision that follows is aligned.',
      },
      {
        title: 'Secure venue and date (8-10 weeks out)',
        description:
          'Confirm venue availability, accessibility, capacity, and cost. Book it with a signed contract. Once the venue is locked, set the official date and begin promoting.',
      },
      {
        title: 'Build your budget and assign task owners (6-8 weeks out)',
        description:
          'Estimate all income (ticket sales, sponsorships, donations) and all expenses (venue, catering, supplies, marketing). Assign a named person to each line item and task. A budget with no owner is just a wish list.',
      },
      {
        title: 'Recruit volunteers and promote (4-6 weeks out)',
        description:
          'Open volunteer sign-ups with specific roles (setup, registration, cleanup) and hours required. Begin promoting via email, social media, and your member portal. Track RSVPs so you can manage capacity.',
      },
      {
        title: 'Confirm logistics (1-2 weeks out)',
        description:
          'Confirm headcount with the venue, confirm all vendor bookings, finalize volunteer schedule, prepare materials (name tags, signage, A/V), and brief all team leads on their responsibilities.',
      },
      {
        title: 'Run the event and conduct post-event debrief',
        description:
          'On the day, follow the run-of-show schedule. After the event, complete the debrief section: what worked, what did not, final attendance vs. target, final income vs. budget. File this for the next event planner.',
      },
    ],
    templateBody: `EVENT PLANNING TEMPLATE
===============================================================

EVENT OVERVIEW
--------------
Event Name:         _________________________________
Event Type:         [ ] Social  [ ] Fundraiser  [ ] Competition  [ ] Educational  [ ] Other: _______
Date:               _________________________________
Start Time:         _____________  End Time: _____________
Location / Venue:   _________________________________
Venue Address:      _________________________________
Venue Contact:      _________________________________  Phone: _______________
Venue Booking Confirmed: [ ] Yes  [ ] No  Confirmation #: _______________

EVENT GOALS
-----------
Primary goal:       _____________________________________________________________
Expected attendance (target): __________  Maximum capacity: __________
Fundraising target (if applicable): $___________

PLANNING TEAM
-------------
Event Lead:         _________________________________
Treasurer / Budget: _________________________________
Volunteer Coordinator: ______________________________
Marketing Lead:     _________________________________
Logistics Lead:     _________________________________

BUDGET
------
INCOME                          Estimated      Actual
------------------------------  -----------  -----------
Ticket sales / registrations    $            $
Sponsorships                    $            $
Donations / collections         $            $
Grants                          $            $
Other: ___________________      $            $
TOTAL INCOME                    $            $

EXPENSES                        Estimated      Actual
------------------------------  -----------  -----------
Venue rental / deposit          $            $
Catering / food & drink         $            $
Audio / visual / equipment      $            $
Decorations / supplies          $            $
Marketing / printing            $            $
Speaker / entertainment fees    $            $
Insurance / permits             $            $
Other: ___________________      $            $
TOTAL EXPENSES                  $            $

NET (Income - Expenses)         $            $

EVENT TIMELINE / CHECKLIST
--------------------------
10+ Weeks Out
[ ] Define event goals, budget ceiling, and success metrics
[ ] Form planning committee and assign roles
[ ] Research and shortlist venues

8-10 Weeks Out
[ ] Book venue - get signed contract
[ ] Set official date and add to club calendar
[ ] Open event registration / ticket sales

6-8 Weeks Out
[ ] Finalize and approve budget
[ ] Confirm catering or food arrangements
[ ] Book any speakers, entertainment, or A/V vendors
[ ] Begin email marketing to members

4-6 Weeks Out
[ ] Open volunteer sign-ups (use sign-up sheet template)
[ ] Launch social media promotion
[ ] Send second email to members with registration link
[ ] Order supplies, decorations, printed materials

2-4 Weeks Out
[ ] Confirm headcount with venue / caterer
[ ] Finalize volunteer schedule and assignments
[ ] Prepare run-of-show / event day timeline
[ ] Confirm all vendor bookings

1 Week Out
[ ] Send reminder email to registered attendees
[ ] Brief all team leads and volunteers
[ ] Prepare name tags, signage, and registration materials
[ ] Confirm A/V setup

Day Before
[ ] Confirm all deliveries and vendor arrival times
[ ] Charge any devices; test A/V equipment
[ ] Prepare check-in list

Day Of Event
[ ] Set up venue ___ hours before start
[ ] Volunteer briefing at ___:___
[ ] Doors open at ___:___
[ ] Program starts at ___:___
[ ] Program ends at ___:___
[ ] Cleanup complete by ___:___

After Event
[ ] Send thank-you emails to attendees and volunteers
[ ] Collect and reconcile all income / expenses
[ ] Complete post-event debrief (see below)
[ ] File event records and financial summary

VOLUNTEER ASSIGNMENTS (Day-of)
-------------------------------
Role                  | Name(s)                | Hours      | Contact
----------------------|------------------------|------------|------------------
Registration / Check-In |                      |            |
Setup                 |                        |            |
Hospitality / Greeter |                        |            |
A/V Support           |                        |            |
Cleanup               |                        |            |
Other: ______________ |                        |            |

POST-EVENT DEBRIEF
------------------
Final attendance:     __________  (Target was: __________)
Final net income:     $__________  (Target was: $__________)

What worked well:
1. __________________________________________________________________
2. __________________________________________________________________
3. __________________________________________________________________

What needs improvement:
1. __________________________________________________________________
2. __________________________________________________________________
3. __________________________________________________________________

Action items for next event:
1. __________________________________________________________________
2. __________________________________________________________________

Completed by:  ________________________  Date: ______________________
`,
    faqQuestions: [
      {
        question: 'How far in advance should I start planning a club event?',
        answer:
          'For most club events, start planning at least 8 weeks out. Large events with venue rentals, outside vendors, or significant marketing should begin 12-16 weeks ahead. Starting early gives you time to book your preferred venue, recruit volunteers, and build attendance.',
      },
      {
        question: 'What should be in an event planning budget?',
        answer:
          'A complete event budget lists all expected income sources (ticket sales, sponsorships, donations) and all expenses (venue, catering, marketing, supplies, permits, insurance). Always build in a 10-15% contingency buffer for unexpected costs. Track estimated vs. actual figures so you can improve future budgets.',
      },
      {
        question: 'How many volunteers do I need for a club event?',
        answer:
          'A general rule is one volunteer per 15-25 attendees for a typical social or fundraising event. For events with complex logistics (multi-session conferences, races, large fundraisers), you may need one volunteer per 8-10 attendees. Always recruit more than you think you need - last-minute cancellations are common.',
      },
      {
        question: 'What permits or insurance do I need for a club event?',
        answer:
          'Requirements vary by event type, location, and expected attendance. Common permits include temporary food service permits (if selling food), alcohol permits, noise/sound permits, and parks department event permits for outdoor events. Check with your local municipality at least 6 weeks before your event. Most clubs should also carry event liability insurance.',
      },
      {
        question: 'How do I track RSVPs and ticket sales for a club event?',
        answer:
          'The simplest approach for small clubs is a shared spreadsheet or Google Form. For clubs with online member portals, built-in event management software handles RSVPs, waitlists, and payment collection automatically. Tracking RSVPs is important for venue capacity planning and catering headcounts.',
      },
    ],
    relatedTemplates: [
      'volunteer-sign-up-sheet-template',
      'meeting-minutes-template',
      'club-budget-template',
    ],
    relatedResources: [],
  },

  // ── FINANCE ─────────────────────────────────────────────────────────────
  {
    slug: 'club-budget-template',
    title: 'Club Budget Template',
    description:
      'A free annual budget template for clubs, nonprofits, and community organizations. Covers all income and expense categories with a simple format that any treasurer can use - no accounting background required.',
    category: 'finance',
    keywords: [
      'club budget template',
      'nonprofit budget template',
      'club annual budget',
      'organization budget template',
      'club treasurer budget',
      'annual budget spreadsheet',
    ],
    bluf:
      'A club budget template organizes all expected income (dues, fundraisers, grants) and expenses (venue, insurance, events, administration) for a 12-month period so your treasurer and board can make financial decisions with confidence and present a clear financial picture to members each year.',
    keyTakeaways: [
      'An annual budget approved by the board at the start of the fiscal year sets spending authority and prevents unauthorized expenditures.',
      'Tracking actual income and expenses against the budget every month lets you catch overruns before they become crises.',
      'Most clubs underestimate insurance, website, and administrative costs - these should be budgeted first before discretionary items.',
      'A cash reserve of 2-3 months of operating expenses protects the club if a major fundraiser or event underperforms.',
    ],
    sections: [
      'Club Budget Template',
      'How to use this template',
      'Budget categories explained',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'Review the previous year\'s actuals',
        description:
          'Before projecting the new year, pull your actual income and expense totals from the previous 12 months. These real numbers are far more reliable than guesses and will highlight areas that regularly go over budget.',
      },
      {
        title: 'Project income conservatively',
        description:
          'List all income sources - membership dues, event ticket sales, fundraisers, sponsorships, grants, donations, and interest. Use the lower end of realistic projections. It is better to have surplus than a deficit.',
      },
      {
        title: 'List all known fixed expenses first',
        description:
          'Fixed expenses include annual insurance premiums, facility rental fees, software subscriptions, and required fees. Enter these first - they are non-negotiable and must be covered before any discretionary spending.',
      },
      {
        title: 'Allocate to variable expenses',
        description:
          'Variable expenses include events, communications, supplies, and member programs. Base these on planned activities for the year. Link event budgets to your event planning templates so numbers are consistent.',
      },
      {
        title: 'Present budget to the board for approval',
        description:
          'The budget should be formally approved by the board of directors or governing body before the fiscal year begins. Record the approval in your meeting minutes. A board-approved budget gives the treasurer authority to spend within approved limits.',
      },
    ],
    templateBody: `CLUB ANNUAL BUDGET
===============================================================

Organization Name:  _________________________________
Fiscal Year:        _____________  to  _____________
Prepared By:        _________________________________  Date: __________
Approved By:        _________________________________  Date: __________
Approval recorded in minutes dated: ____________________

MEMBERSHIP SUMMARY
------------------
Total members (projected):    __________
Dues-paying members:          __________
Honorary / waived members:    __________

INCOME
===============================================================
Category                          | Budget    | Actual YTD | Notes
----------------------------------|-----------|------------|------------------
MEMBERSHIP DUES
  Regular members @ $___/yr       | $         | $          |
  Family/household @ $___/yr      | $         | $          |
  Student/senior @ $___/yr        | $         | $          |
  Life members (one-time)         | $         | $          |
  SUBTOTAL - Dues                 | $         | $          |

EVENTS & PROGRAMS
  Annual meeting / gala           | $         | $          |
  Regular event ticket sales      | $         | $          |
  Tournament / competition entry  | $         | $          |
  Class / workshop fees           | $         | $          |
  SUBTOTAL - Events               | $         | $          |

FUNDRAISING
  Annual fund drive               | $         | $          |
  Sponsorships                    | $         | $          |
  Grants                          | $         | $          |
  Merchandise sales               | $         | $          |
  Other fundraising               | $         | $          |
  SUBTOTAL - Fundraising          | $         | $          |

OTHER INCOME
  Interest / investment income    | $         | $          |
  Advertising                     | $         | $          |
  Other: ___________________      | $         | $          |
  SUBTOTAL - Other Income         | $         | $          |

TOTAL INCOME                      | $         | $          |

EXPENSES
===============================================================
Category                          | Budget    | Actual YTD | Notes
----------------------------------|-----------|------------|------------------
ADMINISTRATIVE
  Insurance (liability / D&O)     | $         | $          |
  Legal / accounting fees         | $         | $          |
  Filing fees (state, IRS)        | $         | $          |
  Banking fees                    | $         | $          |
  Post Office / shipping          | $         | $          |
  Office supplies                 | $         | $          |
  SUBTOTAL - Administrative       | $         | $          |

COMMUNICATIONS & TECHNOLOGY
  Website / domain / hosting      | $         | $          |
  Email / newsletter software     | $         | $          |
  Membership management software  | $         | $          |
  Printing / copying              | $         | $          |
  SUBTOTAL - Communications       | $         | $          |

FACILITIES
  Regular meeting venue rental    | $         | $          |
  Storage unit rental             | $         | $          |
  Equipment maintenance           | $         | $          |
  SUBTOTAL - Facilities           | $         | $          |

EVENTS & PROGRAMS
  Annual meeting / gala           | $         | $          |
  Regular events (catering, etc.) | $         | $          |
  Awards / trophies / prizes      | $         | $          |
  Equipment / supplies            | $         | $          |
  Guest speakers / entertainment  | $         | $          |
  SUBTOTAL - Events               | $         | $          |

MEMBER SERVICES
  Scholarships / grants           | $         | $          |
  Member development programs     | $         | $          |
  Welcome kits / swag             | $         | $          |
  SUBTOTAL - Member Services      | $         | $          |

OFFICER EXPENSES
  Conference / convention travel  | $         | $          |
  Leadership development          | $         | $          |
  Affiliation / national dues     | $         | $          |
  SUBTOTAL - Officer Expenses     | $         | $          |

CONTINGENCY (recommended 10%)     | $         | $          |

TOTAL EXPENSES                    | $         | $          |

SUMMARY
-------
Total Income (budgeted):          $___________
Total Expenses (budgeted):        $___________
Net Surplus / (Deficit):          $___________

Opening reserve balance:          $___________
Projected closing reserve:        $___________
Recommended minimum reserve (3 months of operating expenses): $___________
`,
    faqQuestions: [
      {
        question: 'How often should a club review its budget?',
        answer:
          'Clubs should review actual income and expenses against the budget at least quarterly - ideally monthly. The treasurer should present a budget vs. actuals report at every board meeting. This cadence lets leadership spot problems early and make adjustments before the fiscal year ends.',
      },
      {
        question: 'What is a reasonable overhead ratio for a small club?',
        answer:
          'For most hobby and community clubs, administrative overhead (insurance, banking, legal, technology) should represent 15-25% of total expenses. If overhead exceeds 35%, look for ways to reduce costs through free or low-cost tools and group insurance programs. The remaining budget should go toward member programs and events.',
      },
      {
        question: 'Do small clubs need to file taxes?',
        answer:
          'In the United States, most nonprofits and clubs with gross annual receipts under $50,000 can file a free Form 990-N (e-Postcard) with the IRS. Organizations with gross receipts between $50,000 and $200,000 file Form 990-EZ. Failing to file for three consecutive years results in automatic loss of tax-exempt status. Consult a CPA familiar with nonprofits for your specific situation.',
      },
      {
        question: 'How much should a club keep in reserve?',
        answer:
          'Most financial advisors recommend that clubs and nonprofits maintain a cash reserve equal to 2-3 months of operating expenses. This reserve protects the organization if a major fundraiser underperforms, if unexpected expenses arise, or if there is a gap in dues collection. Build the reserve over 2-3 years if your club does not already have one.',
      },
    ],
    relatedTemplates: [
      'event-planning-template',
      'meeting-minutes-template',
      'annual-meeting-agenda-template',
    ],
    relatedResources: [],
  },

  // ── MEMBERS ─────────────────────────────────────────────────────────────
  {
    slug: 'member-roster-template',
    title: 'Member Roster Template',
    description:
      'A free member roster template for clubs and organizations. Track contact information, membership type, join date, and status in a clean format suitable for a spreadsheet or printed directory.',
    category: 'members',
    keywords: [
      'member roster template',
      'club membership list template',
      'member directory template',
      'club member list',
      'membership roster spreadsheet',
      'club contact list template',
    ],
    bluf:
      'A member roster template is a structured list that captures each member\'s name, contact details, membership type, join date, renewal status, and emergency contact - giving your club a single source of truth for communication, dues tracking, and emergency preparedness. Update it whenever a member joins, renews, or leaves.',
    keyTakeaways: [
      'A centralized, up-to-date member roster is the foundation of every other club activity - communications, dues, events, and voting all depend on it.',
      'Collecting an emergency contact for each member is especially important for clubs with physical activities or field trips.',
      'Store your roster securely and share only with authorized officers - member contact information is private data.',
      'Review and verify your roster at least twice a year to remove inactive members and update contact information.',
    ],
    sections: [
      'Member Roster Template',
      'How to use this template',
      'What information to collect from members',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'Collect member information at sign-up',
        description:
          'Use a standard intake form or online registration to collect the same fields from every new member. Consistency makes the roster searchable and comparable. At minimum, collect: full name, preferred email, phone, membership type, and join date.',
      },
      {
        title: 'Assign a membership ID',
        description:
          'Give each member a unique numeric or alphanumeric ID (e.g., M-0001). This makes it easy to reference members in invoices, event check-ins, and committee reports without confusion from duplicate names.',
      },
      {
        title: 'Set and track membership expiry',
        description:
          'Record each member\'s renewal date. Most clubs renew annually. Set a reminder 60 days before expiry to send renewal notices. Mark members as "Lapsed" rather than deleting them immediately - some will renew after a reminder.',
      },
      {
        title: 'Keep the roster current',
        description:
          'Designate one officer (usually the secretary or membership director) as the roster custodian. They update the roster within 48 hours of any change: new member, renewal, resignation, address update, or lapse. A stale roster is worse than no roster.',
      },
      {
        title: 'Back up and secure the roster',
        description:
          'Store the master roster in a password-protected file or secure membership management system. Back it up monthly. Share only a limited version (name and email) with general committee chairs - full contact details and emergency information should be restricted to authorized officers.',
      },
    ],
    templateBody: `MEMBER ROSTER
===============================================================

Organization Name:  _________________________________
Roster Date:        _________________________________
Maintained By:      _________________________________
Total Active Members: ______  Total Lapsed: ______  Total Honorary: ______

MEMBER DIRECTORY
----------------
ID     | Full Name           | Email                    | Phone          | Join Date  | Renewal Date | Type       | Status   | Emergency Contact       | EC Phone
-------|---------------------|--------------------------|----------------|------------|--------------|------------|----------|-------------------------|------------------
M-0001 |                     |                          |                |            |              |            |          |                         |
M-0002 |                     |                          |                |            |              |            |          |                         |
M-0003 |                     |                          |                |            |              |            |          |                         |
M-0004 |                     |                          |                |            |              |            |          |                         |
M-0005 |                     |                          |                |            |              |            |          |                         |
M-0006 |                     |                          |                |            |              |            |          |                         |
M-0007 |                     |                          |                |            |              |            |          |                         |
M-0008 |                     |                          |                |            |              |            |          |                         |
M-0009 |                     |                          |                |            |              |            |          |                         |
M-0010 |                     |                          |                |            |              |            |          |                         |
(add rows as needed)

FIELD DEFINITIONS
-----------------
ID:              Unique member identifier (e.g., M-0001)
Full Name:       Legal name or preferred display name
Email:           Primary contact email address
Phone:           Primary phone number
Join Date:       Date member first joined (MM/DD/YYYY)
Renewal Date:    Date current membership expires (MM/DD/YYYY)
Type:            Regular / Family / Student / Senior / Honorary / Life / Founding
Status:          Active / Lapsed / Pending / Suspended / Resigned / Deceased
Emergency Contact: Name of emergency contact person
EC Phone:        Emergency contact phone number

MEMBERSHIP TYPES (customize as needed)
---------------------------------------
Type        | Annual Fee | Benefits
------------|------------|--------------------------------------------------
Regular     | $          |
Family      | $          |
Student     | $          |
Senior 65+  | $          |
Honorary    | $0         | Awarded by board vote; no voting rights
Life        | $          | One-time fee; permanent membership

OFFICERS & COMMITTEE LEADS (separate from general roster)
----------------------------------------------------------
Role                  | Name              | Email               | Term Expires
----------------------|-------------------|---------------------|-------------
President             |                   |                     |
Vice President        |                   |                     |
Secretary             |                   |                     |
Treasurer             |                   |                     |
Membership Director   |                   |                     |
Events Director       |                   |                     |

ROSTER CHANGE LOG
-----------------
Date       | Member ID | Change Type        | Changed By
-----------|-----------|--------------------|-----------
           |           |                    |
           |           |                    |
           |           |                    |
`,
    faqQuestions: [
      {
        question: 'How should I store member contact information securely?',
        answer:
          'Never store member information in a publicly accessible spreadsheet or shared drive folder with open permissions. Use password protection on spreadsheet files, or better yet, use a dedicated membership management system that provides role-based access control. Inform members how their data is stored and used, especially if your club has members in jurisdictions with privacy laws (GDPR, CCPA).',
      },
      {
        question: 'What is the difference between a member roster and a member directory?',
        answer:
          'A member roster is an internal administrative document containing complete contact information, membership status, and financial data used by officers. A member directory is a curated, member-facing document or online listing that shows only the information members have consented to share (often just name, city, and email or phone). Always get consent before publishing any member information in a directory.',
      },
      {
        question: 'How do I handle GDPR or privacy laws for my member list?',
        answer:
          'If your club has members in the European Union, California, or other privacy-regulated jurisdictions, you must collect only the minimum data needed, inform members why you are collecting their data, store it securely, and delete it upon request. Include a brief data use statement on your membership application. When in doubt, consult a privacy attorney.',
      },
      {
        question: 'When should I mark a member as lapsed vs. resigned?',
        answer:
          '"Lapsed" means a membership expired and the member has not renewed - they may still renew if contacted. "Resigned" means the member actively communicated they are leaving the club. Keep lapsed members in your system for at least one renewal cycle before archiving them, since many renew after a reminder. Resigned members should be archived promptly and removed from active communications.',
      },
    ],
    relatedTemplates: [
      'meeting-minutes-template',
      'volunteer-sign-up-sheet-template',
    ],
    relatedResources: [],
  },

  // ── VOLUNTEERS ───────────────────────────────────────────────────────────
  {
    slug: 'volunteer-sign-up-sheet-template',
    title: 'Volunteer Sign-Up Sheet Template',
    description:
      'A free volunteer sign-up sheet template for club events and activities. Capture volunteer names, contact information, availability, and role assignments in a single document - printable or digital.',
    category: 'volunteers',
    keywords: [
      'volunteer sign up sheet template',
      'volunteer signup sheet',
      'volunteer registration form',
      'event volunteer sheet',
      'volunteer list template',
      'sign up sheet template',
    ],
    bluf:
      'A volunteer sign-up sheet template helps clubs and organizations quickly recruit and organize volunteers for events by capturing each volunteer\'s name, contact information, preferred role, and available hours in one document - making it easy to confirm assignments and send reminders before the event.',
    keyTakeaways: [
      'Listing specific volunteer roles with time requirements helps volunteers self-select the right assignment and reduces no-shows.',
      'Collecting a phone number in addition to email ensures you can reach volunteers the day before and day of the event.',
      'Confirming assignments with a personal email or text 48 hours before the event reduces last-minute dropout.',
      'Thanking volunteers promptly after the event increases the chance they will sign up again.',
    ],
    sections: [
      'Volunteer Sign-Up Sheet Template',
      'How to use this template',
      'Tips for recruiting more volunteers',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'List your volunteer roles and time slots before sharing',
        description:
          'Before distributing the sign-up sheet, fill in the specific roles you need (setup crew, registration table, parking attendant, cleanup), the exact time commitment for each, and the number of volunteers needed per role. Vague requests like "general volunteer" produce uneven results.',
      },
      {
        title: 'Distribute the sheet through multiple channels',
        description:
          'Share the sign-up sheet by email, on your member portal, at your next meeting, and via any social media groups. Post it 3-4 weeks before the event so volunteers can plan ahead. Mention the specific roles still open in each communication.',
      },
      {
        title: 'Confirm assignments one week before',
        description:
          'Send each signed-up volunteer a personal confirmation email or text with their role, start time, location, and any preparation instructions. This also catches any sign-ups that are no longer available.',
      },
      {
        title: 'Send a reminder 24-48 hours before the event',
        description:
          'A brief reminder the day before dramatically reduces last-minute no-shows. Include the start time, parking or entry instructions, and who to contact on the day of the event.',
      },
      {
        title: 'Follow up with a thank-you after the event',
        description:
          'Send a thank-you message to every volunteer within 48 hours of the event. Acknowledge their specific contribution. Volunteers who feel appreciated are significantly more likely to help again.',
      },
    ],
    templateBody: `VOLUNTEER SIGN-UP SHEET
===============================================================

Event / Activity:   _________________________________
Date:               _________________________________
Location:           _________________________________
Volunteer Coordinator: ______________________________  Phone: _______________
Email:              _________________________________

VOLUNTEER ROLES AVAILABLE
--------------------------
Role / Position       | Time Required        | Volunteers Needed | Filled
----------------------|----------------------|-------------------|---------
                      |                      |                   |
                      |                      |                   |
                      |                      |                   |
                      |                      |                   |
                      |                      |                   |
                      |                      |                   |
                      |                      |                   |

VOLUNTEER SIGN-UP LIST
-----------------------
#  | Full Name            | Email                    | Phone          | First Choice Role    | Second Choice Role   | T-shirt Size | Notes
---|----------------------|--------------------------|----------------|----------------------|----------------------|--------------|-------
1  |                      |                          |                |                      |                      |              |
2  |                      |                          |                |                      |                      |              |
3  |                      |                          |                |                      |                      |              |
4  |                      |                          |                |                      |                      |              |
5  |                      |                          |                |                      |                      |              |
6  |                      |                          |                |                      |                      |              |
7  |                      |                          |                |                      |                      |              |
8  |                      |                          |                |                      |                      |              |
9  |                      |                          |                |                      |                      |              |
10 |                      |                          |                |                      |                      |              |
11 |                      |                          |                |                      |                      |              |
12 |                      |                          |                |                      |                      |              |
13 |                      |                          |                |                      |                      |              |
14 |                      |                          |                |                      |                      |              |
15 |                      |                          |                |                      |                      |              |
(add rows as needed)

VOLUNTEER CONFIRMATION CHECKLIST
---------------------------------
[ ] Roles and time slots filled in before distributing sheet
[ ] Sheet shared via email, member portal, and at meeting
[ ] Individual confirmation emails sent 1 week before
[ ] Reminder sent 24-48 hours before event
[ ] Day-of contact information shared with all volunteers
[ ] Thank-you emails sent within 48 hours of event

NOTES / SPECIAL REQUIREMENTS
------------------------------
(e.g., minimum age, physical requirements, training needed)
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
`,
    faqQuestions: [
      {
        question: 'How many volunteers do I need for a typical club event?',
        answer:
          'A rough guideline is one volunteer per 15-25 guests for a social or fundraising event. For events requiring registration check-in, plan one volunteer per 50 expected attendees at the registration table. Always recruit 20-25% more volunteers than you think you need to account for last-minute cancellations.',
      },
      {
        question: 'How do I motivate members to volunteer?',
        answer:
          'Be specific about what you need (a 2-hour setup shift, not "general help"), communicate how the volunteering directly benefits the club, and acknowledge volunteers publicly in meeting minutes and newsletters. Social organizations often see higher volunteer rates when sign-ups happen in person at meetings rather than only via email.',
      },
      {
        question: 'Should I collect a volunteer waiver for club events?',
        answer:
          'For events involving physical activity, equipment operation, or any risk of injury, a volunteer waiver is strongly recommended. Consult your club\'s legal advisor or insurance provider. Even for low-risk events, collecting a brief emergency contact form from volunteers is good practice.',
      },
      {
        question: 'Can I use a digital sign-up sheet instead of paper?',
        answer:
          'Yes - digital tools like Google Forms, SignUpGenius, or member management platforms are often more effective than paper because volunteers can sign up from home without waiting for the next meeting. Digital sheets also send automatic reminders, allow role-specific capacity limits, and are easier to share and update.',
      },
    ],
    relatedTemplates: [
      'event-planning-template',
      'member-roster-template',
    ],
    relatedResources: [],
  },

  // ── MEETINGS ─────────────────────────────────────────────────────────────
  {
    slug: 'annual-meeting-agenda-template',
    title: 'Annual Meeting Agenda Template',
    description:
      'A free annual meeting agenda template for clubs, nonprofits, and homeowner associations. Covers all required agenda items for a formal annual meeting: officer elections, financial report, bylaw amendments, and member Q&A.',
    category: 'meetings',
    keywords: [
      'annual meeting agenda template',
      'annual meeting agenda',
      'club annual meeting template',
      'HOA annual meeting agenda',
      'nonprofit annual meeting agenda',
      'annual general meeting agenda',
    ],
    bluf:
      'An annual meeting agenda template structures the most important meeting of the year for clubs and nonprofits - covering officer elections, the annual financial report, bylaw updates, and member questions in a clear order that ensures legal requirements are met and members stay engaged throughout the meeting.',
    keyTakeaways: [
      'Most club bylaws and some state laws require specific items (elections, financial report) to be included in the annual meeting - check yours before customizing this template.',
      'Distributing the agenda and candidate bios at least one week before the annual meeting increases attendance and participation.',
      'Allowing dedicated time for member questions and open discussion builds trust and reduces conflict outside official meetings.',
      'Formal minutes of the annual meeting should be retained permanently - they are part of your club\'s official corporate record.',
    ],
    sections: [
      'Annual Meeting Agenda Template',
      'How to use this template',
      'What must be included in an annual meeting',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'Check your bylaws for required annual meeting items',
        description:
          'Before customizing this template, review your organization\'s bylaws to identify mandatory agenda items. Common requirements include officer elections, presentation of audited financial statements, and formal approval of the previous year\'s minutes. State law may impose additional requirements for incorporated nonprofits.',
      },
      {
        title: 'Give proper advance notice to members',
        description:
          'Most bylaws require 10-30 days advance written notice of the annual meeting, including the date, time, location, and agenda. Send this notice by email and any other channels required by your bylaws. Failure to give proper notice can invalidate votes taken at the meeting.',
      },
      {
        title: 'Distribute supporting documents in advance',
        description:
          'Send members the previous year\'s annual report, audited financial statements, proposed budget, any proposed bylaw amendments, and candidate bios at least one week before the meeting. Informed members participate more constructively.',
      },
      {
        title: 'Prepare the election process',
        description:
          'Confirm which officer positions are up for election this year. Collect nominations in advance per your bylaws. Prepare ballots (paper or digital) if there are contested races. Appoint a teller committee of 2-3 members to count votes.',
      },
      {
        title: 'Follow the agenda and record minutes',
        description:
          'At the meeting, follow the agenda in order. The secretary should record detailed minutes including all motions, votes, and election results. Annual meeting minutes are permanent records - they should be accurate and complete.',
      },
    ],
    templateBody: `ANNUAL MEETING AGENDA
===============================================================

Organization Name:  _________________________________
Meeting Type:       Annual General Meeting (AGM)
Fiscal Year Covered: _____________  to  _____________
Date:               _________________________________
Time:               _____________  Location: ___________________________
Presiding Officer:  _________________________________
Secretary:          _________________________________
Notice sent on:     _____________  (Required notice: _____ days per bylaws)

PRE-MEETING
-----------
[ ] Meeting space set up and accessible
[ ] Sign-in sheet and name tags available
[ ] Ballots prepared (if contested elections)
[ ] Quorum count sheet prepared
[ ] Supporting documents distributed: financial report, budget, candidate bios

CALL TO ORDER
-------------
Time: _____________
Called to order by: ________________________
Verification of quorum: ________ members present (required: _______)
Quorum: [ ] Achieved  [ ] Not achieved - meeting cannot proceed

WELCOME AND INTRODUCTIONS
--------------------------
(Brief welcome from the president; introduce any guests or outgoing officers)

APPROVAL OF PREVIOUS ANNUAL MEETING MINUTES
--------------------------------------------
Minutes from annual meeting held on: _______________
  [ ] Approved as distributed
  [ ] Approved with corrections: ______________________________________
  Moved by: ________________  Seconded by: ________________
  Vote: [ ] Carried  [ ] Failed

PRESIDENT'S ANNUAL REPORT
--------------------------
Presenter: ________________________
Summary of the year's highlights, accomplishments, and challenges:
(10 minutes maximum; distribute written summary in advance)

TREASURER'S ANNUAL FINANCIAL REPORT
-------------------------------------
Presenter: ________________________
  Total income for fiscal year:   $___________
  Total expenses for fiscal year: $___________
  Net surplus / (deficit):        $___________
  Year-end cash balance:          $___________
  Audited: [ ] Yes - auditor: ________________  [ ] No - reason: ________

Motion to accept financial report:
  Moved by: ________________  Seconded by: ________________
  Vote: [ ] Carried  [ ] Failed

COMMITTEE REPORTS (brief, 2-3 minutes each)
--------------------------------------------
Committee / Director          | Presenter              | Key Points
------------------------------|------------------------|---------------------------
Membership                    |                        |
Events                        |                        |
Communications                |                        |
Other: ___________________    |                        |

APPROVAL OF ANNUAL BUDGET FOR UPCOMING YEAR
--------------------------------------------
Proposed budget presented by: ________________________
Motion to approve the budget for fiscal year ___________:
  Moved by: ________________  Seconded by: ________________
  Vote: [ ] Carried  [ ] Failed

BYLAW AMENDMENTS (if any)
--------------------------
Amendment 1: _______________________________________________________________
  Discussion:
  Motion to adopt amendment:
  Moved by: ________________  Seconded by: ________________
  Vote (2/3 required per bylaws): _______ For / _______ Against
  [ ] Adopted  [ ] Failed

OFFICER ELECTIONS
-----------------
Positions up for election this year:
  [ ] President        Current: _______________  Candidate(s): _______________
  [ ] Vice President   Current: _______________  Candidate(s): _______________
  [ ] Secretary        Current: _______________  Candidate(s): _______________
  [ ] Treasurer        Current: _______________  Candidate(s): _______________
  [ ] Director at Large Current: ______________  Candidate(s): _______________

Nominations from the floor: [ ] Open  [ ] Closed (deadline was ____________)
Voting method: [ ] Paper ballot  [ ] Voice vote (uncontested only)  [ ] Electronic

Election results:
  President:          ________________________  Votes: _______
  Vice President:     ________________________  Votes: _______
  Secretary:          ________________________  Votes: _______
  Treasurer:          ________________________  Votes: _______
  Director at Large:  ________________________  Votes: _______

NEW BUSINESS / OLD BUSINESS
----------------------------
Item 1: _______________________________________________________________
  Motion: ______________________________________________________________
  Moved by: ________________  Seconded by: ________________
  Vote: [ ] Carried  [ ] Failed

Item 2: _______________________________________________________________
  Motion: ______________________________________________________________
  Moved by: ________________  Seconded by: ________________
  Vote: [ ] Carried  [ ] Failed

MEMBER QUESTIONS AND OPEN DISCUSSION
--------------------------------------
(Allow members to raise questions or concerns - recommended 15-20 minutes)

ANNOUNCEMENTS
-------------
1. ___________________________________________________________________
2. ___________________________________________________________________
3. Next annual meeting tentatively scheduled for: ______________________

ADJOURNMENT
-----------
Motion to adjourn:
  Moved by: ________________  Seconded by: ________________
  Meeting adjourned at: _____________

Minutes recorded by: ____________________________
Date approved: ____________________________
`,
    faqQuestions: [
      {
        question: 'What is the difference between an annual meeting and a regular board meeting?',
        answer:
          'An annual meeting (also called an annual general meeting or AGM) is open to all members of the organization and covers major governance items: officer elections, approval of financial statements, and any bylaw changes. Board meetings are for directors only and handle ongoing operational decisions. Annual meetings are typically held once per year; board meetings may be held monthly or quarterly.',
      },
      {
        question: 'How much advance notice is required for an annual meeting?',
        answer:
          'Notice requirements vary by your bylaws and your state\'s nonprofit or association laws. A common requirement is 10-30 days written notice sent to all members. The notice must include the date, time, location, and agenda. Check your bylaws - and your state statute if your club is incorporated - for the exact requirements.',
      },
      {
        question: 'What happens if we don\'t reach quorum at the annual meeting?',
        answer:
          'If the required quorum is not present at the start of the meeting, you generally cannot conduct any official business - including elections or financial report approvals. You have two options: reschedule the meeting to a new date (with proper re-notice) or amend your bylaws in advance to establish a lower quorum for a rescheduled meeting. Check your bylaws for your specific rules.',
      },
      {
        question: 'How long should an annual meeting take?',
        answer:
          'Most well-organized annual meetings run 60-90 minutes. Meetings that regularly run more than 2 hours often suffer from poor agenda management, unproductive debate, or insufficient advance preparation. Distributing reports, budgets, and candidate bios in advance means members arrive informed and less discussion is needed on the night.',
      },
    ],
    relatedTemplates: [
      'meeting-minutes-template',
      'meeting-agenda-template',
      'club-budget-template',
    ],
    relatedResources: [],
  },
  {
    slug: 'meeting-agenda-template',
    title: 'Meeting Agenda Template',
    description:
      'A free, ready-to-use meeting agenda template for clubs and organizations. Structure every meeting with clear agenda items, time allocations, and presenter assignments so meetings start on time and stay on track.',
    category: 'meetings',
    keywords: [
      'meeting agenda template',
      'meeting agenda',
      'agenda template',
      'board meeting agenda template',
      'club meeting agenda',
      'meeting agenda format',
    ],
    bluf:
      'A meeting agenda template is a pre-meeting document that lists every topic to be covered, who will present it, and how long each item should take - so every attendee arrives prepared and the meeting runs on schedule. Distribute this template to all attendees at least 24 hours before each meeting.',
    keyTakeaways: [
      'Distributing an agenda before the meeting reduces meeting length by an average of 25 minutes by eliminating agenda disputes at the start.',
      'Assigning a time limit to each agenda item keeps discussions focused and prevents any single topic from consuming the entire meeting.',
      'The agenda should mirror the meeting minutes format so note-takers can record outcomes item by item as the meeting progresses.',
      'Old business items should always precede new business so unresolved matters get addressed before new topics are introduced.',
    ],
    sections: [
      'What is a meeting agenda?',
      'Meeting Agenda Template',
      'How to use this template',
      'Tips for running more effective meetings',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'Collect agenda items before the meeting',
        description:
          'Ask officers, committee chairs, and board members to submit their agenda items 48-72 hours before the meeting. This gives you time to group related topics, estimate time requirements, and identify which items require advance preparation or pre-reading.',
      },
      {
        title: 'Assign time limits and presenters to each item',
        description:
          'For each agenda item, write the name of the person responsible and how many minutes are allocated. Be realistic - most clubs underestimate discussion time. Add a 5-minute buffer at the end for any items that run over.',
      },
      {
        title: 'Distribute the agenda at least 24 hours before',
        description:
          'Send the completed agenda to all attendees the day before the meeting. Members who receive an agenda in advance arrive more prepared, ask better questions, and make faster decisions. Attach any supporting documents referenced in agenda items.',
      },
      {
        title: 'Open the meeting by reviewing the agenda',
        description:
          'At the start of the meeting, briefly review the agenda and ask if any items need to be added, removed, or reordered. Once the agenda is approved, the chair uses it to keep discussions on track and signal when time is running short on a topic.',
      },
      {
        title: 'Match agenda items to your meeting minutes template',
        description:
          'As each agenda item is discussed, the secretary records outcomes in the meeting minutes using the same item numbers and titles. Using matching templates for agendas and minutes creates a clear paper trail linking what was planned to what was decided.',
      },
    ],
    templateBody: `MEETING AGENDA
[Organization Name]

Meeting Type: [Board Meeting / General Meeting / Committee Meeting]
Date: [Month Day, Year]
Time: [Start Time] - [End Time]
Location: [Physical Address or Video Call Link]
Facilitator: [Chair / President Name]
Secretary: [Secretary Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGENDA ITEMS

1. CALL TO ORDER
   Facilitator: [Chair Name]
   Time: 2 minutes
   Action: Chair calls meeting to order and confirms quorum.

2. APPROVAL OF AGENDA
   Facilitator: [Chair Name]
   Time: 1 minute
   Action: Motion to approve agenda as distributed (or amended).

3. APPROVAL OF PREVIOUS MEETING MINUTES
   Facilitator: [Secretary Name]
   Time: 3 minutes
   Action: Motion to approve minutes from [Previous Meeting Date].
   Documents: [Previous Meeting Minutes]

4. OFFICER REPORTS
   Facilitator: Respective Officers
   Time: 15 minutes total

   a. President's Report
      Presenter: [President Name]
      Time: 5 minutes

   b. Treasurer's Report
      Presenter: [Treasurer Name]
      Time: 5 minutes
      Documents: [Current Financial Statement]

   c. Secretary's Report
      Presenter: [Secretary Name]
      Time: 5 minutes

5. COMMITTEE REPORTS
   Facilitator: Committee Chairs
   Time: 10 minutes total

   a. [Committee Name] Report
      Presenter: [Chair Name]
      Time: [X] minutes

   b. [Committee Name] Report
      Presenter: [Chair Name]
      Time: [X] minutes

6. OLD BUSINESS
   Facilitator: [Chair Name]
   Time: [X] minutes

   a. [Unfinished Item from Previous Meeting]
      Status: [Tabled / Referred / Ongoing]
      Action Required: [Vote / Update / Decision]

   b. [Unfinished Item from Previous Meeting]
      Status: [Tabled / Referred / Ongoing]
      Action Required: [Vote / Update / Decision]

7. NEW BUSINESS
   Facilitator: [Chair Name]
   Time: [X] minutes

   a. [New Topic or Proposal]
      Presenter: [Member Name]
      Time: [X] minutes
      Action Required: [Discussion / Vote / Referral to Committee]
      Documents: [Supporting Materials, if any]

   b. [New Topic or Proposal]
      Presenter: [Member Name]
      Time: [X] minutes
      Action Required: [Discussion / Vote / Referral to Committee]

8. OPEN DISCUSSION / MEMBER COMMENTS
   Facilitator: [Chair Name]
   Time: 5 minutes
   Note: Members may raise items not on the agenda. No votes may be taken on unanticipated items.

9. ANNOUNCEMENTS
   Facilitator: [Chair Name]
   Time: 3 minutes

   • [Upcoming Event: Name, Date, Location]
   • [Upcoming Event: Name, Date, Location]
   • [Deadline or Reminder]
   • Next meeting: [Date, Time, Location]

10. ADJOURNMENT
    Facilitator: [Chair Name]
    Time: 1 minute
    Action: Motion to adjourn. Meeting adjourned at [Actual End Time].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTES FOR PREPARATION
• Attach all supporting documents to this agenda before distributing
• Distribute to all attendees at least 24 hours before the meeting
• Confirm quorum requirements before the meeting starts
• Have a copy of the bylaws available for reference`,
    faqQuestions: [
      {
        question: 'What should be included in a meeting agenda?',
        answer:
          'A complete meeting agenda should include the meeting type, date, time, and location; call to order; approval of the previous meeting\'s minutes; officer reports; committee reports; old business (items carried over from previous meetings); new business; open discussion; announcements including the next meeting date; and adjournment. Each item should list the presenter and a time allocation.',
      },
      {
        question: 'How far in advance should a meeting agenda be sent?',
        answer:
          'Send the meeting agenda to all attendees at least 24 hours before the meeting. For meetings that require members to review documents or prepare presentations, distribute the agenda and supporting materials 48-72 hours in advance. Many club bylaws specify a required notice period - check yours before setting a distribution schedule.',
      },
      {
        question: 'What is the difference between a meeting agenda and meeting minutes?',
        answer:
          'A meeting agenda is a planning document distributed before the meeting that lists the topics to be discussed, the order they will be covered, and who will present each item. Meeting minutes are a record created during and after the meeting that documents who attended, what was discussed, what decisions were made, and what action items were assigned. Agendas look forward; minutes look back.',
      },
      {
        question: 'What is the correct order for a meeting agenda?',
        answer:
          'Standard meeting agenda order follows parliamentary procedure: (1) Call to Order, (2) Approval of Agenda, (3) Approval of Previous Minutes, (4) Officer Reports, (5) Committee Reports, (6) Old Business, (7) New Business, (8) Open Discussion, (9) Announcements, (10) Adjournment. Old business must precede new business so unresolved matters are addressed before introducing new topics.',
      },
    ],
    relatedTemplates: ['meeting-minutes-template', 'annual-meeting-agenda-template'],
    relatedResources: ['complete-guide-club-management'],
  },

  // ── GOVERNANCE ────────────────────────────────────────────────────────────
  {
    slug: 'nonprofit-bylaws-template',
    title: 'Nonprofit Bylaws Template',
    description:
      'A free, ready-to-use nonprofit bylaws template for clubs and organizations. Cover all required articles including membership, governance, officers, meetings, and dissolution in a legally structured format you can customize for your group.',
    category: 'governance',
    keywords: [
      'nonprofit bylaws template',
      'bylaws template',
      'club bylaws template',
      'sample bylaws for nonprofit',
      'bylaws template free',
      'how to write bylaws for a nonprofit',
      'organization bylaws template',
    ],
    bluf:
      'A nonprofit bylaws template is a pre-structured governing document that defines your organization\'s name and purpose, membership rules, board structure, officer roles, meeting procedures, and amendment process - the foundational document every club and nonprofit needs before it can hold elections, open a bank account, or apply for 501(c)(3) status.',
    keyTakeaways: [
      'Bylaws are legally required to open a bank account, apply for tax-exempt status, or register as a nonprofit in most U.S. states.',
      'Keep bylaws concise and policy-level - operational details belong in standing rules or policies, which are easier to amend.',
      'Your bylaws must be approved by a vote of the founding members or board before they take effect.',
      'Review and update bylaws every 2-3 years to reflect changes in leadership structure, technology, or applicable state law.',
    ],
    sections: [
      'What are bylaws?',
      'Nonprofit Bylaws Template',
      'How to use this template',
      'Common bylaws mistakes to avoid',
      'Frequently Asked Questions',
    ],
    steps: [
      {
        title: 'Customize the organization name and purpose',
        description:
          'Replace all instances of "[Organization Name]" with your actual name. Write a clear, specific purpose statement in Article I - this language determines what activities your organization can conduct and is critical for 501(c)(3) applications. Avoid vague language like "to promote the general welfare."',
      },
      {
        title: 'Define your membership classes and requirements',
        description:
          'In Article II, specify who qualifies for membership (age, geographic location, professional affiliation, etc.), how dues are set and collected, and what grounds exist for suspension or removal. If you have multiple membership tiers, define each one separately.',
      },
      {
        title: 'Set your board structure and officer roles',
        description:
          'In Articles III and IV, specify how many directors serve on the board, how they are elected or appointed, their terms, and what happens if a seat becomes vacant. List the required officer positions (President, Vice President, Secretary, Treasurer) and their core responsibilities.',
      },
      {
        title: 'Specify meeting and quorum requirements',
        description:
          'In Article V, state how often regular meetings are held, how special meetings are called, what notice members must receive before any meeting, and how many members or directors must be present to conduct business (quorum). Most clubs set quorum at a simple majority of board members.',
      },
      {
        title: 'Have members vote to adopt the bylaws',
        description:
          'Present the completed bylaws at a founding meeting or special meeting called for this purpose. Allow members to propose amendments, then vote to adopt. Record the adoption in your meeting minutes. Keep a signed copy in your records - many banks and state agencies require proof of adoption when registering your organization.',
      },
    ],
    templateBody: `BYLAWS OF [ORGANIZATION NAME]
A [State] Nonprofit Organization

Adopted: [Month Day, Year]
Last Amended: [Month Day, Year]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE I - NAME AND PURPOSE

Section 1.1 Name
The name of this organization is [Organization Name] (hereinafter "the Organization").

Section 1.2 Purpose
The Organization is organized and operated exclusively for [charitable / educational / social / recreational] purposes, specifically: [Insert specific purpose - e.g., "to promote amateur astronomy, provide educational programs for the public, and foster community among astronomy enthusiasts in [City/Region]."]

Section 1.3 Nonprofit Status
The Organization shall be operated as a nonprofit organization. No part of its net earnings shall inure to the benefit of, or be distributable to, its members, directors, officers, or other private persons, except that the Organization is authorized to pay reasonable compensation for services rendered and to make payments in furtherance of its stated purpose.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE II - MEMBERSHIP

Section 2.1 Eligibility
Membership is open to any individual who [Insert eligibility requirements - e.g., "is 18 years of age or older and supports the mission of the Organization."]

Section 2.2 Classes of Membership
The Organization shall have the following classes of members:
  a. Regular Members - [Description, voting rights, dues amount]
  b. Associate Members - [Description, voting rights or restrictions, dues amount]
  c. Honorary Members - [Description, no dues required, non-voting]
  [Delete classes that do not apply]

Section 2.3 Dues
Annual dues for each membership class shall be set by the Board of Directors. Dues are payable on [Date, e.g., January 1] of each calendar year. Members more than [60] days in arrears shall be considered not in good standing and may not vote or hold office.

Section 2.4 Resignation
Any member may resign by submitting written notice to the Secretary. Resignation does not relieve the member of obligations accrued prior to resignation, including unpaid dues.

Section 2.5 Suspension and Removal
A member may be suspended or removed for conduct detrimental to the Organization by a two-thirds (2/3) vote of the Board of Directors, provided that the member has received written notice of the proposed action and an opportunity to respond at least 14 days before the vote.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE III - BOARD OF DIRECTORS

Section 3.1 Authority
The Board of Directors (hereinafter "the Board") shall manage the affairs of the Organization. The Board shall set policy, approve the annual budget, and supervise the Officers.

Section 3.2 Composition
The Board shall consist of [Number, e.g., five (5) to nine (9)] directors, including the Officers specified in Article IV. A majority of directors must be voting members of the Organization.

Section 3.3 Election and Terms
Directors shall be elected by the members at the Annual Meeting by a majority vote of members present and voting. Each director shall serve a term of [One (1) / Two (2)] year(s), beginning on [Date] following election. Directors may serve a maximum of [Number] consecutive terms.

Section 3.4 Vacancies
Vacancies on the Board may be filled by a majority vote of the remaining directors. A director appointed to fill a vacancy shall serve the remainder of the unexpired term.

Section 3.5 Removal
A director may be removed by a two-thirds (2/3) vote of the Board for cause, or by a two-thirds (2/3) vote of the members at any duly called meeting at which a quorum is present.

Section 3.6 Meetings
The Board shall meet at least [quarterly / monthly] at a time and place determined by the President. Special meetings may be called by the President or by any two directors with at least [7] days' written notice to all directors.

Section 3.7 Quorum
A majority of the directors then in office shall constitute a quorum for the transaction of business. The act of a majority of directors present at a meeting at which a quorum is present shall be the act of the Board.

Section 3.8 Compensation
Directors shall serve without compensation for their services as directors, but may be reimbursed for documented, reasonable expenses incurred on behalf of the Organization when approved by the Board.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE IV - OFFICERS

Section 4.1 Officers
The officers of the Organization shall be a President, a Vice President, a Secretary, and a Treasurer. The Board may create additional officer positions as needed.

Section 4.2 Election and Terms
Officers shall be elected by the Board of Directors at its first meeting following the Annual Meeting. Officers shall serve terms of [One (1)] year and may be re-elected for a maximum of [Number] consecutive terms in the same office.

Section 4.3 President
The President shall preside at all meetings of the members and the Board; serve as the chief executive officer of the Organization; represent the Organization in its external relations; and perform such other duties as the Board may assign.

Section 4.4 Vice President
The Vice President shall assist the President; assume the duties of the President in the President's absence or incapacity; and perform such other duties as the Board may assign.

Section 4.5 Secretary
The Secretary shall record and maintain minutes of all meetings of the members and Board; maintain the official records of the Organization; give required notices of meetings; and perform such other duties as the Board may assign.

Section 4.6 Treasurer
The Treasurer shall have custody of the Organization's funds; maintain accurate financial records; present financial reports at each Board meeting; prepare or oversee preparation of the annual financial statement; and perform such other duties as the Board may assign. The Treasurer shall not disburse funds in excess of $[Amount] without Board approval.

Section 4.7 Vacancies
A vacancy in any officer position may be filled by a majority vote of the Board. The officer so elected shall serve the remainder of the unexpired term.

Section 4.8 Removal
An officer may be removed from office by a two-thirds (2/3) vote of the Board whenever, in the Board's judgment, the best interests of the Organization would be served.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE V - MEETINGS OF MEMBERS

Section 5.1 Annual Meeting
An Annual Meeting of the members shall be held each year in [Month or Quarter], at a time and place determined by the Board, for the purpose of electing directors, receiving annual reports, and transacting such other business as may properly come before the meeting. Notice of the Annual Meeting shall be given to all members at least [21] days in advance.

Section 5.2 Regular Meetings
Regular meetings of the members shall be held [monthly / quarterly / as set by the Board]. Notice of each regular meeting shall be given to all members at least [7] days in advance.

Section 5.3 Special Meetings
Special meetings of the members may be called by the President, by a majority of the Board, or upon written petition of at least [10%] of the voting membership. Notice of a special meeting, including the specific purpose, shall be given at least [14] days in advance. Only the business stated in the notice may be transacted.

Section 5.4 Quorum
[One-third (1/3) / One-quarter (1/4) / A majority] of the voting members in good standing shall constitute a quorum for the transaction of business at any member meeting. No business shall be transacted at any meeting without a quorum present.

Section 5.5 Voting
Each member in good standing shall have one vote on each matter submitted to a vote. Proxy voting [is / is not] permitted. [If permitted, add: Proxies must be submitted in writing to the Secretary before the meeting.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE VI - COMMITTEES

Section 6.1 Standing Committees
The Board may establish standing committees to assist with the ongoing work of the Organization. Each standing committee shall operate under a written charter approved by the Board.

Section 6.2 Special Committees
The President or Board may establish special (ad hoc) committees for specific purposes. Special committees shall dissolve upon completion of their assigned task or as directed by the Board.

Section 6.3 Committee Chairs
Committee chairs shall be appointed by the President, subject to Board confirmation, and shall serve for one-year terms. Committee chairs shall report to the Board at each Board meeting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE VII - FINANCES

Section 7.1 Fiscal Year
The fiscal year of the Organization shall begin on [January 1 / July 1] and end on [December 31 / June 30] of each year.

Section 7.2 Depositories
The funds of the Organization shall be deposited in accounts in the name of the Organization at financial institutions selected by the Board. All withdrawals of $[Amount] or more shall require two authorized signatures.

Section 7.3 Annual Budget
The Treasurer shall prepare a proposed annual budget for Board approval before the start of each fiscal year. No expenditure that exceeds the approved budget by more than [10%] in any category may be made without prior Board approval.

Section 7.4 Annual Financial Review
The financial records of the Organization shall be reviewed annually by [an independent CPA / a finance committee / the Board]. A summary of the annual financial review shall be made available to all members.

Section 7.5 Contracts and Checks
All contracts entered into on behalf of the Organization and all checks for amounts in excess of $[Amount] shall be signed by the Treasurer and the President, or their designees as authorized by the Board.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE VIII - CONFLICT OF INTEREST

Section 8.1 Disclosure
Any director, officer, or committee member who has a direct or indirect financial interest in any transaction or matter before the Board or a committee shall disclose that interest to the full Board or committee before any discussion or vote on the matter.

Section 8.2 Recusal
After disclosure, the interested person shall leave the meeting during the discussion and vote on the matter. The remaining directors or committee members shall decide the matter by majority vote. The minutes shall record the disclosure, the recusal, and the outcome.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE IX - PARLIAMENTARY AUTHORITY

The rules contained in the current edition of Robert's Rules of Order Newly Revised shall govern the Organization in all cases to which they are applicable and in which they are not inconsistent with these bylaws or any special rules of order the Organization may adopt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE X - AMENDMENT OF BYLAWS

Section 10.1 Amendment Procedure
These bylaws may be amended at any duly held meeting of the members by a two-thirds (2/3) vote of the members present and voting, provided that written notice of the proposed amendment is given to all members at least [21] days before the meeting at which the vote will be taken.

Section 10.2 Emergency Amendments
In an emergency, the Board may adopt temporary amendments to these bylaws by unanimous vote. Any such emergency amendment shall be submitted for member ratification at the next regular or special meeting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE XI - DISSOLUTION

Upon dissolution of the Organization, the Board shall, after paying or making provision for all liabilities, distribute the remaining assets to one or more organizations that qualify as exempt under Section 501(c)(3) of the Internal Revenue Code (or the corresponding provision of any future U.S. Internal Revenue law) as the Board shall determine. No assets shall be distributed to members, directors, or officers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CERTIFICATION OF ADOPTION

These bylaws were duly adopted by the [founding members / Board of Directors] of [Organization Name] at a [special / regular] meeting held on [Month Day, Year].

President: ___________________________ Date: ___________
[Printed Name]

Secretary: ___________________________ Date: ___________
[Printed Name]`,
    faqQuestions: [
      {
        question: 'Are bylaws required for a nonprofit organization?',
        answer:
          'Yes. Most U.S. states require nonprofits to have bylaws to incorporate as a nonprofit corporation. The IRS also requires a copy of your bylaws when you apply for 501(c)(3) tax-exempt status. Beyond legal requirements, bylaws are essential for opening a bank account in the organization\'s name, establishing credibility with donors and grant-makers, and resolving governance disputes.',
      },
      {
        question: 'What is the difference between bylaws and articles of incorporation?',
        answer:
          'Articles of incorporation (or a certificate of incorporation) are the document filed with your state government to legally create the nonprofit corporation - typically a short document stating the organization\'s name, purpose, and registered agent. Bylaws are the internal governing rules that specify how the organization operates: membership requirements, board structure, meeting procedures, and amendment processes. Both are required for a fully formed nonprofit.',
      },
      {
        question: 'How long should nonprofit bylaws be?',
        answer:
          'Effective bylaws are typically 4-12 pages. Shorter bylaws that cover the essentials are often better than longer ones, because overly detailed bylaws can become difficult to follow and require frequent amendments. Put operational details (specific event procedures, detailed job descriptions) in separate policies or standing rules, which are easier to update than bylaws.',
      },
      {
        question: 'How do you amend nonprofit bylaws?',
        answer:
          'To amend bylaws, provide written notice of the proposed amendment to all members at least 21 days before the meeting (or whatever notice period your current bylaws specify), then hold a vote at a properly noticed meeting. Most bylaws require a two-thirds (2/3) supermajority to pass an amendment. Record the amendment and adoption vote in your meeting minutes.',
      },
    ],
    relatedTemplates: ['annual-meeting-agenda-template', 'meeting-agenda-template'],
    relatedResources: ['leadership-governance-frameworks'],
  },
]

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getTemplateBySlug(slug: string): TemplateEntry | undefined {
  return TEMPLATES.find((t) => t.slug === slug)
}

export function getTemplatesByCategory(category: TemplateCategory): TemplateEntry[] {
  return TEMPLATES.filter((t) => t.category === category)
}
