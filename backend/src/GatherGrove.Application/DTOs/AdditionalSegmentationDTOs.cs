using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for creating a member segment (alias for service compatibility)
/// </summary>
public class CreateMemberSegmentRequest : CreateSegmentRequest
{
    // Inherits all properties from CreateSegmentRequest
}

/// <summary>
/// Request for updating a member segment (alias for service compatibility)
/// </summary>
public class UpdateMemberSegmentRequest : UpdateSegmentRequest
{
    // Inherits all properties from UpdateSegmentRequest
}

/// <summary>
/// Request for creating a member tag (alias for service compatibility)
/// </summary>
public class CreateMemberTagRequest : CreateTagRequest
{
    // Inherits all properties from CreateTagRequest
}

/// <summary>
/// Request for updating a member tag (alias for service compatibility)
/// </summary>
public class UpdateMemberTagRequest : UpdateTagRequest
{
    // Inherits all properties from UpdateTagRequest
}

/// <summary>
/// Response for segment filter options
/// </summary>
public class SegmentFilterOptionsResponse
{
    /// <summary>
    /// Available status values
    /// </summary>
    public List<string> AvailableStatuses { get; set; } = new();

    /// <summary>
    /// Available membership types
    /// </summary>
    public List<MembershipTypeOption> MembershipTypes { get; set; } = new();

    /// <summary>
    /// Available custom fields
    /// </summary>
    public List<CustomFieldOption> CustomFields { get; set; } = new();

    /// <summary>
    /// Available tags
    /// </summary>
    public List<TagOption> Tags { get; set; } = new();

    /// <summary>
    /// Date range presets
    /// </summary>
    public List<DateRangePreset> DateRangePresets { get; set; } = new();

    /// <summary>
    /// Numeric range suggestions
    /// </summary>
    public Dictionary<string, NumericRange> NumericRanges { get; set; } = new();

    /// <summary>
    /// Available events for attendance filtering
    /// </summary>
    public List<EventOption> Events { get; set; } = new();
}

/// <summary>
/// Membership type option
/// </summary>
public class MembershipTypeOption
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

/// <summary>
/// Custom field option
/// </summary>
public class CustomFieldOption
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public List<string>? Options { get; set; }
    public bool IsRequired { get; set; }
}

/// <summary>
/// Tag option
/// </summary>
public class TagOption
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int UsageCount { get; set; }
}

/// <summary>
/// Date range preset
/// </summary>
public class DateRangePreset
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

/// <summary>
/// Numeric range
/// </summary>
public class NumericRange
{
    public decimal MinValue { get; set; }
    public decimal MaxValue { get; set; }
    public decimal SuggestedStep { get; set; }
    public string Unit { get; set; } = string.Empty;
}

/// <summary>
/// Event option
/// </summary>
public class EventOption
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string EventType { get; set; } = string.Empty;
    public int AttendeeCount { get; set; }
}