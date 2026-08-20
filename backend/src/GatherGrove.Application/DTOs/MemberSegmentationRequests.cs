using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for creating a new member segment
/// </summary>
public class CreateSegmentRequest
{
    /// <summary>
    /// The club this segment belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the segment
    /// </summary>
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the segment
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Filter criteria for the segment
    /// </summary>
    [Required]
    public SegmentFilterCriteria FilterCriteria { get; set; } = new();

    /// <summary>
    /// Whether the segment should be automatically calculated
    /// </summary>
    public bool AutoCalculate { get; set; } = true;

    /// <summary>
    /// User creating this segment
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }
}

/// <summary>
/// Request for updating an existing segment
/// </summary>
public class UpdateSegmentRequest
{
    /// <summary>
    /// ID of the segment to update
    /// </summary>
    [Required]
    public int SegmentId { get; set; }

    /// <summary>
    /// Updated name of the segment
    /// </summary>
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Updated description of the segment
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Updated filter criteria
    /// </summary>
    [Required]
    public SegmentFilterCriteria FilterCriteria { get; set; } = new();

    /// <summary>
    /// Whether the segment is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// User updating this segment
    /// </summary>
    [Required]
    public int UpdatedByUserId { get; set; }
}

/// <summary>
/// Request for getting segment members with optional filtering
/// </summary>
public class GetSegmentMembersRequest
{
    /// <summary>
    /// ID of the segment
    /// </summary>
    [Required]
    public int SegmentId { get; set; }

    /// <summary>
    /// Include engagement data in response
    /// </summary>
    public bool IncludeEngagementData { get; set; } = false;

    /// <summary>
    /// Include custom field values in response
    /// </summary>
    public bool IncludeCustomFields { get; set; } = false;

    /// <summary>
    /// Include member tags in response
    /// </summary>
    public bool IncludeTags { get; set; } = false;

    /// <summary>
    /// Page number for pagination
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of results per page
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Sort field
    /// </summary>
    public string SortBy { get; set; } = "MemberName";

    /// <summary>
    /// Sort direction
    /// </summary>
    public SortDirection SortDirection { get; set; } = SortDirection.Ascending;
}

/// <summary>
/// Complex filter criteria for member segmentation
/// </summary>
public class SegmentFilterCriteria
{
    /// <summary>
    /// Filter by member status
    /// </summary>
    public StringFilter? StatusFilter { get; set; }

    /// <summary>
    /// Filter by join date
    /// </summary>
    public DateRangeFilter? JoinDateFilter { get; set; }

    /// <summary>
    /// Filter by last active date
    /// </summary>
    public DateRangeFilter? LastActiveFilter { get; set; }

    /// <summary>
    /// Filter by engagement score
    /// </summary>
    public NumericFilter? EngagementScoreFilter { get; set; }

    /// <summary>
    /// Filter by engagement level
    /// </summary>
    public NumericFilter? EngagementLevelFilter { get; set; }

    /// <summary>
    /// Filter by membership type
    /// </summary>
    public ListFilter? MembershipTypeFilter { get; set; }

    /// <summary>
    /// Filter by tags (member must have these tags)
    /// </summary>
    public TagFilter? TagFilter { get; set; }

    /// <summary>
    /// Filter by custom field values
    /// </summary>
    public List<CustomFieldFilter>? CustomFieldFilters { get; set; }

    /// <summary>
    /// Filter by age (calculated from birth date custom field)
    /// </summary>
    public NumericFilter? AgeFilter { get; set; }

    /// <summary>
    /// Filter by event attendance
    /// </summary>
    public EventAttendanceFilter? EventAttendanceFilter { get; set; }

    /// <summary>
    /// Logical operator for combining filters (AND/OR)
    /// </summary>
    public LogicalOperator LogicalOperator { get; set; } = LogicalOperator.And;
}

/// <summary>
/// String-based filter
/// </summary>
public class StringFilter
{
    public StringOperator Operator { get; set; }
    public string Value { get; set; } = string.Empty;
    public bool CaseSensitive { get; set; } = false;
}

/// <summary>
/// Date range filter
/// </summary>
public class DateRangeFilter
{
    public DateOperator Operator { get; set; }
    public DateTime Value { get; set; }
    public DateTime? EndValue { get; set; } // For range operations
}

/// <summary>
/// Numeric filter
/// </summary>
public class NumericFilter
{
    public NumericOperator Operator { get; set; }
    public decimal Value { get; set; }
    public decimal? EndValue { get; set; } // For range operations
}

/// <summary>
/// List-based filter
/// </summary>
public class ListFilter
{
    public ListOperator Operator { get; set; }
    public List<string> Values { get; set; } = new();
}

/// <summary>
/// Tag-based filter
/// </summary>
public class TagFilter
{
    public TagOperator Operator { get; set; }
    public List<int> TagIds { get; set; } = new();
    public List<string> TagNames { get; set; } = new();
}

/// <summary>
/// Custom field filter
/// </summary>
public class CustomFieldFilter
{
    public int CustomFieldId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public StringFilter? StringFilter { get; set; }
    public NumericFilter? NumericFilter { get; set; }
    public BooleanFilter? BooleanFilter { get; set; }
    public ListFilter? ListFilter { get; set; }
}

/// <summary>
/// Boolean filter
/// </summary>
public class BooleanFilter
{
    public bool Value { get; set; }
    public bool IncludeNull { get; set; } = false;
}

/// <summary>
/// Event attendance filter
/// </summary>
public class EventAttendanceFilter
{
    public AttendanceOperator Operator { get; set; }
    public int Value { get; set; } // Number of events
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public List<int>? EventIds { get; set; } // Specific events
}

// Enums for filter operations
public enum StringOperator
{
    Equals,
    NotEquals,
    Contains,
    NotContains,
    StartsWith,
    EndsWith,
    IsNull,
    IsNotNull
}

public enum DateOperator
{
    Equals,
    NotEquals,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Between,
    IsNull,
    IsNotNull
}

public enum NumericOperator
{
    Equals,
    NotEquals,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Between,
    IsNull,
    IsNotNull
}

public enum ListOperator
{
    In,
    NotIn,
    Contains,
    NotContains
}

public enum TagOperator
{
    HasAny,
    HasAll,
    HasNone,
    HasExactly
}

public enum AttendanceOperator
{
    Equals,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Between
}

public enum LogicalOperator
{
    And,
    Or
}

public enum SortDirection
{
    Ascending,
    Descending
}