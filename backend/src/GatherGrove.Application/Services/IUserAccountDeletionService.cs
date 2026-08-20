using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for user account deletion service
/// </summary>
public interface IUserAccountDeletionService
{
    /// <summary>
    /// Validates whether an account can be deleted
    /// </summary>
    Task<AccountDeletionValidationResponse> ValidateAccountDeletionAsync(int userId);

    /// <summary>
    /// Gets the impact summary of what will be deleted
    /// </summary>
    Task<AccountDeletionImpact> GetAccountDeletionImpactAsync(int userId);

    /// <summary>
    /// Executes the complete account deletion process
    /// </summary>
    Task<AccountDeletionResult> DeleteUserAccountAsync(int userId, AccountDeletionOptions? options = null);

    /// <summary>
    /// Gets potential transfer targets for admin-owned clubs
    /// </summary>
    Task<List<AdminTransferTarget>> GetAdminTransferTargetsAsync(int userId);

    /// <summary>
    /// Transfers club ownership from one user to another
    /// </summary>
    Task<ClubOwnershipTransferResponse> TransferClubOwnershipAsync(int fromUserId, ClubOwnershipTransferRequest request);

    /// <summary>
    /// Validates if a club can be deleted by an admin
    /// </summary>
    Task<ClubDeletionValidationResponse> ValidateClubDeletionAsync(int adminUserId, int clubId);
}