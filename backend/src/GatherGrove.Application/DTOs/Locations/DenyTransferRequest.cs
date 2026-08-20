using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Request to deny a member transfer
/// </summary>
public class DenyTransferRequest
{
    /// <summary>
    /// Reason for denial
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string DenialReason { get; set; } = string.Empty;
}

