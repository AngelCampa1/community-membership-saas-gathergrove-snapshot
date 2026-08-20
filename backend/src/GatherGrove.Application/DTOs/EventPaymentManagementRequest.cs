namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to issue a refund for an event payment
/// </summary>
public class IssueRefundRequest
{
    /// <summary>
    /// The event ID this refund is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The RSVP ID to refund
    /// </summary>
    public int RsvpId { get; set; }

    /// <summary>
    /// Amount to refund (must be <= original payment amount)
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Reason for the refund
    /// </summary>
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Request to record a manual payment for an event (cash, check, etc.)
/// </summary>
public class RecordManualPaymentRequest
{
    /// <summary>
    /// The event ID this payment is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member ID making the payment
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Amount paid
    /// </summary>
    public decimal AmountPaid { get; set; }

    /// <summary>
    /// Payment method (cash, check, venmo, zelle, other)
    /// </summary>
    public string PaymentMethod { get; set; } = "cash";

    /// <summary>
    /// Optional notes about the payment
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Request to export payment data for an event
/// </summary>
public class ExportPaymentDataRequest
{
    /// <summary>
    /// The event ID to export data for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Export format (csv, excel)
    /// </summary>
    public string Format { get; set; } = "csv";
}

