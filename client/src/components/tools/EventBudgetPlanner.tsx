'use client';

import React, { useState, useMemo } from'react';
import { motion, AnimatePresence } from'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calculator,
  AlertCircle,
} from'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from'@/components/ui/select';
import { Input } from'@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from'@/components/ui/card';
import ToolLeadCapture from'@/components/tools/ToolLeadCapture';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventType ='tournament' |'fundraiser' |'workshop' |'social' |'camp';
export type PaymentPlatform ='cash' |'venmo' |'paypal' |'eventbrite' |'gathergrove';

export interface FixedCosts {
  venue: number;
  permitsInsurance: number;
  entertainmentSpeaker: number;
  equipmentRental: number;
  otherFixed: number;
}

export interface VariableCosts {
  cateringFood: number;
  materialsSupplies: number;
  tshirtSwag: number;
  otherVariable: number;
}

export interface EventBudgetInputs {
  eventType: EventType;
  fixedCosts: FixedCosts;
  variableCosts: VariableCosts;
  minAttendance: number;
  maxAttendance: number;
  ticketPrice: number;
  paymentPlatform: PaymentPlatform;
}

interface AttendanceSnapshot {
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
  totalCosts: number;
  profit: number;
}

interface ChartDataPoint extends AttendanceSnapshot {
  attendance: number;
}

export interface EventBudgetResults {
  totalFixedCosts: number;
  variableCostPerAttendee: number;
  breakEvenAttendance: number | null;
  atMin: AttendanceSnapshot;
  atMax: AttendanceSnapshot;
  chartData: ChartDataPoint[];
  platformFeePercent: number;
}

// ─── Pure calculation function ────────────────────────────────────────────────

export function calculateEventBudget(inputs: EventBudgetInputs): EventBudgetResults {
  const totalFixedCosts =
    inputs.fixedCosts.venue +
    inputs.fixedCosts.permitsInsurance +
    inputs.fixedCosts.entertainmentSpeaker +
    inputs.fixedCosts.equipmentRental +
    inputs.fixedCosts.otherFixed;

  const variableCostPerAttendee =
    inputs.variableCosts.cateringFood +
    inputs.variableCosts.materialsSupplies +
    inputs.variableCosts.tshirtSwag +
    inputs.variableCosts.otherVariable;

  const platformFeeTable: Record<PaymentPlatform, number> = {
    cash: 0,
    venmo: 0.029,
    paypal: 0.029,
    eventbrite: 0.05,
    gathergrove: 0,
  };
  const platformFeePercent: number = platformFeeTable[inputs.paymentPlatform];

  const calcAtAttendance = (attendance: number): AttendanceSnapshot => {
    const grossRevenue = attendance * inputs.ticketPrice;
    const platformFees = grossRevenue * platformFeePercent;
    const netRevenue = grossRevenue - platformFees;
    const totalCosts = totalFixedCosts + variableCostPerAttendee * attendance;
    const profit = netRevenue - totalCosts;
    return { grossRevenue, platformFees, netRevenue, totalCosts, profit };
  };

  const netPricePerTicket =
    inputs.ticketPrice * (1 - platformFeePercent) - variableCostPerAttendee;

  const breakEvenAttendance =
    netPricePerTicket > 0
      ? Math.ceil(totalFixedCosts / netPricePerTicket)
      : null;

  const atMin = calcAtAttendance(inputs.minAttendance);
  const atMax = calcAtAttendance(inputs.maxAttendance);

  const chartData: ChartDataPoint[] = Array.from({ length: 21 }, (_, i) => {
    const att = Math.round((inputs.maxAttendance * 1.2 * i) / 20);
    return { attendance: att, ...calcAtAttendance(att) };
  });

  return {
    totalFixedCosts,
    variableCostPerAttendee,
    breakEvenAttendance,
    atMin,
    atMax,
    chartData,
    platformFeePercent,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style:'currency',
    currency:'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface NumberInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}

function NumberInput({ id, label, value, onChange, prefix ='$' }: NumberInputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {prefix && <span className="sr-only">{prefix} </span>}
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className={prefix ?'pl-7' : undefined}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEFAULT_INPUTS: EventBudgetInputs = {
  eventType:'fundraiser',
  fixedCosts: {
    venue: 0,
    permitsInsurance: 0,
    entertainmentSpeaker: 0,
    equipmentRental: 0,
    otherFixed: 0,
  },
  variableCosts: {
    cateringFood: 0,
    materialsSupplies: 0,
    tshirtSwag: 0,
    otherVariable: 0,
  },
  minAttendance: 20,
  maxAttendance: 80,
  ticketPrice: 25,
  paymentPlatform:'venmo',
};

export default function EventBudgetPlanner() {
  const [inputs, setInputs] = useState<EventBudgetInputs>(DEFAULT_INPUTS);

  const results = useMemo(() => calculateEventBudget(inputs), [inputs]);

  const setFixedCost = (field: keyof FixedCosts, value: number) => {
    setInputs((prev) => ({
      ...prev,
      fixedCosts: { ...prev.fixedCosts, [field]: value },
    }));
  };

  const setVariableCost = (field: keyof VariableCosts, value: number) => {
    setInputs((prev) => ({
      ...prev,
      variableCosts: { ...prev.variableCosts, [field]: value },
    }));
  };

  // Determine if ticket price covers variable costs
  const ticketBelowVariableCost =
    inputs.ticketPrice > 0 && inputs.ticketPrice <= results.variableCostPerAttendee;
  const allZero = inputs.ticketPrice === 0 && results.totalFixedCosts === 0;

  // Platform fee savings vs GatherGrove
  const showSavingsCallout =
    (inputs.paymentPlatform ==='eventbrite' ||
      inputs.paymentPlatform ==='venmo' ||
      inputs.paymentPlatform ==='paypal') &&
    results.atMax.platformFees > 0;

  const platformSavings = results.atMax.platformFees; // GatherGrove = $0 fees

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── Left column: inputs ─────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Event type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" aria-hidden="true" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="event-type-trigger">
                Event Type
              </label>
              <Select
                value={inputs.eventType}
                onValueChange={(v) =>
                  setInputs((prev) => ({ ...prev, eventType: v as EventType }))
                }
              >
                <SelectTrigger id="event-type-trigger" aria-label="Event type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fundraiser">Fundraiser</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="camp">Camp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="payment-platform-trigger">
                Payment Platform
              </label>
              <Select
                value={inputs.paymentPlatform}
                onValueChange={(v) =>
                  setInputs((prev) => ({
                    ...prev,
                    paymentPlatform: v as PaymentPlatform,
                  }))
                }
              >
                <SelectTrigger id="payment-platform-trigger" aria-label="Payment platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash / Check</SelectItem>
                  <SelectItem value="venmo">Venmo (2.9% fee)</SelectItem>
                  <SelectItem value="paypal">PayPal (2.9% fee)</SelectItem>
                  <SelectItem value="eventbrite">Eventbrite (~5% fee)</SelectItem>
                  <SelectItem value="gathergrove">GatherGrove (0% fee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fixed costs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fixed Costs</CardTitle>
            <CardDescription>One-time costs regardless of attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <NumberInput
              id="fixed-venue"
              label="Venue / Facility Rental"
              value={inputs.fixedCosts.venue}
              onChange={(v) => setFixedCost('venue', v)}
            />
            <NumberInput
              id="fixed-permits"
              label="Permits & Insurance"
              value={inputs.fixedCosts.permitsInsurance}
              onChange={(v) => setFixedCost('permitsInsurance', v)}
            />
            <NumberInput
              id="fixed-entertainment"
              label="Entertainment / Speaker"
              value={inputs.fixedCosts.entertainmentSpeaker}
              onChange={(v) => setFixedCost('entertainmentSpeaker', v)}
            />
            <NumberInput
              id="fixed-equipment-rental"
              label="Equipment Rental"
              value={inputs.fixedCosts.equipmentRental}
              onChange={(v) => setFixedCost('equipmentRental', v)}
            />
            <NumberInput
              id="fixed-other"
              label="Other Fixed Costs"
              value={inputs.fixedCosts.otherFixed}
              onChange={(v) => setFixedCost('otherFixed', v)}
            />
          </CardContent>
        </Card>

        {/* Variable costs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Variable Costs (per attendee)</CardTitle>
            <CardDescription>Costs that scale with each additional person</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <NumberInput
              id="var-catering"
              label="Catering / Food & Drinks"
              value={inputs.variableCosts.cateringFood}
              onChange={(v) => setVariableCost('cateringFood', v)}
            />
            <NumberInput
              id="var-materials"
              label="Materials & Supplies"
              value={inputs.variableCosts.materialsSupplies}
              onChange={(v) => setVariableCost('materialsSupplies', v)}
            />
            <NumberInput
              id="var-tshirt"
              label="T-Shirt / Swag"
              value={inputs.variableCosts.tshirtSwag}
              onChange={(v) => setVariableCost('tshirtSwag', v)}
            />
            <NumberInput
              id="var-other"
              label="Other Variable Costs"
              value={inputs.variableCosts.otherVariable}
              onChange={(v) => setVariableCost('otherVariable', v)}
            />
          </CardContent>
        </Card>

        {/* Attendance & pricing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              Attendance &amp; Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="min-attendance"
                label="Min Attendees"
                value={inputs.minAttendance}
                onChange={(v) =>
                  setInputs((prev) => ({
                    ...prev,
                    minAttendance: Math.min(v, prev.maxAttendance),
                  }))
                }
                prefix=""
              />
              <NumberInput
                id="max-attendance"
                label="Max Attendees"
                value={inputs.maxAttendance}
                onChange={(v) =>
                  setInputs((prev) => ({
                    ...prev,
                    maxAttendance: Math.max(v, prev.minAttendance),
                  }))
                }
                prefix=""
              />
            </div>
            <NumberInput
              id="ticket-price"
              label="Ticket Price"
              value={inputs.ticketPrice}
              onChange={(v) => setInputs((prev) => ({ ...prev, ticketPrice: v }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Right column: results ────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Break-even card */}
        <motion.div layout>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
                Break-Even Point
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {allZero ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-muted-foreground text-sm"
                  >
                    Enter your costs and ticket price above to see your break-even point.
                  </motion.p>
                ) : results.breakEvenAttendance === null ? (
                  <motion.div
                    key="impossible"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 text-destructive"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="text-sm">
                      Your ticket price doesn&apos;t cover your per-attendee costs. Consider raising
                      your ticket price.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="breakeven"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-3xl font-bold tabular-nums">
                      {results.breakEvenAttendance}
                      <span className="text-base font-normal text-muted-foreground ml-2">
                        attendees
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You need{''}
                      <strong>{results.breakEvenAttendance} attendees</strong> to break even.
                    </p>
                    {ticketBelowVariableCost && (
                      <p className="text-sm text-amber-600 mt-2" role="alert">
                        Your ticket price doesn&apos;t cover variable costs per attendee.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Min/Max attendance results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* At min attendance */}
          <Card
            className={
              results.atMin.profit >= 0
                ?'border-green-200 bg-green-50/30'
                :'border-red-200 bg-red-50/30'
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                {results.atMin.profit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
                )}
                At min attendance ({inputs.minAttendance})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  results.atMin.profit >= 0 ?'text-green-700' :'text-red-600'
                }`}
              >
                {formatCurrency(results.atMin.profit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue: {formatCurrency(results.atMin.netRevenue)} &bull; Costs:{''}
                {formatCurrency(results.atMin.totalCosts)}
              </p>
            </CardContent>
          </Card>

          {/* At max attendance */}
          <Card
            className={
              results.atMax.profit >= 0
                ?'border-green-200 bg-green-50/30'
                :'border-red-200 bg-red-50/30'
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                {results.atMax.profit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
                )}
                At max attendance ({inputs.maxAttendance})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  results.atMax.profit >= 0 ?'text-green-700' :'text-red-600'
                }`}
              >
                {formatCurrency(results.atMax.profit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue: {formatCurrency(results.atMax.netRevenue)} &bull; Costs:{''}
                {formatCurrency(results.atMax.totalCosts)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform fee savings callout */}
        <AnimatePresence>
          {showSavingsCallout && (
            <motion.div
              key="savings"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-primary">
                    Switching to GatherGrove saves{''}
                    <strong>{formatCurrency(platformSavings)}</strong> in platform fees at max
                    attendance.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profit/loss chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profit / Loss Projection</CardTitle>
            <CardDescription>Profit at each attendance level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56" style={{ minHeight: 224 }}>
              <ResponsiveContainer width="100%" height={224}>
                <LineChart data={results.chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attendance" label={{ value:'Attendees', position:'insideBottom', offset: -2 }} />
                  <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value)),'Profit / Loss']}
                    labelFormatter={(label: unknown) => `${label} attendees`}
                  />
                  <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 2" label="Break-even" />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead capture */}
        <ToolLeadCapture
          source="tool-event-budget"
          ctaText="Get your event budget spreadsheet template"
          toolData={inputs as unknown as Record<string, unknown>}
        />

        {/* CTA */}
        <div className="text-center">
          <a
            href="/register"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Collect event payments with zero platform fees →
          </a>
        </div>
      </div>
    </div>
  );
}
