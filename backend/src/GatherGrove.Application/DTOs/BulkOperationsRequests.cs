using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for creating a new bulk operation
/// </summary>
public class CreateBulkOperationRequest
{
    /// <summary>
    /// The club this operation belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Type of bulk operation
    /// </summary>
    [Required]
    public BulkOperationType OperationType { get; set; }

    /// <summary>
    /// Target criteria for the operation
    /// </summary>
    [Required]
    public BulkOperationTarget Target { get; set; } = new();

    /// <summary>
    /// Parameters for the operation
    /// </summary>
    [Required]
    public Dictionary<string, object> Parameters { get; set; } = new();

    /// <summary>
    /// Whether to execute immediately or schedule
    /// </summary>
    public bool ExecuteImmediately { get; set; } = true;

    /// <summary>
    /// Scheduled execution time (if not immediate)
    /// </summary>
    public DateTime? ScheduledFor { get; set; }

    /// <summary>
    /// User creating this operation
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Optional description
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }
}

/// <summary>
/// Request for importing members
/// </summary>
public class ImportMembersRequest
{
    /// <summary>
    /// The club to import members into
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Base64 encoded file content
    /// </summary>
    [Required]
    public string FileContent { get; set; } = string.Empty;

    /// <summary>
    /// File name
    /// </summary>
    [Required]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// File type
    /// </summary>
    [Required]
    public ImportFileType FileType { get; set; }

    /// <summary>
    /// Column mapping configuration
    /// </summary>
    public Dictionary<string, string> ColumnMapping { get; set; } = new();

    /// <summary>
    /// Whether to update existing members
    /// </summary>
    public bool UpdateExisting { get; set; } = false;

    /// <summary>
    /// Whether to validate data before import
    /// </summary>
    public bool ValidateBeforeImport { get; set; } = true;

    /// <summary>
    /// User performing the import
    /// </summary>
    [Required]
    public int ImportedByUserId { get; set; }
}

/// <summary>
/// Request for exporting members
/// </summary>
public class ExportMembersRequest
{
    /// <summary>
    /// The club to export members from
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Export format
    /// </summary>
    [Required]
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Filter criteria for export
    /// </summary>
    public SegmentFilterCriteria? FilterCriteria { get; set; }

    /// <summary>
    /// Fields to include in export
    /// </summary>
    public List<string> IncludeFields { get; set; } = new();

    /// <summary>
    /// Whether to include custom fields
    /// </summary>
    public bool IncludeCustomFields { get; set; } = false;

    /// <summary>
    /// Whether to include tags
    /// </summary>
    public bool IncludeTags { get; set; } = false;

    /// <summary>
    /// Whether to include engagement data
    /// </summary>
    public bool IncludeEngagementData { get; set; } = false;

    /// <summary>
    /// User requesting the export
    /// </summary>
    [Required]
    public int RequestedByUserId { get; set; }
}

/// <summary>
/// Target configuration for bulk operations
/// </summary>
public class BulkOperationTarget
{
    /// <summary>
    /// Target type
    /// </summary>
    public BulkTargetType TargetType { get; set; }

    /// <summary>
    /// Specific member IDs (if targeting specific members)
    /// </summary>
    public List<int> MemberIds { get; set; } = new();

    /// <summary>
    /// Segment ID (if targeting a segment)
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// Filter criteria (if targeting by criteria)
    /// </summary>
    public SegmentFilterCriteria? FilterCriteria { get; set; }

    /// <summary>
    /// Tag IDs (if targeting by tags)
    /// </summary>
    public List<int> TagIds { get; set; } = new();
}

// BulkOperationType enum already exists elsewhere - using existing definition

/// <summary>
/// Bulk target types
/// </summary>
public enum BulkTargetType
{
    SpecificMembers,
    Segment,
    FilterCriteria,
    TaggedMembers,
    AllMembers
}

/// <summary>
/// Import file types
/// </summary>
public enum ImportFileType
{
    CSV,
    Excel,
    JSON
}

// Note: ExportFormat enum is defined in GatherGrove.Domain.Enums.ExportEnums