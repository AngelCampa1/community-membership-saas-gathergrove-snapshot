using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for managing member segments and dynamic member filtering
/// Provides functionality for creating segments, evaluating criteria, and caching results
/// </summary>
public interface IMemberSegmentationService
{
    /// <summary>
    /// Gets all segments for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of member segments</returns>
    Task<IEnumerable<MemberSegmentResponse>> GetSegmentsAsync(int clubId, int userId);

    /// <summary>
    /// Gets a specific segment by ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment response</returns>
    Task<MemberSegmentResponse> GetSegmentByIdAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Creates a new member segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The segment creation request</param>
    /// <returns>Created segment response</returns>
    Task<MemberSegmentResponse> CreateSegmentAsync(int clubId, int userId, CreateMemberSegmentRequest request);

    /// <summary>
    /// Updates an existing member segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The segment update request</param>
    /// <returns>Updated segment response</returns>
    Task<MemberSegmentResponse> UpdateSegmentAsync(int clubId, int segmentId, int userId, UpdateMemberSegmentRequest request);

    /// <summary>
    /// Deletes a member segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteSegmentAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Calculates and caches members for a segment based on its criteria
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment calculation result with member count and list</returns>
    Task<SegmentCalculationResult> CalculateSegmentMembersAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Gets cached members for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of members in the segment</returns>
    Task<IEnumerable<MemberResponse>> GetSegmentMembersAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Evaluates segment rules against all members to find matches
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="filterCriteria">The filter criteria to evaluate</param>
    /// <returns>List of members matching the criteria</returns>
    Task<IEnumerable<MemberResponse>> EvaluateSegmentRulesAsync(int clubId, SegmentFilterCriteria filterCriteria);

    /// <summary>
    /// Preview segment members without saving the segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The segment preview request</param>
    /// <returns>Preview result with member count and sample members</returns>
    Task<SegmentPreviewResult> PreviewSegmentAsync(int clubId, int userId, PreviewSegmentRequest request);

    /// <summary>
    /// Refreshes the cached members for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if refresh was successful</returns>
    Task<bool> RefreshSegmentCacheAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Gets performance metrics for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment performance data</returns>
    Task<SegmentPerformanceResult> GetSegmentPerformanceAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Gets segment history including past calculations
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="days">Number of days of history to retrieve</param>
    /// <returns>List of segment history entries</returns>
    Task<IEnumerable<MemberSegmentHistoryResponse>> GetSegmentHistoryAsync(int clubId, int segmentId, int userId, int days = 30);

    /// <summary>
    /// Duplicates an existing segment with new name
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID to duplicate</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="newName">The name for the new segment</param>
    /// <returns>Duplicated segment response</returns>
    Task<MemberSegmentResponse> DuplicateSegmentAsync(int clubId, int segmentId, int userId, string newName);

    /// <summary>
    /// Gets available filter fields and operators for segment creation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Available filter options</returns>
    Task<SegmentFilterOptionsResponse> GetFilterOptionsAsync(int clubId, int userId);

    /// <summary>
    /// Recalculates segment membership
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment recalculation result</returns>
    Task<SegmentRecalculationResult> RecalculateSegmentAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Searches members using advanced filter criteria without creating a persistent segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The search request</param>
    /// <returns>Search results</returns>
    Task<MemberSegmentSearchResult> SearchMembersAsync(int clubId, int userId, MemberSegmentSearchRequest request);

    /// <summary>
    /// Gets segment members with pagination
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The segment members request</param>
    /// <returns>Paginated segment members</returns>
    Task<PaginatedSegmentMembersResponse> GetSegmentMembersAsync(int clubId, int userId, GetSegmentMembersRequest request);

    /// <summary>
    /// Gets segment statistics and insights
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="daysBack">Number of days to include in analysis</param>
    /// <returns>Segment statistics</returns>
    Task<SegmentStatsResponse> GetSegmentStatsAsync(int clubId, int segmentId, int userId, int daysBack = 30);

    /// <summary>
    /// Gets all segments for a club with optional inactive filter
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="includeInactive">Include inactive segments</param>
    /// <returns>List of member segments</returns>
    Task<IEnumerable<MemberSegmentResponse>> GetSegmentsAsync(int clubId, int userId, bool includeInactive);
}