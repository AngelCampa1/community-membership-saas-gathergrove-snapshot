namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for club administrator invitation operations
/// </summary>
public class AdminInviteResponse
{
    /// <summary>
    /// Unique identifier for the invitation
    /// </summary>
    public int InviteId { get; set; }

    /// <summary>
    /// Email address of the invited person
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Current status of the invitation (Pending, Accepted, Expired, Cancelled)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// When the invitation was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the invitation expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Full name of the user who sent the invitation
    /// </summary>
    public string InvitedByName { get; set; } = string.Empty;
}