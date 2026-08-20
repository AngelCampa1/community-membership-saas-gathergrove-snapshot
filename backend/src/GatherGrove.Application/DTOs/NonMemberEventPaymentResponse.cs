namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response after successful non-member event payment
/// </summary>
public class NonMemberEventPaymentResponse
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
    /// RSVP ID created for this registration
    /// </summary>
    public int RsvpId { get; set; }

    /// <summary>
    /// Unique confirmation number for this registration
    /// </summary>
    public string ConfirmationNumber { get; set; } = string.Empty;

    /// <summary>
    /// Event registration amount paid
    /// </summary>
    public decimal EventAmount { get; set; }

    /// <summary>
    /// Membership amount paid (if membership was purchased)
    /// </summary>
    public decimal? MembershipAmount { get; set; }

    /// <summary>
    /// Total amount paid (event + membership if applicable)
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Whether a membership was created with this payment
    /// </summary>
    public bool MembershipCreated { get; set; }

    /// <summary>
    /// Whether a user account was created
    /// </summary>
    public bool AccountCreated { get; set; }

    /// <summary>
    /// Member ID created (if membership or guest registration)
    /// </summary>
    public int? MemberId { get; set; }

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
    /// Name of the club hosting the event
    /// </summary>
    public string ClubName { get; set; } = string.Empty;
}


