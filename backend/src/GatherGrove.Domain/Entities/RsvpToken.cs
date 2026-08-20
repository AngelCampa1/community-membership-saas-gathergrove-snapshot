namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a secure token that allows members to RSVP via email links without logging in
/// </summary>
public class RsvpToken
{
    /// <summary>
    /// Unique identifier for the RSVP token record
    /// </summary>
    public int RsvpTokenId { get; set; }

    /// <summary>
    /// The cryptographically secure token value
    /// </summary>
    public string TokenValue { get; set; } = string.Empty;

    /// <summary>
    /// The member this token is for
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// The event this token is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The intended RSVP status when this token is used (e.g., "Attending", "NotAttending")
    /// </summary>
    public string IntendedRsvpStatus { get; set; } = string.Empty;

    /// <summary>
    /// When this token expires (typically set to event start time)
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Whether this token has been used (single-use tokens)
    /// </summary>
    public bool IsUsed { get; set; } = false;

    /// <summary>
    /// When this token was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navigation property for the member this token belongs to
    /// </summary>
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// Navigation property for the event this token is for
    /// </summary>
    public virtual Event Event { get; set; } = null!;
}