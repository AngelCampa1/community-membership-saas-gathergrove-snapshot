import ToolLayout from '@/components/tools/ToolLayout';
import EventBudgetPlanner from '@/components/tools/EventBudgetPlanner';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebApplicationSchema } from '@/lib/schema';
import { createPageMetadata } from '@/lib/marketing-metadata';

export const metadata = createPageMetadata({
  title: 'Event Budget Planner & Break-Even Calculator',
  description:
    'Calculate ticket pricing, break-even attendance, and projected profit/loss for your club event. Free event budget calculator for community organizations.',
  slug: 'tools/event-budget-planner',
});

export default function EventBudgetPlannerPage() {
  return (
    <>
      <JsonLd schema={buildWebApplicationSchema({
        name: 'Event Budget Planner',
        description: 'Calculate ticket pricing, break-even attendance, and projected profit/loss for your club event. Free event budget calculator for community organizations.',
        slug: 'tools/event-budget-planner',
      })} />
      <ToolLayout
        title="Event Budget Planner"
        description="Enter your event costs and expected attendance to find your break-even point and see projected profit or loss at different attendance levels."
        relatedLinks={[
          {
            label: 'Club Financial Management Guide',
            href: '/resources/financial-management-for-small-clubs',
          },
          {
            label: 'Event Management Software',
            href: '/features/nonprofit-event-management',
          },
          {
            label: 'Collect Event Payments',
            href: '/features',
          },
        ]}
      >
        <EventBudgetPlanner />
      </ToolLayout>
    </>
  );
}
