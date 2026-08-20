using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for bulk updating custom field values for multiple members
/// </summary>
public class BulkUpdateCustomFieldsRequest
{
    /// <summary>
    /// The club this operation belongs to (set by controller)
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// ID of the custom field to update
    /// </summary>
    [Required(ErrorMessage = "Custom field ID is required")]
    public int CustomFieldId { get; set; }

    /// <summary>
    /// List of member updates with their new values
    /// </summary>
    [Required(ErrorMessage = "At least one member update is required")]
    [MinLength(1, ErrorMessage = "At least one member update must be provided")]
    public List<MemberCustomFieldUpdate> Updates { get; set; } = new();

    /// <summary>
    /// Update mode - single value for all or individual values
    /// </summary>
    public CustomFieldUpdateMode UpdateMode { get; set; } = CustomFieldUpdateMode.Individual;

    /// <summary>
    /// Single value to set for all members (when using SingleValue mode)
    /// </summary>
    public string? SingleValue { get; set; }

    /// <summary>
    /// Whether to skip members with validation errors
    /// </summary>
    public bool SkipValidationErrors { get; set; } = true;

    /// <summary>
    /// Whether to notify members about the custom field update
    /// </summary>
    public bool NotifyMembers { get; set; } = false;

    /// <summary>
    /// Optional reason for the custom field update
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
    /// Whether to create backup of previous values
    /// </summary>
    public bool CreateBackup { get; set; } = true;

    /// <summary>
    /// Validates the request
    /// </summary>
    /// <returns>Validation result</returns>
    public ValidationResult Validate()
    {
        var errors = new List<string>();

        if (Updates == null || !Updates.Any())
        {
            errors.Add("At least one member update must be provided");
        }

        if (UpdateMode == CustomFieldUpdateMode.SingleValue && string.IsNullOrWhiteSpace(SingleValue))
        {
            errors.Add("Single value must be provided when using SingleValue update mode");
        }

        if (!ExecuteImmediately && (!ScheduledFor.HasValue || ScheduledFor <= DateTime.UtcNow))
        {
            errors.Add("Scheduled execution time must be in the future when not executing immediately");
        }

        // Validate individual updates
        if (Updates != null)
        {
            for (int i = 0; i < Updates.Count; i++)
            {
                var update = Updates[i];
                if (update.MemberId <= 0)
                {
                    errors.Add($"Update {i + 1}: Invalid member ID");
                }

                if (UpdateMode == CustomFieldUpdateMode.Individual && string.IsNullOrEmpty(update.NewValue))
                {
                    errors.Add($"Update {i + 1}: New value is required for individual update mode");
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
/// Individual member custom field update
/// </summary>
public class MemberCustomFieldUpdate
{
    /// <summary>
    /// ID of the member to update
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// New value for the custom field
    /// </summary>
    [Required(ErrorMessage = "New value is required")]
    public string NewValue { get; set; } = string.Empty;

    /// <summary>
    /// Optional notes for this specific update
    /// </summary>
    [StringLength(200)]
    public string? Notes { get; set; }

    /// <summary>
    /// Whether to force the update even if validation fails
    /// </summary>
    public bool ForceUpdate { get; set; } = false;
}

/// <summary>
/// Update mode for custom field operations
/// </summary>
public enum CustomFieldUpdateMode
{
    /// <summary>
    /// Each member gets an individual value
    /// </summary>
    Individual,

    /// <summary>
    /// All members get the same value
    /// </summary>
    SingleValue,

    /// <summary>
    /// Clear the custom field value for all members
    /// </summary>
    Clear
}