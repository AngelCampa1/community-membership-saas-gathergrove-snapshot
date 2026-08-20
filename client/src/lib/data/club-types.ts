import { GROW_MONTHLY_PRICE_COPY, SEED_MONTHLY_PRICE_COPY, UNLIMITED_MONTHLY_PRICE_COPY } from '../pricing';
export interface ClubTypeEntry {
  slug: string
  name: string
  singularName: string
  description: string
  longDescription: string
  icon: string
  features: string[]
  keywords: string[]
  relatedSlugs: string[]
  bluf?: string
  faqs?: Array<{ question: string; answer: string }>
}

export const CLUB_TYPES: ClubTypeEntry[] = [
  {
    slug: 'book-clubs',
    name: 'Book Clubs',
    singularName: 'Book Club',
    description: 'Manage your book club with reading lists, meeting schedules, discussion tracking, and member communication tools.',
    longDescription:
      'Book clubs thrive on consistency and engagement. GatherGrove helps you organize reading selections, schedule meetings, track attendance, collect dues, and keep members excited about upcoming reads. Send automated reminders before meetings, manage discussion notes, and build a library of past selections your members can reference.',
    icon: 'BookOpen',
    features: ['Reading list management', 'Meeting scheduling', 'Discussion tracking', 'Automated reminders', 'Member directory'],
    keywords: ['book club management', 'reading group software', 'book club app', 'reading club organizer'],
    relatedSlugs: ['social-clubs', 'art-clubs', 'writing-groups', 'film-clubs'],
    bluf: 'GatherGrove is purpose-built book club software that handles reading lists, meeting schedules, attendance tracking, dues collection, and automated reminders - all in one platform.',
    faqs: [
      {
        question: 'How do book clubs collect dues online?',
        answer: 'Book clubs typically charge $5-$20/month or $50-$100/year per member. GatherGrove integrates with Stripe so members pay online with a credit card or bank account. The platform sends automated reminders for overdue dues, so you never have to chase payments manually.',
      },
      {
        question: 'What is the best app for managing a book club?',
        answer: 'GatherGrove provides dedicated book club management with member tracking, reading list organization, meeting scheduling, and dues automation. Unlike generic apps, it is built for groups with recurring meetings and annual dues.',
      },
    ],
  },
  {
    slug: 'running-clubs',
    name: 'Running Clubs',
    singularName: 'Running Club',
    description: 'Organize group runs, track member participation, manage race registrations, and coordinate training schedules.',
    longDescription:
      'Running clubs need tools that keep pace with their members. GatherGrove helps you schedule group runs, manage race registrations, track member participation, collect annual dues, and communicate route changes or weather updates instantly. Whether you are organizing a casual 5K group or a competitive marathon training program, our platform scales with your club.',
    icon: 'Timer',
    features: ['Event scheduling', 'Route sharing', 'Participation tracking', 'Race registration', 'Weather notifications'],
    keywords: ['running club management', 'running group app', 'jogging club software', 'run club organizer'],
    relatedSlugs: ['cycling-clubs', 'hiking-clubs', 'swimming-clubs', 'triathlon-clubs', 'pickleball-clubs'],
    bluf: 'GatherGrove is running club software that schedules group runs, tracks participation, manages race registrations, and automates annual dues - replacing spreadsheets and fragmented apps.',
    faqs: [
      {
        question: 'How do running clubs manage race registrations?',
        answer: 'Running clubs use GatherGrove to create event pages for races and group runs, set capacity limits, collect registration fees through Stripe, and send automated confirmation emails and reminders. Members can RSVP from any device.',
      },
      {
        question: 'What is the best app for organizing a running club?',
        answer: 'GatherGrove lets running clubs schedule group runs, share routes, track member participation over time, collect annual dues, and send weather or route-change alerts by email or push notification.',
      },
    ],
  },
  {
    slug: 'chess-clubs',
    name: 'Chess Clubs',
    singularName: 'Chess Club',
    description: 'Organize tournaments, manage player ratings, schedule matches, and build a thriving chess community.',
    longDescription:
      'Chess clubs need precise organization for tournaments, ladder systems, and regular meetups. GatherGrove helps you manage tournament brackets, track player participation, schedule matches, collect membership fees, and communicate with members about upcoming events. Build a community where players of all levels can improve together.',
    icon: 'Crown',
    features: ['Tournament management', 'Match scheduling', 'Member rankings', 'Event RSVPs', 'Communication tools'],
    keywords: ['chess club management', 'chess club software', 'chess tournament organizer', 'chess group app'],
    relatedSlugs: ['social-clubs', 'book-clubs', 'board-game-clubs', 'dnd-groups'],
    bluf: 'GatherGrove gives chess clubs tools for scheduling tournaments, tracking player participation, managing match calendars, and collecting membership fees - all without juggling spreadsheets.',
    faqs: [
      {
        question: 'How do chess clubs organize tournaments?',
        answer: 'Chess clubs use GatherGrove to create tournament events, manage brackets and participant lists, collect entry fees online, and communicate results to members. The platform supports both casual ladder systems and formal rated competitions.',
      },
      {
        question: 'What software do chess clubs use to manage members?',
        answer: 'GatherGrove provides a full member database with custom fields, attendance tracking across matches and meetups, automated dues collection, and a member directory - specifically designed for clubs with recurring meetings.',
      },
    ],
  },
  {
    slug: 'garden-clubs',
    name: 'Garden Clubs',
    singularName: 'Garden Club',
    description: 'Coordinate community gardens, plant swaps, workshops, seasonal events, and member plot assignments.',
    longDescription:
      'Garden clubs bring communities together through shared green spaces and knowledge. GatherGrove helps you manage community garden plots, organize plant swaps and workshops, schedule seasonal events, collect dues, and share gardening tips with members. Track plot assignments, coordinate volunteer days, and build a flourishing community.',
    icon: 'Flower2',
    features: ['Plot management', 'Event coordination', 'Workshop scheduling', 'Volunteer coordination', 'Seasonal planning'],
    keywords: ['garden club management', 'community garden software', 'garden club app', 'gardening group organizer'],
    relatedSlugs: ['nonprofit-organizations', 'social-clubs', 'environmental-groups', 'neighborhood-associations'],
    bluf: 'GatherGrove is garden club management software that handles plot assignments, workshop scheduling, volunteer days, plant swap events, and member dues - all in one place.',
    faqs: [
      {
        question: 'How do garden clubs manage community plot assignments?',
        answer: 'Garden clubs use GatherGrove to track which members hold which plots, set assignment dates and renewal periods, and notify members when plots become available. Custom fields let you record plot size, location, and any restrictions.',
      },
      {
        question: 'What is the best way to collect garden club dues online?',
        answer: 'GatherGrove integrates with Stripe so garden club members can pay annual dues online by credit card or bank transfer. Automatic payment reminders reduce the need to chase overdue fees, and the dashboard shows real-time payment status for every member.',
      },
    ],
  },
  {
    slug: 'youth-sports-leagues',
    name: 'Youth Sports Leagues',
    singularName: 'Youth Sports League',
    description: 'Manage teams, schedules, registrations, parent communications, and volunteer coordination for youth athletics.',
    longDescription:
      'Youth sports leagues juggle complex logistics - team rosters, game schedules, practice times, parent communications, registration fees, and volunteer coordination. GatherGrove simplifies it all with tools for season management, automated payment collection, team-level communications, and volunteer scheduling. Keep parents informed and kids playing.',
    icon: 'Trophy',
    features: ['Team management', 'Season scheduling', 'Registration and payments', 'Parent communications', 'Volunteer coordination'],
    keywords: ['youth sports management', 'youth league software', 'kids sports organizer', 'youth athletics app'],
    relatedSlugs: ['swimming-clubs', 'running-clubs', 'soccer-clubs', 'basketball-clubs', 'baseball-clubs'],
    bluf: 'GatherGrove is youth sports league software that automates season registrations, collects fees online, manages team rosters, sends parent communications, and coordinates volunteers - without requiring technical expertise.',
    faqs: [
      {
        question: 'How do youth sports leagues collect registration fees online?',
        answer: 'Youth sports leagues use GatherGrove to create season registration forms with Stripe payment processing built in. Parents pay by credit card at registration and receive automatic receipts. Admins see real-time payment status and can issue refunds or send payment reminders from the dashboard.',
      },
      {
        question: 'What is the best software for managing a youth sports league?',
        answer: 'GatherGrove provides youth sports leagues with team management, season scheduling, parent communication tools, volunteer coordination, and online payment collection. It replaces the combination of spreadsheets, email threads, and cash collection that most leagues rely on.',
      },
    ],
  },
  {
    slug: 'cycling-clubs',
    name: 'Cycling Clubs',
    singularName: 'Cycling Club',
    description: 'Plan group rides, manage member safety information, coordinate events, and track ride participation.',
    longDescription:
      'Cycling clubs need reliable coordination for group rides across varying skill levels. GatherGrove helps you plan routes, schedule rides by difficulty, manage emergency contact information, collect annual memberships, and keep riders informed about weather or route changes. Organize century rides, charity events, and regular club meetups seamlessly.',
    icon: 'Bike',
    features: ['Ride scheduling', 'Route management', 'Safety information', 'Event registration', 'Weather alerts'],
    keywords: ['cycling club management', 'bike club software', 'cycling group app', 'bike club organizer'],
    relatedSlugs: ['running-clubs', 'hiking-clubs', 'triathlon-clubs', 'paddle-sports-clubs'],
    bluf: 'GatherGrove is cycling club software that organizes group rides by difficulty, manages member emergency contacts, coordinates century events, and automates annual membership renewals.',
    faqs: [
      {
        question: 'How do cycling clubs manage group rides for different skill levels?',
        answer: 'Cycling clubs use GatherGrove to create separate ride events by difficulty level - beginner, intermediate, advanced - with individual RSVP tracking and capacity limits. Members receive ride details and route information before the event and can check who else is attending.',
      },
      {
        question: 'What app do cycling clubs use for member management?',
        answer: 'GatherGrove gives cycling clubs a member database with custom fields for emergency contact information, fitness level, and bike type. Annual membership renewals are automated through Stripe, so members receive renewal reminders without requiring manual follow-up.',
      },
    ],
  },
  {
    slug: 'hiking-clubs',
    name: 'Hiking Clubs',
    singularName: 'Hiking Club',
    description: 'Organize group hikes, manage trail information, coordinate carpools, and track member experience levels.',
    longDescription:
      'Hiking clubs bring outdoor enthusiasts together for adventures on the trail. GatherGrove helps you schedule hikes by difficulty level, share trail information and maps, coordinate carpools, manage emergency contacts, and collect membership dues. Build a community of hikers who support each other on every trail.',
    icon: 'Mountain',
    features: ['Hike scheduling', 'Trail information', 'Carpool coordination', 'Difficulty ratings', 'Emergency contacts'],
    keywords: ['hiking club management', 'hiking group app', 'trail club software', 'outdoor club organizer'],
    relatedSlugs: ['running-clubs', 'cycling-clubs', 'rock-climbing-clubs', 'equestrian-clubs'],
  },
  {
    slug: 'photography-clubs',
    name: 'Photography Clubs',
    singularName: 'Photography Club',
    description: 'Organize photo walks, workshops, competitions, exhibitions, and equipment sharing among members.',
    longDescription:
      'Photography clubs thrive on shared experiences and learning. GatherGrove helps you organize photo walks, schedule workshops and critique sessions, manage competitions, plan exhibitions, and coordinate equipment sharing. Whether your members shoot digital or film, landscapes or portraits, build a community that helps everyone improve their craft.',
    icon: 'Camera',
    features: ['Photo walk scheduling', 'Workshop management', 'Competition tracking', 'Exhibition planning', 'Equipment sharing'],
    keywords: ['photography club management', 'photo club software', 'camera club app', 'photography group organizer'],
    relatedSlugs: ['art-clubs', 'social-clubs', 'film-clubs', 'drone-clubs'],
  },
  {
    slug: 'art-clubs',
    name: 'Art Clubs',
    singularName: 'Art Club',
    description: 'Coordinate art workshops, exhibitions, supply sharing, and creative community events.',
    longDescription:
      'Art clubs bring creative minds together to learn, create, and exhibit. GatherGrove helps you schedule workshops, manage exhibition logistics, coordinate supply sharing, collect membership fees, and communicate about upcoming creative opportunities. Build a supportive community where artists of all levels can grow together.',
    icon: 'Palette',
    features: ['Workshop scheduling', 'Exhibition management', 'Supply coordination', 'Gallery events', 'Member portfolios'],
    keywords: ['art club management', 'art group software', 'creative club app', 'art community organizer'],
    relatedSlugs: ['photography-clubs', 'book-clubs', 'pottery-clubs', 'quilting-clubs', 'woodworking-clubs'],
  },
  {
    slug: 'music-groups',
    name: 'Music Groups',
    singularName: 'Music Group',
    description: 'Manage rehearsals, performances, member instruments, sheet music distribution, and concert planning.',
    longDescription:
      'Music groups need tight coordination for rehearsals, performances, and member management. GatherGrove helps you schedule rehearsals, plan concerts and recitals, manage member instruments and parts, distribute sheet music, collect dues, and communicate about upcoming performances. From community choirs to jazz ensembles, keep your group in harmony.',
    icon: 'Music',
    features: ['Rehearsal scheduling', 'Performance planning', 'Sheet music sharing', 'Instrument tracking', 'Concert management'],
    keywords: ['music group management', 'choir software', 'band management app', 'music club organizer'],
    relatedSlugs: ['social-clubs', 'art-clubs', 'film-clubs'],
  },
  {
    slug: 'swimming-clubs',
    name: 'Swimming Clubs',
    singularName: 'Swimming Club',
    description: 'Organize swim meets, manage lane assignments, track times, and coordinate pool schedules.',
    longDescription:
      'Swimming clubs need precise scheduling and tracking to run smoothly. GatherGrove helps you manage pool time slots, organize swim meets, track member times and progress, collect membership and meet fees, and communicate schedule changes. Whether competitive or recreational, keep your swimmers informed and your club organized.',
    icon: 'Waves',
    features: ['Pool scheduling', 'Meet management', 'Time tracking', 'Lane assignments', 'Progress monitoring'],
    keywords: ['swimming club management', 'swim club software', 'swim team app', 'aquatics club organizer'],
    relatedSlugs: ['youth-sports-leagues', 'running-clubs', 'rowing-clubs', 'triathlon-clubs'],
  },
  {
    slug: 'nonprofit-organizations',
    name: 'Nonprofit Organizations',
    singularName: 'Nonprofit Organization',
    description: 'Manage donors, volunteers, events, communications, and membership for mission-driven organizations.',
    longDescription:
      `Nonprofits need affordable tools that maximize impact. GatherGrove helps you manage donor and member databases, coordinate volunteers, plan fundraising events, automate communications, and track engagement - all without breaking your budget. The Seed plan at ${SEED_MONTHLY_PRICE_COPY} gives small nonprofits essential management tools at an affordable starting price.`,
    icon: 'Heart',
    features: ['Donor management', 'Volunteer coordination', 'Fundraising events', 'Grant tracking', 'Impact reporting'],
    keywords: ['nonprofit management software', 'nonprofit member management', 'charity organization app', 'NGO management tool'],
    relatedSlugs: ['professional-associations', 'social-clubs', 'food-banks', 'animal-rescue-organizations', 'environmental-groups'],
    bluf: 'GatherGrove is nonprofit management software that combines member and donor tracking, volunteer coordination, fundraising event management, and automated communications in one affordable platform.',
    faqs: [
      {
        question: 'What is the best affordable nonprofit management software?',
        answer: `GatherGrove offers nonprofit organizations a Seed plan at ${SEED_MONTHLY_PRICE_COPY} (up to 100 members) and a Grow plan at ${GROW_MONTHLY_PRICE_COPY} (up to 200 members), with member database, event management, automated communications, and Stripe payment integration. It replaces separate tools for donor tracking, email communication, and event registration.`,
      },
      {
        question: 'How do nonprofits manage volunteers with software?',
        answer: 'GatherGrove lets nonprofits create volunteer shifts with capacity limits, collect volunteer sign-ups online, send automated reminders, and track hours per volunteer. Custom fields support recording skills, availability, and background check status.',
      },
    ],
  },
  {
    slug: 'professional-associations',
    name: 'Professional Associations',
    singularName: 'Professional Association',
    description: 'Manage continuing education, networking events, member directories, and professional development programs.',
    longDescription:
      'Professional associations need tools that support career development and networking. GatherGrove helps you manage member credentials, organize continuing education events, maintain professional directories, collect membership dues, and facilitate networking opportunities. Build a strong professional community that advances your industry.',
    icon: 'Briefcase',
    features: ['Member directories', 'CE event management', 'Credential tracking', 'Networking events', 'Professional development'],
    keywords: ['professional association software', 'trade association management', 'professional group app', 'industry association tool'],
    relatedSlugs: ['nonprofit-organizations', 'alumni-associations', 'chambers-of-commerce', 'rotary-clubs', 'young-professionals'],
    bluf: 'GatherGrove is professional association management software that automates membership renewals, tracks continuing education credits, manages networking events, and maintains a searchable member directory.',
    faqs: [
      {
        question: 'How do professional associations manage continuing education events?',
        answer: 'Professional associations use GatherGrove to create CE events with registration, capacity limits, and Stripe payment processing. After the event, admins record attendance for CE credit tracking. Members can view their CE history from the member portal.',
      },
      {
        question: 'What software helps professional associations automate membership renewals?',
        answer: 'GatherGrove automates professional association membership renewals through Stripe recurring billing. Members receive renewal reminders 30, 14, and 3 days before expiration. Admins see real-time renewal status and can manually trigger reminders or process renewals for members who prefer to pay offline.',
      },
    ],
  },
  {
    slug: 'alumni-associations',
    name: 'Alumni Associations',
    singularName: 'Alumni Association',
    description: 'Connect graduates, organize reunions, manage fundraising campaigns, and maintain alumni directories.',
    longDescription:
      'Alumni associations keep graduates connected long after they leave campus. GatherGrove helps you maintain alumni directories, organize reunions and networking events, manage fundraising campaigns, collect annual dues, and send targeted communications by graduation year or interest. Build lasting connections that benefit your entire alumni community.',
    icon: 'GraduationCap',
    features: ['Alumni directory', 'Reunion planning', 'Fundraising campaigns', 'Class year management', 'Mentorship matching'],
    keywords: ['alumni association software', 'alumni management app', 'graduate network tool', 'alumni reunion organizer'],
    relatedSlugs: ['professional-associations', 'nonprofit-organizations', 'coding-bootcamp-alumni', 'mastermind-groups'],
  },
  {
    slug: 'social-clubs',
    name: 'Social Clubs',
    singularName: 'Social Club',
    description: 'Organize social gatherings, manage memberships, plan outings, and build connected communities.',
    longDescription:
      'Social clubs exist to bring people together for shared interests and good times. GatherGrove helps you plan social gatherings, manage member lists, collect dues, coordinate outings, and keep everyone in the loop about upcoming events. Whether it is a dinner club, wine tasting group, or neighborhood social, make every gathering memorable.',
    icon: 'Users',
    features: ['Social event planning', 'Member management', 'RSVP tracking', 'Photo sharing', 'Activity coordination'],
    keywords: ['social club management', 'social club software', 'social group app', 'community club organizer'],
    relatedSlugs: ['book-clubs', 'art-clubs', 'music-groups', 'board-game-clubs', 'cooking-clubs'],
  },

  // ── Sports (20) ───────────────────────────────────────────────────────────
  {
    slug: 'pickleball-clubs',
    name: 'Pickleball Clubs',
    singularName: 'Pickleball Club',
    description: 'Organize pickleball leagues, round-robins, clinics, court reservations, and member skill-level tracking.',
    longDescription:
      'Pickleball is one of the fastest-growing sports in America, and managing a club requires the right tools. GatherGrove helps you schedule open play sessions, organize leagues and tournaments, track member skill ratings, manage court reservations, collect dues, and communicate schedule changes instantly. Whether you run a small recreational group or a competitive club, keep your players engaged and on the court.',
    icon: 'Activity',
    features: ['League scheduling', 'Court reservations', 'Skill-level tracking', 'Tournament brackets', 'Member directory'],
    keywords: ['pickleball club management software', 'pickleball league software', 'pickleball club app', 'pickleball club management', 'pickleball organizer'],
    relatedSlugs: ['tennis-clubs', 'running-clubs', 'volleyball-clubs', 'social-clubs'],
    bluf: 'GatherGrove is pickleball club management software that handles league scheduling, court reservations, skill-level tracking, dues collection, and member communications in one platform.',
    faqs: [
      { question: 'What is the best software for managing a pickleball club?', answer: 'GatherGrove is purpose-built for sports clubs including pickleball. It handles league scheduling, court reservations, member skill tracking, tournament brackets, dues collection, and instant communications - all from one platform. Start with a 30-day free trial.' },
      { question: 'How do pickleball clubs manage court reservations?', answer: 'With GatherGrove, create time-slotted court sessions that members book through the portal or mobile app. Set capacity limits per court, enforce skill-level requirements for competitive sessions, and prevent double-booking automatically.' },
      { question: 'Can pickleball clubs track player skill levels?', answer: 'Yes. Use GatherGrove custom member fields to record and display player ratings (e.g., 3.0, 3.5, 4.0). Filter events and open play sessions by skill level so players are matched appropriately.' },
      { question: 'How much does pickleball club management software cost?', answer: `GatherGrove starts at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members), with a 30-day free trial. The Grow plan at ${GROW_MONTHLY_PRICE_COPY} covers up to 200 members. The Expand plan at ${UNLIMITED_MONTHLY_PRICE_COPY} covers up to 2,000 members. There are no platform fees on payments.` },
    ],
  },
  {
    slug: 'tennis-clubs',
    name: 'Tennis Clubs',
    singularName: 'Tennis Club',
    description: 'Manage court reservations, ladders, leagues, tournaments, and member communication for tennis clubs.',
    longDescription:
      'Tennis clubs need reliable tools for court bookings, ladder systems, and league organization. GatherGrove helps you manage court reservations, run singles and doubles ladders, organize tournaments, collect annual memberships, and keep members informed about clinics, social events, and match results. Build a club community that keeps players coming back to the court season after season.',
    icon: 'Activity',
    features: ['Court scheduling', 'Ladder management', 'Tournament organization', 'Clinic booking', 'Member ratings'],
    keywords: ['tennis club management software', 'tennis club management', 'tennis club software', 'tennis league app', 'tennis club organizer'],
    relatedSlugs: ['pickleball-clubs', 'youth-sports-leagues', 'social-clubs', 'volleyball-clubs'],
    bluf: 'GatherGrove is tennis club management software for court scheduling, ladder systems, tournament brackets, membership fees, and player communications - all in one platform.',
    faqs: [
      { question: 'What is the best tennis club management software?', answer: `GatherGrove handles court reservations, ladder and league management, tournament organization, membership collection, and club communications. Plans start at ${SEED_MONTHLY_PRICE_COPY} (Seed plan, up to 100 members) with a 30-day free trial.` },
      { question: 'How do tennis clubs manage court bookings online?', answer: 'GatherGrove lets members reserve courts through the portal or mobile app with time-slot booking, automatic conflict prevention, and guest booking options.' },
    ],
  },
  {
    slug: 'soccer-clubs',
    name: 'Soccer Clubs',
    singularName: 'Soccer Club',
    description: 'Manage team rosters, match schedules, field reservations, referee coordination, and player registrations.',
    longDescription:
      'Soccer clubs juggle complex logistics across multiple teams and age groups. GatherGrove helps you manage player registrations, organize team rosters, schedule matches and practices, coordinate field reservations, handle referee assignments, and collect league fees. Keep coaches, players, and parents informed with targeted communications and automated reminders for upcoming fixtures.',
    icon: 'Target',
    features: ['Team management', 'Match scheduling', 'Field reservations', 'Player registration', 'Parent communications'],
    keywords: ['soccer club management', 'soccer club software', 'football club app', 'soccer team organizer'],
    relatedSlugs: ['youth-sports-leagues', 'basketball-clubs', 'volleyball-clubs', 'running-clubs'],
  },
  {
    slug: 'baseball-clubs',
    name: 'Baseball & Softball Clubs',
    singularName: 'Baseball Club',
    description: 'Coordinate team rosters, game schedules, batting lineups, equipment inventory, and umpire assignments.',
    longDescription:
      'Baseball and softball clubs require precise scheduling and team management across a full season. GatherGrove helps you manage player rosters, build game schedules, track standings, coordinate umpire assignments, manage equipment inventory, and collect team fees. Send automated game reminders to players and parents, share field directions, and keep your season running smoothly from opening day to playoffs.',
    icon: 'Target',
    features: ['Roster management', 'Game scheduling', 'Standings tracking', 'Equipment inventory', 'Umpire coordination'],
    keywords: ['baseball club management', 'softball club software', 'baseball team app', 'little league organizer'],
    relatedSlugs: ['youth-sports-leagues', 'soccer-clubs', 'social-clubs', 'bowling-leagues'],
  },
  {
    slug: 'basketball-clubs',
    name: 'Basketball Clubs',
    singularName: 'Basketball Club',
    description: 'Organize pickup games, leagues, tournaments, gym reservations, and team communications for basketball clubs.',
    longDescription:
      'Basketball clubs thrive on consistent scheduling and strong communication. GatherGrove helps you organize pickup game sign-ups, run competitive leagues, manage gym reservations, track team standings, collect registration fees, and communicate with players about schedule changes. Whether you run a recreational rec league or a competitive travel program, keep your players informed and your courts busy.',
    icon: 'Trophy',
    features: ['Game scheduling', 'Gym reservations', 'League management', 'Team rosters', 'Score tracking'],
    keywords: ['basketball club management', 'basketball league software', 'hoops club app', 'basketball organizer'],
    relatedSlugs: ['youth-sports-leagues', 'soccer-clubs', 'volleyball-clubs', 'social-clubs'],
  },
  {
    slug: 'volleyball-clubs',
    name: 'Volleyball Clubs',
    singularName: 'Volleyball Club',
    description: 'Schedule matches, manage indoor and beach teams, coordinate tournaments, and track player skill levels.',
    longDescription:
      'Volleyball clubs span indoor, beach, and recreational formats that all need different tools. GatherGrove helps you schedule matches and practices, manage rosters across multiple teams, organize tournaments, collect player fees, and send team communications. Track skill levels to balance competitive teams, coordinate gym or court bookings, and build a volleyball community that players are proud to belong to.',
    icon: 'Activity',
    features: ['Team management', 'Tournament scheduling', 'Court bookings', 'Skill-level tracking', 'Match results'],
    keywords: ['volleyball club management', 'volleyball league software', 'volleyball team app', 'beach volleyball organizer'],
    relatedSlugs: ['soccer-clubs', 'basketball-clubs', 'pickleball-clubs', 'youth-sports-leagues'],
  },
  {
    slug: 'martial-arts-clubs',
    name: 'Martial Arts Clubs',
    singularName: 'Martial Arts Club',
    description: 'Manage belt progressions, class schedules, grading events, membership billing, and student attendance.',
    longDescription:
      'Martial arts dojos and clubs need tools that match their disciplined structure. GatherGrove helps you manage student belt progressions, schedule classes across skill levels, organize grading events, collect monthly membership dues, and track attendance. Build automated reminders for upcoming gradings, communicate belt requirements, and maintain the professional image your dojo deserves.',
    icon: 'Shield',
    features: ['Belt progression tracking', 'Class scheduling', 'Grading events', 'Attendance tracking', 'Membership billing'],
    keywords: ['martial arts club management', 'dojo management software', 'karate club app', 'BJJ club organizer'],
    relatedSlugs: ['crossfit-clubs', 'fencing-clubs', 'archery-clubs', 'social-clubs'],
  },
  {
    slug: 'crossfit-clubs',
    name: 'CrossFit & Fitness Clubs',
    singularName: 'CrossFit Club',
    description: 'Schedule WODs, manage class capacity, track member performance, and coordinate competitions and events.',
    longDescription:
      'CrossFit boxes and functional fitness clubs need tools that keep their community motivated and organized. GatherGrove helps you schedule daily workouts, manage class capacity and waitlists, track member performance over time, collect monthly memberships, and coordinate in-house competitions. Build leaderboards, send workout reminders, and create the tight-knit community culture that keeps members coming back.',
    icon: 'Zap',
    features: ['Class scheduling', 'Capacity management', 'Performance tracking', 'Leaderboards', 'Competition management'],
    keywords: ['CrossFit club management', 'gym club software', 'fitness club app', 'functional fitness organizer'],
    relatedSlugs: ['martial-arts-clubs', 'running-clubs', 'triathlon-clubs', 'swimming-clubs'],
  },
  {
    slug: 'rowing-clubs',
    name: 'Rowing Clubs',
    singularName: 'Rowing Club',
    description: 'Coordinate on-water sessions, manage boat assignments, schedule regattas, and track crew rosters.',
    longDescription:
      'Rowing clubs face unique logistical challenges around water access, boat allocation, and crew coordination. GatherGrove helps you schedule practice sessions, manage boat assignments by crew and skill level, organize regatta travel and logistics, collect membership fees, and communicate about weather cancellations. Keep your club rowing together with clear communications and efficient scheduling tools.',
    icon: 'Waves',
    features: ['Session scheduling', 'Boat assignments', 'Regatta management', 'Crew coordination', 'Weather alerts'],
    keywords: ['rowing club management', 'crew club software', 'rowing team app', 'regatta organizer'],
    relatedSlugs: ['swimming-clubs', 'sailing-clubs', 'paddle-sports-clubs', 'triathlon-clubs'],
    bluf: 'GatherGrove handles rowing club logistics - practice scheduling, boat assignments, regatta coordination, membership fees, and weather-cancellation alerts - in one platform.',
    faqs: [
      { question: 'How does GatherGrove help with boat assignments?', answer: 'Create boat slots with capacity limits and skill-level requirements. Members sign up for sessions through the portal, and the system prevents overbooking while tracking who rowed which boat and when.' },
      { question: 'Can rowing clubs send last-minute weather cancellations?', answer: 'Yes. GatherGrove supports instant push notifications and email alerts, so you can notify all registered rowers about cancellations or schedule changes in seconds.' },
    ],
  },
  {
    slug: 'skiing-clubs',
    name: 'Ski & Snowboard Clubs',
    singularName: 'Ski Club',
    description: 'Coordinate group ski trips, manage lift ticket group rates, organize lessons, and plan seasonal events.',
    longDescription:
      'Ski and snowboard clubs bring winter sports enthusiasts together for group trips and on-slope adventures. GatherGrove helps you coordinate group travel arrangements, negotiate and distribute lift ticket packages, organize lessons for members, collect trip deposits and payments, and communicate about conditions or changes. Make every ski season memorable with organized trips that members look forward to all year.',
    icon: 'Mountain',
    features: ['Trip planning', 'Group ticket management', 'Lesson coordination', 'Payment collection', 'Carpool organization'],
    keywords: ['ski club management', 'snowboard club software', 'ski trip organizer', 'winter sports club app'],
    relatedSlugs: ['hiking-clubs', 'cycling-clubs', 'social-clubs', 'outdoor-clubs'],
  },
  {
    slug: 'surfing-clubs',
    name: 'Surfing Clubs',
    singularName: 'Surfing Club',
    description: 'Organize surf sessions, competitions, beach cleanups, surf travel trips, and member safety coordination.',
    longDescription:
      'Surfing clubs connect wave riders of all skill levels and coordinate around the unpredictable nature of ocean conditions. GatherGrove helps you schedule group surf sessions, organize local competitions, plan surf travel trips, coordinate beach cleanup events, manage membership dues, and send real-time swell and condition alerts. Build a surfing community that shares the stoke and looks out for each other.',
    icon: 'Waves',
    features: ['Session scheduling', 'Condition alerts', 'Competition management', 'Trip planning', 'Safety coordination'],
    keywords: ['surf club management', 'surfing club software', 'surf club app', 'wave riders organizer'],
    relatedSlugs: ['paddle-sports-clubs', 'rowing-clubs', 'hiking-clubs', 'sailing-clubs'],
  },
  {
    slug: 'rock-climbing-clubs',
    name: 'Rock Climbing Clubs',
    singularName: 'Rock Climbing Club',
    description: 'Organize climbing trips, manage outdoor permit logistics, track member skill levels, and coordinate safety protocols.',
    longDescription:
      'Rock climbing clubs combine outdoor adventure with essential safety management. GatherGrove helps you organize climbing trips to indoor gyms and outdoor crags, manage permit and access logistics, track member skill levels and certifications, coordinate gear sharing, collect membership dues, and communicate safety protocols. Whether bouldering, sport climbing, or trad, build a community that climbs together safely.',
    icon: 'Mountain',
    features: ['Trip scheduling', 'Skill-level tracking', 'Permit management', 'Gear sharing', 'Safety protocols'],
    keywords: ['rock climbing club management', 'climbing club software', 'bouldering club app', 'climbing group organizer'],
    relatedSlugs: ['hiking-clubs', 'martial-arts-clubs', 'cycling-clubs', 'outdoor-clubs'],
  },
  {
    slug: 'disc-golf-clubs',
    name: 'Disc Golf Clubs',
    singularName: 'Disc Golf Club',
    description: 'Organize casual rounds, leagues, tournaments, course maintenance volunteer days, and member handicap tracking.',
    longDescription:
      'Disc golf clubs are community-driven organizations that keep courses maintained and players competitive. GatherGrove helps you schedule casual rounds and leagues, run tournaments with division management, organize volunteer course maintenance days, track member ratings and handicaps, collect club memberships, and communicate about new course additions or events. Grow a disc golf community that welcomes players at every skill level.',
    icon: 'Target',
    features: ['League scheduling', 'Tournament management', 'Handicap tracking', 'Course volunteer days', 'Member ratings'],
    keywords: ['disc golf club management', 'disc golf league software', 'frisbee golf club app', 'disc golf organizer'],
    relatedSlugs: ['social-clubs', 'archery-clubs', 'bowling-leagues', 'outdoor-clubs'],
  },
  {
    slug: 'bowling-leagues',
    name: 'Bowling Leagues',
    singularName: 'Bowling League',
    description: 'Manage team rosters, weekly scores, standings, handicaps, and end-of-season award ceremonies.',
    longDescription:
      'Bowling leagues run on precise weekly organization and score tracking. GatherGrove helps you manage team rosters, record weekly scores, calculate handicaps, maintain standings, collect weekly dues, and communicate schedule changes. Plan end-of-season banquets, track individual averages, and celebrate high series achievements. Make league night something your bowlers never miss.',
    icon: 'Trophy',
    features: ['Score tracking', 'Handicap calculation', 'Standings management', 'Team rosters', 'Banquet planning'],
    keywords: ['bowling league management', 'bowling club software', 'bowling league app', 'bowling organizer'],
    relatedSlugs: ['social-clubs', 'disc-golf-clubs', 'board-game-clubs', 'youth-sports-leagues'],
    bluf: 'GatherGrove replaces bowling league spreadsheets with automated team rosters, weekly dues collection, schedule management, and instant communication to all bowlers.',
    faqs: [
      { question: 'Can GatherGrove track bowling league standings?', answer: 'GatherGrove handles team rosters and event scheduling. While it does not calculate bowling handicaps natively, you can record scores and standings through the event management system and communicate results to all members.' },
      { question: 'How do bowling leagues collect weekly dues?', answer: 'Set up recurring weekly payments through GatherGrove. Members pay automatically via credit card or ACH, and league managers see a real-time dashboard of who has paid.' },
    ],
  },
  {
    slug: 'equestrian-clubs',
    name: 'Equestrian Clubs',
    singularName: 'Equestrian Club',
    description: 'Coordinate lesson schedules, horse assignments, show entries, barn maintenance, and member communications.',
    longDescription:
      'Equestrian clubs and riding schools require specialized scheduling around horses, arenas, and show calendars. GatherGrove helps you manage lesson bookings, coordinate horse assignments by skill level, organize show entries and travel logistics, schedule barn maintenance volunteer days, collect board and membership fees, and communicate with riders and parents. Keep your stable community informed, engaged, and in the saddle.',
    icon: 'Star',
    features: ['Lesson scheduling', 'Horse assignments', 'Show management', 'Barn coordination', 'Parent communications'],
    keywords: ['equestrian club management', 'riding club software', 'horse club app', 'equestrian organizer'],
    relatedSlugs: ['hiking-clubs', 'youth-sports-leagues', 'social-clubs', 'outdoor-clubs'],
  },
  {
    slug: 'fencing-clubs',
    name: 'Fencing Clubs',
    singularName: 'Fencing Club',
    description: 'Schedule training sessions, manage tournament entries, track ratings, and coordinate equipment lending.',
    longDescription:
      'Fencing clubs balance rigorous training schedules with tournament preparation and equipment management. GatherGrove helps you schedule training sessions by weapon discipline, manage tournament registrations and travel, track USA Fencing ratings and classifications, coordinate equipment lending and repair, collect club dues, and communicate with athletes and parents. Build a fencing program that develops champions at every level.',
    icon: 'Shield',
    features: ['Training scheduling', 'Tournament management', 'Rating tracking', 'Equipment lending', 'Competition prep'],
    keywords: ['fencing club management', 'fencing club software', 'fencing team app', 'fencing organizer'],
    relatedSlugs: ['martial-arts-clubs', 'archery-clubs', 'youth-sports-leagues', 'social-clubs'],
  },
  {
    slug: 'archery-clubs',
    name: 'Archery Clubs',
    singularName: 'Archery Club',
    description: 'Manage range sessions, beginner courses, competitions, equipment inventory, and safety certifications.',
    longDescription:
      'Archery clubs provide structured environments for precision sport shooting in a safe, community-oriented setting. GatherGrove helps you schedule range sessions by bow style, organize beginner instruction courses, manage local and regional competitions, track equipment inventory, maintain safety certification records, collect membership fees, and communicate range hours and closures. Grow a disciplined archery community that welcomes all skill levels.',
    icon: 'Target',
    features: ['Range scheduling', 'Course management', 'Competition tracking', 'Equipment inventory', 'Safety records'],
    keywords: ['archery club management', 'archery range software', 'archery club app', 'archery organizer'],
    relatedSlugs: ['fencing-clubs', 'martial-arts-clubs', 'disc-golf-clubs', 'social-clubs'],
    bluf: 'GatherGrove gives archery clubs one platform for range session scheduling, membership management, competition tracking, safety records, and member communications.',
    faqs: [
      { question: 'Can archery clubs manage range time slots with GatherGrove?', answer: 'Yes. Create time-slotted events for range sessions with capacity limits by lane or bay. Members book slots through the portal, preventing overcrowding and ensuring safe range operations.' },
      { question: 'How do archery clubs track safety certifications?', answer: 'Use GatherGrove custom member fields to record certification dates, expiration dates, and certification types. Filter your member directory to see who needs renewal.' },
    ],
  },
  {
    slug: 'sailing-clubs',
    name: 'Sailing Clubs',
    singularName: 'Sailing Club',
    description: 'Coordinate racing schedules, manage boat slips, organize cruising events, and handle member safety training.',
    longDescription:
      'Sailing clubs combine the passion for the water with the complexity of boat management and racing logistics. GatherGrove helps you schedule racing series and cruising events, manage slip assignments and waitlists, organize safety and certification courses, coordinate work parties, collect slip fees and memberships, and communicate weather or schedule changes. Build a sailing community that sails together through every season.',
    icon: 'Waves',
    features: ['Race scheduling', 'Slip management', 'Safety training', 'Cruise planning', 'Work party coordination'],
    keywords: ['sailing club management', 'yacht club software', 'sailing club app', 'regatta organizer'],
    relatedSlugs: ['rowing-clubs', 'paddle-sports-clubs', 'surfing-clubs', 'social-clubs'],
  },
  {
    slug: 'triathlon-clubs',
    name: 'Triathlon Clubs',
    singularName: 'Triathlon Club',
    description: 'Coordinate swim, bike, and run training sessions, manage race registrations, and track multi-sport fitness progress.',
    longDescription:
      'Triathlon clubs manage the complex cross-training schedules of multi-sport athletes across swimming, cycling, and running. GatherGrove helps you schedule discipline-specific training sessions, organize group workouts, manage race registrations and travel logistics, track member fitness milestones, collect annual dues, and communicate training plans and race reports. Build a triathlon community that pushes each other toward the finish line.',
    icon: 'Timer',
    features: ['Multi-sport scheduling', 'Race registration', 'Training plans', 'Performance tracking', 'Group workouts'],
    keywords: ['triathlon club management', 'triathlon club software', 'multi-sport club app', 'ironman club organizer'],
    relatedSlugs: ['running-clubs', 'cycling-clubs', 'swimming-clubs', 'crossfit-clubs'],
  },
  {
    slug: 'paddle-sports-clubs',
    name: 'Paddle Sports Clubs',
    singularName: 'Paddle Sports Club',
    description: 'Organize kayaking, canoeing, and SUP outings, manage equipment rentals, and coordinate river and lake trips.',
    longDescription:
      'Paddle sports clubs bring together kayakers, canoeists, and stand-up paddleboarders for adventure on the water. GatherGrove helps you schedule group outings by skill level, manage club equipment rentals, organize multi-day river and lake expeditions, coordinate shuttle logistics, collect membership dues, and communicate water conditions and safety protocols. Build a paddle community that explores every waterway together.',
    icon: 'Waves',
    features: ['Outing scheduling', 'Equipment rental', 'Trip planning', 'Shuttle coordination', 'Safety protocols'],
    keywords: ['paddle sports club management', 'kayak club software', 'canoe club app', 'SUP club organizer'],
    relatedSlugs: ['rowing-clubs', 'sailing-clubs', 'surfing-clubs', 'hiking-clubs'],
  },

  // ── Professional / Educational (15) ───────────────────────────────────────
  {
    slug: 'chambers-of-commerce',
    name: 'Chambers of Commerce',
    singularName: 'Chamber of Commerce',
    description: 'Manage business member directories, ribbon cuttings, networking events, advocacy campaigns, and membership renewals.',
    longDescription:
      'Chambers of commerce serve as the hub of local business communities, requiring professional tools for member management and event coordination. GatherGrove helps you maintain business member directories, organize networking luncheons and ribbon-cutting ceremonies, manage tiered membership dues, coordinate advocacy initiatives, and send targeted communications to members by industry. Grow your chamber and demonstrate clear value to every business member.',
    icon: 'Building2',
    features: ['Business directory', 'Event management', 'Tiered memberships', 'Advocacy coordination', 'Member communications'],
    keywords: ['chamber of commerce software', 'chamber management app', 'business association tool', 'local business network organizer'],
    relatedSlugs: ['professional-associations', 'rotary-clubs', 'young-professionals', 'bni-chapters'],
  },
  {
    slug: 'rotary-clubs',
    name: 'Rotary Clubs',
    singularName: 'Rotary Club',
    description: 'Manage member service hours, weekly meetings, fundraising projects, international programs, and committee coordination.',
    longDescription:
      'Rotary clubs are built around service above self, requiring tools that track impact and coordinate volunteer efforts. GatherGrove helps you manage weekly meeting attendance, coordinate service projects and community initiatives, track member service hours and recognitions, organize fundraising events, manage committee assignments, and communicate with members about upcoming programs. Demonstrate the measurable impact your Rotary club has on your community.',
    icon: 'Globe',
    features: ['Meeting management', 'Service hour tracking', 'Fundraising events', 'Committee coordination', 'Impact reporting'],
    keywords: ['Rotary club management', 'Rotary club software', 'service club app', 'Rotary organizer'],
    relatedSlugs: ['professional-associations', 'lions-clubs', 'kiwanis-clubs', 'nonprofit-organizations'],
    bluf: 'GatherGrove helps Rotary clubs track service hours, manage weekly meetings, coordinate fundraising projects, and communicate with members - all in one platform that demonstrates your community impact.',
    faqs: [
      { question: 'Can GatherGrove track Rotary service hours?', answer: 'Yes. Members log service hours through the platform, and club leaders get reports showing total hours by member, project, and time period - useful for district reporting and member recognition.' },
      { question: 'How does GatherGrove handle Rotary committee coordination?', answer: 'Create member groups for each committee (Service Projects, Fundraising, Membership, etc.). Each committee gets its own communication channel and event calendar while staying connected to the full club.' },
    ],
  },
  {
    slug: 'toastmasters-clubs',
    name: 'Toastmasters Clubs',
    singularName: 'Toastmasters Club',
    description: 'Coordinate meeting roles, track speech progress, manage evaluations, and schedule educational programs.',
    longDescription:
      'Toastmasters clubs help members develop communication and leadership skills through structured meeting programs. GatherGrove helps you schedule weekly meetings, assign meeting roles like Toastmaster of the Day and Table Topics Master, track member progress through educational pathways, manage guest follow-up, collect dues, and communicate about special events. Build a club culture where every member is supported in their growth journey.',
    icon: 'Mic',
    features: ['Meeting role scheduling', 'Speech tracking', 'Pathway progress', 'Guest management', 'Member communications'],
    keywords: ['Toastmasters club management', 'public speaking club software', 'Toastmasters app', 'speech club organizer'],
    relatedSlugs: ['professional-associations', 'writing-groups', 'mastermind-groups', 'young-professionals'],
  },
  {
    slug: 'bni-chapters',
    name: 'BNI Chapters',
    singularName: 'BNI Chapter',
    description: 'Track referral activity, manage weekly presentations, monitor member engagement, and coordinate substitute arrangements.',
    longDescription:
      'BNI chapters run on structured weekly meetings and accountability for referral activity. GatherGrove helps you track referrals passed and received, manage weekly meeting attendance and substitute arrangements, schedule member presentations, monitor engagement metrics, collect chapter dues, and communicate chapter updates. Build a chapter where every member is held to high standards and sees clear return on their investment.',
    icon: 'Users',
    features: ['Referral tracking', 'Attendance management', 'Presentation scheduling', 'Substitute coordination', 'Engagement metrics'],
    keywords: ['BNI chapter management', 'BNI software', 'business networking group app', 'referral group organizer'],
    relatedSlugs: ['chambers-of-commerce', 'professional-associations', 'young-professionals', 'mastermind-groups'],
  },
  {
    slug: 'womens-business-groups',
    name: "Women's Business Groups",
    singularName: "Women's Business Group",
    description: 'Connect businesswomen through networking events, mentorship programs, workshops, and peer accountability groups.',
    longDescription:
      "Women's business organizations create powerful networks that accelerate career growth and entrepreneurship. GatherGrove helps you organize networking events, run mentorship matching programs, schedule professional development workshops, manage membership tiers, facilitate peer accountability groups, and communicate opportunities to members. Build a community where businesswomen lift each other up and drive real economic impact.",
    icon: 'Briefcase',
    features: ['Mentorship matching', 'Networking events', 'Workshop scheduling', 'Peer groups', 'Member directory'],
    keywords: ["women's business group management", 'women business network software', 'female entrepreneur group app', 'women professional organizer'],
    relatedSlugs: ['professional-associations', 'young-professionals', 'mastermind-groups', 'chambers-of-commerce'],
  },
  {
    slug: 'young-professionals',
    name: 'Young Professionals Groups',
    singularName: 'Young Professionals Group',
    description: 'Organize career development events, social mixers, mentorship programs, and civic engagement for emerging leaders.',
    longDescription:
      'Young professional organizations bridge the gap between college and career success with networking and development opportunities. GatherGrove helps you organize career development workshops, social mixers, volunteer opportunities, mentorship programs, and civic engagement initiatives. Manage membership tiers, track event participation, and communicate opportunities that help young professionals build the networks and skills they need to thrive.',
    icon: 'TrendingUp',
    features: ['Event scheduling', 'Mentorship programs', 'Networking mixers', 'Civic engagement', 'Career development'],
    keywords: ['young professionals group management', 'YP network software', 'emerging leaders club app', 'young professional organizer'],
    relatedSlugs: ['professional-associations', 'chambers-of-commerce', 'toastmasters-clubs', 'alumni-associations'],
  },
  {
    slug: 'coding-bootcamp-alumni',
    name: 'Coding Bootcamp Alumni Groups',
    singularName: 'Coding Bootcamp Alumni Group',
    description: 'Connect bootcamp graduates through job referral networks, study groups, portfolio reviews, and tech community events.',
    longDescription:
      "Coding bootcamp alumni organizations help graduates maintain momentum after program completion and support each other through job searches and career growth. GatherGrove helps you manage alumni directories, organize portfolio review sessions, coordinate job referral networks, schedule study groups and hackathons, collect dues, and communicate job opportunities and industry events. Build a tech community that invests in every graduate's success.",
    icon: 'Code2',
    features: ['Alumni directory', 'Job referral network', 'Study group scheduling', 'Portfolio reviews', 'Hackathon management'],
    keywords: ['coding bootcamp alumni management', 'tech alumni network software', 'developer alumni group app', 'bootcamp community organizer'],
    relatedSlugs: ['alumni-associations', 'professional-associations', 'young-professionals', 'mastermind-groups'],
  },
  {
    slug: 'homeschool-co-ops',
    name: 'Homeschool Co-ops',
    singularName: 'Homeschool Co-op',
    description: 'Coordinate shared classes, manage volunteer teaching schedules, track student enrollments, and organize field trips.',
    longDescription:
      'Homeschool co-operatives bring families together to share teaching responsibilities and provide socialization opportunities. GatherGrove helps you schedule shared classes, manage volunteer teaching assignments, track student enrollment by subject, organize field trips and enrichment activities, collect co-op fees, and communicate schedule changes to families. Build a cooperative learning community where every family contributes and every student thrives.',
    icon: 'BookOpen',
    features: ['Class scheduling', 'Volunteer management', 'Student enrollment', 'Field trip coordination', 'Family communications'],
    keywords: ['homeschool co-op management', 'homeschool cooperative software', 'homeschool group app', 'homeschool organizer'],
    relatedSlugs: ['pta-pto-organizations', 'parenting-groups', 'nonprofit-organizations', 'social-clubs'],
  },
  {
    slug: 'writing-groups',
    name: 'Writing Groups',
    singularName: 'Writing Group',
    description: 'Organize manuscript critiques, writing sprints, workshop sessions, publication celebrations, and author networking.',
    longDescription:
      'Writing groups provide the accountability, feedback, and community that writers need to finish their work and grow their craft. GatherGrove helps you schedule critique sessions, organize writing sprints and workshops, share manuscripts for review, track member publishing milestones, collect group dues, and communicate about writing contests and publishing opportunities. Build a writing community where every member reaches their creative potential.',
    icon: 'PenLine',
    features: ['Critique scheduling', 'Manuscript sharing', 'Writing sprint coordination', 'Publication tracking', 'Workshop management'],
    keywords: ['writing group management', 'writing club software', 'critique group app', 'author group organizer'],
    relatedSlugs: ['book-clubs', 'toastmasters-clubs', 'art-clubs', 'social-clubs'],
  },
  {
    slug: 'investment-clubs',
    name: 'Investment Clubs',
    singularName: 'Investment Club',
    description: 'Manage member contributions, track portfolio performance, schedule monthly meetings, and coordinate stock research.',
    longDescription:
      'Investment clubs pool member resources and knowledge to make collective investment decisions. GatherGrove helps you manage member contribution records, track portfolio performance over time, schedule monthly research and decision meetings, distribute financial statements, collect dues, and communicate market research and investment proposals. Build a financially disciplined investment community where every member learns and contributes.',
    icon: 'TrendingUp',
    features: ['Contribution tracking', 'Portfolio reporting', 'Meeting scheduling', 'Research coordination', 'Financial statements'],
    keywords: ['investment club management', 'investment club software', 'stock club app', 'investment group organizer'],
    relatedSlugs: ['professional-associations', 'mastermind-groups', 'young-professionals', 'alumni-associations'],
  },
  {
    slug: 'mastermind-groups',
    name: 'Mastermind Groups',
    singularName: 'Mastermind Group',
    description: 'Facilitate peer advisory meetings, track member goals, share accountability check-ins, and organize group retreats.',
    longDescription:
      "Mastermind groups create high-accountability peer advisory circles where professionals support each other's growth. GatherGrove helps you schedule regular group meetings, track member goal commitments and progress, share accountability check-ins between sessions, organize annual retreats, manage group membership and applications, and communicate between meetings. Build a mastermind environment where focused peer pressure drives extraordinary results.",
    icon: 'Lightbulb',
    features: ['Meeting facilitation', 'Goal tracking', 'Accountability check-ins', 'Retreat planning', 'Member applications'],
    keywords: ['mastermind group management', 'mastermind software', 'peer advisory group app', 'accountability group organizer'],
    relatedSlugs: ['professional-associations', 'young-professionals', 'investment-clubs', 'bni-chapters'],
    bluf: 'GatherGrove gives mastermind groups a single platform for meeting scheduling, goal tracking, accountability check-ins, membership applications, and retreat planning - no more scattered tools.',
    faqs: [
      { question: 'What features does GatherGrove offer for mastermind groups?', answer: 'Meeting scheduling with recurring sessions, member goal tracking, accountability check-in reminders, application-based membership, retreat and event planning, and group communications - all in one platform.' },
      { question: 'How do I manage mastermind group applications?', answer: 'GatherGrove supports application-based membership. Prospective members apply through a form, and group leaders review and approve applications to maintain group quality and chemistry.' },
      { question: 'Can mastermind groups collect membership fees?', answer: 'Yes. GatherGrove handles recurring monthly or annual membership fees with automatic billing, payment tracking, and reminders for overdue payments.' },
    ],
  },
  {
    slug: 'language-exchange-clubs',
    name: 'Language Exchange Clubs',
    singularName: 'Language Exchange Club',
    description: 'Match conversation partners, schedule practice sessions, organize cultural events, and track member language levels.',
    longDescription:
      'Language exchange clubs connect native speakers and language learners for mutual practice and cultural exchange. GatherGrove helps you match conversation partners by language pairing and proficiency level, schedule practice sessions and tandem meetups, organize cultural events and film nights, track member language progress, collect membership fees, and communicate about new language offerings and special events. Build a multilingual community that celebrates every culture.',
    icon: 'Globe',
    features: ['Partner matching', 'Session scheduling', 'Cultural events', 'Proficiency tracking', 'Language directory'],
    keywords: ['language exchange club management', 'language club software', 'language learning group app', 'conversation club organizer'],
    relatedSlugs: ['social-clubs', 'cultural-heritage-groups', 'professional-associations', 'toastmasters-clubs'],
  },
  {
    slug: 'tutoring-cooperatives',
    name: 'Tutoring Cooperatives',
    singularName: 'Tutoring Cooperative',
    description: 'Coordinate tutor-student matching, manage session scheduling, track academic progress, and handle payment distribution.',
    longDescription:
      'Tutoring cooperatives organize community-based academic support networks where tutors and students are matched by subject and availability. GatherGrove helps you manage tutor profiles and subject expertise, match students with appropriate tutors, schedule sessions, track attendance and academic progress, handle fee collection and tutor compensation, and communicate with families about student development. Build a cooperative that makes quality academic support accessible to every student.',
    icon: 'GraduationCap',
    features: ['Tutor-student matching', 'Session scheduling', 'Progress tracking', 'Payment management', 'Subject directory'],
    keywords: ['tutoring cooperative management', 'tutoring co-op software', 'tutor matching app', 'academic support organizer'],
    relatedSlugs: ['homeschool-co-ops', 'pta-pto-organizations', 'language-exchange-clubs', 'professional-associations'],
  },
  {
    slug: 'lions-clubs',
    name: 'Lions Clubs',
    singularName: 'Lions Club',
    description: 'Coordinate community service projects, vision screenings, fundraising events, and member meeting schedules.',
    longDescription:
      "Lions Clubs International members serve their communities through vision care programs, disaster relief, and local charitable initiatives. GatherGrove helps you coordinate community service projects, organize vision and health screening events, manage fundraising campaigns, schedule regular meetings, track volunteer hours, collect membership dues, and communicate with members about upcoming service opportunities. Amplify your club's community impact with organized volunteer coordination.",
    icon: 'Heart',
    features: ['Service project coordination', 'Event management', 'Volunteer tracking', 'Fundraising campaigns', 'Meeting scheduling'],
    keywords: ['Lions Club management', 'Lions Club software', 'service club app', 'Lions International organizer'],
    relatedSlugs: ['rotary-clubs', 'kiwanis-clubs', 'nonprofit-organizations', 'veteran-organizations'],
  },
  {
    slug: 'kiwanis-clubs',
    name: 'Kiwanis Clubs',
    singularName: 'Kiwanis Club',
    description: 'Manage youth service programs, fundraising drives, meeting schedules, Key Club coordination, and community projects.',
    longDescription:
      'Kiwanis clubs focus on serving children and youth through community-based programs and fundraising. GatherGrove helps you manage youth service program coordination, organize fundraising drives, schedule weekly meetings, coordinate Key Club and Circle K chapters, track member volunteer hours, collect dues, and communicate with the broader Kiwanis community. Build a club that makes a lasting difference in the lives of young people.',
    icon: 'Star',
    features: ['Youth program management', 'Fundraising coordination', 'Meeting scheduling', 'Chapter coordination', 'Volunteer tracking'],
    keywords: ['Kiwanis club management', 'Kiwanis club software', 'service club app', 'youth service organizer'],
    relatedSlugs: ['rotary-clubs', 'lions-clubs', 'nonprofit-organizations', 'pta-pto-organizations'],
  },

  // ── Community / Lifestyle (15) ─────────────────────────────────────────────
  {
    slug: 'neighborhood-associations',
    name: 'Neighborhood Associations',
    singularName: 'Neighborhood Association',
    description: 'Coordinate community meetings, manage neighborhood concerns, organize block parties, and communicate local updates.',
    longDescription:
      'Neighborhood associations are the voice of residential communities, advocating for local improvements and building neighbor connections. GatherGrove helps you schedule community meetings, manage neighborhood concern submissions, organize block parties and community events, coordinate with local government, collect optional dues, and communicate traffic alerts, safety notices, and neighborhood news to every household. Build a neighborhood where residents feel connected and empowered.',
    icon: 'Home',
    features: ['Community meeting scheduling', 'Concern tracking', 'Block party planning', 'Resident directory', 'Bulk announcements'],
    keywords: ['neighborhood association management', 'neighborhood association software', 'HOA alternative app', 'community association organizer'],
    relatedSlugs: ['homeowners-associations', 'garden-clubs', 'environmental-groups', 'pta-pto-organizations'],
  },
  {
    slug: 'environmental-groups',
    name: 'Environmental Groups',
    singularName: 'Environmental Group',
    description: 'Organize cleanups, advocacy campaigns, educational workshops, fundraising events, and volunteer coordination.',
    longDescription:
      "Environmental organizations mobilize community members to protect natural spaces and advocate for sustainable practices. GatherGrove helps you coordinate cleanup events, organize advocacy campaigns and letter-writing drives, schedule educational workshops, manage fundraising initiatives, track volunteer participation, collect memberships, and communicate environmental news to your community. Demonstrate your organization's impact with clear volunteer tracking and event reporting.",
    icon: 'Leaf',
    features: ['Cleanup coordination', 'Advocacy campaigns', 'Workshop scheduling', 'Volunteer management', 'Impact tracking'],
    keywords: ['environmental group management', 'conservation group software', 'environmental club app', 'green organization organizer'],
    relatedSlugs: ['nonprofit-organizations', 'garden-clubs', 'neighborhood-associations', 'animal-rescue-organizations'],
  },
  {
    slug: 'animal-rescue-organizations',
    name: 'Animal Rescue Organizations',
    singularName: 'Animal Rescue Organization',
    description: 'Manage foster networks, volunteer shifts, adoption events, fundraising campaigns, and animal intake records.',
    longDescription:
      'Animal rescue organizations save lives through coordinated foster networks, adoption events, and community fundraising. GatherGrove helps you manage foster family networks, schedule volunteer shifts for shelter operations, organize adoption events, run fundraising campaigns, track donations, and communicate urgent rescue and intake needs to your network. Build a rescue community that gives every animal a second chance.',
    icon: 'Heart',
    features: ['Foster network management', 'Volunteer scheduling', 'Adoption events', 'Fundraising campaigns', 'Animal intake tracking'],
    keywords: ['animal rescue organization management', 'rescue group software', 'animal shelter volunteer app', 'pet rescue organizer'],
    relatedSlugs: ['nonprofit-organizations', 'environmental-groups', 'food-banks', 'social-clubs'],
  },
  {
    slug: 'food-banks',
    name: 'Food Banks & Pantries',
    singularName: 'Food Bank',
    description: 'Coordinate volunteer shifts, manage client appointments, track food inventory, and organize food drives.',
    longDescription:
      "Food banks and community pantries fight food insecurity through coordinated volunteer efforts and community generosity. GatherGrove helps you schedule volunteer shifts for sorting and distribution, manage client appointment systems, track food inventory and donations, organize food drive campaigns, communicate with corporate and individual donors, and report impact metrics. Maximize your pantry's reach with efficient volunteer coordination and clear community communications.",
    icon: 'Package',
    features: ['Volunteer scheduling', 'Client appointments', 'Inventory tracking', 'Food drive campaigns', 'Donor management'],
    keywords: ['food bank management', 'food pantry software', 'food bank volunteer app', 'community pantry organizer'],
    relatedSlugs: ['nonprofit-organizations', 'animal-rescue-organizations', 'veteran-organizations', 'faith-based-organizations'],
  },
  {
    slug: 'senior-citizen-clubs',
    name: 'Senior Citizens Clubs',
    singularName: 'Senior Citizens Club',
    description: 'Organize activities, manage transportation coordination, plan social gatherings, and support member wellness programs.',
    longDescription:
      'Senior citizen clubs provide vital social connection, mental stimulation, and wellness programming for older adults. GatherGrove helps you schedule activities like card games, exercise classes, and craft sessions, coordinate transportation for members who need it, organize special events and day trips, manage membership rosters, collect dues, and communicate program changes. Create a warm, welcoming community where every senior feels valued and engaged.',
    icon: 'Users',
    features: ['Activity scheduling', 'Transportation coordination', 'Trip planning', 'Wellness programs', 'Member communications'],
    keywords: ['senior citizens club management', 'senior center software', 'senior club app', 'older adult activity organizer'],
    relatedSlugs: ['social-clubs', 'nonprofit-organizations', 'faith-based-organizations', 'garden-clubs'],
  },
  {
    slug: 'veteran-organizations',
    name: 'Veteran Organizations',
    singularName: 'Veteran Organization',
    description: 'Coordinate veteran services, manage membership records, organize commemorative events, and connect members with resources.',
    longDescription:
      'Veteran organizations honor service, build brotherhood and sisterhood, and connect veterans with the resources they need. GatherGrove helps you manage veteran membership records by branch and era, coordinate service programs and resource referrals, organize commemorative events and ceremonies, manage post or chapter meetings, run fundraising for veteran causes, and communicate chapter updates. Build an organization that serves those who served.',
    icon: 'Shield',
    features: ['Member records', 'Service coordination', 'Commemorative events', 'Resource referrals', 'Chapter management'],
    keywords: ['veteran organization management', 'VFW post software', 'American Legion app', 'veteran club organizer'],
    relatedSlugs: ['nonprofit-organizations', 'lions-clubs', 'faith-based-organizations', 'social-clubs'],
  },
  {
    slug: 'cultural-heritage-groups',
    name: 'Cultural Heritage Groups',
    singularName: 'Cultural Heritage Group',
    description: 'Celebrate cultural traditions, organize festivals and language classes, manage community events, and preserve heritage.',
    longDescription:
      'Cultural heritage organizations preserve traditions, celebrate shared identity, and welcome new generations into their cultural community. GatherGrove helps you organize cultural festivals and celebrations, schedule language and cultural education classes, manage community events, coordinate traditional dance and music programs, collect membership dues, and communicate heritage news and opportunities. Build a vibrant cultural community that honors the past while welcoming the future.',
    icon: 'Globe',
    features: ['Festival management', 'Cultural classes', 'Community events', 'Heritage programs', 'Member directory'],
    keywords: ['cultural heritage group management', 'cultural organization software', 'ethnic community club app', 'heritage association organizer'],
    relatedSlugs: ['nonprofit-organizations', 'language-exchange-clubs', 'faith-based-organizations', 'social-clubs'],
  },
  {
    slug: 'parenting-groups',
    name: 'Parenting Groups',
    singularName: 'Parenting Group',
    description: 'Organize playdate scheduling, coordinate parent resource sharing, manage group discussions, and plan family events.',
    longDescription:
      'Parenting groups create supportive communities for parents to share experiences, resources, and childcare coordination. GatherGrove helps you schedule playdates and family meetups, coordinate childcare swaps, organize parent education workshops, manage group communications, share local resource lists, collect optional dues, and plan family-friendly events. Build a parenting community where no parent feels alone and every family is supported.',
    icon: 'Users',
    features: ['Playdate scheduling', 'Childcare coordination', 'Resource sharing', 'Workshop planning', 'Group communications'],
    keywords: ['parenting group management', 'parent group software', 'moms group app', 'family group organizer'],
    relatedSlugs: ['pta-pto-organizations', 'homeschool-co-ops', 'neighborhood-associations', 'social-clubs'],
  },
  {
    slug: 'new-resident-welcome-clubs',
    name: 'New Resident Welcome Clubs',
    singularName: 'New Resident Welcome Club',
    description: 'Welcome newcomers with orientation events, local resource guides, community introductions, and social mixers.',
    longDescription:
      'New resident welcome organizations help people quickly feel at home in a new community by connecting them with neighbors and local resources. GatherGrove helps you schedule welcome orientations and social mixers, manage newcomer contact information, organize neighborhood tours and introductions to local businesses, share community resource guides, coordinate buddy programs pairing newcomers with established residents, and communicate upcoming community events. Make every newcomer feel instantly welcome.',
    icon: 'MapPin',
    features: ['Welcome event scheduling', 'Newcomer directory', 'Resource guides', 'Buddy program matching', 'Community introductions'],
    keywords: ['welcome club management', 'newcomer group software', 'new resident association app', 'community welcome organizer'],
    relatedSlugs: ['neighborhood-associations', 'social-clubs', 'homeowners-associations', 'parenting-groups'],
  },
  {
    slug: 'disability-advocacy-groups',
    name: 'Disability Advocacy Groups',
    singularName: 'Disability Advocacy Group',
    description: 'Coordinate advocacy campaigns, manage resource networks, organize accessible events, and support member community.',
    longDescription:
      'Disability advocacy organizations champion accessibility, inclusion, and equal rights for people with disabilities in their communities. GatherGrove helps you coordinate advocacy campaigns and legislative outreach, manage peer support networks, organize fully accessible community events, connect members with resources and services, collect memberships, and communicate disability rights news and opportunities. Build an empowered community that advocates for the dignity and inclusion of every person.',
    icon: 'Heart',
    features: ['Advocacy coordination', 'Resource networks', 'Accessible events', 'Peer support programs', 'Member communications'],
    keywords: ['disability advocacy group management', 'disability organization software', 'accessibility advocacy app', 'disability support group organizer'],
    relatedSlugs: ['nonprofit-organizations', 'mental-health-support-groups', 'veteran-organizations', 'senior-citizen-clubs'],
  },
  {
    slug: 'mental-health-support-groups',
    name: 'Mental Health Support Groups',
    singularName: 'Mental Health Support Group',
    description: 'Coordinate peer support meetings, manage facilitator schedules, share mental health resources, and protect member privacy.',
    longDescription:
      'Mental health support groups provide safe, judgment-free spaces for peer connection and shared experience. GatherGrove helps you schedule support group meetings, manage trained facilitator assignments, share vetted mental health resources, handle sensitive membership information with appropriate privacy controls, coordinate crisis resource referrals, and communicate group updates with discretion. Build a supportive community where every member feels heard, respected, and never alone.',
    icon: 'Heart',
    features: ['Meeting scheduling', 'Facilitator management', 'Resource sharing', 'Privacy controls', 'Crisis resource coordination'],
    keywords: ['mental health support group management', 'support group software', 'peer support group app', 'mental wellness group organizer'],
    relatedSlugs: ['nonprofit-organizations', 'disability-advocacy-groups', 'faith-based-organizations', 'social-clubs'],
  },
  {
    slug: 'lgbtq-organizations',
    name: 'LGBTQ Organizations',
    singularName: 'LGBTQ Organization',
    description: 'Organize community events, manage support programs, coordinate advocacy efforts, and build inclusive member communities.',
    longDescription:
      'LGBTQ organizations create affirming communities, advocate for equal rights, and provide vital support services. GatherGrove helps you organize pride events and community celebrations, manage peer support and mentorship programs, coordinate advocacy and outreach campaigns, run youth programming, collect memberships, and communicate with members while protecting sensitive information. Build an inclusive organization where every person can live authentically and know they belong.',
    icon: 'Heart',
    features: ['Event management', 'Support programs', 'Advocacy coordination', 'Youth programming', 'Inclusive communications'],
    keywords: ['LGBTQ organization management', 'pride organization software', 'queer community app', 'LGBTQ group organizer'],
    relatedSlugs: ['nonprofit-organizations', 'disability-advocacy-groups', 'cultural-heritage-groups', 'mental-health-support-groups'],
  },
  {
    slug: 'faith-based-organizations',
    name: 'Faith-Based Organizations',
    singularName: 'Faith-Based Organization',
    description: 'Manage congregation directories, coordinate volunteer ministries, plan worship events, and handle donation tracking.',
    longDescription:
      'Faith-based organizations serve their congregations and surrounding communities through worship, education, and outreach. GatherGrove helps you manage congregation member directories, coordinate volunteer ministry teams, schedule worship services and special events, handle charitable donation tracking, manage small group programs, and communicate with members about service opportunities and community needs. Strengthen your faith community with tools that support every ministry and every member.',
    icon: 'Heart',
    features: ['Congregation directory', 'Ministry coordination', 'Event scheduling', 'Donation tracking', 'Small group management'],
    keywords: ['faith-based organization management', 'church management software', 'religious organization app', 'congregation management tool'],
    relatedSlugs: ['nonprofit-organizations', 'veteran-organizations', 'food-banks', 'cultural-heritage-groups'],
  },
  {
    slug: 'homeowners-associations',
    name: 'Homeowners Associations',
    singularName: 'Homeowners Association',
    description: 'Manage HOA dues, coordinate maintenance requests, track violations, schedule board meetings, and communicate with residents.',
    longDescription:
      'Homeowners associations maintain property values and community standards through organized governance and resident communication. GatherGrove helps you manage annual dues collection and payment tracking, coordinate maintenance and violation management, schedule board and annual meetings, facilitate community voting, maintain governing documents, and communicate with residents about assessments, events, and important decisions. Run a transparent, professional HOA that residents trust and value.',
    icon: 'Home',
    features: ['Dues management', 'Maintenance requests', 'Violation tracking', 'Board meeting scheduling', 'Resident communications'],
    keywords: ['HOA management software', 'homeowners association app', 'HOA board tool', 'community association organizer'],
    relatedSlugs: ['neighborhood-associations', 'new-resident-welcome-clubs', 'garden-clubs', 'social-clubs'],
    bluf: 'GatherGrove gives HOA boards one platform for dues collection, maintenance tracking, violation management, board meeting scheduling, and resident communications - replacing spreadsheets, paper notices, and email chains.',
    faqs: [
      { question: 'Can homeowners pay HOA dues online with GatherGrove?', answer: 'Yes. GatherGrove supports online dues payment via credit card and ACH bank transfer, with automatic recurring billing, payment reminders, and a dashboard that shows who has paid and who is overdue.' },
      { question: 'How do HOA boards track maintenance requests?', answer: 'GatherGrove lets residents submit maintenance requests through the member portal. Board members can assign requests, track status, add notes, and notify residents when work is completed.' },
      { question: 'Is there an affordable HOA management option?', answer: `GatherGrove offers a 30-day free trial with full access to all features. After the trial, the Seed plan starts at ${SEED_MONTHLY_PRICE_COPY} for up to 100 members, and the Grow plan at ${GROW_MONTHLY_PRICE_COPY} covers up to 200 members.` },
    ],
  },
  {
    slug: 'pta-pto-organizations',
    name: 'PTA & PTO Organizations',
    singularName: 'PTA/PTO Organization',
    description: 'Coordinate school volunteer programs, manage fundraising campaigns, organize events, and communicate with families.',
    longDescription:
      'PTA and PTO organizations are essential partners in student success, connecting families, educators, and communities. GatherGrove helps you manage school volunteer sign-ups, run fundraising campaigns and spirit weeks, organize school events and field trips, manage membership collection, communicate with families via targeted messages by grade or classroom, and track community involvement. Build an engaged school community where every family feels welcome to participate.',
    icon: 'GraduationCap',
    features: ['Volunteer sign-ups', 'Fundraising campaigns', 'Event planning', 'Family communications', 'Membership management'],
    keywords: ['PTA management software', 'PTO management app', 'school parent organization tool', 'school fundraising organizer'],
    relatedSlugs: ['homeschool-co-ops', 'parenting-groups', 'nonprofit-organizations', 'neighborhood-associations'],
  },

  // ── Hobby / Interest (15) ─────────────────────────────────────────────────
  {
    slug: 'board-game-clubs',
    name: 'Board Game Clubs',
    singularName: 'Board Game Club',
    description: 'Organize game nights, manage game libraries, run tournaments, and match players by game preference and skill.',
    longDescription:
      'Board game clubs bring tabletop enthusiasts together for everything from casual game nights to competitive tournaments. GatherGrove helps you schedule game nights by genre or complexity, manage club game libraries and lending, run tournament brackets, match members by game preference, collect membership dues, and communicate about new game releases and upcoming events. Build a gaming community that plays together and grows together.',
    icon: 'Gamepad2',
    features: ['Game night scheduling', 'Library management', 'Tournament brackets', 'Player matching', 'Member communications'],
    keywords: ['board game club management', 'board game club software', 'tabletop gaming group app', 'board game organizer'],
    relatedSlugs: ['dnd-groups', 'card-game-clubs', 'chess-clubs', 'social-clubs'],
  },
  {
    slug: 'dnd-groups',
    name: 'D&D & Tabletop RPG Groups',
    singularName: 'D&D Group',
    description: 'Schedule campaigns, manage player rosters, coordinate one-shots, track characters, and organize conventions.',
    longDescription:
      'Tabletop roleplaying groups need flexible scheduling tools and community features to keep campaigns on track. GatherGrove helps you schedule regular campaign sessions, manage player rosters by Dungeon Master and campaign, coordinate one-shot events for new players, organize convention attendance and local TTRPG events, collect group dues or supplies funds, and communicate session reminders and campaign updates. Build a dungeon-delving community where every session is epic.',
    icon: 'Crown',
    features: ['Campaign scheduling', 'Player roster management', 'One-shot coordination', 'Convention planning', 'Group communications'],
    keywords: ['D&D group management', 'TTRPG group software', 'tabletop RPG club app', 'Dungeons and Dragons organizer'],
    relatedSlugs: ['board-game-clubs', 'card-game-clubs', 'chess-clubs', 'social-clubs'],
    bluf: 'GatherGrove handles D&D group logistics - campaign scheduling, player rosters, one-shot coordination, dues splitting, and session reminders - so the DM can focus on worldbuilding.',
    faqs: [
      { question: 'How do I manage multiple D&D campaigns in one group?', answer: 'GatherGrove lets you create separate events and member groups for each campaign. Players can be in multiple campaigns, and each has its own schedule, roster, and communication thread.' },
      { question: 'Can D&D groups collect dues to split costs?', answer: 'Yes. GatherGrove supports recurring dues collection and one-time payments, so your group can split costs for books, miniatures, battle maps, snacks, or venue rental.' },
      { question: 'How much does GatherGrove cost for small D&D groups?', answer: `GatherGrove offers a 30-day free trial. After the trial, the Seed plan at ${SEED_MONTHLY_PRICE_COPY} covers up to 100 members, and the Grow plan at ${GROW_MONTHLY_PRICE_COPY} covers up to 200 members - all features included.` },
    ],
  },
  {
    slug: 'card-game-clubs',
    name: 'Card Game Clubs',
    singularName: 'Card Game Club',
    description: 'Organize Magic: The Gathering drafts, poker nights, trading card tournaments, and collectible card game events.',
    longDescription:
      'Card game clubs span everything from casual poker nights to competitive trading card game tournaments. GatherGrove helps you schedule draft events and tournament nights, manage store-and-forward card trading among members, run league systems with point tracking, coordinate sanctioned tournament registration, collect membership dues, and communicate about new set releases and upcoming events. Build a card gaming community that welcomes casual players and competitive grinders alike.',
    icon: 'Layers',
    features: ['Event scheduling', 'Draft management', 'League tracking', 'Tournament registration', 'Member communications'],
    keywords: ['card game club management', 'MTG club software', 'trading card game group app', 'poker club organizer'],
    relatedSlugs: ['board-game-clubs', 'dnd-groups', 'chess-clubs', 'social-clubs'],
  },
  {
    slug: 'model-building-clubs',
    name: 'Model Building Clubs',
    singularName: 'Model Building Club',
    description: 'Coordinate model shows, manage build competitions, organize workshops, and facilitate parts and kit exchanges.',
    longDescription:
      'Model building clubs unite enthusiasts of scale models, trains, aircraft, ships, and dioramas in a shared passion for craftsmanship. GatherGrove helps you organize model shows and competitions, schedule building workshops and technique demonstrations, facilitate parts and kit exchanges among members, manage club show entries, collect annual dues, and communicate about new releases, contests, and club build projects. Build a modeling community that celebrates the art of the miniature.',
    icon: 'Wrench',
    features: ['Show management', 'Competition organization', 'Workshop scheduling', 'Kit exchange', 'Member directory'],
    keywords: ['model building club management', 'scale model club software', 'model train club app', 'model show organizer'],
    relatedSlugs: ['robotics-clubs', 'vintage-car-clubs', 'woodworking-clubs', 'social-clubs'],
  },
  {
    slug: 'ham-radio-clubs',
    name: 'Ham Radio Clubs',
    singularName: 'Ham Radio Club',
    description: 'Coordinate net schedules, manage license exam sessions, organize Field Day events, and track member certifications.',
    longDescription:
      'Amateur radio clubs serve both the hobby community and public safety through emergency communication preparedness and radio experimentation. GatherGrove helps you schedule weekly nets and club meetings, coordinate amateur radio license exam sessions, organize Field Day and contest participation, track member call signs and license classes, manage club equipment inventory, collect dues, and communicate club news and on-air events. Build a ham radio community that serves both the airwaves and the public.',
    icon: 'Radio',
    features: ['Net scheduling', 'License exam sessions', 'Field Day coordination', 'Equipment inventory', 'Member call sign directory'],
    keywords: ['ham radio club management', 'amateur radio club software', 'ARRL club app', 'ham radio organizer'],
    relatedSlugs: ['astronomy-clubs', 'robotics-clubs', 'drone-clubs', 'social-clubs'],
  },
  {
    slug: 'astronomy-clubs',
    name: 'Astronomy Clubs',
    singularName: 'Astronomy Club',
    description: 'Organize star parties, manage telescope lending, schedule public outreach events, and track observing programs.',
    longDescription:
      'Astronomy clubs bring together stargazers for shared observations, public education, and a deeper understanding of the universe. GatherGrove helps you schedule star party events at dark sky sites, manage telescope lending programs, organize public outreach at schools and libraries, coordinate observing programs and awards, collect membership dues, and communicate about astronomical events like eclipses, conjunctions, and meteor showers. Build a stargazing community that illuminates the night sky for everyone.',
    icon: 'Star',
    features: ['Star party scheduling', 'Telescope lending', 'Public outreach events', 'Observing programs', 'Member communications'],
    keywords: ['astronomy club management', 'stargazing club software', 'astronomy group app', 'star party organizer'],
    relatedSlugs: ['ham-radio-clubs', 'photography-clubs', 'birdwatching-clubs', 'social-clubs'],
  },
  {
    slug: 'birdwatching-clubs',
    name: 'Birdwatching Clubs',
    singularName: 'Birdwatching Club',
    description: 'Organize birding outings, manage sighting databases, coordinate citizen science projects, and track life lists.',
    longDescription:
      'Birdwatching clubs connect birders for shared sightings, citizen science contributions, and advocacy for bird habitats. GatherGrove helps you organize birding field trips to local hotspots, manage member sighting databases and life lists, coordinate Christmas Bird Count and other citizen science events, schedule identification workshops, collect annual dues, and communicate rare sighting alerts and event updates. Build a birding community that turns every field trip into an adventure.',
    icon: 'Bird',
    features: ['Field trip scheduling', 'Sighting database', 'Life list tracking', 'Citizen science events', 'Rare bird alerts'],
    keywords: ['birdwatching club management', 'birding club software', 'bird club app', 'birdwatcher group organizer'],
    relatedSlugs: ['photography-clubs', 'hiking-clubs', 'astronomy-clubs', 'environmental-groups'],
  },
  {
    slug: 'woodworking-clubs',
    name: 'Woodworking Clubs',
    singularName: 'Woodworking Club',
    description: 'Coordinate shop access schedules, manage tool lending, organize skill-sharing workshops, and plan project showcases.',
    longDescription:
      'Woodworking clubs provide shared shop access, skill development, and community for makers and craftspeople. GatherGrove helps you manage shop access scheduling, coordinate tool lending and maintenance tracking, organize hands-on workshops for joinery, finishing, and design, plan project showcases and community build events, collect membership dues, and communicate about shop safety, new tool acquisitions, and upcoming events. Build a maker community where every member levels up their craft.',
    icon: 'Hammer',
    features: ['Shop scheduling', 'Tool management', 'Workshop coordination', 'Project showcases', 'Safety communications'],
    keywords: ['woodworking club management', 'makerspace software', 'woodworking group app', 'workshop club organizer'],
    relatedSlugs: ['art-clubs', 'model-building-clubs', 'pottery-clubs', 'robotics-clubs'],
  },
  {
    slug: 'quilting-clubs',
    name: 'Quilting Clubs',
    singularName: 'Quilting Club',
    description: 'Organize sew-ins, manage block swaps, coordinate charity quilt projects, and schedule quilting skill workshops.',
    longDescription:
      'Quilting guilds and clubs bring together fiber artists for shared projects, skill development, and charitable giving. GatherGrove helps you schedule sew-in days and guild meetings, organize fabric and block swap programs, coordinate charity quilt drives for hospitals and shelters, manage show-and-tell showcases, collect annual dues, and communicate about upcoming quilt shows, retreats, and vendor events. Stitch together a quilting community that creates beauty and gives back.',
    icon: 'Scissors',
    features: ['Sew-in scheduling', 'Block swap management', 'Charity project coordination', 'Show scheduling', 'Member communications'],
    keywords: ['quilting club management', 'quilting guild software', 'sewing group app', 'quilt guild organizer'],
    relatedSlugs: ['art-clubs', 'woodworking-clubs', 'pottery-clubs', 'social-clubs'],
  },
  {
    slug: 'pottery-clubs',
    name: 'Pottery & Ceramics Clubs',
    singularName: 'Pottery Club',
    description: 'Manage studio access, coordinate kiln schedules, organize throwing workshops, and plan member exhibitions.',
    longDescription:
      'Pottery and ceramics clubs provide shared studio space and community for clay artists at every skill level. GatherGrove helps you manage studio access and wheel reservations, coordinate kiln firing schedules, organize hand-building and throwing workshops, plan member exhibitions and sales, collect membership dues and studio fees, and communicate about clay deliveries, glaze days, and special workshops. Build a studio community where every member creates their best work.',
    icon: 'Circle',
    features: ['Studio scheduling', 'Kiln coordination', 'Workshop management', 'Exhibition planning', 'Studio fee collection'],
    keywords: ['pottery club management', 'ceramics studio software', 'pottery group app', 'clay studio organizer'],
    relatedSlugs: ['art-clubs', 'quilting-clubs', 'woodworking-clubs', 'social-clubs'],
  },
  {
    slug: 'drone-clubs',
    name: 'Drone Clubs',
    singularName: 'Drone Club',
    description: 'Coordinate fly days, manage FAA waiver tracking, organize racing events, and share aerial photography knowledge.',
    longDescription:
      'Drone clubs unite multirotor enthusiasts, FPV racers, and aerial photographers around their shared passion for unmanned flight. GatherGrove helps you coordinate fly day events at approved sites, track member FAA Part 107 certifications and waivers, organize drone racing competitions, share aerial photography tips and waypoints, collect club dues, and communicate regulatory updates and fly site information. Build a drone community that flies safely, legally, and with incredible skill.',
    icon: 'Navigation',
    features: ['Fly day scheduling', 'FAA certification tracking', 'Racing events', 'Site management', 'Regulatory communications'],
    keywords: ['drone club management', 'UAV club software', 'FPV club app', 'aerial photography group organizer'],
    relatedSlugs: ['photography-clubs', 'ham-radio-clubs', 'robotics-clubs', 'model-building-clubs'],
  },
  {
    slug: 'robotics-clubs',
    name: 'Robotics Clubs',
    singularName: 'Robotics Club',
    description: 'Manage build seasons, coordinate competition registrations, organize STEM workshops, and track project milestones.',
    longDescription:
      'Robotics clubs inspire engineers, programmers, and makers through competitive and collaborative robot building. GatherGrove helps you manage build season schedules, coordinate regional and national competition registrations, organize STEM outreach workshops, track project milestones and team assignments, collect membership and competition fees, and communicate build updates and competition results. Build a robotics community that develops the next generation of engineers.',
    icon: 'Cpu',
    features: ['Build season scheduling', 'Competition management', 'STEM workshops', 'Project tracking', 'Team coordination'],
    keywords: ['robotics club management', 'FIRST robotics software', 'robot club app', 'STEM club organizer'],
    relatedSlugs: ['drone-clubs', 'ham-radio-clubs', 'model-building-clubs', 'woodworking-clubs'],
  },
  {
    slug: 'film-clubs',
    name: 'Film Clubs',
    singularName: 'Film Club',
    description: 'Curate screening schedules, manage member discussions, coordinate filmmaker Q&As, and organize film festivals.',
    longDescription:
      'Film clubs bring cinema enthusiasts together to watch, discuss, and celebrate the art of filmmaking. GatherGrove helps you curate monthly screening schedules by genre or director, manage post-film discussion groups, coordinate filmmaker Q&A events, organize short film festivals and student screenings, collect membership dues, and communicate about upcoming screenings, new releases, and film-related events. Build a cinema community where every film sparks a great conversation.',
    icon: 'Film',
    features: ['Screening scheduling', 'Discussion management', 'Q&A coordination', 'Festival organization', 'Member communications'],
    keywords: ['film club management', 'movie club software', 'cinema club app', 'film society organizer'],
    relatedSlugs: ['book-clubs', 'photography-clubs', 'art-clubs', 'social-clubs'],
  },
  {
    slug: 'cooking-clubs',
    name: 'Cooking Clubs',
    singularName: 'Cooking Club',
    description: 'Organize potlucks, cooking challenges, cuisine-themed dinners, recipe exchanges, and cooking class outings.',
    longDescription:
      'Cooking clubs unite food enthusiasts for shared meals, culinary education, and the joy of cooking together. GatherGrove helps you organize themed potluck dinners and cooking challenges, coordinate cuisine-focused tasting events, manage recipe exchanges among members, schedule cooking class outings at local restaurants and culinary schools, collect dues, and communicate upcoming menus and special events. Build a foodie community that explores every cuisine and celebrates every cook.',
    icon: 'Utensils',
    features: ['Event scheduling', 'Recipe sharing', 'Themed dinner coordination', 'Cooking class outings', 'Member communications'],
    keywords: ['cooking club management', 'food club software', 'culinary group app', 'foodie club organizer'],
    relatedSlugs: ['social-clubs', 'book-clubs', 'art-clubs', 'garden-clubs'],
  },
  {
    slug: 'vintage-car-clubs',
    name: 'Vintage Car Clubs',
    singularName: 'Vintage Car Club',
    description: 'Coordinate car shows, organize group drives, manage vehicle registrations, and share restoration expertise.',
    longDescription:
      'Vintage car clubs unite enthusiasts who share a passion for classic, antique, and special interest automobiles. GatherGrove helps you coordinate car show participation and host local shows, organize group cruise events, manage member vehicle registrations and histories, facilitate restoration advice networks, collect annual dues, and communicate about upcoming car shows, swap meets, and club drives. Build a classic car community that preserves automotive history and turns every drive into a celebration.',
    icon: 'Car',
    features: ['Car show coordination', 'Cruise event planning', 'Vehicle registry', 'Restoration network', 'Member communications'],
    keywords: ['vintage car club management', 'classic car club software', 'antique car group app', 'car show organizer'],
    relatedSlugs: ['model-building-clubs', 'social-clubs', 'disc-golf-clubs', 'outdoor-clubs'],
  },
]

export function getClubTypeBySlug(slug: string): ClubTypeEntry | undefined {
  return CLUB_TYPES.find((ct) => ct.slug === slug)
}

export function getAllClubTypeSlugs(): string[] {
  return CLUB_TYPES.map((ct) => ct.slug)
}
