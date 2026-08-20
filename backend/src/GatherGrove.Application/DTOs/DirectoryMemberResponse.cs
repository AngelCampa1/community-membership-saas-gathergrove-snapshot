namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for member directory entry (Story 30)
/// Only includes fields that the member has chosen to share and admin allows
/// </summary>
public class DirectoryMemberResponse
{
    /// <summary>
    /// Member ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Full name of the member (always visible)
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Email address (only visible if member chose to share and admin allows)
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Phone number (only visible if member chose to share and admin allows)
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Address (only visible if member chose to share and admin allows)
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Membership type name (only visible if member chose to share and admin allows)
    /// </summary>
    public string? MembershipTypeName { get; set; }

    /// <summary>
    /// Join date (only visible if member chose to share and admin allows)
    /// </summary>
    public DateTime? JoinDate { get; set; }
}