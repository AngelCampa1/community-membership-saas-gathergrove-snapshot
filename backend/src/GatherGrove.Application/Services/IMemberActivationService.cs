using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling member account activation process
/// </summary>
public interface IMemberActivationService
{
    /// <summary>
    /// Creates a dormant User account for a new Member without sending activation email
    /// This is called when an admin adds a new member to a "Sprout" tier club
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="clubId">The club ID</param>
    /// <returns>Whether the dormant account was created successfully</returns>
    Task<bool> CreateDormantMemberAccountAsync(int memberId, int clubId);

    /// <summary>
    /// Creates a User account for a new Member and sends activation email
    /// This is called when an admin adds a new member to a "Grow" tier club
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="clubId">The club ID</param>
    /// <returns>Whether the activation email was sent successfully</returns>
    Task<bool> CreateMemberAccountAndSendActivationEmailAsync(int memberId, int clubId);

    /// <summary>
    /// Activates a member account using the activation token and sets their password
    /// </summary>
    /// <param name="request">The activation request with token and new password</param>
    /// <returns>The activation response</returns>
    Task<ActivateMemberAccountResponse> ActivateMemberAccountAsync(ActivateMemberAccountRequest request);

    /// <summary>
    /// Generates a secure activation token and expiry date
    /// </summary>
    /// <returns>A tuple containing the token and expiry date</returns>
    (string token, DateTime expiresAt) GenerateActivationToken();

    /// <summary>
    /// Resends activation email to a member with a new activation token
    /// </summary>
    /// <param name="email">The email address of the member</param>
    /// <returns>The resend activation response</returns>
    Task<ResendActivationResponse> ResendActivationEmailAsync(string email);
}