"use client";

import { useState } from "react";
import { Download, FileText, Mail, Calendar, CreditCard, Users, ClipboardList } from "lucide-react";
import Link from "next/link";
import { KeyTakeaways } from "@/components/seo/KeyTakeaways";
import { ArticleHeader } from "@/components/seo/ArticleHeader";
import { ResourceArticleJsonLd } from "@/components/seo/ResourceArticleJsonLd";
import { QuickAnswer } from "@/components/seo/QuickAnswer";
import { DefinitionBox } from "@/components/seo/DefinitionBox";
import { getResourceBySlug } from "@/lib/data/resources";
import { TemplateDownloadModal } from "@/components/marketing/TemplateDownloadModal";
import { marketingService } from "@/services/marketingService";
import { ResourceArticleFooter } from "@/components/seo/ResourceArticleFooter";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SESSION_EMAIL_KEY = 'gathergrove-template-email';

export default function TemplateLibrary() {
  const resource = getResourceBySlug('template-library')!;
  const [selectedTemplate, setSelectedTemplate] = useState<{ title: string; slug: string; format: string } | null>(null);

  const templateCategories = [
    {
      icon: Mail,
      title: "Communication Templates",
      description: "Professional email templates for common club communications",
      templates: [
        {
          title: "Welcome Email for New Members",
          slug: "welcome-email-new-members",
          description: "Warm, informative welcome email template that helps new members feel connected and provides essential club information.",
          format: "Email Template",
          usage: "Member onboarding",
        },
        {
          title: "Event Invitation Email",
          slug: "event-invitation-email",
          description: "Engaging event invitation template with RSVP tracking and clear event details to maximize attendance.",
          format: "Email Template",
          usage: "Event promotion",
        },
        {
          title: "Payment Reminder Sequence",
          slug: "payment-reminder-sequence",
          description: "Professional 3-part email sequence for dues reminders: friendly reminder, formal notice, and final notice.",
          format: "Email Templates (3)",
          usage: "Dues collection",
        },
        {
          title: "Member Newsletter Template",
          slug: "member-newsletter-template",
          description: "Monthly newsletter template featuring club news, upcoming events, member spotlights, and community updates.",
          format: "Email Template",
          usage: "Regular communication",
        },
        {
          title: "Crisis Communication Templates",
          slug: "crisis-communication-templates",
          description: "Emergency communication templates for event cancellations, safety alerts, and urgent club announcements.",
          format: "Email Templates (4)",
          usage: "Crisis management",
        }
      ]
    },
    {
      icon: Calendar,
      title: "Event Planning Resources",
      description: "Comprehensive planning tools for successful club events",
      templates: [
        {
          title: "Master Event Planning Checklist",
          slug: "master-event-planning-checklist",
          description: "Complete 60-day event planning checklist covering venue, promotion, logistics, and post-event follow-up.",
          format: "PDF Checklist",
          usage: "Event coordination",
        },
        {
          title: "Event Budget Planning Spreadsheet",
          slug: "event-budget-planning-spreadsheet",
          description: "Template for tracking event expenses, revenue, and ROI with built-in formulas and budget categories.",
          format: "PDF Template",
          usage: "Financial planning",
        },
        {
          title: "RSVP Tracking Sheet",
          slug: "rsvp-tracking-sheet",
          description: "Template for manual RSVP tracking with attendance monitoring and contact management.",
          format: "PDF Template",
          usage: "Attendance management",
        },
        {
          title: "Post-Event Feedback Survey",
          slug: "post-event-feedback-survey",
          description: "Professional feedback survey template to gather member insights and improve future events.",
          format: "PDF Template",
          usage: "Event improvement",
        }
      ]
    },
    {
      icon: CreditCard,
      title: "Financial Management Tools",
      description: "Templates for dues collection, budgeting, and financial tracking",
      templates: [
        {
          title: "Annual Budget Planning Template",
          slug: "annual-budget-planning-template",
          description: "Comprehensive template for club budget planning with income/expense categories and variance tracking.",
          format: "PDF Template",
          usage: "Financial planning",
        },
        {
          title: "Dues Collection Tracking Sheet",
          slug: "dues-collection-tracking-sheet",
          description: "Member dues tracking template with payment status, reminder dates, and collection rate analytics.",
          format: "PDF Template",
          usage: "Payment tracking",
        },
        {
          title: "Financial Transparency Report",
          slug: "financial-transparency-report",
          description: "Template for monthly/quarterly financial reports to share with club members for transparency.",
          format: "PDF Template",
          usage: "Member communication",
        },
        {
          title: "Expense Reimbursement Form",
          slug: "expense-reimbursement-form",
          description: "Professional form for club members to request reimbursement for approved club expenses.",
          format: "PDF Form",
          usage: "Expense management",
        }
      ]
    },
    {
      icon: Users,
      title: "Member Management Resources",
      description: "Tools for recruitment, onboarding, and retention",
      templates: [
        {
          title: "Member Information Form",
          slug: "member-information-form",
          description: "Comprehensive intake form to collect member contact details, interests, and communication preferences.",
          format: "PDF Form",
          usage: "Member onboarding",
        },
        {
          title: "Member Onboarding Checklist",
          slug: "member-onboarding-checklist",
          description: "30-60-90 day onboarding checklist to ensure new members feel welcome and integrated into the club.",
          format: "PDF Checklist",
          usage: "New member integration",
        },
        {
          title: "Member Satisfaction Survey",
          slug: "member-satisfaction-survey",
          description: "Annual survey template to assess member satisfaction and gather improvement suggestions.",
          format: "PDF Template",
          usage: "Retention strategy",
        },
        {
          title: "Member Directory Template",
          slug: "member-directory-template",
          description: "Privacy-conscious directory template for sharing member contact information with consent.",
          format: "PDF Template",
          usage: "Community building",
        }
      ]
    },
    {
      icon: ClipboardList,
      title: "Administrative Templates",
      description: "Meeting agendas, policies, and governance documents",
      templates: [
        {
          title: "Club Meeting Agenda Template",
          slug: "club-meeting-agenda-template",
          description: "Professional meeting agenda template with time allocations and action item tracking.",
          format: "PDF Template",
          usage: "Meeting management",
        },
        {
          title: "Club Bylaws Template",
          slug: "club-bylaws-template",
          description: "Comprehensive bylaws template covering governance, membership, finances, and decision-making processes.",
          format: "PDF Template",
          usage: "Governance",
        },
        {
          title: "Volunteer Role Descriptions",
          slug: "volunteer-role-descriptions",
          description: "Template job descriptions for common club volunteer positions including expectations and time commitments.",
          format: "PDF Template",
          usage: "Leadership development",
        },
        {
          title: "Annual Report Template",
          slug: "annual-report-template",
          description: "Professional annual report template showcasing club achievements, finances, and future plans.",
          format: "PDF Template",
          usage: "Transparency reporting",
        }
      ]
    }
  ];

  const handleDownload = (template: { title: string; slug: string; format: string }) => {
    const savedEmail = sessionStorage.getItem(SESSION_EMAIL_KEY);
    if (savedEmail) {
      // Email already captured this session - download directly
      marketingService.downloadTemplate(template.slug);
    } else {
      setSelectedTemplate(template);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ResourceArticleJsonLd resource={resource} />
      {/* Navigation */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { name: 'Home', href: '/' },
            { name: 'Resources', href: '/resources' },
            { name: resource.title, href: `/resources/${resource.slug}` },
          ]} />
        </div>
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="text-center space-y-6 mb-16">
          <ArticleHeader
            category="Template Library"
            dateModified={resource.dateModified}
            title="Club Management Template Library"
            description="Professional, ready-to-use templates for every aspect of club management. Save hours of administrative work with our comprehensive collection of proven communication templates, planning checklists, and organizational tools."
            readTime={resource.readTime}
          />

          <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold mb-4">What's Included in This Library</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-primary text-lg">8+</div>
                <div className="text-muted-foreground">Email Templates</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary text-lg">6+</div>
                <div className="text-muted-foreground">Planning Tools</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary text-lg">4+</div>
                <div className="text-muted-foreground">Financial Forms</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary text-lg">6+</div>
                <div className="text-muted-foreground">Admin Documents</div>
              </div>
            </div>
          </div>
        </header>

        <KeyTakeaways takeaways={[
          "Professional templates save hours on routine communications and planning",
          "Consistent branding across all member touchpoints builds organizational credibility",
          "Customizable templates adapt to any club type while maintaining best-practice structure",
          "A comprehensive template library covers the full member lifecycle from welcome to renewal",
        ]} />

        <QuickAnswer
          question="What templates do club administrators need?"
          answer="Club administrators need templates for: welcome emails (new member onboarding), payment reminders (dues collection), event invitations (RSVP management), meeting agendas (board governance), annual reports (financial transparency), volunteer sign-up forms (coordination), and survey questionnaires (member feedback). Having ready-made templates saves admin time on communications."
        />
        <QuickAnswer
          question="How do I write effective club emails?"
          answer="Write effective club emails by keeping subject lines under 50 characters with a clear benefit, personalizing the greeting, leading with the most important information, including a single clear call-to-action, and keeping the body under 200 words. Use a consistent template with your club's branding for recognition. Test send times to find when your members are most responsive."
        />
        <DefinitionBox
          term="Email Template"
          definition="A pre-designed, reusable email format with placeholder content that can be customized for specific purposes. Club management templates typically include welcome series emails, payment reminders, event invitations, newsletter layouts, and survey distributions - saving administrators from writing each communication from scratch."
        />

        {/* Template Categories */}
        <div className="space-y-16">
          {templateCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <section key={categoryIndex} className="space-y-8">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{category.title}</h2>
                    <p className="text-lg text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.templates.map((template, templateIndex) => (
                    <div key={templateIndex} className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold leading-tight">{template.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-muted text-muted-foreground px-2 py-1 rounded">
                              {template.format}
                            </span>
                            <span className="text-muted-foreground">
                              for {template.usage}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {template.description}
                        </p>
                        
                        <button
                          onClick={() => handleDownload({ title: template.title, slug: template.slug, format: template.format })}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Usage Instructions */}
        <section className="mt-20 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">How to Use These Templates</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our templates are designed to be customized for your specific club needs while maintaining 
              professional standards and best practices.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Download and Customize</h3>
              <p className="text-sm text-muted-foreground">
                Download templates in your preferred format and customize with your club's specific information, 
                branding, and requirements.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Implement and Test</h3>
              <p className="text-sm text-muted-foreground">
                Use templates with a small group first to ensure they work well for your club's culture 
                and communication style.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Refine and Scale</h3>
              <p className="text-sm text-muted-foreground">
                Gather feedback from your club members and continuously improve the templates to better 
                serve your community's needs.
              </p>
            </div>
          </div>
        </section>

        {/* Integration with GatherGrove */}
        <section className="mt-20">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-2xl font-bold">Automate These Templates with GatherGrove</h2>
              <p className="text-muted-foreground">
                While these templates provide a great foundation, GatherGrove automates many of these processes 
                for you. Instead of managing templates manually, our platform provides built-in automation for 
                member communications, payment reminders, event invitations, and more.
              </p>
              
              <div className="bg-card rounded-lg p-6 text-left">
                <h3 className="font-semibold mb-3">GatherGrove Automated Features:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <ul className="space-y-2">
                    <li>• Automated welcome email sequences for new members</li>
                    <li>• Payment reminder automation with custom schedules</li>
                    <li>• Event invitation emails with one-click RSVP</li>
                    <li>• Member onboarding workflow automation</li>
                  </ul>
                  <ul className="space-y-2">
                    <li>• Financial reporting and transparency dashboards</li>
                    <li>• Member communication preference management</li>
                    <li>• Email, push alerts, and chat in one place</li>
                    <li>• Mobile app access for members and administrators</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                    Start Free Trial
                </Link>
                <Link href="/resources/complete-guide-club-management" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8">
                    <FileText className="w-4 h-4 mr-2" />
                    Read Complete Guide
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ResourceArticleFooter resource={resource} />
      </div>

      <TemplateDownloadModal
        isOpen={selectedTemplate !== null}
        onClose={() => setSelectedTemplate(null)}
        template={selectedTemplate}
      />
    </div>
  );
}
