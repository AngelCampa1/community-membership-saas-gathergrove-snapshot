namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response DTO for club payment information including member details
/// </summary>
public class ClubPaymentResponse
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
    /// The member's full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// The member's email
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// The membership type name
    /// </summary>
    public string MembershipTypeName { get; set; } = string.Empty;

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
}