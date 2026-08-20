/**
 * Unit Tests for Member Tagging Service
 * Test coverage for tag management and member associations
 */

import { memberTaggingService } from '@/services/memberTaggingService';
import { apiClient } from '@/services/apiClient';
import { MemberTag, MemberTagAssignment } from '@/types/memberTags';

// Mock the API client
jest.mock('@/services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('MemberTaggingService', () => {
  const mockClubId = 'club-123';
  const mockMemberTag: MemberTag = {
    id: 'tag-1',
    clubId: mockClubId,
    tagName: 'VIP Members',
    tagColor: '#FF6B6B',
    description: 'High-value club members',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockTagAssignment: MemberTagAssignment = {
    id: 'assignment-1',
    memberId: 'member-1',
    tagId: 'tag-1',
    assignedAt: new Date('2024-01-01'),
    assignedBy: 'admin-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTags', () => {
    it('should fetch all tags for a club', async () => {
      const mockTags = [mockMemberTag];
      mockApiClient.get.mockResolvedValue({ data: mockTags });

      const result = await memberTaggingService.getTags(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/clubs/${mockClubId}/member-tags`);
      expect(result).toEqual(mockTags);
    });

    it('should handle empty tag list', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await memberTaggingService.getTags(mockClubId);

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(memberTaggingService.getTags(mockClubId))
        .rejects.toThrow('Network error');
    });
  });

  describe('createTag', () => {
    it('should create a new tag', async () => {
      const tagData = {
        tagName: 'New Members',
        tagColor: '#4ECDC4',
        description: 'Members who joined in the last 30 days'
      };

      mockApiClient.post.mockResolvedValue({ data: mockMemberTag });

      const result = await memberTaggingService.createTag(mockClubId, tagData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags`,
        tagData
      );
      expect(result).toEqual(mockMemberTag);
    });

    it('should validate tag name is required', async () => {
      const invalidTagData = {
        tagName: '',
        tagColor: '#4ECDC4',
        description: 'Test description'
      };

      await expect(memberTaggingService.createTag(mockClubId, invalidTagData))
        .rejects.toThrow('Tag name is required');
    });

    it('should validate tag name length', async () => {
      const longName = 'a'.repeat(51);
      const invalidTagData = {
        tagName: longName,
        tagColor: '#4ECDC4',
        description: 'Test description'
      };

      await expect(memberTaggingService.createTag(mockClubId, invalidTagData))
        .rejects.toThrow('Tag name must be 50 characters or less');
    });

    it('should validate color format', async () => {
      const invalidTagData = {
        tagName: 'Test Tag',
        tagColor: 'invalid-color',
        description: 'Test description'
      };

      await expect(memberTaggingService.createTag(mockClubId, invalidTagData))
        .rejects.toThrow('Invalid color format. Use hex format (e.g., #FF6B6B)');
    });

    it('should handle duplicate tag name error', async () => {
      const tagData = {
        tagName: 'VIP Members',
        tagColor: '#4ECDC4',
        description: 'Duplicate tag'
      };

      mockApiClient.post.mockRejectedValue({
        response: { status: 409, data: { message: 'Tag name already exists' } }
      });

      await expect(memberTaggingService.createTag(mockClubId, tagData))
        .rejects.toThrow('Tag name already exists');
    });
  });

  describe('updateTag', () => {
    it('should update an existing tag', async () => {
      const updateData = {
        tagName: 'Updated VIP Members',
        tagColor: '#E74C3C'
      };

      const updatedTag = { ...mockMemberTag, ...updateData };
      mockApiClient.put.mockResolvedValue({ data: updatedTag });

      const result = await memberTaggingService.updateTag(
        mockClubId,
        mockMemberTag.id,
        updateData
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags/${mockMemberTag.id}`,
        updateData
      );
      expect(result).toEqual(updatedTag);
    });

    it('should handle tag not found error', async () => {
      mockApiClient.put.mockRejectedValue({
        response: { status: 404, data: { message: 'Tag not found' } }
      });

      await expect(memberTaggingService.updateTag(mockClubId, 'invalid-id', {}))
        .rejects.toThrow('Tag not found');
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await memberTaggingService.deleteTag(mockClubId, mockMemberTag.id);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags/${mockMemberTag.id}`
      );
    });

    it('should handle deletion of tag with member assignments', async () => {
      mockApiClient.delete.mockResolvedValue({ 
        data: { success: true, removedAssignments: 15 } 
      });

      const result = await memberTaggingService.deleteTag(mockClubId, mockMemberTag.id);

      expect(result.removedAssignments).toBe(15);
    });
  });

  describe('assignTagToMember', () => {
    it('should assign a tag to a member', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockTagAssignment });

      const result = await memberTaggingService.assignTagToMember(
        mockClubId,
        'member-1',
        'tag-1',
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/members/member-1/tags`,
        {
          tagId: 'tag-1',
          assignedBy: 'admin-1'
        }
      );
      expect(result).toEqual(mockTagAssignment);
    });

    it('should handle duplicate tag assignment', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 409, data: { message: 'Tag already assigned to member' } }
      });

      await expect(memberTaggingService.assignTagToMember(
        mockClubId,
        'member-1',
        'tag-1',
        'admin-1'
      )).rejects.toThrow('Tag already assigned to member');
    });

    it('should handle invalid member ID', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 404, data: { message: 'Member not found' } }
      });

      await expect(memberTaggingService.assignTagToMember(
        mockClubId,
        'invalid-member',
        'tag-1',
        'admin-1'
      )).rejects.toThrow('Member not found');
    });

    it('should handle invalid tag ID', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 404, data: { message: 'Tag not found' } }
      });

      await expect(memberTaggingService.assignTagToMember(
        mockClubId,
        'member-1',
        'invalid-tag',
        'admin-1'
      )).rejects.toThrow('Tag not found');
    });
  });

  describe('removeTagFromMember', () => {
    it('should remove a tag from a member', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await memberTaggingService.removeTagFromMember(
        mockClubId,
        'member-1',
        'tag-1'
      );

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/members/member-1/tags/tag-1`
      );
    });

    it('should handle tag not assigned error', async () => {
      mockApiClient.delete.mockRejectedValue({
        response: { status: 404, data: { message: 'Tag assignment not found' } }
      });

      await expect(memberTaggingService.removeTagFromMember(
        mockClubId,
        'member-1',
        'tag-1'
      )).rejects.toThrow('Tag assignment not found');
    });
  });

  describe('getMemberTags', () => {
    it('should fetch all tags for a specific member', async () => {
      const mockMemberTags = [mockMemberTag];
      mockApiClient.get.mockResolvedValue({ data: mockMemberTags });

      const result = await memberTaggingService.getMemberTags(
        mockClubId,
        'member-1'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/members/member-1/tags`
      );
      expect(result).toEqual(mockMemberTags);
    });

    it('should return empty array for member with no tags', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await memberTaggingService.getMemberTags(
        mockClubId,
        'member-1'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getTagMembers', () => {
    it('should fetch all members with a specific tag', async () => {
      const mockTaggedMembers = [
        { 
          id: 'member-1', 
          name: 'John Doe', 
          email: 'john@example.com',
          assignedAt: new Date('2024-01-01'),
          assignedBy: 'admin-1'
        }
      ];
      mockApiClient.get.mockResolvedValue({ data: mockTaggedMembers });

      const result = await memberTaggingService.getTagMembers(
        mockClubId,
        'tag-1'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags/tag-1/members`
      );
      expect(result).toEqual(mockTaggedMembers);
    });

    it('should support pagination for large tag member lists', async () => {
      const mockTaggedMembers = Array.from({ length: 10 }, (_, i) => ({
        id: `member-${i}`,
        name: `Member ${i}`,
        email: `member${i}@example.com`,
        assignedAt: new Date('2024-01-01'),
        assignedBy: 'admin-1'
      }));

      mockApiClient.get.mockResolvedValue({ 
        data: {
          members: mockTaggedMembers,
          totalCount: 100,
          page: 1,
          pageSize: 10
        }
      });

      const result = await memberTaggingService.getTagMembers(
        mockClubId,
        'tag-1',
        { page: 1, pageSize: 10 }
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags/tag-1/members?page=1&pageSize=10`
      );
      expect(result.totalCount).toBe(100);
    });
  });

  describe('bulkAssignTags', () => {
    it('should assign multiple tags to multiple members', async () => {
      const bulkData = {
        memberIds: ['member-1', 'member-2', 'member-3'],
        tagIds: ['tag-1', 'tag-2'],
        assignedBy: 'admin-1'
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { 
          success: true, 
          assignmentsCreated: 6,
          duplicatesSkipped: 0,
          errors: []
        } 
      });

      const result = await memberTaggingService.bulkAssignTags(mockClubId, bulkData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags/bulk-assign`,
        bulkData
      );
      expect(result.assignmentsCreated).toBe(6);
    });

    it('should handle partial failures in bulk assignment', async () => {
      const bulkData = {
        memberIds: ['member-1', 'invalid-member'],
        tagIds: ['tag-1'],
        assignedBy: 'admin-1'
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { 
          success: false, 
          assignmentsCreated: 1,
          duplicatesSkipped: 0,
          errors: ['Member not found: invalid-member']
        } 
      });

      const result = await memberTaggingService.bulkAssignTags(mockClubId, bulkData);

      expect(result.success).toBe(false);
      expect(result.assignmentsCreated).toBe(1);
      expect(result.errors).toContain('Member not found: invalid-member');
    });
  });

  describe('bulkRemoveTags', () => {
    it('should remove multiple tags from multiple members', async () => {
      const bulkData = {
        memberIds: ['member-1', 'member-2'],
        tagIds: ['tag-1', 'tag-2']
      };

      mockApiClient.delete.mockResolvedValue({ 
        data: { 
          success: true, 
          assignmentsRemoved: 4,
          notFoundSkipped: 0,
          errors: []
        } 
      });

      const result = await memberTaggingService.bulkRemoveTags(mockClubId, bulkData);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags/bulk-remove`,
        { data: bulkData }
      );
      expect(result.assignmentsRemoved).toBe(4);
    });
  });

  describe('getTagStats', () => {
    it('should return usage statistics for tags', async () => {
      const mockStats = {
        totalTags: 5,
        totalAssignments: 150,
        tagUsage: [
          { tagId: 'tag-1', tagName: 'VIP Members', memberCount: 25 },
          { tagId: 'tag-2', tagName: 'New Members', memberCount: 45 }
        ],
        mostPopularTags: [
          { tagId: 'tag-2', tagName: 'New Members', memberCount: 45 },
          { tagId: 'tag-1', tagName: 'VIP Members', memberCount: 25 }
        ]
      };

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await memberTaggingService.getTagStats(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/member-tags/stats`
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('searchTaggedMembers', () => {
    it('should search members by tags with filters', async () => {
      const searchFilters = {
        tagIds: ['tag-1', 'tag-2'],
        searchTerm: 'john',
        tagOperation: 'AND' as const,
        includeInactive: false
      };

      const mockResults = {
        members: [
          {
            id: 'member-1',
            name: 'John Doe',
            email: 'john@example.com',
            tags: [mockMemberTag]
          }
        ],
        totalCount: 1
      };

      mockApiClient.post.mockResolvedValue({ data: mockResults });

      const result = await memberTaggingService.searchTaggedMembers(
        mockClubId,
        searchFilters
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/members/search-by-tags`,
        searchFilters
      );
      expect(result).toEqual(mockResults);
    });

    it('should handle OR tag operation', async () => {
      const searchFilters = {
        tagIds: ['tag-1', 'tag-2'],
        tagOperation: 'OR' as const
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { members: [], totalCount: 0 } 
      });

      await memberTaggingService.searchTaggedMembers(mockClubId, searchFilters);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/members/search-by-tags`,
        searchFilters
      );
    });
  });

  describe('validateTagColor', () => {
    it('should validate hex color format', () => {
      expect(memberTaggingService.validateTagColor('#FF6B6B')).toBe(true);
      expect(memberTaggingService.validateTagColor('#123456')).toBe(true);
      expect(memberTaggingService.validateTagColor('#ABC')).toBe(true);
      
      expect(memberTaggingService.validateTagColor('FF6B6B')).toBe(false);
      expect(memberTaggingService.validateTagColor('#GGHHII')).toBe(false);
      expect(memberTaggingService.validateTagColor('red')).toBe(false);
      expect(memberTaggingService.validateTagColor('')).toBe(false);
    });
  });

  describe('generateTagColor', () => {
    it('should generate a random valid hex color', () => {
      const color = memberTaggingService.generateTagColor();
      
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(memberTaggingService.validateTagColor(color)).toBe(true);
    });

    it('should generate different colors on consecutive calls', () => {
      const color1 = memberTaggingService.generateTagColor();
      const color2 = memberTaggingService.generateTagColor();
      
      // While technically possible to be the same, it's extremely unlikely
      expect(color1).not.toBe(color2);
    });
  });
});