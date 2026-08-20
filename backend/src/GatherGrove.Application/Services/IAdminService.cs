using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for managing club administrators and invitations
/// </summary>
public interface IAdminService
{
    /// <summary>
    /// Gets all administrators for a specific club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="currentUserId">The current user ID (to mark current user)</param>
    /// <returns>List of club administrators</returns>
    Task<IEnumerable<ClubAdminResponse>> GetClubAdminsAsync(int clubId, int currentUserId);

    /// <summary>
    /// Creates a new administrator invitation for a club (Grow tier only)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="invitedByUserId">The user ID of the person sending the invitation</param>
    /// <param name="request">The invitation request details</param>
    /// <returns>The created invitation details</returns>
    Task<AdminInviteResponse> CreateAdminInviteAsync(int clubId, int invitedByUserId, CreateAdminInviteRequest request);

    /// <summary>
    /// Gets all pending invitations for a specific club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of pending invitations</returns>
    Task<IEnumerable<AdminInviteResponse>> GetPendingInvitesAsync(int clubId);

    /// <summary>
    /// Cancels a pending invitation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="inviteId">The invitation ID to cancel</param>
    /// <param name="currentUserId">The current user ID (must be primary admin)</param>
    /// <returns>Success status</returns>
    Task<bool> CancelInviteAsync(int clubId, int inviteId, int currentUserId);

    /// <summary>
    /// Removes an administrator from a club (Grow tier only)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userIdToRemove">The user ID to remove as admin</param>
    /// <param name="currentUserId">The current user ID (must be primary admin)</param>
    /// <returns>Success status</returns>
    Task<bool> RemoveAdminAsync(int clubId, int userIdToRemove, int currentUserId);

    /// <summary>
    /// Handles tier downgrade by cancelling all pending invitations
    /// </summary>
    Task HandleTierDowngradeAsync(int clubId);
}