namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for validating an admin invitation token
/// </summary>
public class InviteValidationResponse
{
    /// <summary>
    /// Whether the invitation token is valid and not expired
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// The email address associated with the invitation
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// The name of the club the user is being invited to
    /// </summary>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// Whether the email is associated with an existing GatherGrove account
    /// </summary>
    public bool HasExistingAccount { get; set; }

    /// <summary>
    /// When the invitation expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Name of the person who sent the invitation
    /// </summary>
    public string InvitedByName { get; set; } = string.Empty;

    /// <summary>
    /// Error message if the invitation is invalid
    /// </summary>
    public string? ErrorMessage { get; set; }
}