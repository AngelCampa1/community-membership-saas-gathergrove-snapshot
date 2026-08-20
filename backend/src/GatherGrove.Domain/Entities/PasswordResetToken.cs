namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a password reset token for secure password recovery
/// </summary>
public class PasswordResetToken
{
    /// <summary>
    /// Unique identifier for the password reset token
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The user this reset token belongs to
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Secure, hashed token for password reset
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>
    /// When this token expires (1 hour from creation)
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Whether this token has been used and is no longer valid
    /// </summary>
    public bool IsUsed { get; set; } = false;

    /// <summary>
    /// When this token was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navigation property to the user
    /// </summary>
    public virtual User User { get; set; } = null!;
}