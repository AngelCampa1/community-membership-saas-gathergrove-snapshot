namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response after successful event payment
/// </summary>
public class EventPaymentResponse
{
    /// <summary>
    /// Whether the payment was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Stripe payment intent ID
    /// </summary>
    public string PaymentId { get; set; } = string.Empty;

    /// <summary>
    /// The created RSVP ID
    /// </summary>
    public int RsvpId { get; set; }

    /// <summary>
    /// Unique confirmation number for the registration
    /// </summary>
    public string ConfirmationNumber { get; set; } = string.Empty;

    /// <summary>
    /// Amount paid for the event
    /// </summary>
    public decimal AmountPaid { get; set; }

    /// <summary>
    /// Name of the event
    /// </summary>
    public string EventName { get; set; } = string.Empty;

    /// <summary>
    /// Date and time of the event
    /// </summary>
    public DateTime EventDateTime { get; set; }

    /// <summary>
    /// Location of the event
    /// </summary>
    public string EventLocation { get; set; } = string.Empty;

    /// <summary>
    /// Club name
    /// </summary>
    public string ClubName { get; set; } = string.Empty;
}

