# GatherGrove Deep Research Prompts (Extended)

> **Supplements**: `SEO-CONTENT-PLAN.md` (Prompts 1.1-9.1)
> **Created**: 2026-03-16
> **Purpose**: Additional deep research prompts informed by competitive intelligence, market data, and content gap analysis

---

## How to Use

1. Run each prompt through **ChatGPT Deep Research**, **Perplexity Pro**, or **Gemini Deep Research**
2. Save output in `docs/seo/research/` with the filename indicated
3. Run Prompt Sets A first (market intelligence), then B (pSEO), then C-F

---

## Market Intelligence Summary (From Research)

Before diving into prompts, here's what we found:

### Market Size
| Market | 2025 Value | Projected | CAGR |
|--------|-----------|-----------|------|
| Membership Management Software | $5.68B | $12.04B by 2028 | 12.1% |
| Event Management Software | $7.2B | $14.7B by 2034 | 7.9% |
| Youth Sports Software | $1.36B | $3.93B by 2034 | 12.5% |
| Youth Sports (overall) | ~$50B | $114B by 2032 | ~11% |
| Virtual Events | $236.69B | $537.18B by 2029 | 22.7% |

### Organization Counts (US)
- 2M+ nonprofits (1.48M are 501(c)(3))
- 27M+ youth sports participants
- ~370,000 HOAs/community associations
- 12.8M nonprofit employees (10% of private sector)
- $2.6T in annual nonprofit revenue

### Key Pain Point Stats
- 52% of non-renewals cite lack of engagement
- 73% higher churn for members not engaged in first 90 days
- 23% revenue loss from manual dues collection
- 16 hours/week spent on manual admin by executives
- 95% of nonprofit leaders concerned about volunteer burnout
- 76% of associations lack a formal AI policy
- Only 15% of nonprofits globally are digitally mature

### Competitor Landscape
| Tier | Competitors | Notes |
|------|------------|-------|
| Direct | Wild Apricot, ClubExpress, MemberPlanet, Memberful, JoinIt, Raklet, GroupSpot, Heylo, Cheddar Up, Glue Up | Wild Apricot declining post-Personify acquisition |
| Sports | TeamSnap (25M users), SportsEngine, LeagueApps, PlayMetrics, TeamLinkt | $1.36B market |
| Volunteer | SignUpGenius, Better Impact, VolunteerHub, POINT, Civic Champs | |
| Adjacent | Meetup, Eventbrite, Band App, Mighty Networks, Circle.so, Hivebrite | |

### Wild Apricot Weaknesses (Opportunity)
- Support takes up to 3 weeks for email responses
- Website/text editing is painful
- Prices increasing with unwanted features
- Quality decline since Personify acquisition
- Limited customization (1 invoice template)
- Email sending limitations

---

## PROMPT SET A: Market Intelligence (Run First)

### Prompt A1 -- Total Addressable Market Deep Dive
**Save as**: `research/21-tam-analysis.md`

```
I'm building an SEO content strategy for GatherGrove, a membership and event management platform for community organizations. Do a comprehensive total addressable market (TAM) analysis for the United States.

Break down the EXACT number of organizations by type with sources:
1. Youth sports leagues & clubs (by sport: soccer, baseball, basketball, swimming, football, lacrosse, hockey, volleyball, gymnastics, martial arts, tennis, pickleball, track & field, wrestling, cheerleading, dance)
2. Running/cycling/triathlon clubs (RRCA, USA Cycling, USAT data)
3. Registered 501(c)(3) nonprofits by category and size
4. 501(c)(4) social welfare organizations
5. 501(c)(7) social clubs
6. HOAs, condo associations, co-ops (CAI data)
7. PTAs/PTOs (National PTA data)
8. Religious congregations and affiliated groups
9. Veterans organizations (VFW, American Legion posts)
10. Service clubs (Rotary, Lions, Kiwanis, Optimist -- give individual counts)
11. Fraternal organizations (Elks, Moose, Eagles, Knights of Columbus)
12. Scouting organizations (BSA, Girl Scouts, 4-H, Camp Fire)
13. Garden clubs (National Garden Clubs data)
14. Book clubs (estimated)
15. Chambers of Commerce
16. Professional associations and trade groups
17. Alumni associations
18. Cultural and ethnic organizations
19. Music/arts organizations and booster clubs
20. Fishing/hunting/shooting clubs
21. Maker spaces and hackerspaces
22. Wine/beer clubs
23. Gaming groups (board game, D&D, card game groups)
24. Pickleball clubs specifically (fastest growing sport)
25. CrossFit boxes and fitness communities

For each:
- Total count in the US (with source)
- Average organization size (members)
- Estimated annual budget
- Current technology adoption rate
- Willingness to pay for software (survey data if available)
- Growth trend (growing, stable, declining)

Then calculate:
- Total number of organizations: ____
- Total addressable members: ____
- If 5% adopt at $30/mo average: $____ ARR opportunity
- If 10% adopt: $____ ARR opportunity
- Which segments are most underserved by current tools?
- Which segments have the highest willingness to pay?
- Which segments are growing fastest?
```

### Prompt A2 -- Competitor Feature & Pricing Matrix
**Save as**: `research/22-competitor-matrix.md`

```
Create an exhaustive feature-by-feature and pricing comparison of every membership/club management platform available in 2026. I need this to create comparison content and position my product.

For EACH of these 25 competitors, research:

TIER 1 (Direct competitors):
1. Wild Apricot  2. ClubExpress  3. MemberPlanet  4. Memberful  5. JoinIt  6. Raklet  7. GroupSpot  8. Heylo  9. Cheddar Up  10. SignUpGenius

TIER 2 (Sports-specific):
11. TeamSnap  12. SportsEngine  13. LeagueApps  14. Jersey Watch  15. TeamLinkt

TIER 3 (Adjacent/alternative):
16. Meetup Pro  17. Eventbrite  18. Band App  19. Mighty Networks  20. Circle.so  21. Hivebrite  22. MemberSpace  23. GlueUp  24. YourMembership  25. Neon One

For each competitor provide:
a) PRICING: Every plan tier, per-member costs, transaction fees, annual discounts, free tier limits
b) FEATURES: Check/no-check for these 50 features:
   - Member management (profiles, custom fields, bulk import, directory)
   - Event management (creation, registration, ticketing, waitlists, recurring, check-in)
   - Payment processing (dues, one-time, recurring, partial payments, refunds, Stripe/PayPal)
   - Communication (email, SMS, push notifications, newsletters, A/B testing)
   - Volunteer management (scheduling, hour tracking, sign-ups)
   - Multi-location support
   - Mobile app (native iOS, native Android, PWA)
   - Website builder
   - Online forms/surveys
   - Reporting & analytics
   - API access
   - Integrations (list specific ones)
   - Calendar sync
   - QR codes
   - Real-time chat
   - File sharing/storage
   - Custom branding/white label
   - SSO/SAML
   - Roles & permissions
   - Automation/workflows
c) REVIEWS: G2, Capterra, TrustRadius average rating, total reviews, most common complaints
d) MARKET POSITION: Estimated customer count, target audience, year founded
e) CONTENT STRATEGY: Blog post frequency, resource library, template offerings, SEO visible content

Then create a "switching matrix" -- for people currently on each competitor, what are the top 3 reasons they'd switch and what would they gain?
```

### Prompt A3 -- Reddit & Community Forum Deep Dive
**Save as**: `research/23-reddit-community-research.md`

```
Do an exhaustive search of Reddit, Quora, Facebook Groups, and online forums for discussions about club management, membership software, event planning for organizations, and volunteer coordination. I need REAL quotes, pain points, and software recommendations from actual organizers.

Search these subreddits and compile the most upvoted/discussed threads:
- r/youthsports, r/soccercoaching, r/baseball, r/swimming, r/lacrosse
- r/running, r/AdvancedRunning, r/trailrunning, r/triathlon
- r/nonprofit, r/nonprofitcritique
- r/HOA, r/fuckHOA (yes, the complaints here are gold for content)
- r/PTA
- r/VolunteerManagement
- r/EventPlanning
- r/smallbusiness (for association management)
- r/Pickleball, r/tennis
- r/bookclub
- r/scouting, r/BSA, r/girlscouts
- r/churchplanting, r/pastors

For each subreddit, find threads where people are:
1. Asking for software recommendations ("what do you use to manage your club?")
2. Complaining about current tools ("Wild Apricot is so expensive", "TeamSnap doesn't do X")
3. Describing operational pain points ("I spend 10 hours a week on admin tasks")
4. Asking how to solve specific problems ("how do you collect dues?", "how do you handle no-shows?")
5. Discussing club growth challenges
6. Sharing what worked for their organization

For each relevant thread, capture:
- Direct quotes (the exact language organizers use -- this is keyword gold)
- Upvote count (popularity signal)
- Software tools mentioned (positive and negative)
- The underlying problem they're trying to solve
- Content ideas this suggests (what blog post would answer their question?)

Also search Quora for:
- "How to manage a club" type questions
- "Best software for" questions related to clubs/organizations
- "How to" operational questions

Compile at least 100 real quotes from organizers, categorized by:
- Pain point category (communication, payments, scheduling, engagement, etc.)
- Organization type (sports, nonprofit, HOA, social club, etc.)
- Buying journey stage (problem-aware, solution-aware, decision-stage)
```

---

## PROMPT SET B: pSEO Scale Opportunities

### Prompt B1 -- Industry Vertical pSEO Expansion
**Save as**: `research/24-vertical-pseo-expansion.md`

```
I currently have 14 programmatic "club type" pages (book clubs, running clubs, youth sports, etc.) and 8 "feature/use case" pages on my membership management platform site. I want to 10x this with high-quality programmatic pages.

Research and give me detailed data for EACH of these additional verticals to create new pSEO pages:

GROUP A -- Sports Clubs (20 new pages):
1. Pickleball clubs/leagues  2. Tennis clubs  3. Soccer clubs  4. Baseball/softball leagues
5. Basketball leagues  6. Volleyball clubs  7. Martial arts dojos  8. CrossFit communities
9. Rowing/crew clubs  10. Skiing/snowboarding clubs  11. Surfing clubs  12. Rock climbing groups
13. Disc golf clubs  14. Bowling leagues  15. Equestrian clubs  16. Fencing clubs
17. Archery clubs  18. Sailing clubs  19. Triathlon clubs  20. Paddle sports clubs

GROUP B -- Professional & Educational (15 new pages):
1. Chambers of Commerce  2. Rotary clubs  3. Lions clubs  4. Kiwanis clubs
5. Toastmasters chapters  6. BNI networking groups  7. Women's business groups
8. Young professionals groups  9. Coding bootcamp alumni  10. Homeschool co-ops
11. Tutoring cooperatives  12. Language exchange groups  13. Writing groups
14. Investment clubs  15. Mastermind groups

GROUP C -- Community & Lifestyle (15 new pages):
1. Neighborhood associations  2. Community garden groups  3. Environmental/conservation groups
4. Animal rescue organizations  5. Food banks/pantries  6. Meal delivery volunteer groups
7. Senior citizen clubs  8. Veteran service organizations  9. Cultural heritage organizations
10. LGBTQ+ community groups  11. Disability advocacy groups  12. Mental health support groups
13. Parenting groups  14. Single parent groups  15. New resident welcome groups

GROUP D -- Hobby & Interest (15 new pages):
1. Board game groups  2. Dungeons & Dragons groups  3. Card game clubs (poker, bridge, MTG)
4. Model building clubs  5. Ham radio clubs  6. Astronomy clubs  7. Birdwatching clubs
8. Woodworking clubs  9. Quilting/sewing circles  10. Pottery/ceramics groups
11. Drone clubs  12. Robotics clubs  13. Film/movie clubs  14. Cooking clubs
15. Vintage car clubs

For EACH of the 65 verticals above, provide:
- Estimated number in the US
- Typical organization size
- Top 5 SEO keywords with estimated search volume
- 3 specific pain points unique to this type
- 5 must-have features for this type of organization
- 3 FAQ questions someone managing this type would ask
- Current software they typically use
- Content hook (what blog post would attract this audience?)
```

### Prompt B2 -- "How to Start a [X]" pSEO Template
**Save as**: `research/25-how-to-start-pseo.md`

```
Research everything needed to create a comprehensive "How to Start a [Type of Club/Organization]" guide series. These will be programmatic pages targeting "how to start a [X]" keywords.

For EACH of these 40 organization types, research:

1. How to start a youth soccer club
2. How to start a running club
3. How to start a book club
4. How to start a hiking group
5. How to start a pickleball league
6. How to start a nonprofit
7. How to start a volunteer organization
8. How to start a PTA/PTO
9. How to start an HOA
10. How to start a swim team
11. How to start a garden club
12. How to start a chess club
13. How to start a photography club
14. How to start a music group/band
15. How to start a cooking club
16. How to start a wine tasting club
17. How to start a board game group
18. How to start a coding club
19. How to start a Dungeons & Dragons group
20. How to start a fitness/CrossFit group
21. How to start a cycling club
22. How to start a martial arts club
23. How to start a dance club
24. How to start a church small group
25. How to start a men's/women's group
26. How to start a neighborhood watch
27. How to start a community service club
28. How to start a Toastmasters chapter
29. How to start a professional networking group
30. How to start a homeschool co-op
31. How to start an investment club
32. How to start a scouting troop
33. How to start a 4-H club
34. How to start a senior citizens club
35. How to start a veterans organization chapter
36. How to start a cultural heritage group
37. How to start a maker space
38. How to start a film club
39. How to start a birding group
40. How to start a triathlon club

For each, give me:
- Step-by-step formation process (5-10 steps)
- Legal requirements (incorporation, insurance, tax status)
- Estimated startup costs
- Minimum viable member count to launch
- Where to find your first members
- Common mistakes to avoid
- First 90 days timeline
- Technology tools needed
- Target keywords with search volume estimates
- 3 FAQ questions with answers

Also research:
- State-specific requirements for forming clubs/organizations
- Insurance providers that specialize in club/organization coverage
- National governing bodies for each type (e.g., RRCA for running, USTA for tennis)
```

### Prompt B3 -- Comparison & Alternative Pages at Scale
**Save as**: `research/26-comparison-pseo.md`

```
Research data for creating 50+ comparison and alternative pages at scale. These target high-intent commercial keywords.

PART 1: "[Competitor] vs GatherGrove" pages (25 pages)
For each competitor below, research what makes them different from a comprehensive all-in-one platform:
1. Wild Apricot vs GatherGrove
2. ClubExpress vs GatherGrove
3. TeamSnap vs GatherGrove
4. SportsEngine vs GatherGrove
5. LeagueApps vs GatherGrove
6. Memberful vs GatherGrove
7. MemberPlanet vs GatherGrove
8. SignUpGenius vs GatherGrove
9. JoinIt vs GatherGrove
10. GroupSpot vs GatherGrove
11. Heylo vs GatherGrove
12. Cheddar Up vs GatherGrove
13. Raklet vs GatherGrove
14. Meetup Pro vs GatherGrove
15. Band App vs GatherGrove
16. Mighty Networks vs GatherGrove
17. Circle.so vs GatherGrove
18. Eventbrite vs GatherGrove
19. Hivebrite vs GatherGrove
20. MemberSpace vs GatherGrove
21. Neon One vs GatherGrove
22. GlueUp vs GatherGrove
23. Jersey Watch vs GatherGrove
24. TeamLinkt vs GatherGrove
25. YourMembership vs GatherGrove

For each, provide:
- Feature comparison table (15+ features)
- Pricing comparison (all tiers)
- Ideal customer profile for each
- 3 reasons to choose GatherGrove instead
- 3 reasons someone might still choose the competitor
- Migration path from competitor to GatherGrove
- Real user complaints about the competitor (from G2, Capterra, Reddit)

PART 2: "[Competitor] alternatives" pages (15 pages)
For these high-search-volume alternatives pages:
1. Wild Apricot alternatives
2. TeamSnap alternatives
3. SportsEngine alternatives
4. SignUpGenius alternatives
5. Eventbrite alternatives for clubs
6. ClubExpress alternatives
7. MemberPlanet alternatives
8. Band App alternatives
9. GroupMe alternatives for clubs
10. Meetup alternatives
11. LeagueApps alternatives
12. Cheddar Up alternatives
13. Mighty Networks alternatives
14. Facebook Groups alternatives
15. Google Sheets alternatives for clubs

For each, provide:
- Why people search for alternatives (top 5 complaints from reviews)
- 8-10 alternatives to include in the listicle
- Quick comparison table
- "Best for" recommendation for each alternative
- Target keywords and estimated volume

PART 3: "X vs Y" head-to-head pages (15 pages, NO GatherGrove)
These attract comparison shoppers:
1. Wild Apricot vs TeamSnap
2. Wild Apricot vs ClubExpress
3. TeamSnap vs SportsEngine
4. SignUpGenius vs Eventbrite
5. Memberful vs MemberSpace
6. Band App vs GroupMe
7. Mighty Networks vs Circle
8. Meetup vs Eventbrite
9. Google Sheets vs Club Management Software
10. Venmo vs Stripe for Club Payments
11. Mailchimp vs Club-Specific Email
12. Facebook Groups vs Dedicated Club Platform
13. WordPress vs Dedicated Club Platform
14. Free vs Paid Club Management Software
15. All-in-One vs Best-of-Breed for Clubs
```

---

## PROMPT SET C: Content Depth & Authority

### Prompt C1 -- Expert Interview Questions & Thought Leadership
**Save as**: `research/27-thought-leadership.md`

```
Research thought leadership content opportunities in the community management space. I want to position GatherGrove as the authoritative voice.

1. TRENDING DEBATES in community management (2025-2026):
   - Should clubs charge membership fees or be free?
   - DIY tools (spreadsheets) vs dedicated software -- when to switch?
   - The "professionalization" of volunteer organizations
   - Social media groups replacing traditional club structures
   - Youth sports burnout and over-scheduling
   - DEI in community organizations -- progress and challenges
   - AI's role in volunteer coordination
   - The death of in-person events vs the comeback of community
   - Remote/virtual membership vs in-person only
   - Subscription fatigue affecting club dues collection

2. ORIGINAL RESEARCH that would generate PR and backlinks:
   Design survey questions for these studies:
   a) "State of Community Organizations 2026" -- annual benchmark
   b) "The Hidden Cost of Managing Clubs with Spreadsheets"
   c) "Why Members Leave: A Data Study on Club Churn"
   d) "Youth Sports Parent Satisfaction Survey"
   e) "Volunteer Burnout Report: The 80/20 Problem in Organizations"
   f) "How Community Organizations Adopted AI in 2026"
   g) "The Club Technology Gap: What Organizers Want vs What They Have"

   For each study concept, provide:
   - 20 survey questions
   - Target sample size
   - Distribution channels (where to find respondents)
   - Key metrics to report
   - Potential press angles
   - Infographic/data visualization concepts

3. EXPERT ROUNDUP content ideas:
   Who should we interview, and what questions should we ask?
   - Club presidents who scaled from 20 to 500+ members
   - Youth sports administrators managing 1000+ families
   - Nonprofit executive directors on volunteer technology
   - HOA managers overseeing 1000+ unit communities
   - Running club directors who host races with 5000+ participants

4. PODCAST/VIDEO CONTENT research:
   - Top 20 topics community organizers would tune in for
   - Formats that work (interview, tutorial, case study, debate)
   - Guest opportunities (who has a following in this space?)
```

### Prompt C2 -- Legal, Compliance & Insurance Content
**Save as**: `research/28-legal-compliance.md`

```
Research legal, compliance, and insurance topics for community organizations. This is HIGH-INTENT content with LOW competition -- people searching for this are serious organizers ready to invest in tools.

1. LEGAL STRUCTURE content (50 state variations):
   - 501(c)(3) vs 501(c)(4) vs 501(c)(7) -- complete guide with examples
   - State-by-state nonprofit registration requirements
   - When does a club need to incorporate?
   - Tax obligations for membership dues (when are they taxable?)
   - Unrelated business income tax (UBIT) for organizations
   - Filing requirements for small organizations (<$50K revenue)
   - When does a club need an EIN?
   - State-specific fundraising registration (which states require it?)

2. INSURANCE content:
   - General liability insurance for clubs (what it covers, costs)
   - Directors & Officers (D&O) insurance for board members
   - Event insurance requirements (per-event policies)
   - Youth sports-specific insurance (concussion protocols, mandated reporter)
   - Volunteer accident insurance
   - Property insurance for club facilities
   - Cyber liability insurance for organizations storing member data
   - Average costs by organization type and size

3. COMPLIANCE content:
   - COPPA compliance for youth organizations (under-13 data)
   - ADA compliance for club events and communications
   - Background check requirements for volunteers working with minors (by state)
   - Data privacy obligations (CCPA, state privacy laws) for member databases
   - PCI compliance for clubs collecting payments
   - Anti-discrimination requirements for membership organizations
   - Record retention requirements for nonprofits

4. GOVERNANCE content:
   - Robert's Rules of Order -- practical guide for small clubs
   - How to write club bylaws (comprehensive template + guide)
   - Board meeting requirements by state
   - Quorum rules for different organization types
   - How to handle elections and voting properly
   - Conflict of interest policies for nonprofit boards
   - Financial controls and audit requirements

For each topic:
- Estimated search volume for related keywords
- Current top-ranking content quality (thin or comprehensive?)
- State-by-state variations that create pSEO opportunities
- Content format recommendation (guide, checklist, template, tool)
```

### Prompt C3 -- Fundraising & Revenue Content for Organizations
**Save as**: `research/29-fundraising-revenue.md`

```
Research fundraising, revenue generation, and financial management content for community organizations. Money topics = high intent + high engagement.

1. FUNDRAISING GUIDES by type:
   - Online fundraising for small clubs (under $10K goal)
   - Silent auction planning guide
   - Golf tournament fundraising guide
   - Fun run / 5K fundraiser planning
   - Restaurant fundraiser nights (partnership guide)
   - Car wash fundraiser planning
   - Bake sale and food sale fundraisers
   - Raffle and lottery fundraiser rules (state-by-state legality)
   - Crowdfunding for organizations (GoFundMe, GiveSendGo, etc.)
   - Sponsorship packages for local businesses
   - Grant writing for small organizations
   - Matching gift programs
   - Peer-to-peer fundraising campaigns
   - Year-end giving campaigns
   - Giving Tuesday strategy for small orgs
   - Corporate donation solicitation
   - Memorial and tribute giving programs

   For each: search volume, competition level, content gaps, legal considerations

2. DUES & PRICING strategy content:
   - How to set membership dues (pricing psychology)
   - Free vs paid membership models
   - Sliding scale / income-based dues
   - Family vs individual membership pricing
   - Early bird discounts and renewal incentives
   - How to raise dues without losing members
   - Payment plan options for members
   - What to do about members who won't pay

3. FINANCIAL MANAGEMENT content:
   - Club treasurer's complete guide
   - How to create a club budget (with template)
   - Financial reporting for nonprofit boards
   - Tax preparation for 501(c)(3) organizations
   - When does your club need a CPA?
   - Banking for nonprofit organizations
   - Financial controls to prevent embezzlement
   - Handling cash at events
   - IRS Form 990 guide for small organizations

4. SPONSORSHIP & PARTNERSHIP content:
   - How to create a sponsorship package
   - Local business partnership template
   - Corporate sponsorship levels guide
   - Sponsorship activation ideas for clubs
   - How to keep sponsors year after year
   - Tax implications of sponsorship income

For each topic area, give me:
- Keyword clusters with estimated volumes
- Content format that performs best
- Link-building potential
- Lead generation angle (how does this connect to needing GatherGrove?)
```

---

## PROMPT SET D: AI-Era SEO & Distribution

### Prompt D1 -- AI Search Optimization Deep Dive
**Save as**: `research/30-ai-seo-deep-dive.md`

```
Do deep research on how to optimize content for AI-powered search engines specifically for the membership/club management niche.

1. AI SEARCH LANDSCAPE (2026):
   - What % of searches now use AI Overviews/AI answers?
   - How has AI search impacted SaaS "best software for" queries?
   - What types of content get cited most by each AI engine?
     - ChatGPT/SearchGPT citation patterns
     - Perplexity source selection criteria
     - Google AI Overviews source criteria
     - Gemini citation behavior
     - Claude citation behavior
     - Microsoft Copilot citation behavior
   - How does structured data affect AI citations?
   - How do llms.txt and llms-full.txt files affect crawling?

2. QUESTION-ANSWER OPTIMIZATION:
   For EACH of these persona queries, tell me what AI engines currently answer and what sources they cite:

   a) "What's the best software for managing a youth sports club?"
   b) "How do I collect membership dues online?"
   c) "What software do running clubs use?"
   d) "How do I manage volunteers for my nonprofit?"
   e) "What's the best alternative to Wild Apricot?"
   f) "How do I start a club?"
   g) "What's the cheapest membership management software?"
   h) "Do I need software for my small club?"
   i) "How do I get parents to volunteer for youth sports?"
   j) "What's the best way to communicate with club members?"

   For each: what is the AI answer, what sources are cited, what content structure would we need to get cited?

3. ENTITY AUTHORITY building:
   - How to build GatherGrove's entity presence in knowledge graphs
   - Wikipedia strategy (is there a path?)
   - Wikidata entry creation
   - Crunchbase, G2, Capterra profile optimization
   - Brand mention strategies
   - Digital PR for AI visibility
   - How to appear in "recommended by" AI answers

4. CONTENT STRUCTURE for AI extraction:
   - Optimal heading structure for LLM parsing
   - How to format comparison tables for AI extraction
   - FAQ schema and its impact on AI answers
   - The role of "definitive" vs "listicle" content for AI citations
   - Word count optimization for AI citation (is there a sweet spot?)
   - How freshness signals affect AI citation
```

### Prompt D2 -- Content Distribution & Amplification
**Save as**: `research/31-content-distribution.md`

```
Research content distribution and amplification strategies for a B2B SaaS targeting community organizers.

1. ORGANIC DISTRIBUTION channels:
   - Reddit strategy: Which subreddits accept helpful content? What's the self-promotion policy for each? How to build karma and trust first?
   - Quora: Top questions to answer in our space (with monthly views)
   - Facebook Groups: Which groups have the most active organizers? Can we post content?
   - LinkedIn: Is there a community organizer audience on LinkedIn? What content performs?
   - Pinterest: Do "club management" pins drive traffic? Template pins?
   - YouTube: What club management content gets views? Tutorial opportunities?
   - TikTok/Reels: Are there community organizer creators? What format works?
   - X/Twitter: Who are the influencers in community management?
   - Medium / Substack: Is there an audience for club management content?

2. PARTNERSHIP distribution:
   - National organizations that could link to our content:
     - National PTA
     - RRCA (Road Runners Club of America)
     - Positive Coaching Alliance
     - National Recreation and Park Association
     - VolunteerMatch
     - Points of Light
     - HandsOn Network
     - United Way chapters
     - YMCA/YWCA
     - Boys & Girls Clubs
   - State-level organization directories
   - Sport-specific governing bodies
   - How to get listed in their resource pages

3. EMAIL list building:
   - What lead magnets work best for community organizers?
   - Webinar topics that would attract signups
   - Newsletter content ideas (what would organizers subscribe to?)
   - Email course concepts ("7-day club launch bootcamp")

4. CONTENT REPURPOSING strategy:
   - Blog post -> social media posts pipeline
   - Guide -> video script conversion
   - Statistics -> infographic -> social shares
   - Template -> landing page -> email sequence
   - Long-form -> short-form content extraction

5. INFLUENCER/CREATOR partnerships:
   - Who creates content for community organizers?
   - What platforms are they on?
   - What collaboration models work in B2B SaaS?
   - Micro-influencer opportunities in niche communities
```

---

## PROMPT SET E: Seasonal & Timely Content

### Prompt E1 -- Monthly Content Opportunities with Keyword Data
**Save as**: `research/32-monthly-content-keywords.md`

```
Research month-by-month content opportunities for a membership management platform, with specific keyword data and Google Trends seasonality.

For EACH month (January through December), provide:

1. SEASONAL EVENTS driving searches:
   - What sports seasons start/end?
   - What organizational milestones happen?
   - What national awareness days/weeks/months are relevant?
   - What fundraising seasons peak?
   - What administrative tasks are due?

2. KEYWORD SEASONALITY (Google Trends data):
   For each keyword below, when does it peak and what's the volume range?
   - "youth sports registration"
   - "volunteer sign up"
   - "club management software"
   - "membership management"
   - "event planning checklist"
   - "how to start a club"
   - "collect dues online"
   - "fundraising ideas"
   - "club newsletter template"
   - "volunteer appreciation"
   - "membership renewal"
   - "annual meeting agenda"
   - "board elections"
   - "end of year report nonprofit"

3. CONTENT CALENDAR -- for each month give me:
   - 5 blog posts with target keyword and estimated volume
   - 2 social media campaigns with hooks
   - 1 template/resource to publish
   - 1 email to our list
   - Key CTA for that month

4. PUBLICATION TIMING:
   - When should seasonal content be published to rank before the peak?
   - How far in advance should "registration season" content go live?
   - When should "year-end" and "new year planning" content publish?
   - Optimal posting schedule (day of week, time) for community organizers
```

---

## PROMPT SET F: pSEO Technical Execution

### Prompt F1 -- Location-Based pSEO at Scale
**Save as**: `research/33-location-pseo.md`

```
Research the viability and execution strategy for location-based programmatic SEO pages for a club management platform.

1. SEARCH VOLUME RESEARCH:
   For each of these patterns, estimate search volume and competition:
   - "running clubs in [city]" -- top 100 US cities
   - "youth sports leagues in [city]" -- top 100 US cities
   - "volunteer opportunities in [city]" -- top 100 US cities
   - "book clubs in [city]" -- top 50 US cities
   - "hiking groups in [city]" -- top 50 US cities
   - "pickleball clubs in [city]" -- top 50 US cities
   - "[club type] near me" searches -- all types

2. COMPETITIVE ANALYSIS:
   - Who currently ranks for location-based club searches? (Meetup, Yelp, Facebook, local directories?)
   - What's the content quality of top-ranking pages?
   - Are there SERP features (local pack, maps) that block organic results?
   - What does it take to rank for "[activity] in [city]" as a SaaS site (not a local business)?

3. PAGE VALUE STRATEGY:
   How to make location pages valuable (not thin content):
   - Local organization data/statistics to include
   - City-specific tips for each activity
   - Local venue/resource information
   - Weather/seasonal considerations by city
   - Local regulation differences
   - Community events calendar integration
   - User-generated content strategy

4. SCALE EXECUTION:
   - Priority cities to launch first (volume vs competition matrix)
   - How many pages at launch vs phased rollout
   - Content generation workflow (AI-assisted with human review)
   - Internal linking strategy between location pages
   - Schema markup for location pages (LocalBusiness? Event? Organization?)
   - How to avoid Google thin content / doorway page penalties
   - Monitoring strategy for 1000+ programmatic pages

5. URL STRUCTURE options:
   - /clubs-in/[city] vs /[city]/clubs vs /find/[club-type]/[city]
   - SEO impact of each structure
   - Recommendation with rationale
```

### Prompt F2 -- Glossary & Knowledge Base pSEO
**Save as**: `research/34-glossary-pseo.md`

```
Research a comprehensive glossary/knowledge base for community organizations. Each term becomes a programmatic page targeting informational keywords.

Compile 200+ terms across these categories, with search volume estimates:

1. CLUB GOVERNANCE TERMS (30+ terms):
   Bylaws, articles of incorporation, quorum, proxy voting, Robert's Rules, motion, second, amendment, standing rules, special meeting, annual meeting, executive session, board of directors, officer roles (president, VP, secretary, treasurer), committee types, term limits, impeachment/removal, elections, nominations, conflict of interest, fiduciary duty, duty of care, duty of loyalty, ex officio, parliamentarian, minutes, agenda...

2. NONPROFIT/TAX TERMS (30+ terms):
   501(c)(3), 501(c)(4), 501(c)(7), 501(c)(6), tax-exempt status, EIN, Form 990, Form 990-EZ, Form 990-N, UBIT, public charity, private foundation, fiscal sponsor, donor-advised fund, grant, in-kind donation, restricted funds, unrestricted funds, endowment, capital campaign, annual fund, pledge, matching gift, planned giving, charitable remainder trust...

3. EVENT MANAGEMENT TERMS (25+ terms):
   RSVP, registration, waitlist, check-in, name badge, breakout session, plenary, keynote, workshop, hybrid event, virtual event, event ROI, attendance rate, no-show rate, event insurance, rain date, event liability, venue contract, catering minimum, event budget, registration fee, early bird pricing, capacity management, event waiver...

4. VOLUNTEER MANAGEMENT TERMS (25+ terms):
   Volunteer coordinator, volunteer management, background check, volunteer screening, volunteer hours, service learning, court-ordered community service, volunteer retention, volunteer burnout, volunteer recognition, volunteer training, onboarding, volunteer liability, volunteer insurance, mandated reporter, Good Samaritan law, pro bono, in-kind, skill-based volunteering, micro-volunteering, episodic volunteering, virtual volunteering...

5. MEMBERSHIP TERMS (25+ terms):
   Membership dues, membership tiers, lifetime membership, honorary membership, membership drive, member retention, member churn, lapsed member, membership renewal, auto-renewal, grace period, member directory, member portal, membership card, member benefits, membership application, membership committee, new member orientation, member engagement, active member, inactive member...

6. FINANCIAL TERMS (25+ terms):
   Treasurer's report, balance sheet, income statement, cash flow, operating budget, reserve fund, special assessment, dues schedule, payment processing, merchant account, transaction fee, financial audit, financial controls, segregation of duties, petty cash, reimbursement, purchase order, chart of accounts, fiscal year, bank reconciliation...

7. COMMUNICATION TERMS (20+ terms):
   Newsletter, email blast, email open rate, click-through rate, bounce rate, unsubscribe rate, SMS marketing, push notification, announcement, mass communication, member survey, communication cadence, email segmentation, A/B testing, communication policy, social media policy, brand guidelines, crisis communication...

8. TECHNOLOGY TERMS (20+ terms):
   Membership management software, CRM, API, SSO, data migration, cloud hosting, mobile app, PWA, data export, integration, webhook, automation, workflow, dashboard, analytics, reporting, custom fields, user roles, permissions, white label, SaaS...

For each term provide:
- Clear definition (2-3 sentences)
- Context for club/organization usage
- Related terms (for interlinking)
- "People Also Ask" questions related to this term
- Estimated monthly search volume
- Current Featured Snippet holder (if any)
```

---

## PROMPT SET G: Conversion & Bottom-of-Funnel Content

### Prompt G1 -- Migration & Switching Trigger Content
**Save as**: `research/35-migration-triggers.md`

```
Research the decision journey and switching triggers for organizations evaluating club/membership management software.

1. SWITCHING TRIGGERS -- What events cause an organization to finally search for software?
   - New board member who used software at their previous org
   - Failed fundraising event due to disorganization
   - Losing member data when a volunteer leaves
   - Audit finding about financial controls
   - Embarrassing mass email mistake (reply-all, wrong recipients)
   - Tax filing problems due to poor record-keeping
   - Insurance requirement for better record-keeping
   - Growth beyond what spreadsheets can handle (what's the member count threshold?)
   - Payment collection problems (bounced checks, lost cash, Venmo confusion)
   - Competitor organization has better member experience

   For each trigger:
   - How common is this? (frequency data)
   - What do they search for when this happens?
   - What content would capture them at this moment?
   - What's the urgency level (immediate vs. "next quarter")?

2. BUYING COMMITTEE research:
   - Who makes the software purchasing decision in different org types?
     - Small club (< 50 members): Usually president or founder alone
     - Medium org (50-500 members): Board vote? Committee?
     - Large org (500+ members): Formal RFP process?
   - What objections does each stakeholder have?
     - President: "Will members actually use it?"
     - Treasurer: "Can we afford it?"
     - Secretary: "Will it make my job easier?"
     - General members: "Not another app"
     - Tech-reluctant board members: "It's too complicated"
   - Content that addresses each stakeholder's concerns

3. MIGRATION CONTENT:
   For each major competitor, what does migration look like?
   - Wild Apricot -> GatherGrove: Data export options, what transfers, what doesn't
   - TeamSnap -> GatherGrove: Roster migration, payment history
   - Spreadsheets -> GatherGrove: CSV import process, data cleanup
   - Facebook Groups -> GatherGrove: Why and how to transition
   - GroupMe/WhatsApp -> GatherGrove: Communication migration
   - Paper/manual -> GatherGrove: First-time digitization guide

4. ROI CALCULATOR research:
   What data points do we need for an interactive ROI calculator?
   - Hours spent per week on manual admin (average by org size)
   - Dollar value of admin time
   - Revenue lost to uncollected dues (%)
   - Member churn cost (acquisition cost of replacing a lost member)
   - Event revenue increase from better registration tools
   - Volunteer time saved with automated scheduling
```

### Prompt G2 -- Objection-Busting Content
**Save as**: `research/36-objection-content.md`

```
Research the specific objections community organizers have about adopting membership management software, and what content would overcome each objection.

For EACH of these 15 common objections, research:

1. "We can just use Google Sheets and Venmo"
2. "Our club is too small to need software"
3. "We can't afford it / our budget is too tight"
4. "Our board won't approve the expense"
5. "It's too complicated to learn / our volunteers aren't tech-savvy"
6. "We've always done it this way"
7. "We already use [specific competitor] and switching is too hard"
8. "We don't have time to set up new software"
9. "Our members won't use another app"
10. "Free tools are good enough"
11. "We only need [one feature], not a whole platform"
12. "We tried software before and it didn't work"
13. "We'll just use Facebook Groups"
14. "Our organization is too unique for generic software"
15. "We're worried about data security / member privacy"

For each objection, provide:
- How common is this objection? (estimate % of prospects who raise it)
- The real fear/concern behind the objection
- Data that counters this objection
- A content piece that would address it:
  - Blog post title
  - Key talking points
  - Case study angle
  - Calculator/tool idea
- How competitors address this objection on their sites
- What content format works best for this objection (comparison, ROI calculator, testimonial, tutorial video)?
```

---

## Execution Priority

### Phase 1 -- Foundation (Week 1-2)
Run: A1, A2, A3 (market intelligence)
**Output**: Complete competitive picture, keyword universe, real organizer language

### Phase 2 -- pSEO Scale (Week 2-4)
Run: B1, B2, B3 (programmatic page data)
**Output**: Data for 65 new vertical pages, 40 "how to start" pages, 55+ comparison pages

### Phase 3 -- Authority Content (Week 4-6)
Run: C1, C2, C3 (thought leadership, legal, fundraising)
**Output**: High-intent content briefs, survey designs, legal/compliance pSEO data

### Phase 4 -- AI & Distribution (Week 6-8)
Run: D1, D2 (AI search, distribution)
**Output**: AI citation strategy, channel-by-channel distribution plan

### Phase 5 -- Calendar & Location (Week 8-10)
Run: E1, F1, F2 (seasonal, location pages, glossary)
**Output**: 12-month calendar, location page strategy, 200+ glossary terms

### Phase 6 -- Conversion (Week 10-12)
Run: G1, G2 (migration triggers, objection content)
**Output**: Bottom-of-funnel content that converts

---

## Total New Page Count (from these prompts)

| Content Type | Count | Source Prompt |
|-------------|-------|---------------|
| New club type/vertical pages | 65 | B1 |
| "How to start" guide pages | 40 | B2 |
| Competitor comparison pages | 25 | B3 Part 1 |
| "[X] alternatives" listicles | 15 | B3 Part 2 |
| "X vs Y" head-to-head pages | 15 | B3 Part 3 |
| Legal/compliance state pages | 50+ | C2 |
| Fundraising guide pages | 20+ | C3 |
| Glossary/knowledge base pages | 200+ | F2 |
| Location-based pages | 500-1000+ | F1 |
| Seasonal content pieces | 60/year | E1 |
| Objection-busting content | 15+ | G2 |
| **Total from these prompts** | **1,000-1,500+** | |

Combined with existing SEO-CONTENT-PLAN.md (500+ pages): **~2,000+ total indexable pages in Year 1**

---

## pSEO Page Types Summary (Proven Templates)

Based on Zapier (50K+ pages, 16.2M visitors), HubSpot (10M+ visits/mo), Canva (2.2M+ template pages), Storylane (25K to 150K in 3 months):

| Template | URL Pattern | Example | Est. Count |
|----------|------------|---------|------------|
| Club type pages | `/for/[slug]` | `/for/pickleball-clubs` | 80 |
| Feature x audience | `/features/[feature]/[audience]` | `/features/payments/youth-sports` | 80 |
| "How to start" guides | `/guides/how-to-start-[type]` | `/guides/how-to-start-a-running-club` | 40 |
| Competitor comparison | `/compare/[competitor]` | `/compare/wild-apricot` | 25 |
| Alternatives pages | `/alternatives/[competitor]` | `/alternatives/teamsnap` | 15 |
| Head-to-head | `/compare/[x]-vs-[y]` | `/compare/teamsnap-vs-sportsengine` | 15 |
| Integration pages | `/integrations/[tool]` | `/integrations/stripe` | 30 |
| Glossary | `/glossary/[term]` | `/glossary/501c3-vs-501c7` | 200+ |
| Location pages | `/community/[city]/[type]` | `/community/austin/running-clubs` | 500+ |
| State guides | `/guides/start-[type]-in-[state]` | `/guides/start-nonprofit-in-texas` | 500+ |
| "Best for" listicles | `/best/[category]-for-[niche]` | `/best/software-for-small-clubs` | 20 |
