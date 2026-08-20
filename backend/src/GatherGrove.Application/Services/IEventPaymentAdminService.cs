using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for admin management of event payments
/// </summary>
public interface IEventPaymentAdminService
{
    /// <summary>
    /// Get payment overview for an event including revenue, attendee list, and payment statistics
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="eventId">Event ID</param>
    /// <returns>Complete payment overview</returns>
    Task<EventPaymentOverviewResponse> GetEventPaymentOverviewAsync(int clubId, int eventId);

    /// <summary>
    /// Issue a refund for an event payment via Stripe
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="request">Refund request details</param>
    /// <returns>Refund result</returns>
    Task<EventRefundResponse> IssueRefundAsync(int clubId, IssueRefundRequest request);

    /// <summary>
    /// Record a manual payment (cash, check, etc.) for an event
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="request">Manual payment details</param>
    /// <returns>Payment recording result</returns>
    Task<ManualPaymentResponse> RecordManualPaymentAsync(int clubId, RecordManualPaymentRequest request);

    /// <summary>
    /// Export payment data for an event as CSV
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="request">Export request with event ID and format</param>
    /// <returns>CSV file as byte array</returns>
    Task<byte[]> ExportPaymentDataAsync(int clubId, ExportPaymentDataRequest request);
}

