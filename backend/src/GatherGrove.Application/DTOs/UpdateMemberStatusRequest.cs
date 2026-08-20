using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for updating a member's status
/// </summary>
public class UpdateMemberStatusRequest
{
    /// <summary>
    /// The new status for the member
    /// </summary>
    /// <example>Archived</example>
    [Required]
    [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters.")]
    public string Status { get; set; } = string.Empty;
}