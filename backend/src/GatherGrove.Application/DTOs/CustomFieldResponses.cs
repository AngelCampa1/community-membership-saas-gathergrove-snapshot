namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for custom field operations
/// </summary>
public class CustomFieldResponse
{
    /// <summary>
    /// Unique identifier for the field
    /// </summary>
    public int CustomFieldId { get; set; }

    /// <summary>
    /// The club this field belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Label/name of the field
    /// </summary>
    public string FieldLabel { get; set; } = string.Empty;

    /// <summary>
    /// Type of field
    /// </summary>
    public string FieldType { get; set; } = string.Empty;

    /// <summary>
    /// Dropdown options (if applicable)
    /// </summary>
    public string? DropdownOptions { get; set; }

    /// <summary>
    /// Whether this field is required
    /// </summary>
    public bool IsRequired { get; set; }

    /// <summary>
    /// When this field was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Usage statistics for this field (if requested)
    /// </summary>
    public CustomFieldUsageStats? UsageStats { get; set; }
}

/// <summary>
/// Response for custom field value operations
/// </summary>
public class CustomFieldValueResponse
{
    /// <summary>
    /// ID of the value record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ID of the member
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// ID of the custom field
    /// </summary>
    public int CustomFieldId { get; set; }

    /// <summary>
    /// Label of the custom field
    /// </summary>
    public string FieldLabel { get; set; } = string.Empty;

    /// <summary>
    /// Type of the custom field
    /// </summary>
    public string FieldType { get; set; } = string.Empty;

    /// <summary>
    /// The field value
    /// </summary>
    public string FieldValue { get; set; } = string.Empty;

    /// <summary>
    /// When this value was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Usage statistics for a custom field
/// </summary>
public class CustomFieldUsageStats
{
    /// <summary>
    /// Total number of members in the club
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Number of members with a value for this field
    /// </summary>
    public int CompletedCount { get; set; }

    /// <summary>
    /// Completion rate as a decimal (0.0 to 1.0)
    /// </summary>
    public decimal CompletionRate { get; set; }

    /// <summary>
    /// Most common values (for analysis)
    /// </summary>
    public List<string> CommonValues { get; set; } = new();
}

/// <summary>
/// Result of bulk custom field value operations
/// </summary>
public class BulkCustomFieldResult
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
}

// Note: BulkOperationError is defined in BulkOperationsResponses.cs

/// <summary>
/// Result of field type compatibility validation
/// </summary>
public class FieldTypeCompatibilityResult
{
    /// <summary>
    /// Whether the field type change is compatible
    /// </summary>
    public bool IsCompatible { get; set; }

    /// <summary>
    /// List of existing values that would be incompatible
    /// </summary>
    public List<IncompatibleValue> IncompatibleValues { get; set; } = new();

    /// <summary>
    /// Recommended actions to resolve incompatibilities
    /// </summary>
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Represents an incompatible existing value
/// </summary>
public class IncompatibleValue
{
    /// <summary>
    /// Member ID with incompatible value
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member name for reference
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// The incompatible value
    /// </summary>
    public string CurrentValue { get; set; } = string.Empty;

    /// <summary>
    /// Reason why it's incompatible
    /// </summary>
    public string Reason { get; set; } = string.Empty;
}