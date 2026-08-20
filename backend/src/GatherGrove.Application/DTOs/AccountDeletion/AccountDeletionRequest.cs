using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to initiate account deletion process
/// </summary>
public class AccountDeletionRequest
{
    /// <summary>
    /// Reason for account deletion (required for audit trail)
    /// </summary>
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// User must type exact phrase "DELETE MY ACCOUNT" to confirm
    /// </summary>
    [Required(ErrorMessage = "Confirmation phrase is required")]
    [RegularExpression("^DELETE MY ACCOUNT$", ErrorMessage = "Confirmation phrase must be exactly 'DELETE MY ACCOUNT'")]
    public string ConfirmationPhrase { get; set; } = string.Empty;

    /// <summary>
    /// Whether to generate a data export before deletion
    /// </summary>
    public bool RequestDataExport { get; set; } = true;

    /// <summary>
    /// Optional: Transfer club ownership to this user ID (for club owners)
    /// </summary>
    public int? TransferClubOwnershipToUserId { get; set; }

    /// <summary>
    /// How to handle member data in clubs that remain active
    /// </summary>
    public MemberDataHandling MemberDataHandling { get; set; } = MemberDataHandling.Anonymize;

    /// <summary>
    /// Admin-specific transfer instructions for each club
    /// </summary>
    public List<ClubTransferInstruction> ClubTransferInstructions { get; set; } = new();

    /// <summary>
    /// Whether to delete entire clubs where user is only admin
    /// </summary>
    public bool DeleteOrphanedClubs { get; set; } = true;

    /// <summary>
    /// Password confirmation for admin accounts (additional security)
    /// </summary>
    public string? PasswordConfirmation { get; set; }
}

/// <summary>
/// Instructions for transferring club ownership
/// </summary>
public class ClubTransferInstruction
{
    /// <summary>
    /// Club ID to transfer
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// User ID to transfer ownership to (null if deleting club)
    /// </summary>
    public int? TransferToUserId { get; set; }

    /// <summary>
    /// Whether to delete the entire club
    /// </summary>
    public bool DeleteClub { get; set; }

    /// <summary>
    /// Additional notes for this transfer
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Options for handling member data when user account is deleted
/// </summary>
public enum MemberDataHandling
{
    /// <summary>
    /// Replace personal data with "Deleted User" placeholder
    /// </summary>
    Anonymize,

    /// <summary>
    /// Completely remove member record (may break event/payment history)
    /// </summary>
    Remove,

    /// <summary>
    /// Keep member data for historical/audit purposes
    /// </summary>
    Retain
}