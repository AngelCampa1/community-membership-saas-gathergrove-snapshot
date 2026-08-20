using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for club-related operations including tier access validation
/// </summary>
public class ClubService : IClubService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ClubService> _logger;

    public ClubService(GatherGroveDbContext context, ILogger<ClubService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static bool IsExpandTier(string? tier) =>
        tier?.Equals("Expand", StringComparison.OrdinalIgnoreCase) == true
        || tier?.Equals("Unlimited", StringComparison.OrdinalIgnoreCase) == true;

    /// <summary>
    /// Check if a user has Expand tier access for a specific club
    /// </summary>
    public async Task<bool> HasUnlimitedTierAccess(int userId, int clubId)
    {
        try
        {
            // First check if user is admin of the club
            var isAdmin = await IsClubAdmin(userId, clubId);
            if (!isAdmin)
            {
                _logger.LogInformation("User {UserId} is not admin of club {ClubId}", userId, clubId);
                return false;
            }

            // Check if club has Expand tier subscription
            var clubTier = await GetClubSubscriptionTier(clubId);
            var hasUnlimitedAccess = IsExpandTier(clubTier);

            _logger.LogInformation("Club {ClubId} tier: {Tier}, Expand access: {HasAccess}",
                clubId, clubTier, hasUnlimitedAccess);

            return hasUnlimitedAccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Expand tier access for user {UserId} in club {ClubId}",
                userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Check if a user is an admin for a specific club
    /// </summary>
    public async Task<bool> IsClubAdmin(int userId, int clubId)
    {
        try
        {
            // Query the database to check if user is admin of the club
            // Use the ClubAdmins table to check admin relationship
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);

            return isAdmin;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking admin status for user {UserId} in club {ClubId}",
                userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Check if a user is a member of a specific club
    /// </summary>
    public async Task<bool> IsClubMember(int userId, int clubId)
    {
        try
        {
            // Members are not directly linked to Users by UserId
            // For now, we check if user is admin (admins are also considered members)
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);

            return isAdmin;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking membership for user {UserId} in club {ClubId}",
                userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Get club subscription tier
    /// </summary>
    public async Task<string> GetClubSubscriptionTier(int clubId)
    {
        try
        {
            // Query the database for club subscription information
            // This assumes there's a Clubs table with a SubscriptionTier field
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found", clubId);
                return "Basic"; // Default tier
            }

            return club.Tier ?? "Basic";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subscription tier for club {ClubId}", clubId);
            return "Basic"; // Default to basic tier on error
        }
    }
}
