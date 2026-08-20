namespace GatherGrove.Infrastructure.Services;

/// <summary>
/// Service interface for club tier-related operations
/// </summary>
public interface IClubTierService
{
    /// <summary>
    /// Check if a user has Expand tier access for a specific club
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="clubId">Club ID</param>
    /// <returns>True if user has Expand tier access</returns>
    Task<bool> HasUnlimitedTierAccess(int userId, int clubId);

    /// <summary>
    /// Check if user can export financial data
    /// </summary>
    Task<bool> CanExportFinancialData(int userId, int clubId);

    /// <summary>
    /// Check if user can export member data
    /// </summary>
    Task<bool> CanExportMemberData(int userId, int clubId);

    /// <summary>
    /// Get financial export limit for a club
    /// </summary>
    Task<int> GetFinancialExportLimitAsync(int clubId);

    /// <summary>
    /// Get member export limit for a club
    /// </summary>
    Task<int> GetMemberExportLimitAsync(int clubId);

    /// <summary>
    /// Check if user can export event data
    /// </summary>
    Task<bool> CanExportEventData(int userId, int clubId);
}