using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for bulk exporting member data
/// </summary>
public class BulkExportRequest
{
    /// <summary>
    /// The club this operation belongs to (set by controller)
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Export format (CSV, Excel, JSON, XML)
    /// </summary>
    [Required(ErrorMessage = "Export format is required")]
    public ExportFormat ExportFormat { get; set; } = ExportFormat.CSV;

    /// <summary>
    /// Filter criteria to determine which members to export
    /// </summary>
    public SegmentFilterCriteria? FilterCriteria { get; set; }

    /// <summary>
    /// Specific member IDs to export (overrides filter criteria if provided)
    /// </summary>
    public List<int>? MemberIds { get; set; }

    /// <summary>
    /// Fields to include in the export
    /// </summary>
    [Required(ErrorMessage = "At least one field must be selected for export")]
    [MinLength(1, ErrorMessage = "At least one field must be selected for export")]
    public List<string> IncludeFields { get; set; } = new();

    /// <summary>
    /// Whether to include custom fields in the export
    /// </summary>
    public bool IncludeCustomFields { get; set; } = false;

    /// <summary>
    /// Specific custom field IDs to include (if IncludeCustomFields is true)
    /// </summary>
    public List<int>? CustomFieldIds { get; set; }

    /// <summary>
    /// Whether to include member tags in the export
    /// </summary>
    public bool IncludeTags { get; set; } = false;

    /// <summary>
    /// Whether to include engagement data in the export
    /// </summary>
    public bool IncludeEngagementData { get; set; } = false;

    /// <summary>
    /// Whether to include event attendance data
    /// </summary>
    public bool IncludeEventData { get; set; } = false;

    /// <summary>
    /// Whether to include payment history
    /// </summary>
    public bool IncludePaymentHistory { get; set; } = false;

    /// <summary>
    /// Date range for historical data (if applicable)
    /// </summary>
    public DateRangeFilter? DateRange { get; set; }

    /// <summary>
    /// Maximum number of records to export (0 = no limit)
    /// </summary>
    [Range(0, 100000, ErrorMessage = "Maximum records must be between 0 and 100,000")]
    public int MaxRecords { get; set; } = 0;

    /// <summary>
    /// Export filename (without extension)
    /// </summary>
    [StringLength(100, ErrorMessage = "Filename cannot exceed 100 characters")]
    public string? FileName { get; set; }

    /// <summary>
    /// Whether to compress the export file
    /// </summary>
    public bool CompressFile { get; set; } = false;

    /// <summary>
    /// Whether to password protect the export file
    /// </summary>
    public bool PasswordProtect { get; set; } = false;

    /// <summary>
    /// Password for the export file (if PasswordProtect is true)
    /// </summary>
    [StringLength(50, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 50 characters")]
    public string? Password { get; set; }

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
    /// Whether to email the export file to the requester
    /// </summary>
    public bool EmailResults { get; set; } = true;

    /// <summary>
    /// Additional email addresses to send the export to
    /// </summary>
    public List<string>? AdditionalEmailAddresses { get; set; }

    /// <summary>
    /// Export expiration time (how long the file will be available)
    /// </summary>
    public TimeSpan? ExpirationTime { get; set; } = TimeSpan.FromDays(7);

    /// <summary>
    /// Validates the request
    /// </summary>
    /// <returns>Validation result</returns>
    public ValidationResult Validate()
    {
        var errors = new List<string>();

        if (!Enum.IsDefined(typeof(ExportFormat), ExportFormat))
        {
            errors.Add("Invalid export format specified");
        }

        if (IncludeFields == null || !IncludeFields.Any())
        {
            errors.Add("At least one field must be selected for export");
        }

        if (PasswordProtect && string.IsNullOrWhiteSpace(Password))
        {
            errors.Add("Password is required when password protection is enabled");
        }

        if (!ExecuteImmediately && (!ScheduledFor.HasValue || ScheduledFor <= DateTime.UtcNow))
        {
            errors.Add("Scheduled execution time must be in the future when not executing immediately");
        }

        if (MemberIds != null && FilterCriteria != null)
        {
            errors.Add("Cannot specify both specific member IDs and filter criteria");
        }

        if (AdditionalEmailAddresses != null)
        {
            foreach (var email in AdditionalEmailAddresses)
            {
                if (!IsValidEmail(email))
                {
                    errors.Add($"Invalid email address: {email}");
                }
            }
        }

        return new ValidationResult
        {
            IsValid = !errors.Any(),
            Errors = errors
        };
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}