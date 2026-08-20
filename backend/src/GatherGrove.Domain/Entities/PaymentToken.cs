namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a secure token for member payment requests
/// </summary>
public class PaymentToken
{
    /// <summary>
    /// Unique identifier for the payment token
    /// </summary>
    public int PaymentTokenId { get; set; }

    /// <summary>
    /// Secure token string used in payment URLs
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// The member who this payment request is for
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// The club this payment belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// The amount being requested
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Description of what the payment is for
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// When this token expires (24 hours from creation)
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Whether this token has been used for a successful payment
    /// </summary>
    public bool IsUsed { get; set; }

    /// <summary>
    /// When this token was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;
}