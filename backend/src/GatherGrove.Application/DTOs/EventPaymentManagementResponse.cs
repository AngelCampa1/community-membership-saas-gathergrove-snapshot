namespace GatherGrove.Application.DTOs;

/// <summary>
/// Complete payment overview for an event
/// </summary>
public class EventPaymentOverviewResponse
{
    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Event name
    /// </summary>
    public string EventName { get; set; } = string.Empty;

    /// <summary>
    /// Total revenue collected (sum of completed payments, excluding refunded)
    /// </summary>
    public decimal TotalRevenue { get; set; }

    /// <summary>
    /// Total number of attendees (all RSVPs with completed or pending payments)
    /// </summary>
    public int TotalAttendees { get; set; }

    /// <summary>
    /// Payment summary statistics
    /// </summary>
    public PaymentSummaryStats PaymentSummary { get; set; } = new();

    /// <summary>
    /// List of all attendees with payment information
    /// </summary>
    public List<EventAttendeePaymentInfo> Attendees { get; set; } = new();
}

/// <summary>
/// Payment statistics summary
/// </summary>
public class PaymentSummaryStats
{
    /// <summary>
    /// Number of completed payments
    /// </summary>
    public int Completed { get; set; }

    /// <summary>
    /// Number of pending payments
    /// </summary>
    public int Pending { get; set; }

    /// <summary>
    /// Number of failed payments
    /// </summary>
    public int Failed { get; set; }

    /// <summary>
    /// Number of refunded payments
    /// </summary>
    public int Refunded { get; set; }

    /// <summary>
    /// Number of manual payments (cash, check, etc.)
    /// </summary>
    public int ManualPayments { get; set; }
}

/// <summary>
/// Detailed payment information for an event attendee
/// </summary>
public class EventAttendeePaymentInfo
{
    /// <summary>
    /// RSVP ID
    /// </summary>
    public int RsvpId { get; set; }

    /// <summary>
    /// Member ID (null for guest registrations)
    /// </summary>
    public int? MemberId { get; set; }

    /// <summary>
    /// Attendee name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Attendee email
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member status (member, non-member, guest)
    /// </summary>
    public string MemberStatus { get; set; } = string.Empty;

    /// <summary>
    /// Payment status
    /// </summary>
    public string PaymentStatus { get; set; } = string.Empty;

    /// <summary>
    /// Amount paid
    /// </summary>
    public decimal? AmountPaid { get; set; }

    /// <summary>
    /// Payment date
    /// </summary>
    public DateTime? PaymentDate { get; set; }

    /// <summary>
    /// Payment method (stripe, cash, check, venmo, etc.)
    /// </summary>
    public string? PaymentMethod { get; set; }

    /// <summary>
    /// Whether this payment can be refunded (has Stripe payment intent)
    /// </summary>
    public bool CanRefund { get; set; }

    /// <summary>
    /// Stripe payment intent ID (if paid via Stripe)
    /// </summary>
    public string? StripePaymentIntentId { get; set; }
}

/// <summary>
/// Response after issuing a refund for an event payment
/// </summary>
public class EventRefundResponse
{
    /// <summary>
    /// Whether the refund was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Stripe refund ID
    /// </summary>
    public string RefundId { get; set; } = string.Empty;

    /// <summary>
    /// Result message
    /// </summary>
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Response after recording a manual payment
/// </summary>
public class ManualPaymentResponse
{
    /// <summary>
    /// Whether the payment recording was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// RSVP ID created or updated
    /// </summary>
    public int RsvpId { get; set; }

    /// <summary>
    /// Result message
    /// </summary>
    public string Message { get; set; } = string.Empty;
}

