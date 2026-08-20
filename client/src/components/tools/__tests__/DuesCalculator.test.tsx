import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DuesCalculator, { calculateDues } from '../DuesCalculator';
import { marketingService } from '@/services/marketingService';

// Mock marketingService — external HTTP boundary only
jest.mock('@/services/marketingService', () => ({
  marketingService: {
    captureToolLead: jest.fn(),
  },
}));

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-chartjs-2 — it's an external visualization library
jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data }: { data: { labels: string[] } }) => (
    <div data-testid="doughnut-chart" aria-label="Expense breakdown chart">
      {data.labels.map((label: string) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  ),
}));

const mockCaptureToolLead = marketingService.captureToolLead as jest.MockedFunction<
  typeof marketingService.captureToolLead
>;

// ─── Pure function tests (no mocking needed) ────────────────────────────────

describe('calculateDues (pure function)', () => {
  const baseInputs = {
    clubType: 'sports' as const,
    memberCount: 10,
    expenses: {
      venue: 0,
      equipment: 0,
      insurance: 0,
      software: 0,
      events: 0,
      marketing: 0,
      other: 0,
    },
    surplusPercent: 0,
    billingPreference: 'monthly' as const,
  };

  it('returns zero dues when memberCount is 0', () => {
    const result = calculateDues({ ...baseInputs, memberCount: 0 });
    expect(result.annualPerMember).toBe(0);
    expect(result.monthlyPerMember).toBe(0);
    expect(result.totalAnnualBudget).toBe(0);
    expect(result.totalWithSurplus).toBe(0);
  });

  it('returns correct annual and monthly dues for basic case', () => {
    // $1200 total expenses / 10 members = $120/yr = $10/mo
    const result = calculateDues({
      ...baseInputs,
      memberCount: 10,
      expenses: { ...baseInputs.expenses, venue: 1200 },
    });
    expect(result.annualPerMember).toBe(120);
    expect(result.monthlyPerMember).toBe(10);
    expect(result.totalAnnualBudget).toBe(1200);
    expect(result.totalWithSurplus).toBe(1200);
  });

  it('applies surplus percentage correctly', () => {
    // $1000 expenses + 10% surplus = $1100 total; 10 members = $110/yr
    const result = calculateDues({
      ...baseInputs,
      memberCount: 10,
      expenses: { ...baseInputs.expenses, venue: 1000 },
      surplusPercent: 10,
    });
    expect(result.totalAnnualBudget).toBe(1000);
    expect(result.totalWithSurplus).toBe(1100);
    expect(result.annualPerMember).toBe(110);
    expect(result.monthlyPerMember).toBeCloseTo(9.17, 1);
  });

  it('calculates breakdown percentages correctly', () => {
    const result = calculateDues({
      ...baseInputs,
      memberCount: 10,
      expenses: {
        ...baseInputs.expenses,
        venue: 600,    // 50%
        insurance: 300, // 25%
        equipment: 300, // 25%
      },
    });

    expect(result.breakdown).toHaveLength(3); // Only categories with amounts > 0
    const venueItem = result.breakdown.find((b) => b.label === 'Venue / Facility Rental');
    const insuranceItem = result.breakdown.find((b) => b.label === 'Insurance');
    const equipmentItem = result.breakdown.find((b) => b.label === 'Equipment & Supplies');

    expect(venueItem?.percentage).toBeCloseTo(50, 1);
    expect(insuranceItem?.percentage).toBeCloseTo(25, 1);
    expect(equipmentItem?.percentage).toBeCloseTo(25, 1);
  });

  it('returns empty breakdown when all expenses are 0', () => {
    const result = calculateDues(baseInputs);
    expect(result.breakdown).toHaveLength(0);
    expect(result.totalAnnualBudget).toBe(0);
  });

  it('rounds annualPerMember and monthlyPerMember to 2 decimal places', () => {
    // $100 / 3 members = $33.333... => rounds to $33.33 annual; $2.78 monthly
    const result = calculateDues({
      ...baseInputs,
      memberCount: 3,
      expenses: { ...baseInputs.expenses, venue: 100 },
    });
    expect(result.annualPerMember).toBe(33.33);
    expect(result.monthlyPerMember).toBe(2.78);
  });

  it('sums all expense categories correctly', () => {
    const result = calculateDues({
      ...baseInputs,
      memberCount: 10,
      expenses: {
        venue: 100,
        equipment: 200,
        insurance: 300,
        software: 400,
        events: 500,
        marketing: 600,
        other: 700,
      },
    });
    // 100+200+300+400+500+600+700 = 2800
    expect(result.totalAnnualBudget).toBe(2800);
    expect(result.annualPerMember).toBe(280);
  });

  it('includes each expense category in breakdown with correct label and amount', () => {
    const result = calculateDues({
      ...baseInputs,
      memberCount: 10,
      expenses: {
        ...baseInputs.expenses,
        software: 500,
        marketing: 500,
      },
    });
    const softwareItem = result.breakdown.find((b) => b.label === 'Software & Tools');
    const marketingItem = result.breakdown.find((b) => b.label === 'Marketing & Communications');
    expect(softwareItem?.amount).toBe(500);
    expect(marketingItem?.amount).toBe(500);
  });

  it('handles 30% surplus correctly', () => {
    const result = calculateDues({
      ...baseInputs,
      memberCount: 10,
      expenses: { ...baseInputs.expenses, venue: 1000 },
      surplusPercent: 30,
    });
    expect(result.totalWithSurplus).toBe(1300);
    expect(result.annualPerMember).toBe(130);
  });

  it('excludes zero-amount expense categories from breakdown', () => {
    const result = calculateDues({
      ...baseInputs,
      memberCount: 10,
      expenses: {
        venue: 1000,
        equipment: 0,
        insurance: 0,
        software: 0,
        events: 0,
        marketing: 0,
        other: 0,
      },
    });
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].label).toBe('Venue / Facility Rental');
  });
});

// ─── React component tests ───────────────────────────────────────────────────

describe('DuesCalculator component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaptureToolLead.mockResolvedValue({
      success: true,
      message: 'Lead captured',
    });
  });

  it('renders all expense input fields', () => {
    render(<DuesCalculator />);
    expect(screen.getByLabelText(/venue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/equipment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/insurance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/software/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/events/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marketing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/other/i)).toBeInTheDocument();
  });

  it('renders member count control', () => {
    render(<DuesCalculator />);
    // Should show member count label somewhere
    expect(screen.getByText(/member count/i)).toBeInTheDocument();
  });

  it('renders surplus percentage control', () => {
    render(<DuesCalculator />);
    expect(screen.getByText(/surplus/i)).toBeInTheDocument();
  });

  it('shows zero dues when all expenses are zero and memberCount > 0', () => {
    render(<DuesCalculator />);
    // With default inputs (all expenses 0, memberCount 50), dues should be $0.00
    // The component shows a helpful prompt when expenses are zero
    expect(screen.getByText(/add your expenses/i)).toBeInTheDocument();
  });

  it('shows "-" when memberCount is 0', async () => {
    render(<DuesCalculator />);
    // Find member count input and set to 0
    const memberCountInput = screen.getByLabelText(/member count/i);
    fireEvent.change(memberCountInput, { target: { value: '0' } });

    await waitFor(() => {
      // Multiple "-" spans appear (annual and monthly), check at least one exists
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  it('updates dues display when an expense field changes', async () => {
    render(<DuesCalculator />);
    const venueInput = screen.getByLabelText(/venue/i);
    fireEvent.change(venueInput, { target: { value: '1200' } });

    // With 50 members (default), $1200 venue expense, 10% surplus (default):
    // Total with surplus = $1200 * 1.10 = $1320
    // Annual = $1320/50 = $26.40/yr, Monthly = $2.20/mo
    await waitFor(() => {
      expect(screen.getByText('$26.40')).toBeInTheDocument();
    });
  });

  it('updates monthly dues when member count changes', async () => {
    render(<DuesCalculator />);
    // First add some expenses to get non-zero results
    const venueInput = screen.getByLabelText(/venue/i);
    fireEvent.change(venueInput, { target: { value: '1200' } });

    const memberCountInput = screen.getByLabelText(/member count/i);
    fireEvent.change(memberCountInput, { target: { value: '10' } });

    // $1200 + 10% surplus = $1320 / 10 members = $132/yr
    await waitFor(() => {
      expect(screen.getByText('$132.00')).toBeInTheDocument();
    });
  });

  it('renders ToolLeadCapture below results', () => {
    render(<DuesCalculator />);
    // ToolLeadCapture renders the CTA text
    expect(screen.getByText(/pdf breakdown/i)).toBeInTheDocument();
  });

  it('renders the "Collect dues automatically" CTA link pointing to /register', () => {
    render(<DuesCalculator />);
    const ctaLink = screen.getByRole('link', { name: /collect dues automatically/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/register?utm_source=tool&utm_medium=dues-calculator&utm_campaign=free-tools');
  });

  it('shows the doughnut chart when total expenses are greater than zero', async () => {
    render(<DuesCalculator />);
    const venueInput = screen.getByLabelText(/venue/i);
    fireEvent.change(venueInput, { target: { value: '500' } });

    await waitFor(() => {
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });
  });

  it('does not show the doughnut chart when all expenses are zero', () => {
    render(<DuesCalculator />);
    expect(screen.queryByTestId('doughnut-chart')).not.toBeInTheDocument();
  });

  it('shows annual dues per member result card', async () => {
    render(<DuesCalculator />);
    expect(screen.getByText(/annual dues per member/i)).toBeInTheDocument();
  });

  it('shows monthly dues per member result card', () => {
    render(<DuesCalculator />);
    expect(screen.getByText(/monthly dues per member/i)).toBeInTheDocument();
  });

  it('shows total annual budget result card', () => {
    render(<DuesCalculator />);
    expect(screen.getByText(/total annual budget/i)).toBeInTheDocument();
  });

  it('formats large numbers with commas', async () => {
    render(<DuesCalculator />);
    const venueInput = screen.getByLabelText(/venue/i);
    fireEvent.change(venueInput, { target: { value: '120000' } });

    const memberCountInput = screen.getByLabelText(/member count/i);
    fireEvent.change(memberCountInput, { target: { value: '10' } });

    // $120,000 + 10% surplus = $132,000 / 10 = $13,200/yr annual
    await waitFor(() => {
      expect(screen.getByText('$13,200.00')).toBeInTheDocument();
    });
  });

  it('updates results when surplus percentage changes', async () => {
    render(<DuesCalculator />);
    const venueInput = screen.getByLabelText(/venue/i);
    fireEvent.change(venueInput, { target: { value: '1000' } });

    const memberCountInput = screen.getByLabelText(/member count/i);
    fireEvent.change(memberCountInput, { target: { value: '10' } });

    const surplusInput = screen.getByLabelText(/surplus/i);
    fireEvent.change(surplusInput, { target: { value: '10' } });

    // $1000 * 1.10 / 10 = $110/yr
    await waitFor(() => {
      expect(screen.getByText('$110.00')).toBeInTheDocument();
    });
  });
});
