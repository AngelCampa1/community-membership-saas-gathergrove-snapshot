'use client';

import React, { useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Users, Calculator, TrendingUp, PieChart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ToolLeadCapture from '@/components/tools/ToolLeadCapture';

ChartJS.register(ArcElement, Tooltip, Legend);

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClubType = 'sports' | 'hobby' | 'volunteer' | 'social' | 'other';
export type BillingPreference = 'monthly' | 'annual';

export interface DuesExpenses {
  venue: number;
  equipment: number;
  insurance: number;
  software: number;
  events: number;
  marketing: number;
  other: number;
}

export interface DuesInputs {
  clubType: ClubType;
  memberCount: number;
  expenses: DuesExpenses;
  surplusPercent: number;
  billingPreference: BillingPreference;
}

export interface BreakdownItem {
  label: string;
  amount: number;
  percentage: number;
}

export interface DuesResults {
  annualPerMember: number;
  monthlyPerMember: number;
  totalAnnualBudget: number;
  totalWithSurplus: number;
  breakdown: BreakdownItem[];
}

// ─── Calculation logic (pure function - exported for testing) ─────────────────

const EXPENSE_LABELS: Record<keyof DuesExpenses, string> = {
  venue: 'Venue / Facility Rental',
  equipment: 'Equipment & Supplies',
  insurance: 'Insurance',
  software: 'Software & Tools',
  events: 'Events & Activities',
  marketing: 'Marketing & Communications',
  other: 'Other',
};

export function calculateDues(inputs: DuesInputs): DuesResults {
  const { memberCount, expenses, surplusPercent } = inputs;

  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0);
  const withSurplus = totalExpenses * (1 + surplusPercent / 100);

  const annualPerMemberRaw = memberCount > 0 ? withSurplus / memberCount : 0;
  const monthlyPerMemberRaw = annualPerMemberRaw / 12;

  const annualPerMember = Math.round(annualPerMemberRaw * 100) / 100;
  const monthlyPerMember = Math.round(monthlyPerMemberRaw * 100) / 100;

  // Expense breakdown - only include categories with non-zero amounts
  const breakdown: BreakdownItem[] = (Object.keys(expenses) as Array<keyof DuesExpenses>)
    .filter((key) => (expenses[key] || 0) > 0)
    .map((key) => {
      const amount = expenses[key] || 0;
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      return {
        label: EXPENSE_LABELS[key],
        amount,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

  return {
    annualPerMember,
    monthlyPerMember,
    totalAnnualBudget: totalExpenses,
    totalWithSurplus: withSurplus,
    breakdown,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const CHART_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f97316', // orange
];

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_INPUTS: DuesInputs = {
  clubType: 'sports',
  memberCount: 50,
  expenses: {
    venue: 0,
    equipment: 0,
    insurance: 0,
    software: 0,
    events: 0,
    marketing: 0,
    other: 0,
  },
  surplusPercent: 10,
  billingPreference: 'monthly',
};

export default function DuesCalculator() {
  const [inputs, setInputs] = useState<DuesInputs>(DEFAULT_INPUTS);

  const results = useMemo(() => calculateDues(inputs), [inputs]);

  const updateExpense = (key: keyof DuesExpenses, value: string) => {
    const numeric = parseFloat(value) || 0;
    setInputs((prev) => ({
      ...prev,
      expenses: { ...prev.expenses, [key]: numeric },
    }));
  };

  const hasExpenses = results.totalAnnualBudget > 0;
  const hasMembers = inputs.memberCount > 0;

  // Chart data
  const chartData = {
    labels: results.breakdown.map((b) => b.label),
    datasets: [
      {
        data: results.breakdown.map((b) => b.amount),
        backgroundColor: CHART_COLORS.slice(0, results.breakdown.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 16, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; parsed: number }) =>
            `${ctx.label}: ${formatCurrency(ctx.parsed)} (${results.breakdown[ctx.parsed] ? '' : ''}${
              ((ctx.parsed / results.totalAnnualBudget) * 100).toFixed(1)
            }%)`,
        },
      },
    },
  };

  const toolData: Record<string, unknown> = {
    ...inputs.expenses,
    memberCount: inputs.memberCount,
    surplusPercent: inputs.surplusPercent,
    clubType: inputs.clubType,
    billingPreference: inputs.billingPreference,
    annualPerMember: results.annualPerMember,
    monthlyPerMember: results.monthlyPerMember,
  };

  return (
    <div className="space-y-8">
      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Inputs column ── */}
        <div className="space-y-6">
          {/* Club type */}
          <div className="space-y-2">
            <label htmlFor="club-type-select" className="text-sm font-medium">
              Club type
            </label>
            <Select
              value={inputs.clubType}
              onValueChange={(val) =>
                setInputs((prev) => ({ ...prev, clubType: val as ClubType }))
              }
            >
              <SelectTrigger id="club-type-select" className="w-full">
                <SelectValue placeholder="Select club type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sports">Sports / Athletics</SelectItem>
                <SelectItem value="hobby">Hobby / Craft</SelectItem>
                <SelectItem value="volunteer">Volunteer / Nonprofit</SelectItem>
                <SelectItem value="social">Social / Community</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="member-count-input" className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Member count
              </label>
              <span className="text-sm font-semibold tabular-nums">{inputs.memberCount}</span>
            </div>
            <Input
              id="member-count-input"
              type="number"
              min={0}
              max={10000}
              value={inputs.memberCount}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  memberCount: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              aria-label="Member count"
              className="w-full"
            />
          </div>

          {/* Expense categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" aria-hidden="true" />
                Annual expenses
              </CardTitle>
              <CardDescription>
                Enter your club&apos;s estimated annual costs in each category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(DEFAULT_INPUTS.expenses) as Array<keyof DuesExpenses>).map((key) => (
                <div key={key} className="space-y-1">
                  <label htmlFor={`expense-${key}`} className="text-sm font-medium capitalize">
                    {EXPENSE_LABELS[key]}
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      id={`expense-${key}`}
                      type="number"
                      min={0}
                      step={10}
                      placeholder="0"
                      value={inputs.expenses[key] || ''}
                      onChange={(e) => updateExpense(key, e.target.value)}
                      className="pl-8"
                      aria-label={EXPENSE_LABELS[key]}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Surplus percentage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="surplus-input" className="text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Desired surplus
              </label>
              <span className="text-sm font-semibold tabular-nums">{inputs.surplusPercent}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A buffer above expenses helps cover unexpected costs.
            </p>
            <Input
              id="surplus-input"
              type="number"
              min={0}
              max={30}
              value={inputs.surplusPercent}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  surplusPercent: Math.min(30, Math.max(0, parseInt(e.target.value, 10) || 0)),
                }))
              }
              aria-label="Desired surplus percentage"
              className="w-full"
            />
          </div>

          {/* Billing preference */}
          <div className="space-y-2">
            <label htmlFor="billing-select" className="text-sm font-medium">
              Billing preference
            </label>
            <Select
              value={inputs.billingPreference}
              onValueChange={(val) =>
                setInputs((prev) => ({
                  ...prev,
                  billingPreference: val as BillingPreference,
                }))
              }
            >
              <SelectTrigger id="billing-select" className="w-full">
                <SelectValue placeholder="Select billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly billing</SelectItem>
                <SelectItem value="annual">Annual billing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Results column ── */}
        <div className="space-y-6">
          {/* Result cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly dues */}
            <Card className="sm:col-span-2">
              <CardHeader className="pb-1">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  Monthly dues per member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={results.monthlyPerMember}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="text-4xl font-bold tabular-nums"
                  >
                    {!hasMembers ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      formatCurrency(results.monthlyPerMember)
                    )}
                  </motion.div>
                </AnimatePresence>
                {hasExpenses && hasMembers && (
                  <p className="text-xs text-muted-foreground mt-1">per member / month</p>
                )}
              </CardContent>
            </Card>

            {/* Annual dues */}
            <Card>
              <CardHeader className="pb-1">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  Annual dues per member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {!hasMembers ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    formatCurrency(results.annualPerMember)
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total annual budget */}
            <Card>
              <CardHeader className="pb-1">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  Total annual budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {formatCurrency(results.totalAnnualBudget)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Empty state prompt */}
          {!hasExpenses && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add your expenses above to see dues recommendations.
            </p>
          )}

          {/* Doughnut chart */}
          {hasExpenses && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" aria-hidden="true" />
                  Expense breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs mx-auto">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA link */}
          <div className="pt-2">
            <a
              href="/register?utm_source=tool&utm_medium=dues-calculator&utm_campaign=free-tools"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Collect dues automatically - zero platform fees →
            </a>
          </div>
        </div>
      </div>

      {/* Lead capture below results */}
      <ToolLeadCapture
        source="tool-dues-calculator"
        ctaText="Get your PDF breakdown + free dues proposal template"
        toolData={toolData}
      />
    </div>
  );
}
