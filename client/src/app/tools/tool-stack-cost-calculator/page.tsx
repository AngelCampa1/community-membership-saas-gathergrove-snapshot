import ToolLayout from '@/components/tools/ToolLayout';
import ToolStackCalculator from '@/components/tools/ToolStackCalculator';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebApplicationSchema } from '@/lib/schema';
import { createPageMetadata } from '@/lib/marketing-metadata';

export const metadata = createPageMetadata({
  title: 'Club Management Tool Stack Cost Calculator',
  description:
    'See how much your club spends on Eventbrite, Mailchimp, TeamSnap, and other tools - and how much you could save by switching to GatherGrove.',
  slug: 'tools/tool-stack-cost-calculator',
});

export default function ToolStackCostCalculatorPage() {
  return (
    <>
      <JsonLd schema={buildWebApplicationSchema({
        name: 'Club Management Tool Stack Cost Calculator',
        description: 'See how much your club spends on Eventbrite, Mailchimp, TeamSnap, and other tools - and how much you could save by switching to GatherGrove.',
        slug: 'tools/tool-stack-cost-calculator',
      })} />
      <ToolLayout
        title="Club Management Tool Stack Cost Calculator"
        description="Add the tools your club currently uses to see your total annual cost - and how it compares to an all-in-one platform."
        relatedLinks={[
          {
            label: 'GatherGrove vs. Wild Apricot',
            href: '/alternatives/wild-apricot-alternative',
          },
          {
            label: 'GatherGrove vs. TeamSnap',
            href: '/alternatives/teamsnap-alternative',
          },
          {
            label: 'Best Club Management Software',
            href: '/compare/best-club-management-software',
          },
        ]}
      >
        <ToolStackCalculator />
      </ToolLayout>
    </>
  );
}
