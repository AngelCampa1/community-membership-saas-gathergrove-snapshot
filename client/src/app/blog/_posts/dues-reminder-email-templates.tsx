import { AutoLinkedText } from'@/components/seo/AutoLinkedText'
import Link from'next/link'

export default function DuesReminderEmailTemplates() {
  return (
    <>
      <section
        id="key-takeaways"
        data-ai-answer="true"
        className="not-prose bg-emerald-50  border border-emerald-200  rounded-lg p-6 mb-8"
      >
        <h2 className="text-lg font-semibold text-emerald-900  mt-0 mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2 text-emerald-800  list-disc list-inside">
          <li>
            Clubs that send systematic dues reminders collect 15-30% more
            revenue than those that rely on a single notice{''}
            <em>
            </em>
            .
          </li>
          <li>
            A 5-email sequence - from friendly reminder to final notice -
            covers the full dues collection cycle without burning
            relationships.
          </li>
          <li>
            Including a direct payment link in every reminder is the single
            most effective way to get faster payments.
          </li>
          <li>
            Automating your reminders saves you the awkward conversations and
            ensures no one falls through the cracks.
          </li>
        </ul>
      </section>

      <h2>
        Why Dues Reminders Matter More Than You Think
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="Most club members don't skip dues on purpose. They forget. They meant to do it later. They got busy. The due date came and went, and now it feels awkward to bring it up - for you and for them."
        />
      </p>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="That's why systematic reminders work so well. organizations that send a structured series of payment reminders usually follow up more consistently than those that send a single notice or rely on word of mouth."
        />
      </p>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="The key is tone. You're not a debt collector - you're a fellow club member reminding people about something they already agreed to. These five templates strike that balance at every stage of the dues cycle."
        />
      </p>
      <p>
        For a deeper look at dues collection strategy, see our{''}
        <Link
          href="/resources/modern-dues-collection-best-practices"
          className="text-emerald-700  underline hover:text-emerald-900"
        >
          guide to modern dues collection best practices
        </Link>
        .
      </p>

      <h2>
        Template 1: The Friendly First Reminder (2 Weeks Before Due Date)
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="This is a gentle heads-up, not a demand. You're giving members time to budget and plan. Send this about two weeks before the due date."
        />
      </p>
      <div className="not-prose bg-gray-50  border border-gray-200  rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-gray-500  mb-3">
          SUBJECT: Your [Club Name] membership renewal is coming up
        </p>
        <div className="text-gray-700  space-y-3 text-sm">
          <p>Hi [First Name],</p>
          <p>
            Quick heads-up - your [Club Name] membership dues of [Amount] are
            due on [Date].
          </p>
          <p>
            You can take care of it right now if you'd like to get it off your
            list:
          </p>
          <p className="font-semibold">[Pay My Dues - link]</p>
          <p>
            If you have any questions about your membership or need to update
            your payment method, just reply to this email.
          </p>
          <p>Thanks for being part of [Club Name]!</p>
          <p>
            [Your Name]
            <br />
            [Your Role], [Club Name]
          </p>
        </div>
      </div>

      <h2>
        Template 2: The Due Date Reminder (Day Of)
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="Short and to the point. This email goes out on the due date itself. Some members will have already paid - make sure your system only sends this to those who haven't."
        />
      </p>
      <div className="not-prose bg-gray-50  border border-gray-200  rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-gray-500  mb-3">
          SUBJECT: [Club Name] dues are due today
        </p>
        <div className="text-gray-700  space-y-3 text-sm">
          <p>Hi [First Name],</p>
          <p>
            Just a friendly reminder that your [Club Name] membership dues of
            [Amount] are due today, [Date].
          </p>
          <p>It takes about 30 seconds to pay online:</p>
          <p className="font-semibold">[Pay Now - link]</p>
          <p>
            If you've already sent payment, please disregard this message.
            Thank you!
          </p>
          <p>
            [Your Name]
            <br />
            [Club Name]
          </p>
        </div>
      </div>

      <h2>
        Template 3: The Overdue Nudge (1 Week Past Due)
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="At this point you're following up, but you're still keeping it light. Most people who pay late do so within the first two weeks. This nudge catches the ones who simply forgot."
        />
      </p>
      <div className="not-prose bg-gray-50  border border-gray-200  rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-gray-500  mb-3">
          SUBJECT: Did you miss this? Your [Club Name] dues are past due
        </p>
        <div className="text-gray-700  space-y-3 text-sm">
          <p>Hi [First Name],</p>
          <p>
            We noticed your [Club Name] membership dues of [Amount] were due
            on [Date] and we haven't received your payment yet.
          </p>
          <p>
            No worries - these things happen. You can take care of it right
            now:
          </p>
          <p className="font-semibold">[Pay My Dues - link]</p>
          <p>
            If there's a reason you're unable to pay right now, or if you have
            questions, hit reply and let us know. We're happy to work something
            out.
          </p>
          <p>
            Thanks,
            <br />
            [Your Name]
            <br />
            [Your Role], [Club Name]
          </p>
        </div>
      </div>

      <h2>
        Template 4: The Value Reminder (2 Weeks Past Due)
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="This is where you shift from'reminder' to'here's why your membership matters.' Some members who haven't paid are on the fence about renewing. Remind them what they get."
        />
      </p>
      <div className="not-prose bg-gray-50  border border-gray-200  rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-gray-500  mb-3">
          SUBJECT: We'd hate to see you go, [First Name]
        </p>
        <div className="text-gray-700  space-y-3 text-sm">
          <p>Hi [First Name],</p>
          <p>
            Your [Club Name] membership dues are now two weeks past due, and
            we wanted to reach out personally.
          </p>
          <p>
            As a member, you have access to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>[Key benefit 1 - e.g., weekly meetups and events]</li>
            <li>[Key benefit 2 - e.g., member-only discounts]</li>
            <li>[Key benefit 3 - e.g., our member directory and community]</li>
            <li>[Key benefit 4 - e.g., voting rights on club decisions]</li>
          </ul>
          <p>
            We'd love to keep you as part of the community. Renewing takes
            less than a minute:
          </p>
          <p className="font-semibold">[Renew My Membership - link]</p>
          <p>
            If you've decided not to renew, we understand - we'd appreciate a
            quick reply letting us know so we can update our records.
          </p>
          <p>
            [Your Name]
            <br />
            [Your Role], [Club Name]
          </p>
        </div>
      </div>

      <h2>
        Template 5: The Final Notice (30 Days Past Due)
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="This is your last email in the sequence. It's kind but firm. You're letting them know what happens next if they don't pay, while still leaving the door open."
        />
      </p>
      <div className="not-prose bg-gray-50  border border-gray-200  rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-gray-500  mb-3">
          SUBJECT: Final notice: Your [Club Name] membership
        </p>
        <div className="text-gray-700  space-y-3 text-sm">
          <p>Hi [First Name],</p>
          <p>
            This is a final reminder that your [Club Name] membership dues of
            [Amount] are now 30 days past due.
          </p>
          <p>
            If we don't receive your payment by [Final Deadline], your
            membership will be moved to inactive status. This means you'll
            lose access to [specific benefits - events, member directory,
            etc.].
          </p>
          <p>
            If you'd like to stay a member, you can pay right now:
          </p>
          <p className="font-semibold">[Pay Now - link]</p>
          <p>
            If you're facing financial difficulty, please reach out to us at
            [contact email]. We may be able to work out a payment plan or
            reduced rate.
          </p>
          <p>
            We hope to keep you as part of [Club Name].
          </p>
          <p>
            [Your Name]
            <br />
            [Your Role], [Club Name]
          </p>
        </div>
      </div>

      <h2>
        Tips for Better Dues Collection
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="These templates will get you most of the way there. But a few adjustments to how and when you send them can make a real difference."
        />
      </p>
      <ul>
        <li>
          <strong>Always include a payment link</strong> - Every single
          reminder should have a direct link to pay. The fewer clicks between
          reading the email and paying, the better.
        </li>
        <li>
          <strong>Personalize with the member's name</strong> - Emails
          addressed to &quot;Dear Member&quot; get ignored. Use their first name. It
          takes two seconds if your tool supports merge fields.
        </li>
        <li>
          <strong>Send at the right time</strong> - Research from Mailchimp
          shows that emails sent Tuesday through Thursday between 9-11 AM get
          the highest open rates{''}
          <em></em>.
        </li>
        <li>
          <strong>Use multiple channels</strong> - If email isn't working
          after the third reminder, try a quick phone call.
          Some people just don't check email regularly.
        </li>
        <li>
          <strong>Make it easy to ask for help</strong> - Some members are
          struggling financially and are too embarrassed to say so. A simple
          &quot;reply if you need to work something out&quot; can save a membership.
        </li>
        <li>
          <strong>Track who's paid</strong> - This sounds basic, but sending a
          payment reminder to someone who already paid is a fast way to
          frustrate your members. Make sure your system filters them out.
        </li>
      </ul>
      <p>
        For more on communication strategy, check out our{''}
        <Link
          href="/resources/digital-communication-tools"
          className="text-emerald-700  underline hover:text-emerald-900"
        >
          guide to digital communication tools for clubs
        </Link>
        .
      </p>

      <h2>
        When to Automate Your Dues Reminders
      </h2>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="If your club has more than 20 members, sending individual dues reminders by hand is going to eat your weekend. And if you forget to send one - or send it to the wrong person - it gets awkward fast."
        />
      </p>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="Automated dues reminders work like this: you set up the sequence once (using templates like the ones above), define the timing (2 weeks before, day of, 1 week after, etc.), and the system sends the right email to the right person at the right time. Members who pay are automatically removed from the sequence."
        />
      </p>
      <p>
        <AutoLinkedText
          currentType="blog"
          currentSlug="dues-reminder-email-templates"
          text="This is one of those things that sounds like a'nice to have' until you try it. Once you automate dues reminders, you'll wonder how you ever did it manually."
        />
      </p>

      <div className="not-prose bg-emerald-50  border border-emerald-200  rounded-lg p-6 mt-8">
        <p className="text-gray-700  mb-3">
          GatherGrove lets you set up automated dues reminders with built-in
          payment links. Members get the right message at the right time, and
          you stop chasing payments by hand.
        </p>
        <p className="text-gray-700  font-medium">
          <Link
            href="/pricing"
            className="text-emerald-700  underline hover:text-emerald-900"
          >
            Start your free 30-day trial
          </Link>{''}
          and set up your first reminder sequence in minutes.
        </p>
      </div>
    </>
  )
}
