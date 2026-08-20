using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using GatherGrove.Application.Generated;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for generating PDF documents using QuestPDF (MIT license)
/// </summary>
public class PdfGenerationService : IPdfGenerationService
{
    private readonly ILogger<PdfGenerationService> _logger;

    public PdfGenerationService(ILogger<PdfGenerationService> logger)
    {
        _logger = logger;

        // Configure QuestPDF license
        QuestPDF.Settings.License = LicenseType.Community;
    }

    /// <summary>
    /// Generate the Club Management Checklist PDF
    /// </summary>
    public async Task<byte[]> GenerateClubManagementChecklistPdfAsync()
    {
        var content = GetClubManagementChecklistContent();
        return await GenerateMarkdownToPdfAsync("Ultimate Club Management Checklist", content);
    }

    /// <summary>
    /// Generate a template PDF by slug
    /// </summary>
    public async Task<byte[]> GenerateTemplatePdfAsync(string slug)
    {
        var (title, content) = GetTemplateContent(slug);
        return await GenerateMarkdownToPdfAsync(title, content);
    }

    private static (string title, string content) GetTemplateContent(string slug)
    {
        return slug switch
        {
            "welcome-email-new-members" => ("Welcome Email for New Members", GetWelcomeEmailContent()),
            "master-event-planning-checklist" => ("Master Event Planning Checklist", GetEventPlanningChecklistContent()),
            "annual-budget-planning-template" => ("Annual Budget Planning Template", GetAnnualBudgetContent()),
            "member-onboarding-checklist" => ("Member Onboarding Checklist", GetMemberOnboardingChecklistContent()),
            "club-bylaws-template" => ("Club Bylaws Template", GetClubBylawsContent()),
            _ => GetPlaceholderContent(slug)
        };
    }

    private static (string, string) GetPlaceholderContent(string slug)
    {
        var title = System.Globalization.CultureInfo.CurrentCulture.TextInfo
            .ToTitleCase(slug.Replace('-', ' '));
        var content = $@"# {title}

Thank you for downloading this template from GatherGrove.

## Full Template Coming Soon

We are currently preparing the full version of this template. The complete document will include:

- Step-by-step instructions tailored to club management
- Customisable sections for your club's specific needs
- Best-practice guidance based on common club requirements
- Ready-to-use format you can adapt immediately

## In the Meantime

GatherGrove automates many of the processes these templates address. Our platform provides built-in tools for:

- Member communications and email automation
- Event planning and RSVP management
- Dues collection and financial tracking
- Member onboarding workflows

---

**Get started free at www.gathergrove.club**";
        return (title, content);
    }

    private static string GetWelcomeEmailContent()
    {
        return @"# Welcome Email for New Members

## How to Use This Template

Copy this email into your email platform, replace the placeholder text in [brackets], and send it to new members within 24 hours of joining.

---

## Template

**Subject:** Welcome to [Club Name] — Here's everything you need to know

Hi [First Name],

Welcome to [Club Name]! We are thrilled to have you as our newest member.

Here is everything you need to get started:

## Your Membership Details

- **Member since:** [Join Date]
- **Membership type:** [Membership Type]
- **Annual dues:** [Dues Amount] (next payment due [Due Date])

## What Happens Next

- [ ] Watch your inbox for your membership card (sent separately)
- [ ] Join our member directory at [Directory Link]
- [ ] Introduce yourself in [Communication Channel]
- [ ] Save the date for our next event: [Next Event Date and Name]

## Club Resources

- **Website:** [Club Website URL]
- **Member portal:** [Portal URL]
- **Calendar of events:** [Calendar URL]
- **Club rules and handbook:** [Handbook URL]

## Meet Your Club Leadership

- **President:** [President Name] — [President Email]
- **Secretary:** [Secretary Name] — [Secretary Email]
- **Membership coordinator:** [Coordinator Name] — [Coordinator Email]

## Questions?

Reply to this email or contact us at [Support Email]. We are here to help.

We look forward to seeing you at our next event!

Warm regards,

[Your Name]
[Your Title]
[Club Name]
[Contact Details]

---

*You received this email because you recently joined [Club Name]. To update your communication preferences, visit [Preferences URL].*

---

## Customisation Tips

- **Personalise early:** Use the member's first name in the subject line if your email platform supports merge tags.
- **Keep it short:** Members rarely read long welcome emails. Link to resources rather than explaining everything inline.
- **Include one clear next step:** The most effective welcome emails focus on a single action (e.g., joining the member directory).
- **Send within 24 hours:** Response rates and engagement drop significantly after the first day.";
    }

    private static string GetEventPlanningChecklistContent()
    {
        return @"# Master Event Planning Checklist

A complete 60-day checklist for planning successful club events. Work through each section in sequence, adapting tasks to your event's scale and format.

---

## 60 Days Before the Event

### Logistics
- [ ] Define event purpose and target audience
- [ ] Set provisional date and confirm no conflicts with major local events
- [ ] Establish a budget with 10–15% contingency
- [ ] Identify and shortlist venues
- [ ] Draft event brief for stakeholder approval

### Administration
- [ ] Assign event lead and supporting roles
- [ ] Create a shared project folder for all documents
- [ ] Set up a communication channel for the planning team

---

## 45 Days Before the Event

### Venue and Suppliers
- [ ] Confirm venue booking with signed contract
- [ ] Book catering (if required) — confirm dietary options
- [ ] Arrange audio-visual equipment
- [ ] Confirm parking and accessibility arrangements
- [ ] Book guest speakers or entertainment (if applicable)

### Promotion
- [ ] Draft event announcement copy
- [ ] Design promotional assets (poster, social images, email header)
- [ ] Open registration and publish event page
- [ ] Send save-the-date to member mailing list

---

## 30 Days Before the Event

### Communications
- [ ] Send formal invitation email to all members
- [ ] Post event announcement on club social media
- [ ] Share event in club newsletter
- [ ] Follow up personally with key members or guests

### Operations
- [ ] Finalise run-of-show schedule (minute-by-minute)
- [ ] Confirm headcount with venue and catering
- [ ] Arrange volunteers and brief them on roles
- [ ] Prepare registration and check-in materials

---

## 14 Days Before the Event

### Final Confirmations
- [ ] Send reminder email to registered attendees
- [ ] Reconfirm all supplier bookings
- [ ] Finalise printed materials (programmes, name badges, signage)
- [ ] Brief all volunteers on the schedule and their responsibilities
- [ ] Prepare a contingency plan for low attendance or weather issues

---

## 7 Days Before the Event

### Pre-Event Checks
- [ ] Conduct venue walk-through
- [ ] Test all audio-visual equipment
- [ ] Confirm final headcount and communicate to catering
- [ ] Send final reminder to attendees with directions and parking info
- [ ] Prepare cash float or card reader (if ticket sales or merchandise)

---

## Day of the Event

### Setup (3+ hours before start)
- [ ] Arrive at venue with enough time to set up
- [ ] Set up registration desk with name badge list
- [ ] Test microphones, projectors, and other equipment
- [ ] Place signage at venue entrance and key areas
- [ ] Brief all volunteers on final schedule

### During the Event
- [ ] Monitor registration and attendee flow
- [ ] Manage timing against the run-of-show schedule
- [ ] Take photos for post-event communications
- [ ] Collect any outstanding payments

### Wrap-Up
- [ ] Thank speakers, sponsors, and volunteers
- [ ] Return venue to agreed condition
- [ ] Collect and secure any cash or equipment

---

## Within 48 Hours After the Event

### Follow-Up
- [ ] Send thank-you email to attendees
- [ ] Post event highlights on social media
- [ ] Thank guest speakers and sponsors individually
- [ ] Upload photos to member area (with consent)

### Debrief
- [ ] Hold brief team debrief (30 minutes maximum)
- [ ] Record attendance figures and key metrics
- [ ] Note what worked and what to change next time
- [ ] Update event budget with final actual costs

---

## Within 2 Weeks After the Event

### Reporting
- [ ] Distribute post-event feedback survey
- [ ] Compile attendance and financial report
- [ ] Share event summary with club leadership
- [ ] Archive all event documents in shared folder
- [ ] Begin planning for the next event

---

**Need help automating your event management?**

GatherGrove handles online registration, automated reminders, RSVP tracking, and post-event surveys — so you can focus on delivering a great experience.

**www.gathergrove.club**";
    }

    private static string GetAnnualBudgetContent()
    {
        return @"# Annual Budget Planning Template

Use this template to plan your club's finances for the coming year. Complete each section in order, starting with your expected income, then planning expenses to match.

---

## Instructions

1. Fill in the **previous year actuals** column first (from your records).
2. Set **targets for the coming year** based on your goals and expected changes.
3. Review the **variance** column monthly and adjust spending as needed.
4. Share the approved budget with all club leaders before the year begins.

---

## Income Budget

### Membership Dues

| Income Source | Previous Year | Budget This Year | Notes |
|---|---|---|---|
| Full membership dues | [Amount] | [Amount] | [e.g., 120 members × £50] |
| Concession/student dues | [Amount] | [Amount] | [e.g., 15 members × £25] |
| New member joining fees | [Amount] | [Amount] | [Projected new members] |
| Late payment fees | [Amount] | [Amount] | |
| **Dues subtotal** | | | |

### Events and Activities

| Income Source | Previous Year | Budget This Year | Notes |
|---|---|---|---|
| Event ticket sales | [Amount] | [Amount] | |
| Merchandise sales | [Amount] | [Amount] | |
| Venue hire income | [Amount] | [Amount] | [If you rent out your facility] |
| **Events subtotal** | | | |

### Grants and Donations

| Income Source | Previous Year | Budget This Year | Notes |
|---|---|---|---|
| Local authority grants | [Amount] | [Amount] | |
| National governing body grants | [Amount] | [Amount] | |
| Corporate sponsorship | [Amount] | [Amount] | |
| Individual donations | [Amount] | [Amount] | |
| **Grants subtotal** | | | |

### **Total Projected Income: [Sum]**

---

## Expenditure Budget

### Administration

| Expense | Previous Year | Budget This Year | Notes |
|---|---|---|---|
| Insurance | [Amount] | [Amount] | |
| Accounting/bookkeeping | [Amount] | [Amount] | |
| Software subscriptions | [Amount] | [Amount] | [e.g., GatherGrove, email platform] |
| Postage and printing | [Amount] | [Amount] | |
| Bank charges | [Amount] | [Amount] | |
| **Admin subtotal** | | | |

### Events and Activities

| Expense | Previous Year | Budget This Year | Notes |
|---|---|---|---|
| Venue hire | [Amount] | [Amount] | |
| Catering | [Amount] | [Amount] | |
| Equipment hire | [Amount] | [Amount] | |
| Speakers and entertainment | [Amount] | [Amount] | |
| Prizes and awards | [Amount] | [Amount] | |
| **Events subtotal** | | | |

### Communications and Marketing

| Expense | Previous Year | Budget This Year | Notes |
|---|---|---|---|
| Website hosting | [Amount] | [Amount] | |
| Email marketing | [Amount] | [Amount] | |
| Social media advertising | [Amount] | [Amount] | |
| Design and creative | [Amount] | [Amount] | |
| **Comms subtotal** | | | |

### Equipment and Facilities

| Expense | Previous Year | Budget This Year | Notes |
|---|---|---|---|
| Equipment purchases | [Amount] | [Amount] | |
| Equipment maintenance/repair | [Amount] | [Amount] | |
| Storage costs | [Amount] | [Amount] | |
| **Equipment subtotal** | | | |

### Contingency Reserve

| Item | Amount | Notes |
|---|---|---|
| Emergency contingency (10%) | [10% of total income] | Do not spend unless essential |

### **Total Projected Expenditure: [Sum]**

---

## Budget Summary

| | Amount |
|---|---|
| Total projected income | [Amount] |
| Total projected expenditure | [Amount] |
| **Projected surplus / (deficit)** | **[Difference]** |
| Opening reserves | [Amount] |
| **Projected closing reserves** | **[Amount]** |

---

## Budget Notes and Assumptions

Record any important assumptions behind the figures:

- Membership target: [Number] members (previous year: [Number])
- Planned events: [Number of events]
- Major purchases planned: [List any significant one-off costs]
- Known changes from previous year: [e.g., rent increase, new grant, change in dues rate]

---

## Monthly Budget Review Checklist

Review these figures at each committee meeting:

- [ ] Compare actual income to budget year-to-date
- [ ] Compare actual expenditure to budget year-to-date
- [ ] Identify any significant variances and investigate
- [ ] Reforecast year-end position if needed
- [ ] Report summary to full committee

---

**Tip:** GatherGrove's financial reporting dashboard tracks dues income, event revenue, and member payment status in real time — giving you up-to-date figures without manual spreadsheet updates.

**www.gathergrove.club**";
    }

    private static string GetMemberOnboardingChecklistContent()
    {
        return @"# Member Onboarding Checklist

A structured 30-60-90 day checklist to help new members feel welcome, informed, and connected to your club.

---

## Before or On Day 1

### Club Administration
- [ ] Add member to club management system (CRM/database)
- [ ] Collect completed membership form and emergency contact details
- [ ] Process dues payment and issue receipt
- [ ] Issue membership card or number
- [ ] Add member to club mailing list
- [ ] Add member to relevant communication channels (group chat, Slack, etc.)

### Welcome Communications
- [ ] Send personalised welcome email within 24 hours (use welcome email template)
- [ ] Introduce new member to club leadership personally (in person or by message)
- [ ] Assign a buddy or mentor from existing membership
- [ ] Share club handbook and member directory

---

## Days 1–30: First Month

### Orientation
- [ ] Arrange informal meeting with club lead or secretary
- [ ] Walk member through the member portal / online resources
- [ ] Explain how events are announced and how to RSVP
- [ ] Explain dues payment process and calendar
- [ ] Answer any questions about club rules and expectations

### Integration
- [ ] Introduce new member at the next club meeting or event
- [ ] Post a short welcome notice on club social media or newsletter (with member's permission)
- [ ] Buddy checks in at least once during first two weeks
- [ ] New member attends at least one club activity or event

### 30-Day Check-In
- [ ] Buddy or coordinator sends informal check-in message
- [ ] Ask: ""Is there anything you were expecting that you haven't found yet?""
- [ ] Address any confusion about club procedures
- [ ] Note any interest areas (volunteering, subgroups, committee roles)

---

## Days 31–60: Building Habits

### Deepening Involvement
- [ ] Invite member to join any relevant subgroups or special interest groups
- [ ] Share upcoming events that match their interests
- [ ] Offer opportunity to volunteer at an upcoming event
- [ ] Introduce member to other members with shared interests

### 60-Day Check-In
- [ ] Send brief satisfaction survey (3–5 questions, takes under 2 minutes)
- [ ] Review survey response and follow up if any concerns noted
- [ ] Ask if member would like to take on any volunteer role

---

## Days 61–90: Full Integration

### Belonging
- [ ] Member has attended at least two club activities
- [ ] Member has connected with at least three other members by name
- [ ] Member understands how to raise questions or suggestions with leadership
- [ ] Member is aware of renewal process and next dues date

### 90-Day Check-In
- [ ] Formal welcome completion — acknowledge member has completed onboarding
- [ ] Share annual calendar of key events
- [ ] Remind member of renewal date (if applicable)
- [ ] Ask for feedback on onboarding process to help improve for future members

---

## Onboarding Completion Criteria

A new member is considered fully onboarded when:

- [ ] All administration tasks complete (membership record, payment, mailing list)
- [ ] Member has attended at least one club event or meeting
- [ ] Member has been personally introduced to at least one committee member
- [ ] 90-day check-in completed with no outstanding concerns

---

## Notes

Record any notes about this member's onboarding:

- Special interests or skills: [Notes]
- Preferred communication method: [Email / Phone / Other]
- Any accessibility or support needs: [Notes]
- Volunteer interests: [Notes]

---

**GatherGrove automates key onboarding steps** — welcome emails, dues collection, event invitations, and check-in reminders — so new members get a consistent, professional experience every time.

**www.gathergrove.club**";
    }

    private static string GetClubBylawsContent()
    {
        return @"# Club Bylaws Template

This template provides a starting point for your club's governing document. Have your committee review and adapt each section before adopting formally at a general meeting.

**Important:** This is a template only and does not constitute legal advice. Consider having a solicitor or legal adviser review your bylaws before adoption, particularly if your club holds significant assets or employs staff.

---

## Article 1: Name and Purpose

### 1.1 Name
The organisation shall be known as [Full Club Name] (hereinafter referred to as ""the Club"").

### 1.2 Purpose
The purpose of the Club is to [describe primary purpose, e.g., promote and facilitate amateur [sport/activity/interest] among members of the community].

### 1.3 Non-Profit Status
The Club operates on a not-for-profit basis. Any surplus income is reinvested in the Club's activities and shall not be distributed to members.

---

## Article 2: Membership

### 2.1 Eligibility
Membership is open to any person aged [minimum age, e.g., 18] or over who supports the purpose of the Club, subject to payment of the required dues and acceptance by the Committee.

### 2.2 Categories of Membership

| Category | Description | Voting Rights |
|---|---|---|
| Full Member | All rights and responsibilities | Yes |
| Associate Member | [Describe, e.g., non-voting, lower dues] | No |
| Honorary Member | Granted by Committee for exceptional service | Advisory only |
| Junior Member | Under [age], parental consent required | No |

### 2.3 Application
New members must complete a membership application form and pay the applicable dues before membership is active.

### 2.4 Renewal
Membership renews annually on [renewal date, e.g., 1 April]. Members who have not renewed by [lapse date] will be considered lapsed.

### 2.5 Termination
Membership may be terminated by:
- Resignation in writing to the Secretary
- Non-payment of dues after [number] days' notice
- Expulsion following the disciplinary procedure in Article 7

---

## Article 3: Governance

### 3.1 Committee Composition
The Club shall be governed by a Committee consisting of the following officers:

- President (or Chair)
- Vice President (or Deputy Chair)
- Secretary
- Treasurer
- [Up to X] Ordinary Members

### 3.2 Election of Officers
Officers are elected at the Annual General Meeting (AGM) by a simple majority of Full Members present and voting. Each officer serves a term of [one/two] year(s) and is eligible for re-election.

### 3.3 Quorum
A quorum for Committee meetings shall be [number, typically a majority] of elected officers.

### 3.4 Vacancies
If a Committee position becomes vacant between AGMs, the Committee may co-opt a Full Member to fill the role until the next AGM.

---

## Article 4: Meetings

### 4.1 Annual General Meeting
The AGM shall be held once per year, no later than [number] months after the end of the financial year. At least [number, e.g., 21] days' notice shall be given to all Full Members.

AGM business shall include:
- [ ] Minutes of the previous AGM
- [ ] Annual report from the President
- [ ] Accounts for the previous financial year
- [ ] Election of officers
- [ ] Any motions submitted in advance

### 4.2 Extraordinary General Meeting
An EGM may be called by the Committee or upon written request from at least [number or percentage] of Full Members. At least [number, e.g., 14] days' notice is required.

### 4.3 Committee Meetings
The Committee shall meet at least [frequency, e.g., quarterly]. Meetings may be held in person or by video conference.

### 4.4 Voting
Unless otherwise specified, decisions require a simple majority. In the event of a tie, the Chair has the casting vote.

---

## Article 5: Finance

### 5.1 Financial Year
The Club's financial year runs from [start date] to [end date].

### 5.2 Bank Account
The Club shall maintain a bank account in the name of the Club. All payments above [threshold, e.g., £100] require the authorisation of two signatories.

### 5.3 Dues
Annual dues shall be set by the Committee and communicated to members at least [number] days before the renewal date.

### 5.4 Accounts
The Treasurer shall maintain accurate accounts and present a financial report to the Committee at each meeting and to the full membership at the AGM.

### 5.5 Dissolution
In the event of dissolution, any remaining assets shall be transferred to [named charity or organisation with similar purposes], after settlement of all liabilities.

---

## Article 6: Amendments

These bylaws may be amended at any AGM or EGM by a two-thirds majority of Full Members present and voting, provided that the proposed amendment has been circulated to all Full Members at least [number, e.g., 21] days in advance.

---

## Article 7: Disciplinary Procedure

### 7.1 Grounds
A member may be subject to disciplinary action for:
- Conduct detrimental to the Club or its members
- Breach of these bylaws or the Club's Code of Conduct
- Non-payment of dues (after due process)

### 7.2 Process
1. Written notice of the complaint is given to the member
2. The member has [number] days to respond in writing
3. The Committee considers the response and votes on appropriate action
4. The member is notified of the decision in writing
5. The member may appeal to an EGM within [number] days

### 7.3 Outcomes
The Committee may issue a formal warning, suspend membership, or expel a member. Expulsion requires a two-thirds majority of the Committee.

---

## Article 8: Safeguarding (if applicable)

The Club is committed to the safety and welfare of all members, particularly children and vulnerable adults. The Club shall maintain a Safeguarding Policy and appoint a designated Safeguarding Officer.

---

## Adoption

These bylaws were adopted by [Club Name] at a [General/Annual General] Meeting held on [Date].

Signed:

**President:** _________________________________ Date: _____________

**Secretary:** _________________________________ Date: _____________

---

*Review these bylaws every [2–3] years or whenever significant changes occur to the Club's structure or activities.*";
    }

    /// <summary>
    /// Generate a custom PDF from markdown content
    /// </summary>
    public async Task<byte[]> GenerateMarkdownToPdfAsync(string title, string content)
    {
        try
        {
            var pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Calibri));

                    page.Header()
                        .Text(title)
                        .SemiBold().FontSize(24).FontColor(DesignTokens.Colors.BrandPrimary500)
                        .AlignCenter();

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            ParseMarkdownContent(column, content);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Generated by ");
                            x.Span("GatherGrove").SemiBold().FontColor(DesignTokens.Colors.BrandPrimary500);
                            x.Span($" - {DateTime.UtcNow:yyyy-MM-dd}");
                        });
                });
            }).GeneratePdf();

            return await Task.FromResult(pdfBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate PDF: {Title}", title);
            throw;
        }
    }

    private void ParseMarkdownContent(ColumnDescriptor column, string content)
    {
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();

            if (string.IsNullOrEmpty(trimmedLine))
                continue;

            // Headers
            if (trimmedLine.StartsWith("# "))
            {
                column.Item().PaddingTop(20).PaddingBottom(10)
                    .Text(trimmedLine.Substring(2))
                    .FontSize(20).SemiBold().FontColor(Colors.Grey.Lighten3);
            }
            else if (trimmedLine.StartsWith("## "))
            {
                column.Item().PaddingTop(15).PaddingBottom(8)
                    .Text(trimmedLine.Substring(3))
                    .FontSize(16).SemiBold().FontColor(Colors.Grey.Lighten2);
            }
            else if (trimmedLine.StartsWith("### "))
            {
                column.Item().PaddingTop(12).PaddingBottom(6)
                    .Text(trimmedLine.Substring(4))
                    .FontSize(14).SemiBold().FontColor(Colors.Grey.Lighten1);
            }
            // Checkboxes
            else if (trimmedLine.StartsWith("- [ ] "))
            {
                var checkboxText = trimmedLine.Substring(6);
                column.Item().PaddingLeft(20).PaddingBottom(4)
                    .Text($"☐ {checkboxText}");
            }
            else if (trimmedLine.StartsWith("- ✅ "))
            {
                var checkboxText = trimmedLine.Substring(6);
                column.Item().PaddingLeft(20).PaddingBottom(4)
                    .Text($"✅ {checkboxText}");
            }
            // Bullet points
            else if (trimmedLine.StartsWith("- "))
            {
                var bulletText = trimmedLine.Substring(2);
                column.Item().PaddingLeft(20).PaddingBottom(4)
                    .Text($"• {bulletText}");
            }
            // Horizontal rules
            else if (trimmedLine.StartsWith("---"))
            {
                column.Item().PaddingVertical(10)
                    .LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
            }
            // Bold text (simple **text** format)
            else if (trimmedLine.Contains("**"))
            {
                column.Item().PaddingBottom(6)
                    .Text(text =>
                    {
                        ParseBoldText(text, trimmedLine);
                    });
            }
            // Regular paragraphs
            else
            {
                column.Item().PaddingBottom(6)
                    .Text(trimmedLine);
            }
        }
    }

    private void ParseBoldText(TextDescriptor text, string content)
    {
        var parts = Regex.Split(content, @"\*\*(.*?)\*\*");

        for (int i = 0; i < parts.Length; i++)
        {
            if (i % 2 == 0)
            {
                // Regular text
                if (!string.IsNullOrEmpty(parts[i]))
                {
                    text.Span(parts[i]);
                }
            }
            else
            {
                // Bold text
                if (!string.IsNullOrEmpty(parts[i]))
                {
                    text.Span(parts[i]).SemiBold();
                }
            }
        }
    }

    private static string GetClubManagementChecklistContent()
    {
        return @"# Ultimate Club Management Checklist

## Getting Started
- [ ] Define your club's mission and goals
- [ ] Set up member registration process
- [ ] Create member database with contact information
- [ ] Establish dues structure and payment methods
- [ ] Set up communication channels (email, messaging)

## Member Onboarding
- [ ] Welcome email template for new members
- [ ] Club rules and guidelines document
- [ ] Member directory and contact list
- [ ] Orientation process for newcomers
- [ ] Buddy system for member integration

## Event Planning & Management
- [ ] Annual event calendar creation
- [ ] Event planning timeline templates
- [ ] RSVP tracking system
- [ ] Venue booking and management
- [ ] Event feedback collection process

## Communication Best Practices
- [ ] Weekly/monthly newsletter schedule
- [ ] Emergency communication protocols
- [ ] Meeting agenda templates
- [ ] Member feedback and suggestion system
- [ ] Social media presence setup

## Financial Management
- [ ] Dues collection schedule and tracking
- [ ] Budget planning for club activities
- [ ] Expense tracking and reporting
- [ ] Financial transparency with members
- [ ] Fundraising activity planning

## Member Engagement & Retention
- [ ] Regular member satisfaction surveys
- [ ] Recognition and appreciation programs
- [ ] Special interest groups within club
- [ ] Member skill sharing opportunities
- [ ] Social events and team building

## Administrative Tasks
- [ ] Meeting minutes template and storage
- [ ] Member attendance tracking
- [ ] Equipment or resource management
- [ ] Volunteer coordination system
- [ ] Annual report preparation

## Technology & Tools
- [ ] Choose club management software
- [ ] Set up online payment processing
- [ ] Create club website or social media
- [ ] Digital document storage system
- [ ] Mobile app or communication platform

## Growth & Development
- [ ] Member recruitment strategies
- [ ] Partnership opportunities with other clubs
- [ ] Community outreach programs
- [ ] Annual goal setting and review
- [ ] Leadership succession planning

## Safety & Legal
- [ ] Insurance coverage verification
- [ ] Liability waivers and forms
- [ ] Emergency contact information
- [ ] Safety protocols for activities
- [ ] Legal compliance check (permits, etc.)

---

**Need help implementing these items?**

GatherGrove provides all the tools you need to manage your club effectively:

- ✅ Member database and communication
- ✅ Event management with RSVP tracking  
- ✅ Automated dues collection and reminders
- ✅ Mobile app for members on-the-go
- ✅ Analytics and reporting dashboard

**Start today:** www.gathergrove.club

---

*This checklist has been used by 1,000+ successful clubs to streamline their operations and boost member satisfaction.*";
    }
}
