import { SEED_ANNUAL_PRICE_COPY, SEED_MONTHLY_PRICE_COPY } from '../pricing';
// ---------------------------------------------------------------------------
// How-to-Start pSEO data - 40 org types
// Research source: internal keyword research (not published in this snapshot)
// ---------------------------------------------------------------------------

export const HOW_TO_START_CATEGORIES = [
  'sports',
  'community',
  'hobby',
  'professional',
  'youth',
] as const

export type HowToStartCategory = (typeof HOW_TO_START_CATEGORIES)[number]

export interface HowToStartEntry {
  slug: string
  orgType: string
  title: string
  description: string
  category: HowToStartCategory
  steps: Array<{ title: string; description: string }>
  legalRequirements: string
  estimatedStartupCost: string
  minMembersToLaunch: string
  commonMistakes: string[]
  toolsNeeded: string[]
  faqQuestions: Array<{ question: string; answer: string }>
  keywords: string[]
  relatedClubTypes: string[]
  relatedResources: string[]
}

export const HOW_TO_START_ENTRIES: HowToStartEntry[] = [
  // ── SPORTS ──────────────────────────────────────────────────────────────
  {
    slug: 'pickleball-club',
    orgType: 'Pickleball Club',
    title: 'How to Start a Pickleball Club',
    category: 'sports',
    description:
      'Pickleball has been the fastest-growing sport in America for several consecutive years, per the Sports & Fitness Industry Association (SFIA). Starting a pickleball club gives your community access to organized play, group lessons, social events, and competitive tournaments. This step-by-step guide covers securing court access, affiliating with USA Pickleball, obtaining liability insurance, organizing your first round-robin tournament, and setting up online dues collection - so you can launch with confidence and keep players coming back.',
    steps: [
      {
        title: 'Assess local demand and secure court time',
        description:
          'Survey friends and neighbors to gauge interest. Contact your local parks and recreation department, YMCA, or tennis facilities to negotiate recurring court reservations. Many parks departments will designate pickleball-specific courts if enough residents petition for it - bring a signed list of interested players to strengthen your case. Aim to secure at least 4 hours of guaranteed weekly court time before announcing your club publicly.',
      },
      {
        title: 'Form a founding committee',
        description:
          'Recruit 3-5 dedicated organizers who will share leadership responsibilities. Assign roles: president, treasurer, and court scheduler at minimum. A founding committee prevents burnout and creates organizational resilience. Identify a "tournament director" early - pickleball members expect organized round-robins and ladder play, and having a dedicated person prevents this from falling on one overwhelmed leader.',
      },
      {
        title: 'Choose a legal structure',
        description:
          'Small informal clubs can operate as an unincorporated association. Larger clubs with dues, equipment, or events benefit from filing as a 501(c)(7) social club nonprofit. Consult a local attorney if you expect annual gross receipts above $5,000. Clubs that want to host USA Pickleball-sanctioned tournaments must be formally organized entities.',
      },
      {
        title: 'Draft bylaws and obtain an EIN',
        description:
          'Bylaws should cover membership tiers, dues amounts, court scheduling rules, guest player policies, disciplinary procedures, and officer election processes. Apply for an EIN at IRS.gov (free) before opening a club bank account. Include a court etiquette policy - disputes over court rotation are one of the most common friction points in new pickleball clubs.',
      },
      {
        title: 'Open a club bank account',
        description:
          'Keep club funds completely separate from personal finances. Most banks require an EIN and a copy of your bylaws or charter. A dedicated account protects officers from personal liability and simplifies tax reporting. Set up a debit card for the court scheduler to handle small purchases like balls and net tape without requiring officer approval.',
      },
      {
        title: 'Affiliate with USA Pickleball',
        description:
          'USA Pickleball club membership costs $60-$150/year and provides access to group liability insurance, tournament sanctioning, rating system access (DUPR integration), and coaching resources. Affiliation is essential if you want to run sanctioned tournaments or access USA Pickleball\'s member discount programs for equipment. Insurance coverage is the primary reason most clubs affiliate - it protects your club and its officers during sanctioned events.',
      },
      {
        title: 'Obtain liability insurance',
        description:
          'Even before your first organized event, secure a general liability policy. USA Pickleball-affiliated clubs access group coverage; independent clubs can purchase standalone event or club liability insurance. Typical coverage is $1M-$2M per occurrence for small recreational clubs at $200-$600/year. Many parks departments and facility managers require a certificate of insurance before allowing organized play.',
      },
      {
        title: 'Organize your equipment inventory and skill-level groupings',
        description:
          'Purchase a stock of loaner paddles and balls for new players - this removes the barrier to first attendance. Establish skill-level groupings (beginner, intermediate, advanced) for open play sessions. Post ratings criteria clearly so players can self-select appropriately. Avoid mixing skill levels at first; nothing drives away beginners faster than being outplayed by advanced members.',
      },
      {
        title: 'Set up membership management and scheduling tools',
        description:
          'Use a platform like GatherGrove to manage member sign-ups, collect dues, schedule court time, track tournament registrations, and send announcements. Starting with proper software prevents the spreadsheet chaos that plagues growing clubs - especially as you add round-robins, ladder leagues, and social events to your calendar.',
      },
    ],
    legalRequirements:
      'No mandatory legal structure for informal clubs. For formal clubs: Articles of Incorporation (state nonprofit), EIN from IRS, 501(c)(7) filing (IRS Form 1024, optional but recommended for clubs with annual gross receipts above $5,000). USA Pickleball affiliation required for sanctioned tournament hosting. Most facilities require a certificate of insurance naming them as additionally insured before allowing organized play on their courts.',
    estimatedStartupCost: '$600-$3,000 first year (USA Pickleball membership $60-$150, insurance $200-$600, equipment $300-$1,500)',
    minMembersToLaunch: '6',
    commonMistakes: [
      'Hosting organized events before obtaining liability insurance - facilities can terminate your court access immediately',
      'Over-relying on a single facility that can revoke court access; always have a backup court option',
      'No formal governing documents, leading to leadership disputes about court time allocation and tournament selection',
      'Mixing club finances with personal bank accounts, creating personal liability exposure for officers',
      'Skipping skill-level groupings at open play - mixing beginners and advanced players frustrates both groups and increases member churn',
      'Not budgeting for ball replacement; a club playing 3x/week goes through 2-3 dozen balls per month',
    ],
    toolsNeeded: [
      'Membership management software (GatherGrove)',
      'Court scheduling and reservation system',
      'Payment processing for dues and tournament entry fees',
      'Group communication tool (email or messaging app)',
      'Tournament bracket software for round-robins and ladder play',
    ],
    faqQuestions: [
      {
        question: 'How many members do you need to start a pickleball club?',
        answer:
          'You can start with as few as 6 founding members, but most sustainable clubs launch with 15-25 players to ensure enough people show up for organized play sessions. USA Pickleball requires at least 5 members for club affiliation.',
      },
      {
        question: 'Do I need to incorporate to start a pickleball club?',
        answer:
          'No. Small informal pickleball clubs can operate as unincorporated associations. However, if your club will collect dues, own equipment, or host events, incorporating as a 501(c)(7) nonprofit provides liability protection for officers and enables a formal bank account.',
      },
      {
        question: 'What insurance does a pickleball club need?',
        answer:
          'General liability insurance with $1M-$2M per occurrence is the minimum recommended. USA Pickleball-affiliated clubs can access group insurance rates of $200-$600/year for small recreational clubs. This covers injuries that occur during club activities. Many parks departments also require clubs to carry insurance and name the facility as additionally insured.',
      },
      {
        question: 'How do pickleball clubs collect dues?',
        answer:
          'Most clubs charge annual dues of $20-$100 per member. Modern clubs use membership management software with integrated payment processing so members can pay online via credit card or ACH. This eliminates cash handling and creates automatic payment records.',
      },
      {
        question: 'How do we get access to pickleball courts for our club?',
        answer:
          'Start by contacting your local parks and recreation department - many cities allocate court time for organized clubs through a permit process. YMCA facilities, tennis centers, and community recreation centers are also good options. Bring evidence of member interest (a sign-up list) to strengthen your permit application. Some clubs purchase portable nets to use on any flat surface when dedicated courts are unavailable.',
      },
      {
        question: 'Should our club affiliate with USA Pickleball?',
        answer:
          'Affiliation is strongly recommended for clubs that want to run sanctioned tournaments, access group liability insurance, or use USA Pickleball\'s rating systems. The annual club fee ($60-$150) typically pays for itself through insurance savings and member recruitment from the USA Pickleball club finder. Informal recreational groups that only do casual open play can operate independently, though they should still carry their own liability insurance.',
      },
    ],
    keywords: ['how to start a pickleball club', 'pickleball club formation', 'starting a local pickleball group', 'pickleball club organizer', 'start pickleball club', 'USA Pickleball affiliate club'],
    relatedClubTypes: ['running-clubs', 'tennis-clubs', 'cycling-clubs'],
    relatedResources: [],
  },
  {
    slug: 'running-club',
    orgType: 'Running Club',
    title: 'How to Start a Running Club',
    category: 'sports',
    description:
      'Running clubs bring people together around a shared love of movement - and the right structure turns a casual group into a lasting community. Whether you envision a social fun-run group, a marathon training program, or a competitive local race team, this guide covers every step: establishing safe routes, obtaining road-use permits, setting up pace groups, affiliating with RRCA for liability insurance, and managing member registrations for organized races.',
    steps: [
      {
        title: 'Define your club identity and focus',
        description:
          'Decide whether your club is casual and social (weekly fun runs, post-run coffee), training-focused (marathon programs, speed workouts), or competitive (local race teams). Your identity shapes everything: routes, pace groupings, dues structure, and the type of runner you attract. Clubs that try to serve all levels without dedicated pace groupings often struggle to retain both beginners and serious runners.',
      },
      {
        title: 'Establish routes and a meeting location',
        description:
          'Choose 2-3 go-to routes at different distances and difficulty levels. Pick a consistent home base - a running store, coffee shop, or park trailhead - that provides parking, restrooms, and a gathering space. Map your routes on Strava or Komoot and share them with members in advance. For routes that cross roads or use trails managed by parks authorities, verify whether a use permit is required before your first organized group run.',
      },
      {
        title: 'Obtain permits for group runs on public roads',
        description:
          'Group runs with 10 or more participants on public roads or park trails often require a permit from your local parks department, city, or county. Contact your parks department and public works office at least 4-6 weeks before your first organized run. Permit fees vary widely - some municipalities charge nothing for recreational groups, while others charge $25-$150 per event. Road crossings at intersections may require a traffic control plan.',
      },
      {
        title: 'Recruit founding members',
        description:
          'Post in local Facebook groups, Nextdoor, Strava, and running store bulletin boards. Host a no-commitment "first run" to let people try the club before committing. Aim for 10-20 founding members who share your club\'s vision.',
      },
      {
        title: 'Draft a simple constitution and bylaws',
        description:
          'Even for informal clubs, a 1-2 page document covering purpose, membership, dues, officer roles, and dissolution procedure prevents disputes later. Include a safety protocol: what happens if a runner is injured on a group run, how pace leaders are designated, and the process for reporting route hazards. For incorporated clubs, more formal bylaws are required.',
      },
      {
        title: 'Affiliate with RRCA for insurance and resources',
        description:
          `The Road Runners Club of America (RRCA) offers club membership at $50-${SEED_ANNUAL_PRICE_COPY}, which includes access to group liability insurance ($115-$300/year), coaching certification, and organizational resources. This is the most cost-effective way for running clubs to obtain liability coverage. RRCA insurance typically requires members to sign a liability waiver - build this into your member onboarding process.`,
      },
      {
        title: 'Require liability waivers from all members',
        description:
          'Every member should sign a written liability waiver before participating in club runs. A waiver does not eliminate your liability entirely, but it establishes informed consent, documents your safety protocols, and is often required by your insurance carrier. Digital waivers collected through your membership management platform create an auditable record.',
      },
      {
        title: 'Obtain an EIN and open a club bank account',
        description:
          'Apply for a free EIN at IRS.gov. Open a dedicated checking account using the EIN. Never use personal accounts for club funds - this protects officers from personal liability and keeps accounting clean.',
      },
      {
        title: 'Set up membership management software',
        description:
          'Use a tool like GatherGrove to manage member registration, collect dues, gather signed waivers, send weekly run reminders, and track attendance. This replaces the email list + spreadsheet combination that breaks down once you exceed 30 members.',
      },
      {
        title: 'Plan your first official club event',
        description:
          'Host a group run followed by a social gathering within your first month. Events build community faster than anything else. Consider a low-key "founder\'s run" that establishes your club\'s traditions from day one.',
      },
    ],
    legalRequirements:
      'Informal clubs: no legal structure required, though an EIN and bank account are recommended once dues are collected. Formal/incorporated clubs: state nonprofit corporation filing, EIN, and optionally 501(c)(7) or 501(c)(3) depending on focus. Event permits required for organized group runs on public roads or managed trails - check with your local parks and public works department. Liability waivers required by most insurance carriers.',
    estimatedStartupCost: '$200-$1,500 first year (RRCA membership $50-$90, insurance $115-$300, event permits $50-$500 per race)',
    minMembersToLaunch: '8',
    commonMistakes: [
      'Hosting organized group runs without liability insurance - a single injury incident can expose club officers to personal liability',
      'No formal succession plan when founding leaders move or burn out',
      'Pace groups that are too broad, frustrating both fast and slow runners',
      'Failing to get event permits for organized runs on public roads or park trails',
      'Not collecting signed liability waivers from members before their first run',
      'Planning routes that cross high-traffic intersections without a designated marshal or traffic control plan',
    ],
    toolsNeeded: [
      'Membership management software with digital waiver collection (GatherGrove)',
      'Route planning app (Strava, Garmin Connect, or Komoot)',
      'Payment processing for dues and race registrations',
      'Group messaging platform',
    ],
    faqQuestions: [
      {
        question: 'How do I find members for a new running club?',
        answer:
          'Post in local Facebook running groups, Nextdoor, and Strava local clubs. Partner with a local running store - many will let you host post-run gatherings in exchange for promotion. Attend local 5K races and hand out flyers. Your first 10-15 members are typically friends and neighbors who already run.',
      },
      {
        question: 'Do running clubs need to be a nonprofit?',
        answer:
          'No. Many running clubs operate as informal unincorporated associations, especially when they\'re social-focused and small. However, if your club collects dues, hosts events, or accumulates assets, incorporating as a nonprofit (501c7 for social clubs, 501c3 for athletic development focus) provides important liability protection.',
      },
      {
        question: 'What does RRCA membership provide for a running club?',
        answer:
          `RRCA (Road Runners Club of America) membership costs $50-${SEED_ANNUAL_PRICE_COPY} and provides access to group liability insurance ($115-$300/year depending on club size), coaching certification programs, race management resources, and a national network. The insurance benefit alone typically justifies the cost.`,
      },
      {
        question: 'Do I need a permit to run on public roads with my club?',
        answer:
          'It depends on your jurisdiction and group size. Most cities and counties require an event permit for organized group runs of 10 or more participants on public roads or in parks. Even for smaller groups, running store-to-store or on high-traffic roads may trigger permit requirements. Contact your local parks department and public works office 4-6 weeks before your first organized run to confirm requirements.',
      },
      {
        question: 'How do I organize runners by pace?',
        answer:
          'The most common system uses pace per mile: assign groups such as 8-9 min/mile, 10-11 min/mile, and 12+ min/mile. Designate a pace leader for each group who maintains a consistent speed and stays with the slowest member. Survey new members on their comfortable pace during sign-up. Re-evaluate groupings seasonally as your membership mix changes. A pace group system is the single biggest factor in retaining beginner runners.',
      },
    ],
    keywords: ['how to start a running club', 'running club formation guide', 'starting a local running group', 'start a run club', 'running group organizer', 'running club permit public roads'],
    relatedClubTypes: ['running-clubs', 'cycling-clubs', 'hiking-clubs'],
    relatedResources: [],
  },
  {
    slug: 'cycling-club',
    orgType: 'Cycling Club',
    title: 'How to Start a Cycling Club',
    category: 'sports',
    description:
      'Cycling clubs foster community, safety, and shared adventure on two wheels. This guide covers everything from structuring your club for road, gravel, or mountain disciplines to securing insurance and managing member rosters.',
    steps: [
      {
        title: 'Choose your cycling discipline and skill focus',
        description:
          'Road cycling, mountain biking, gravel riding, and commuter cycling each attract different communities. Define whether your club will be recreational, fitness-oriented, or competitive. Skill-level groupings (A/B/C rides) are essential for retaining beginners while challenging advanced riders.',
      },
      {
        title: 'Establish regular group ride schedules',
        description:
          'Consistency is the foundation of any successful cycling club. Pick 1-2 weekly ride days, define start locations, and publish distances and pace expectations in advance. Clear ride descriptions prevent mismatches between rider expectations and actual difficulty.',
      },
      {
        title: 'Draft a ride waiver and safety protocol',
        description:
          'All participants should sign a liability waiver before joining group rides. Establish helmet requirements, hand signal standards, and a rider-down protocol. Post these on your website or member portal so expectations are unambiguous.',
      },
      {
        title: 'Affiliate with USA Cycling or a regional club',
        description:
          'USA Cycling club membership provides access to sanctioned racing, coaching certifications, and group insurance. For recreational-only clubs, many choose to affiliate with a regional cycling federation or remain independent with their own commercial insurance.',
      },
      {
        title: 'Draft bylaws and choose a legal structure',
        description:
          'Informal clubs can use a simple constitution. Clubs with annual dues above $5,000 or organized racing should consider 501(c)(7) nonprofit status. Draft bylaws covering membership, dues, officer election, discipline, and dissolution.',
      },
      {
        title: 'Obtain an EIN and open a club bank account',
        description:
          'Apply for a free EIN at IRS.gov. Use it to open a dedicated club checking account. Never commingle club and personal funds.',
      },
      {
        title: 'Purchase liability insurance',
        description:
          'General liability coverage protects the club if a member is injured during a club activity. USA Cycling offers insurance for affiliated clubs. Independent clubs can purchase coverage through specialty sports insurers for $300-$1,000/year.',
      },
      {
        title: 'Set up membership and communication tools',
        description:
          'Use a platform like GatherGrove to manage member registrations, collect annual dues, publish ride calendars, and send post-ride summaries. Automated reminders significantly improve ride attendance.',
      },
    ],
    legalRequirements:
      'No required legal structure for informal clubs. Recommend: EIN (free), club bank account, liability waiver for all participants. Optional: state nonprofit filing + 501(c)(7) for clubs with significant dues revenue.',
    estimatedStartupCost: '$400-$2,000 first year (insurance $300-$1,000, USA Cycling affiliation $150-$400, misc supplies)',
    minMembersToLaunch: '8',
    commonMistakes: [
      'No liability waivers before group rides',
      'Pace groups too vague, causing unsafe mixed-ability rides',
      'No clear protocols for mechanical breakdowns or rider injuries on rides',
      'Failure to document officer succession',
    ],
    toolsNeeded: [
      'Membership management software (GatherGrove)',
      'Ride-tracking app (Strava, Garmin)',
      'Route-sharing platform',
      'Group messaging app',
    ],
    faqQuestions: [
      {
        question: 'Do I need insurance to run a cycling club?',
        answer:
          'Yes. General liability insurance is strongly recommended before hosting any group rides. If a member is injured during a club event and you have no insurance, you and your officers could face personal liability. Coverage through USA Cycling or specialty sports insurers typically costs $300-$1,000/year.',
      },
      {
        question: 'How do cycling clubs typically structure membership dues?',
        answer:
          'Most recreational cycling clubs charge $25-$100/year for annual membership. Some clubs use tiered dues based on ride frequency or racing participation. Dues typically cover insurance, club gear, event costs, and administrative expenses.',
      },
    ],
    keywords: ['how to start a cycling club', 'cycling club formation', 'start a bike club', 'bicycle club organizer'],
    relatedClubTypes: ['cycling-clubs', 'running-clubs', 'hiking-clubs'],
    relatedResources: [],
  },
  {
    slug: 'hiking-club',
    orgType: 'Hiking Club',
    title: 'How to Start a Hiking Club',
    category: 'sports',
    description:
      'Hiking clubs connect outdoor enthusiasts, promote fitness, and build lasting friendships on the trail. This guide walks you through founding a hiking club, from planning your first group hike to handling waivers and member management.',
    steps: [
      {
        title: 'Define your hiking focus and difficulty range',
        description:
          'Decide on hike difficulty levels (easy, moderate, strenuous), typical distances, and geographic range. Clubs that offer multiple difficulty tiers attract more members and retain beginners who might otherwise feel excluded.',
      },
      {
        title: 'Scout and document regular hiking routes',
        description:
          'Build a library of 10-20 documented hikes with elevation gain, distance, trailhead GPS coordinates, and trail conditions notes. This content forms the backbone of your trip calendar and can be shared on your club website.',
      },
      {
        title: 'Establish a trip leader program',
        description:
          'Recruit and train volunteer trip leaders who can safely lead groups. Define leader responsibilities: pre-hike route assessment, weather monitoring, first aid kit requirements, and post-hike check-in procedures.',
      },
      {
        title: 'Draft a liability waiver and safety policy',
        description:
          'All participants should acknowledge risks by signing a waiver before their first hike. Define minimum gear requirements (water, navigation, emergency whistle), and your club\'s policy on turning back in unsafe conditions.',
      },
      {
        title: 'Choose a legal structure and get an EIN',
        description:
          'Small informal clubs can operate as unincorporated associations. Clubs collecting dues should get a free EIN and open a bank account. Larger clubs with paid staff or significant assets benefit from 501(c)(7) nonprofit status.',
      },
      {
        title: 'Obtain liability insurance',
        description:
          'Group liability insurance for outdoor clubs typically costs $200-$600/year. American Hiking Society and some state hiking associations offer group insurance programs. Many public land managers also require proof of insurance for permitted group events.',
      },
      {
        title: 'Set up membership management tools',
        description:
          'Use a platform like GatherGrove to manage member sign-ups, collect dues, publish trip calendars, and track RSVP counts. Knowing headcounts in advance is critical for trip planning and carpooling logistics.',
      },
      {
        title: 'Plan and lead your first club hike',
        description:
          'Choose an accessible moderate hike for your launch event to maximize turnout. Promote it through local outdoor gear stores, Meetup.com, Facebook groups, and Nextdoor. Capture photos and testimonials to use in future promotion.',
      },
    ],
    legalRequirements:
      'No mandatory legal structure for informal clubs. Recommend signed liability waivers for all participants. Some permit-required trails need proof of liability insurance. Optional: EIN, club bank account, 501(c)(7) filing for clubs with meaningful dues revenue.',
    estimatedStartupCost: '$200-$800 first year (insurance $200-$600, supplies, permit fees $0-$200)',
    minMembersToLaunch: '6',
    commonMistakes: [
      'No liability waivers before hikes',
      'Trips too advanced for the membership base, leading to safety incidents and attrition',
      'No trip leader training or standards',
      'Not checking permit requirements for group hikes on federal/state lands',
    ],
    toolsNeeded: [
      'Membership management software (GatherGrove)',
      'Trail mapping app (AllTrails, Gaia GPS)',
      'Group communication platform',
      'Online waiver collection tool',
    ],
    faqQuestions: [
      {
        question: 'How large should a hiking club be before formalizing?',
        answer:
          'Most hiking clubs should consider formalizing - getting an EIN, opening a bank account, and drafting bylaws - once they have 20+ regular members or start collecting dues. Before that, a simple liability waiver and a shared communication channel are usually sufficient.',
      },
      {
        question: 'What permits do hiking clubs need?',
        answer:
          'Requirements vary by land manager. National Forest and BLM lands generally require a Special Use Permit for organized groups of 25+. National Parks have their own permit systems. State parks vary by state. Check with each land manager before organizing group hikes on their land.',
      },
    ],
    keywords: ['how to start a hiking club', 'hiking club formation', 'start an outdoor club', 'hiking group organizer'],
    relatedClubTypes: ['hiking-clubs', 'running-clubs', 'cycling-clubs'],
    relatedResources: [],
  },
  {
    slug: 'tennis-league',
    orgType: 'Tennis League',
    title: 'How to Start a Tennis League',
    category: 'sports',
    description:
      'A local tennis league transforms individual players into a competitive community. This guide covers everything from registering with the USTA to scheduling round-robins and collecting season fees.',
    steps: [
      {
        title: 'Assess player interest and court availability',
        description:
          'Survey potential participants to gauge interest and availability. Secure court time commitments from your local tennis facility, parks department, or private club before publicizing the league.',
      },
      {
        title: 'Choose a league format',
        description:
          'Popular formats include round-robin (everyone plays everyone), ladder leagues (challenge-based rankings), and flight brackets (players grouped by skill level). Round-robins are easiest to administer for new leagues.',
      },
      {
        title: 'Register with USTA or operate independently',
        description:
          'USTA (United States Tennis Association) sanctioned leagues provide official rankings, match formats, and regional/national competition pathways. Registration costs $20-$40 per player annually. Independent leagues have more scheduling flexibility but no national ranking integration.',
      },
      {
        title: 'Draft league rules and a registration form',
        description:
          'Document match format, default rules, substitution policies, playoff structure, and dispute resolution procedures. Publish these before the first season so all participants have the same expectations.',
      },
      {
        title: 'Collect season fees',
        description:
          'Typical season fees range from $30-$80 per player for a 10-week season. Fees cover court costs, balls, and administrative costs. Use online payment processing to collect fees before the season starts - avoid managing cash.',
      },
      {
        title: 'Build the match schedule',
        description:
          'Create a schedule 2-3 weeks before the season starts. Include home/away designations if courts are split between locations. Distribute via email and publish on your league\'s website or member portal.',
      },
      {
        title: 'Set up league management tools',
        description:
          'Use a platform that handles member registration, fee collection, match scheduling, and score reporting. GatherGrove\'s event and member tools cover most league administration needs.',
      },
      {
        title: 'Plan a season-end event',
        description:
          'A finals day or season-closing social event builds community and motivates players to return next season. Even a simple post-match gathering with food and trophy presentation dramatically improves retention.',
      },
    ],
    legalRequirements:
      'Small recreational leagues typically operate informally. Recommend: EIN for bank account, liability waiver for participants. USTA registration required for sanctioned leagues. No nonprofit filing required for most local recreational leagues.',
    estimatedStartupCost: '$300-$1,500 first season (court fees, balls, USTA registration $20-$40/player, admin costs)',
    minMembersToLaunch: '8',
    commonMistakes: [
      'No written rules before the first season, causing disputes',
      'Collecting fees in cash without receipts or records',
      'Overly complex format that\'s hard to administer with limited volunteers',
      'No clear makeup match policy',
    ],
    toolsNeeded: [
      'League management software (GatherGrove)',
      'Online payment collection',
      'Match scheduling tool',
      'Score reporting system',
    ],
    faqQuestions: [
      {
        question: 'How many players do you need to start a tennis league?',
        answer:
          'A minimum of 8 players is needed for most formats. Round-robin leagues work well with 8-16 players per division. Ladder leagues can accommodate 20-50+ players. Plan for some attrition each season and recruit slightly above your target number.',
      },
      {
        question: 'Should a local tennis league affiliate with USTA?',
        answer:
          'USTA affiliation makes sense if players want official ratings, regional competition opportunities, or access to USTA\'s league management tools. Independent leagues have more flexibility on format and scheduling. Most recreational leagues start independent and consider USTA affiliation as they grow.',
      },
    ],
    keywords: ['how to start a tennis league', 'start a tennis club', 'tennis league formation', 'recreational tennis league'],
    relatedClubTypes: ['sports-clubs', 'pickleball-clubs'],
    relatedResources: [],
  },
  // ── COMMUNITY ────────────────────────────────────────────────────────────
  {
    slug: 'nonprofit-organization',
    orgType: 'Nonprofit Organization',
    title: 'How to Start a Nonprofit Organization',
    category: 'community',
    description:
      'Starting a nonprofit organization is one of the most structured paths to creating lasting community impact, but the legal process requires precision: you must incorporate at the state level before applying for federal 501(c)(3) tax-exempt status. This guide walks through every step - from defining your mission and assembling a founding board to filing IRS Form 1023 - so your organization launches on legally solid footing and is positioned to accept tax-deductible donations from day one.',
    steps: [
      {
        title: 'Define your mission and test the idea',
        description:
          'Write a single-sentence mission statement that clearly states who you serve, what you do, and why. Your purpose must qualify under IRS 501(c)(3) categories: charitable, educational, religious, scientific, or literary. Vague missions ("to help people") invite IRS scrutiny. Test your concept by talking to potential beneficiaries and potential donors before spending money on legal filings.',
      },
      {
        title: 'Recruit your founding board of directors',
        description:
          'Most states require a minimum of 3 board members to form a nonprofit corporation, though 5-7 is recommended for governance resilience. Board members have fiduciary duties (duty of care, duty of loyalty, duty of obedience) and are legally accountable for the organization. Choose people with diverse skills: legal, financial, operational, and domain expertise in your mission area.',
      },
      {
        title: 'Draft and adopt bylaws',
        description:
          'Bylaws are the internal rulebook of your organization and are required for both 501(c)(3) status and to open a bank account. They must cover: board structure and officer roles, meeting frequency and quorum requirements, how officers are elected and removed, amendment procedures, conflict-of-interest policy, and a dissolution clause directing remaining assets to another 501(c)(3). Adopt bylaws at your first board meeting and retain a signed copy in your corporate records.',
      },
      {
        title: 'Incorporate as a nonprofit in your state',
        description:
          'File Articles of Incorporation as a nonprofit corporation with your state\'s Secretary of State - this must happen before any IRS filing. State fees range from $25 to $100. Your articles must include: the nonprofit purpose statement, a prohibition on private inurement (no profits distributed to founders or directors), and a dissolution clause specifying that remaining assets go to another 501(c)(3). Many states have a standard nonprofit corporation act template you can follow.',
      },
      {
        title: 'Apply for an EIN from the IRS',
        description:
          'Apply for a free Employer Identification Number (EIN) at IRS.gov using Form SS-4. You receive it immediately when applying online. The EIN is required to open a bank account, hire employees, and apply for tax-exempt status. This step takes about 10 minutes once you are incorporated.',
      },
      {
        title: 'File for 501(c)(3) tax-exempt status',
        description:
          'Submit IRS Form 1023-EZ ($275 filing fee) if your organization expects to receive under $50,000 in annual gross receipts in each of its first three years and has total assets under $250,000. File Form 1023 ($600 fee) if your organization is larger or more complex. Form 1023-EZ is typically approved in 2-4 weeks; Form 1023 takes 3-6 months. Your organization can legally accept tax-deductible donations while your application is pending, as long as you are ultimately approved.',
      },
      {
        title: 'Open a bank account and set up management systems',
        description:
          'Open a dedicated nonprofit bank account using your EIN, Articles of Incorporation, and bylaws. Never commingle organizational and personal funds. Also register for state charitable solicitation (required in most states if you publicly fundraise) and set up your member and volunteer management tools from day one - disorganized records are one of the most common early mistakes.',
      },
    ],
    legalRequirements:
      'Required: State Articles of Incorporation as nonprofit corporation ($25-$100, varies by state), EIN from IRS (free, Form SS-4), IRS Form 1023-EZ ($275) or Form 1023 ($600) for 501(c)(3) status, state charitable solicitation registration (required in ~40 states if soliciting donations), annual IRS Form 990 or 990-EZ filing. Optional but recommended: state income tax exemption application (separate from federal exemption) and state sales tax exemption application.',
    estimatedStartupCost: '$275-$600 (IRS filing fee for Form 1023-EZ is $275; full Form 1023 is $600). Add state incorporation fee of $25-$100. Optional: attorney fees of $1,000-$3,000 for assistance with formation documents.',
    minMembersToLaunch: '3 founding board members minimum (most states require at least 3 directors)',
    commonMistakes: [
      'Mixing personal and organizational finances before getting an EIN and dedicated bank account',
      'Skipping bylaws - they are required for 501(c)(3) status and most bank accounts',
      'Applying for 501(c)(3) status before incorporating at the state level - the IRS requires proof of state incorporation',
      'Naming the organization too broadly - IRS scrutinizes vague mission statements and may delay or deny approval',
      'Not setting up a member and volunteer management system from day one, leading to disorganized records that cause compliance problems later',
    ],
    toolsNeeded: [
      `Member management software (GatherGrove - Seed plan from ${SEED_MONTHLY_PRICE_COPY} for nonprofits)`,
      'Accounting software (QuickBooks Nonprofit or Wave)',
      'IRS Form 1023-EZ or Form 1023 (for 501(c)(3) status)',
      'State nonprofit incorporation forms (varies by state - check your Secretary of State website)',
    ],
    faqQuestions: [
      {
        question: 'How long does it take to start a nonprofit?',
        answer:
          'The fastest path is 6-8 weeks: state incorporation takes 1-2 weeks, and IRS Form 1023-EZ is typically approved in 2-4 weeks. Full Form 1023 takes 3-6 months for IRS review. Add time for board recruitment, bylaw drafting, and state charitable solicitation registration. Plan for a minimum of 2-3 months from first steps to full operational status.',
      },
      {
        question: 'How much does it cost to start a nonprofit?',
        answer:
          'The minimum cost to start a nonprofit is approximately $300-$700: state incorporation fees of $25-$100 plus the IRS Form 1023-EZ filing fee of $275 (or $600 for full Form 1023). If you hire an attorney to assist with formation documents, add $1,000-$3,000. There is no fee to obtain an EIN.',
      },
      {
        question: 'What is the difference between a nonprofit and a 501(c)(3)?',
        answer:
          'A nonprofit is a state-level legal designation - your organization incorporates as a nonprofit corporation under state law. A 501(c)(3) is a federal IRS designation meaning your organization is exempt from federal income tax and donors can deduct their contributions. You must first incorporate as a nonprofit at the state level, then apply to the IRS for 501(c)(3) status separately.',
      },
      {
        question: 'Do I need a lawyer to start a nonprofit?',
        answer:
          'No, but it helps. Many small nonprofits complete state incorporation and IRS Form 1023-EZ without legal assistance using free templates from their state\'s Secretary of State website. If your organization is complex, expects significant assets, or is pursuing a full Form 1023, an attorney who specializes in nonprofit law is worth the investment to avoid costly mistakes.',
      },
      {
        question: 'Can one person start a nonprofit?',
        answer:
          'Technically, one person can file the paperwork, but legally you need at least 3 board members in most states - and you cannot be the only director. More importantly, a nonprofit controlled by one person faces scrutiny from the IRS for self-dealing. A genuine founding board of 3-7 committed individuals creates stronger governance and more credibility with funders.',
      },
    ],
    keywords: ['how to start a nonprofit', 'start a nonprofit organization', 'how to start a 501c3', 'nonprofit formation', 'start a nonprofit for free'],
    relatedClubTypes: ['nonprofit-organization'],
    relatedResources: ['complete-guide-club-management', 'financial-management-clubs'],
  },
  {
    slug: 'hoa',
    orgType: 'Homeowners Association',
    title: 'How to Start an HOA',
    category: 'community',
    description:
      'Homeowners associations maintain property values, enforce community standards, and coordinate shared amenities. This guide covers the legal steps to form an HOA, from drafting CC&Rs to holding your first election.',
    steps: [
      {
        title: 'Organize a founding homeowners committee',
        description:
          'Recruit at least 5 committed homeowners who will drive the formation process. Identify the geographic boundaries of the proposed HOA and estimate how many households would be covered.',
      },
      {
        title: 'Hire a real estate attorney',
        description:
          'HOA formation is highly state-specific. Laws like Florida\'s FS 720 and California\'s Davis-Stirling Act impose detailed requirements. An attorney familiar with your state\'s HOA statutes is essential for drafting enforceable documents.',
      },
      {
        title: 'Draft the Declaration of CC&Rs',
        description:
          'The Declaration of Covenants, Conditions & Restrictions (CC&Rs) is your HOA\'s governing document. It defines community rules, architectural standards, assessment authority, enforcement procedures, and member rights. It must be recorded with the county to be enforceable.',
      },
      {
        title: 'File Articles of Incorporation',
        description:
          'File as a nonprofit corporation with your state Secretary of State (most states). HOAs typically use nonprofit corporation status, though some states allow unincorporated associations.',
      },
      {
        title: 'Draft bylaws',
        description:
          'Bylaws cover meeting procedures, officer election, quorum requirements, board authority, and amendment procedures. They must align with state HOA statutes.',
      },
      {
        title: 'Record CC&Rs with the county',
        description:
          'CC&Rs must be recorded at the county recorder\'s office to bind current and future property owners. Recording fees range from $100-$500. Without recording, CC&Rs are unenforceable against future buyers.',
      },
      {
        title: 'Obtain an EIN and open a bank account',
        description:
          'Apply for a free EIN and open dedicated HOA checking and reserve fund accounts. HOAs should maintain a reserve fund for major capital expenses (roof replacement, road repaving, pool maintenance).',
      },
      {
        title: 'Conduct the first homeowner meeting and election',
        description:
          'Hold a formation meeting open to all affected homeowners. Present the CC&Rs, bylaws, initial budget, and proposed assessment amount. Elect the first board of directors. Document everything with formal meeting minutes.',
      },
    ],
    legalRequirements:
      'Required: Attorney-drafted CC&Rs recorded with county, Articles of Incorporation (state), bylaws, EIN, annual Form 1120-H (HOA tax election) or Form 1120. Many states require annual report filings. D&O insurance and general liability coverage strongly recommended.',
    estimatedStartupCost: '$2,000-$8,000+ (attorney fees $1,500-$5,000, state filing $25-$200, recording fees $100-$500, insurance $500-$2,000)',
    minMembersToLaunch: '5',
    commonMistakes: [
      'Not recording CC&Rs with the county, making them unenforceable',
      'Failing to establish adequate reserve funds from the start',
      'CC&Rs that conflict with state HOA statutes',
      'No D&O insurance to protect board members from personal liability',
    ],
    toolsNeeded: [
      'HOA management software (GatherGrove)',
      'Accounting software for assessments and reserves',
      'Document management for CC&Rs and meeting minutes',
      'Payment processing for assessment collection',
    ],
    faqQuestions: [
      {
        question: 'Is an HOA legally required to incorporate?',
        answer:
          'In most states, HOAs should incorporate as a nonprofit corporation to clearly define legal standing, limit board member personal liability, and access a bank account under the HOA name. Some states allow unincorporated associations, but incorporation is the professional standard and provides much better legal protections.',
      },
      {
        question: 'How are HOA dues determined?',
        answer:
          'HOA dues are based on a budget that covers: regular maintenance of common areas, management fees, utilities for common areas, insurance premiums, and contributions to the reserve fund. The total budget is divided by the number of units, sometimes weighted by lot size or square footage per the CC&Rs.',
      },
    ],
    keywords: ['how to start an HOA', 'HOA formation', 'homeowners association setup', 'how to form a homeowners association'],
    relatedClubTypes: ['community-organizations'],
    relatedResources: [],
  },
  {
    slug: 'pto',
    orgType: 'Parent-Teacher Organization',
    title: 'How to Start a PTO',
    category: 'community',
    description:
      'A PTO (Parent-Teacher Organization) strengthens school communities through fundraising, volunteer programs, and parent engagement. This guide covers the steps to launch an independent PTO, from getting school approval to filing for tax-exempt status.',
    steps: [
      {
        title: 'Gauge parent interest and get school buy-in',
        description:
          'Survey parents to confirm interest and identify potential volunteers. Schedule a meeting with the school principal to present your vision and secure official school support. A PTO without administrative backing rarely succeeds.',
      },
      {
        title: 'Choose PTO vs PTA structure',
        description:
          'A PTO is independent (you write your own bylaws and operate autonomously). A PTA is affiliated with the National PTA (structured bylaws, annual dues, more name recognition). PTOs have more flexibility; PTAs have a built-in network and resources.',
      },
      {
        title: 'Form a founding committee and recruit officers',
        description:
          'You need at minimum a President, Vice-President, Secretary, and Treasurer. Recruit from interested parents at initial meetings. Officers must be willing to commit meaningful time during the school year.',
      },
      {
        title: 'Draft and adopt bylaws',
        description:
          'PTO bylaws should cover: purpose, membership (all parents/guardians of enrolled students), officer roles and terms, meeting frequency, quorum, fundraising authority, amendment procedure, and dissolution clause. Keep them clear and simple.',
      },
      {
        title: 'Obtain an EIN and open a bank account',
        description:
          'Apply for a free EIN at IRS.gov. Open a checking account at a local bank or credit union using the EIN and signed bylaws. Never use a personal account for PTO funds - this creates personal liability for the treasurer.',
      },
      {
        title: 'Apply for 501(c)(3) status',
        description:
          'Most PTOs qualify for Form 1023-EZ ($275) since they typically expect under $50,000 in annual gross receipts initially. 501(c)(3) status means donors can deduct contributions and the PTO is exempt from federal income tax. Apply within 27 months of formation to have status retroactive to your founding date.',
      },
      {
        title: 'Establish financial controls',
        description:
          'Require two signatures on checks above a threshold amount. Conduct an annual financial review even if informal. Obtain a fidelity bond (dishonesty insurance) for the treasurer to protect against embezzlement - many schools require this.',
      },
      {
        title: 'Plan your first event or fundraiser',
        description:
          'A back-to-school welcome event or fall fundraiser in your first 60 days builds momentum, recruits new volunteers, and establishes the PTO as an active presence. Keep first events simple and achievable.',
      },
    ],
    legalRequirements:
      'Recommended: EIN (free), state nonprofit incorporation ($25-$100), IRS Form 1023-EZ ($275) for 501(c)(3) status, fidelity bond for treasurer. Annual Form 990-N (e-Postcard) or Form 990 filing required to maintain exempt status.',
    estimatedStartupCost: '$300-$1,200 (state filing $25-$100, IRS 1023-EZ $275, insurance $150-$500/year, PTA affiliation dues $100-$300/year if applicable)',
    minMembersToLaunch: '4',
    commonMistakes: [
      'Co-mingling PTO and personal funds',
      'Fundraising that benefits individual students (violates 501c3 equal-benefit requirement)',
      'No financial controls or dual-signature requirements on checks',
      'Failing to file annual Form 990 (auto-revocation after 3 missed years)',
    ],
    toolsNeeded: [
      'Member management software (GatherGrove)',
      'Accounting software (QuickBooks Nonprofit, Wave)',
      'Online fundraising platform',
      'Volunteer scheduling tool',
    ],
    faqQuestions: [
      {
        question: 'What is the difference between a PTO and a PTA?',
        answer:
          'A PTO (Parent-Teacher Organization) is independent - it writes its own bylaws and operates autonomously. A PTA (Parent-Teacher Association) is affiliated with the National PTA, which provides model bylaws, a national network, and advocacy resources but requires paying annual dues and following national standards.',
      },
      {
        question: 'Does a PTO need to be a nonprofit?',
        answer:
          'A PTO doesn\'t legally have to incorporate, but it\'s strongly recommended. Nonprofit incorporation protects individual board members from personal liability for organizational debts and legal claims. 501(c)(3) status additionally makes donations tax-deductible, which dramatically improves fundraising.',
      },
    ],
    keywords: ['how to start a PTO', 'PTO formation', 'parent teacher organization setup', 'how to form a PTO'],
    relatedClubTypes: ['community-organizations', 'youth-organizations'],
    relatedResources: [],
  },
  {
    slug: 'neighborhood-watch',
    orgType: 'Neighborhood Watch',
    title: 'How to Start a Neighborhood Watch',
    category: 'community',
    description:
      'A neighborhood watch program deters crime, builds community bonds, and improves communication between residents and local law enforcement. This guide explains how to launch a watch program in partnership with your local police department.',
    steps: [
      {
        title: 'Contact your local police department',
        description:
          'Most police departments have a Community Policing or Crime Prevention unit that actively supports neighborhood watch programs. They provide training, materials, signs, and guidance at no cost. This partnership is the foundation of an effective program.',
      },
      {
        title: 'Define your coverage area',
        description:
          'Start with a manageable geographic zone - typically 20-50 homes. Recruit block captains for each street or block within the zone. Block captains are the communication nodes of your network.',
      },
      {
        title: 'Host a founding neighborhood meeting',
        description:
          'Invite all residents in your target area to an organizational meeting, ideally co-hosted with a local police officer. Present the program, define roles, distribute contact cards, and sign up block captains.',
      },
      {
        title: 'Register with National Neighborhood Watch (NNWI)',
        description:
          'Register your program at USAonWatch.org (free). Registration provides access to training materials, program guidelines, and national resources. It also formally documents your program\'s existence.',
      },
      {
        title: 'Establish communication infrastructure',
        description:
          'Set up a group text or email chain, Nextdoor neighborhood page, or a private social media group for quick incident reporting. Establish clear protocols for what warrants immediate police contact vs. neighborhood notification.',
      },
      {
        title: 'Post Neighborhood Watch signs',
        description:
          'Signage is one of the most effective deterrents. Your police department often provides signs at no cost for registered programs. Post them at neighborhood entry points and key locations.',
      },
      {
        title: 'Establish a regular meeting cadence',
        description:
          'Quarterly meetings minimum to review incidents, share safety updates from police, and onboard new residents. An active meeting schedule keeps the program visible and maintains volunteer engagement.',
      },
      {
        title: 'Set up member communication tools',
        description:
          'A simple platform for managing contact lists, sending announcements, and coordinating meetings makes administration manageable. GatherGrove\'s communication tools work well for neighborhood-scale groups.',
      },
    ],
    legalRequirements:
      'No formal legal requirements for a neighborhood watch program. No incorporation, EIN, or tax filing needed for most programs. Avoid any activities beyond reporting and communication - actual law enforcement activities create liability.',
    estimatedStartupCost: '$0-$200 (registration free, signs $20-$100 or free from police, communication tools $0-$20/month)',
    minMembersToLaunch: '5',
    commonMistakes: [
      'Overstepping into active surveillance or confrontation (serious liability risk)',
      'Poor communication infrastructure leading to an inactive group within 6 months',
      'Not liaising regularly with law enforcement',
      'No clear protocol distinguishing police-call situations from neighborhood notifications',
    ],
    toolsNeeded: [
      'Group communication platform (Nextdoor, group text, or GatherGrove)',
      'Contact management list',
      'Neighborhood map for block captain assignments',
    ],
    faqQuestions: [
      {
        question: 'Does a neighborhood watch need to incorporate?',
        answer:
          'No. Neighborhood watch programs are typically informal community programs operating in partnership with local police. Incorporation is neither required nor common. The program should focus on communication and reporting, not activities that create legal liability.',
      },
      {
        question: 'How effective are neighborhood watch programs?',
        answer:
          'Research shows neighborhood watch programs can reduce crime by 16-26% in the areas they cover, primarily through deterrence and faster reporting. Effectiveness depends heavily on active participation, regular communication, and maintained law enforcement partnerships.',
      },
    ],
    keywords: ['how to start a neighborhood watch', 'neighborhood watch program', 'start a watch program', 'community safety group'],
    relatedClubTypes: ['community-organizations'],
    relatedResources: [],
  },
  {
    slug: 'community-garden',
    orgType: 'Community Garden',
    title: 'How to Start a Community Garden',
    category: 'community',
    description:
      'Community gardens provide fresh food, green space, and social connection in neighborhoods of all types. This guide covers everything from securing land to drafting gardener agreements so your garden thrives for years.',
    steps: [
      {
        title: 'Assemble a planning committee',
        description:
          'Recruit 3-5 committed individuals who will drive the formation process. Identify skills needed: someone who knows gardening, someone with organizational/admin skills, and someone with connections to potential landowners or funders.',
      },
      {
        title: 'Identify and secure land',
        description:
          'Contact your parks department, local school district, faith institutions, or land trusts about available parcels. Key considerations: sun exposure (minimum 6 hours daily), water access, soil quality (test for contamination if urban), and landowner willingness to execute a multi-year lease.',
      },
      {
        title: 'Conduct a soil test',
        description:
          'Urban soils often contain elevated lead, arsenic, or other contaminants from historical uses. Test before planting food crops. Your state land-grant university extension office typically offers soil testing for $15-$50. Remediation options include raised beds with imported soil.',
      },
      {
        title: 'Negotiate and sign a land use agreement',
        description:
          'Never start a garden without a written agreement. Include: lease term (seek minimum 3 years), renewal rights, landowner access provisions, liability/indemnification clause, and what happens to improvements if the lease ends.',
      },
      {
        title: 'Choose a governance structure',
        description:
          'Options range from fully informal (honor-system rules) to incorporated nonprofit. Many community gardens operate under a fiscal sponsor (an existing 501c3, such as a land trust or community organization) to avoid standalone incorporation overhead while accessing tax-deductible donations.',
      },
      {
        title: 'Obtain liability insurance',
        description:
          'General liability insurance ($1M-$2M) is required by most landowners as a condition of the lease. Community garden-specific coverage is available through American Community Gardening Association partners for $300-$800/year.',
      },
      {
        title: 'Draft gardener membership agreements',
        description:
          'All plot holders should sign a seasonal agreement covering: plot fees, maintenance obligations, prohibited pesticides/practices, guest policies, and a liability hold-harmless clause. Clear rules prevent the disputes that destroy community gardens.',
      },
      {
        title: 'Set up member management and payment tools',
        description:
          'Use GatherGrove or similar tools to manage plot holder applications, collect seasonal fees, schedule workdays, and communicate with gardeners. Managing 20-50 plot holders without software leads to administrative chaos.',
      },
    ],
    legalRequirements:
      'Required: Written land use agreement. Recommended: EIN (free), liability insurance (often required by landowner), fiscal sponsor or nonprofit incorporation. Optional: state charitable registration if soliciting donations.',
    estimatedStartupCost: '$1,500-$12,000 depending on site (land prep $500-$5,000, insurance $300-$800, water hookup $200-$2,000, tools/infrastructure $500-$3,000, state filing $25-$100 if incorporating)',
    minMembersToLaunch: '10',
    commonMistakes: [
      'Starting without a written land use agreement (landowner can revoke access mid-season)',
      'Not testing soil for contaminants before planting food crops',
      'No hold-harmless agreements with gardeners',
      'Underestimating water infrastructure costs and access requirements',
    ],
    toolsNeeded: [
      'Member management software (GatherGrove)',
      'Plot assignment tracking spreadsheet or software',
      'Online payment collection for plot fees',
      'Group communication platform',
    ],
    faqQuestions: [
      {
        question: 'How much does it cost to start a community garden?',
        answer:
          'Startup costs range from $1,500 for a simple park-side garden using existing infrastructure to $12,000+ for an urban lot requiring soil remediation, raised beds, and water hookups. Plot rental fees from 20-50 gardeners ($50-$200/season each) typically cover operating costs after the first year.',
      },
      {
        question: 'Does a community garden need to be a nonprofit?',
        answer:
          'Not necessarily. Many community gardens operate informally or under a fiscal sponsor (an existing 501c3) to avoid the cost and complexity of standalone nonprofit formation. Fiscal sponsorship lets you accept tax-deductible donations and grants without forming your own legal entity.',
      },
    ],
    keywords: ['how to start a community garden', 'community garden formation', 'start urban garden', 'neighborhood garden setup'],
    relatedClubTypes: ['community-organizations'],
    relatedResources: [],
  },
  // ── HOBBY ────────────────────────────────────────────────────────────────
  {
    slug: 'book-club',
    orgType: 'Book Club',
    title: 'How to Start a Book Club',
    category: 'hobby',
    description:
      'Book clubs create rich, regular conversation around literature while building lasting friendships. Whether you want a small gathering of friends or a community organization with hundreds of members, this guide has everything you need.',
    steps: [
      {
        title: 'Define your reading focus and meeting format',
        description:
          'Choose a focus: literary fiction, genre fiction (mystery, sci-fi, romance), nonfiction, or an eclectic mix. Decide on meeting format: in-person rotating homes, at a library/coffee shop, virtual via Zoom, or hybrid. A clear identity attracts the right members.',
      },
      {
        title: 'Recruit founding members',
        description:
          'Start with 6-12 members - small enough for real conversation, large enough to continue when people miss meetings. Invite friends directly, post on Nextdoor or Facebook groups, or partner with a local library or bookstore.',
      },
      {
        title: 'Establish ground rules and expectations',
        description:
          'Agree on: How are books selected? What happens if someone hasn\'t finished? What is the attendance expectation? Can members bring guests? How are meeting locations decided? These conversations up front prevent friction later.',
      },
      {
        title: 'Choose a book selection method',
        description:
          'Common methods: rotating nominations (each member nominates a book and the group votes), a designated selector rotates through members, or themed reading lists. The most democratic methods have the highest group buy-in.',
      },
      {
        title: 'Set a regular meeting schedule',
        description:
          'Monthly meetings are most common and sustainable. Pick a consistent day and time (e.g., first Tuesday at 7pm) so members can plan around it. Irregular scheduling is the #1 predictor of book club failure.',
      },
      {
        title: 'For formal clubs: draft simple bylaws and get an EIN',
        description:
          'If your club collects dues, manages a club library, or hosts public events, draft a simple 1-2 page constitution. Obtain a free EIN and open a club bank account to keep finances organized.',
      },
      {
        title: 'Set up a communication and management tool',
        description:
          'Even informal clubs benefit from a shared platform for announcements, book selections, and RSVPs. GatherGrove or a simple group chat handles this for small clubs; larger clubs benefit from proper membership management software.',
      },
      {
        title: 'Host your first meeting',
        description:
          'For the first meeting, choose a widely loved, accessible book. Focus on relationship-building as much as discussion. The quality of the first experience heavily influences whether people return.',
      },
    ],
    legalRequirements:
      'Informal book clubs: no legal requirements whatsoever. Formal clubs with dues: recommend EIN (free) and club bank account. 501(c)(7) incorporation optional for clubs with significant dues revenue or assets.',
    estimatedStartupCost: '$0-$300 (informal: nearly free; formal with bank account: EIN free + bank fees; hosting costs typically shared among members)',
    minMembersToLaunch: '4',
    commonMistakes: [
      'No clear book-selection process, leading to disputes and member attrition',
      'No attendance norms - host burden when many members show up without reading',
      'Growing too large too fast (groups over 15 lose the intimate discussion quality)',
      'No succession plan when a founding member moves or leaves',
    ],
    toolsNeeded: [
      'Group communication platform (GatherGrove, group text, or Slack)',
      'Reading list tracker (Goodreads, Literal, or shared document)',
      'Meeting scheduling tool',
    ],
    faqQuestions: [
      {
        question: 'What is the ideal size for a book club?',
        answer:
          'Research and experienced organizers consistently recommend 6-12 members. Fewer than 6 means cancellations when 2-3 people miss; more than 12-15 makes it hard for everyone to contribute meaningfully to discussion. If demand grows, consider launching a second chapter.',
      },
      {
        question: 'How often should a book club meet?',
        answer:
          'Monthly is the most sustainable cadence for most book clubs. It gives members adequate reading time (especially for longer works) while maintaining momentum. Bi-monthly or quarterly clubs struggle with continuity and member turnover.',
      },
    ],
    keywords: ['how to start a book club', 'book club formation', 'start a reading group', 'book club organizer tips'],
    relatedClubTypes: ['book-clubs', 'social-clubs'],
    relatedResources: [],
  },
  {
    slug: 'wine-tasting-club',
    orgType: 'Wine Tasting Club',
    title: 'How to Start a Wine Tasting Club',
    category: 'hobby',
    description:
      'A wine tasting club turns casual enthusiasm into structured learning and memorable social experiences. This guide covers organizing tastings, managing memberships, and navigating the simple legal considerations for a group focused on wine.',
    steps: [
      {
        title: 'Define your club\'s format and focus',
        description:
          'Decide between varietal tastings (Pinot Noir from different regions), regional tastings (all French wines), blind tastings (guess the wine), or rotating member-hosted events. Your format shapes tasting fees, frequency, and member expectations.',
      },
      {
        title: 'Recruit founding members',
        description:
          'Start with 6-12 members. Target people with genuine interest in learning about wine, not just drinking it - this creates more engaged discussions. Reach out through local wine shops, Meetup.com, and social networks.',
      },
      {
        title: 'Establish ground rules',
        description:
          'Agree on: How many bottles does each member bring? What is the per-event cost? Are guests allowed? What is the meeting location rotation? How are future wines selected? Written guidelines prevent misunderstandings.',
      },
      {
        title: 'Choose a meeting format',
        description:
          'Options: rotating member-hosted events (cheapest, most intimate), recurring venue like a wine bar or restaurant (consistent experience, higher cost), or partnering with a local winery (educational, great experiences). Most clubs rotate between member homes.',
      },
      {
        title: 'Handle alcohol purchasing logistics',
        description:
          'Coordinate wine purchasing per event: either a designated buyer for that meeting, members each bring an assigned bottle, or a shared cost pool. For shipped wines, ensure delivery addresses comply with your state\'s alcohol shipping laws.',
      },
      {
        title: 'For formal clubs: get an EIN and open a bank account',
        description:
          'If collecting annual dues or managing a shared wine purchase fund, obtain a free EIN and open a dedicated account. This protects the treasurer from personal liability and keeps finances transparent.',
      },
      {
        title: 'Set up member management tools',
        description:
          'Even a 12-person wine club benefits from a simple platform for event RSVPs, member contact lists, and tasting notes archives. GatherGrove handles member communication and event management efficiently.',
      },
      {
        title: 'Plan your first tasting event',
        description:
          'For the first meeting, choose an accessible theme - a well-known region or varietal comparison. Provide simple printed tasting cards so members can record impressions. The first event sets the tone for the club\'s culture.',
      },
    ],
    legalRequirements:
      'No special licensing required for private clubs sharing wine among members. Public-facing events with wine sales require appropriate alcohol licenses. Most informal private wine clubs operate with no legal structure. EIN and bank account recommended if collecting dues.',
    estimatedStartupCost: '$50-$500 to launch (wine costs typically shared per event; formal club bank account is free with EIN; optional website/management tools)',
    minMembersToLaunch: '4',
    commonMistakes: [
      'No clear expectations about member contributions per event',
      'Hosts bearing all the wine cost without reimbursement system',
      'Letting the group grow too large for intimate tasting discussions',
      'No tasting notes record keeping - members lose the educational value',
    ],
    toolsNeeded: [
      'Membership and event management (GatherGrove)',
      'Tasting notes app or shared document',
      'Wine recommendation and rating app (Vivino)',
    ],
    faqQuestions: [
      {
        question: 'How much does it cost per person per meeting in a wine tasting club?',
        answer:
          'Most clubs spend $15-$40 per person per meeting when members bring bottles or contribute to a shared purchase fund. Higher-end clubs or sommelier-led tastings can run $50-$100/person. The cost structure should be agreed upon before the first meeting.',
      },
      {
        question: 'Do you need a liquor license to run a private wine club?',
        answer:
          'No. A private membership club where members bring or share wine among themselves does not require an alcohol license in most states. Licensing is required if you sell alcohol to the public or charge admission that includes wine at a public event. Consult your state alcohol control board if unsure.',
      },
    ],
    keywords: ['how to start a wine tasting club', 'wine club formation', 'wine tasting group setup', 'private wine club'],
    relatedClubTypes: ['social-clubs', 'book-clubs'],
    relatedResources: [],
  },
  {
    slug: 'photography-club',
    orgType: 'Photography Club',
    title: 'How to Start a Photography Club',
    category: 'hobby',
    description:
      'Photography clubs accelerate skill development through peer critique, shared outings, and friendly competitions. This guide covers launching a club that attracts dedicated photographers and creates a lasting creative community.',
    steps: [
      {
        title: 'Define your club\'s focus and skill level',
        description:
          'Decide whether your club targets beginners, enthusiasts, or advanced photographers. Specialty focus options: landscape, portrait, street photography, wildlife, or gear-agnostic. Mixed-skill clubs with critique groups at different levels work well.',
      },
      {
        title: 'Find a meeting venue',
        description:
          'Local libraries, community centers, and camera stores often host clubs for free or low cost. An indoor space with projection capability (for showing images) is ideal. Some clubs rotate between homes.',
      },
      {
        title: 'Structure your meeting format',
        description:
          'Effective photography club meetings typically include: a themed image sharing/critique segment (members submit 2-3 images on a monthly theme), an educational presentation or guest speaker, and planning for upcoming outings. 90-minute meetings work well.',
      },
      {
        title: 'Organize photo outings and field trips',
        description:
          'Monthly group outings to interesting locations are what members value most. Plan a mix of urban, nature, and event-based outings. Outings build camaraderie and give members shared shooting experiences to discuss.',
      },
      {
        title: 'Establish a photo sharing platform',
        description:
          'Use Flickr (free group pool), SmugMug (paid shared galleries), or a club website to host member images for critique and showcase. A shared platform is central to the club\'s identity.',
      },
      {
        title: 'Draft simple bylaws and collect dues',
        description:
          'Annual dues of $20-$60 cover venue costs, printing for competitions, and social events. Obtain an EIN and open a club bank account if annual dues exceed $1,000. Bylaws covering membership, officer election, and financial oversight keep things professional.',
      },
      {
        title: 'Set up membership management tools',
        description:
          'Use GatherGrove to manage member registration, collect dues, publish event calendars, and send monthly announcements. Good communication infrastructure prevents the "I didn\'t know about the outing" attrition problem.',
      },
      {
        title: 'Host your first meeting or outing',
        description:
          'Choose an accessible theme (e.g., "golden hour") and welcoming location for your first outing. Follow up with a meeting to share and discuss images. The photo-sharing experience after an outing is often members\' favorite moment.',
      },
    ],
    legalRequirements:
      'No special requirements for informal clubs. EIN and club bank account recommended once annual dues exceed $1,000. Optional: state nonprofit 501(c)(7) for clubs with significant assets or activities.',
    estimatedStartupCost: '$100-$600 first year (venue if not free, printing for competitions, website hosting, admin costs)',
    minMembersToLaunch: '8',
    commonMistakes: [
      'No structured meeting agenda - meetings become unfocused social gatherings',
      'Critique sessions that are harsh without a constructive framework',
      'Not archiving past club images and themes (valuable club history)',
      'Gear snobbery that alienates smartphone photographers',
    ],
    toolsNeeded: [
      'Membership management (GatherGrove)',
      'Photo sharing platform (Flickr, SmugMug)',
      'Projection setup for meeting image review',
      'Communication platform for outing announcements',
    ],
    faqQuestions: [
      {
        question: 'How do photography club critiques work?',
        answer:
          'Most clubs use a structured critique format: members submit 2-3 images on a monthly theme, images are displayed anonymously, and members provide feedback on technical execution and composition before the creator is revealed. Anonymous critique reduces defensiveness and produces more honest, helpful feedback.',
      },
      {
        question: 'What equipment does a photography club need?',
        answer:
          'The minimum setup is a projector or large monitor for displaying member images at meetings. A club website or shared gallery (Flickr group) for hosting images is also essential. Unlike other clubs, members bring their own cameras - the club does not need to provide photography equipment.',
      },
    ],
    keywords: ['how to start a photography club', 'photography club formation', 'camera club setup', 'photo group organizer'],
    relatedClubTypes: ['social-clubs', 'art-clubs'],
    relatedResources: [],
  },
  {
    slug: 'board-game-group',
    orgType: 'Board Game Group',
    title: 'How to Start a Board Game Group',
    category: 'hobby',
    description:
      'Board game groups offer regular social play, game discovery, and community around one of the fastest-growing hobbies. This guide covers launching a game group from your first session to a thriving organized community.',
    steps: [
      {
        title: 'Choose your format and target audience',
        description:
          'Casual game nights (gateway games for all), dedicated groups (heavy euro-games, wargames, RPGs), tournament leagues, or family-friendly sessions each attract different players. Define your niche to build a cohesive group.',
      },
      {
        title: 'Find a venue',
        description:
          'Local game stores (FLGS) frequently host game nights in exchange for promotion and the chance players will buy games. Libraries, community centers, coffee shops, and rotating member homes are all viable. FLGS partnerships are easiest for new groups.',
      },
      {
        title: 'Establish a game library and lending policy',
        description:
          'Invite members to bring games and consider building a shared club library. Define lending policies: who can borrow what, for how long, what happens with damaged games. A robust library is a major membership draw.',
      },
      {
        title: 'Set up a meeting schedule',
        description:
          'Weekly or bi-weekly sessions work best for retention. Pick a consistent day and time. Monthly is often too infrequent - momentum is harder to maintain.',
      },
      {
        title: 'Create a game request and suggestion system',
        description:
          'Use a shared wishlist (BoardGameGeek collections) or simple form where members request games to play. Games selected by member vote generate more attendance than organizer-selected games.',
      },
      {
        title: 'Draft a simple membership structure',
        description:
          'Even informal groups benefit from a roster and nominal dues ($10-$30/year) to cover venue costs or grow the library. Use GatherGrove to manage RSVPs, collect dues, and keep attendance records.',
      },
      {
        title: 'Promote on BoardGameGeek and Meetup.com',
        description:
          'BoardGameGeek\'s guild system and Meetup.com are the highest-traffic platforms for finding local board gamers. List your group on both to reach people actively looking for game nights.',
      },
      {
        title: 'Host your first game night',
        description:
          'Choose 2-3 accessible gateway games (Ticket to Ride, Catan, Codenames) for your first event to ensure everyone can participate. Plan to teach rules clearly and allow new players to watch a round before joining.',
      },
    ],
    legalRequirements:
      'No legal requirements for informal game groups. EIN and club bank account recommended if collecting dues above $1,000/year. No nonprofit status needed for purely recreational groups.',
    estimatedStartupCost: '$0-$300 (venue often free with FLGS partnership; optional dues cover shared expenses)',
    minMembersToLaunch: '4',
    commonMistakes: [
      'Games too complex for new members on their first visit',
      'No venue backup plan when primary location is unavailable',
      'Runaway leader problems in game selection - one person picking all games',
      'Growing too fast without structure, leading to no-shows and disorganized sessions',
    ],
    toolsNeeded: [
      'Membership and RSVP management (GatherGrove)',
      'BoardGameGeek collection for game library tracking',
      'Group communication platform',
    ],
    faqQuestions: [
      {
        question: 'Do you need to incorporate to run a board game group?',
        answer:
          'No. Most board game groups operate as informal groups with no legal structure. If you collect significant dues or manage a large shared game library worth several hundred dollars, basic financial controls (an EIN and dedicated account) are worthwhile but no formal nonprofit status is needed.',
      },
      {
        question: 'How do you handle a large shared game library?',
        answer:
          'Track your club library using BoardGameGeek\'s collection feature or a simple shared spreadsheet. Assign a librarian role responsible for check-out records. Establish a borrowing policy (one game at a time, 2-week max, member responsible for replacement cost if lost or damaged). A library of 50-100 games is a major membership draw.',
      },
    ],
    keywords: ['how to start a board game group', 'board game club setup', 'game night group formation', 'tabletop gaming club'],
    relatedClubTypes: ['social-clubs', 'chess-clubs'],
    relatedResources: [],
  },
  {
    slug: 'gardening-club',
    orgType: 'Gardening Club',
    title: 'How to Start a Gardening Club',
    category: 'hobby',
    description:
      'Gardening clubs share knowledge, coordinate plant swaps, and build community around the joys of growing things. This guide covers everything from organizing your first meeting to running plant sales and educational programs.',
    steps: [
      {
        title: 'Define your club\'s focus',
        description:
          'Options include general gardening, vegetable growing, native plants, orchids, roses, or permaculture. A specific focus attracts more dedicated members than a vague "we like plants" charter.',
      },
      {
        title: 'Find a meeting venue',
        description:
          'Public libraries, botanical gardens, community centers, and local garden centers often host gardening clubs for free. Some clubs rotate between member gardens, which adds educational value and inspiration.',
      },
      {
        title: 'Connect with your local Cooperative Extension',
        description:
          'Your county\'s Cooperative Extension office (land-grant university system) provides free horticultural resources, Master Gardener connections, and sometimes meeting space. Extension offices are invaluable partners for gardening clubs.',
      },
      {
        title: 'Plan a mix of programs and activities',
        description:
          'Effective gardening clubs offer: monthly educational programs (guest speakers, member presentations), plant swaps, garden tours, volunteer planting days at community sites, and seasonal plant sales as fundraisers.',
      },
      {
        title: 'Affiliate with local or national gardening organizations',
        description:
          'Consider affiliating with the National Garden Clubs (NGC), your state garden club federation, or a specialty society. Affiliations provide resources, event insurance options, educational programs, and networking.',
      },
      {
        title: 'Draft bylaws and elect officers',
        description:
          'A simple constitution with membership, dues structure, officer roles, and meeting rules keeps the club organized. Annual dues of $15-$40 are typical for local gardening clubs.',
      },
      {
        title: 'Obtain an EIN and open a club account',
        description:
          'Get a free EIN and open a dedicated account for dues and plant sale proceeds. Keeping finances separate from member personal accounts protects officers and enables transparent financial reporting.',
      },
      {
        title: 'Set up member management tools',
        description:
          'GatherGrove handles member registrations, dues collection, event calendars, and mass communications - essential for clubs that grow beyond 30 members.',
      },
    ],
    legalRequirements:
      'No legal requirements for informal clubs. Recommend EIN and bank account for clubs collecting dues. Some national garden club federations require affiliated clubs to incorporate. Annual report filing if incorporated.',
    estimatedStartupCost: '$100-$500 first year (venue if not free, supplies, possible affiliation dues $30-$100/year)',
    minMembersToLaunch: '6',
    commonMistakes: [
      'No succession plan for long-serving officers',
      'Meeting programs that are too lecture-heavy without hands-on elements',
      'Plant sales without proper fundraising controls',
      'Not leveraging Cooperative Extension resources - the biggest missed opportunity',
    ],
    toolsNeeded: [
      'Membership management (GatherGrove)',
      'Event and program calendar',
      'Plant sale inventory tracking',
      'Group email or communication platform',
    ],
    faqQuestions: [
      {
        question: 'How do gardening clubs make money?',
        answer:
          'Annual dues, plant sales (spring and fall are traditional), and hosted garden tours are the three main revenue sources for gardening clubs. Well-organized spring plant sales can generate $500-$5,000+ for active clubs, funding programs and community garden projects.',
      },
      {
        question: 'Do gardening clubs need to affiliate with national organizations?',
        answer:
          'Affiliation is optional but valuable. National Garden Clubs (NGC) affiliated clubs access educational programs, flower show certification, youth garden grants, and a national network. State garden club federations provide regional programming and peer connections. Affiliation costs $30-$100/year and is worthwhile for clubs wanting structured programming.',
      },
    ],
    keywords: ['how to start a gardening club', 'garden club formation', 'horticultural society setup', 'plant club organizer'],
    relatedClubTypes: ['social-clubs', 'community-organizations'],
    relatedResources: [],
  },
  {
    slug: 'chess-club',
    orgType: 'Chess Club',
    title: 'How to Start a Chess Club',
    category: 'hobby',
    description:
      'Chess clubs develop critical thinking, competitive skills, and community through one of the world\'s oldest games. This guide covers launching a club whether you\'re targeting casual players, serious competitors, or youth development.',
    steps: [
      {
        title: 'Define your focus: recreational, competitive, or youth',
        description:
          'Recreational clubs focus on fun, casual play and social connection. Competitive clubs host rated tournaments and track US Chess Federation (USCF) ratings. Youth clubs prioritize skill development and often partner with schools.',
      },
      {
        title: 'Find a meeting venue',
        description:
          'Libraries, community centers, schools, and coffee shops with adequate table space work well. Competitive clubs hosting rated tournaments need enough space for multiple boards simultaneously and a Tournament Director.',
      },
      {
        title: 'Acquire chess equipment',
        description:
          'Standard Staunton chess sets ($20-$40 each) and demonstration boards ($50-$150) are the core equipment. Competitive clubs need chess clocks ($20-$60 each). A well-equipped club of 20 players needs 10 boards and clocks.',
      },
      {
        title: 'Affiliate with US Chess Federation',
        description:
          'USCF membership is required to play in rated tournaments. Club affiliation costs $35-$60/year and provides access to rated play, Tournament Director training, and club resources. Individual member dues are $15-$40/year.',
      },
      {
        title: 'Set meeting schedule and play formats',
        description:
          'Weekly meetings work best for chess clubs. Meeting formats: free play (social, casual), ladder tournaments (ongoing season-long competition), or Swiss-system tournaments (weekly rated events). Mix formats to serve both casual and serious players.',
      },
      {
        title: 'Draft bylaws and elect officers',
        description:
          'A simple constitution with membership qualifications, dues, officer roles (president, treasurer, tournament director), and meeting rules provides the structure needed to grow sustainably.',
      },
      {
        title: 'Collect dues and manage members',
        description:
          'Annual dues of $20-$50 are common for chess clubs. Use GatherGrove to manage member registration, collect dues, publish tournament schedules, and communicate results.',
      },
      {
        title: 'Host your first tournament or club championship',
        description:
          'An annual club championship is a strong anchor event. For competitive clubs, hosting an open rated tournament brings in outside players, generates revenue, and raises your club\'s profile.',
      },
    ],
    legalRequirements:
      'No formal legal requirements for informal clubs. USCF affiliation required for rated tournaments. EIN and bank account recommended for clubs with annual dues or tournament income.',
    estimatedStartupCost: '$200-$800 first year (equipment $200-$600, USCF affiliation $35-$60, venue if not free)',
    minMembersToLaunch: '8',
    commonMistakes: [
      'No equipment for beginners - members can\'t learn without access to boards',
      'Tournament rules not communicated clearly in advance',
      'No youth pipeline causing long-term membership decline',
      'All competitive, no casual play options (alienates beginners)',
    ],
    toolsNeeded: [
      'Membership management (GatherGrove)',
      'Tournament pairing software (WinTD, Swiss-Sys)',
      'USCF online rating integration',
      'Group communication platform',
    ],
    faqQuestions: [
      {
        question: 'Do chess club members need US Chess Federation membership?',
        answer:
          'USCF membership is only required to play in officially rated tournaments. Casual club play does not require individual USCF membership. However, if your club wants to host rated events or track official ratings, all participants in rated games must have current USCF memberships.',
      },
      {
        question: 'How do chess clubs attract and retain beginners?',
        answer:
          'Beginner-friendly programs are the key: free beginner\'s workshops, "chess buddies" pairing new players with experienced mentors, and handicapped formats (giving beginners extra pieces or time). Clubs that run separate beginner sessions alongside advanced play retain new members at much higher rates than clubs focused exclusively on competitive play.',
      },
    ],
    keywords: ['how to start a chess club', 'chess club formation', 'start a chess group', 'competitive chess club setup'],
    relatedClubTypes: ['chess-clubs', 'social-clubs'],
    relatedResources: [],
  },
  // ── PROFESSIONAL ─────────────────────────────────────────────────────────
  {
    slug: 'social-club',
    orgType: 'Social Club',
    title: 'How to Start a Social Club (501c7)',
    category: 'professional',
    description:
      'A social club brings people together for shared interests, regular activities, and lasting friendships - and formalizing it with 501(c)(7) status protects officers and makes dues tax-exempt for the club. This guide covers the practical steps to form a social club: choosing a regular venue, setting meeting frequency, establishing a formal membership structure, drafting bylaws, and optionally filing for 501(c)(7) recognition with the IRS.',
    steps: [
      {
        title: 'Define your club\'s purpose and membership criteria',
        description:
          'A 501(c)(7) social club must be organized for members\' pleasure, recreation, and social activities - not for public benefit. Define the activity focus (wine tasting, dining, gaming, hiking, arts) and membership qualifications clearly. The club must be genuinely member-only. Start with a clear answer to: "What do we do, who is it for, and how often do we meet?"',
      },
      {
        title: 'Choose a name and verify availability',
        description:
          'Check your state\'s Secretary of State business name database for name availability. The name should reflect the club\'s focus and sound distinctive. Avoid overly generic names - "The Social Club" will be confused with dozens of other groups, while something specific like "Eastside Dining Society" or "North Shore Games Collective" is memorable and searchable.',
      },
      {
        title: 'Secure a regular venue and set meeting frequency',
        description:
          'A consistent meeting place is foundational to social club identity. Evaluate options: private dining rooms at restaurants (often free if members order food), community center rooms ($20-$75/meeting), library meeting rooms (often free), or rotating member homes. Establish a regular schedule - monthly is the minimum for maintaining group cohesion; bi-monthly is common. Document the venue arrangement in writing even if informal.',
      },
      {
        title: 'Recruit founding members',
        description:
          'You need at minimum 10-20 committed founding members to establish a viable social club. Members are both the product (the social experience) and the customer, so prioritize quality of engagement over raw numbers. Host an informal "interest meeting" before committing to formal structure - it lets potential members self-select and gives you realistic signal about demand.',
      },
      {
        title: 'Establish a formal membership structure',
        description:
          'Define how new members join: open enrollment, waitlist with existing member sponsorship, or board approval. A clear membership process prevents the ambiguity that causes conflict in informal groups - people need to know definitively whether they are "in" the club and what that entitles them to. Set dues levels and what they cover (venue costs, event materials, shared expenses).',
      },
      {
        title: 'Plan an activity variety that appeals to diverse members',
        description:
          'The clubs with the best retention balance recurring core activities (monthly dinners, regular game nights) with occasional special events (annual party, themed evening, field trip). Survey founding members on their preferred activities before locking in a calendar. Variety prevents staleness while regularity builds community.',
      },
      {
        title: 'Draft bylaws covering membership, dues, and activities',
        description:
          'Bylaws must cover: membership qualifications and election process, dues structure, officer roles and election, meeting rules, guest policies, disciplinary procedures, and a dissolution clause. 501(c)(7) bylaws must restrict membership - the club cannot be open to the general public without risking tax-exempt status.',
      },
      {
        title: 'File Articles of Incorporation as a nonprofit',
        description:
          'File with your state Secretary of State as a nonprofit corporation. Filing fees range from $25-$100. Articles must include the club\'s purpose, dissolution language (assets go to another exempt organization on dissolution), and nonprofit intent.',
      },
      {
        title: 'Obtain an EIN and open a club bank account',
        description:
          'Apply for a free EIN at IRS.gov. Open a dedicated club bank account. Officers must never use personal accounts for club funds.',
      },
      {
        title: 'File IRS Form 1024 for 501(c)(7) recognition',
        description:
          'Form 1024 ($600 fee) requests formal IRS recognition of 501(c)(7) status. This is optional but strongly recommended for clubs with annual receipts above $5,000 - it provides legal certainty that your club is tax-exempt and signals credibility to members and vendors. Revenue restrictions apply: at least 65% of gross receipts must come from members.',
      },
      {
        title: 'Set up member management and event tools',
        description:
          'Use GatherGrove to manage member applications and approval workflow, collect dues, schedule events, send invitations, and communicate with members. A professional platform supports the polished member experience that justifies dues and reduces administrative burden on volunteer officers.',
      },
    ],
    legalRequirements:
      'State nonprofit incorporation ($25-$100), EIN (free), optional IRS Form 1024 for 501(c)(7) recognition ($600 - recommended for clubs with annual gross receipts above $5,000). Annual Form 990 or 990-N filing required. Income restriction: minimum 65% of gross receipts from members. Venue contracts should be in the club\'s legal name, not an officer\'s personal name.',
    estimatedStartupCost: '$50-$2,200 (state filing $25-$100, IRS Form 1024 $600 optional, legal drafting $500-$1,500 optional)',
    minMembersToLaunch: '10',
    commonMistakes: [
      'Exceeding non-member income limits (above 35% of gross receipts) - jeopardizes 501(c)(7) tax-exempt status',
      'Membership open to the general public, jeopardizing 501(c)(7) status',
      'No formal membership structure - informal groups where "everyone is welcome" create confusion about dues obligations and event expectations',
      'Inadequate documentation of member-only activities',
      'No conflict-of-interest policy for officer financial decisions',
      'No venue agreement in writing - verbal arrangements with restaurants or venues frequently fall apart when a new manager takes over',
    ],
    toolsNeeded: [
      'Membership management with approval workflow (GatherGrove)',
      'Dues collection and payment processing',
      'Event planning and RSVP tools',
      'Accounting software',
    ],
    faqQuestions: [
      {
        question: 'What is the difference between a 501(c)(3) and a 501(c)(7)?',
        answer:
          'A 501(c)(3) is a public charity or private foundation serving a public benefit - donations are tax-deductible. A 501(c)(7) is a social club serving its members\' recreation and pleasure - donations are NOT tax-deductible, but membership dues and event revenue from members are exempt from federal income tax.',
      },
      {
        question: 'Can a social club charge for events?',
        answer:
          'Yes. Social clubs can charge members for events, activities, and facilities. The key restriction is the income mix: at least 65% of gross receipts must come from members (dues, event fees, etc.). Non-member income (outside venue rentals, public events) cannot exceed 35% of total gross receipts.',
      },
      {
        question: 'Do I need to incorporate a social club?',
        answer:
          'No. Informal social clubs can operate as unincorporated associations - many dinner clubs, book clubs, and hobby groups do. However, if your club will collect significant dues, sign venue contracts, or host events with meaningful expenses, incorporating as a nonprofit protects individual officers from personal liability and makes it easier to open a bank account and sign contracts in the club\'s name.',
      },
      {
        question: 'How do I choose activities for a diverse group of members?',
        answer:
          'Survey founding members with a short list of activity options before committing to a calendar. Build a mix of accessible recurring activities (monthly dinners, casual game nights) and occasional special events (themed evenings, outings). Rotate activity suggestions so long-tenured members feel heard. The key is creating a baseline of reliable regular gatherings that new members can count on - variety in specials keeps things interesting without undermining the consistency that retains members.',
      },
    ],
    keywords: ['how to start a social club', 'forming a social group', 'social club setup guide', 'social club 501c7 formation', 'start a members club', '501c7 application'],
    relatedClubTypes: ['social-clubs', 'book-clubs', 'hobby-clubs'],
    relatedResources: [],
  },
  {
    slug: 'networking-group',
    orgType: 'Professional Networking Group',
    title: 'How to Start a Professional Networking Group',
    category: 'professional',
    description:
      'A well-run professional networking group generates business referrals, career opportunities, and lasting professional relationships. This guide covers launching a group from your first meeting to a structured organization with regular programming.',
    steps: [
      {
        title: 'Define your niche and membership criteria',
        description:
          'General "business networking" groups face fierce competition from BNI and local chambers. Niche groups (women in tech, founders under 35, commercial real estate professionals) attract more committed members and generate more relevant referrals.',
      },
      {
        title: 'Choose a format: referral-based or connection-focused',
        description:
          'Referral groups (BNI-style) require members to bring referrals and track business generated. Connection groups focus on relationship building, speaker programming, and community without referral quotas. Choose based on your members\' expectations.',
      },
      {
        title: 'Establish membership policies',
        description:
          'Define: exclusive categories (one member per business type, common in referral groups), attendance requirements, membership fees, and a vetting/application process. Clear expectations reduce no-shows and attract committed members.',
      },
      {
        title: 'Find a consistent meeting venue',
        description:
          'Options: hotel conference rooms, co-working spaces, private dining rooms, or online via Zoom. For in-person groups, breakfast or lunch meetings (7-8am or noon) have higher attendance rates than after-work events.',
      },
      {
        title: 'Plan your meeting agenda',
        description:
          'Effective networking meetings include: brief member introductions (60-second commercials), a featured member presentation or guest speaker, open networking time, and announcements. The 60-second commercial format ensures everyone speaks every meeting.',
      },
      {
        title: 'Set membership dues and sponsorship options',
        description:
          'Annual dues of $200-$500/year for professional networking groups are typical. Consider tiered levels: basic, professional, and sponsor. Dues cover venue, admin costs, and event programming.',
      },
      {
        title: 'Register as a business entity or nonprofit',
        description:
          'Most professional networking groups operate as LLCs or informal associations. Formal clubs benefit from EIN and bank account. 501(c)(6) status (business leagues) is an option for industry-specific groups but is complex and rarely worth it for small local groups.',
      },
      {
        title: 'Set up membership management tools',
        description:
          'GatherGrove handles member registration, dues collection, event RSVPs, and communications - the core administrative needs of a professional networking group.',
      },
    ],
    legalRequirements:
      'No mandatory legal structure for informal networking groups. Recommend EIN and bank account once annual dues exceed $2,000. LLC formation ($50-$500) provides liability protection if organizing paid events. 501(c)(6) optional for formal trade/business associations.',
    estimatedStartupCost: '$300-$1,500 first year (venue costs, meeting materials, website, admin tools)',
    minMembersToLaunch: '10',
    commonMistakes: [
      'No attendance requirements, leading to inconsistent turnout and no-show culture',
      'Meeting agenda too loose - members leave feeling no value was generated',
      'Overly broad membership criteria diluting referral quality',
      'No clear value proposition for why someone should join vs. attending free events',
    ],
    toolsNeeded: [
      'Member management and dues collection (GatherGrove)',
      'Meeting agenda template',
      'Referral tracking spreadsheet (for referral-based groups)',
      'Video conferencing for hybrid/virtual options',
    ],
    faqQuestions: [
      {
        question: 'How is a networking group different from BNI?',
        answer:
          'BNI is a franchised referral organization with standardized meeting formats, mandatory attendance, and formal referral tracking. An independent networking group has more flexibility in format, dues, and requirements. BNI chapters provide proven structure and a national brand; independent groups offer more customization and lower cost.',
      },
      {
        question: 'What should networking group dues cover?',
        answer:
          'Dues typically cover: meeting venue costs (often the largest expense), event programming, guest speakers, administrative tools, and a small operating reserve. For groups meeting 48 times per year, venue costs alone can be $2,400-$6,000/year for a group of 20-30 members.',
      },
    ],
    keywords: ['how to start a networking group', 'professional networking club', 'business networking group setup', 'referral group formation'],
    relatedClubTypes: ['professional-associations', 'social-clubs'],
    relatedResources: [],
  },
  {
    slug: 'alumni-association',
    orgType: 'Alumni Association',
    title: 'How to Start an Alumni Association',
    category: 'professional',
    description:
      'An alumni association keeps graduates connected, advances professional networking, and supports the institution or program they attended. This guide covers founding a chapter, managing a growing membership database, and delivering events that bring alumni back.',
    steps: [
      {
        title: 'Define your association\'s scope and purpose',
        description:
          'Clarify: Which graduates does this cover (school, program, department, graduation year range)? What is the primary purpose (networking, mentorship, fundraising for the institution, community service)? A focused mission attracts more active participation than a vague "stay connected" charter.',
      },
      {
        title: 'Get institutional support or operate independently',
        description:
          'If affiliated with a school or program, secure formal approval from leadership before using institutional branding. Understand what resources the institution will provide (mailing list, event space, staff support) and what the association is responsible for independently.',
      },
      {
        title: 'Identify and contact potential founding members',
        description:
          'Reach out to known graduates through LinkedIn, personal networks, and any available alumni contact lists. The founding committee should represent different graduation years and geographic regions for broader appeal.',
      },
      {
        title: 'Draft bylaws and establish governance',
        description:
          'Alumni association bylaws should cover: membership eligibility, dues structure (lifetime, annual, student), officer roles (president, VP, secretary, treasurer), board composition, elections, and regional chapter provisions if applicable.',
      },
      {
        title: 'Incorporate as a nonprofit and obtain an EIN',
        description:
          'Most alumni associations incorporate as nonprofit corporations. Apply for 501(c)(3) status if your purpose includes charitable activities supporting the institution; 501(c)(7) if primarily social/networking.',
      },
      {
        title: 'Build and maintain the alumni database',
        description:
          'The database is the association\'s most valuable asset. Capture: full name, graduation year, current employer/role, email, location, and interests. Implement a systematic process to keep records updated - people move and change jobs constantly.',
      },
      {
        title: 'Plan signature annual events',
        description:
          'Homecoming, an annual gala, career fair, or mentorship program creates the anchor events alumni plan around. Consistent annual events with strong traditions drive year-over-year retention better than ad hoc programming.',
      },
      {
        title: 'Set up membership management tools',
        description:
          'GatherGrove manages the member database, dues collection (annual and lifetime tiers), event registration, and alumni communications - core infrastructure for any functional alumni association.',
      },
    ],
    legalRequirements:
      'State nonprofit incorporation ($25-$100), EIN (free), 501(c)(3) or 501(c)(7) application, annual Form 990 filing. If raising funds for an institution, coordinate with the institution\'s development office and legal counsel to avoid conflicts with their own fundraising activities.',
    estimatedStartupCost: '$300-$2,000 (state filing, IRS application, event costs, management tools)',
    minMembersToLaunch: '10',
    commonMistakes: [
      'No systematic database management - contact list grows stale within 2 years',
      'Events that only appeal to recent graduates, alienating senior alumni',
      'Conflict with the institution\'s own alumni development office (competing fundraising)',
      'No clear membership value proposition beyond "you attended here"',
    ],
    toolsNeeded: [
      'Member and alumni database management (GatherGrove)',
      'Email marketing platform',
      'Event registration and payment processing',
      'LinkedIn group for ongoing professional networking',
    ],
    faqQuestions: [
      {
        question: 'Should an alumni association be a nonprofit?',
        answer:
          'Yes, in most cases. Nonprofit status provides liability protection for officers, enables a dedicated bank account, and - with 501(c)(3) status - makes donations tax-deductible (important if fundraising for scholarships or institutional support). The modest filing costs are worth the protection.',
      },
      {
        question: 'How do you build and maintain an alumni database?',
        answer:
          'Start with available contact information from the institution and LinkedIn. Implement a systematic annual update process - email bounces, address changes, and employer changes make databases go stale quickly. Offer incentives for members to update their own profiles (access to member directory, event invitations). A member management platform with self-service profile updates is more effective than manual database maintenance.',
      },
    ],
    keywords: ['how to start an alumni association', 'alumni association formation', 'alumni chapter setup', 'graduate network organization'],
    relatedClubTypes: ['professional-associations', 'community-organizations'],
    relatedResources: [],
  },
  // ── YOUTH ────────────────────────────────────────────────────────────────
  {
    slug: 'youth-soccer-club',
    orgType: 'Youth Soccer Club',
    title: 'How to Start a Youth Soccer Club',
    category: 'youth',
    description:
      'Youth soccer clubs develop athletic skills, teamwork, and lifelong physical activity habits in young players. Getting the structure right from the start - background checks for all coaches, US Youth Soccer registration, proper insurance, and clear seasonal schedules - protects families, protects your organization, and creates a program players want to return to year after year. This guide covers every step from securing fields and coaching certifications to managing player rosters and collecting registration fees online.',
    steps: [
      {
        title: 'Affiliate with your state youth soccer association',
        description:
          'Registration with your state youth soccer association (affiliated with US Youth Soccer / United Soccer Alliance) is required for league play and access to player insurance. Contact your state association to understand registration requirements, fees, season structures (typically fall and spring), and age-group divisions. Your state association will also be the source of requirements for coach certifications and background checks.',
      },
      {
        title: 'File Articles of Incorporation as a nonprofit',
        description:
          'Youth soccer clubs are almost universally organized as 501(c)(3) nonprofits. File with your state Secretary of State as a nonprofit corporation before recruiting members or collecting fees. Filing fees are $25-$100. Incorporate before opening a bank account or signing any field lease or insurance contract.',
      },
      {
        title: 'Draft bylaws and elect a board',
        description:
          'Bylaws must cover: organizational purpose, membership (player families), board composition, officer election, financial controls, and an annual audit requirement. Recruit a founding board with skills in finance, legal, and sports administration. A registrar role is essential - managing player eligibility, age verification, and medical forms is time-consuming and benefits from a dedicated volunteer.',
      },
      {
        title: 'Apply for 501(c)(3) status',
        description:
          'Youth sports organizations generally qualify as 501(c)(3) amateur athletic organizations. Apply via IRS Form 1023 or 1023-EZ. Most new clubs qualify for 1023-EZ, which costs $275 and is approved in 2-4 weeks. 501(c)(3) status allows you to accept tax-deductible donations and often qualifies your club for lower facility rental rates from parks departments.',
      },
      {
        title: 'Establish a background check and safeguarding policy',
        description:
          'Background checks for all adult volunteers and coaches are required by US Youth Soccer, most state associations, and most facilities. Partner with a NCSI-approved screening service and establish a written policy that states what disqualifying offenses prevent someone from working with youth. Require renewal every 2 years. Also implement SafeSport training for all coaches - it is required by state associations in most states.',
      },
      {
        title: 'Require coaching certifications',
        description:
          'US Youth Soccer and most state associations require coaches to complete minimum training before leading practices. The US Soccer D License (minimum for competitive teams) and Grassroots licenses (4v4, 7v7, 9v9, 11v11) are the starting points. USSF Grassroots courses are affordable ($20-$60) and cover age-appropriate coaching methods. Coaches who are not certified cannot participate in sanctioned league play in most states.',
      },
      {
        title: 'Secure field permits and facility agreements',
        description:
          'Contact your parks department, school district, or private facilities to negotiate field use agreements. Get permit costs, availability, and insurance requirements in writing before announcing tryouts or registration. Field permits for youth sports typically require proof of insurance and 501(c)(3) status. Many fields are booked 6-12 months in advance for prime fall season slots.',
      },
      {
        title: 'Obtain comprehensive insurance coverage',
        description:
          'Youth clubs need: general liability, accident insurance for players (medical costs from injuries are the #1 liability), and D&O insurance for board members. Coverage through your state association\'s group program is typically more cost-effective than standalone policies. Verify that your policy covers both practices and games, including travel to away matches.',
      },
      {
        title: 'Structure seasonal registration and team formation',
        description:
          'Define your age groups (typically U6 through U19, following USYS standards), registration windows, and tryout processes. Recreational clubs typically use open enrollment without tryouts; competitive clubs hold annual tryouts in April/May for fall teams. Clearly communicate the difference between recreational and competitive tracks so families can choose appropriately.',
      },
      {
        title: 'Set up player registration and dues collection',
        description:
          'Seasonal registration fees of $100-$300/player are typical for recreational leagues; competitive programs often range $500-$2,000. Use GatherGrove to manage player applications, collect registration fees online, track player eligibility (age verification, physicals, signed waivers), manage team rosters, and communicate with families throughout the season.',
      },
    ],
    legalRequirements:
      'Required: State nonprofit incorporation ($25-$100), EIN (free), IRS Form 1023 or 1023-EZ ($275-$600), state youth soccer association registration, comprehensive insurance (liability + accident), background check policy for all adults with youth contact, SafeSport training for coaches. Annual Form 990 filing. Coaching certifications (USSF Grassroots or D License) required for sanctioned league participation.',
    estimatedStartupCost: '$2,000-$12,000 first year (state filing $25-$100, IRS form $275-$600, USYS fees $200-$500, insurance $1,000-$5,000, background checks $10-$25/person, field permits $200-$2,000, equipment $500-$3,000)',
    minMembersToLaunch: '15',
    commonMistakes: [
      'Insufficient accident insurance - medical bills from youth injuries are the #1 financial risk',
      'No background check policy for coaches and volunteers; required by US Youth Soccer and most facilities',
      'Operating without state youth soccer association registration - blocks league participation and player insurance',
      'Field permits not secured before announcing registration - fields in popular parks book 6-12 months in advance',
      'Coaches without USSF certifications - state associations will not allow uncertified coaches in sanctioned play',
      'Mixing recreational and competitive tracks without clear communication - families have very different expectations and the resulting conflicts are the most common source of club drama',
    ],
    toolsNeeded: [
      'Player registration and management (GatherGrove)',
      'Online payment processing for registration fees',
      'Background check service (NCSI-approved provider)',
      'Parent communication platform',
      'Roster management and age-verification tracking',
    ],
    faqQuestions: [
      {
        question: 'How much does it cost to start a youth soccer club?',
        answer:
          'First-year costs typically range from $2,000-$12,000 depending on the number of teams and your region\'s field costs. The largest expenses are insurance ($1,000-$5,000/year), field permits ($200-$2,000/season), equipment ($500-$3,000), and legal/registration fees ($500-$1,200).',
      },
      {
        question: 'Do youth soccer coaches need background checks?',
        answer:
          'Yes. Background checks for all adult volunteers and coaches are required by US Youth Soccer, most state associations, and the majority of facility landlords. Use a NCSI-approved background check provider and establish a written policy about disqualifying offenses. Renew background checks every two years.',
      },
      {
        question: 'What certifications do youth soccer coaches need?',
        answer:
          'US Soccer Grassroots licenses are the entry-level requirement - there are age-specific courses for 4v4, 7v7, 9v9, and 11v11 formats, typically costing $20-$60 each. Competitive team coaches are often required to hold a D License or higher. Most state youth soccer associations publish specific certification requirements for each competitive level. SafeSport training is additionally required by most state associations for any adult with direct youth contact.',
      },
      {
        question: 'How do I handle player fees and insurance for a youth soccer club?',
        answer:
          'Collect seasonal registration fees online through your member management platform to avoid cash handling and create payment records. Player accident insurance is typically provided through your state association\'s group program - the cost is factored into your state registration fees. Supplement with a general liability policy for the club entity. Consider a needs-based scholarship fund for families who cannot afford full registration fees - this improves access and community goodwill.',
      },
    ],
    keywords: ['how to start a youth soccer club', 'youth soccer league formation', 'starting a youth sports organization', 'youth soccer club formation', 'start youth soccer league', 'youth sports club setup'],
    relatedClubTypes: ['youth-sports-clubs', 'sports-clubs'],
    relatedResources: [],
  },
  {
    slug: 'band-booster-club',
    orgType: 'Band Booster Club',
    title: 'How to Start a Band Booster Club',
    category: 'youth',
    description:
      'Band booster clubs fund equipment, travel, uniforms, and enrichment activities that school budgets cannot cover. This guide covers launching a booster club that complies with school policies, maintains tax-exempt status, and runs effective fundraisers.',
    steps: [
      {
        title: 'Get school and district approval',
        description:
          'School booster clubs operate on school grounds and associate with a school program. You must get formal approval from the school principal and district administration before forming. Many districts have specific policies governing booster club operations.',
      },
      {
        title: 'Review district booster club policies',
        description:
          'Most school districts have written policies for parent booster organizations covering: financial controls, use of school name/logo, fundraiser approval processes, and required annual reporting. Read these carefully before drafting your bylaws.',
      },
      {
        title: 'Form a founding committee and elect officers',
        description:
          'You need at minimum: President, Vice-President, Secretary, and Treasurer. The Treasurer role requires someone with financial literacy and trustworthiness - booster clubs are a common target of internal fraud when financial controls are weak.',
      },
      {
        title: 'Draft bylaws and incorporate as a nonprofit',
        description:
          'Draft bylaws following the district\'s model or the ParentBooster USA template. Incorporate as a nonprofit corporation in your state ($25-$100). Many districts require incorporated status before recognizing a booster club.',
      },
      {
        title: 'Obtain an EIN and open a dedicated bank account',
        description:
          'Apply for a free EIN at IRS.gov. Open a checking account under the organization\'s EIN - never under a personal name. Two-signature requirements for checks above a threshold amount are strongly recommended.',
      },
      {
        title: 'Apply for 501(c)(3) status',
        description:
          'Most band booster clubs qualify for 501(c)(3) status as educational organizations supporting youth development. Use Form 1023-EZ ($275) if you expect annual gross receipts under $50,000. This makes donations tax-deductible and exempts fundraising income from federal taxes.',
      },
      {
        title: 'Establish financial controls',
        description:
          'Require dual authorization on all expenditures above $100. Conduct quarterly financial reviews. Obtain a fidelity bond (dishonesty insurance) for the treasurer. Booster club fraud is common - protect your organization and your volunteer officers.',
      },
      {
        title: 'Plan compliant fundraisers',
        description:
          'Use GatherGrove to manage member enrollment, collect dues, coordinate volunteer sign-ups, and process event payments. Run fundraisers that are school-approved and compliant with 501(c)(3) equal-benefit rules (fundraiser proceeds cannot accrue to individual students).',
      },
    ],
    legalRequirements:
      'State nonprofit incorporation ($25-$100), EIN (free), IRS Form 1023-EZ ($275) for 501(c)(3), annual Form 990 filing, compliance with school district booster club policies, fidelity bond for treasurer. Many districts require annual financial reports.',
    estimatedStartupCost: '$300-$1,000 (state filing $25-$100, IRS 1023-EZ $275, fidelity bond $100-$500/year)',
    minMembersToLaunch: '4',
    commonMistakes: [
      'Tracking fundraiser contributions toward individual students (violates 501c3 equal-benefit rules)',
      'No dual-signature requirement on checks (enables internal fraud)',
      'Operating without district approval and being shut down mid-year',
      'Failing to file annual Form 990 (auto-revocation after 3 missed years)',
    ],
    toolsNeeded: [
      'Member and volunteer management (GatherGrove)',
      'Fundraising payment processing',
      'Accounting software (QuickBooks, Wave)',
      'Volunteer scheduling tool',
    ],
    faqQuestions: [
      {
        question: 'Can a band booster club pay for individual students\' expenses?',
        answer:
          'No, not if they want to maintain 501(c)(3) status. Under IRS rules, 501(c)(3) fundraiser proceeds must benefit the entire program, not accrue to individual students. "Individual student benefit" - like tracking fundraising credits toward a single student\'s trip costs - is explicitly prohibited and will jeopardize your tax-exempt status.',
      },
      {
        question: 'How do band booster clubs raise money?',
        answer:
          'The most effective fundraisers for booster clubs include: consignment card programs (restaurants, car washes), sponsorship packages from local businesses, concession stand operations at school events, and product sales (candy, gift wrap). Avoid fundraisers with high overhead costs - aim for fundraisers where at least 50% of gross revenue reaches the program.',
      },
    ],
    keywords: ['how to start a band booster club', 'booster club formation', 'school band parent organization', 'music booster club setup'],
    relatedClubTypes: ['youth-organizations', 'community-organizations'],
    relatedResources: [],
  },
  {
    slug: 'coding-club',
    orgType: 'Youth Coding Club',
    title: 'How to Start a Youth Coding Club',
    category: 'youth',
    description:
      'Youth coding clubs develop critical digital skills, creative problem-solving, and an early pipeline into technology careers. This guide covers launching a club at a school, library, or community center with minimal budget and maximum impact.',
    steps: [
      {
        title: 'Choose a host institution and secure space',
        description:
          'Schools, public libraries, and community centers are the best hosts for youth coding clubs. They provide space, credibility, and access to the target audience. Many also provide computers, which eliminates the biggest equipment barrier.',
      },
      {
        title: 'Select a curriculum and technology platform',
        description:
          'Free curriculum options include: Code.org (block-based, beginner-friendly), Scratch (MIT Media Lab, visual programming), Python via CS First (Google), and Raspberry Pi Foundation resources. Choose based on target age group and available hardware.',
      },
      {
        title: 'Define age range and skill levels',
        description:
          'Elementary-age clubs (7-11) do best with block-based coding (Scratch, Code.org). Middle school (11-14) can progress to Python or web development. High school clubs can tackle advanced projects, hackathons, and CS competitions like USACO.',
      },
      {
        title: 'Recruit volunteer instructors or mentors',
        description:
          'Local tech companies, university CS departments, and coding bootcamp graduates are excellent sources of volunteer instructors. Background checks are required for all adults working with minors.',
      },
      {
        title: 'Handle parental consent and safety protocols',
        description:
          'Collect signed parental consent forms for all participants. Establish internet safety guidelines and acceptable use policies for computer use. Many host institutions require this documentation before allowing youth programs.',
      },
      {
        title: 'Establish a project-based learning structure',
        description:
          'The most successful coding clubs culminate in projects (games, websites, apps) that members can share with family. End-of-session showcase events dramatically increase family engagement and club retention.',
      },
      {
        title: 'Incorporate and apply for grants if needed',
        description:
          'For independent clubs needing equipment or curriculum funding, nonprofit status opens access to grants from Google.org, Code.org, and local community foundations. 501(c)(3) incorporation enables tax-deductible donations from corporate sponsors.',
      },
      {
        title: 'Set up member management tools',
        description:
          'GatherGrove manages member registration (with parent contact info), session RSVPs, volunteer coordination, and parent communications - critical infrastructure for a safe, well-run youth program.',
      },
    ],
    legalRequirements:
      'Background checks required for all adult volunteers. Parental consent forms for all participants. Institutional approval from host organization. Optional: nonprofit incorporation for clubs seeking grants or external donations.',
    estimatedStartupCost: '$0-$2,000 (free curricula available; equipment $500-$2,000 if not provided by host institution; management tools)',
    minMembersToLaunch: '6',
    commonMistakes: [
      'No background checks for adult mentors and instructors',
      'Curriculum too advanced for age group, leading to frustration and dropout',
      'No parent communication plan',
      'Underestimating the time commitment for volunteer instructors',
    ],
    toolsNeeded: [
      'Member registration and parent communication (GatherGrove)',
      'Coding curriculum platform (Code.org, Scratch)',
      'Volunteer scheduling tool',
      'Project showcase website',
    ],
    faqQuestions: [
      {
        question: 'What age is appropriate for a coding club?',
        answer:
          'Coding clubs can start as young as 6-7 using drag-and-drop platforms like ScratchJr. Ages 8-11 work well with Scratch and Code.org Hour of Code activities. Ages 12+ can begin text-based programming in Python. Separate age-group sessions are more effective than mixed-age clubs.',
      },
      {
        question: 'How do you find volunteer coding instructors?',
        answer:
          'Post on local tech Meetup groups, LinkedIn, and university CS department listservs. Reach out to local tech companies - many have employee volunteer programs specifically for STEM education. Girls Who Code, Code.org, and Black Girls Code also have facilitator networks for recruiting diverse instructors.',
      },
    ],
    keywords: ['how to start a coding club', 'youth coding club setup', 'kids programming club', 'STEM club for youth'],
    relatedClubTypes: ['youth-organizations'],
    relatedResources: [],
  },
  {
    slug: 'robotics-team',
    orgType: 'FIRST Robotics Team',
    title: 'How to Start a FIRST Robotics Team',
    category: 'youth',
    description:
      'FIRST Robotics teams teach engineering, teamwork, and problem-solving through exciting competitive challenges. This guide covers registering with FIRST, securing mentors and sponsors, and managing your team through competition season.',
    steps: [
      {
        title: 'Choose your FIRST program level',
        description:
          'FIRST offers four programs: FIRST LEGO League Jr. (ages 6-10), FIRST LEGO League (ages 9-16), FIRST Tech Challenge (grades 7-12), and FIRST Robotics Competition (FRC, high school). Each has different costs, complexity, and time commitment.',
      },
      {
        title: 'Register with FIRST',
        description:
          'Register your team at firstinspires.org. Registration fees vary: FLL Jr. $225, FLL $225-$285, FTC $295, FRC $5,000-$6,000 (includes competition registration). FRC teams should register in early fall for the following spring season.',
      },
      {
        title: 'Secure adult mentors with engineering or programming expertise',
        description:
          'FIRST requires at least 2 registered adult mentors per team. Mentors must pass background checks. Recruit from local engineering firms, university engineering departments, and tech companies. Mentor quality is the single strongest predictor of team success.',
      },
      {
        title: 'Find a sponsoring organization',
        description:
          'Most FIRST teams are sponsored by a school, nonprofit, or business. The sponsoring organization provides legal standing, bank account access, and often equipment storage. FRC teams especially need corporate sponsors for the $5,000+ registration fee plus build costs.',
      },
      {
        title: 'Recruit students and establish team culture',
        description:
          'Partner with school STEM teachers to recruit students. FIRST emphasizes "Gracious Professionalism" - excellence while treating competitors with respect. Establishing this culture early shapes the entire team experience.',
      },
      {
        title: 'Secure a build space and tools',
        description:
          'FRC teams need a dedicated workshop space with tools (drill press, band saw, CNC if available). Schools, makerspaces, and sponsoring companies sometimes provide space. A reliable, accessible workspace is critical for a successful season.',
      },
      {
        title: 'Develop a fundraising strategy',
        description:
          'FRC team budgets typically run $20,000-$50,000+/year including registration, parts, tools, and travel to competitions. Funding sources: corporate sponsors, school district allocations, grants (FIRST provides a grants database), and fundraising events.',
      },
      {
        title: 'Set up team management tools',
        description:
          'GatherGrove helps manage student rosters, parent contact information, volunteer mentor tracking, and team communications - essential infrastructure for a team with 15-30 students and multiple adult mentors.',
      },
    ],
    legalRequirements:
      'Background checks for all adult mentors (FIRST requirement). Sponsoring organization must be a legal entity. Most teams operate under a nonprofit sponsor or school. For independent teams: state nonprofit incorporation, EIN, and 501(c)(3) status recommended.',
    estimatedStartupCost: 'FLL: $500-$1,500; FTC: $1,500-$5,000; FRC: $20,000-$50,000+ (registration $5,000-$6,000 plus parts, tools, travel)',
    minMembersToLaunch: '6',
    commonMistakes: [
      'Insufficient mentors with technical expertise',
      'No dedicated build space arranged before the season starts',
      'Underestimating FRC budget - teams without fundraising plans struggle mid-season',
      'Neglecting team culture and Gracious Professionalism in pursuit of competition results',
    ],
    toolsNeeded: [
      'Team roster and communication management (GatherGrove)',
      'CAD software (Onshape, free for FRC)',
      'Project management tool for build season (Trello, Asana)',
      'Fundraising and donor management',
    ],
    faqQuestions: [
      {
        question: 'How much does it cost to start an FRC robotics team?',
        answer:
          'FIRST Robotics Competition (FRC) is the most expensive FIRST program. Registration alone costs $5,000-$6,000/year. With parts, tools, and travel to regionals, most FRC team budgets are $20,000-$50,000+/year. Corporate sponsorships are essential, and FIRST provides a grants database to help teams find funding.',
      },
      {
        question: 'Does a FIRST Robotics team need to be a nonprofit?',
        answer:
          'No, but most teams operate under a nonprofit sponsor (a school, community organization, or FIRST-affiliated nonprofit). Operating under a nonprofit sponsor avoids the complexity of forming your own legal entity. Teams that do incorporate independently benefit from 501(c)(3) status for tax-deductible sponsorship donations.',
      },
    ],
    keywords: ['how to start a FIRST robotics team', 'FRC team formation', 'FIRST Lego League setup', 'robotics club youth'],
    relatedClubTypes: ['youth-organizations'],
    relatedResources: [],
  },
  {
    slug: 'fishing-club',
    orgType: 'Fishing Club',
    title: 'How to Start a Fishing Club',
    category: 'hobby',
    description:
      'Fishing clubs share local knowledge, organize tournaments, and build a community around the water. This guide covers founding a club whether you\'re targeting freshwater bass anglers, fly fishers, or saltwater enthusiasts.',
    steps: [
      { title: 'Define your fishing focus', description: 'Freshwater vs. saltwater, bass fishing vs. fly fishing vs. ice fishing all attract different communities. A focused club identity helps you recruit the right members and plan relevant events.' },
      { title: 'Find a meeting venue', description: 'Tackle shops, sporting goods stores, and community centers are natural partners. Many tackle shops will host fishing clubs in exchange for promotion and the foot traffic members bring.' },
      { title: 'Draft simple bylaws and collect dues', description: 'Annual dues of $20-$50 are typical. Bylaws should cover membership, dues, tournament rules, officer election, and how the club handles tournament prize funds.' },
      { title: 'Plan your fishing event calendar', description: 'Club tournaments (catch-and-release or harvest), group fishing trips to local lakes or out-of-state destinations, and beginner clinics are the core programming for most fishing clubs.' },
      { title: 'Obtain an EIN and bank account', description: 'Get a free EIN at IRS.gov and open a dedicated account for dues and tournament entry fees. Never manage club money through personal accounts.' },
      { title: 'Establish tournament rules and weigh-in procedures', description: 'Clear tournament rules prevent disputes: eligible bodies of water, legal species and size limits, weigh-in procedures, and prize structure. Many clubs use conservation weigh-ins (live well, immediate release) to model responsible angling.' },
      { title: 'Set up member management tools', description: 'GatherGrove handles member registration, dues collection, tournament sign-ups, and fishing trip RSVPs - keeping your club organized so you can focus on fishing.' },
      { title: 'Promote at local bait shops and fishing forums', description: 'Post on local Facebook fishing groups, Bassmaster local clubs network, and Fishing Forum communities. Partner with local bait and tackle shops for mutual promotion.' },
    ],
    legalRequirements: 'No mandatory legal structure. Recommend EIN and bank account for clubs collecting dues. Fishing licenses are individual, not club-level requirements - each member must hold current state fishing licenses.',
    estimatedStartupCost: '$100-$500 first year (venue if not free, tournament supplies, admin tools)',
    minMembersToLaunch: '6',
    commonMistakes: [
      'No clear tournament rules causing disputes over weigh-ins and eligibility',
      'Collecting tournament entry fees in cash with no records',
      'No conservation policies, creating community relations problems',
      'Events on private waters without landowner permission',
    ],
    toolsNeeded: ['Member management (GatherGrove)', 'Tournament sign-up and payment collection', 'Group communication platform'],
    faqQuestions: [
      { question: 'Does a fishing club need a fishing license?', answer: 'No, fishing licenses are individual requirements - each member must hold their own valid state fishing license. The club itself does not need a license. However, if the club leases private fishing waters, a lease agreement with the landowner is required.' },
      { question: 'How do fishing club tournaments work?', answer: 'Most club tournaments are catch-and-release format with a points-based season standings. Anglers fish a designated body of water for a set time, then weigh in their top 5 fish (by weight). Live well requirements protect fish during weigh-in. Season champions are determined by cumulative tournament points.' },
    ],
    keywords: ['how to start a fishing club', 'fishing club formation', 'bass fishing club setup', 'angling club organizer'],
    relatedClubTypes: ['outdoor-clubs', 'sports-clubs'],
    relatedResources: [],
  },
  {
    slug: 'astronomy-club',
    orgType: 'Astronomy Club',
    title: 'How to Start an Astronomy Club',
    category: 'hobby',
    description:
      'Astronomy clubs bring together stargazers to share equipment, knowledge, and the wonder of the night sky. This guide covers organizing star parties, managing equipment loans, and building a club that serves both beginners and experienced observers.',
    steps: [
      { title: 'Find a dark sky site and secure access', description: 'Dark sky access is the most critical resource for an astronomy club. Contact county parks, state parks, and private landowners about holding star party events. Document the sky quality rating (Bortle scale) of each site.' },
      { title: 'Recruit founding members', description: 'Reach out via the Astronomical League, regional astronomy forums, and Facebook astronomy groups. Local science museums, planetariums, and universities are also excellent partner organizations.' },
      { title: 'Plan a star party schedule', description: 'Schedule star parties around new moon weekends for the darkest skies. A monthly star party cadence works well for most clubs. Also plan public outreach events to attract new members.' },
      { title: 'Build a shared equipment library', description: 'Club-owned telescopes (often donated by retiring members) for loaner use are a major membership benefit. Establish a checkout policy and require members to demonstrate safe setup and takedown before borrowing.' },
      { title: 'Affiliate with the Astronomical League', description: 'AL affiliation ($8-$10/year per member) provides access to observing programs, the Reflector magazine, observing clubs, and awards. It also adds credibility and connects your club to a 15,000-member national network.' },
      { title: 'Draft bylaws and collect dues', description: 'Annual dues of $25-$60 are typical for astronomy clubs. Bylaws should cover membership, dues, equipment library management, officer election, and meeting rules.' },
      { title: 'Set up member management tools', description: 'GatherGrove manages member registration, dues, star party RSVPs, and equipment loan tracking - keeping club administration organized.' },
      { title: 'Host public outreach events', description: 'Public star parties at schools, libraries, and parks attract new members and build goodwill. Loaner scopes from your club library make these events accessible and impressive.' },
    ],
    legalRequirements: 'No mandatory legal structure for informal clubs. EIN and bank account recommended once annual dues exceed $1,000. Some dark sky site permits require nonprofit status or proof of insurance.',
    estimatedStartupCost: '$200-$800 first year (AL affiliation $8-$10/member, venue if not free, equipment if not donated)',
    minMembersToLaunch: '8',
    commonMistakes: [
      'No dark sky site secured before recruiting members',
      'Equipment library without checkout policies - lost or damaged optics',
      'Star parties scheduled around full moon (worst sky conditions)',
      'No beginner orientation program, alienating new members with technical jargon',
    ],
    toolsNeeded: ['Member management (GatherGrove)', 'Astronomical League observing logs', 'Sky quality meter for site assessment', 'Group communication platform'],
    faqQuestions: [
      { question: 'What equipment does an astronomy club need?', answer: 'For club use, a 6-8 inch reflector telescope ($300-$600) and a 2-3 inch refractor for beginners are solid starting points. If you can obtain donated equipment, start there. A red flashlight collection (essential for preserving night vision) is inexpensive and appreciated by all members.' },
      { question: 'How do astronomy clubs find dark sky sites?', answer: 'Contact your county or state parks department about hosting events in low-light-pollution areas. The Dark Sky Finder (darksitefinder.com) and Light Pollution Map identify low-pollution zones near you. Some clubs maintain long-term agreements with rural landowners or state parks that welcome low-impact, non-amplified nighttime events.' },
    ],
    keywords: ['how to start an astronomy club', 'astronomy club formation', 'star party club setup', 'telescope club organizer'],
    relatedClubTypes: ['hobby-clubs', 'outdoor-clubs'],
    relatedResources: [],
  },
  {
    slug: 'volunteer-organization',
    orgType: 'Volunteer Organization',
    title: 'How to Start a Volunteer Organization',
    category: 'community',
    description:
      'Volunteer organizations mobilize community members to address local needs through coordinated service. This guide covers founding a volunteer group, managing volunteer schedules, and building the infrastructure for sustained community impact.',
    steps: [
      { title: 'Identify your service focus and community need', description: 'The most effective volunteer organizations address a specific, observable gap: food insecurity, environmental cleanup, senior companion programs, or disaster preparedness. A focused mission attracts committed volunteers and makes impact measurable.' },
      { title: 'Research existing organizations', description: 'Before founding a new organization, verify that a similar group does not already exist locally. Partnering with or supporting an existing organization is often more impactful than creating a duplicate effort.' },
      { title: 'Recruit founding volunteers', description: 'Start with 10-20 committed volunteers who share your vision. Host an organizational meeting to define the mission, initial projects, and governance structure. Founding volunteer quality matters more than quantity.' },
      { title: 'Establish a governance structure', description: 'Even volunteer organizations need structure: a board or steering committee, clear roles, decision-making processes, and financial controls. Organizations that start with clear governance sustain longer than those that rely entirely on founding-member relationships.' },
      { title: 'Incorporate as a nonprofit and obtain 501(c)(3) status', description: 'Nonprofit status enables tax-deductible donations, grants, and liability protection for volunteers and officers. File with your state and apply for 501(c)(3) status via Form 1023-EZ if annual receipts will be under $50,000.' },
      { title: 'Establish volunteer management systems', description: 'Track volunteer hours, skills, availability, and background check status systematically. Organizations that respect volunteers\' time with efficient sign-up and scheduling systems retain volunteers at significantly higher rates.' },
      { title: 'Set up volunteer management tools', description: 'GatherGrove handles volunteer registration, availability tracking, event sign-ups, hours logging, and mass communications - essential infrastructure for coordinating dozens or hundreds of volunteers.' },
      { title: 'Launch with a high-visibility community project', description: 'A well-executed inaugural project builds credibility, attracts media attention, and demonstrates impact. Choose a project that is achievable in a single day, visually impressive, and clearly beneficial to the community.' },
    ],
    legalRequirements: 'State nonprofit incorporation ($25-$100), EIN (free), IRS Form 1023-EZ ($275) for 501(c)(3), annual Form 990 filing. Volunteer protection laws vary by state - many states provide liability immunity for nonprofit volunteers acting in good faith.',
    estimatedStartupCost: '$300-$2,000 (state filing, IRS application, insurance, management tools)',
    minMembersToLaunch: '10',
    commonMistakes: [
      'No volunteer scheduling system, leading to over-commitment or under-staffed events',
      'Duplicate of existing organizations, fragmenting limited community resources',
      'No volunteer recognition program, causing burnout and attrition',
      'Insufficient liability protection for volunteers',
    ],
    toolsNeeded: ['Volunteer management (GatherGrove)', 'Hours tracking system', 'Background check service for youth-adjacent roles', 'Communication platform'],
    faqQuestions: [
      { question: 'How do you recruit volunteers for a new organization?', answer: 'Post on VolunteerMatch.org, Idealist.org, All for Good, and local Facebook community groups. Partner with faith organizations, universities (service-learning programs), and corporations (employee volunteer programs). Host a volunteer fair at a public library or community center. Your first volunteers typically come from your personal network - ask directly.' },
      { question: 'Do volunteers need to be background checked?', answer: 'Background checks are required for volunteers working with children, vulnerable adults, or in positions of financial trust (treasurer). For general community service activities with adults, background checks are optional but recommended for leadership positions. Check your state\'s volunteer protection act for specific requirements.' },
    ],
    keywords: ['how to start a volunteer organization', 'volunteer group formation', 'community service organization setup', 'nonprofit volunteer group'],
    relatedClubTypes: ['nonprofits', 'community-organizations'],
    relatedResources: [],
  },
  {
    slug: 'car-club',
    orgType: 'Car Club',
    title: 'How to Start a Car Club',
    category: 'hobby',
    description:
      'Car clubs unite automotive enthusiasts around a shared passion for vehicles - whether classic, muscle, sports, electric, off-road, or a specific make and model. Getting your club properly organized means more than great cars: it means securing the right event permits for car shows, carrying insurance that protects participants at track days, understanding local DMV and safety regulations, and managing member rosters as your club grows. This guide walks through every step of car club formation so you can focus on the cars.',
    steps: [
      {
        title: 'Define your club\'s vehicle focus',
        description:
          'Make-specific clubs (Mustang, Corvette, VW, BMW), era-specific clubs (pre-war, muscle cars, JDM), or type-specific clubs (off-road, electric vehicles, exotics) attract more dedicated members than catch-all "car enthusiasts" clubs. A clear focus makes it easier to plan relevant events, attract sponsorships from specialty vendors, and negotiate group rates on insurance. If your focus is broad, consider defining it by activity type (show cars only, driving enthusiasts, track days) rather than vehicle type.',
      },
      {
        title: 'Find founding members',
        description:
          'Post in local Facebook car groups, automotive subreddits, and model-specific forums. Attend regional car shows, swap meets, cruise nights, and manufacturer meetups. Dealerships specializing in your vehicle type are natural allies - some will sponsor club events in exchange for member referrals. Your first 10 members are the people who will define your club\'s culture, so recruit deliberately.',
      },
      {
        title: 'Draft bylaws and membership requirements',
        description:
          'Bylaws should cover: vehicle eligibility requirements (year, make, model, condition standards if relevant), dues structure, officer election, meeting frequency, code of conduct for club events, and guest vehicle policies for shows. Define what "counts" as a qualifying vehicle before disputes arise - this is the #1 source of early club friction.',
      },
      {
        title: 'Plan your event calendar',
        description:
          'Core events for car clubs: monthly cruise nights, an annual show-and-shine car show, road trips and rallies, and attendance at regional automotive events as a club. Track days require additional planning (timing with the track, technical inspection requirements, event liability insurance, and run-group assignments by experience level). A car show is often the year\'s flagship event and the single best membership recruitment opportunity.',
      },
      {
        title: 'Secure event permits for car shows and public events',
        description:
          'Car shows on public property (parks, streets, downtown areas) require event permits from your city or county parks department. Permit applications typically require proof of insurance, a site plan, estimated attendance, and sometimes a refundable deposit. Apply 6-8 weeks in advance - popular permit windows fill quickly. For shows on private property (shopping centers, fairgrounds), get written permission from the property owner and confirm their insurance requirements.',
      },
      {
        title: 'Understand DMV and safety regulations for track days',
        description:
          'Track days at sanctioned facilities require vehicles to pass a tech inspection (brake check, helmet requirement, roll bar standards for convertibles at speed). Each track has its own rules - review them before promoting the event to members. Some states require a Special Events Permit for time-speed-distance rallies on public roads. Never organize a speed-focused event on public streets; the legal and liability exposure is severe.',
      },
      {
        title: 'Affiliate with a national registry if applicable',
        description:
          'Make-specific national clubs (Mustang Club of America, National Corvette Owners Association, Porsche Club of America) provide magazines, national meets, technical resources, and a club charter. Annual chapter fees range from $50-$200. Affiliation gives your club access to established event frameworks and a ready audience for recruitment at national events.',
      },
      {
        title: 'Obtain event insurance for car shows and track days',
        description:
          'Car shows require event liability insurance - many venues require a certificate of insurance naming them as additionally insured before allowing events on their property. Specialty automotive event insurance for a one-day show starts around $200-$400. Track day insurance is separate and more complex; the track\'s insurance covers the facility, but participant liability waivers and club supplemental insurance protect your organization if a member\'s vehicle damages property or injures a spectator.',
      },
      {
        title: 'Set up member management tools',
        description:
          'Use GatherGrove to manage member registration, collect annual dues, handle event RSVPs for shows and cruises, track vehicle information per member, and send club communications. A proper system replaces the Facebook group + cash envelope combination that limits most car clubs from growing past 30 members.',
      },
      {
        title: 'Host your first cruise night or show',
        description:
          'A casual cruise night in a shopping center parking lot (with written permission from the property manager) is a low-barrier first event. Invite members and their vehicles, keep it relaxed, and use it to build relationships and refine your event format. Document the event with photos and share them on social media - car clubs grow through social proof of great events.',
      },
    ],
    legalRequirements:
      'No mandatory legal structure for informal clubs. EIN and bank account recommended for clubs collecting dues or organizing events with entry fees. Event permits required for shows on public property (apply 6-8 weeks in advance). Written property owner permission required for shows on private property. Liability waivers required for track days. Some states require Special Events Permits for organized rallies on public roads.',
    estimatedStartupCost: '$200-$1,500 first year (national affiliation $50-$200, event insurance $200-$400/event, trophies for shows, admin costs)',
    minMembersToLaunch: '8',
    commonMistakes: [
      'Hosting a car show without event liability insurance - venues will cancel your event and you face personal liability',
      'No vehicle eligibility standards in bylaws, creating disputes about what qualifies for the club',
      'Events on public property without proper permits - fines and forced event cancellations are common',
      'No succession plan when a founding leader steps back; car clubs often collapse when the key organizer burns out',
      'Organizing track days without understanding the facility\'s technical inspection requirements - members arrive with non-compliant vehicles and cannot participate',
      'Mixing show cars and track-day cars in the same club without separate governance - the two communities have very different needs and risk tolerances',
    ],
    toolsNeeded: [
      'Member management with vehicle tracking (GatherGrove)',
      'Event registration and payment processing',
      'Communication platform',
      'Photo sharing for member vehicles and event galleries',
    ],
    faqQuestions: [
      {
        question: 'How do car clubs organize car shows?',
        answer:
          'Car show organization involves: securing a venue with written permission (parking lot, fairgrounds, or park with permit), recruiting class judges, securing event liability insurance naming the venue as additionally insured, promoting via automotive social media and local clubs, and setting up registration for participating vehicles. Entry fees of $15-$30/vehicle are common, with proceeds going to club programs or charity. Apply for venue permits 6-8 weeks in advance.',
      },
      {
        question: 'Should a car club register vehicles collectively?',
        answer:
          'No - vehicles are individually owned and registered to their owners. The club itself has no vehicle registration requirement. However, if the club owns a trailer or display equipment, those would be registered to the club entity (requiring an EIN and incorporated status).',
      },
      {
        question: 'Do I need special insurance for a car club?',
        answer:
          'General liability insurance is strongly recommended for any organized club activity. For car shows, event liability insurance ($200-$400/event) covers injuries to spectators and damage at the event venue. For track days, participants typically sign liability waivers at the track, but your club should carry supplemental event insurance and require members to sign club waivers as well. Contact a specialty events insurance broker who handles automotive events for appropriate coverage options.',
      },
      {
        question: 'How do we organize car shows and track days?',
        answer:
          'Car shows: secure a venue, apply for required permits, recruit class judges, set up vehicle registration (typically $15-$30/car), arrange event liability insurance, and promote through automotive social media, model-specific forums, and local clubs. Track days: contact the track for their event requirements and tech inspection standards, establish run groups by experience level, require participant waivers, and confirm that your club\'s insurance covers organized track events. Most tracks offer "arrive and drive" days that clubs can attend as a group without organizing the event themselves - a lower-complexity option for newer clubs.',
      },
    ],
    keywords: ['how to start a car club', 'car club formation steps', 'starting an automotive club', 'car club formation', 'automotive club setup', 'car show club organizer'],
    relatedClubTypes: ['hobby-clubs', 'social-clubs'],
    relatedResources: [],
  },
  {
    slug: 'dog-training-club',
    orgType: 'Dog Training Club',
    title: 'How to Start a Dog Training Club',
    category: 'hobby',
    description:
      'Dog training clubs improve canine behavior, prepare dogs for competition, and connect owners who share a passion for working with their dogs. This guide covers AKC club chartering, finding training facilities, and managing member registrations.',
    steps: [
      { title: 'Define your training focus and AKC disciplines', description: 'AKC-affiliated clubs typically specialize in one or more dog sports: obedience, agility, rally, tracking, herding, field events, or conformation showing. Define your focus to attract members with aligned goals.' },
      { title: 'Apply for AKC club membership', description: 'Most serious dog training clubs affiliate with the American Kennel Club (AKC). AKC club membership enables you to host AKC-sanctioned events and trials. The chartering process involves submitting a constitution and bylaws, a member list (minimum 5 members in good AKC standing), and an application fee ($35-$50).' },
      { title: 'Secure a training facility', description: 'Dog training requires adequate space: a minimum 100\'x100\' area for obedience and agility work. Options: rented gymnasium or warehouse space, outdoor parks with permission, or dedicated dog training facility rental. Indoor climate-controlled space is valuable for year-round training in most climates.' },
      { title: 'Draft bylaws and constitution', description: 'AKC requires affiliated clubs to submit bylaws meeting AKC standards. Key provisions: membership classes, AKC membership requirements for members participating in AKC events, dues structure, and officer election procedures.' },
      { title: 'Recruit founding members and instructors', description: 'Recruit members from AKC events, local dog shows, and veterinary office bulletin boards. Experienced instructors with AKC titles in your disciplines are key assets - they attract students and lend credibility to your club\'s training program.' },
      { title: 'Obtain liability insurance', description: 'Dog-related activities require liability coverage that specifically includes animal-related incidents. Standard liability policies often exclude animal-related claims. Canine liability coverage for clubs through specialist insurers runs $300-$800/year.' },
      { title: 'Set up member management tools', description: 'GatherGrove handles member registration, dues collection, class and event registration, and communications - keeping your club\'s administration organized.' },
      { title: 'Host your first training class or match', description: 'A fun match (informal sanctioned-style competition with no official points) is an excellent first event - it\'s low-pressure, educational, and showcases your club\'s training standards to potential members.' },
    ],
    legalRequirements: 'AKC club chartering requires minimum 5 members, constitution/bylaws, and application fee. State nonprofit incorporation recommended (some AKC districts require it). EIN and bank account required for event finances.',
    estimatedStartupCost: '$500-$2,500 first year (facility rental $200-$1,000, insurance $300-$800, AKC fees $35-$50, equipment)',
    minMembersToLaunch: '5',
    commonMistakes: [
      'Liability insurance that excludes animal-related claims',
      'Training facility agreement without adequate lease term (losing your space mid-season)',
      'No formal training curriculum - inconsistent instruction damages club reputation',
      'AKC events without proper trial licenses',
    ],
    toolsNeeded: ['Member management (GatherGrove)', 'Class and event registration', 'Training record tracking', 'AKC event management integration'],
    faqQuestions: [
      { question: 'Does a dog training club need to be AKC affiliated?', answer: 'No. Many excellent dog training clubs operate independently without AKC affiliation. However, AKC affiliation enables you to host AKC-sanctioned trials and earn official titles, which is a strong membership draw for competitive handlers. Recreational training clubs focused on pet dog obedience don\'t need AKC affiliation.' },
      { question: 'What insurance does a dog training club need?', answer: 'Standard general liability insurance often excludes animal-related claims. You need a policy that specifically covers animal-related incidents: dog bites, injuries from dogs during training activities, and property damage caused by member dogs. Canine liability coverage through specialty insurers costs $300-$800/year for a small club.' },
    ],
    keywords: ['how to start a dog training club', 'dog club formation', 'AKC dog club setup', 'canine training club organizer'],
    relatedClubTypes: ['hobby-clubs', 'social-clubs'],
    relatedResources: [],
  },
  {
    slug: 'homebrew-club',
    orgType: 'Homebrewing Club',
    title: 'How to Start a Homebrew Club',
    category: 'hobby',
    description:
      'Homebrew clubs accelerate skill development through group tastings, recipe sharing, and friendly competitions. This guide covers launching a club affiliated with the American Homebrewers Association, managing meetings, and hosting competitions.',
    steps: [
      { title: 'Define your focus: beer, wine, mead, cider, or mixed', description: 'Most homebrew clubs focus on beer, but mead and cider-focused clubs are growing. Mixed clubs covering all fermented beverages cast the widest net. Your focus shapes event formats, competition categories, and the style of knowledge sharing.' },
      { title: 'Recruit founding members', description: 'Post in local homebrewing forums (HomeBrewTalk.com), your nearest homebrew supply store, and Facebook homebrewing groups. Most homebrew supply stores are enthusiastic partners and will often let clubs meet there.' },
      { title: 'Affiliate with the American Homebrewers Association', description: 'AHA club membership costs $45/year for the organization (not per-member) and provides: inclusion in the club finder, access to the BJCP judge network, club competition resources, and monthly Zymurgy magazine for club copies.' },
      { title: 'Draft bylaws and collect dues', description: 'Simple bylaws covering membership, annual dues ($20-$40 is typical), meeting frequency, competition rules, and officer election are sufficient. Keep bylaws simple and focused on the hobby.' },
      { title: 'Establish a meeting format', description: 'Effective homebrew club meetings include: a homebrew tasting segment (members bring samples to share), a recipe/technique discussion, planning for upcoming competitions, and sometimes a guest speaker (local professional brewer, BJCP judge). Monthly meetings work well.' },
      { title: 'Organize club competitions', description: 'Club-internal competitions with BJCP-style judging are a major programming element. Members enter their best batches, receive written scoresheets, and compete for bragging rights. Many clubs send winning entries to regional or national competitions.' },
      { title: 'Obtain an EIN and bank account', description: 'Get a free EIN and open a dedicated account for dues and competition entry fees. Keep club finances completely separate from personal accounts.' },
      { title: 'Set up member management tools', description: 'GatherGrove handles member registration, dues collection, meeting RSVPs, and competition entry management - keeping your club organized.' },
    ],
    legalRequirements: 'No legal requirements for informal homebrewing clubs. Homebrewing for personal consumption is legal federally (up to 200 gallons/household/year). No permit required for club tastings at private events. EIN and bank account recommended for clubs collecting dues.',
    estimatedStartupCost: '$100-$600 first year (AHA affiliation $45, competition supplies, venue if not free)',
    minMembersToLaunch: '6',
    commonMistakes: [
      'Competition judging without trained BJCP judges - defeats the educational purpose',
      'No brewing hygiene and safety education for new members',
      'Serving homebrew at public events - this may require local permits depending on state',
      'No system for collecting and preserving tasting notes and winning recipes',
    ],
    toolsNeeded: ['Member management (GatherGrove)', 'Recipe and batch logging app (Brewer\'s Friend, BeerSmith)', 'Competition entry management', 'Group communication platform'],
    faqQuestions: [
      { question: 'Is it legal to share homebrew at club meetings?', answer: 'Yes, sharing homebrew among club members at private club meetings is legal under federal law. You cannot sell homebrew or serve it at public events without appropriate permits. Most state laws align with federal homebrewing allowances, but check your specific state\'s regulations regarding homebrew at club events.' },
      { question: 'What is BJCP judging and why does it matter for homebrew clubs?', answer: 'BJCP (Beer Judge Certification Program) is the national certification system for homebrew competition judges. BJCP-trained judges provide structured written feedback using standardized evaluation criteria, which is far more educational than informal peer opinions. Clubs with access to BJCP judges run better competitions and help members improve faster.' },
    ],
    keywords: ['how to start a homebrew club', 'homebrewing club formation', 'beer club setup', 'homebrewers association club'],
    relatedClubTypes: ['hobby-clubs', 'social-clubs'],
    relatedResources: [],
  },
  {
    slug: 'scout-troop',
    orgType: 'Scout Troop',
    title: 'How to Start a Scout Troop',
    category: 'youth',
    description:
      'Scout troops build character, leadership, and outdoor skills in young people through structured program and mentorship. This guide covers chartering a BSA or Girl Scouts troop, recruiting families, and setting up the administrative infrastructure for a successful unit.',
    steps: [
      { title: 'Choose your scouting organization', description: 'Boy Scouts of America (BSA) serves youth through Cub Scouts (K-5), Scouts BSA (11-17), Venturing (14-20), and Sea Scouts. Girl Scouts of the USA serves girls K-12 through Daisy, Brownie, Junior, Cadette, Senior, and Ambassador levels. Both have excellent resources and national networks.' },
      { title: 'Find a charter organization', description: 'Scout troops are chartered by an organization - a school, faith institution, civic club, or community organization. The charter organization provides meeting space, organizational backing, and sometimes financial support. Contact your local BSA council or Girl Scouts council to find chartering support.' },
      { title: 'Contact your local council', description: 'Your local BSA council or Girl Scouts of USA council provides organizational support, training, camping facilities, and guidance for new troops. They assign a District Executive or volunteer commissioner to help new units get established.' },
      { title: 'Recruit a committee and scout leaders', description: 'BSA troops require a Scoutmaster (direct youth leader) and a Committee Chair (administrative oversight) at minimum, plus 2-3 Committee Members. All adult volunteers must complete BSA Youth Protection Training and a background check before working with youth.' },
      { title: 'Complete adult leader registration and training', description: 'All adult leaders must be registered members of BSA or GSUSA, complete Youth Protection Training annually, and pass a background check. Direct contact leaders also need position-specific training (Scoutmaster Fundamentals, etc.).' },
      { title: 'Recruit youth members', description: 'Partner with local elementary schools for Cub Scout recruitment nights. For older youth programs, post at middle and high schools, community centers, and faith organizations. A well-promoted recruitment event in fall (back-to-school season) is most effective.' },
      { title: 'Establish meeting schedule and program calendar', description: 'Weekly or bi-weekly troop meetings combined with monthly camping or outdoor activities form the core program. Plan a year-ahead program calendar at the beginning of each scouting year (September-August) to enable family planning and volunteer scheduling.' },
      { title: 'Set up member management tools', description: 'GatherGrove handles troop family registration, dues collection, event RSVPs, and communications - complementing BSA/GSUSA official systems (Scoutbook, etc.).' },
    ],
    legalRequirements: 'All adult leaders must complete BSA/GSUSA Youth Protection Training and pass background checks (required by both national organizations). Charter organization agreement required. No separate nonprofit filing required - troops operate under the national organization\'s legal umbrella.',
    estimatedStartupCost: '$300-$1,500 first year (youth and adult registration fees $30-$75/person, program supplies, camping equipment)',
    minMembersToLaunch: '5',
    commonMistakes: [
      'Starting without a charter organization - troops cannot register independently',
      'Adult leaders without current Youth Protection Training',
      'No annual program calendar, leading to disorganized meetings',
      'Insufficient adult leader-to-youth ratios for camping activities',
    ],
    toolsNeeded: ['Member and family management (GatherGrove)', 'BSA Scoutbook or GSUSA platforms for advancement tracking', 'Communication platform for parent updates'],
    faqQuestions: [
      { question: 'How many people do you need to start a scout troop?', answer: 'BSA requires a minimum of 5 youth members to charter a new unit. GSUSA requires at least 5 girls. In practice, starting with 8-12 youth members creates enough critical mass for meaningful activities while remaining manageable for new leaders. Troops often grow significantly after a successful first year.' },
      { question: 'Do scout leaders get paid?', answer: 'No. Scout leaders - Scoutmasters, committee members, and den leaders - are unpaid volunteers. The national organizations provide training and program materials, and registration fees are modest. Some councils offer reimbursement for specific expenses, but the expectation is volunteer service.' },
    ],
    keywords: ['how to start a scout troop', 'BSA troop formation', 'girl scouts troop setup', 'scouting program organizer'],
    relatedClubTypes: ['youth-organizations'],
    relatedResources: [],
  },
]

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getHowToStartEntryBySlug(slug: string): HowToStartEntry | undefined {
  return HOW_TO_START_ENTRIES.find((e) => e.slug === slug)
}

export function getAllHowToStartSlugs(): string[] {
  return HOW_TO_START_ENTRIES.map((e) => e.slug)
}

export function getHowToStartEntriesByCategory(category: HowToStartCategory): HowToStartEntry[] {
  return HOW_TO_START_ENTRIES.filter((e) => e.category === category)
}
