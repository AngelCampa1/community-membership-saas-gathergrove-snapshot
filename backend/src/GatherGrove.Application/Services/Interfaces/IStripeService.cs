using GatherGrove.Domain.Enums;
using Stripe;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service for Stripe payment processing integration
/// </summary>
public interface IStripeService
{
    /// <summary>
    /// Creates a payment intent for event registration
    /// </summary>
    Task<PaymentIntent> CreatePaymentIntentAsync(CreateStripePaymentIntentRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Confirms a payment intent
    /// </summary>
    Task<PaymentIntent> ConfirmPaymentIntentAsync(string paymentIntentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Processes a refund for a payment
    /// </summary>
    Task<Refund> ProcessRefundAsync(ProcessStripeRefundRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a customer in Stripe
    /// </summary>
    Task<Customer> CreateCustomerAsync(CreateStripeCustomerRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets payment intent by ID
    /// </summary>
    Task<PaymentIntent> GetPaymentIntentAsync(string paymentIntentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets customer by ID
    /// </summary>
    Task<Customer> GetCustomerAsync(string customerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates a payment intent
    /// </summary>
    Task<PaymentIntent> UpdatePaymentIntentAsync(string paymentIntentId, PaymentIntentUpdateOptions options, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancels a payment intent
    /// </summary>
    Task<PaymentIntent> CancelPaymentIntentAsync(string paymentIntentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a setup intent for future payments
    /// </summary>
    Task<SetupIntent> CreateSetupIntentAsync(CreateStripeSetupIntentRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all payment methods for a customer
    /// </summary>
    Task<StripeList<PaymentMethod>> GetCustomerPaymentMethodsAsync(string customerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a refund for a charge
    /// </summary>
    Task<StripeRefundResult> CreateRefundAsync(string chargeId, decimal amount, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a payment intent (overload for test compatibility)
    /// </summary>
    Task<StripePaymentResult> CreatePaymentIntentAsync(decimal amount, string currency, CancellationToken cancellationToken = default);
}

// Request DTOs for the service methods
public class CreateStripePaymentIntentRequest
{
    public long Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public string? CustomerId { get; set; }
    public string? PaymentMethodId { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
    public string? Description { get; set; }
    public string? ReceiptEmail { get; set; }
    public bool ConfirmationMethod { get; set; } = false;
    public bool CaptureMethod { get; set; } = true;
}

public class ProcessStripeRefundRequest
{
    public string PaymentIntentId { get; set; } = string.Empty;
    public string? ChargeId { get; set; }
    public long? Amount { get; set; } // If null, refunds full amount
    public string? Reason { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
}

public class CreateStripeCustomerRequest
{
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
    public string? Description { get; set; }
    public object? Address { get; set; }
}

public class CreateStripeSetupIntentRequest
{
    public string? CustomerId { get; set; }
    public string? PaymentMethodId { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
    public string? Description { get; set; }
    public List<string> PaymentMethodTypes { get; set; } = new() { "card" };
    public string Usage { get; set; } = "off_session";
}

public class StripeRefundResult
{
    public bool Success { get; set; }
    public string? RefundId { get; set; }
    public string? ErrorMessage { get; set; }
    public decimal Amount { get; set; }
}

public class StripePaymentResult
{
    public bool Success { get; set; }
    public string? PaymentIntentId { get; set; }
    public string? ErrorMessage { get; set; }
    public decimal Amount { get; set; }
}