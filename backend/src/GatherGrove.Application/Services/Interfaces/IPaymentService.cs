using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service for handling payment operations
/// </summary>
public interface IPaymentService
{
    Task<PaymentResult> ProcessPaymentAsync(ProcessPaymentRequest request);
    Task<RefundResult> ProcessRefundAsync(ProcessRefundRequest request);
    Task<PaymentStatus> GetPaymentStatusAsync(string paymentId);
}

public class ProcessPaymentRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string PaymentMethodId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string PaymentId { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}

public class ProcessRefundRequest
{
    public string PaymentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class RefundResult
{
    public bool Success { get; set; }
    public string RefundId { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}