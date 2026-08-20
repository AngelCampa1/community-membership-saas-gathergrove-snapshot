using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Response containing member transfer details
/// </summary>
public class MemberTransferResponse
{
    /// <summary>
    /// Transfer ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Member email
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// From location ID
    /// </summary>
    public int FromLocationId { get; set; }

    /// <summary>
    /// From location name
    /// </summary>
    public string FromLocationName { get; set; } = string.Empty;

    /// <summary>
    /// To location ID
    /// </summary>
    public int ToLocationId { get; set; }

    /// <summary>
    /// To location name
    /// </summary>
    public string ToLocationName { get; set; } = string.Empty;

    /// <summary>
    /// Transfer reason
    /// </summary>
    public string TransferReason { get; set; } = string.Empty;

    /// <summary>
    /// Transfer status
    /// </summary>
    public MemberTransferStatus Status { get; set; }

    /// <summary>
    /// Status as string
    /// </summary>
    public string StatusName { get; set; } = string.Empty;

    /// <summary>
    /// When transfer was requested
    /// </summary>
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// User ID who requested
    /// </summary>
    public int RequestedBy { get; set; }

    /// <summary>
    /// Name of who requested
    /// </summary>
    public string RequestedByName { get; set; } = string.Empty;

    /// <summary>
    /// When transfer was approved (if approved)
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// User ID who approved
    /// </summary>
    public int? ApprovedBy { get; set; }

    /// <summary>
    /// Name of who approved
    /// </summary>
    public string? ApprovedByName { get; set; }

    /// <summary>
    /// Approval notes
    /// </summary>
    public string? ApprovalNotes { get; set; }
}

