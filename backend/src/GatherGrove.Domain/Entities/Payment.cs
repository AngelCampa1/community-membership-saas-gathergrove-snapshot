using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a dues payment made by a member
/// </summary>
public class Payment
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
    [Range(0.01, 999999.99, ErrorMessage = "Amount must be between 0.01 and 999999.99")]
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
    /// Navigation property for the member who made this payment
    /// </summary>
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// Navigation property for the club this payment belongs to
    /// </summary>
    public virtual Club Club { get; set; } = null!;
}