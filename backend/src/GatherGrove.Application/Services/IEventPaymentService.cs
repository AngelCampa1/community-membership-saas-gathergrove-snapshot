using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling event payment operations
/// </summary>
public interface IEventPaymentService
{
    /// <summary>
    /// Processes payment for an event for an authenticated member
    /// </summary>
    /// <param name="userId">The authenticated user ID</param>
    /// <param name="request">Payment request details</param>
    /// <returns>Payment confirmation response</returns>
    Task<EventPaymentResponse> PayForEventAsync(int userId, PayEventRequest request);

    /// <summary>
    /// Get payment details by payment ID
    /// </summary>
    /// <param name="paymentId">Stripe payment ID</param>
    /// <returns>Payment details or null if not found</returns>
    Task<EventPaymentDetailsDto?> GetPaymentDetailsAsync(string paymentId, int clubId);

    /// <summary>
    /// Process a refund for a payment
    /// </summary>
    /// <param name="paymentId">Stripe payment ID</param>
    /// <param name="reason">Refund reason</param>
    /// <returns>Refund response</returns>
    Task<EventPaymentRefundResponse> ProcessRefundAsync(string paymentId, string reason, int clubId);

    /// <summary>
    /// Get payment history for an event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>List of payment records</returns>
    Task<List<EventPaymentDetailsDto>> GetPaymentHistoryAsync(int eventId, int clubId);
}
