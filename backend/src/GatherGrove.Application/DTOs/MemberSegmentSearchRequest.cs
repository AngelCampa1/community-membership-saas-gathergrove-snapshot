using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for searching members within segments with advanced filtering
/// </summary>
public class MemberSegmentSearchRequest
{
    /// <summary>
    /// The club to search within
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Specific segment IDs to search within (empty = search all segments)
    /// </summary>
    public List<int> SegmentIds { get; set; } = new();

    /// <summary>
    /// Search query for member names, emails, or other text fields
    /// </summary>
    [StringLength(200, ErrorMessage = "Search query cannot exceed 200 characters")]
    public string? SearchQuery { get; set; }

    /// <summary>
    /// Filter criteria for advanced filtering
    /// </summary>
    public SegmentFilterCriteria? FilterCriteria { get; set; }

    /// <summary>
    /// Whether to include inactive segments in the search
    /// </summary>
    public bool IncludeInactiveSegments { get; set; } = false;

    /// <summary>
    /// Whether to include engagement data in results
    /// </summary>
    public bool IncludeEngagementData { get; set; } = false;

    /// <summary>
    /// Whether to include custom field values in results
    /// </summary>
    public bool IncludeCustomFields { get; set; } = false;

    /// <summary>
    /// Specific custom field IDs to include (if IncludeCustomFields is true)
    /// </summary>
    public List<int>? CustomFieldIds { get; set; }

    /// <summary>
    /// Whether to include member tags in results
    /// </summary>
    public bool IncludeTags { get; set; } = false;

    /// <summary>
    /// Whether to include segment membership history
    /// </summary>
    public bool IncludeSegmentHistory { get; set; } = false;

    /// <summary>
    /// Date range for segment membership (members who were in segments during this period)
    /// </summary>
    public DateRangeFilter? MembershipDateRange { get; set; }

    /// <summary>
    /// Sort field for results
    /// </summary>
    [StringLength(50)]
    public string SortBy { get; set; } = "MemberName";

    /// <summary>
    /// Sort direction
    /// </summary>
    public SortDirection SortDirection { get; set; } = SortDirection.Ascending;

    /// <summary>
    /// Page number for pagination (1-based)
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be 1 or greater")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of results per page
    /// </summary>
    [Range(1, 200, ErrorMessage = "Page size must be between 1 and 200")]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Fields to search within for the SearchQuery
    /// </summary>
    public List<string> SearchFields { get; set; } = new() { "FirstName", "LastName", "Email" };

    /// <summary>
    /// Whether to use fuzzy matching for search query
    /// </summary>
    public bool UseFuzzySearch { get; set; } = false;

    /// <summary>
    /// Minimum segment membership duration (in days) to include in results
    /// </summary>
    [Range(0, 3650, ErrorMessage = "Minimum membership days must be between 0 and 3650 (10 years)")]
    public int? MinMembershipDays { get; set; }

    /// <summary>
    /// Maximum segment membership duration (in days) to include in results
    /// </summary>
    [Range(0, 3650, ErrorMessage = "Maximum membership days must be between 0 and 3650 (10 years)")]
    public int? MaxMembershipDays { get; set; }

    /// <summary>
    /// Segment overlap criteria (how many segments a member must be in)
    /// </summary>
    public SegmentOverlapCriteria? OverlapCriteria { get; set; }

    /// <summary>
    /// Whether to return only members who are currently active in segments
    /// </summary>
    public bool ActiveMembersOnly { get; set; } = true;

    /// <summary>
    /// Group results by segment
    /// </summary>
    public bool GroupBySegment { get; set; } = false;

    /// <summary>
    /// Include aggregate statistics in response
    /// </summary>
    public bool IncludeStatistics { get; set; } = false;

    /// <summary>
    /// User requesting the search (for audit purposes)
    /// </summary>
    [Required]
    public int RequestedByUserId { get; set; }

    /// <summary>
    /// Validates the search request
    /// </summary>
    /// <returns>Validation result</returns>
    public ValidationResult Validate()
    {
        var errors = new List<string>();

        if (Page < 1)
        {
            errors.Add("Page number must be 1 or greater");
        }

        if (PageSize < 1 || PageSize > 200)
        {
            errors.Add("Page size must be between 1 and 200");
        }

        if (MinMembershipDays.HasValue && MaxMembershipDays.HasValue && MinMembershipDays > MaxMembershipDays)
        {
            errors.Add("Minimum membership days cannot be greater than maximum membership days");
        }

        if (SearchFields != null && SearchFields.Any())
        {
            var validFields = new[] { "FirstName", "LastName", "Email", "Phone", "MemberNumber" };
            var invalidFields = SearchFields.Where(f => !validFields.Contains(f)).ToList();
            if (invalidFields.Any())
            {
                errors.Add($"Invalid search fields: {string.Join(", ", invalidFields)}");
            }
        }

        return new ValidationResult
        {
            IsValid = !errors.Any(),
            Errors = errors
        };
    }
}

/// <summary>
/// Criteria for segment overlap filtering
/// </summary>
public class SegmentOverlapCriteria
{
    /// <summary>
    /// Minimum number of segments a member must be in
    /// </summary>
    [Range(1, 100, ErrorMessage = "Minimum segments must be between 1 and 100")]
    public int MinSegments { get; set; } = 1;

    /// <summary>
    /// Maximum number of segments a member can be in
    /// </summary>
    [Range(1, 100, ErrorMessage = "Maximum segments must be between 1 and 100")]
    public int? MaxSegments { get; set; }

    /// <summary>
    /// Specific segment combinations that must be met
    /// </summary>
    public List<SegmentCombination>? RequiredCombinations { get; set; }

    /// <summary>
    /// Whether to include members in exactly the specified number of segments
    /// </summary>
    public bool ExactMatch { get; set; } = false;
}

/// <summary>
/// Specific segment combination requirement
/// </summary>
public class SegmentCombination
{
    /// <summary>
    /// Segment IDs that must all be present
    /// </summary>
    public List<int> SegmentIds { get; set; } = new();

    /// <summary>
    /// Whether all segments in the combination are required (AND) or any (OR)
    /// </summary>
    public LogicalOperator Operator { get; set; } = LogicalOperator.And;

    /// <summary>
    /// Weight for scoring this combination match
    /// </summary>
    [Range(0.0, 10.0)]
    public double Weight { get; set; } = 1.0;
}