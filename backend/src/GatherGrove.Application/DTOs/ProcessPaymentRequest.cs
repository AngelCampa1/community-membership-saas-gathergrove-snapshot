using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for processing a payment with Stripe
/// </summary>
public class ProcessPaymentRequest
{
    /// <summary>
    /// The Stripe payment method ID from Stripe Elements
    /// </summary>
    [Required(ErrorMessage = "Payment method is required")]
    public string PaymentMethodId { get; set; } = string.Empty;
}