import type { Metadata } from "next";
import { BookOpen, ArrowLeft, ArrowRight, Star, Clock } from "lucide-react";
import Link from "next/link";
import { MinimalistHeader } from "@/components/shared/MinimalistHeader";
import { Footer } from "@/components/shared/Footer";
import { ResourceFilter } from "@/components/shared/ResourceFilter";
import { HubCrossLinks } from "@/components/pseo/HubCrossLinks";
import { FunnelCta } from "@/components/pseo/FunnelCta";

import { SEED_MONTHLY_PRICE_COPY, SEED_MONTHLY_SHORT_COPY } from '@/lib/pricing';
export const metadata: Metadata = {
  title: { absolute: 'Free Club Management Resources & Guides | GatherGrove' },
  description:
    'Free guides, templates, and resources for club administrators. Expert advice on member retention, dues collection, event planning, and more.',
  alternates: { canonical: '/resources' },
  openGraph: {
    title: 'Free Club Management Resources & Guides | GatherGrove',
    description:
      'Free guides, templates, and resources for club administrators. Expert advice on member retention, dues collection, event planning, and more.',
    url: 'https://www.gathergrove.club/resources',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Club Management Resources & Guides | GatherGrove',
    description:
      'Free guides, templates, and resources for club administrators. Expert advice on member retention, dues collection, event planning, and more.',
  },
};

export default function ResourcesPage() {
  const featuredGuide = {
    title: "The Complete Guide to Club Management",
    description: "Our flagship 8,000+ word comprehensive guide covering everything from member management to financial planning. The ultimate resource for hobby club administrators.",
    readTime: "30 min read",
    category: "Ultimate Guide",
    href: "/resources/complete-guide-club-management",
    featured: true
  };

  const resources = [
    {
      title: "Member Retention Strategies That Actually Work",
      description: "Evidence-based approaches to keep members engaged and reduce churn in hobby clubs.",
      category: "Best Practices",
      readTime: "8 min read",
      href: "/resources/member-retention-strategies"
    },
    {
      title: "Modern Dues Collection Best Practices",
      description: "Proven strategies to improve payment collection rates and streamline financial management.",
      category: "Financial Management",
      readTime: "12 min read",
      href: "/resources/modern-dues-collection-best-practices"
    },
    {
      title: "Event Planning Mastery for Club Administrators",
      description: "Complete guide to planning, promoting, and executing successful club events.",
      category: "Event Planning",
      readTime: "15 min read",
      href: "/resources/event-planning-mastery"
    },
    {
      title: "Digital Communication Tools for Clubs",
      description: "Use email, push alerts, apps, and chat. Keep members in the loop.",
      category: "Communication",
      readTime: "14 min read",
      href: "/resources/digital-communication-tools"
    },
    {
      title: "Leadership and Governance Frameworks",
      description: "Build sustainable leadership structures and governance processes for growing clubs.",
      category: "Leadership & Governance",
      readTime: "16 min read",
      href: "/resources/leadership-governance-frameworks"
    },
    {
      title: "New Member Onboarding Best Practices",
      description: "Transform new member integration with systematic onboarding that increases retention.",
      category: "Member Onboarding",
      readTime: "13 min read",
      href: "/resources/new-member-onboarding-best-practices"
    },
    {
      title: "Community Building Strategies",
      description: "Create vibrant, connected communities that members are passionate about supporting.",
      category: "Community Building",
      readTime: "17 min read",
      href: "/resources/community-building-strategies"
    },
    {
      title: "Financial Management for Small Clubs",
      description: "Comprehensive financial planning, budgeting, reporting, and cash flow management strategies.",
      category: "Financial Management",
      readTime: "18 min read",
      href: "/resources/financial-management-for-small-clubs"
    },
    {
      title: "Crisis Management and Emergency Planning",
      description: "Prepare for and respond to emergencies, conflicts, and unexpected challenges effectively.",
      category: "Crisis Management",
      readTime: "16 min read",
      href: "/resources/crisis-management-and-emergency-planning"
    },
    {
      title: "Technology Integration Best Practices",
      description: "Leverage modern tools and platforms to streamline operations and enhance member experience.",
      category: "Technology",
      readTime: "15 min read",
      href: "/resources/technology-integration-best-practices"
    },
    {
      title: "Volunteer Management and Leadership Development",
      description: "Recruit, train, and retain volunteers while developing future club leaders.",
      category: "Leadership Development",
      readTime: "17 min read",
      href: "/resources/volunteer-management-and-leadership-development"
    },
    {
      title: "Annual Planning and Strategic Goal Setting",
      description: "Create comprehensive annual plans that align club activities with long-term objectives.",
      category: "Strategic Planning",
      readTime: "20 min read",
      href: "/resources/annual-planning-and-strategic-goal-setting"
    },
    {
      title: "Club Management Template Library",
      description: "20+ professional templates including welcome emails, event invitations, payment reminders, and planning checklists.",
      category: "Templates",
      readTime: "Download",
      href: "/resources/template-library"
    },
    {
      title: "Fundraising Ideas for Clubs and Nonprofits",
      description: "Practical fundraising ideas for clubs, associations, and nonprofits of every size. From classic bake sales to digital crowdfunding campaigns, find the right fundraiser for your group's goals and capacity.",
      category: "Financial Management",
      readTime: "18 min read",
      href: "/resources/fundraising-ideas-for-clubs-and-nonprofits"
    },
    {
      title: "How Nonprofits Make Money",
      description: "A clear explanation of the eight main revenue streams nonprofits use - from membership dues and individual donations to grants, sponsorships, and earned income.",
      category: "Financial Management",
      readTime: "14 min read",
      href: "/resources/how-nonprofits-make-money"
    }
  ];

  interface UpcomingResource {
    title: string;
    description: string;
    category: string;
  }

  const upcomingResources: UpcomingResource[] = [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MinimalistHeader />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Free Club Management Resources
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                  Everything You Need to Run a Successful Club
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Comprehensive guides, proven strategies, and ready-to-use templates to help hobby club 
                  administrators streamline operations and build thriving communities.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="#featured-guide"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-md px-8 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <BookOpen className="w-5 h-5" />
                  Start with Our Complete Guide
                </Link>
                <Link 
                  href="/"
                  className="inline-flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 rounded-md px-8 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to GatherGrove
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4+ Hours</div>
                  <div className="text-sm text-muted-foreground">of Expert Reading</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">15</div>
                  <div className="text-sm text-muted-foreground">Expert Guides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">From {SEED_MONTHLY_SHORT_COPY}</div>
                  <div className="text-sm text-muted-foreground">After Free Trial</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Guide Section */}
  <section id="featured-guide" className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Featured Resource
                </h2>
                <p className="text-lg text-muted-foreground">
                  Start here for the most comprehensive club management guidance
                </p>
              </div>

              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 lg:p-12 border">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          {featuredGuide.category}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {featuredGuide.readTime}
                        </div>
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-bold">
                        {featuredGuide.title}
                      </h3>
                    </div>
                    
                    <p className="text-lg text-muted-foreground">
                      {featuredGuide.description}
                    </p>

                    <div className="space-y-4">
                      <div className="text-sm">
                        <strong>What you&apos;ll learn:</strong>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                          <li>• Member recruitment and retention strategies</li>
                          <li>• Modern dues collection and financial management</li>
                          <li>• Event planning and community engagement</li>
                          <li>• Multi-channel communication best practices</li>
                          <li>• Leadership and governance frameworks</li>
                        </ul>
                      </div>

                      <Link 
                        href={featuredGuide.href}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-md px-8 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto"
                      >
                        Read the Complete Guide
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="lg:order-first">
  <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <BookOpen className="w-8 h-8 text-primary" />
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={`star-${i}`} className="w-4 h-4 fill-warning text-warning" />
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Complete Club Management Guide</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Length:</span>
                              <span>8,000+ words</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reading time:</span>
                              <span>30 minutes</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Chapters:</span>
                              <span>8 detailed sections</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Difficulty:</span>
                              <span>Beginner to Advanced</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full w-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Resources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Available Resources
                </h2>
                <p className="text-lg text-muted-foreground">
                  Additional guides and tools to help you succeed
                </p>
              </div>

              <ResourceFilter resources={resources} />
            </div>
          </div>
        </section>

        {upcomingResources.length > 0 && (
          /* Coming Soon */
  <section className="py-16 bg-card">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                    Coming Soon
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    More comprehensive guides are in development
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingResources.map((resource, index) => (
                    <div key={resource.title || `upcoming-${index}`} className="bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20 p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs font-medium bg-warning/10 text-warning px-2 py-1 rounded">
                            {resource.category}
                          </span>
                          <h3 className="text-lg font-semibold text-muted-foreground">
                            {resource.title}
                          </h3>
                        </div>
                        
                        <p className="text-sm text-muted-foreground/80">
                          {resource.description}
                        </p>
                        
                        <div className="text-xs text-muted-foreground">
                          📝 In development
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Ready to Transform Your Club Management?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Put these strategies into action with GatherGrove&apos;s comprehensive club management platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-md px-8 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/"
                  className="inline-flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 rounded-md px-8 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  Learn More About GatherGrove
                </Link>
              </div>
              
              <p className="text-sm text-muted-foreground">
                30-day free trial • Plans from {SEED_MONTHLY_PRICE_COPY} • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      <HubCrossLinks currentHub="resources" />
      <FunnelCta currentStage="tofu" />

      <Footer />
    </div>
  );
}
