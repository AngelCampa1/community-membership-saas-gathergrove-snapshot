namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for accepting a club administrator invitation
/// </summary>
public class AcceptAdminInviteResponse
{
    /// <summary>
    /// The user information (new or existing)
    /// </summary>
    public UserInfoDto User { get; set; } = null!;

    /// <summary>
    /// The club information that the user is now an admin of
    /// </summary>
    public ClubInfoDto Club { get; set; } = null!;

    /// <summary>
    /// Whether this was a new user account created during acceptance
    /// </summary>
    public bool IsNewUser { get; set; }

    /// <summary>
    /// Success message to display to the user
    /// </summary>
    public string Message { get; set; } = string.Empty;
}