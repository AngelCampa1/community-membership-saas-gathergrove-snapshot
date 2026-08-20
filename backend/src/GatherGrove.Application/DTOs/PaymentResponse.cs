namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response DTO for payment information
/// </summary>
public class PaymentResponse
{
    /// <summary>
    /// Unique identifier for the payment
    /// </summary>
    public int PaymentId { get; set; }

    /// <summary>
    /// The member who made this payment
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// The club this payment belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// The amount paid
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// The date the payment was made
    /// </summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// The method of payment (Cash, Check, Stripe)
    /// </summary>
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// Optional notes about the payment
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// When this payment record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Whether this was a partial payment (less than the full dues amount)
    /// </summary>
    public bool IsPartialPayment { get; set; }

    /// <summary>
    /// The expected full dues amount for this membership type
    /// </summary>
    public decimal? ExpectedDuesAmount { get; set; }

    /// <summary>
    /// The outstanding balance after this payment (null if full payment)
    /// </summary>
    public decimal? OutstandingBalance { get; set; }

    /// <summary>
    /// Message about the payment status (e.g., "Partial payment - $8.52 remaining")
    /// </summary>
    public string? PaymentStatusMessage { get; set; }

    /// <summary>
    /// Whether the payment was successful
    /// </summary>
    public bool IsSuccess { get; set; }

    /// <summary>
    /// Transaction ID from payment processor
    /// </summary>
    public string? TransactionId { get; set; }
}