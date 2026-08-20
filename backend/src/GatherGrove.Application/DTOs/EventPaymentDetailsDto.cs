using System;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Detailed information about a single event payment
/// </summary>
public class EventPaymentDetailsDto
{
    /// <summary>
    /// The RSVP ID
    /// </summary>
    public int RsvpId { get; set; }

    /// <summary>
    /// The event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The event name
    /// </summary>
    public string EventName { get; set; } = string.Empty;

    /// <summary>
    /// The event date and time
    /// </summary>
    public DateTime EventDateTime { get; set; }

    /// <summary>
    /// The member ID (null for guest registrations)
    /// </summary>
    public int? MemberId { get; set; }

    /// <summary>
    /// The member name (or guest name)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The member email (or guest email)
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Whether this is a guest registration
    /// </summary>
    public bool IsGuestRegistration { get; set; }

    /// <summary>
    /// The payment status
    /// </summary>
    public string PaymentStatus { get; set; } = string.Empty;

    /// <summary>
    /// The amount paid
    /// </summary>
    public decimal? AmountPaid { get; set; }

    /// <summary>
    /// The payment date/time
    /// </summary>
    public DateTime? PaymentDate { get; set; }

    /// <summary>
    /// The payment method (stripe/cash/etc.)
    /// </summary>
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// The Stripe payment intent ID (if applicable)
    /// </summary>
    public string? StripePaymentIntentId { get; set; }

    /// <summary>
    /// Whether the payment can be refunded
    /// </summary>
    public bool CanRefund { get; set; }

    /// <summary>
    /// The club ID
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// The club name
    /// </summary>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// The creation date/time
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The last updated date/time
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
