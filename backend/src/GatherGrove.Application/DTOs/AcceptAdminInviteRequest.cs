using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for accepting a club administrator invitation
/// </summary>
public class AcceptAdminInviteRequest
{
    /// <summary>
    /// The unique invitation token from the email link
    /// </summary>
    [Required(ErrorMessage = "Invitation token is required")]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Password for new users (required if the email is not associated with an existing account)
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Full name for new users (required if the email is not associated with an existing account)
    /// </summary>
    public string? FullName { get; set; }
}