namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for event payment refund operations
/// </summary>
public class EventPaymentRefundResponse
{
    /// <summary>
    /// Whether the refund was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// The refund ID from the payment processor
    /// </summary>
    public string RefundId { get; set; } = string.Empty;

    /// <summary>
    /// The amount refunded
    /// </summary>
    public decimal RefundAmount { get; set; }

    /// <summary>
    /// The currency of the refund
    /// </summary>
    public string Currency { get; set; } = "USD";

    /// <summary>
    /// The refund status
    /// </summary>
    public string RefundStatus { get; set; } = string.Empty;

    /// <summary>
    /// The reason for the refund
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// The date and time of the refund
    /// </summary>
    public DateTime RefundDate { get; set; }

    /// <summary>
    /// Any error message if the refund failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// The original payment ID that was refunded
    /// </summary>
    public string OriginalPaymentId { get; set; } = string.Empty;
}
