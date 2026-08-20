using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a request to delete a user account with tracking and audit trail
/// </summary>
public class AccountDeletionRequest
{
    /// <summary>
    /// Unique identifier for the deletion request
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// User ID requesting account deletion
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Current status of the deletion request
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Requested";

    /// <summary>
    /// User-provided reason for account deletion
    /// </summary>
    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// How to handle member data in remaining clubs
    /// </summary>
    [Required]
    [StringLength(50)]
    public string MemberDataHandling { get; set; } = "Anonymize";

    /// <summary>
    /// Optional: Transfer club ownership to this user ID
    /// </summary>
    public int? TransferOwnershipToUserId { get; set; }

    /// <summary>
    /// Whether this deletion requires manual review
    /// </summary>
    [Required]
    public bool RequiresManualReview { get; set; } = false;

    /// <summary>
    /// Associated data export ID if requested
    /// </summary>
    public Guid? DataExportId { get; set; }

    /// <summary>
    /// When the deletion was requested
    /// </summary>
    [Required]
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// When the deletion started processing
    /// </summary>
    public DateTime? ProcessedAt { get; set; }

    /// <summary>
    /// When the deletion was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Admin user ID who processed the deletion
    /// </summary>
    public int? ProcessedByUserId { get; set; }

    /// <summary>
    /// Error messages if deletion failed
    /// </summary>
    public string? ErrorMessages { get; set; }

    /// <summary>
    /// When this record was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this record was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the user requesting deletion
    /// </summary>
    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Navigation property for transfer ownership target user
    /// </summary>
    [ForeignKey(nameof(TransferOwnershipToUserId))]
    public virtual User? TransferOwnershipToUser { get; set; }

    /// <summary>
    /// Navigation property for admin who processed the deletion
    /// </summary>
    [ForeignKey(nameof(ProcessedByUserId))]
    public virtual User? ProcessedByUser { get; set; }

    /// <summary>
    /// Navigation property for associated data export
    /// </summary>
    [ForeignKey(nameof(DataExportId))]
    public virtual DataExport? DataExport { get; set; }
}