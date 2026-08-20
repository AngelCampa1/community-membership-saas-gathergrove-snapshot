using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to pay for an event (member self-service payment)
/// </summary>
public class PayEventRequest
{
    /// <summary>
    /// The event to pay for
    /// </summary>
    [Required]
    public int EventId { get; set; }

    /// <summary>
    /// Stripe payment method ID from createPaymentMethod
    /// </summary>
    [Required]
    public string PaymentMethodId { get; set; } = string.Empty;
}

