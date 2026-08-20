using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to transfer club ownership to another admin
/// </summary>
public class ClubOwnershipTransferRequest
{
    /// <summary>
    /// Club ID to transfer ownership
    /// </summary>
    [Required(ErrorMessage = "Club ID is required")]
    public int ClubId { get; set; }

    /// <summary>
    /// User ID of the target admin to receive ownership
    /// </summary>
    [Required(ErrorMessage = "Target user ID is required")]
    public int TargetUserId { get; set; }

    /// <summary>
    /// Whether this transfer is part of an account deletion process
    /// </summary>
    public bool IsPartOfAccountDeletion { get; set; }

    /// <summary>
    /// Optional message to the target admin
    /// </summary>
    [StringLength(500, ErrorMessage = "Message cannot exceed 500 characters")]
    public string? MessageToTarget { get; set; }

    /// <summary>
    /// Whether target admin needs to confirm the transfer
    /// </summary>
    public bool RequireTargetConfirmation { get; set; } = true;

    /// <summary>
    /// When the transfer should take effect
    /// </summary>
    public DateTime? ScheduledTransferDate { get; set; }

    /// <summary>
    /// Current admin's password for additional verification
    /// </summary>
    [Required(ErrorMessage = "Password confirmation is required")]
    public string PasswordConfirmation { get; set; } = string.Empty;
}

/// <summary>
/// Response for club ownership transfer request
/// </summary>
public class ClubOwnershipTransferResponse
{
    /// <summary>
    /// Unique identifier for this transfer request
    /// </summary>
    public Guid TransferId { get; set; }

    /// <summary>
    /// Current status of the transfer
    /// </summary>
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// Whether the target admin needs to confirm
    /// </summary>
    public bool RequiresTargetConfirmation { get; set; }

    /// <summary>
    /// When the transfer is scheduled to take effect
    /// </summary>
    public DateTime? ScheduledTransferDate { get; set; }

    /// <summary>
    /// Confirmation token for the target admin
    /// </summary>
    public string? TargetConfirmationToken { get; set; }

    /// <summary>
    /// Expiration date for the confirmation token
    /// </summary>
    public DateTime? TokenExpirationDate { get; set; }

    /// <summary>
    /// List of actions that need to be completed
    /// </summary>
    public List<string> RequiredActions { get; set; } = new();
}