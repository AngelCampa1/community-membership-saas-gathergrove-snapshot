using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for updating a manual payment
/// </summary>
public class UpdatePaymentRequest
{
    /// <summary>
    /// The updated amount paid by the member
    /// </summary>
    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, 99999.99, ErrorMessage = "Amount must be between $0.01 and $99,999.99")]
    public decimal Amount { get; set; }

    /// <summary>
    /// The updated date the payment was made
    /// </summary>
    [Required(ErrorMessage = "Payment date is required")]
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// The updated method of payment (Cash, Check)
    /// </summary>
    [Required(ErrorMessage = "Payment method is required")]
    [StringLength(50, ErrorMessage = "Payment method must be 50 characters or less")]
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// Updated optional notes about the payment
    /// </summary>
    [StringLength(500, ErrorMessage = "Notes must be 500 characters or less")]
    public string? Notes { get; set; }
}