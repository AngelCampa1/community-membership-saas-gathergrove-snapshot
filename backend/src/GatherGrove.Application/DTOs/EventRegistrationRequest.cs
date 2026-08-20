namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for event registration
/// </summary>
public class EventRegistrationRequest
{
    /// <summary>
    /// Event ID to register for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Member ID registering for the event
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Optional notes for the registration
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Number of attendees (for group registrations)
    /// </summary>
    public int AttendeeCount { get; set; } = 1;

    /// <summary>
    /// Promo code if applicable
    /// </summary>
    public string? PromoCode { get; set; }

    /// <summary>
    /// Email of the attendee
    /// </summary>
    public string? AttendeeEmail { get; set; }
}

/// <summary>
/// Extended registration request for paid events
/// </summary>
public class PaidEventRegistrationRequest : EventRegistrationRequest
{
    /// <summary>
    /// Payment method ID from Stripe
    /// </summary>
    public string? PaymentMethodId { get; set; }

    /// <summary>
    /// Expected payment amount
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Currency for payment (default USD)
    /// </summary>
    public string Currency { get; set; } = "USD";
}

/// <summary>
/// Event registration request for new services (namespace compatibility)
/// </summary>
public class EventRegistrationRequestNew : EventRegistrationRequest
{
    /// <summary>
    /// Additional fields for new service requirements
    /// </summary>
    public DateTime? PreferredEventTime { get; set; }

    /// <summary>
    /// Special requirements or dietary restrictions
    /// </summary>
    public string? SpecialRequirements { get; set; }
}