namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for non-member event payment with optional membership upgrade and account creation
/// </summary>
public class NonMemberEventPaymentRequest
{
    /// <summary>
    /// ID of the event to pay for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Stripe payment method ID
    /// </summary>
    public string PaymentMethodId { get; set; } = string.Empty;

    /// <summary>
    /// Guest's full name
    /// </summary>
    public string GuestName { get; set; } = string.Empty;

    /// <summary>
    /// Guest's email address
    /// </summary>
    public string GuestEmail { get; set; } = string.Empty;

    /// <summary>
    /// Guest's phone number (optional)
    /// </summary>
    public string? GuestPhone { get; set; }

    /// <summary>
    /// Optional membership type ID to purchase with event registration
    /// </summary>
    public int? MembershipTypeId { get; set; }

    /// <summary>
    /// Whether to create a user account for the guest
    /// </summary>
    public bool CreateAccount { get; set; }

    /// <summary>
    /// Password for account creation (required if CreateAccount is true)
    /// </summary>
    public string? Password { get; set; }
}


