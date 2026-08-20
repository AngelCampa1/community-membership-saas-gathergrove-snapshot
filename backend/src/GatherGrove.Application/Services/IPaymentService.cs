using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling online payment operations for member dues
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Creates a secure payment request for a member and sends an email with the payment link
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="request">The payment request details</param>
    /// <returns>Task that completes when email is sent</returns>
    Task RequestPaymentAsync(int clubId, int memberId, RequestPaymentRequest request);

    /// <summary>
    /// Gets payment page details for a secure token
    /// </summary>
    /// <param name="token">The secure payment token</param>
    /// <returns>Payment page details</returns>
    Task<PaymentPageResponse> GetPaymentPageAsync(string token);

    /// <summary>
    /// Processes a payment using Stripe and records it in the database
    /// </summary>
    /// <param name="token">The secure payment token</param>
    /// <param name="request">The payment processing request</param>
    /// <returns>Task that completes when payment is processed</returns>
    Task ProcessPaymentAsync(string token, GatherGrove.Application.DTOs.ProcessPaymentRequest request);

    /// <summary>
    /// Gets all payments for a club within a specific year
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="year">The year to filter payments (optional, defaults to current year)</param>
    /// <returns>List of payments for the club</returns>
    Task<List<ClubPaymentResponse>> GetClubPaymentsAsync(int clubId, int? year = null);
}