using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for a member to pay their own dues (Mobile Story M08)
/// </summary>
public class PayMyDuesRequest
{
    /// <summary>
    /// The Stripe payment method ID from Stripe SDK tokenization
    /// </summary>
    [Required(ErrorMessage = "Payment method ID is required")]
    public string PaymentMethodId { get; set; } = string.Empty;

    /// <summary>
    /// The membership type ID for validation and amount calculation
    /// </summary>
    [Required(ErrorMessage = "Membership type ID is required")]
    public int MembershipTypeId { get; set; }
}