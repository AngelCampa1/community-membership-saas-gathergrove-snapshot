using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Request to approve a member transfer
/// </summary>
public class ApproveTransferRequest
{
    /// <summary>
    /// Optional approval notes
    /// </summary>
    [StringLength(1000)]
    public string? ApprovalNotes { get; set; }
}

