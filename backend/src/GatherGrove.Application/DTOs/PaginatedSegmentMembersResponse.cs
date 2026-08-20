namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing paginated segment member data
/// </summary>
public class PaginatedSegmentMembersResponse
{
    /// <summary>
    /// Segment identifier
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// List of members for the current page
    /// </summary>
    public List<SegmentMemberResponse> Members { get; set; } = new();

    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of members in the segment
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Whether there is a previous page
    /// </summary>
    public bool HasPrevious { get; set; }

    /// <summary>
    /// Whether there is a next page
    /// </summary>
    public bool HasNext { get; set; }

    /// <summary>
    /// Search term that was applied (if any)
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Filter criteria applied
    /// </summary>
    public SegmentMemberFilters? AppliedFilters { get; set; }

    /// <summary>
    /// Sort order applied
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort direction (asc/desc)
    /// </summary>
    public string? SortDirection { get; set; }

    /// <summary>
    /// Segment summary statistics
    /// </summary>
    public SegmentSummaryStats SegmentSummary { get; set; } = new();
}

/// <summary>
/// Member information within a segment context
/// </summary>
public class SegmentMemberResponse
{
    /// <summary>
    /// Member identifier
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Membership status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Membership type
    /// </summary>
    public string? MembershipType { get; set; }

    /// <summary>
    /// Date member joined the club
    /// </summary>
    public DateTime JoinDate { get; set; }

    /// <summary>
    /// Date member joined this segment
    /// </summary>
    public DateTime SegmentJoinDate { get; set; }

    /// <summary>
    /// Member's engagement score
    /// </summary>
    public decimal EngagementScore { get; set; }

    /// <summary>
    /// Last activity date
    /// </summary>
    public DateTime? LastActivityDate { get; set; }

    /// <summary>
    /// Number of events attended
    /// </summary>
    public int EventsAttended { get; set; }

    /// <summary>
    /// Tags assigned to this member
    /// </summary>
    public List<MemberTagInfo> Tags { get; set; } = new();

    /// <summary>
    /// Custom field values for this member
    /// </summary>
    public Dictionary<string, object> CustomFields { get; set; } = new();

    /// <summary>
    /// Member's profile photo URL
    /// </summary>
    public string? ProfilePhotoUrl { get; set; }

    /// <summary>
    /// Location information
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Whether member is active in communications
    /// </summary>
    public bool IsActiveInCommunications { get; set; }

    /// <summary>
    /// Payment status for current period
    /// </summary>
    public string? PaymentStatus { get; set; }
}

/// <summary>
/// Filter options for segment members
/// </summary>
public class SegmentMemberFilters
{
    /// <summary>
    /// Filter by member status
    /// </summary>
    public List<string>? Statuses { get; set; }

    /// <summary>
    /// Filter by membership types
    /// </summary>
    public List<string>? MembershipTypes { get; set; }

    /// <summary>
    /// Filter by tags
    /// </summary>
    public List<int>? TagIds { get; set; }

    /// <summary>
    /// Filter by engagement score range
    /// </summary>
    public EngagementScoreRange? EngagementRange { get; set; }

    /// <summary>
    /// Filter by join date range
    /// </summary>
    public DateRange? JoinDateRange { get; set; }

    /// <summary>
    /// Filter by last activity date range
    /// </summary>
    public DateRange? LastActivityRange { get; set; }

    /// <summary>
    /// Filter by location
    /// </summary>
    public List<string>? Locations { get; set; }

    /// <summary>
    /// Include/exclude members with outstanding payments
    /// </summary>
    public bool? HasOutstandingPayments { get; set; }
}

/// <summary>
/// Summary statistics for a segment
/// </summary>
public class SegmentSummaryStats
{
    /// <summary>
    /// Total member count
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Active members count
    /// </summary>
    public int ActiveMembers { get; set; }

    /// <summary>
    /// Inactive members count
    /// </summary>
    public int InactiveMembers { get; set; }

    /// <summary>
    /// Average engagement score
    /// </summary>
    public decimal AverageEngagementScore { get; set; }

    /// <summary>
    /// Member distribution by status
    /// </summary>
    public Dictionary<string, int> StatusDistribution { get; set; } = new();

    /// <summary>
    /// Member distribution by membership type
    /// </summary>
    public Dictionary<string, int> MembershipTypeDistribution { get; set; } = new();

    /// <summary>
    /// Recent growth metrics
    /// </summary>
    public RecentGrowthMetrics RecentGrowth { get; set; } = new();
}

/// <summary>
/// Tag information for members
/// </summary>
public class MemberTagInfo
{
    /// <summary>
    /// Tag identifier
    /// </summary>
    public int TagId { get; set; }

    /// <summary>
    /// Tag name
    /// </summary>
    public string TagName { get; set; } = string.Empty;

    /// <summary>
    /// Tag color (for UI display)
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// When this tag was assigned to the member
    /// </summary>
    public DateTime AssignedDate { get; set; }
}

/// <summary>
/// Engagement score range filter
/// </summary>
public class EngagementScoreRange
{
    /// <summary>
    /// Minimum engagement score
    /// </summary>
    public decimal MinScore { get; set; }

    /// <summary>
    /// Maximum engagement score
    /// </summary>
    public decimal MaxScore { get; set; }
}

/// <summary>
/// Recent growth metrics for segment
/// </summary>
public class RecentGrowthMetrics
{
    /// <summary>
    /// New members in last 30 days
    /// </summary>
    public int NewMembersLast30Days { get; set; }

    /// <summary>
    /// Members lost in last 30 days
    /// </summary>
    public int LostMembersLast30Days { get; set; }

    /// <summary>
    /// Growth rate for last 30 days
    /// </summary>
    public decimal GrowthRateLast30Days { get; set; }

    /// <summary>
    /// Trend direction
    /// </summary>
    public TrendDirection GrowthTrend { get; set; }
}