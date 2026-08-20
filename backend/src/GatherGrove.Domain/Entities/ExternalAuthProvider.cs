namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an external OAuth provider (Google, Apple) linked to a user account
/// </summary>
public class ExternalAuthProvider
{
    /// <summary>
    /// Unique identifier for the external auth provider link
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The user this external provider is linked to
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// The OAuth provider name (e.g., "Google", "Apple")
    /// </summary>
    public string Provider { get; set; } = string.Empty;

    /// <summary>
    /// The unique user identifier from the OAuth provider (subject claim from ID token)
    /// </summary>
    public string ProviderUserId { get; set; } = string.Empty;

    /// <summary>
    /// The email address from the OAuth provider (may differ from User.Email for Apple private relay)
    /// </summary>
    public string? ProviderEmail { get; set; }

    /// <summary>
    /// Whether the email was verified by the provider at the time of linking
    /// </summary>
    public bool EmailVerifiedAtLinking { get; set; }

    /// <summary>
    /// When this external provider was linked to the account
    /// </summary>
    public DateTime LinkedAt { get; set; }

    /// <summary>
    /// When this external provider was last used for authentication
    /// </summary>
    public DateTime LastUsedAt { get; set; }

    /// <summary>
    /// Navigation property to the user
    /// </summary>
    public virtual User User { get; set; } = null!;
}
