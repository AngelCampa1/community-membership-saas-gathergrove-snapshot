using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for bulk updating member statuses
/// </summary>
public class BulkUpdateMemberStatusRequest
{
    /// <summary>
    /// The club this operation belongs to (set by controller)
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// IDs of members to update status for
    /// </summary>
    [Required(ErrorMessage = "At least one member ID is required")]
    [MinLength(1, ErrorMessage = "At least one member ID must be provided")]
    public List<int> MemberIds { get; set; } = new();

    /// <summary>
    /// New status to set for all members
    /// </summary>
    [Required(ErrorMessage = "New status is required")]
    [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
    public string NewStatus { get; set; } = string.Empty;

    /// <summary>
    /// Optional reason for the status change
    /// </summary>
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string? Reason { get; set; }

    /// <summary>
    /// Whether to notify members about the status change
    /// </summary>
    public bool NotifyMembers { get; set; } = false;

    /// <summary>
    /// Whether to skip members who already have the target status
    /// </summary>
    public bool SkipSameStatus { get; set; } = true;

    /// <summary>
    /// Whether to enforce business rules for status transitions
    /// </summary>
    public bool EnforceBusinessRules { get; set; } = true;

    /// <summary>
    /// Effective date of the status change
    /// </summary>
    public DateTime? EffectiveDate { get; set; }

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
    /// Whether to create audit trail for status changes
    /// </summary>
    public bool CreateAuditTrail { get; set; } = true;

    /// <summary>
    /// Additional metadata for the status change
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();

    /// <summary>
    /// Validates the request
    /// </summary>
    /// <returns>Validation result</returns>
    public ValidationResult Validate()
    {
        var errors = new List<string>();

        if (MemberIds == null || !MemberIds.Any())
        {
            errors.Add("At least one member ID must be provided");
        }

        var validStatuses = new[] { "Active", "Inactive", "Suspended", "Archived" };
        if (string.IsNullOrWhiteSpace(NewStatus) || !validStatuses.Contains(NewStatus))
        {
            errors.Add($"Invalid member status. Valid options: {string.Join(", ", validStatuses)}");
        }

        if (!ExecuteImmediately && (!ScheduledFor.HasValue || ScheduledFor <= DateTime.UtcNow))
        {
            errors.Add("Scheduled execution time must be in the future when not executing immediately");
        }

        if (EffectiveDate.HasValue && EffectiveDate > DateTime.UtcNow.AddYears(1))
        {
            errors.Add("Effective date cannot be more than 1 year in the future");
        }

        return new ValidationResult
        {
            IsValid = !errors.Any(),
            Errors = errors
        };
    }
}