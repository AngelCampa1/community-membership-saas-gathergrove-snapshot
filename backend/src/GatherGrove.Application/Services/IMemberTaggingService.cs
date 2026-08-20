using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for managing member tags and tag assignments
/// Provides functionality for tag creation, member tagging, and bulk tag operations
/// </summary>
public interface IMemberTaggingService
{
    /// <summary>
    /// Gets all tags for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of member tags</returns>
    Task<IEnumerable<MemberTagResponse>> GetTagsAsync(int clubId, int userId);

    /// <summary>
    /// Gets a specific tag by ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="tagId">The tag ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Tag response</returns>
    Task<MemberTagResponse> GetTagByIdAsync(int clubId, int tagId, int userId);

    /// <summary>
    /// Creates a new member tag
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The tag creation request</param>
    /// <returns>Created tag response</returns>
    Task<MemberTagResponse> CreateTagAsync(int clubId, int userId, CreateMemberTagRequest request);

    /// <summary>
    /// Updates an existing member tag
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="tagId">The tag ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The tag update request</param>
    /// <returns>Updated tag response</returns>
    Task<MemberTagResponse> UpdateTagAsync(int clubId, int tagId, int userId, UpdateMemberTagRequest request);

    /// <summary>
    /// Deletes a member tag
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="tagId">The tag ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteTagAsync(int clubId, int tagId, int userId);

    /// <summary>
    /// Assigns a tag to a member
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="tagId">The tag ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if assigned successfully</returns>
    Task<bool> AssignTagToMemberAsync(int clubId, int memberId, int tagId, int userId);

    /// <summary>
    /// Removes a tag from a member
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="tagId">The tag ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if removed successfully</returns>
    Task<bool> RemoveTagFromMemberAsync(int clubId, int memberId, int tagId, int userId);

    /// <summary>
    /// Gets all tags assigned to a specific member
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of tags assigned to the member</returns>
    Task<IEnumerable<MemberTagResponse>> GetMemberTagsAsync(int clubId, int memberId, int userId);

    /// <summary>
    /// Gets all members that have a specific tag
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="tagId">The tag ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of members with the tag</returns>
    Task<IEnumerable<MemberResponse>> GetMembersWithTagAsync(int clubId, int tagId, int userId);

    /// <summary>
    /// Assigns multiple tags to multiple members in bulk
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="memberIds">List of member IDs</param>
    /// <param name="tagIds">List of tag IDs</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Number of assignments created</returns>
    Task<int> BulkAssignTagsAsync(int clubId, IEnumerable<int> memberIds, IEnumerable<int> tagIds, int userId);

    /// <summary>
    /// Removes multiple tags from multiple members in bulk
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="memberIds">List of member IDs</param>
    /// <param name="tagIds">List of tag IDs</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Number of assignments removed</returns>
    Task<int> BulkRemoveTagsAsync(int clubId, IEnumerable<int> memberIds, IEnumerable<int> tagIds, int userId);

    /// <summary>
    /// Gets tag usage statistics for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Tag usage statistics</returns>
    Task<MemberTagUsageStatsResponse> GetTagUsageStatsAsync(int clubId, int userId);
}