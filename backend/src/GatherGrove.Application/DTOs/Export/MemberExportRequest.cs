using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Request model for member data export operations
/// </summary>
public class MemberExportRequest
{
    /// <summary>
    /// Export format
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Whether to include personal information in the export
    /// </summary>
    public bool IncludePersonalInfo { get; set; }

    /// <summary>
    /// Whether to include membership details
    /// </summary>
    public bool IncludeMembershipDetails { get; set; }

    /// <summary>
    /// Start date for filtering members
    /// </summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>
    /// End date for filtering members
    /// </summary>
    public DateTime? DateTo { get; set; }

    /// <summary>
    /// Additional export options
    /// </summary>
    public MemberExportOptions? Options { get; set; }
}