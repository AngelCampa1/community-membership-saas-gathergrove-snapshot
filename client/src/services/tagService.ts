/**
 * Tag Service - Member tagging and categorization (Expand tier feature)
 *
 * Mirrors the club-scoped backend contract exposed by MemberTaggingController
 * at `api/v1/clubs/{clubId}/members/tags`. All requests go through apiClient,
 * whose baseURL already carries `/api/v1`, so paths here are relative to that.
 *
 * There is no global `/tags` collection and no tag-category concept on the
 * backend; tags belong to a single club and assignment is per member + per tag.
 */

import apiClient from './apiClient';

/** A member tag as returned by the backend (MemberTagResponse). */
export interface MemberTag {
  id: number;
  clubId: number;
  name: string;
  description?: string | null;
  color: string;
  isVisible: boolean;
  displayOrder: number;
  createdAt: string;
  createdByUserName: string;
  updatedAt: string;
  usageStats?: TagUsageStats | null;
}

/** Usage statistics embedded in a tag response (TagUsageStats). */
export interface TagUsageStats {
  assignedMemberCount: number;
  totalMemberCount: number;
  usagePercentage: number;
  recentAssignments: number;
  commonReasons: string[];
}

/** Trend point for tag usage over time (TagUsageTrend). */
export interface TagUsageTrend {
  date: string;
  assignmentCount: number;
  usagePercentage: number;
}

/** Correlation between a tag and another tag (TagCorrelation). */
export interface TagCorrelation {
  tagId: number;
  tagName: string;
  correlationScore: number;
  coOccurrenceCount: number;
}

/** Full usage-stats payload for a club (MemberTagUsageStatsResponse). */
export interface MemberTagUsageStats {
  tagId: number;
  tagName: string;
  currentStats: TagUsageStats;
  usageTrends: TagUsageTrend[];
  tagCorrelations: TagCorrelation[];
  calculatedAt: string;
}

/** A member as returned by tag-membership endpoints (MemberResponse subset). */
export interface TaggedMember {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: unknown;
}

/** Request body for creating a tag. clubId/createdByUserId are set server-side. */
export interface CreateTagRequest {
  name: string;
  description?: string;
  color?: string;
  isVisible?: boolean;
  displayOrder?: number;
}

/** Request body for updating a tag. tagId/updatedByUserId are set server-side. */
export interface UpdateTagRequest {
  name: string;
  description?: string;
  color: string;
  isVisible: boolean;
  displayOrder: number;
}

export interface TagService {
  getTags(clubId: number): Promise<MemberTag[]>;
  getTag(clubId: number, tagId: number): Promise<MemberTag>;
  createTag(clubId: number, request: CreateTagRequest): Promise<MemberTag>;
  updateTag(clubId: number, tagId: number, request: UpdateTagRequest): Promise<MemberTag>;
  deleteTag(clubId: number, tagId: number): Promise<void>;
  assignTag(clubId: number, memberId: number, tagId: number, notes?: string): Promise<void>;
  removeTag(clubId: number, memberId: number, tagId: number): Promise<void>;
  getMemberTags(clubId: number, memberId: number): Promise<MemberTag[]>;
  getMembersWithTag(clubId: number, tagId: number): Promise<TaggedMember[]>;
  getTagUsageStats(clubId: number): Promise<MemberTagUsageStats>;
  assignTagsToMembers(clubId: number, tagIds: number[], memberIds: number[], notes?: string): Promise<void>;
  removeTagsFromMembers(clubId: number, tagIds: number[], memberIds: number[]): Promise<void>;
}

class TagServiceImpl implements TagService {
  private base(clubId: number): string {
    return `/clubs/${clubId}/members/tags`;
  }

  async getTags(clubId: number): Promise<MemberTag[]> {
    const response = await apiClient.get<MemberTag[]>(this.base(clubId));
    return response.data;
  }

  async getTag(clubId: number, tagId: number): Promise<MemberTag> {
    const response = await apiClient.get<MemberTag>(`${this.base(clubId)}/${tagId}`);
    return response.data;
  }

  async createTag(clubId: number, request: CreateTagRequest): Promise<MemberTag> {
    const response = await apiClient.post<MemberTag>(this.base(clubId), request);
    return response.data;
  }

  async updateTag(clubId: number, tagId: number, request: UpdateTagRequest): Promise<MemberTag> {
    const response = await apiClient.put<MemberTag>(`${this.base(clubId)}/${tagId}`, request);
    return response.data;
  }

  async deleteTag(clubId: number, tagId: number): Promise<void> {
    await apiClient.delete(`${this.base(clubId)}/${tagId}`);
  }

  async assignTag(clubId: number, memberId: number, tagId: number, notes?: string): Promise<void> {
    await apiClient.post(
      `${this.base(clubId)}/assign/${memberId}/${tagId}`,
      notes !== undefined ? { memberId, tagId, notes } : undefined,
    );
  }

  async removeTag(clubId: number, memberId: number, tagId: number): Promise<void> {
    await apiClient.delete(`${this.base(clubId)}/remove/${memberId}/${tagId}`);
  }

  async getMemberTags(clubId: number, memberId: number): Promise<MemberTag[]> {
    const response = await apiClient.get<MemberTag[]>(`${this.base(clubId)}/member/${memberId}`);
    return response.data;
  }

  async getMembersWithTag(clubId: number, tagId: number): Promise<TaggedMember[]> {
    const response = await apiClient.get<TaggedMember[]>(`${this.base(clubId)}/${tagId}/members`);
    return response.data;
  }

  async getTagUsageStats(clubId: number): Promise<MemberTagUsageStats> {
    const response = await apiClient.get<MemberTagUsageStats>(`${this.base(clubId)}/usage-stats`);
    return response.data;
  }

  /**
   * Convenience helper: assign multiple tags to multiple members.
   * The backend only exposes a single member + single tag endpoint, so this
   * fans out to that endpoint for each (member, tag) pair.
   */
  async assignTagsToMembers(
    clubId: number,
    tagIds: number[],
    memberIds: number[],
    notes?: string,
  ): Promise<void> {
    await Promise.all(
      memberIds.flatMap((memberId) =>
        tagIds.map((tagId) => this.assignTag(clubId, memberId, tagId, notes)),
      ),
    );
  }

  /**
   * Convenience helper: remove multiple tags from multiple members by fanning
   * out to the single member + single tag removal endpoint.
   */
  async removeTagsFromMembers(
    clubId: number,
    tagIds: number[],
    memberIds: number[],
  ): Promise<void> {
    await Promise.all(
      memberIds.flatMap((memberId) =>
        tagIds.map((tagId) => this.removeTag(clubId, memberId, tagId)),
      ),
    );
  }
}

export const tagService = new TagServiceImpl();
