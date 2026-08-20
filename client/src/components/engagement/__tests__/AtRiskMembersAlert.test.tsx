import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AtRiskMembersAlert from '../AtRiskMembersAlert';
import apiClient from '@/services/apiClient';
import { logger } from '@/lib/logger';

// Mock the HTTP boundary only — the real memberEngagementService and real
// component run against this mocked transport, exercising the actual
// fetch + mapping + render wiring (no fabricated component data).
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Logger is mocked so we can assert the outreach action fires.
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

interface MockAvatarProps {
  children: React.ReactNode;
  className?: string;
}
interface MockAvatarImageProps {
  src?: string;
}
interface MockAvatarFallbackProps {
  children: React.ReactNode;
}
interface MockCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  [key: string]: any;
}

// Lightweight UI shims keep Radix primitives deterministic in jsdom while the
// component, service and mapping logic all run for real.
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: MockAvatarProps) => <div className={className} data-testid="avatar">{children}</div>,
  AvatarImage: ({ src }: MockAvatarImageProps) => (src ? <img src={src} data-testid="avatar-image" alt="Avatar" /> : null),
  AvatarFallback: ({ children }: MockAvatarFallbackProps) => <div data-testid="avatar-fallback">{children}</div>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked = false, onCheckedChange, ...props }: MockCheckboxProps) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        if (onCheckedChange) {
          onCheckedChange(e.target.checked);
        }
      }}
      data-testid="checkbox"
      {...props}
    />
  ),
}));

const mockGet = apiClient.get as jest.Mock;

// Backend-shaped MemberEngagementScore payload. Produces 2 high, 2 medium,
// 1 low risk members after the real classifyRiskLevel mapping.
const backendScores = [
  {
    id: 1,
    memberId: 101,
    clubId: 123,
    overallScore: 20,
    loginScore: 5,
    eventScore: 60,
    communicationScore: 55,
    featureUsageScore: 70,
    profileCompletenessScore: 80,
    lastLoginDate: '2026-04-18T00:00:00Z',
    daysSinceLastLogin: 40,
    isAtRisk: true,
    engagementLevel: 'Red',
    activityLevel: 'Inactive',
    member: { firstName: 'Jordan', lastName: 'Avery', email: 'jordan.avery@example.com', joinDate: '2023-03-15T00:00:00Z' },
  },
  {
    id: 2,
    memberId: 102,
    clubId: 123,
    overallScore: 22,
    loginScore: 60,
    eventScore: 4,
    communicationScore: 55,
    featureUsageScore: 70,
    profileCompletenessScore: 80,
    lastLoginDate: '2026-05-10T00:00:00Z',
    daysSinceLastLogin: 25,
    isAtRisk: true,
    engagementLevel: 'Red',
    activityLevel: 'Inactive',
    member: { firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@example.com', joinDate: '2024-01-08T00:00:00Z' },
  },
  {
    id: 3,
    memberId: 103,
    clubId: 123,
    overallScore: 30,
    loginScore: 60,
    eventScore: 55,
    communicationScore: 6,
    featureUsageScore: 70,
    profileCompletenessScore: 80,
    lastLoginDate: '2026-05-15T00:00:00Z',
    daysSinceLastLogin: 15,
    isAtRisk: true,
    engagementLevel: 'Yellow',
    activityLevel: 'Moderate',
    member: { firstName: 'Sam', lastName: 'Okafor', email: 'sam.okafor@example.com', joinDate: '2023-11-22T00:00:00Z' },
  },
  {
    id: 4,
    memberId: 104,
    clubId: 123,
    overallScore: 33,
    loginScore: 60,
    eventScore: 55,
    communicationScore: 50,
    featureUsageScore: 7,
    profileCompletenessScore: 80,
    lastLoginDate: '2026-05-20T00:00:00Z',
    daysSinceLastLogin: 10,
    isAtRisk: true,
    engagementLevel: 'Yellow',
    activityLevel: 'Moderate',
    member: { firstName: 'Lena', lastName: 'Vogt', email: 'lena.vogt@example.com', joinDate: '2023-08-05T00:00:00Z' },
  },
  {
    id: 5,
    memberId: 105,
    clubId: 123,
    overallScore: 38,
    loginScore: 30,
    eventScore: 55,
    communicationScore: 50,
    featureUsageScore: 70,
    profileCompletenessScore: 80,
    lastLoginDate: '2026-05-22T00:00:00Z',
    daysSinceLastLogin: 8,
    isAtRisk: true,
    engagementLevel: 'Green',
    activityLevel: 'Moderate',
    member: { firstName: 'Tomas', lastName: 'Reyes', email: 'tomas.reyes@example.com', joinDate: '2024-02-14T00:00:00Z' },
  },
];

const mockAtRiskResponse = () => mockGet.mockResolvedValue({ data: backendScores });

describe('AtRiskMembersAlert', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mockAtRiskResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Backend wiring', () => {
    it('calls the MemberEngagement at-risk endpoint for the club', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/club/123/at-risk', {
          params: { threshold: 40 },
        });
      });
    });

    it('renders members returned by the backend (no fabricated data)', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(screen.getByText('Priya Nair')).toBeInTheDocument();
      expect(screen.getByText('Sam Okafor')).toBeInTheDocument();
      expect(screen.getByText('Lena Vogt')).toBeInTheDocument();
      expect(screen.getByText('Tomas Reyes')).toBeInTheDocument();

      // The legacy fabricated members must NOT appear anymore.
      expect(screen.queryByText('Jennifer Walsh')).not.toBeInTheDocument();
      expect(screen.queryByText('Marcus Rodriguez')).not.toBeInTheDocument();
    });

    it('shows the alert header with backend-derived risk counts', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('2 high risk, 2 medium risk members need attention')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Member Display and Information', () => {
    it('displays mapped member information from the backend', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(screen.getByText('jordan.avery@example.com')).toBeInTheDocument();
      expect(screen.getByText('Score: 20% (↓0%)')).toBeInTheDocument();
      expect(screen.getByText('Last login: 40 days ago')).toBeInTheDocument();
      // Primary reason derived from the lowest sub-score (loginScore = 5).
      // Tomas also maps to this reason (his lowest is loginScore = 30).
      expect(screen.getAllByText('Low login activity').length).toBeGreaterThanOrEqual(1);
    });

    it('derives the weakest-signal reason per member', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Priya Nair')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Priya's lowest sub-score is eventScore = 4.
      expect(screen.getByText('Reduced event participation')).toBeInTheDocument();
      // Sam's lowest sub-score is communicationScore = 6.
      expect(screen.getByText('Low communication engagement')).toBeInTheDocument();
      // Lena's lowest sub-score is featureUsageScore = 7.
      expect(screen.getByText('Limited feature usage')).toBeInTheDocument();
    });

    it('shows avatar fallbacks built from real initials', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('JA')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(screen.getByText('PN')).toBeInTheDocument();
      expect(screen.getByText('SO')).toBeInTheDocument();
      expect(screen.getByText('LV')).toBeInTheDocument();
      expect(screen.getByText('TR')).toBeInTheDocument();
    });

    it('shows the high/medium/low risk badges', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      // 1 summary-card label + 2 member badges.
      expect(screen.getAllByText('High Risk').length).toBeGreaterThanOrEqual(3);
      expect(screen.getAllByText('Medium Risk').length).toBeGreaterThanOrEqual(3);
      expect(screen.getAllByText('Low Risk').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Filtering and Sorting', () => {
    it('filters members by search term', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      const searchInput = screen.getByPlaceholderText('Search members...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'jordan' } });

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
        expect(screen.queryByText('Priya Nair')).not.toBeInTheDocument();
        expect(screen.queryByText('Sam Okafor')).not.toBeInTheDocument();
      });
    });

    it('keeps all members visible by default', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      ['Jordan Avery', 'Priya Nair', 'Sam Okafor', 'Lena Vogt', 'Tomas Reyes'].forEach((name) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(5);
    });
  });

  describe('Member Selection and Bulk Actions', () => {
    it('allows selecting an individual member and shows the bulk bar', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText('1 member selected')).toBeInTheDocument();
        const bar = screen.getByTestId('bulk-actions-bar');
        expect(within(bar).getByText('Email')).toBeInTheDocument();
        expect(within(bar).getByText('Message')).toBeInTheDocument();
        expect(within(bar).getByText('Schedule Call')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('allows selecting all members', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      }, { timeout: 10000 });

      const selectAllRow = screen.getByText('Select All').closest('div') as HTMLElement;
      const selectAllCheckbox = within(selectAllRow).getByRole('checkbox');
      await user.click(selectAllCheckbox);

      await waitFor(() => {
        expect(screen.getByText('5 members selected')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('opens the email outreach dialog for a selected member', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      await user.click(screen.getAllByRole('checkbox')[1]);
      await waitFor(() => expect(screen.getByText('1 member selected')).toBeInTheDocument());

      await user.click(screen.getByText('Email'));

      await waitFor(() => {
        expect(screen.getByText('Send Email to At-Risk Members')).toBeInTheDocument();
        expect(screen.getByText('Reaching out to 1 selected member')).toBeInTheDocument();
        expect(screen.getByDisplayValue('We miss you at our club!')).toBeInTheDocument();
      });
    });

    it('sends outreach and logs the action', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      await user.click(screen.getAllByRole('checkbox')[1]);
      await waitFor(() => expect(screen.getByText('1 member selected')).toBeInTheDocument());

      await user.click(screen.getByText('Email'));
      const sendButton = await waitFor(() => {
        expect(screen.getByText('Send Email to At-Risk Members')).toBeInTheDocument();
        return screen.getByText('Send Email');
      });

      await user.click(sendButton);

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith(
          'engagement',
          'Sending outreach',
          expect.objectContaining({
            type: 'email',
            recipientCount: expect.any(Number),
            hasSubject: expect.any(Boolean),
          })
        );
      });
    });
  });

  describe('Alert Configuration', () => {
    it('opens the configuration dialog', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Configure Alerts')).toBeInTheDocument();
      }, { timeout: 10000 });

      await user.click(screen.getByText('Configure Alerts'));

      await waitFor(() => {
        expect(screen.getByText('Alert Configuration')).toBeInTheDocument();
        expect(screen.getByText('Enable Alerts')).toBeInTheDocument();
        expect(screen.getByText('Risk Threshold')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Empty and Error States', () => {
    it('shows the filtered empty state when no members match the search', async () => {
      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
      }, { timeout: 10000 });

      const searchInput = screen.getByPlaceholderText('Search members...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'NonExistentMember' } });

      await waitFor(() => {
        expect(screen.getByText('No at-risk members found')).toBeInTheDocument();
      });
    });

    it('renders an error banner when the backend call fails', async () => {
      mockGet.mockReset();
      mockGet.mockRejectedValueOnce(new Error('boom'));

      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('at-risk-load-error')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(screen.getByText('Unable to load at-risk members. Please try again.')).toBeInTheDocument();
      expect(logger.error).toHaveBeenCalledWith(
        'engagement',
        'Failed to fetch at-risk members',
        expect.objectContaining({ clubId: '123' })
      );
    });

    it('handles a non-array payload without crashing', async () => {
      mockGet.mockReset();
      mockGet.mockResolvedValueOnce({ data: null });

      render(<AtRiskMembersAlert clubId="123" />);

      await waitFor(() => {
        expect(screen.getByText('At-Risk Members')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(screen.queryByTestId('at-risk-load-error')).not.toBeInTheDocument();
    });
  });

  describe('Lifecycle', () => {
    it('unmounts cleanly', async () => {
      const { unmount } = render(<AtRiskMembersAlert clubId="123" />);
      await waitFor(() => expect(screen.getByText('At-Risk Members')).toBeInTheDocument(), { timeout: 10000 });
      expect(() => unmount()).not.toThrow();
    });
  });
});
