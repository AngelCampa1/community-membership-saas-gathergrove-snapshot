using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Request to transfer a member to another location
/// </summary>
public class CreateMemberTransferRequest
{
    /// <summary>
    /// Target location ID to transfer to
    /// </summary>
    [Required]
    public int ToLocationId { get; set; }

    /// <summary>
    /// Reason for the transfer request
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string TransferReason { get; set; } = string.Empty;
}

