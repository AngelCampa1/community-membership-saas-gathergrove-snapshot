using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a member's position on an event waitlist
/// </summary>
public class EventWaitlist
{
    /// <summary>
    /// Unique identifier for the waitlist entry
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this waitlist entry is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member on the waitlist
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Position in the waitlist (1 = first in line)
    /// </summary>
    public int Position { get; set; }

    /// <summary>
    /// Priority level for this waitlist entry
    /// </summary>
    public WaitlistPriority Priority { get; set; } = WaitlistPriority.Normal;

    /// <summary>
    /// Optional notes about the waitlist entry
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// When this waitlist entry was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this waitlist entry was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Whether the member was notified of their position
    /// </summary>
    public bool NotificationSent { get; set; } = false;

    /// <summary>
    /// Navigation property for the event
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;
}

/// <summary>
/// Priority levels for waitlist entries
/// </summary>
public enum WaitlistPriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    VIP = 4
}