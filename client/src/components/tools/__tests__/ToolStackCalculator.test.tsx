import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolStackCalculator, { calculateStackCost } from '../ToolStackCalculator';
import { marketingService } from '@/services/marketingService';

// Mock marketingService — external HTTP boundary
jest.mock('@/services/marketingService', () => ({
  marketingService: {
    captureToolLead: jest.fn(),
  },
}));

const mockCaptureToolLead = marketingService.captureToolLead as jest.MockedFunction<
  typeof marketingService.captureToolLead
>;

// ---------------------------------------------------------------------------
// Pure function: calculateStackCost
// ---------------------------------------------------------------------------

describe('calculateStackCost', () => {
  const baseInputs = {
    selectedToolIds: [] as string[],
    memberCount: 50,
    eventsPerMonth: 2,
    avgEventFee: 20,
    adminHoursPerWeek: 5,
  };

  it('returns zero subscription and transaction costs when no tools are selected', () => {
    const result = calculateStackCost({ ...baseInputs, selectedToolIds: [] });

    expect(result.currentMonthlySubscriptions).toBe(0);
    expect(result.currentMonthlyTransactionFees).toBe(0);
    expect(result.currentMonthlyTotal).toBe(0);
    expect(result.selectedToolCount).toBe(0);
  });

  it('correctly sums subscription costs for selected tools', () => {
    // mailchimp ($17) + zoom ($16) = $33
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['mailchimp', 'zoom'],
    });

    expect(result.currentMonthlySubscriptions).toBe(33);
    expect(result.selectedToolCount).toBe(2);
  });

  it('includes all tool subscription costs when all tools selected', () => {
    const allToolIds = [
      'eventbrite', 'mailchimp', 'teamsnap', 'wildapricot',
      'venmo_paypal', 'zoom', 'surveymonkey', 'googleworkspace',
      'canva', 'slack',
    ];
    const result = calculateStackCost({ ...baseInputs, selectedToolIds: allToolIds });

    // eventbrite($25) + mailchimp($17) + teamsnap($15) + wildapricot($48)
    // + venmo_paypal($0) + zoom($16) + surveymonkey($25) + googleworkspace($7)
    // + canva($13) + slack($8) = $174
    expect(result.currentMonthlySubscriptions).toBe(174);
    expect(result.selectedToolCount).toBe(10);
  });

  it('auto-selects Seed plan for memberCount <= 100', () => {
    const result = calculateStackCost({ ...baseInputs, memberCount: 100 });
    expect(result.ggPlanName).toBe('Seed');
    expect(result.ggMonthlyCost).toBe(9);
  });

  it('auto-selects Seed plan for memberCount of 1', () => {
    const result = calculateStackCost({ ...baseInputs, memberCount: 1 });
    expect(result.ggPlanName).toBe('Seed');
    expect(result.ggMonthlyCost).toBe(9);
  });

  it('auto-selects Grow plan for memberCount of 101', () => {
    const result = calculateStackCost({ ...baseInputs, memberCount: 101 });
    expect(result.ggPlanName).toBe('Grow');
    expect(result.ggMonthlyCost).toBe(29);
  });

  it('auto-selects Grow plan for memberCount of 200', () => {
    const result = calculateStackCost({ ...baseInputs, memberCount: 200 });
    expect(result.ggPlanName).toBe('Grow');
    expect(result.ggMonthlyCost).toBe(29);
  });

  it('auto-selects Expand plan for memberCount of 201', () => {
    const result = calculateStackCost({ ...baseInputs, memberCount: 201 });
    expect(result.ggPlanName).toBe('Expand');
    expect(result.ggMonthlyCost).toBe(200);
  });

  it('auto-selects Expand plan for memberCount of 500', () => {
    const result = calculateStackCost({ ...baseInputs, memberCount: 500 });
    expect(result.ggPlanName).toBe('Expand');
    expect(result.ggMonthlyCost).toBe(200);
  });

  it('calculates Eventbrite transaction fees when eventbrite is selected', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['eventbrite'],
      memberCount: 50,
      eventsPerMonth: 2,
      avgEventFee: 20,
    });

    // Eventbrite: eventsPerMonth * avgEventFee * memberCount * attendanceRate(0.4) * 3.5/100
    // = 2 * 20 * 50 * 0.4 * 0.035 = 28
    expect(result.currentMonthlyTransactionFees).toBeCloseTo(28, 5);
  });

  it('calculates Venmo/PayPal transaction fees when venmo_paypal is selected', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['venmo_paypal'],
      memberCount: 50,
    });

    // VenmoPayPal: memberCount * 15 * 0.20 * 0.029
    // = 50 * 15 * 0.20 * 0.029 = 4.35
    expect(result.currentMonthlyTransactionFees).toBeCloseTo(4.35, 5);
  });

  it('calculates combined transaction fees for both eventbrite and venmo_paypal', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['eventbrite', 'venmo_paypal'],
      memberCount: 50,
      eventsPerMonth: 2,
      avgEventFee: 20,
    });

    // Eventbrite: 28, VenmoPayPal: 4.35
    expect(result.currentMonthlyTransactionFees).toBeCloseTo(32.35, 5);
  });

  it('returns GG monthly cost as zero transaction fees', () => {
    const result = calculateStackCost({ ...baseInputs });
    expect(result.ggTransactionFees).toBe(0);
  });

  it('returns positive savings when current stack exceeds GatherGrove cost', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['mailchimp', 'zoom', 'wildapricot'],
      memberCount: 50,
    });
    // mailchimp($17) + zoom($16) + wildapricot($48) = $81 vs Seed($9)
    expect(result.monthlySavings).toBeCloseTo(72, 1);
    expect(result.annualSavings).toBeCloseTo(72 * 12, 0);
  });

  it('calculates annual savings as 12x monthly savings', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['mailchimp'],
      memberCount: 50,
    });

    expect(result.annualSavings).toBeCloseTo(result.monthlySavings * 12, 5);
  });

  it('handles zero eventsPerMonth with no eventbrite fees', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['eventbrite'],
      eventsPerMonth: 0,
    });

    expect(result.currentMonthlyTransactionFees).toBe(0);
  });

  it('handles zero avgEventFee with no eventbrite fees', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['eventbrite'],
      avgEventFee: 0,
    });

    expect(result.currentMonthlyTransactionFees).toBe(0);
  });

  it('correctly sets currentMonthlyTotal as sum of subscriptions and fees', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['mailchimp'],
      memberCount: 50,
    });

    expect(result.currentMonthlyTotal).toBeCloseTo(
      result.currentMonthlySubscriptions + result.currentMonthlyTransactionFees,
      5
    );
  });

  it('GG cost does not include transaction fees (replaces platform fees)', () => {
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['eventbrite'],
      memberCount: 50,
    });

    expect(result.ggMonthlyCost).toBe(9); // No transaction fees added
    expect(result.ggTransactionFees).toBe(0);
  });

  it('calculates annualAdminTimeCost as adminHoursPerWeek * 4 * 12 * 25', () => {
    // 5 hours/week * 4 weeks/mo * 12 months * $25/hr = $6,000
    const result = calculateStackCost({ ...baseInputs, adminHoursPerWeek: 5 });
    expect(result.annualAdminTimeCost).toBe(5 * 4 * 12 * 25);
  });

  it('calculates annualAdminTimeCost of zero when adminHoursPerWeek is 0', () => {
    const result = calculateStackCost({ ...baseInputs, adminHoursPerWeek: 0 });
    expect(result.annualAdminTimeCost).toBe(0);
  });

  it('includes annualAdminTimeCost in totalCurrentCost', () => {
    // mailchimp ($17/mo) + adminTimeCost ($6,000/yr = $500/mo)
    const result = calculateStackCost({
      ...baseInputs,
      selectedToolIds: ['mailchimp'],
      adminHoursPerWeek: 5,
    });
    const expectedAdminMonthly = (5 * 4 * 12 * 25) / 12; // = 500
    expect(result.totalCurrentCost).toBeCloseTo(
      result.currentMonthlyTotal * 12 + result.annualAdminTimeCost,
      5
    );
    expect(result.totalCurrentCost).toBeCloseTo(17 * 12 + expectedAdminMonthly * 12, 1);
  });
});

// ---------------------------------------------------------------------------
// React component tests
// ---------------------------------------------------------------------------

describe('ToolStackCalculator component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaptureToolLead.mockResolvedValue({
      success: true,
      message: 'Lead captured',
    });
  });

  it('renders all tool checkboxes', () => {
    render(<ToolStackCalculator />);

    expect(screen.getByLabelText(/eventbrite/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mailchimp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teamsnap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wild apricot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/venmo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zoom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/surveymonkey/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/google workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/canva pro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slack/i)).toBeInTheDocument();
  });

  it('shows "Select tools" prompt when no tools are checked', () => {
    render(<ToolStackCalculator />);

    expect(
      screen.getByText(/select the tools your club currently uses/i)
    ).toBeInTheDocument();
  });

  it('does not show the prompt when a tool is checked', async () => {
    render(<ToolStackCalculator />);

    const mailchimpCheckbox = screen.getByLabelText(/mailchimp/i);
    await userEvent.click(mailchimpCheckbox);

    expect(
      screen.queryByText(/select the tools your club currently uses/i)
    ).not.toBeInTheDocument();
  });

  it('shows cost comparison when tools are checked', async () => {
    render(<ToolStackCalculator />);

    const mailchimpCheckbox = screen.getByLabelText(/mailchimp/i);
    await userEvent.click(mailchimpCheckbox);

    // Should show current cost and GatherGrove cost
    expect(screen.getByText(/your current tool stack costs/i)).toBeInTheDocument();
    expect(screen.getByText(/gathergrove/i)).toBeInTheDocument();
  });

  it('updates cost display when additional tools are checked', async () => {
    render(<ToolStackCalculator />);

    // Check mailchimp first
    await userEvent.click(screen.getByLabelText(/mailchimp/i));

    // Check zoom as well
    await userEvent.click(screen.getByLabelText(/zoom/i));

    // Both tools should be selected, showing combined cost
    expect(screen.getByText(/your current tool stack costs/i)).toBeInTheDocument();
  });

  it('renders member count slider', () => {
    render(<ToolStackCalculator />);

    // Slider has role="slider"
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it('renders events per month slider', () => {
    render(<ToolStackCalculator />);

    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);
  });

  it('renders ToolLeadCapture below results when tools are checked', async () => {
    render(<ToolStackCalculator />);

    await userEvent.click(screen.getByLabelText(/mailchimp/i));

    // ToolLeadCapture has an email input
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
  });

  it('renders ToolLeadCapture even when no tools are checked', () => {
    render(<ToolStackCalculator />);

    // ToolLeadCapture should always be rendered
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
  });

  it('renders CTA link to /register', () => {
    render(<ToolStackCalculator />);

    const ctaLink = screen.getByRole('link', { name: /replace your entire stack/i });
    expect(ctaLink).toHaveAttribute('href', '/register');
  });

  it('renders trial note under CTA', () => {
    render(<ToolStackCalculator />);

    expect(screen.getByText(/30-day free trial/i)).toBeInTheDocument();
  });

  it('shows savings highlight card when savings are positive', async () => {
    render(<ToolStackCalculator />);

    // Select expensive tools to ensure positive savings
    await userEvent.click(screen.getByLabelText(/wild apricot/i));
    await userEvent.click(screen.getByLabelText(/mailchimp/i));

    expect(screen.getByText(/your savings/i)).toBeInTheDocument();
  });

  it('shows plan name in GatherGrove cost display when tools are checked', async () => {
    render(<ToolStackCalculator />);

    await userEvent.click(screen.getByLabelText(/mailchimp/i));

    // Default 50 members → Seed plan (may appear multiple times in description text)
    const seedElements = screen.getAllByText(/seed/i);
    expect(seedElements.length).toBeGreaterThanOrEqual(1);
  });

  it('unchecking a tool removes it from the selection', async () => {
    render(<ToolStackCalculator />);

    const mailchimpCheckbox = screen.getByLabelText(/mailchimp/i);

    // Check then uncheck
    await userEvent.click(mailchimpCheckbox);
    await userEvent.click(mailchimpCheckbox);

    // Should show prompt again
    expect(
      screen.getByText(/select the tools your club currently uses/i)
    ).toBeInTheDocument();
  });

  it('renders admin hours input', () => {
    render(<ToolStackCalculator />);

    const adminHoursInput = screen.getByRole('spinbutton');
    expect(adminHoursInput).toBeInTheDocument();
  });

  it('shows category labels for tools', () => {
    render(<ToolStackCalculator />);

    // Categories appear as badges next to tool labels — may also match other text
    const eventsElements = screen.getAllByText(/events/i);
    expect(eventsElements.length).toBeGreaterThanOrEqual(1);

    const emailElements = screen.getAllByText(/email/i);
    expect(emailElements.length).toBeGreaterThanOrEqual(1);
  });

  it('notes about transaction fees when Eventbrite is checked', async () => {
    render(<ToolStackCalculator />);

    await userEvent.click(screen.getByLabelText(/eventbrite/i));

    // Should mention transaction fees in some way (may appear in description + info box)
    const feeElements = screen.getAllByText(/transaction fee/i);
    expect(feeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays Admin Time Cost card in results when a tool is checked', async () => {
    render(<ToolStackCalculator />);

    await userEvent.click(screen.getByLabelText(/mailchimp/i));

    expect(screen.getByText(/admin time cost/i)).toBeInTheDocument();
  });

  it('displays Admin Time Cost card with @ $25/hr label', async () => {
    render(<ToolStackCalculator />);

    await userEvent.click(screen.getByLabelText(/mailchimp/i));

    const elements = screen.getAllByText(/\$25\/hr/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});
