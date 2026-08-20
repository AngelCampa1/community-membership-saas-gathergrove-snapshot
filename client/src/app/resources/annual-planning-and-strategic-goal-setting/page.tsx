import { ArrowLeft, Target, Calendar, TrendingUp, Map, Users, CheckCircle, Compass, BarChart3, Lightbulb, Star, FileText } from"lucide-react";
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

export default function AnnualPlanningPage() {
  const resource = getResourceBySlug('annual-planning-and-strategic-goal-setting')!;
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
          category="Strategic Planning"
          dateModified={resource.dateModified}
          title="Annual Planning and Strategic Goal Setting"
          description="Create comprehensive annual plans that align club activities with long-term objectives. Build strategic frameworks that guide decision-making and ensure sustainable growth and member satisfaction."
          readTime={resource.readTime}
        />

        <KeyTakeaways takeaways={["Effective annual plans align short-term activities with 3-5 year strategic vision","SMART goals with assigned owners and deadlines improve completion rates","Quarterly reviews allow course correction before annual plans go off track","Member input in planning increases buy-in and event participation",
        ]} />

        <QuickAnswer
          question="How do you create a club annual plan?"
          answer="Create a club annual plan in 5 steps: review the past year's metrics and member feedback, set 3-5 measurable goals aligned with your mission, build a month-by-month event and activity calendar, create a supporting budget, and assign accountability for each goal to specific board members or committees. Share the plan with all members for transparency."
        />
        <QuickAnswer
          question="What goals should a club set?"
          answer="Clubs should set SMART goals across four areas: membership (e.g., grow to 150 members, improve retention), engagement (e.g., average 60% event attendance, launch community chat), financial (e.g., collect most dues on time, build 3-month reserves), and community impact (e.g., host 2 public events, partner with 1 local organization)."
        />
        <DefinitionBox
          term="Strategic Planning"
          definition="A systematic process where an organization defines its direction and makes decisions on allocating resources to pursue its strategy. For clubs, strategic planning typically covers a 1-3 year horizon and addresses membership growth, program development, financial sustainability, and community impact goals."
        />

        {/* Quick Navigation */}
        <div className="bg-muted/50 rounded-lg p-6 mb-12">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Map className="w-5 h-5" />
            Quick Navigation
          </h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <a href="#fundamentals" className="text-primary hover:text-primary/80 transition-colors">
              • Strategic Planning Fundamentals
            </a>
            <a href="#assessment" className="text-primary hover:text-primary/80 transition-colors">
              • Current State Assessment
            </a>
            <a href="#vision-mission" className="text-primary hover:text-primary/80 transition-colors">
              • Vision and Mission Development
            </a>
            <a href="#goal-setting" className="text-primary hover:text-primary/80 transition-colors">
              • Strategic Goal Setting Framework
            </a>
            <a href="#annual-planning" className="text-primary hover:text-primary/80 transition-colors">
              • Annual Planning Process
            </a>
            <a href="#implementation" className="text-primary hover:text-primary/80 transition-colors">
              • Implementation and Execution
            </a>
            <a href="#monitoring" className="text-primary hover:text-primary/80 transition-colors">
              • Monitoring and Adjustment
            </a>
            <a href="#roadmap" className="text-primary hover:text-primary/80 transition-colors">
              • Planning Implementation Roadmap
            </a>
          </div>
        </div>

        <article className="prose prose-lg  max-w-none">
          {/* Strategic Planning Fundamentals */}
          <section id="fundamentals" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Compass className="w-8 h-8 text-primary" />
              Strategic Planning Fundamentals
            </h2>
            
            <p className="text-lg mb-6">
              Strategic planning transforms reactive club management into proactive leadership that guides 
              your organization toward meaningful goals. Annual planning provides the framework for 
              coordinating activities, allocating resources, and measuring progress toward your club's vision.
            </p>

            <div className="bg-success/10  border-l-4 border-success p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-success">
                The Strategic Planning Hierarchy
              </h3>
              <p className="text-success/90  mb-4">
                Effective club planning operates on multiple time horizons, from daily activities to long-term
                vision. Each level informs and supports the others, creating alignment between immediate actions
                and strategic direction.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-background p-4 rounded-lg text-center">
                  <Target className="w-8 h-8 text-success mx-auto mb-2" />
                  <h4 className="font-semibold text-success  mb-2">Vision</h4>
                  <p className="text-sm text-success/80">
                    5-10 year aspirational future state
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg text-center">
                  <Map className="w-8 h-8 text-success mx-auto mb-2" />
                  <h4 className="font-semibold text-success  mb-2">Strategy</h4>
                  <p className="text-sm text-success/80">
                    3-5 year strategic direction and priorities
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg text-center">
                  <Calendar className="w-8 h-8 text-success mx-auto mb-2" />
                  <h4 className="font-semibold text-success  mb-2">Annual Plans</h4>
                  <p className="text-sm text-success/80">
                    1-year goals and implementation roadmap
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                  <h4 className="font-semibold text-success  mb-2">Actions</h4>
                  <p className="text-sm text-success/80">
                    Daily and weekly activities and programs
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Benefits of Strategic Annual Planning</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Alignment and Focus
                </h4>
                <p className="mb-4">
                  Strategic planning aligns leadership, volunteers, and members around common goals and priorities.
                  This alignment eliminates confusion, reduces conflicts, and ensures everyone works toward
                  the same objectives.
                </p>
                <div className="bg-primary/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Alignment Benefits:</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Clear communication of club direction and priorities</li>
                    <li>• Improved coordination between committees and activities</li>
                    <li>• Consistent decision-making criteria across the organization</li>
                    <li>• Enhanced volunteer engagement through purpose clarity</li>
                    <li>• Reduced time wasted on misaligned or competing initiatives</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-success" />
                  Resource Optimization
                </h4>
                <p className="mb-4">
                  Annual planning enables strategic allocation of limited resources-volunteer time, financial
                  resources, and organizational capacity-to maximize impact and member value.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Strategic Resource Allocation</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Prioritize high-impact activities and programs</li>
                      <li>• Balance investment across different member segments</li>
                      <li>• Plan volunteer workload to prevent burnout</li>
                      <li>• Coordinate major events to avoid conflicts</li>
                    </ul>
                  </div>
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">Efficiency Improvements</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Eliminate duplicate or low-value activities</li>
                      <li>• Leverage economies of scale in procurement</li>
                      <li>• Optimize meeting and event scheduling</li>
                      <li>• Standardize successful program formats</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-secondary" />
                  Proactive Problem Solving
                </h4>
                <p className="mb-4">
                  Strategic planning anticipates challenges and opportunities, enabling proactive responses
                  rather than reactive crisis management. This forward-thinking approach strengthens
                  organizational resilience and member satisfaction.
                </p>
                <div className="bg-secondary/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Proactive Planning Elements:</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Risk assessment and mitigation strategies</li>
                    <li>• Scenario planning for different growth trajectories</li>
                    <li>• Succession planning for key leadership roles</li>
                    <li>• Financial planning for major investments and expenses</li>
                    <li>• Competitive analysis and market positioning</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Current State Assessment */}
          <section id="assessment" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Current State Assessment
            </h2>
            
            <p className="text-lg mb-6">
              Effective strategic planning begins with honest assessment of your club's current situation. 
              Understanding strengths, weaknesses, opportunities, and threats provides the foundation 
              for realistic goal setting and strategic direction.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Comprehensive Club Assessment Framework</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Membership and Engagement Analysis
                </h4>
                <p className="mb-4">
                  Analyze membership trends, engagement patterns, and satisfaction levels to understand 
                  your club's current appeal and effectiveness in serving member needs.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Key Membership Metrics to Assess:</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium mb-2 text-primary">Growth and Retention</h6>
                      <ul className="space-y-1">
                        <li>• Total membership trends over 3-5 years</li>
                        <li>• Annual retention rates by member type</li>
                        <li>• New member acquisition rates and sources</li>
                        <li>• Member lifecycle patterns and tenure</li>
                        <li>• Seasonal membership fluctuations</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-success">Engagement and Satisfaction</h6>
                      <ul className="space-y-1">
                        <li>• Event attendance rates and patterns</li>
                        <li>• Volunteer participation and commitment</li>
                        <li>• Member feedback and satisfaction scores</li>
                        <li>• Communication engagement metrics</li>
                        <li>• Member referral and recommendation rates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Financial Performance Review
                </h4>
                <p className="mb-4">
                  Evaluate financial health and sustainability to ensure your strategic plans are
                  financially viable and support long-term organizational stability.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-primary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Revenue Analysis</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Dues collection rates and trends</li>
                      <li>• Event revenue and profitability</li>
                      <li>• Fundraising effectiveness and growth</li>
                      <li>• Revenue diversification and stability</li>
                      <li>• Per-member revenue calculations</li>
                    </ul>
                  </div>
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Cost Structure</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Operating expense trends and ratios</li>
                      <li>• Cost per member and per event</li>
                      <li>• Fixed vs. variable cost analysis</li>
                      <li>• Capital investment and depreciation</li>
                      <li>• Reserve fund adequacy and growth</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-success" />
                  SWOT Analysis for Clubs
                </h4>
                <p className="mb-4">
                  Conduct a thorough Strengths, Weaknesses, Opportunities, and Threats analysis
                  specifically tailored to hobby club environments and challenges.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-success/10  p-4 rounded-lg">
                      <h5 className="font-semibold text-success  mb-2">Strengths (Internal Positives)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Passionate and knowledgeable member base</li>
                        <li>• Strong community reputation and relationships</li>
                        <li>• Effective leadership and governance</li>
                        <li>• Unique programs or expertise areas</li>
                        <li>• Financial stability and resource adequacy</li>
                      </ul>
                    </div>
                    <div className="bg-primary/10  p-4 rounded-lg">
                      <h5 className="font-semibold text-primary  mb-2">Opportunities (External Positives)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Growing interest in club's hobby or focus area</li>
                        <li>• New technology tools for club management</li>
                        <li>• Partnership opportunities with related organizations</li>
                        <li>• Available grants or funding sources</li>
                        <li>• Emerging member demographics or markets</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-destructive/10  p-4 rounded-lg">
                      <h5 className="font-semibold text-destructive  mb-2">Weaknesses (Internal Negatives)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Limited volunteer capacity or burnout</li>
                        <li>• Outdated technology or communication tools</li>
                        <li>• Aging membership with few young recruits</li>
                        <li>• Inadequate facilities or meeting spaces</li>
                        <li>• Lack of marketing or outreach capabilities</li>
                      </ul>
                    </div>
                    <div className="bg-warning/10  p-4 rounded-lg">
                      <h5 className="font-semibold text-warning  mb-2">Threats (External Negatives)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Competing activities and time demands</li>
                        <li>• Economic pressures affecting member finances</li>
                        <li>• Regulatory changes or compliance requirements</li>
                        <li>• Declining interest in traditional club formats</li>
                        <li>• Facility costs or availability challenges</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Vision and Mission Development */}
          <section id="vision-mission" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Star className="w-8 h-8 text-primary" />
              Vision and Mission Development
            </h2>
            
            <p className="text-lg mb-6">
              Clear vision and mission statements provide the foundation for all strategic planning. 
              These guiding statements align stakeholders, inspire action, and provide criteria 
              for evaluating opportunities and decisions.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Crafting Effective Vision and Mission</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  Vision Statement Development
                </h4>
                <p className="mb-4">
                  Your vision statement describes the ideal future state your club aspires to achieve.
                  It should be inspirational, memorable, and provide clear direction for long-term planning.
                </p>
                <div className="bg-warning/10  p-4 rounded-lg mb-4">
                  <h5 className="font-semibold mb-2">Effective Vision Statement Characteristics:</h5>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Inspirational:</strong> Motivates members and volunteers to contribute</li>
                    <li>• <strong>Clear:</strong> Easy to understand and remember</li>
                    <li>• <strong>Future-focused:</strong> Describes desired end state, not current activities</li>
                    <li>• <strong>Achievable:</strong> Ambitious but realistic given club capabilities</li>
                    <li>• <strong>Distinctive:</strong> Reflects unique aspects of your club's identity</li>
                  </ul>
                </div>

                <div className="bg-success/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Sample Club Vision Statements:</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Photography Club:</strong>"To be the premier community for photographers of all levels,
                      inspiring creativity and fostering lifelong learning through shared passion for the art of photography."
                    </div>
                    <div>
                      <strong>Gardening Club:</strong>"To cultivate a thriving community of gardeners who beautify
                      our neighborhood, share knowledge freely, and promote sustainable environmental practices."
                    </div>
                    <div>
                      <strong>Book Club:</strong>"To create a welcoming space where readers connect, explore diverse
                      perspectives, and enrich their lives through the transformative power of literature."
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Mission Statement Creation
                </h4>
                <p className="mb-4">
                  Your mission statement defines your club's purpose and primary activities. It answers"why we exist" and"what we do" in concrete, actionable terms.
                </p>
                <div className="bg-primary/10  p-4 rounded-lg mb-4">
                  <h5 className="font-semibold mb-2">Mission Statement Framework:</h5>
                  <div className="space-y-2 text-sm">
                    <p><strong>Who we serve:</strong> Identify your primary member base and beneficiaries</p>
                    <p><strong>What we do:</strong> Describe your core activities and services</p>
                    <p><strong>How we do it:</strong> Outline your approach and key methods</p>
                    <p><strong>Why it matters:</strong> Explain the value and impact you create</p>
                  </div>
                </div>

                <div className="bg-secondary/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Mission Statement Examples:</h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Hiking Club:</strong>"We bring together outdoor enthusiasts to explore local trails,
                      promote physical fitness, and build lasting friendships through shared adventures in nature.
                      We welcome hikers of all experience levels and provide safe, supportive environments for
                      learning and discovery."
                    </div>
                    <div>
                      <strong>Cooking Club:</strong>"Our mission is to inspire culinary creativity and cultural
                      appreciation by providing hands-on cooking experiences, sharing diverse recipes and techniques,
                      and fostering community connections through the universal language of food."
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  Values and Principles Definition
                </h4>
                <p className="mb-4">
                  Core values guide behavior and decision-making within your club. They define"how we operate"
                  and create cultural consistency across all activities and interactions.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Common Club Values</h5>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Inclusivity:</strong> Welcoming all backgrounds and skill levels</li>
                      <li>• <strong>Learning:</strong> Commitment to continuous growth and education</li>
                      <li>• <strong>Community:</strong> Building connections and mutual support</li>
                      <li>• <strong>Excellence:</strong> Striving for quality in all activities</li>
                      <li>• <strong>Integrity:</strong> Honest and ethical behavior</li>
                      <li>• <strong>Fun:</strong> Maintaining joy and enthusiasm in club life</li>
                    </ul>
                  </div>
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">Values in Action</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Decision-making criteria and guidelines</li>
                      <li>• Conflict resolution and problem-solving approaches</li>
                      <li>• Member interaction and communication standards</li>
                      <li>• Program design and delivery principles</li>
                      <li>• Leadership behavior and volunteer expectations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Strategic Goal Setting Framework */}
          <section id="goal-setting" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Strategic Goal Setting Framework
            </h2>
            
            <p className="text-lg mb-6">
              Effective strategic goals bridge the gap between vision and daily activities. They provide 
              specific, measurable targets that guide resource allocation and provide clear success criteria 
              for evaluating progress.
            </p>

            <h3 className="text-2xl font-semibold mb-6">SMART Goals for Club Success</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  SMART Goal Framework Application
                </h4>
                <p className="mb-4">
                  Adapt the classic SMART criteria to club environments, ensuring goals are both 
                  ambitious enough to drive growth and realistic enough to maintain volunteer motivation.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">SMART Criteria for Club Goals:</h5>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div className="bg-primary/10  p-3 rounded">
                      <h6 className="font-semibold text-primary  mb-1">Specific</h6>
                      <p>Clear, well-defined outcomes that answer who, what, where, when, and why</p>
                    </div>
                    <div className="bg-success/10  p-3 rounded">
                      <h6 className="font-semibold text-success  mb-1">Measurable</h6>
                      <p>Quantifiable metrics that allow progress tracking and success evaluation</p>
                    </div>
                    <div className="bg-warning/10  p-3 rounded">
                      <h6 className="font-semibold text-warning  mb-1">Achievable</h6>
                      <p>Realistic given club resources, volunteer capacity, and external constraints</p>
                    </div>
                    <div className="bg-secondary/10  p-3 rounded">
                      <h6 className="font-semibold text-secondary  mb-1">Relevant</h6>
                      <p>Aligned with mission, vision, and member needs; supports strategic priorities</p>
                    </div>
                    <div className="bg-destructive/10  p-3 rounded">
                      <h6 className="font-semibold text-destructive  mb-1">Time-bound</h6>
                      <p>Clear deadlines and milestones that create urgency and enable planning</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Strategic Goal Categories
                </h4>
                <p className="mb-4">
                  Organize goals across key performance areas to ensure balanced development and
                  comprehensive progress toward your club's vision.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-primary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Membership and Community</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Membership growth and retention targets</li>
                      <li>• Member engagement and satisfaction levels</li>
                      <li>• Diversity and inclusion improvements</li>
                      <li>• Community outreach and visibility goals</li>
                      <li>• Member skill development and learning outcomes</li>
                    </ul>
                  </div>
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Programs and Services</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Event quality and attendance improvements</li>
                      <li>• New program development and launch</li>
                      <li>• Educational content and resource expansion</li>
                      <li>• Partnership and collaboration initiatives</li>
                      <li>• Technology and service enhancement goals</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-secondary  mb-2">Organizational Excellence</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Leadership development and succession planning</li>
                      <li>• Volunteer recruitment and retention</li>
                      <li>• Financial stability and resource growth</li>
                      <li>• Operational efficiency improvements</li>
                      <li>• Governance and policy development</li>
                    </ul>
                  </div>
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">External Impact</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Industry or hobby advancement contributions</li>
                      <li>• Community service and charitable activities</li>
                      <li>• Advocacy and awareness campaigns</li>
                      <li>• Knowledge sharing and publication goals</li>
                      <li>• Recognition and award achievements</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Goal Setting Process and Prioritization
                </h4>
                <p className="mb-4">
                  Systematic goal setting ensures comprehensive planning while maintaining focus on
                  the most impactful objectives for your club's success and growth.
                </p>
                <div className="space-y-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Annual Goal Setting Process</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-3">
                        <span className="bg-success text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                        <div>
                          <h6 className="font-medium">Brainstorm Potential Goals</h6>
                          <p>Generate comprehensive list of possible objectives across all goal categories</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="bg-success text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                        <div>
                          <h6 className="font-medium">Evaluate and Prioritize</h6>
                          <p>Assess impact, feasibility, and resource requirements for each potential goal</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="bg-success text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                        <div>
                          <h6 className="font-medium">Select Strategic Goals</h6>
                          <p>Choose 5-8 high-priority goals that balance ambition with organizational capacity</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="bg-success text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                        <div>
                          <h6 className="font-medium">Refine Using SMART Criteria</h6>
                          <p>Develop specific, measurable, achievable, relevant, and time-bound goal statements</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Goal Prioritization Matrix</h5>
                    <p className="text-sm mb-2">Evaluate each potential goal using these criteria:</p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium mb-1">High Priority Characteristics</h6>
                        <ul className="space-y-1">
                          <li>• Direct impact on member value and satisfaction</li>
                          <li>• Strong alignment with mission and vision</li>
                          <li>• Feasible with available resources and capacity</li>
                          <li>• Builds foundation for future opportunities</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1">Lower Priority Indicators</h6>
                        <ul className="space-y-1">
                          <li>• Limited member impact or interest</li>
                          <li>• Requires resources beyond current capacity</li>
                          <li>• Duplicates existing successful activities</li>
                          <li>• Depends on external factors beyond club control</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-success/10  border-l-4 border-success p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-success">
                <Target className="w-5 h-5" />
                Sample Strategic Goals for Different Club Types
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Photography Club Goals</h5>
                  <ul className="space-y-1">
                    <li>• Increase membership from 45 to 60 members by December 2026</li>
                    <li>• Launch monthly photography challenge with 80% member participation</li>
                    <li>• Establish mentorship program pairing 15 new members with experienced photographers</li>
                  </ul>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Gardening Club Goals</h5>
                  <ul className="space-y-1">
                    <li>• Create community garden project benefiting 100+ neighborhood families</li>
                    <li>• Achieve many member satisfaction rating in annual survey</li>
                    <li>• Develop partnership with local schools for youth education programs</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Annual Planning Process */}
          <section id="annual-planning" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Annual Planning Process
            </h2>
            
            <p className="text-lg mb-6">
              Transform strategic goals into executable annual plans through systematic planning that 
              coordinates activities, allocates resources, and establishes accountability for results. 
              Effective annual planning bridges strategy and daily operations.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Comprehensive Annual Planning Framework</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary" />
                  Annual Planning Timeline and Process
                </h4>
                <p className="mb-4">
                  Conduct annual planning systematically across several months to ensure thorough 
                  preparation, broad input, and realistic implementation timelines.
                </p>
                <div className="bg-primary/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">12-Month Planning Cycle</h5>
                  <div className="space-y-3 text-sm">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-background p-3 rounded">
                        <h6 className="font-semibold text-primary  mb-1">Q1 (Jan-Mar): Assessment</h6>
                        <ul className="space-y-1 text-xs">
                          <li>• Review previous year performance</li>
                          <li>• Conduct member satisfaction surveys</li>
                          <li>• Analyze financial and membership data</li>
                          <li>• Update SWOT analysis</li>
                        </ul>
                      </div>
                      <div className="bg-background p-3 rounded">
                        <h6 className="font-semibold text-success  mb-1">Q2 (Apr-Jun): Planning</h6>
                        <ul className="space-y-1 text-xs">
                          <li>• Set strategic goals for coming year</li>
                          <li>• Develop program and event calendar</li>
                          <li>• Create budget and resource allocation</li>
                          <li>• Identify volunteer leadership needs</li>
                        </ul>
                      </div>
                      <div className="bg-background p-3 rounded">
                        <h6 className="font-semibold text-secondary  mb-1">Q3 (Jul-Sep): Preparation</h6>
                        <ul className="space-y-1 text-xs">
                          <li>• Recruit and train volunteer leaders</li>
                          <li>• Finalize detailed program plans</li>
                          <li>• Secure venues and vendor contracts</li>
                          <li>• Launch membership renewal campaigns</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-warning/10  p-3 rounded">
                      <h6 className="font-semibold text-warning  mb-1">Q4 (Oct-Dec): Launch and Adjustment</h6>
                      <p className="text-xs">Begin new program year implementation, monitor early results, and adjust plans based on initial feedback and performance.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  Stakeholder Engagement and Input
                </h4>
                <p className="mb-4">
                  Involve key stakeholders in planning to ensure plans reflect member needs, leverage
                  volunteer capabilities, and maintain broad support for implementation.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Member Input Strategies</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Annual member survey on priorities and satisfaction</li>
                      <li>• Focus groups for specific programs or initiatives</li>
                      <li>• Open forums and town hall meetings</li>
                      <li>• Committee feedback and recommendations</li>
                      <li>• New member orientation insights</li>
                    </ul>
                  </div>
                  <div className="bg-primary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Leadership Planning Sessions</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Board strategic planning retreat</li>
                      <li>• Committee chair coordination meetings</li>
                      <li>• Volunteer leader planning workshops</li>
                      <li>• Cross-functional collaboration sessions</li>
                      <li>• Expert guest speaker consultations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  Program and Event Calendar Development
                </h4>
                <p className="mb-4">
                  Create a comprehensive annual calendar that coordinates all club activities,
                  optimizes resource utilization, and provides clear communication to members.
                </p>
                <div className="space-y-4">
                  <div className="bg-secondary/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Calendar Planning Considerations</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium mb-1">Scheduling Factors</h6>
                        <ul className="space-y-1">
                          <li>• Seasonal appropriateness for activities</li>
                          <li>• Holiday and vacation period impacts</li>
                          <li>• Community event calendar coordination</li>
                          <li>• Venue availability and booking requirements</li>
                          <li>• Volunteer capacity and availability</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1">Program Balance</h6>
                        <ul className="space-y-1">
                          <li>• Mix of educational, social, and service activities</li>
                          <li>• Beginner-friendly and advanced programming</li>
                          <li>• Indoor and outdoor activity options</li>
                          <li>• Regular meetings and special events</li>
                          <li>• Member-led and guest speaker sessions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Annual Calendar Template Structure</h5>
                    <div className="text-sm space-y-2">
                      <div className="grid md:grid-cols-4 gap-2">
                        <div><strong>January:</strong> New Year planning, goal setting workshop</div>
                        <div><strong>February:</strong> Member appreciation event, skill-building session</div>
                        <div><strong>March:</strong> Spring project launch, community outreach</div>
                        <div><strong>April:</strong> Annual meeting, board elections</div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-2">
                        <div><strong>May:</strong> Guest speaker series, beginner workshops</div>
                        <div><strong>June:</strong> Summer social event, outdoor activities</div>
                        <div><strong>July:</strong> Vacation-friendly programming, informal gatherings</div>
                        <div><strong>August:</strong> Leadership retreat, planning for fall</div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-2">
                        <div><strong>September:</strong> New member orientation, program year kickoff</div>
                        <div><strong>October:</strong> Annual showcase event, community partnerships</div>
                        <div><strong>November:</strong> Holiday celebration, gratitude activities</div>
                        <div><strong>December:</strong> Year-end reflection, holiday break</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-warning" />
                  Budget and Resource Allocation
                </h4>
                <p className="mb-4">
                  Translate strategic goals into realistic budgets that allocate resources effectively
                  across programs, operations, and strategic initiatives while maintaining financial sustainability.
                </p>
                <div className="bg-warning/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Strategic Budget Categories</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium mb-2 text-warning">Core Operations (50-60%)</h6>
                      <ul className="space-y-1">
                        <li>• Regular meeting venue and refreshments</li>
                        <li>• Basic administrative and communication costs</li>
                        <li>• Essential equipment maintenance and supplies</li>
                        <li>• Insurance and legal compliance requirements</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-primary">Programs and Events (25-35%)</h6>
                      <ul className="space-y-1">
                        <li>• Guest speaker fees and travel expenses</li>
                        <li>• Special event venues and catering</li>
                        <li>• Educational materials and workshop supplies</li>
                        <li>• Community outreach and partnership activities</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-success">Growth and Development (10-15%)</h6>
                      <ul className="space-y-1">
                        <li>• Marketing and member recruitment initiatives</li>
                        <li>• Technology upgrades and new tool adoption</li>
                        <li>• Leadership development and training programs</li>
                        <li>• Strategic initiative seed funding</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-secondary">Reserves and Contingency (5-10%)</h6>
                      <ul className="space-y-1">
                        <li>• Emergency fund contributions</li>
                        <li>• Equipment replacement reserves</li>
                        <li>• Unexpected opportunity fund</li>
                        <li>• End-of-year surplus allocation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Implementation and Execution */}
          <section id="implementation" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              Implementation and Execution
            </h2>
            
            <p className="text-lg mb-6">
              Transform annual plans into reality through systematic implementation that maintains 
              momentum, adapts to changing circumstances, and ensures accountability for results. 
              Effective execution is where strategic planning creates actual value for members.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Implementation Success Framework</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Leadership and Accountability Structure
                </h4>
                <p className="mb-4">
                  Establish clear ownership and accountability for each strategic goal and major initiative. 
                  Strong leadership assignment ensures dedicated attention and consistent progress monitoring.
                </p>
                <div className="bg-primary/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Goal Ownership Matrix</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Strategic Goal</th>
                          <th className="text-left p-2">Goal Champion</th>
                          <th className="text-left p-2">Support Team</th>
                          <th className="text-left p-2">Board Liaison</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Increase membership to 60 members</td>
                          <td className="p-2">Membership Chair</td>
                          <td className="p-2">Outreach Committee</td>
                          <td className="p-2">Vice President</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Launch mentorship program</td>
                          <td className="p-2">Education Director</td>
                          <td className="p-2">Senior Members</td>
                          <td className="p-2">Secretary</td>
                        </tr>
                        <tr>
                          <td className="p-2">Establish community garden</td>
                          <td className="p-2">Project Coordinator</td>
                          <td className="p-2">Garden Committee</td>
                          <td className="p-2">President</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-success" />
                  Quarterly Implementation Planning
                </h4>
                <p className="mb-4">
                  Break down annual goals into quarterly milestones and specific action plans that
                  provide manageable timeframes and regular progress checkpoints.
                </p>
                <div className="space-y-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Quarterly Planning Process</h5>
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium mb-1 text-success">Month 1: Planning</h6>
                        <ul className="space-y-1">
                          <li>• Review quarterly goals</li>
                          <li>• Plan specific activities</li>
                          <li>• Assign responsibilities</li>
                          <li>• Set monthly milestones</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1 text-primary">Month 2: Execution</h6>
                        <ul className="space-y-1">
                          <li>• Implement planned activities</li>
                          <li>• Monitor early results</li>
                          <li>• Address emerging challenges</li>
                          <li>• Mid-quarter check-in</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1 text-secondary">Month 3: Assessment</h6>
                        <ul className="space-y-1">
                          <li>• Complete quarterly activities</li>
                          <li>• Measure results vs. targets</li>
                          <li>• Identify lessons learned</li>
                          <li>• Plan next quarter adjustments</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1 text-warning">Transition Week</h6>
                        <ul className="space-y-1">
                          <li>• Quarterly review meeting</li>
                          <li>• Update annual plan tracking</li>
                          <li>• Communicate progress</li>
                          <li>• Launch next quarter</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Sample Quarterly Milestone Framework</h5>
                    <div className="text-sm space-y-2">
                      <div><strong>Goal:</strong> Increase membership from 45 to 60 members by December 2026</div>
                      <div className="grid md:grid-cols-4 gap-2">
                        <div><strong>Q1:</strong> Reach 48 members (3 new)</div>
                        <div><strong>Q2:</strong> Reach 52 members (4 new)</div>
                        <div><strong>Q3:</strong> Reach 56 members (4 new)</div>
                        <div><strong>Q4:</strong> Reach 60 members (4 new)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  Communication and Member Engagement
                </h4>
                <p className="mb-4">
                  Keep members informed and engaged with strategic plan implementation through regular
                  communication that celebrates progress, acknowledges challenges, and maintains enthusiasm.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-secondary  mb-2">Regular Communication Schedule</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Monthly progress updates in newsletters</li>
                      <li>• Quarterly goal review at member meetings</li>
                      <li>• Success story spotlights and celebrations</li>
                      <li>• Challenge identification and problem-solving</li>
                      <li>• Annual plan review and adjustment communications</li>
                    </ul>
                  </div>
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">Member Engagement Strategies</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Volunteer opportunities related to strategic goals</li>
                      <li>• Member input sessions on implementation approaches</li>
                      <li>• Recognition of members contributing to goal achievement</li>
                      <li>• Transparent discussion of obstacles and solutions</li>
                      <li>• Invitation for member ideas and innovation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Monitoring and Adjustment */}
          <section id="monitoring" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Monitoring and Adjustment
            </h2>
            
            <p className="text-lg mb-6">
              Systematic monitoring enables course correction and continuous improvement throughout 
              the implementation process. Regular assessment ensures plans remain relevant and 
              achievable while maximizing learning and adaptation opportunities.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Performance Monitoring System</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Key Performance Indicators (KPIs)
                </h4>
                <p className="mb-4">
                  Establish specific, measurable indicators that provide early warning of problems 
                  and clear evidence of progress toward strategic goals.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Essential Club KPIs by Category</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium mb-2 text-primary">Membership Health</h6>
                      <ul className="space-y-1">
                        <li>• Total active membership count</li>
                        <li>• Monthly new member acquisitions</li>
                        <li>• Annual retention rate percentage</li>
                        <li>• Average member tenure and lifetime value</li>
                        <li>• Member satisfaction survey scores</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-success">Engagement and Participation</h6>
                      <ul className="space-y-1">
                        <li>• Event attendance rates and trends</li>
                        <li>• Volunteer participation percentage</li>
                        <li>• Communication engagement metrics</li>
                        <li>• Program completion and feedback scores</li>
                        <li>• Member-generated content and contributions</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-secondary">Financial Performance</h6>
                      <ul className="space-y-1">
                        <li>• Revenue vs. budget variance</li>
                        <li>• Cost per member and per event</li>
                        <li>• Reserve fund growth rate</li>
                        <li>• Dues collection efficiency</li>
                        <li>• Program profitability analysis</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-warning">Organizational Development</h6>
                      <ul className="space-y-1">
                        <li>• Leadership pipeline strength</li>
                        <li>• Volunteer recruitment success rate</li>
                        <li>• Operational efficiency improvements</li>
                        <li>• Strategic goal completion percentage</li>
                        <li>• External partnership development</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Regular Review and Reporting Schedule
                </h4>
                <p className="mb-4">
                  Establish consistent review cycles that provide timely feedback without creating
                  excessive administrative burden for volunteers and leadership.
                </p>
                <div className="space-y-4">
                  <div className="bg-primary/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Multi-Level Review Structure</h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <span className="bg-success text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">M</span>
                        <div>
                          <h6 className="font-medium">Monthly Operational Review</h6>
                          <p>Quick assessment of current month activities, immediate issues, and next month preparation</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">Q</span>
                        <div>
                          <h6 className="font-medium">Quarterly Strategic Assessment</h6>
                          <p>Comprehensive review of goal progress, KPI analysis, and strategic plan adjustments</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="bg-secondary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">A</span>
                        <div>
                          <h6 className="font-medium">Annual Plan Evaluation</h6>
                          <p>Complete performance review, lessons learned documentation, and next year planning initiation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Review Meeting Structure and Agenda</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium mb-1">Data Review (25%)</h6>
                        <ul className="space-y-1">
                          <li>• KPI trend analysis</li>
                          <li>• Goal progress assessment</li>
                          <li>• Financial performance review</li>
                          <li>• Member feedback summary</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1">Problem Solving (50%)</h6>
                        <ul className="space-y-1">
                          <li>• Challenge identification</li>
                          <li>• Root cause analysis</li>
                          <li>• Solution brainstorming</li>
                          <li>• Action plan development</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1">Forward Planning (25%)</h6>
                        <ul className="space-y-1">
                          <li>• Next period priorities</li>
                          <li>• Resource allocation adjustments</li>
                          <li>• Communication planning</li>
                          <li>• Success celebration</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-success" />
                  Adaptive Planning and Course Correction
                </h4>
                <p className="mb-4">
                  Build flexibility into planning processes that allows for strategic pivots when
                  circumstances change or new opportunities emerge while maintaining core strategic direction.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">When to Adjust Plans</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Significant external environment changes</li>
                      <li>• Member needs shift requiring program modifications</li>
                      <li>• Resource constraints or unexpected opportunities</li>
                      <li>• Implementation challenges that require new approaches</li>
                      <li>• Performance significantly ahead or behind projections</li>
                    </ul>
                  </div>
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">Adjustment Process</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Assess impact on overall strategic direction</li>
                      <li>• Evaluate resource and timeline implications</li>
                      <li>• Consult stakeholders and gather input</li>
                      <li>• Modify goals and tactics while preserving vision</li>
                      <li>• Communicate changes clearly to all members</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/10  border-l-4 border-primary p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-primary">
                <BarChart3 className="w-5 h-5" />
                GatherGrove Planning and Analytics Tools
              </h4>
              <p className="text-primary/90  mb-4">
                GatherGrove provides integrated planning and analytics tools that help track strategic
                goals, monitor KPIs, and generate reports that support data-driven decision making
                and continuous improvement in your club management.
              </p>
              <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-primary/30 bg-background hover:bg-primary/10 text-primary    h-9 px-3">
                Explore Planning Tools
              </Link>
            </div>
          </section>

          {/* Planning Implementation Roadmap */}
          <section id="roadmap" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              Planning Implementation Roadmap
            </h2>
            
            <p className="text-lg mb-6">
              Transform your club into a strategically-managed organization through this systematic 
              implementation approach that builds planning capabilities while maintaining operational 
              excellence and member satisfaction.
            </p>

            <div className="space-y-8">
              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                  Foundation Phase (Months 1-3)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Establish basic strategic planning capabilities and conduct comprehensive assessment
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Assessment and Preparation</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Conduct comprehensive club assessment and SWOT analysis
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Survey members on priorities and satisfaction
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Review and update mission and vision statements
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Establish baseline metrics and KPIs
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Planning Team Formation</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Create strategic planning committee with diverse representation
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Train leadership team on strategic planning principles
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Design member engagement and input process
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Establish planning meeting schedule and protocols
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                  Strategic Development Phase (Months 4-6)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Develop strategic goals and create comprehensive annual plan
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Goal Setting and Prioritization</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Facilitate strategic goal brainstorming and development
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Apply SMART criteria to refine and prioritize goals
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Create goal ownership and accountability structure
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Design measurement and monitoring systems
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Annual Plan Development</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Create comprehensive program and event calendar
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Develop strategic budget aligned with goals
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Plan resource allocation and volunteer assignments
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Create member communication and engagement strategy
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                  Implementation Launch Phase (Months 7-9)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Launch strategic plan implementation with strong communication and monitoring
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Plan Launch and Communication</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Present strategic plan to membership with excitement
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Launch first quarter implementation activities
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Begin regular progress monitoring and reporting
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Establish feedback and adjustment mechanisms
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Execution and Refinement</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Conduct monthly implementation review meetings
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Track KPIs and adjust tactics as needed
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Celebrate early wins and address challenges
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Refine processes based on initial experience
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                  Optimization and Sustainability Phase (Months 10-12)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Optimize planning processes and establish sustainable strategic management culture
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Process Optimization</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Conduct comprehensive annual plan review
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Document lessons learned and best practices
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Refine planning processes and tools
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Prepare for next year's strategic planning cycle
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Culture and Sustainability</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Train new leaders on strategic planning approach
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Embed strategic thinking into club culture
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Create strategic planning knowledge transfer system
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Establish continuous improvement mindset
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-success/10  border-l-4 border-success p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-success">
                <Target className="w-5 h-5" />
                Strategic Planning Success Indicators
              </h4>
              <p className="text-success/90  mb-4">
                Measure your strategic planning effectiveness with these key indicators:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Planning Effectiveness</h5>
                  <ul className="text-sm space-y-1">
                    <li>• strong of annual strategic goals achieved</li>
                    <li>• Regular member engagement in planning process</li>
                    <li>• Improved alignment between activities and goals</li>
                    <li>• Enhanced leadership decision-making quality</li>
                  </ul>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Organizational Impact</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Increased member satisfaction and retention</li>
                    <li>• Improved financial stability and growth</li>
                    <li>• Enhanced community reputation and impact</li>
                    <li>• Sustainable leadership development pipeline</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <ResourceArticleFooter resource={resource} />
        </article>
      </main>

      <Footer />
    </div>
  );
}
