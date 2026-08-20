namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for club administrator information
/// </summary>
public class ClubAdminResponse
{
    /// <summary>
    /// Unique identifier for the user
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Full name of the administrator
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Email address of the administrator
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Role of the administrator (Primary, Admin)
    /// </summary>
    public string Role { get; set; } = "Admin";

    /// <summary>
    /// When the administrator was added to the club
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Whether this is the current user (for UI purposes)
    /// </summary>
    public bool IsCurrentUser { get; set; }
}