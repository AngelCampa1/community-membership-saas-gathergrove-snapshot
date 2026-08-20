import { ArrowLeft, Heart, Users, Globe, Handshake, Calendar, TrendingUp, CheckCircle, FileText, Lightbulb } from"lucide-react";
import Link from"next/link";
import { Header } from"@/components/shared/Header";
import { Footer } from"@/components/shared/Footer";
import { KeyTakeaways } from"@/components/seo/KeyTakeaways";
import { ArticleHeader } from"@/components/seo/ArticleHeader";
import { ResourceArticleJsonLd } from"@/components/seo/ResourceArticleJsonLd";
import { QuickAnswer } from"@/components/seo/QuickAnswer";
import { DefinitionBox } from"@/components/seo/DefinitionBox";
import { getResourceBySlug } from"@/lib/data/resources";
import { ResourceArticleFooter } from"@/components/seo/ResourceArticleFooter";

export default function FundraisingIdeasPage() {
  const resource = getResourceBySlug('fundraising-ideas-for-clubs-and-nonprofits')!;
  return (
    <div className="min-h-screen">
      <ResourceArticleJsonLd resource={resource} />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/resources"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>
        </div>

        <ArticleHeader
          category="Financial Management"
          dateModified={resource.dateModified}
          title="25 Fundraising Ideas for Clubs and Nonprofits"
          description="A practical guide to raising money for your club or nonprofit - from low-effort, low-cost classics to digital campaigns that reach supporters anywhere."
          readTime={resource.readTime}
        />

        <KeyTakeaways takeaways={["The best fundraiser for your group matches your member capacity, not just your revenue goal","Recurring small fundraisers build community and compound over time - one-off galas are higher risk","Digital fundraising removes geographic limits and lets supporters give on their own schedule","Combining two types of fundraisers (for example, an event paired with an online campaign) consistently outperforms either approach alone",
        ]} />

        <QuickAnswer
          question="What are the best fundraising ideas for clubs and nonprofits?"
          answer="The best fundraising ideas for clubs and nonprofits depend on your member count and volunteer capacity. Low-effort options include online donation pages, merchandise sales, and dues-based revenue tiers. Mid-effort events include trivia nights, silent auctions, and community dinners. High-effort but high-return options include charity runs, galas, and corporate sponsorship programs. Most successful clubs run 2-3 smaller fundraisers per year rather than relying on one large event."
        />

        <DefinitionBox
          term="Club Fundraising"
          definition="The process of raising money from members, supporters, and the broader community to fund an organization's activities, equipment, events, or operating costs. Fundraising can be event-based, donation-based, product-based, or built into membership structures. For clubs and nonprofits, effective fundraising depends on matching the method to the organization's size, audience, and volunteer capacity."
        />

        {/* Quick Navigation */}
        <div className="bg-muted/50 rounded-lg p-6 mb-12">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Navigation
          </h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <a href="#classic" className="text-primary hover:text-primary/80 transition-colors">
              • Classic In-Person Fundraisers
            </a>
            <a href="#digital" className="text-primary hover:text-primary/80 transition-colors">
              • Digital and Online Fundraisers
            </a>
            <a href="#events" className="text-primary hover:text-primary/80 transition-colors">
              • Event-Based Fundraisers
            </a>
            <a href="#partnerships" className="text-primary hover:text-primary/80 transition-colors">
              • Community Partnership Fundraisers
            </a>
            <a href="#membership" className="text-primary hover:text-primary/80 transition-colors">
              • Membership-Driven Revenue
            </a>
            <a href="#choosing" className="text-primary hover:text-primary/80 transition-colors">
              • How to Choose the Right Fundraiser
            </a>
          </div>
        </div>

        <article className="prose prose-lg  max-w-none">

          {/* Classic In-Person Fundraisers */}
          <section id="classic" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary" />
              Classic In-Person Fundraisers
            </h2>

            <p className="text-lg mb-6">
              In-person fundraisers build community at the same time they raise money. They require volunteer time and coordination,
              but they create the kind of shared experience that keeps members engaged beyond the fundraising goal itself.
            </p>

            <div className="space-y-6">

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  1. Bake Sale or Food Sale
                </h3>
                <p className="mb-3">
                  A bake sale is one of the most accessible fundraisers a club can run. Members donate homemade or store-bought goods,
                  and the club sells them at a table during an event, farmers market, or public gathering. Startup costs are near zero,
                  setup takes an hour, and cleanup is minimal.
                </p>
                <p className="mb-3">
                  The key to a successful bake sale is volume - a table with 10 items will underperform one with 50. Recruit broadly
                  so the contribution burden is spread across many members rather than falling on a few. Price items at $2-$5 for
                  individual portions and $10-$15 for larger items.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Small clubs with active members, school-affiliated groups, and clubs that hold regular public events
                  where a sales table can be set up easily.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  2. Car Wash
                </h3>
                <p className="mb-3">
                  A car wash fundraiser works well for clubs with younger members or volunteer-heavy cultures. The formula is simple:
                  secure a location with water access (a church parking lot, school lot, or commercial space that will donate the space),
                  print signs, and show up with buckets and sponges. Charge $10-$20 per car.
                </p>
                <p className="mb-3">
                  The main challenge is weather and volunteer attendance. Run the event on a weekend morning when roads are busy,
                  have a rain date ready, and confirm volunteers the day before. A well-staffed car wash with 10-15 volunteers can
                  handle 40-60 cars in a 4-hour window.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Sports teams, youth groups, and community clubs in suburban areas with good foot traffic.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  3. Rummage Sale or Swap Meet
                </h3>
                <p className="mb-3">
                  Members donate unwanted items, and the club sells them at a community sale. The primary cost is securing a space
                  and advertising the event. Revenue depends entirely on item quality and foot traffic, so location matters.
                  Hold the sale near a busy road, a community center, or alongside another popular event.
                </p>
                <p className="mb-3">
                  Collect donations over 2-4 weeks before the sale date to build inventory. Sort items by category (books, clothing,
                  tools, kitchenware) and price clearly. Many clubs offer a"fill a bag" deal for $5-$10 in the final hour to clear
                  remaining inventory rather than hauling it away.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Established clubs with large memberships who can generate substantial donation volume.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  4. Plant Sale
                </h3>
                <p className="mb-3">
                  Members with gardens donate seedlings, cuttings, houseplants, or potted herbs. The club sells them at a spring or fall sale.
                  Plant sales have strong appeal with community gardening clubs, master gardener associations, and neighborhood groups.
                  Startup cost is effectively zero if members supply the plants.
                </p>
                <p className="mb-3">
                  Hold the sale on a weekend morning when families are out running errands. Label each plant with its name and care
                  instructions - buyers appreciate guidance, and labeled plants sell faster than unlabeled ones. Price common plants
                  at $3-$8 and rare or well-established specimens higher.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Garden clubs, horticultural societies, neighborhood associations, and school groups in spring and fall.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  5. Silent Auction
                </h3>
                <p className="mb-3">
                  A silent auction pairs donated items with bid sheets. Attendees write their name and bid amount on the sheet;
                  the highest bidder at closing time wins the item. Auction items can include donated goods, services, experiences,
                  or gift certificates. Items with perceived value above $50 typically drive the most bidding activity.
                </p>
                <p className="mb-3">
                  The most effective silent auctions run alongside another event - a dinner, a gala, or an annual meeting - so
                  attendees are already present and engaged. Set a reasonable minimum bid based on the item's retail value and allow
                  incremental bids of at least $5-$10 per entry.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Organizations with existing annual events or galas, and clubs that can solicit item donations from local businesses.
                </div>
              </div>

            </div>
          </section>

          {/* Digital and Online Fundraisers */}
          <section id="digital" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary" />
              Digital and Online Fundraisers
            </h2>

            <p className="text-lg mb-6">
              Online fundraising removes geographic limits. A supporter who lives three states away can contribute to your cause
              just as easily as a neighbor. Digital campaigns also run around the clock - contributions can come in at any hour,
              without requiring a volunteer to be present.
            </p>

            <div className="space-y-6">

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  6. Online Donation Page
                </h3>
                <p className="mb-3">
                  A dedicated donation page on your website or on a platform like GoFundMe, Donorbox, or PayPal Giving Fund gives
                  supporters a direct way to give. The page should explain what the funds support, include a specific goal with a
                  progress bar, and offer suggested donation amounts ($25, $50, $100,"other").
                </p>
                <p className="mb-3">
                  The page alone will not generate donations - it needs traffic. Share the link in your member newsletter,
                  on your social media profiles, and in direct communications during giving seasons (end-of-year, Giving Tuesday,
                  your club's anniversary). Update the progress bar regularly so donors can see momentum.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Organizations of any size. An online donation page is a baseline that every club should have active year-round.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  7. Crowdfunding Campaign
                </h3>
                <p className="mb-3">
                  A crowdfunding campaign is a time-limited fundraising push with a specific goal -"raise $3,000 for a new telescope
                  by March 31." Campaigns work best when they have a concrete, tangible outcome that supporters can visualize.
                  Abstract campaigns ("support our general operations") consistently underperform specific ones.
                </p>
                <p className="mb-3">
                  Set a realistic goal and a deadline no longer than 30-45 days. Campaigns that gain early traction in the
                  first 48 hours often convert better than those that start slowly - so mobilize your most engaged members
                  to give on day one and ask them to share with their networks immediately.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Specific equipment purchases, facility improvements, or events with a clear price tag and visual appeal.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  8. Peer-to-Peer Fundraising
                </h3>
                <p className="mb-3">
                  In a peer-to-peer campaign, each participant creates a personal fundraising page and asks their own network of
                  friends and family to donate on their behalf. The organization's total is the sum of all individual pages.
                  This model extends reach meaningfully - each participant brings in donors who may never have heard of your club.
                </p>
                <p className="mb-3">
                  Peer-to-peer works best when paired with an activity that gives participants something to share: a walk-a-thon,
                  a read-a-thon, a challenge event. Participants who are raising money for a personal effort (miles walked, books read)
                  ask more confidently than those raising money for a general cause.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Clubs with active, connected members who are comfortable asking their personal networks for support.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  9. Online Merchandise Store
                </h3>
                <p className="mb-3">
                  Print-on-demand services (Printful, Printify, Bonfire) allow clubs to sell branded merchandise - t-shirts,
                  hats, mugs, tote bags - without holding inventory. You design the items, set a markup, and the service handles
                  printing and shipping. Your club receives the markup as revenue.
                </p>
                <p className="mb-3">
                  Merchandise fundraising works best when it feels like something members actually want to own, not just charity
                  items. Designs that reference shared inside jokes, club history, or memorable events sell better than generic
                  logo-on-shirt products. Run limited campaigns around your annual meeting or a notable event rather than keeping
                  a permanent store with stale inventory.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Clubs with strong brand identity and members who are proud to represent their affiliation publicly.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  10. Amazon Smile and Shopping Programs
                </h3>
                <p className="mb-3">
                  Programs like AmazonSmile (now discontinued, but similar programs exist through retailers and browser extensions
                  like Raise.me or Giving Assistant) donate a small percentage of every qualifying purchase to your nonprofit.
                  Members register once, and a portion of their routine shopping automatically benefits your club.
                </p>
                <p className="mb-3">
                  The revenue per transaction is small, so this works best as a passive, supplemental
                  income stream rather than a primary fundraising strategy. It requires minimal effort after the initial setup and
                  builds over time as more members participate.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> 501(c)(3) nonprofits with active, tech-comfortable memberships who shop online regularly.
                </div>
              </div>

            </div>
          </section>

          {/* Event-Based Fundraisers */}
          <section id="events" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Event-Based Fundraisers
            </h2>

            <p className="text-lg mb-6">
              Fundraising events combine revenue generation with community building. They require more planning than passive
              fundraising methods, but they create memories, attract new members, and strengthen the bonds that keep existing
              members engaged.
            </p>

            <div className="space-y-6">

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  11. Trivia Night
                </h3>
                <p className="mb-3">
                  A trivia night fundraiser is beginner-friendly to organize and works well for clubs of all sizes. Teams of 4-8
                  players compete in rounds across general knowledge, pop culture, history, and themed categories. Charge $10-$15
                  per person for entry, sell drinks and snacks at the venue for additional revenue, and award a prize (often a gift
                  card or trophy) for the winning team.
                </p>
                <p className="mb-3">
                  You can host trivia nights at a local restaurant or bar that will waive the room rental in exchange for the drink
                  revenue the event generates for their business - a common arrangement that reduces your overhead to near zero.
                  Free trivia hosting platforms (Kahoot, Mentimeter) make question preparation straightforward.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Any club with 30-150 members that wants a social evening with a fundraising component.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  12. Charity Run, Walk, or Ride
                </h3>
                <p className="mb-3">
                  Fitness-based fundraising events are effective for sports clubs, outdoor clubs, and health-focused organizations.
                  Participants raise pledges from their personal networks (per mile completed, or flat sponsorship amounts) and
                  complete the event as a group. The dual purpose - raising money and celebrating the club's activity - makes
                  the ask feel natural rather than transactional.
                </p>
                <p className="mb-3">
                  A basic walk-a-thon or fun run requires a route (check local park permit requirements), t-shirts for participants,
                  water stations, and a finish line celebration. Pair it with peer-to-peer fundraising pages to maximize the
                  revenue from each participant's personal network.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Running clubs, cycling clubs, hiking groups, and any organization whose members are active and connected to fitness communities.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  13. Community Dinner or Gala
                </h3>
                <p className="mb-3">
                  A fundraising dinner charges admission to an event that typically includes a meal, entertainment, and a program
                  highlighting the organization's impact. Galas are the higher-end version, often including a silent auction,
                  live music, and a formal program. Both formats can generate significant revenue when executed well.
                </p>
                <p className="mb-3">
                  The margin on a dinner fundraiser depends on controlling food costs. Per-person food costs that take up too much of the ticket
                  price will cut revenue significantly. Consider a catered event with a fixed per-head cost, a potluck format where
                  members contribute food, or a partnership with a restaurant that donates a portion of the food in exchange for publicity.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Established organizations with 100+ members, strong volunteer capacity, and a supporter base willing to pay $50+ per ticket.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  14. Tournament or Competition
                </h3>
                <p className="mb-3">
                  Sports clubs, game clubs, and hobby organizations can host invitation tournaments where participants pay an entry
                  fee. A chess club can run a rated tournament, a tennis club can hold a doubles round-robin, a board game club
                  can host a strategy game championship. Entry fees cover venue costs and generate a fundraising surplus.
                </p>
                <p className="mb-3">
                  The fundraising model works because participants are already motivated to attend by the competition itself - the
                  fundraising component is secondary to them. This makes recruitment easier than a pure charity event. Open
                  tournaments that attract non-members bring in new faces and potential future members.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Sports clubs, gaming groups, and any organization whose activity lends itself to structured competition.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  15. Raffle
                </h3>
                <p className="mb-3">
                  Raffles sell numbered tickets for a chance to win a donated prize. The math is straightforward: if a prize is
                  worth $200 and you sell 200 tickets at $5 each, you gross $1,000 and net $800 after the prize. Larger prizes
                  attract more ticket buyers, but smaller organizations often find mid-size prizes ($50-$200) easier to source
                  through local business donations.
                </p>
                <p className="mb-3">
                  Check your state's raffle regulations before running this fundraiser. Most states require nonprofit organizations
                  to hold a permit or license to conduct a raffle. Requirements vary significantly - some states require no permit
                  for small-scale raffles while others impose strict rules. Compliance is non-negotiable.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Clubs that can source desirable prizes through donations and have confirmed compliance with local raffle regulations.
                </div>
              </div>

            </div>
          </section>

          {/* Community Partnership Fundraisers */}
          <section id="partnerships" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Handshake className="w-8 h-8 text-primary" />
              Community Partnership Fundraisers
            </h2>

            <p className="text-lg mb-6">
              Partnership fundraisers leverage relationships with local businesses, employers, and community organizations.
              They often require less direct volunteer labor than event-based fundraisers and can generate recurring income
              rather than one-time revenue.
            </p>

            <div className="space-y-6">

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  16. Corporate Matching Programs
                </h3>
                <p className="mb-3">
                  Many employers match charitable donations made by their employees - often dollar-for-dollar, sometimes at a 2:1
                  or 3:1 ratio. If your club qualifies as a 501(c)(3) nonprofit, members who work for companies with matching programs
                  can effectively double or triple the impact of their donation at no additional cost to themselves.
                </p>
                <p className="mb-3">
                  The challenge is awareness. Most members do not know their employer offers a matching program, or they forget to
                  submit a matching request. Create a simple checklist that walks members through checking whether their employer
                  matches and how to submit a request. Reminders during end-of-year giving season have the highest conversion rate.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> 501(c)(3) nonprofits with members who work for large employers - technology companies, financial services firms, and universities typically have strong matching programs.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  17. Local Business Sponsorships
                </h3>
                <p className="mb-3">
                  A local business sponsorship asks a business to make a financial contribution in exchange for recognition - their
                  logo on your event banner, a mention in your newsletter, or their name listed on your website. For businesses,
                  this is a marketing expense that reaches your membership. For your club, it is revenue that arrives before
                  the event rather than depending on attendance.
                </p>
                <p className="mb-3">
                  Create a simple one-page sponsorship menu with 3-4 tiers (Bronze: $100, Silver: $250, Gold: $500, Presenting: $1,000)
                  and a clear list of what each tier includes. Approach businesses that have an obvious connection to your membership
                  - a running shop for a running club, a local restaurant for a food-focused group.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Clubs that run regular events with consistent attendance, giving sponsors reliable exposure for their investment.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  18. Restaurant Fundraiser Nights
                </h3>
                <p className="mb-3">
                  Many restaurants partner with nonprofits for fundraiser nights: a percentage of sales (typically 10-20%) for
                  customers who mention the promotion or show a flyer goes to the organization. The restaurant benefits from
                  increased traffic on a slow night; the club benefits from the percentage without any upfront cost or volunteer labor.
                </p>
                <p className="mb-3">
                  The income depends entirely on how many people come in and mention the promotion. Send the flyer to your full
                  member list, post it on social media, and post in local community groups. Schedule the event on a Tuesday,
                  Wednesday, or Thursday when the restaurant is slower - managers are more likely to agree to the arrangement
                  and the percentage tends to be higher.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Family-friendly clubs and organizations with active social media presence who can reliably drive traffic to a local restaurant.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  19. Grant Writing
                </h3>
                <p className="mb-3">
                  Grants are non-repayable funds awarded by foundations, government agencies, and corporations to organizations
                  whose work fits the funder's priorities. For eligible nonprofits, grants can be the largest single source of
                  revenue and the most predictable - foundation grants are often renewed annually for organizations that perform well.
                </p>
                <p className="mb-3">
                  Finding matching grants requires research. Tools like Candid (formerly Guidestar), Foundation Directory Online,
                  and your state's nonprofit association often maintain searchable grant databases. A grant application typically
                  requires a statement of need, a project description, a budget, and evidence of organizational capacity. Start
                  with smaller local foundation grants before pursuing major national funders.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> 501(c)(3) nonprofits with clear program outcomes, measurable impact, and someone capable of handling grant writing - either a staff member or volunteer.
                </div>
              </div>

            </div>
          </section>

          {/* Membership-Driven Revenue */}
          <section id="membership" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Membership-Driven Revenue
            </h2>

            <p className="text-lg mb-6">
              The most predictable fundraising revenue comes from your existing members. Membership-driven revenue models
              use your dues structure, tiered memberships, and alumni networks to generate income that recurs every year
              without requiring a standalone fundraising campaign.
            </p>

            <div className="space-y-6">

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  20. Tiered Membership Levels
                </h3>
                <p className="mb-3">
                  A tiered membership structure offers members the option to pay more than the standard dues rate in exchange
                  for additional recognition, benefits, or just the satisfaction of contributing more. A"Supporter" or"Patron"
                  tier at $25-$50 above standard dues, with a small benefit (name in newsletter, extra guest passes, priority
                  event registration) can generate meaningful additional annual revenue.
                </p>
                <p className="mb-3">
                  The key is making the higher tier feel genuinely valuable, not like a donation dressed up as a membership category.
                  Ask current members what benefits they would find most useful, and build the tier around those preferences.
                  Position it as supporting the club's long-term growth, not covering a budget shortfall.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Clubs with loyal, established memberships who regularly attend events and are financially comfortable supporting the organization.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  21. Alumni or Former Member Program
                </h3>
                <p className="mb-3">
                  Former members who are no longer actively participating can still support the club they once valued. An alumni
                  giving program reaches out to lapsed members with a clear, low-commitment ask:"For $25 per year, stay connected
                  to the club and help us support the next generation of members." This works especially well for college-affiliated
                  groups, youth programs, and competitive clubs.
                </p>
                <p className="mb-3">
                  The ask must be simple and the benefit honest. Former members who feel guilty for leaving are unlikely to give,
                  but former members who have warm memories and a clear sense of impact often respond generously to annual appeals.
                  Keep their email addresses, send an annual newsletter, and include a straightforward donation link.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Long-established clubs and nonprofits with large alumni networks and positive member experiences that generate lasting goodwill.
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  22. Annual Dues Increase with Impact Framing
                </h3>
                <p className="mb-3">
                  A modest annual dues increase (5-10%) communicated transparently with a clear explanation of what the additional
                  revenue funds is more predictable and lower-effort than any standalone fundraising campaign. Members who
                  understand where their money goes are more likely to accept reasonable increases than those who receive
                  a rate change without context.
                </p>
                <p className="mb-3">
                  Frame the increase around specific outcomes:"This year's $10 increase per member will cover the cost of the
                  new equipment we voted to purchase in March." Avoid vague language like"rising operational costs." The more
                  concrete and member-benefit-focused the framing, the better the renewal rate.
                </p>
                <div className="bg-muted/50 rounded p-4 text-sm">
                  <strong>Best for:</strong> Clubs with stable memberships that have not raised dues in 2+ years and can clearly communicate the value they deliver.
                </div>
              </div>

            </div>
          </section>

          {/* How to Choose */}
          <section id="choosing" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-primary" />
              How to Choose the Right Fundraiser for Your Club
            </h2>

            <p className="text-lg mb-6">
              No fundraiser works equally well for every organization. The right approach depends on your member count,
              volunteer capacity, financial goal, and how much lead time you have. Use this framework to narrow down your options.
            </p>

            <div className="bg-primary/5  border-l-4 border-primary p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-primary">
                The Three-Question Filter
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-1">1. How many active volunteers can you reliably mobilize?</p>
                  <p className="text-sm text-muted-foreground">
                    Under 10: Focus on online campaigns, merchandise, or trivia nights. Over 10: You can tackle car washes,
                    plant sales, or community dinners. Over 20: Large events like galas or charity runs become viable.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">2. What is your realistic revenue target?</p>
                  <p className="text-sm text-muted-foreground">
                    Under $1,000: In-person sales events (bake sale, rummage sale) or a simple online campaign.
                    $1,000-$5,000: Event-based fundraisers with sponsorships. Over $5,000: A gala with auction,
                    a major crowdfunding push, or a corporate sponsorship program.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">3. How much lead time do you have?</p>
                  <p className="text-sm text-muted-foreground">
                    Under 2 weeks: Online campaigns and in-person sales.
                    2-6 weeks: Trivia nights, plant sales, and merchandise campaigns.
                    6+ weeks: Galas, charity runs, grant applications, and corporate sponsorship programs.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Combining Fundraisers for Better Results
              </h3>
              <p className="mb-4">
                The most effective fundraising programs combine two complementary approaches: one that generates revenue and
                one that generates awareness. A trivia night (event revenue) paired with an online donation page (post-event
                giving from attendees who heard about your mission) consistently outperforms either approach alone.
              </p>
              <p>
                Similarly, a corporate sponsorship program (large, predictable income) paired with a membership appeal
                (broad participation) creates a more stable financial base than either method on its own. Build your
                fundraising calendar around this pairing principle.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Reference: Fundraiser Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Fundraiser</th>
                      <th className="text-left py-2 pr-4">Effort</th>
                      <th className="text-left py-2 pr-4">Revenue Range</th>
                      <th className="text-left py-2">Lead Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr><td className="py-2 pr-4">Bake Sale</td><td className="py-2 pr-4">Low</td><td className="py-2 pr-4">$100-$600</td><td className="py-2">1-2 weeks</td></tr>
                    <tr><td className="py-2 pr-4">Online Donation Page</td><td className="py-2 pr-4">Low</td><td className="py-2 pr-4">Varies</td><td className="py-2">1 week</td></tr>
                    <tr><td className="py-2 pr-4">Car Wash</td><td className="py-2 pr-4">Medium</td><td className="py-2 pr-4">$400-$1,500</td><td className="py-2">1-2 weeks</td></tr>
                    <tr><td className="py-2 pr-4">Trivia Night</td><td className="py-2 pr-4">Medium</td><td className="py-2 pr-4">$500-$2,500</td><td className="py-2">3-4 weeks</td></tr>
                    <tr><td className="py-2 pr-4">Crowdfunding Campaign</td><td className="py-2 pr-4">Medium</td><td className="py-2 pr-4">$500-$10,000</td><td className="py-2">2-4 weeks</td></tr>
                    <tr><td className="py-2 pr-4">Silent Auction</td><td className="py-2 pr-4">High</td><td className="py-2 pr-4">$1,000-$10,000+</td><td className="py-2">4-6 weeks</td></tr>
                    <tr><td className="py-2 pr-4">Charity Run/Walk</td><td className="py-2 pr-4">High</td><td className="py-2 pr-4">$1,500-$15,000</td><td className="py-2">6-12 weeks</td></tr>
                    <tr><td className="py-2 pr-4">Corporate Sponsorship</td><td className="py-2 pr-4">High</td><td className="py-2 pr-4">$500-$25,000</td><td className="py-2">8-16 weeks</td></tr>
                    <tr><td className="py-2 pr-4">Grant Writing</td><td className="py-2 pr-4">High</td><td className="py-2 pr-4">$1,000-$100,000+</td><td className="py-2">3-12 months</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Revenue ranges are estimates based on typical small-to-midsize club results. Your results will vary based on membership size, community reach, and execution quality.</p>
            </div>

          </section>

        </article>
      </main>

      <ResourceArticleFooter resource={resource} />
      <Footer />
    </div>
  );
}
