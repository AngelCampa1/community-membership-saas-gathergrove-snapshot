using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an RSVP response from a member for a specific event
/// </summary>
public class EventRsvp
{
    /// <summary>
    /// Unique identifier for the RSVP record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this RSVP is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member who made this RSVP
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// The RSVP status (e.g., "Attending", "NotAttending", "Invited")
    /// </summary>
    public string RsvpStatus { get; set; } = string.Empty;

    /// <summary>
    /// When this RSVP was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this RSVP was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Optional notes about the RSVP
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// RSVP status using enum
    /// </summary>
    public Domain.Enums.RsvpStatus Status { get; set; } = Domain.Enums.RsvpStatus.Pending;

    /// <summary>
    /// Payment status for paid events
    /// </summary>
    public Domain.Enums.PaymentStatus PaymentStatus { get; set; } = Domain.Enums.PaymentStatus.Pending;

    /// <summary>
    /// Amount paid for this registration
    /// </summary>
    public decimal? PaidAmount { get; set; }

    /// <summary>
    /// Stripe payment intent ID for payment tracking
    /// </summary>
    public string? StripePaymentIntentId { get; set; }

    /// <summary>
    /// Guest name for non-member registrations (when no Member record exists yet)
    /// </summary>
    public string? GuestName { get; set; }

    /// <summary>
    /// Guest email for non-member registrations
    /// </summary>
    public string? GuestEmail { get; set; }

    /// <summary>
    /// Guest phone for non-member registrations
    /// </summary>
    public string? GuestPhone { get; set; }

    /// <summary>
    /// Whether this registration was made as a guest (before account creation)
    /// </summary>
    public bool IsGuestRegistration { get; set; } = false;

    /// <summary>
    /// If membership was purchased with event, the membership type ID
    /// </summary>
    public int? MembershipUpgradeTypeId { get; set; }

    /// <summary>
    /// Navigation property for the event this RSVP belongs to
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member who made this RSVP
    /// </summary>
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// Navigation property for membership upgrade
    /// </summary>
    public virtual MembershipType? MembershipUpgradeType { get; set; }
}