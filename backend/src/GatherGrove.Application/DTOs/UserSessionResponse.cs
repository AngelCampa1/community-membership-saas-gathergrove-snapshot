namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for current user session data
/// </summary>
public class UserSessionResponse
{
    /// <summary>
    /// The unique identifier of the authenticated user
    /// </summary>
    /// <example>123</example>
    public int UserId { get; set; }

    /// <summary>
    /// The full name of the authenticated user
    /// </summary>
    /// <example>Brenda Smith</example>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// The email address of the authenticated user
    /// </summary>
    /// <example>brenda@gardeners.com</example>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// The unique identifier of the user's club
    /// </summary>
    /// <example>456</example>
    public int ClubId { get; set; }

    /// <summary>
    /// The name of the user's club
    /// </summary>
    /// <example>Local Gardeners United</example>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// The subscription tier of the user's club (e.g., "Sprout", "Grow")
    /// </summary>
    /// <example>Sprout</example>
    public string ClubTier { get; set; } = string.Empty;

    /// <summary>
    /// The role of the user (Admin or Member)
    /// </summary>
    /// <example>Admin</example>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Whether the user has completed the onboarding process
    /// </summary>
    /// <example>true</example>
    public bool IsOnboardingCompleted { get; set; }

    /// <summary>
    /// The unique identifier of the member record (only for Member role users)
    /// </summary>
    /// <example>789</example>
    public int? MemberId { get; set; }
}