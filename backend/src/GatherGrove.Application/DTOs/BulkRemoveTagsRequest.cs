using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for bulk removing tags from multiple members
/// </summary>
public class BulkRemoveTagsRequest
{
    /// <summary>
    /// The club this operation belongs to (set by controller)
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// IDs of members to remove tags from
    /// </summary>
    [Required(ErrorMessage = "At least one member ID is required")]
    [MinLength(1, ErrorMessage = "At least one member ID must be provided")]
    public List<int> MemberIds { get; set; } = new();

    /// <summary>
    /// IDs of tags to remove from the members
    /// </summary>
    [Required(ErrorMessage = "At least one tag ID is required")]
    [MinLength(1, ErrorMessage = "At least one tag ID must be provided")]
    public List<int> TagIds { get; set; } = new();

    /// <summary>
    /// Whether to remove all specified tags or just some
    /// </summary>
    public TagRemovalMode RemovalMode { get; set; } = TagRemovalMode.All;

    /// <summary>
    /// Whether to skip members who don't have the tags
    /// </summary>
    public bool SkipMissing { get; set; } = true;

    /// <summary>
    /// Whether to notify members about the tag removal
    /// </summary>
    public bool NotifyMembers { get; set; } = false;

    /// <summary>
    /// Optional reason for the tag removal
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
/// Mode for tag removal operations
/// </summary>
public enum TagRemovalMode
{
    /// <summary>
    /// Remove all specified tags that exist on each member
    /// </summary>
    All,

    /// <summary>
    /// Remove only the first matching tag from each member
    /// </summary>
    First,

    /// <summary>
    /// Remove tags based on specific criteria
    /// </summary>
    Conditional
}