/**
 * Tag Service Tests
 *
 * Tests the club-scoped member tagging service following boundary mocking:
 * - Mock ONLY the apiClient (HTTP) boundary
 * - Test REAL service logic (URL construction, request bodies, fan-out helpers)
 *
 * The service mirrors MemberTaggingController at
 * `api/v1/clubs/{clubId}/members/tags`. apiClient's baseURL already carries
 * `/api/v1`, so the asserted paths are relative to that.
 */

import apiClient from '../apiClient';
import {
  tagService,
  MemberTag,
  MemberTagUsageStats,
  TaggedMember,
  CreateTagRequest,
  UpdateTagRequest,
} from '../tagService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const CLUB_ID = 7;

const mockTag: MemberTag = {
  id: 1,
  clubId: CLUB_ID,
  name: 'VIP Member',
  description: 'VIP membership status',
  color: '#FFD700',
  isVisible: true,
  displayOrder: 0,
  createdAt: '2025-01-01T00:00:00Z',
  createdByUserName: 'Admin',
  updatedAt: '2025-01-15T00:00:00Z',
};

const mockTags: MemberTag[] = [
  mockTag,
  {
    id: 2,
    clubId: CLUB_ID,
    name: 'New Member',
    description: 'Recently joined members',
    color: '#00FF00',
    isVisible: true,
    displayOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
    createdByUserName: 'Admin',
    updatedAt: '2025-01-10T00:00:00Z',
  },
];

const mockUsageStats: MemberTagUsageStats = {
  tagId: 1,
  tagName: 'VIP Member',
  currentStats: {
    assignedMemberCount: 25,
    totalMemberCount: 500,
    usagePercentage: 5,
    recentAssignments: 3,
    commonReasons: ['Renewal'],
  },
  usageTrends: [{ date: '2025-01-01T00:00:00Z', assignmentCount: 25, usagePercentage: 5 }],
  tagCorrelations: [{ tagId: 2, tagName: 'New Member', correlationScore: 0.4, coOccurrenceCount: 10 }],
  calculatedAt: '2025-01-15T00:00:00Z',
};

const mockMembers: TaggedMember[] = [
  { id: 11, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
  { id: 12, firstName: 'Alan', lastName: 'Turing', email: 'alan@example.com' },
];

describe('tagService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTags', () => {
    it('fetches all tags for a club', async () => {
      mockGet.mockResolvedValueOnce({ data: mockTags });

      const result = await tagService.getTags(CLUB_ID);

      expect(mockGet).toHaveBeenCalledWith('/clubs/7/members/tags');
      expect(result).toEqual(mockTags);
      expect(result).toHaveLength(2);
    });

    it('returns an empty array when no tags exist', async () => {
      mockGet.mockResolvedValueOnce({ data: [] });

      const result = await tagService.getTags(CLUB_ID);

      expect(result).toEqual([]);
    });

    it('propagates API errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(tagService.getTags(CLUB_ID)).rejects.toThrow('Forbidden');
    });
  });

  describe('getTag', () => {
    it('fetches a single tag by id', async () => {
      mockGet.mockResolvedValueOnce({ data: mockTag });

      const result = await tagService.getTag(CLUB_ID, 1);

      expect(mockGet).toHaveBeenCalledWith('/clubs/7/members/tags/1');
      expect(result.name).toBe('VIP Member');
    });

    it('propagates not-found errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Not Found'));

      await expect(tagService.getTag(CLUB_ID, 999)).rejects.toThrow('Not Found');
    });
  });

  describe('createTag', () => {
    const request: CreateTagRequest = {
      name: 'Premium',
      color: '#9333EA',
      description: 'Premium membership tier',
      isVisible: true,
      displayOrder: 2,
    };

    it('creates a tag via POST with the request body', async () => {
      const created = { ...mockTag, id: 3, name: 'Premium' };
      mockPost.mockResolvedValueOnce({ data: created });

      const result = await tagService.createTag(CLUB_ID, request);

      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags', request);
      expect(result.name).toBe('Premium');
    });

    it('propagates validation errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('Bad Request'));

      await expect(tagService.createTag(CLUB_ID, request)).rejects.toThrow('Bad Request');
    });
  });

  describe('updateTag', () => {
    const request: UpdateTagRequest = {
      name: 'Updated VIP',
      color: '#FF0000',
      isVisible: true,
      displayOrder: 0,
    };

    it('updates a tag via PUT with the request body', async () => {
      mockPut.mockResolvedValueOnce({ data: { ...mockTag, name: 'Updated VIP' } });

      const result = await tagService.updateTag(CLUB_ID, 1, request);

      expect(mockPut).toHaveBeenCalledWith('/clubs/7/members/tags/1', request);
      expect(result.name).toBe('Updated VIP');
    });

    it('propagates not-found errors', async () => {
      mockPut.mockRejectedValueOnce(new Error('Not Found'));

      await expect(tagService.updateTag(CLUB_ID, 999, request)).rejects.toThrow('Not Found');
    });
  });

  describe('deleteTag', () => {
    it('deletes a tag via DELETE', async () => {
      mockDelete.mockResolvedValueOnce({ data: undefined });

      await tagService.deleteTag(CLUB_ID, 1);

      expect(mockDelete).toHaveBeenCalledWith('/clubs/7/members/tags/1');
    });

    it('propagates conflict errors when a tag is in use', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Conflict'));

      await expect(tagService.deleteTag(CLUB_ID, 1)).rejects.toThrow('Conflict');
    });
  });

  describe('assignTag', () => {
    it('assigns a tag to a member without notes (no body)', async () => {
      mockPost.mockResolvedValueOnce({ data: { message: 'ok' } });

      await tagService.assignTag(CLUB_ID, 11, 1);

      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags/assign/11/1', undefined);
    });

    it('includes a notes body when provided', async () => {
      mockPost.mockResolvedValueOnce({ data: { message: 'ok' } });

      await tagService.assignTag(CLUB_ID, 11, 1, 'Renewed');

      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags/assign/11/1', {
        memberId: 11,
        tagId: 1,
        notes: 'Renewed',
      });
    });

    it('propagates assignment errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('Bad Request'));

      await expect(tagService.assignTag(CLUB_ID, 11, 1)).rejects.toThrow('Bad Request');
    });
  });

  describe('removeTag', () => {
    it('removes a tag from a member via DELETE', async () => {
      mockDelete.mockResolvedValueOnce({ data: { message: 'ok' } });

      await tagService.removeTag(CLUB_ID, 11, 1);

      expect(mockDelete).toHaveBeenCalledWith('/clubs/7/members/tags/remove/11/1');
    });

    it('propagates removal errors', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Not Found'));

      await expect(tagService.removeTag(CLUB_ID, 11, 1)).rejects.toThrow('Not Found');
    });
  });

  describe('getMemberTags', () => {
    it('fetches the tags assigned to a member', async () => {
      mockGet.mockResolvedValueOnce({ data: mockTags });

      const result = await tagService.getMemberTags(CLUB_ID, 11);

      expect(mockGet).toHaveBeenCalledWith('/clubs/7/members/tags/member/11');
      expect(result).toHaveLength(2);
    });
  });

  describe('getMembersWithTag', () => {
    it('fetches the members carrying a tag', async () => {
      mockGet.mockResolvedValueOnce({ data: mockMembers });

      const result = await tagService.getMembersWithTag(CLUB_ID, 1);

      expect(mockGet).toHaveBeenCalledWith('/clubs/7/members/tags/1/members');
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getTagUsageStats', () => {
    it('fetches usage statistics for the club', async () => {
      mockGet.mockResolvedValueOnce({ data: mockUsageStats });

      const result = await tagService.getTagUsageStats(CLUB_ID);

      expect(mockGet).toHaveBeenCalledWith('/clubs/7/members/tags/usage-stats');
      expect(result.currentStats.assignedMemberCount).toBe(25);
    });

    it('propagates errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Service Unavailable'));

      await expect(tagService.getTagUsageStats(CLUB_ID)).rejects.toThrow('Service Unavailable');
    });
  });

  describe('assignTagsToMembers (fan-out helper)', () => {
    it('assigns every (member, tag) pair via the single-assign endpoint', async () => {
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      await tagService.assignTagsToMembers(CLUB_ID, [1, 2], [11, 12]);

      expect(mockPost).toHaveBeenCalledTimes(4);
      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags/assign/11/1', undefined);
      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags/assign/11/2', undefined);
      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags/assign/12/1', undefined);
      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags/assign/12/2', undefined);
    });

    it('forwards notes to each assignment', async () => {
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      await tagService.assignTagsToMembers(CLUB_ID, [1], [11], 'Bulk');

      expect(mockPost).toHaveBeenCalledWith('/clubs/7/members/tags/assign/11/1', {
        memberId: 11,
        tagId: 1,
        notes: 'Bulk',
      });
    });

    it('rejects if any assignment fails', async () => {
      mockPost.mockRejectedValue(new Error('Bad Request'));

      await expect(
        tagService.assignTagsToMembers(CLUB_ID, [1], [11]),
      ).rejects.toThrow('Bad Request');
    });
  });

  describe('removeTagsFromMembers (fan-out helper)', () => {
    it('removes every (member, tag) pair via the single-remove endpoint', async () => {
      mockDelete.mockResolvedValue({ data: { message: 'ok' } });

      await tagService.removeTagsFromMembers(CLUB_ID, [1], [11, 12]);

      expect(mockDelete).toHaveBeenCalledTimes(2);
      expect(mockDelete).toHaveBeenCalledWith('/clubs/7/members/tags/remove/11/1');
      expect(mockDelete).toHaveBeenCalledWith('/clubs/7/members/tags/remove/12/1');
    });

    it('rejects if any removal fails', async () => {
      mockDelete.mockRejectedValue(new Error('Not Found'));

      await expect(
        tagService.removeTagsFromMembers(CLUB_ID, [1], [11]),
      ).rejects.toThrow('Not Found');
    });
  });

  describe('service instance', () => {
    it('exports the tagService singleton', () => {
      expect(tagService).toBeDefined();
    });

    it('exposes all club-scoped methods', () => {
      expect(typeof tagService.getTags).toBe('function');
      expect(typeof tagService.getTag).toBe('function');
      expect(typeof tagService.createTag).toBe('function');
      expect(typeof tagService.updateTag).toBe('function');
      expect(typeof tagService.deleteTag).toBe('function');
      expect(typeof tagService.assignTag).toBe('function');
      expect(typeof tagService.removeTag).toBe('function');
      expect(typeof tagService.getMemberTags).toBe('function');
      expect(typeof tagService.getMembersWithTag).toBe('function');
      expect(typeof tagService.getTagUsageStats).toBe('function');
      expect(typeof tagService.assignTagsToMembers).toBe('function');
      expect(typeof tagService.removeTagsFromMembers).toBe('function');
    });
  });
});
