namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Options for member data export
/// US-005 Data Export & Reporting Engine
/// </summary>
public class MemberExportOptions
{
    /// <summary>
    /// Whether to include personal information
    /// </summary>
    public bool IncludePersonalInfo { get; set; } = true;

    /// <summary>
    /// Whether to include membership details
    /// </summary>
    public bool IncludeMembershipDetails { get; set; } = true;

    /// <summary>
    /// Whether to include contact information
    /// </summary>
    public bool IncludeContactInfo { get; set; } = true;

    /// <summary>
    /// Whether to include custom fields
    /// </summary>
    public bool IncludeCustomFields { get; set; } = false;

    /// <summary>
    /// Whether to include attendance statistics
    /// </summary>
    public bool IncludeAttendanceStats { get; set; } = false;

    /// <summary>
    /// Whether to include charts
    /// </summary>
    public bool IncludeCharts { get; set; } = false;

    /// <summary>
    /// Whether to include statistics
    /// </summary>
    public bool IncludeStatistics { get; set; } = false;

    /// <summary>
    /// Whether to include metadata
    /// </summary>
    public bool IncludeMetadata { get; set; } = false;

    /// <summary>
    /// Whether to redact sensitive data
    /// </summary>
    public bool RedactSensitiveData { get; set; } = false;

    /// <summary>
    /// Whether to notify on completion
    /// </summary>
    public bool NotifyOnCompletion { get; set; } = false;

    /// <summary>
    /// Start date for filtering
    /// </summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>
    /// End date for filtering
    /// </summary>
    public DateTime? DateTo { get; set; }

    /// <summary>
    /// Membership type filter
    /// </summary>
    public string? MembershipTypeFilter { get; set; }

    /// <summary>
    /// Status filter
    /// </summary>
    public string? StatusFilter { get; set; }

    /// <summary>
    /// Custom field IDs to include
    /// </summary>
    public List<int> CustomFieldIds { get; set; } = new List<int>();
}