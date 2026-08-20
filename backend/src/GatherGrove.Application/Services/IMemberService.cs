using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for member operations
/// </summary>
public interface IMemberService
{
    /// <summary>
    /// Creates a new member for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The member creation request</param>
    /// <returns>The created member</returns>
    Task<MemberResponse> CreateMemberAsync(int clubId, CreateMemberRequest request);

    /// <summary>
    /// Gets all members for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>List of members</returns>
    Task<List<MemberResponse>> GetMembersByClubAsync(int clubId);

    /// <summary>
    /// Gets paginated and searchable members for a club (Story 14)
    /// </summary>
    Task<PaginatedMembersResponse> GetPaginatedMembersAsync(int clubId, string? search = null, int page = 1, int pageSize = 25);

    /// <summary>
    /// Gets a specific member by ID
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>The member if found</returns>
    Task<MemberResponse?> GetMemberByIdAsync(int clubId, int memberId);

    /// <summary>
    /// Gets a specific member by email address
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="email">The email address of the member</param>
    /// <returns>The member if found</returns>
    Task<MemberResponse?> GetMemberByEmailAsync(int clubId, string email);

    /// <summary>
    /// Gets paginated member directory for a club (Story 30)
    /// Returns only opted-in members with their chosen visible fields
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="requestingUserId">The ID of the user making the request</param>
    /// <param name="search">Optional search term to filter members by name</param>
    /// <param name="page">Page number (1-based, defaults to 1)</param>
    /// <param name="pageSize">Number of items per page (defaults to 25, max 100)</param>
    /// <returns>Paginated list of directory members</returns>
    Task<PaginatedDirectoryMembersResponse> GetMemberDirectoryAsync(int clubId, int requestingUserId, string? search = null, int page = 1, int pageSize = 25);

    /// <summary>
    /// Updates an existing member's information
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member to update</param>
    /// <param name="request">The member update request</param>
    /// <returns>The updated member</returns>
    Task<MemberResponse> UpdateMemberAsync(int clubId, int memberId, UpdateMemberRequest request);

    /// <summary>
    /// Updates a member's status (Story 16: Archive a Member)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="status">The new status (Active, Archived, etc.)</param>
    /// <returns>The updated member</returns>
    Task<MemberResponse> UpdateMemberStatusAsync(int clubId, int memberId, string status);

    /// <summary>
    /// Records a manual dues payment for a member (Story 17)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="request">The payment details</param>
    /// <returns>The recorded payment</returns>
    Task<PaymentResponse> RecordPaymentAsync(int clubId, int memberId, RecordPaymentRequest request);

    /// <summary>
    /// Allows a member to pay their own dues online (Mobile Story M08)
    /// </summary>
    /// <param name="userId">The ID of the authenticated user/member</param>
    /// <param name="request">The payment details (paymentMethodId and membershipTypeId)</param>
    /// <returns>The processed payment</returns>
    Task<PaymentResponse> PayMemberDuesAsync(int userId, PayMyDuesRequest request);

    /// <summary>
    /// Gets the authenticated user's member profile
    /// </summary>
    /// <param name="userId">The ID of the authenticated user</param>
    /// <returns>The member profile</returns>
    Task<MemberProfileResponse> GetMemberProfileAsync(int userId);

    /// <summary>
    /// Updates the authenticated user's member profile
    /// </summary>
    /// <param name="userId">The ID of the authenticated user</param>
    /// <param name="request">The profile update request</param>
    /// <returns>The updated member profile</returns>
    Task<MemberProfileResponse> UpdateMemberProfileAsync(int userId, UpdateMemberProfileRequest request);

    /// <summary>
    /// Gets all payments for a specific member
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>List of payments for the member</returns>
    Task<List<PaymentResponse>> GetMemberPaymentsAsync(int clubId, int memberId);

    /// <summary>
    /// Gets a specific payment by ID
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="paymentId">The ID of the payment</param>
    /// <returns>The payment if found</returns>
    Task<PaymentResponse?> GetPaymentByIdAsync(int clubId, int memberId, int paymentId);

    /// <summary>
    /// Updates a manual payment (Cash or Check only)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="paymentId">The ID of the payment</param>
    /// <param name="request">The updated payment details</param>
    /// <returns>The updated payment</returns>
    Task<PaymentResponse> UpdatePaymentAsync(int clubId, int memberId, int paymentId, UpdatePaymentRequest request);

    /// <summary>
    /// Deletes a manual payment (Cash or Check only)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="paymentId">The ID of the payment</param>
    /// <returns>Task representing the delete operation</returns>
    Task DeletePaymentAsync(int clubId, int memberId, int paymentId);

    /// <summary>
    /// Gets all members with their statuses for diagnostic purposes
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>List of all members with status information</returns>
    Task<object> GetAllMembersWithStatusesAsync(int clubId);

    /// <summary>
    /// Gets the Stripe payment configuration status for the authenticated user's club
    /// </summary>
    /// <param name="userId">The ID of the authenticated user</param>
    /// <returns>The payment configuration status</returns>
    Task<StripeConfigResponse> GetPaymentConfigurationAsync(int userId);
}