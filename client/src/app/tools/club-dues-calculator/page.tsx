import ToolLayout from '@/components/tools/ToolLayout';
import DuesCalculator from '@/components/tools/DuesCalculator';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebApplicationSchema } from '@/lib/schema';
import { createPageMetadata } from '@/lib/marketing-metadata';

export const metadata = createPageMetadata({
  title: 'Club Dues Calculator - How Much Should Your Club Charge?',
  description:
    'Free club dues calculator. Enter your annual expenses and member count to get a recommended monthly and annual dues amount for your club or organization.',
  slug: 'tools/club-dues-calculator',
});

export default function ClubDuesCalculatorPage() {
  return (
    <>
      <JsonLd schema={buildWebApplicationSchema({
        name: 'Club Dues Calculator',
        description: 'Free club dues calculator. Enter your annual expenses and member count to get a recommended monthly and annual dues amount.',
        slug: 'tools/club-dues-calculator',
      })} />
      <ToolLayout
        title="Club Dues Calculator"
        description="Enter your club's annual expenses and member count to calculate the right dues amount. Takes 2 minutes."
        relatedLinks={[
          {
            label: 'Financial Management for Small Clubs',
            href: '/resources/financial-management-for-small-clubs',
          },
          {
            label: 'Collect Dues with GatherGrove',
            href: '/features',
          },
        ]}
      >
        <DuesCalculator />
      </ToolLayout>
    </>
  );
}
