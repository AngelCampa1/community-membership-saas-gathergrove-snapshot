using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for bulk importing member data
/// </summary>
public class BulkImportRequest
{
    /// <summary>
    /// The club this operation belongs to (set by controller)
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Base64 encoded file content
    /// </summary>
    [Required(ErrorMessage = "File content is required")]
    public string FileContent { get; set; } = string.Empty;

    /// <summary>
    /// Original filename
    /// </summary>
    [Required(ErrorMessage = "Filename is required")]
    [StringLength(255, ErrorMessage = "Filename cannot exceed 255 characters")]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// File type for import (CSV, Excel, JSON)
    /// </summary>
    [Required(ErrorMessage = "File type is required")]
    public ImportFileType FileType { get; set; } = ImportFileType.CSV;

    /// <summary>
    /// Column mapping configuration (maps file columns to member properties)
    /// </summary>
    [Required(ErrorMessage = "Column mapping is required")]
    public Dictionary<string, string> ColumnMapping { get; set; } = new();

    /// <summary>
    /// Import mode (Insert, Update, Upsert)
    /// </summary>
    public ImportMode ImportMode { get; set; } = ImportMode.Upsert;

    /// <summary>
    /// How to match existing members for updates
    /// </summary>
    public MemberMatchCriteria MatchCriteria { get; set; } = MemberMatchCriteria.Email;

    /// <summary>
    /// Whether to validate all data before importing
    /// </summary>
    public bool ValidateBeforeImport { get; set; } = true;

    /// <summary>
    /// Whether to skip rows with validation errors
    /// </summary>
    public bool SkipInvalidRows { get; set; } = true;

    /// <summary>
    /// Whether to skip duplicate members
    /// </summary>
    public bool SkipDuplicates { get; set; } = true;

    /// <summary>
    /// Whether to notify imported members
    /// </summary>
    public bool NotifyMembers { get; set; } = false;

    /// <summary>
    /// Default membership type for new members
    /// </summary>
    public int? DefaultMembershipTypeId { get; set; }

    /// <summary>
    /// Default status for new members
    /// </summary>
    [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
    public string DefaultStatus { get; set; } = "Active";

    /// <summary>
    /// Tags to automatically assign to imported members
    /// </summary>
    public List<int>? AutoAssignTagIds { get; set; }

    /// <summary>
    /// Custom field mappings
    /// </summary>
    public Dictionary<int, string>? CustomFieldMappings { get; set; }

    /// <summary>
    /// Whether to create missing custom fields automatically
    /// </summary>
    public bool CreateMissingCustomFields { get; set; } = false;

    /// <summary>
    /// Maximum number of rows to import (0 = no limit)
    /// </summary>
    [Range(0, 50000, ErrorMessage = "Maximum rows must be between 0 and 50,000")]
    public int MaxRows { get; set; } = 0;

    /// <summary>
    /// Row to start importing from (1-based, 0 = start from beginning)
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "Start row must be 0 or greater")]
    public int StartRow { get; set; } = 0;

    /// <summary>
    /// Whether the first row contains headers
    /// </summary>
    public bool HasHeaderRow { get; set; } = true;

    /// <summary>
    /// Batch size for processing (for large imports)
    /// </summary>
    [Range(1, 1000, ErrorMessage = "Batch size must be between 1 and 1,000")]
    public int BatchSize { get; set; } = 100;

    /// <summary>
    /// User requesting this operation (set by controller)
    /// </summary>
    [Required]
    public int RequestedByUserId { get; set; }

    /// <summary>
    /// Whether to execute immediately or schedule for later
    /// </summary>
    public bool ExecuteImmediately { get; set; } = true;

    /// <summary>
    /// Scheduled execution time (if not immediate)
    /// </summary>
    public DateTime? ScheduledFor { get; set; }

    /// <summary>
    /// Whether to create backup before import
    /// </summary>
    public bool CreateBackup { get; set; } = true;

    /// <summary>
    /// Import notes or description
    /// </summary>
    [StringLength(1000, ErrorMessage = "Notes cannot exceed 1,000 characters")]
    public string? Notes { get; set; }

    /// <summary>
    /// Data transformation rules to apply during import
    /// </summary>
    public List<DataTransformationRule>? TransformationRules { get; set; }

    /// <summary>
    /// Validates the request
    /// </summary>
    /// <returns>Validation result</returns>
    public ValidationResult Validate()
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(FileContent))
        {
            errors.Add("File content is required");
        }

        if (string.IsNullOrWhiteSpace(FileName))
        {
            errors.Add("Filename is required");
        }

        if (!Enum.IsDefined(typeof(ImportFileType), FileType))
        {
            errors.Add("Invalid file type specified");
        }

        if (ColumnMapping == null || !ColumnMapping.Any())
        {
            errors.Add("Column mapping is required");
        }

        if (!ExecuteImmediately && (!ScheduledFor.HasValue || ScheduledFor <= DateTime.UtcNow))
        {
            errors.Add("Scheduled execution time must be in the future when not executing immediately");
        }

        // Validate required mappings
        if (ColumnMapping != null && ImportMode == ImportMode.Insert)
        {
            var requiredFields = new[] { "FirstName", "LastName", "Email" };
            foreach (var field in requiredFields)
            {
                if (!ColumnMapping.ContainsValue(field))
                {
                    errors.Add($"Required field '{field}' must be mapped for insert operations");
                }
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
/// Import mode options
/// </summary>
public enum ImportMode
{
    /// <summary>
    /// Only insert new members, skip existing
    /// </summary>
    Insert,

    /// <summary>
    /// Only update existing members, skip new
    /// </summary>
    Update,

    /// <summary>
    /// Insert new members and update existing ones
    /// </summary>
    Upsert
}

/// <summary>
/// Criteria for matching existing members
/// </summary>
public enum MemberMatchCriteria
{
    /// <summary>
    /// Match by email address
    /// </summary>
    Email,

    /// <summary>
    /// Match by member ID
    /// </summary>
    MemberId,

    /// <summary>
    /// Match by first and last name
    /// </summary>
    FullName,

    /// <summary>
    /// Match by phone number
    /// </summary>
    Phone,

    /// <summary>
    /// Match by custom field value
    /// </summary>
    CustomField
}

/// <summary>
/// Data transformation rule
/// </summary>
public class DataTransformationRule
{
    /// <summary>
    /// Field to apply transformation to
    /// </summary>
    [Required]
    public string FieldName { get; set; } = string.Empty;

    /// <summary>
    /// Type of transformation
    /// </summary>
    public ImportTransformationType TransformationType { get; set; }

    /// <summary>
    /// Parameters for the transformation
    /// </summary>
    public Dictionary<string, string> Parameters { get; set; } = new();
}

/// <summary>
/// Types of data transformations for import
/// </summary>
public enum ImportTransformationType
{
    /// <summary>
    /// Convert to uppercase
    /// </summary>
    ToUpper,

    /// <summary>
    /// Convert to lowercase
    /// </summary>
    ToLower,

    /// <summary>
    /// Trim whitespace
    /// </summary>
    Trim,

    /// <summary>
    /// Format phone number
    /// </summary>
    FormatPhone,

    /// <summary>
    /// Format date
    /// </summary>
    FormatDate,

    /// <summary>
    /// Replace text
    /// </summary>
    Replace,

    /// <summary>
    /// Apply regular expression
    /// </summary>
    Regex
}