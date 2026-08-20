import apiClient from '../apiClient';
import {
  memberEngagementService,
  classifyRiskLevel,
  deriveReasons,
  mapToAtRiskMember,
  type BackendEngagementScore,
} from '../memberEngagementService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;

const buildScore = (overrides: Partial<BackendEngagementScore> = {}): BackendEngagementScore => ({
  id: 10,
  memberId: 42,
  clubId: 123,
  overallScore: 30,
  loginScore: 20,
  eventScore: 60,
  communicationScore: 55,
  featureUsageScore: 70,
  profileCompletenessScore: 80,
  lastLoginDate: '2026-04-01T00:00:00Z',
  daysSinceLastLogin: 12,
  isAtRisk: true,
  engagementLevel: 'Yellow',
  activityLevel: 'Moderate',
  member: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    joinDate: '2023-01-15T00:00:00Z',
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('classifyRiskLevel', () => {
  it('classifies scores below 25 as high', () => {
    expect(classifyRiskLevel(0)).toBe('high');
    expect(classifyRiskLevel(24.9)).toBe('high');
  });

  it('classifies scores 25–34.9 as medium', () => {
    expect(classifyRiskLevel(25)).toBe('medium');
    expect(classifyRiskLevel(34.9)).toBe('medium');
  });

  it('classifies scores 35+ as low', () => {
    expect(classifyRiskLevel(35)).toBe('low');
    expect(classifyRiskLevel(100)).toBe('low');
  });
});

describe('deriveReasons', () => {
  it('derives the reason from the lowest sub-score', () => {
    const result = deriveReasons(buildScore({ loginScore: 5, eventScore: 60, communicationScore: 50, featureUsageScore: 70, profileCompletenessScore: 80 }));
    expect(result.primaryReason).toBe('Low login activity');
    expect(result.suggestedActions.length).toBeGreaterThan(0);
  });

  it('picks event participation when that is the weakest signal', () => {
    const result = deriveReasons(buildScore({ loginScore: 80, eventScore: 3, communicationScore: 50, featureUsageScore: 70, profileCompletenessScore: 80 }));
    expect(result.primaryReason).toBe('Reduced event participation');
  });

  it('falls back to a neutral reason when no sub-scores exist', () => {
    const result = deriveReasons({ memberId: 1, overallScore: 10 });
    expect(result.primaryReason).toBe('Declining engagement score');
    expect(result.suggestedActions).toEqual(['Reach out to check in']);
  });
});

describe('mapToAtRiskMember', () => {
  it('maps real backend fields without fabricating values', () => {
    const mapped = mapToAtRiskMember(buildScore());
    expect(mapped).toMatchObject({
      id: '42',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      joinDate: '2023-01-15T00:00:00Z',
      lastLogin: '2026-04-01T00:00:00Z',
      currentScore: 30,
      previousScore: 30,
      declineRate: 0,
      riskLevel: 'medium',
      daysSinceLastLogin: 12,
      membershipTier: '',
      totalContributions: 0,
      eventsAttended: 0,
      lastEventAttendance: '',
    });
    expect(mapped.primaryReason).toBe('Low login activity');
  });

  it('falls back to "Member {id}" when no name is present', () => {
    const mapped = mapToAtRiskMember(buildScore({ member: null, lastLoginDate: null }));
    expect(mapped.name).toBe('Member 42');
    expect(mapped.email).toBe('');
    expect(mapped.joinDate).toBe('');
    expect(mapped.lastLogin).toBe('');
  });
});

describe('memberEngagementService.getAtRiskMembers', () => {
  it('calls the correct endpoint with the threshold and maps the response', async () => {
    mockGet.mockResolvedValueOnce({ data: [buildScore(), buildScore({ memberId: 99, overallScore: 10, member: { firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', joinDate: '2022-06-01T00:00:00Z' } })] });

    const result = await memberEngagementService.getAtRiskMembers(123);

    expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/club/123/at-risk', {
      params: { threshold: 40 },
    });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Ada Lovelace');
    expect(result[1].name).toBe('Grace Hopper');
    expect(result[1].riskLevel).toBe('high');
  });

  it('passes a custom threshold through', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await memberEngagementService.getAtRiskMembers('77', 60);
    expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/club/77/at-risk', {
      params: { threshold: 60 },
    });
  });

  it('returns an empty array when the backend returns a non-array payload', async () => {
    mockGet.mockResolvedValueOnce({ data: null });
    const result = await memberEngagementService.getAtRiskMembers(123);
    expect(result).toEqual([]);
  });

  it('propagates errors through ErrorHandler with context', async () => {
    mockGet.mockRejectedValueOnce(new Error('network down'));
    await expect(memberEngagementService.getAtRiskMembers(123)).rejects.toMatchObject({
      message: expect.stringContaining('Error getAtRiskMembers:'),
    });
  });
});

describe('memberEngagementService.getMemberEngagementScore', () => {
  it('calls the single-member endpoint and returns the score', async () => {
    const dto = { memberId: 5, memberName: 'Jane Smith', overallScore: 72.8 };
    mockGet.mockResolvedValueOnce({ data: dto });

    const result = await memberEngagementService.getMemberEngagementScore(5);

    expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/5');
    expect(result).toEqual(dto);
  });

  it('accepts a string member id', async () => {
    mockGet.mockResolvedValueOnce({ data: { memberId: 8 } });
    await memberEngagementService.getMemberEngagementScore('8');
    expect(mockGet).toHaveBeenCalledWith('/MemberEngagement/8');
  });

  it('returns null when the backend has no calculated score (404)', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    const result = await memberEngagementService.getMemberEngagementScore(5);
    expect(result).toBeNull();
  });

  it('returns null when the response payload is empty', async () => {
    mockGet.mockResolvedValueOnce({ data: null });
    const result = await memberEngagementService.getMemberEngagementScore(5);
    expect(result).toBeNull();
  });

  it('propagates non-404 errors through ErrorHandler with context', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(memberEngagementService.getMemberEngagementScore(5)).rejects.toMatchObject({
      message: expect.stringContaining('Error getMemberEngagementScore:'),
    });
  });
});
