import { ArrowLeft, DollarSign, PieChart, TrendingUp, AlertTriangle, FileText, Calculator, Calendar, Users, CheckCircle } from"lucide-react";
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

export default function FinancialManagementPage() {
  const resource = getResourceBySlug('financial-management-for-small-clubs')!;
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
          title="Financial Management for Small Clubs"
          description="Build sustainable financial practices that ensure your club's long-term success. From budgeting and reporting to cash flow management and financial planning."
          readTime={resource.readTime}
        />

        <KeyTakeaways takeaways={["A clear annual budget with monthly tracking prevents financial surprises","Maintaining 3-6 months of operating expenses in reserves protects against unexpected costs","Separating operational and reserve funds simplifies accounting and accountability","Regular financial reports to membership build trust and encourage timely dues payment",
        ]} />

        <QuickAnswer
          question="How should a small club manage its finances?"
          answer="A small club should manage finances with a clear annual budget, automated dues collection through a platform like Stripe, monthly treasurer reports to the board, separation of duties (one person doesn't control all financial functions), and an annual audit or review. Keep 3-6 months of operating expenses in reserves and use software to automate tracking rather than spreadsheets."
        />

        <QuickAnswer
          question="What financial reports should a club produce?"
          answer="Every club should produce: monthly income/expense statements, quarterly budget-vs-actual comparisons, annual financial summaries for the membership, dues collection status reports, and event-specific profit/loss analyses. Modern club management software can auto-generate most of these reports from transaction data."
        />

        <DefinitionBox
          term="Club Financial Management"
          definition="The planning, organizing, directing, and controlling of a club's monetary resources. Includes budgeting, dues collection, expense tracking, financial reporting, and cash flow management. For small clubs, the key challenge is maintaining transparency and accountability while minimizing the administrative burden on volunteer treasurers."
        />

        {/* Quick Navigation */}
        <div className="bg-muted/50 rounded-lg p-6 mb-12">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Navigation
          </h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <a href="#fundamentals" className="text-primary hover:text-primary/80 transition-colors">
              • Financial Management Fundamentals
            </a>
            <a href="#budgeting" className="text-primary hover:text-primary/80 transition-colors">
              • Budgeting and Forecasting
            </a>
            <a href="#cashflow" className="text-primary hover:text-primary/80 transition-colors">
              • Cash Flow Management
            </a>
            <a href="#reporting" className="text-primary hover:text-primary/80 transition-colors">
              • Financial Reporting and Analysis
            </a>
            <a href="#reserves" className="text-primary hover:text-primary/80 transition-colors">
              • Building Financial Reserves
            </a>
            <a href="#controls" className="text-primary hover:text-primary/80 transition-colors">
              • Financial Controls and Oversight
            </a>
            <a href="#planning" className="text-primary hover:text-primary/80 transition-colors">
              • Long-term Financial Planning
            </a>
            <a href="#implementation" className="text-primary hover:text-primary/80 transition-colors">
              • Implementation Roadmap
            </a>
          </div>
        </div>

        <article className="prose prose-lg  max-w-none">
          {/* Financial Management Fundamentals */}
          <section id="fundamentals" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-primary" />
              Financial Management Fundamentals
            </h2>
            
            <p className="text-lg mb-6">
              Effective financial management is the cornerstone of any successful club. Whether you're managing a small hobby group 
              or a growing organization, establishing solid financial practices early creates the foundation for sustainable growth 
              and member satisfaction.
            </p>

            <div className="bg-destructive/5  border border-destructive/20  rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-destructive  mb-2">
                Club Financial Management Reality Check
              </h4>
              <ul className="space-y-2 text-destructive/80  text-sm">
                <li>• Acquiring new members costs more than retaining existing ones (impacts budget planning)</li>
                <li>• Top-performing clubs maintain strong retention rates through value delivery</li>
                <li>• Many small associations report improving member retention as a top priority</li>
                <li>• Financial transparency directly correlates with member trust and retention</li>
              </ul>
              <p className="text-xs text-destructive/70  mt-3 italic">
                Practical financial patterns to monitor in your own club data
              </p>
            </div>

            <div className="bg-primary/5  border-l-4 border-primary p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-primary">
                The Financial Health Triangle
              </h3>
              <p className="text-primary/80  mb-4">
                Sustainable club finances rest on three pillars: predictable income, controlled expenses, and adequate reserves.
                When these elements work together, your club can weather unexpected challenges and pursue growth opportunities.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <h4 className="font-semibold text-primary  mb-2">Predictable Income</h4>
                  <p className="text-sm text-primary/70">
                    Consistent dues collection, reliable event revenue, and diversified funding sources
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h4 className="font-semibold text-primary  mb-2">Controlled Expenses</h4>
                  <p className="text-sm text-primary/70">
                    Clear spending policies, budget adherence, and cost optimization strategies
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h4 className="font-semibold text-primary  mb-2">Adequate Reserves</h4>
                  <p className="text-sm text-primary/70">
                    Emergency funds, equipment replacement savings, and growth opportunity reserves
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Core Financial Principles for Clubs</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Transparency and Accountability
                </h4>
                <p className="mb-4">
                  Members trust you with their money. Regular financial reporting, clear spending guidelines, and open 
                  communication about financial decisions build confidence and encourage continued participation.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Provide monthly financial summaries to members</li>
                  <li>• Maintain detailed records of all transactions</li>
                  <li>• Require multiple approvals for significant expenses</li>
                  <li>• Conduct annual financial reviews or audits</li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Conservative Financial Planning
                </h4>
                <p className="mb-4">
                  Small clubs benefit from conservative financial approaches. This means planning for lower revenue, 
                  higher expenses, and unexpected costs while building reserves for opportunities and emergencies.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Budget for 10-lower revenue than projected</li>
                  <li>• Include a 5-10% contingency in expense budgets</li>
                  <li>• Maintain 3-6 months of operating expenses in reserves</li>
                  <li>• Plan major purchases 6-12 months in advance</li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Sustainable Growth Mindset
                </h4>
                <p className="mb-4">
                  Financial decisions should support long-term sustainability rather than short-term gains. This means 
                  investing in systems, processes, and capabilities that will serve the club for years to come.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Invest in systems that reduce administrative burden</li>
                  <li>• Build financial processes that scale with membership growth</li>
                  <li>• Balance current member needs with future opportunities</li>
                  <li>• Develop multiple revenue streams to reduce risk</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Budgeting and Forecasting */}
          <section id="budgeting" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Calculator className="w-8 h-8 text-primary" />
              Budgeting and Forecasting
            </h2>
            
            <p className="text-lg mb-6">
              A well-structured budget serves as your club's financial roadmap, guiding spending decisions and helping 
              you plan for the future. Effective budgeting combines historical data, realistic projections, and strategic 
              planning to create a framework for financial success.
            </p>

            <h3 className="text-2xl font-semibold mb-6">The Club Budget Framework</h3>
            
            <div className="bg-muted rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold mb-4">Annual Budget Categories</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-success  mb-3">Revenue Sources</h5>
                  <ul className="space-y-2 text-sm">
                    <li>• Member dues (monthly/annual)</li>
                    <li>• Event fees and registration</li>
                    <li>• Fundraising activities</li>
                    <li>• Sponsorships and partnerships</li>
                    <li>• Merchandise sales</li>
                    <li>• Interest and investment income</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-destructive  mb-3">Expense Categories</h5>
                  <ul className="space-y-2 text-sm">
                    <li>• Venue and facility costs</li>
                    <li>• Equipment and supplies</li>
                    <li>• Event and program expenses</li>
                    <li>• Administrative costs</li>
                    <li>• Insurance and legal fees</li>
                    <li>• Technology and software</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Budget Creation Process</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Analyze Historical Data</h4>
                  <p className="mb-4">
                    Review the previous year's financial performance to understand patterns, seasonal variations, 
                    and areas of over or under-spending. This historical context provides the foundation for realistic projections.
                  </p>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Key Historical Metrics to Track:</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Monthly dues collection rates and patterns</li>
                      <li>• Event attendance and revenue per participant</li>
                      <li>• Seasonal expense variations</li>
                      <li>• Unexpected costs and their frequency</li>
                      <li>• Member retention and acquisition patterns</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Project Revenue Conservatively</h4>
                  <p className="mb-4">
                    Base revenue projections on realistic membership growth, historical collection rates, and market conditions. 
                    It's better to exceed a conservative budget than fall short of optimistic projections.
                  </p>
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Revenue Projection Formula:</h5>
                    <div className="text-sm space-y-2">
                      <p>• Start with current active membership</p>
                      <p>• Apply realistic growth rate (5-15% for established clubs)</p>
                      <p>• Factor in a realistic collection rate for dues</p>
                      <p>• Use conservative estimates for event participation</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Plan Expenses by Priority</h4>
                  <p className="mb-4">
                    Categorize expenses by necessity and impact. Essential expenses ensure basic operations, while 
                    strategic expenses drive growth and member satisfaction.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-destructive/5  p-4 rounded-lg">
                      <h5 className="font-semibold text-destructive  mb-2">Essential (60-70%)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Venue costs</li>
                        <li>• Insurance</li>
                        <li>• Basic supplies</li>
                        <li>• Legal requirements</li>
                      </ul>
                    </div>
                    <div className="bg-warning/10  p-4 rounded-lg">
                      <h5 className="font-semibold text-warning  mb-2">Important (20-25%)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Technology upgrades</li>
                        <li>• Marketing</li>
                        <li>• Member events</li>
                        <li>• Equipment replacement</li>
                      </ul>
                    </div>
                    <div className="bg-success/5  p-4 rounded-lg">
                      <h5 className="font-semibold text-success  mb-2">Desirable (10-15%)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Special programs</li>
                        <li>• Premium equipment</li>
                        <li>• Facility improvements</li>
                        <li>• Growth initiatives</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Build in Contingencies</h4>
                  <p className="mb-4">
                    Include buffers for unexpected expenses and revenue shortfalls. This financial cushion prevents 
                    minor setbacks from becoming major problems.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Recommended Contingency Levels:</h5>
                    <ul className="text-sm space-y-1">
                      <li>• 5-10% contingency for general operations</li>
                      <li>• 15-20% buffer for new or experimental programs</li>
                      <li>• Separate emergency fund for unexpected major expenses</li>
                      <li>• Revenue cushion of 10-15% below projections</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-warning/10  border-l-4 border-warning p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                GatherGrove Integration Opportunity
              </h4>
              <p className="text-warning/90  mb-4">
                GatherGrove's financial management tools can automate much of your budgeting process. The platform
                tracks historical data, projects future revenue based on membership trends, and provides expense
                categorization that aligns with club management best practices.
              </p>
              <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-warning/30 bg-background hover:bg-warning/10 text-warning    h-9 px-3">
                Explore Financial Tools
              </Link>
            </div>
          </section>

          {/* Cash Flow Management */}
          <section id="cashflow" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Cash Flow Management
            </h2>
            
            <p className="text-lg mb-6">
              Cash flow management ensures your club has sufficient funds available when needed, regardless of timing 
              mismatches between income and expenses. Effective cash flow management prevents financial stress and 
              enables strategic decision-making.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Understanding Cash Flow Patterns</h3>
            
            <div className="bg-primary/5  rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold mb-4">Common Club Cash Flow Challenges</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-primary  mb-3">Seasonal Variations</h5>
                  <ul className="space-y-2 text-sm text-primary/80">
                    <li>• Lower participation during holidays</li>
                    <li>• Increased expenses for annual events</li>
                    <li>• Membership renewal cycles</li>
                    <li>• Weather-dependent activity costs</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-primary  mb-3">Timing Mismatches</h5>
                  <ul className="space-y-2 text-sm text-primary/80">
                    <li>• Large upfront event expenses</li>
                    <li>• Annual insurance payments</li>
                    <li>• Equipment purchases</li>
                    <li>• Facility deposits and rentals</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Cash Flow Management Strategies</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  12-Month Cash Flow Forecasting
                </h4>
                <p className="mb-4">
                  Create monthly cash flow projections for the entire year, identifying periods of high and low 
                  cash availability. This visibility enables proactive financial planning.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Monthly Cash Flow Components:</h5>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium mb-2">Opening Balance</h6>
                      <p>Previous month's ending balance</p>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2">Cash Inflows</h6>
                      <p>Dues, events, fundraising</p>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2">Cash Outflows</h6>
                      <p>All planned expenses for the month</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Strategic Payment Timing
                </h4>
                <p className="mb-4">
                  Optimize the timing of expenses and revenue collection to maintain positive cash flow throughout 
                  the year. This involves both accelerating inflows and managing outflow timing.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Accelerate Inflows</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Offer early-pay discounts for annual dues</li>
                      <li>• Require event pre-payment</li>
                      <li>• Implement automated payment systems</li>
                      <li>• Follow up quickly on overdue accounts</li>
                    </ul>
                  </div>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Manage Outflows</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Negotiate payment terms with vendors</li>
                      <li>• Time large purchases for high-cash periods</li>
                      <li>• Spread annual costs across multiple months</li>
                      <li>• Build relationships with flexible suppliers</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Cash Flow Monitoring System
                </h4>
                <p className="mb-4">
                  Implement regular cash flow monitoring to catch potential problems early and make necessary 
                  adjustments before they become critical.
                </p>
                <div className="space-y-4">
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Weekly Cash Flow Check</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Review current account balances</li>
                      <li>• Confirm expected inflows for the week</li>
                      <li>• Verify upcoming payment obligations</li>
                      <li>• Identify any timing adjustments needed</li>
                    </ul>
                  </div>
                  <div className="bg-destructive/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Cash Flow Warning Signals</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Account balance below 30-day expense coverage</li>
                      <li>• Dues collection rate dropping below 85%</li>
                      <li>• Unexpected large expenses arising</li>
                      <li>• Member participation declining significantly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Financial Reporting and Analysis */}
          <section id="reporting" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Financial Reporting and Analysis
            </h2>
            
            <p className="text-lg mb-6">
              Regular financial reporting provides transparency to members and critical insights for leadership. 
              Well-designed reports communicate financial health clearly and support informed decision-making.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Essential Financial Reports</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3">Monthly Financial Summary</h4>
                <p className="mb-4">
                  A concise overview of the month's financial activity, designed for regular member communication. 
                  Focus on key metrics and trends rather than detailed line items.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Monthly Report Components:</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <ul className="space-y-2">
                      <li>• Current account balance</li>
                      <li>• Monthly revenue vs. budget</li>
                      <li>• Monthly expenses vs. budget</li>
                      <li>• Net income/loss for the month</li>
                    </ul>
                    <ul className="space-y-2">
                      <li>• Year-to-date performance</li>
                      <li>• Key financial ratios</li>
                      <li>• Upcoming significant expenses</li>
                      <li>• Notable financial events</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3">Quarterly Financial Analysis</h4>
                <p className="mb-4">
                  Deeper analysis of financial trends, budget performance, and strategic implications. This report 
                  supports leadership planning and major decision-making.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Trend Analysis</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Revenue growth patterns</li>
                      <li>• Expense category changes</li>
                      <li>• Member participation trends</li>
                      <li>• Seasonal impact assessment</li>
                    </ul>
                  </div>
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Budget Variance</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Revenue vs. projections</li>
                      <li>• Expense variance analysis</li>
                      <li>• Budget reforecast recommendations</li>
                      <li>• Cost optimization opportunities</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-secondary  mb-2">Strategic Insights</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Financial sustainability assessment</li>
                      <li>• Growth opportunity analysis</li>
                      <li>• Risk factor identification</li>
                      <li>• Resource allocation recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3">Annual Financial Review</h4>
                <p className="mb-4">
                  Comprehensive year-end analysis that evaluates overall financial performance, validates financial 
                  controls, and establishes the foundation for next year's planning.
                </p>
                <div className="bg-warning/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Annual Review Checklist:</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <ul className="space-y-2">
                      <li>✓ Reconcile all accounts and transactions</li>
                      <li>✓ Verify member dues and payment records</li>
                      <li>✓ Review major expense justifications</li>
                      <li>✓ Assess budget accuracy and process effectiveness</li>
                      <li>✓ Evaluate financial control compliance</li>
                    </ul>
                    <ul className="space-y-2">
                      <li>✓ Calculate key financial ratios and benchmarks</li>
                      <li>✓ Document lessons learned and improvements</li>
                      <li>✓ Prepare financial summary for members</li>
                      <li>✓ Update financial policies and procedures</li>
                      <li>✓ Plan next year's budget and financial goals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4 mt-8">Key Financial Metrics for Clubs</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Operational Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-1">Dues Collection Rate</h5>
                    <p className="text-sm text-muted-foreground mb-2">Percentage of expected dues actually collected</p>
                    <div className="bg-success/20  text-success px-2 py-1 rounded text-sm">
                      Target: strong for healthy clubs
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-1">Cost per Member per Month</h5>
                    <p className="text-sm text-muted-foreground mb-2">Total monthly expenses divided by active members</p>
                    <div className="bg-primary/20  text-primary px-2 py-1 rounded text-sm">
                      Compare to dues revenue per member
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-1">Event ROI</h5>
                    <p className="text-sm text-muted-foreground mb-2">Event revenue minus costs, as percentage of investment</p>
                    <div className="bg-secondary/20  text-secondary px-2 py-1 rounded text-sm">
                      Minimum break-even, ideally strong positive
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Financial Health Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-1">Operating Reserve Ratio</h5>
                    <p className="text-sm text-muted-foreground mb-2">Months of expenses covered by current reserves</p>
                    <div className="bg-success/20  text-success px-2 py-1 rounded text-sm">
                      Target: 3-6 months for stability
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-1">Revenue Diversity Index</h5>
                    <p className="text-sm text-muted-foreground mb-2">Percentage of revenue from largest single source</p>
                    <div className="bg-warning/20  text-warning px-2 py-1 rounded text-sm">
                      Lower is better - avoid over-dependence
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-1">Financial Efficiency Ratio</h5>
                    <p className="text-sm text-muted-foreground mb-2">Administrative costs as percentage of total expenses</p>
                    <div className="bg-primary/20  text-primary px-2 py-1 rounded text-sm">
                      Target: Under 25% for efficiency
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Building Financial Reserves */}
          <section id="reserves" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-primary" />
              Building Financial Reserves
            </h2>
            
            <p className="text-lg mb-6">
              Financial reserves provide security, flexibility, and growth opportunities. Building adequate reserves 
              requires systematic planning and disciplined execution, but the peace of mind and strategic advantages 
              they provide are invaluable.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Types of Financial Reserves</h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 text-destructive">Emergency Fund</h4>
                <p className="text-sm mb-4">
                  Covers unexpected expenses and revenue shortfalls. Should cover 3-6 months of essential operating expenses.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Target Amount:</span>
                    <span className="font-medium">3-6 months expenses</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accessibility:</span>
                    <span className="font-medium">Immediate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span className="font-medium">True emergencies only</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 text-primary">Equipment Reserve</h4>
                <p className="text-sm mb-4">
                  Funds for replacing or upgrading equipment and technology. Prevents unexpected equipment failures from disrupting operations.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Target Amount:</span>
                    <span className="font-medium">Equipment replacement cost</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accessibility:</span>
                    <span className="font-medium">Within 30 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span className="font-medium">Planned replacements</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 text-success">Growth Fund</h4>
                <p className="text-sm mb-4">
                  Investment capital for new programs, facility improvements, or expansion opportunities that require upfront investment.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Target Amount:</span>
                    <span className="font-medium">Variable by opportunity</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accessibility:</span>
                    <span className="font-medium">Planned timing</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span className="font-medium">Strategic investments</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Reserve Building Strategies</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Systematic Reserve Accumulation
                </h4>
                <p className="mb-4">
                  Build reserves gradually through consistent monthly contributions. This approach is sustainable 
                  and doesn't strain current operations while steadily building financial security.
                </p>
                <div className="bg-success/10  p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Monthly Reserve Contribution Formula:</h5>
                  <div className="space-y-2 text-sm">
                    <p><strong>Step 1:</strong> Calculate monthly operating expenses</p>
                    <p><strong>Step 2:</strong> Set reserve target (e.g., 6 months = 6 × monthly expenses)</p>
                    <p><strong>Step 3:</strong> Choose timeline (e.g., build reserves over 2 years = 24 months)</p>
                    <p><strong>Step 4:</strong> Monthly contribution = Reserve target ÷ Timeline months</p>
                  </div>
                  <div className="mt-4 p-3 bg-background rounded border">
                    <p className="text-sm"><strong>Example:</strong> $5,000 monthly expenses × 6 months = $30,000 target</p>
                    <p className="text-sm">$30,000 ÷ 24 months = $1,250 monthly reserve contribution</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Surplus Allocation Strategy
                </h4>
                <p className="mb-4">
                  When your club generates surplus revenue, establish clear priorities for allocation to ensure 
                  both immediate needs and long-term security are addressed.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Priority Allocation Order</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Emergency fund (until 3-month target met)</li>
                      <li>Equipment reserve (planned replacements)</li>
                      <li>Growth opportunities (member value)</li>
                      <li>Extended emergency fund (6-month target)</li>
                      <li>Special projects and improvements</li>
                    </ol>
                  </div>
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Surplus Sources</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Better-than-expected event performance</li>
                      <li>• Membership growth beyond projections</li>
                      <li>• Cost savings from efficiency improvements</li>
                      <li>• One-time donations or sponsorships</li>
                      <li>• Interest earnings on existing reserves</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Reserve Investment Guidelines
                </h4>
                <p className="mb-4">
                  Maximize reserve value through appropriate investment strategies while maintaining the liquidity 
                  and security required for their intended purposes.
                </p>
                <div className="space-y-4">
                  <div className="bg-destructive/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-destructive  mb-2">Emergency Fund Investment</h5>
                    <ul className="text-sm space-y-1">
                      <li>• High-yield savings account (immediate access)</li>
                      <li>• Money market account with debit card access</li>
                      <li>• Short-term CDs (3-6 months maximum)</li>
                      <li>• Avoid any risk of principal loss</li>
                    </ul>
                  </div>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Equipment Reserve Investment</h5>
                    <ul className="text-sm space-y-1">
                      <li>• 6-12 month CDs aligned with replacement timeline</li>
                      <li>• Treasury bills or short-term government bonds</li>
                      <li>• Conservative bond funds for longer-term needs</li>
                      <li>• Laddered investments for predictable timing</li>
                    </ul>
                  </div>
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Growth Fund Investment</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Balanced mutual funds for moderate growth</li>
                      <li>• Target-date funds aligned with project timing</li>
                      <li>• Conservative equity exposure (20-40% maximum)</li>
                      <li>• Professional investment advice for larger amounts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Financial Controls and Oversight */}
          <section id="controls" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-primary" />
              Financial Controls and Oversight
            </h2>
            
            <p className="text-lg mb-6">
              Strong financial controls protect your club's assets, ensure compliance with policies, and maintain 
              member trust. Effective oversight balances security with operational efficiency.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Essential Financial Controls</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Segregation of Duties
                </h4>
                <p className="mb-4">
                  Distribute financial responsibilities among multiple people to prevent errors and reduce fraud risk. 
                  No single person should control all aspects of financial transactions.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Authorization</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Board approval for major expenses</li>
                      <li>• Treasurer authorization for routine costs</li>
                      <li>• Committee chair approval for program expenses</li>
                      <li>• President oversight of all financial decisions</li>
                    </ul>
                  </div>
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Recording</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Secretary maintains meeting minutes</li>
                      <li>• Treasurer records all transactions</li>
                      <li>• Committee chairs track program expenses</li>
                      <li>• Independent review of financial records</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-secondary  mb-2">Custody</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Treasurer manages bank accounts</li>
                      <li>• President as secondary account signer</li>
                      <li>• Separate person handles cash deposits</li>
                      <li>• Board member reviews bank statements</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Approval and Documentation Requirements
                </h4>
                <p className="mb-4">
                  Establish clear thresholds and documentation requirements for different types of expenses. 
                  This ensures appropriate oversight while maintaining operational efficiency.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Expense Approval Thresholds:</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium mb-2 text-success">Under $100 - Treasurer Authorization</h6>
                      <ul className="space-y-1">
                        <li>• Routine supplies and materials</li>
                        <li>• Small venue or utility payments</li>
                        <li>• Documentation: Receipt + expense log</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-warning">$100-$500 - Board Chair Approval</h6>
                      <ul className="space-y-1">
                        <li>• Equipment purchases</li>
                        <li>• Event expenses and deposits</li>
                        <li>• Documentation: Pre-approval + receipts</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-warning">$500-$1500 - Board Vote</h6>
                      <ul className="space-y-1">
                        <li>• Major equipment or software</li>
                        <li>• Facility improvements</li>
                        <li>• Documentation: Proposal + quotes + vote</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-2 text-destructive">Over $1500 - Member Approval</h6>
                      <ul className="space-y-1">
                        <li>• Significant capital expenditures</li>
                        <li>• Major program changes</li>
                        <li>• Documentation: Full proposal + member vote</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Regular Financial Reviews
                </h4>
                <p className="mb-4">
                  Implement systematic review processes to verify financial controls are working effectively 
                  and identify any issues before they become significant problems.
                </p>
                <div className="space-y-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Monthly Review Process</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Bank statement reconciliation by independent reviewer</li>
                      <li>• Expense categorization and budget variance analysis</li>
                      <li>• Dues collection and member account review</li>
                      <li>• Cash handling and deposit verification</li>
                      <li>• Outstanding obligations and commitment tracking</li>
                    </ul>
                  </div>
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Quarterly Control Assessment</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Review compliance with approval thresholds</li>
                      <li>• Assess adequacy of documentation</li>
                      <li>• Evaluate segregation of duties effectiveness</li>
                      <li>• Test internal control procedures</li>
                      <li>• Update financial policies as needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Fraud Prevention Measures
                </h4>
                <p className="mb-4">
                  Implement specific measures to prevent and detect potential fraud. While most club members 
                  are trustworthy, good controls protect everyone and maintain confidence.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-destructive/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-destructive  mb-2">Prevention Strategies</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Require dual signatures on checks over $250</li>
                      <li>• Limit online banking access to 2-3 people</li>
                      <li>• Use locked cash boxes for event collections</li>
                      <li>• Mandate receipts for all reimbursements</li>
                      <li>• Rotate financial duties annually</li>
                    </ul>
                  </div>
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">Detection Methods</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Monthly bank reconciliations by non-signer</li>
                      <li>• Regular review of credit card statements</li>
                      <li>• Compare budget vs. actual expenses</li>
                      <li>• Monitor unusual payment patterns</li>
                      <li>• Annual independent financial review</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Long-term Financial Planning */}
          <section id="planning" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Long-term Financial Planning
            </h2>
            
            <p className="text-lg mb-6">
              Strategic financial planning extends beyond annual budgets to encompass multi-year goals, major 
              investments, and sustainable growth strategies. This long-term perspective enables clubs to make 
              informed decisions that benefit current and future members.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Strategic Financial Planning Framework</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  3-5 Year Financial Roadmap
                </h4>
                <p className="mb-4">
                  Develop a multi-year financial plan that aligns with your club's strategic goals and 
                  anticipates major financial milestones and challenges.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Year 1-2: Foundation</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Establish robust financial controls</li>
                      <li>• Build emergency reserves</li>
                      <li>• Optimize dues collection</li>
                      <li>• Implement reporting systems</li>
                    </ul>
                  </div>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Year 2-4: Growth</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Expand program offerings</li>
                      <li>• Invest in equipment upgrades</li>
                      <li>• Develop additional revenue streams</li>
                      <li>• Build growth reserves</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/10  p-4 rounded-lg">
                    <h5 className="font-semibold text-secondary  mb-2">Year 4-5+: Sustainability</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Evaluate facility ownership</li>
                      <li>• Plan leadership transitions</li>
                      <li>• Consider endowment development</li>
                      <li>• Ensure long-term viability</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Major Investment Planning
                </h4>
                <p className="mb-4">
                  Plan and save for significant purchases or investments that enhance club value and member 
                  experience. Proper planning prevents financial strain and ensures optimal timing.
                </p>
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <h5 className="font-semibold mb-3">Major Investment Categories:</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <ul className="space-y-2">
                      <li><strong>Facility Improvements:</strong> HVAC, flooring, lighting, accessibility upgrades</li>
                      <li><strong>Technology Upgrades:</strong> Audio/visual equipment, management software, networking</li>
                      <li><strong>Program Equipment:</strong> Specialized tools, safety equipment, presentation systems</li>
                    </ul>
                    <ul className="space-y-2">
                      <li><strong>Vehicles/Transportation:</strong> Club vehicles for events or equipment transport</li>
                      <li><strong>Real Estate:</strong> Facility purchase, expansion, or major renovations</li>
                      <li><strong>Legal/Professional:</strong> Trademark, legal structure changes, professional services</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Investment Planning Process</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Identify investment need and impact on club operations</li>
                      <li>Research options and obtain detailed cost estimates</li>
                      <li>Calculate ongoing costs (maintenance, insurance, upgrades)</li>
                      <li>Develop savings timeline and monthly contribution plan</li>
                      <li>Create member communication and approval strategy</li>
                      <li>Plan implementation timeline and change management</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Membership Growth Financial Modeling
                </h4>
                <p className="mb-4">
                  Model the financial implications of membership growth to ensure your club can accommodate 
                  new members while maintaining quality and financial stability.
                </p>
                <div className="space-y-4">
                  <div className="bg-success/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Growth Scenario Planning</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium mb-1">Conservative (5-10% annual)</h6>
                        <p>Focus on retention and steady improvement</p>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1">Moderate (10-25% annual)</h6>
                        <p>Balanced growth with infrastructure investment</p>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1">Aggressive (strong annual)</h6>
                        <p>Rapid expansion requiring significant resources</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-warning/10  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Financial Capacity Planning</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Calculate break-even membership levels</li>
                      <li>• Identify capacity constraints (facility, volunteer time)</li>
                      <li>• Plan infrastructure investments to support growth</li>
                      <li>• Model cash flow impact of rapid membership increases</li>
                      <li>• Develop strategies for managing growth-related expenses</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary/10  border-l-4 border-secondary p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-secondary">
                <TrendingUp className="w-5 h-5" />
                GatherGrove's Financial Planning Tools
              </h4>
              <p className="text-secondary/90  mb-4">
                GatherGrove provides sophisticated financial planning tools that help clubs model different growth
                scenarios, track progress toward financial goals, and make data-driven decisions about investments
                and spending priorities.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-background p-3 rounded">
                  <h5 className="font-semibold mb-2">Scenario Modeling</h5>
                  <p className="text-sm">Test different membership and revenue scenarios to understand financial implications</p>
                </div>
                <div className="bg-background p-3 rounded">
                  <h5 className="font-semibold mb-2">Goal Tracking</h5>
                  <p className="text-sm">Set and monitor progress toward specific financial milestones and investment targets</p>
                </div>
              </div>
              <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-secondary/30 bg-background hover:bg-secondary/10 text-secondary    h-9 px-3">
                Explore Planning Tools
              </Link>
            </div>
          </section>

          {/* Implementation Roadmap */}
          <section id="implementation" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              Implementation Roadmap
            </h2>
            
            <p className="text-lg mb-6">
              Transform your club's financial management with this systematic implementation plan. Each phase 
              builds on the previous one, creating a comprehensive financial management system over 6-12 months.
            </p>

            <div className="space-y-8">
              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                  Foundation Phase (Months 1-2)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Establish basic financial management structure and controls
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Immediate Actions (Week 1-2)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Open dedicated club bank accounts with proper signatories
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Set up basic expense tracking system (spreadsheet or software)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Establish expense approval thresholds and documentation requirements
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Create member dues collection system and payment schedule
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">System Development (Week 3-8)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Develop expense categories aligned with club activities
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Create monthly financial reporting template
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Implement segregation of duties for financial functions
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Train key volunteers on financial procedures
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                  Planning Phase (Months 3-4)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Develop comprehensive budgeting and forecasting capabilities
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Budget Development</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Analyze 6-12 months of historical financial data
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Create detailed annual budget with monthly breakdowns
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Establish budget variance monitoring and reporting
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Develop 12-month cash flow projection
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Strategic Planning</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Set financial goals and key performance indicators
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Plan major purchases and investments for the year
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Begin systematic reserve fund accumulation
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Develop contingency plans for budget shortfalls
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                  Optimization Phase (Months 5-8)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Refine processes, improve efficiency, and build advanced capabilities
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Process Improvement</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Automate routine financial processes where possible
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Implement quarterly financial review and analysis
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Enhance member communication about financial status
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Optimize dues collection and payment processing
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Advanced Capabilities</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Develop financial dashboard and key metrics tracking
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Create investment strategy for reserve funds
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Establish vendor relationships and payment terms
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Plan for annual independent financial review
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                  Maturity Phase (Months 9-12)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Achieve advanced financial management and long-term planning capabilities
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Strategic Enhancement</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Develop 3-5 year financial strategic plan
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Create comprehensive financial policies manual
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Establish benchmarking against similar organizations
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Plan leadership succession for financial roles
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Continuous Improvement</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Conduct annual financial system review and update
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Evaluate and implement new financial technologies
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Document lessons learned and best practices
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Share financial management expertise with other clubs
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-success/10  border-l-4 border-success p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5" />
                Success Metrics and Milestones
              </h4>
              <p className="text-success/90  mb-4">
                Track your progress with these key indicators of financial management maturity:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Financial Health Indicators</h5>
                  <ul className="text-sm space-y-1">
                    <li>• strong dues collection rate</li>
                    <li>• 3+ months operating reserves</li>
                    <li>• Budget variance under 10%</li>
                    <li>• Monthly financial reporting to members</li>
                  </ul>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Operational Excellence</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Automated payment processing</li>
                    <li>• Real-time financial dashboard</li>
                    <li>• Annual independent review</li>
                    <li>• Member satisfaction with transparency</li>
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
