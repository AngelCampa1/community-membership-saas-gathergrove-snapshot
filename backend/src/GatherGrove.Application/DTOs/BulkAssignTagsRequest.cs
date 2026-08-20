using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for bulk assigning tags to multiple members
/// </summary>
public class BulkAssignTagsRequest
{
    /// <summary>
    /// The club this operation belongs to (set by controller)
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// IDs of members to assign tags to
    /// </summary>
    [Required(ErrorMessage = "At least one member ID is required")]
    [MinLength(1, ErrorMessage = "At least one member ID must be provided")]
    public List<int> MemberIds { get; set; } = new();

    /// <summary>
    /// IDs of tags to assign to the members
    /// </summary>
    [Required(ErrorMessage = "At least one tag ID is required")]
    [MinLength(1, ErrorMessage = "At least one tag ID must be provided")]
    public List<int> TagIds { get; set; } = new();

    /// <summary>
    /// Whether to skip members who already have the tags
    /// </summary>
    public bool SkipExisting { get; set; } = true;

    /// <summary>
    /// Whether to notify members about the tag assignment
    /// </summary>
    public bool NotifyMembers { get; set; } = false;

    /// <summary>
    /// Optional reason for the tag assignment
    /// </summary>
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string? Reason { get; set; }

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

        if (TagIds == null || !TagIds.Any())
        {
            errors.Add("At least one tag ID must be provided");
        }

        if (!ExecuteImmediately && (!ScheduledFor.HasValue || ScheduledFor <= DateTime.UtcNow))
        {
            errors.Add("Scheduled execution time must be in the future when not executing immediately");
        }

        return new ValidationResult
        {
            IsValid = !errors.Any(),
            Errors = errors
        };
    }
}

/// <summary>
/// Validation result for request validation
/// </summary>
public class ValidationResult
{
    /// <summary>
    /// Whether validation passed
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// Validation error messages
    /// </summary>
    public List<string> Errors { get; set; } = new();
}