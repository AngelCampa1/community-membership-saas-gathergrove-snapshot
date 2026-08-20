using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling non-member event payments with optional membership upgrade
/// </summary>
public interface INonMemberEventPaymentService
{
    /// <summary>
    /// Process payment for a non-member guest including optional membership upgrade and account creation
    /// </summary>
    /// <param name="request">Payment request with guest information and options</param>
    /// <returns>Payment confirmation with details</returns>
    Task<NonMemberEventPaymentResponse> ProcessNonMemberEventPaymentAsync(NonMemberEventPaymentRequest request);

    /// <summary>
    /// Get available membership types for a club hosting the event
    /// </summary>
    /// <param name="eventId">Event ID to get membership types for</param>
    /// <returns>List of available membership types</returns>
    Task<List<MembershipTypeResponse>> GetAvailableMembershipTypesForEventAsync(int eventId);
}

