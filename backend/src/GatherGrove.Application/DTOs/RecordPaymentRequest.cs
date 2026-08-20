using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for recording a manual dues payment for a member
/// </summary>
public class RecordPaymentRequest
{
    /// <summary>
    /// The amount paid by the member
    /// </summary>
    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, 99999.99, ErrorMessage = "Amount must be between $0.01 and $99,999.99")]
    public decimal Amount { get; set; }

    /// <summary>
    /// The date the payment was made
    /// </summary>
    [Required(ErrorMessage = "Payment date is required")]
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// The method of payment (Cash, Check)
    /// </summary>
    [Required(ErrorMessage = "Payment method is required")]
    [StringLength(50, ErrorMessage = "Payment method must be 50 characters or less")]
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// Optional notes about the payment
    /// </summary>
    [StringLength(500, ErrorMessage = "Notes must be 500 characters or less")]
    public string? Notes { get; set; }
}