namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a user in the GatherGrove system
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier for the user
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// User's email address (unique)
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Hashed password
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Whether the user account is active and can be used for login
    /// </summary>
    public bool IsActive { get; set; } = false;

    /// <summary>
    /// Secure token for account activation (nullable after activation)
    /// </summary>
    public string? ActivationToken { get; set; }

    /// <summary>
    /// When the activation token expires (nullable after activation)
    /// </summary>
    public DateTime? ActivationTokenExpiresAt { get; set; }

    /// <summary>
    /// Whether the user has completed the initial setup wizard
    /// </summary>
    public bool OnboardingCompleted { get; set; } = false;

    /// <summary>
    /// When the user account was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the user account was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for clubs this user administers
    /// </summary>
    public virtual ICollection<ClubAdmin> ClubAdmins { get; set; } = new List<ClubAdmin>();

    /// <summary>
    /// Navigation property for external OAuth providers linked to this user
    /// </summary>
    public virtual ICollection<ExternalAuthProvider> ExternalAuthProviders { get; set; } = new List<ExternalAuthProvider>();

    /// <summary>
    /// Whether the user has a password set (false for SSO-only accounts)
    /// </summary>
    public bool HasPasswordSet => !string.IsNullOrEmpty(PasswordHash);
}