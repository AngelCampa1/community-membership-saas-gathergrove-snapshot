namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to log a payment error from the frontend
/// PHASE 2 FIX: Added for payment failure tracking and analytics
/// </summary>
public class PaymentErrorLogRequest
{
    /// <summary>
    /// Payment token associated with the error
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Error message or description
    /// </summary>
    public string Error { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when the error occurred (ISO 8601 format)
    /// </summary>
    public string Timestamp { get; set; } = string.Empty;

    /// <summary>
    /// User agent string from the browser
    /// </summary>
    public string UserAgent { get; set; } = string.Empty;
}
