namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for member tag operations
/// </summary>
public class MemberTagResponse
{
    /// <summary>
    /// Unique identifier for the tag
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Club this tag belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the tag
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the tag
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Color for the tag in hex format
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Whether the tag is visible in the UI
    /// </summary>
    public bool IsVisible { get; set; }

    /// <summary>
    /// Display order for sorting tags
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// When the tag was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// User who created the tag
    /// </summary>
    public string CreatedByUserName { get; set; } = string.Empty;

    /// <summary>
    /// When the tag was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Usage statistics for this tag (if requested)
    /// </summary>
    public TagUsageStats? UsageStats { get; set; }
}

/// <summary>
/// Response for tag assignment operations
/// </summary>
public class TagAssignmentResponse
{
    /// <summary>
    /// Unique identifier for the assignment
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member name for reference
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Tag ID
    /// </summary>
    public int TagId { get; set; }

    /// <summary>
    /// Tag name for reference
    /// </summary>
    public string TagName { get; set; } = string.Empty;

    /// <summary>
    /// Tag color for reference
    /// </summary>
    public string TagColor { get; set; } = string.Empty;

    /// <summary>
    /// When the tag was assigned
    /// </summary>
    public DateTime AssignedAt { get; set; }

    /// <summary>
    /// User who assigned the tag
    /// </summary>
    public string AssignedByUserName { get; set; } = string.Empty;

    /// <summary>
    /// Notes about the assignment
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Usage statistics for a tag
/// </summary>
public class TagUsageStats
{
    /// <summary>
    /// Number of members assigned this tag
    /// </summary>
    public int AssignedMemberCount { get; set; }

    /// <summary>
    /// Total number of members in the club
    /// </summary>
    public int TotalMemberCount { get; set; }

    /// <summary>
    /// Percentage of members with this tag (0.0 to 1.0)
    /// </summary>
    public decimal UsagePercentage { get; set; }

    /// <summary>
    /// Recent assignment activity (last 30 days)
    /// </summary>
    public int RecentAssignments { get; set; }

    /// <summary>
    /// Most common assignment reasons
    /// </summary>
    public List<string> CommonReasons { get; set; } = new();
}

/// <summary>
/// Response for bulk tag operations
/// </summary>
public class BulkTagOperationResult
{
    /// <summary>
    /// Number of successful operations
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Number of failed operations
    /// </summary>
    public int ErrorCount { get; set; }

    /// <summary>
    /// List of errors that occurred
    /// </summary>
    public List<BulkOperationError> Errors { get; set; } = new();

    /// <summary>
    /// Total number of operations attempted
    /// </summary>
    public int TotalCount => SuccessCount + ErrorCount;

    /// <summary>
    /// Successfully created/updated assignments
    /// </summary>
    public List<TagAssignmentResponse> SuccessfulAssignments { get; set; } = new();
}

/// <summary>
/// Response for member tag search operations
/// </summary>
public class MemberTagSearchResult
{
    /// <summary>
    /// Total number of members matching the criteria
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Current page number
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Number of results per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// List of members with their tags
    /// </summary>
    public List<MemberWithTagsResponse> Members { get; set; } = new();

    /// <summary>
    /// Search criteria used
    /// </summary>
    public SearchCriteriaSummary SearchCriteria { get; set; } = new();
}

/// <summary>
/// Response representing a member with their assigned tags
/// </summary>
public class MemberWithTagsResponse
{
    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Member email
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// Member status
    /// </summary>
    public string MemberStatus { get; set; } = string.Empty;

    /// <summary>
    /// When the member joined
    /// </summary>
    public DateTime JoinDate { get; set; }

    /// <summary>
    /// List of tags assigned to this member
    /// </summary>
    public List<TagAssignmentResponse> Tags { get; set; } = new();
}

/// <summary>
/// Response for tagged members (members with a specific tag)
/// </summary>
public class TaggedMemberResponse
{
    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Member email
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// Member status
    /// </summary>
    public string MemberStatus { get; set; } = string.Empty;

    /// <summary>
    /// When the tag was assigned to this member
    /// </summary>
    public DateTime AssignedAt { get; set; }

    /// <summary>
    /// User who assigned the tag
    /// </summary>
    public string AssignedByUserName { get; set; } = string.Empty;

    /// <summary>
    /// Notes about the assignment
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Summary of search criteria used
/// </summary>
public class SearchCriteriaSummary
{
    /// <summary>
    /// Tag names used in search
    /// </summary>
    public List<string> TagNames { get; set; } = new();

    /// <summary>
    /// Match type used
    /// </summary>
    public string MatchType { get; set; } = string.Empty;

    /// <summary>
    /// Whether inactive members were included
    /// </summary>
    public bool IncludedInactiveMembers { get; set; }
}