namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a request to transfer a member from one location to another
/// </summary>
public class MemberTransfer
{
    /// <summary>
    /// Unique identifier for the transfer
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The member being transferred
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// The location the member is transferring from
    /// </summary>
    public int FromLocationId { get; set; }

    /// <summary>
    /// The location the member is transferring to
    /// </summary>
    public int ToLocationId { get; set; }

    /// <summary>
    /// Reason for the transfer request
    /// </summary>
    public string TransferReason { get; set; } = string.Empty;

    /// <summary>
    /// When the transfer was requested
    /// </summary>
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// When the transfer was approved (null if not yet approved)
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// User ID of who approved the transfer
    /// </summary>
    public int? ApprovedBy { get; set; }

    /// <summary>
    /// Additional notes from the approver
    /// </summary>
    public string? ApprovalNotes { get; set; }

    /// <summary>
    /// Current status of the transfer
    /// </summary>
    public MemberTransferStatus Status { get; set; }

    /// <summary>
    /// User ID of who requested the transfer
    /// </summary>
    public int RequestedBy { get; set; }

    /// <summary>
    /// Navigation property to the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// Navigation property to the from location
    /// </summary>
    public virtual ClubLocation FromLocation { get; set; } = null!;

    /// <summary>
    /// Navigation property to the to location
    /// </summary>
    public virtual ClubLocation ToLocation { get; set; } = null!;

    /// <summary>
    /// Navigation property to the user who approved
    /// </summary>
    public virtual User? ApprovedByUser { get; set; }

    /// <summary>
    /// Navigation property to the user who requested
    /// </summary>
    public virtual User RequestedByUser { get; set; } = null!;
}

