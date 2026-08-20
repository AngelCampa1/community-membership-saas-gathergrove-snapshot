using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for creating a new club administrator invitation
/// </summary>
public class CreateAdminInviteRequest
{
    /// <summary>
    /// Email address of the person to invite as an administrator
    /// </summary>
    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [StringLength(255, ErrorMessage = "Email address cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;
}