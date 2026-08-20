using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Services;

/// <summary>
/// Service for club tier-related operations
/// </summary>
public class ClubTierService : IClubTierService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ClubTierService> _logger;

    public ClubTierService(GatherGroveDbContext context, ILogger<ClubTierService> logger)
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
            // CRITICAL: Validate user ID first - prevent invalid/negative user IDs
            if (userId <= 0)
            {
                _logger.LogWarning("Invalid user ID {UserId} attempted access to club {ClubId}", userId, clubId);
                throw new UnauthorizedAccessException($"Invalid user ID: {userId}");
            }

            // Check if user exists and is active
            var user = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new { u.Id, u.IsActive })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found when accessing club {ClubId}", userId, clubId);
                throw new UnauthorizedAccessException($"User not found: {userId}");
            }

            // Check if user account is suspended/inactive
            if (!user.IsActive)
            {
                _logger.LogWarning("Suspended user {UserId} attempted access to club {ClubId}", userId, clubId);
                throw new UnauthorizedAccessException("Account is suspended or inactive");
            }

            // First check if user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);

            if (!isAdmin)
            {
                _logger.LogInformation("User {UserId} is not admin of club {ClubId}", userId, clubId);
                return false;
            }

            // Check if club has Expand tier subscription AND membership is not expired
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier, c.MembershipExpiresAt })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found", clubId);
                return false;
            }

            // Check for expired membership
            if (club.MembershipExpiresAt.HasValue && club.MembershipExpiresAt.Value < DateTime.UtcNow)
            {
                _logger.LogWarning("Club {ClubId} membership expired on {ExpiryDate}", clubId, club.MembershipExpiresAt.Value);
                throw new UnauthorizedAccessException("Club membership has expired");
            }

            var hasUnlimitedAccess = IsExpandTier(club.Tier);

            _logger.LogInformation("Club {ClubId} tier: {Tier}, Expand access: {HasAccess}",
                clubId, club.Tier, hasUnlimitedAccess);

            return hasUnlimitedAccess;
        }
        catch (UnauthorizedAccessException)
        {
            // Re-throw authorization exceptions as-is
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Expand tier access for user {UserId} in club {ClubId}",
                userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Check if user can export financial data
    /// </summary>
    public async Task<bool> CanExportFinancialData(int userId, int clubId)
    {
        try
        {
            // Check if user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);

            if (!isAdmin)
            {
                _logger.LogInformation("User {UserId} is not admin of club {ClubId}, cannot export financial data", userId, clubId);
                return false;
            }

            // Financial data export is allowed for all tiers for admins
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking financial export permission for user {UserId} in club {ClubId}", userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Check if user can export member data
    /// </summary>
    public async Task<bool> CanExportMemberData(int userId, int clubId)
    {
        try
        {
            // Check if user is admin of the club
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);

            if (!isAdmin)
            {
                _logger.LogInformation("User {UserId} is not admin of club {ClubId}, cannot export member data", userId, clubId);
                return false;
            }

            // Member data export is allowed for all tiers for admins
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking member export permission for user {UserId} in club {ClubId}", userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Get financial export limit for a club
    /// </summary>
    public async Task<int> GetFinancialExportLimitAsync(int clubId)
    {
        try
        {
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found", clubId);
                return 0;
            }

            // Return export limits based on tier
            return club.Tier?.ToLower() switch
            {
                "expand" or "unlimited" => int.MaxValue,
                "grow" => 50,
                "seed" => 20,
                _ => 20 // Default
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting financial export limit for club {ClubId}", clubId);
            return 0;
        }
    }

    /// <summary>
    /// Get member export limit for a club
    /// </summary>
    public async Task<int> GetMemberExportLimitAsync(int clubId)
    {
        try
        {
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found", clubId);
                return 0;
            }

            // Return export limits based on tier
            return club.Tier?.ToLower() switch
            {
                "expand" or "unlimited" => int.MaxValue,
                "grow" => 100,
                "seed" => 50,
                _ => 50 // Default
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member export limit for club {ClubId}", clubId);
            return 0;
        }
    }

    public async Task<bool> CanExportEventData(int userId, int clubId)
    {
        try
        {
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found", clubId);
                return false;
            }

            // Allow event data export for seed, grow, and Expand tiers
            return club.Tier?.ToLower() switch
            {
                "expand" or "unlimited" => true,
                "grow" => true,
                "seed" => true,
                _ => false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking event export permission for user {UserId} and club {ClubId}", userId, clubId);
            return false;
        }
    }
}
