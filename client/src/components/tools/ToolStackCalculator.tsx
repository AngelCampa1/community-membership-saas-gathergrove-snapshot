'use client';

import React, { useState, useMemo } from'react';
import Link from'next/link';
import { Checkbox } from'@/components/ui/checkbox';
import { Slider } from'@/components/ui/slider';
import { Input } from'@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from'@/components/ui/card';
import ToolLeadCapture from'@/components/tools/ToolLeadCapture';
import ToolResultCard from'@/components/tools/ToolResultCard';
import { DollarSign, TrendingDown, CheckCircle2, Calculator, ArrowRight } from'lucide-react';
import { getPricingPlan, formatStartingPriceLong } from'@/lib/pricing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolDefinition {
  id: string;
  label: string;
  category: string;
  monthlyCost: number;
  transactionFeePercent?: number;
  notes: string;
}

export interface StackInputs {
  selectedToolIds: string[];
  memberCount: number;
  eventsPerMonth: number;
  avgEventFee: number;
  adminHoursPerWeek: number;
}

export interface StackResults {
  currentMonthlySubscriptions: number;
  currentMonthlyTransactionFees: number;
  currentMonthlyTotal: number;
  annualAdminTimeCost: number;
  totalCurrentCost: number;
  ggPlanName:'Seed' |'Grow' |'Expand';
  ggMonthlyCost: number;
  ggTransactionFees: number;
  monthlySavings: number;
  annualSavings: number;
  selectedToolCount: number;
}

// ---------------------------------------------------------------------------
// Tool data
// ---------------------------------------------------------------------------

const TOOLS: ToolDefinition[] = [
  {
    id:'eventbrite',
    label:'Eventbrite',
    category:'Events',
    monthlyCost: 25,
    transactionFeePercent: 3.5,
    notes:'Plus 2.9%+$0.30 Stripe fees on each ticket',
  },
  {
    id:'mailchimp',
    label:'Mailchimp',
    category:'Email',
    monthlyCost: 17,
    notes:'Essentials plan for ~500 contacts',
  },
  {
    id:'teamsnap',
    label:'TeamSnap',
    category:'Sports mgmt',
    monthlyCost: 15,
    notes:'Per-team pricing',
  },
  {
    id:'wildapricot',
    label:'Wild Apricot',
    category:'Member mgmt',
    monthlyCost: 48,
    notes:'Starter plan',
  },
  {
    id:'venmo_paypal',
    label:'Venmo / PayPal fees',
    category:'Payments',
    monthlyCost: 0,
    transactionFeePercent: 2.9,
    notes:'2.9% + $0.30 per transaction (goods & services)',
  },
  {
    id:'zoom',
    label:'Zoom',
    category:'Video',
    monthlyCost: 16,
    notes:'Pro plan',
  },
  {
    id:'surveymonkey',
    label:'SurveyMonkey',
    category:'Forms/surveys',
    monthlyCost: 25,
    notes:'Individual plan',
  },
  {
    id:'googleworkspace',
    label:'Google Workspace',
    category:'Docs/email',
    monthlyCost: 7,
    notes:'Business Starter per user/mo (count as 1 user)',
  },
  {
    id:'canva',
    label:'Canva Pro',
    category:'Design',
    monthlyCost: 13,
    notes:'Pro plan',
  },
  {
    id:'slack',
    label:'Slack',
    category:'Chat',
    monthlyCost: 8,
    notes:'Pro plan per active user (count as 10 users)',
  },
];

// ---------------------------------------------------------------------------
// Pure calculation function (exported for testing)
// ---------------------------------------------------------------------------

export function calculateStackCost(inputs: StackInputs): StackResults {
  const { selectedToolIds, memberCount, eventsPerMonth, avgEventFee, adminHoursPerWeek } = inputs;

  const selectedTools = TOOLS.filter((t) => selectedToolIds.includes(t.id));

  // Monthly subscription costs
  const currentMonthlySubscriptions = selectedTools.reduce(
    (sum, tool) => sum + tool.monthlyCost,
    0
  );

  // Transaction fee losses
  let currentMonthlyTransactionFees = 0;

  const hasEventbrite = selectedToolIds.includes('eventbrite');
  if (hasEventbrite) {
    // Eventbrite: eventsPerMonth * avgEventFee * memberCount * attendanceRate(0.4) * 3.5/100
    const ATTENDANCE_RATE = 0.4;
    const EVENTBRITE_FEE_PERCENT = 3.5 / 100;
    currentMonthlyTransactionFees +=
      eventsPerMonth * avgEventFee * memberCount * ATTENDANCE_RATE * EVENTBRITE_FEE_PERCENT;
  }

  const hasVenmoPaypal = selectedToolIds.includes('venmo_paypal');
  if (hasVenmoPaypal) {
    // VenmoPayPal: assume 20% of monthly dues (~$15 avg dues) collected via PayPal
    // memberCount * 15 * 0.20 * 0.029
    const AVG_MONTHLY_DUES = 15;
    const PAYPAL_COLLECTION_RATE = 0.2;
    const PAYPAL_FEE_RATE = 0.029;
    currentMonthlyTransactionFees +=
      memberCount * AVG_MONTHLY_DUES * PAYPAL_COLLECTION_RATE * PAYPAL_FEE_RATE;
  }

  const currentMonthlyTotal = currentMonthlySubscriptions + currentMonthlyTransactionFees;

  // Admin time cost: hours/week * 4 weeks/mo * 12 months * $25/hr
  const annualAdminTimeCost = adminHoursPerWeek * 4 * 12 * 25;
  const totalCurrentCost = currentMonthlyTotal * 12 + annualAdminTimeCost;

  // GatherGrove tier by member count
  let ggPlanName:'Seed' |'Grow' |'Expand';
  let ggMonthlyCost: number;

  if (memberCount <= 100) {
    ggPlanName ='Seed';
    ggMonthlyCost = getPricingPlan('seed').monthlyPrice;
  } else if (memberCount <= 200) {
    ggPlanName ='Grow';
    ggMonthlyCost = getPricingPlan('grow').monthlyPrice;
  } else {
    ggPlanName ='Expand';
    ggMonthlyCost = getPricingPlan('unlimited').monthlyPrice;
  }

  // GatherGrove has zero platform transaction fees (only Stripe processing - same as direct)
  const ggTransactionFees = 0;

  const monthlySavings = currentMonthlyTotal - ggMonthlyCost;
  const annualSavings = monthlySavings * 12;

  return {
    currentMonthlySubscriptions,
    currentMonthlyTransactionFees,
    currentMonthlyTotal,
    annualAdminTimeCost,
    totalCurrentCost,
    ggPlanName,
    ggMonthlyCost,
    ggTransactionFees,
    monthlySavings,
    annualSavings,
    selectedToolCount: selectedTools.length,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style:'currency',
    currency:'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ToolStackCalculator() {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [memberCount, setMemberCount] = useState(50);
  const [eventsPerMonth, setEventsPerMonth] = useState(2);
  const [avgEventFee, setAvgEventFee] = useState(20);
  const [adminHoursPerWeek, setAdminHoursPerWeek] = useState(5);

  const inputs: StackInputs = useMemo(
    () => ({ selectedToolIds, memberCount, eventsPerMonth, avgEventFee, adminHoursPerWeek }),
    [selectedToolIds, memberCount, eventsPerMonth, avgEventFee, adminHoursPerWeek]
  );

  const results = useMemo(() => calculateStackCost(inputs), [inputs]);

  const hasSelections = selectedToolIds.length > 0;
  const hasEventbrite = selectedToolIds.includes('eventbrite');
  const hasVenmoPaypal = selectedToolIds.includes('venmo_paypal');
  const hasTransactionFeeTools = hasEventbrite || hasVenmoPaypal;

  function toggleTool(toolId: string, checked: boolean) {
    setSelectedToolIds((prev) =>
      checked ? [...prev, toolId] : prev.filter((id) => id !== toolId)
    );
  }

  const toolData: Record<string, unknown> = {
    selectedToolIds,
    memberCount,
    eventsPerMonth,
    avgEventFee,
    adminHoursPerWeek,
    currentMonthlyTotal: results.currentMonthlyTotal,
    ggPlanName: results.ggPlanName,
    monthlySavings: results.monthlySavings,
    annualSavings: results.annualSavings,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT COLUMN - Inputs                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-6">
        {/* Tool checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
              Tools your club currently uses
            </CardTitle>
            <CardDescription>
              Check every tool you pay for (or use with fees) each month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TOOLS.map((tool) => {
              const isChecked = selectedToolIds.includes(tool.id);
              const checkboxId = `tool-${tool.id}`;
              return (
                <div key={tool.id} className="flex items-start gap-3">
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    onCheckedChange={(checked) => toggleTool(tool.id, checked === true)}
                    aria-label={tool.label}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={checkboxId}
                    className="flex-1 cursor-pointer space-y-0.5"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{tool.label}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {tool.monthlyCost > 0
                          ? `$${tool.monthlyCost}/mo`
                          : tool.transactionFeePercent
                          ? `${tool.transactionFeePercent}% fees`
                          :'Free'}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                        {tool.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{tool.notes}</span>
                    </span>
                  </label>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Sliders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Club details</CardTitle>
            <CardDescription>
              Used to estimate your Eventbrite and payment processing fees.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Member count */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label htmlFor="slider-members" className="font-medium">
                  Member count
                </label>
                <span className="font-semibold text-primary">{memberCount}</span>
              </div>
              <Slider
                id="slider-members"
                min={10}
                max={500}
                step={10}
                value={[memberCount]}
                onValueChange={([v]) => setMemberCount(v)}
                aria-label="Member count"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>500</span>
              </div>
            </div>

            {/* Events per month */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label htmlFor="slider-events" className="font-medium">
                  Events per month
                </label>
                <span className="font-semibold text-primary">{eventsPerMonth}</span>
              </div>
              <Slider
                id="slider-events"
                min={0}
                max={10}
                step={1}
                value={[eventsPerMonth]}
                onValueChange={([v]) => setEventsPerMonth(v)}
                aria-label="Events per month"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            {/* Average event fee */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label htmlFor="slider-fee" className="font-medium">
                  Average event fee
                </label>
                <span className="font-semibold text-primary">${avgEventFee}</span>
              </div>
              <Slider
                id="slider-fee"
                min={0}
                max={100}
                step={5}
                value={[avgEventFee]}
                onValueChange={([v]) => setAvgEventFee(v)}
                aria-label="Average event fee"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>$100</span>
              </div>
            </div>

            {/* Admin hours/week */}
            <div className="space-y-2">
              <label htmlFor="admin-hours" className="text-sm font-medium">
                Admin hours/week managing tools
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="admin-hours"
                  type="number"
                  min={2}
                  max={20}
                  value={adminHoursPerWeek}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 2 && val <= 20) {
                      setAdminHoursPerWeek(val);
                    }
                  }}
                  className="w-24"
                  aria-label="Admin hours per week"
                />
                <span className="text-sm text-muted-foreground">hours/week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT COLUMN - Results                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-6">
        {!hasSelections ? (
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-10 text-center space-y-3">
            <Calculator className="h-10 w-10 mx-auto text-muted-foreground/50" aria-hidden="true" />
            <p className="text-muted-foreground font-medium">
              Select the tools your club currently uses above
            </p>
            <p className="text-sm text-muted-foreground">
              Your cost comparison will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current stack cost */}
            <ToolResultCard
              label="Your current tool stack costs"
              value={`${formatCurrency(results.currentMonthlyTotal)}/month`}
              description={`${results.selectedToolCount} tool${results.selectedToolCount !== 1 ?'s' :''} - ${formatCurrency(results.currentMonthlySubscriptions)}/mo in subscriptions${results.currentMonthlyTransactionFees > 0 ? ` + ${formatCurrency(results.currentMonthlyTransactionFees)}/mo in transaction fees` :''}`}
              icon={DollarSign}
              variant="default"
            />

            {/* Admin time cost */}
            <ToolResultCard
              label="Admin Time Cost (@ $25/hr)"
              value={formatCurrency(results.annualAdminTimeCost)}
              description={`${adminHoursPerWeek} hrs/week x 48 weeks x $25/hr - time spent managing your current tools`}
              icon={DollarSign}
              variant="default"
            />

            {/* GatherGrove cost */}
            <ToolResultCard
              label={`GatherGrove ${results.ggPlanName} replaces all of these`}
              value={`${formatCurrency(results.ggMonthlyCost)}/month`}
              description={`${results.ggPlanName} plan - includes events, members, email, payments & chat`}
              icon={CheckCircle2}
              variant="highlight"
            />

            {/* Savings */}
            {results.monthlySavings > 0 && (
              <ToolResultCard
                label="Your savings"
                value={`${formatCurrency(results.monthlySavings)}/month`}
                description={`That's ${formatCurrency(results.annualSavings)} saved every year`}
                icon={TrendingDown}
                variant="success"
              />
            )}

            {/* Transaction fees note */}
            {hasTransactionFeeTools && (
              <div className="rounded-lg border bg-amber-50  border-amber-200  p-4 text-sm text-amber-900  space-y-1">
                <p className="font-medium">About your transaction fees</p>
                <p>
                  GatherGrove charges zero platform transaction fees - you only pay Stripe&rsquo;s
                  standard processing rate (2.9% + $0.30), the same as if you collected payments
                  directly.
                  {hasEventbrite && (
                    <span>
                      {''}Eventbrite adds its own 3.5% fee on top of that, which you&rsquo;d eliminate.
                    </span>
                  )}
                  {hasVenmoPaypal && (
                    <span>
                      {''}PayPal&rsquo;s goods &amp; services fees (2.9% + $0.30) also disappear.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lead capture */}
        <ToolLeadCapture
          source="tool-stack-calculator"
          ctaText="Get your full comparison report as PDF"
          toolData={toolData}
        />

        {/* CTA */}
        <div className="space-y-2 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Replace your entire stack for {formatStartingPriceLong()}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="text-xs text-muted-foreground">30-day free trial. No contracts.</p>
        </div>
      </div>
    </div>
  );
}
