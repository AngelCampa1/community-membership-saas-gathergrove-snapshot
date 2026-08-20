using Microsoft.Extensions.Logging;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GatherGrove.Infrastructure.Services;

/// <summary>
/// Service for handling club-specific authorization checks
/// Infrastructure-specific implementation to break circular dependency
/// </summary>
public class ClubAuthorizationService : IClubAuthorizationService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ClubAuthorizationService> _logger;

    public ClubAuthorizationService(
        GatherGroveDbContext context,
        ILogger<ClubAuthorizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static bool IsExpandTier(string? tier) =>
        tier?.Equals("Expand", StringComparison.OrdinalIgnoreCase) == true
        || tier?.Equals("Unlimited", StringComparison.OrdinalIgnoreCase) == true;

    /// <summary>
    /// Verifies if a club has access to Expand tier features
    /// </summary>
    public async Task<bool> CanAccessUnlimitedFeaturesAsync(int clubId)
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

            var hasUnlimitedAccess = IsExpandTier(club.Tier);

            _logger.LogInformation("Expand access check for club {ClubId} tier {Tier}: {HasAccess}",
                clubId, club.Tier, hasUnlimitedAccess);

            return hasUnlimitedAccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Expand tier access for club {ClubId}", clubId);
            return false;
        }
    }

    /// <summary>
    /// Validates if a club has access to a specific feature
    /// </summary>
    public async Task<bool> HasFeatureAccess(int clubId, string featureName)
    {
        try
        {

            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier, c.CreatedAt, c.UpdatedAt, c.TrialExpiresAt })
                .FirstOrDefaultAsync();


            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found", clubId);
                return false;
            }

            // Check if subscription is expired - either trial expired or very old subscription
            var subscriptionAge = DateTime.UtcNow - club.CreatedAt;
            var isTrialExpired = club.TrialExpiresAt.HasValue && club.TrialExpiresAt.Value < DateTime.UtcNow;
            var isOldSubscription = subscriptionAge.TotalDays > 548; // 18 months for general subscription
            var isSubscriptionExpired = isTrialExpired || isOldSubscription;

            _logger.LogInformation("Subscription check for club {ClubId}: age={Age} days, trialExpired={TrialExpired}, oldSubscription={OldSubscription}, expired={Expired}",
            clubId, subscriptionAge.TotalDays, isTrialExpired, isOldSubscription, isSubscriptionExpired);

            if (isSubscriptionExpired && IsExpandTier(club.Tier))
            {
                _logger.LogWarning("Expand tier subscription expired for club {ClubId}, trialExpired={TrialExpired}, age={Age} days",
                clubId, isTrialExpired, subscriptionAge.TotalDays);
                return false;
            }

            // Basic feature access logic

            var hasAccess = featureName switch
            {
                // Basic features - available to all tiers
                "MemberDirectory" => true,
                "BasicEvents" => true,
                "BasicReporting" => true,
                "EventRSVP" => true,
                "BasicEventManagement" => true,

                // Analytics features - Expand tier only
                "AdvancedAnalytics" => IsExpandTier(club.Tier),
                "EventEngagementAnalytics" => IsExpandTier(club.Tier),
                "MemberEngagementInsights" => IsExpandTier(club.Tier),
                "EventPerformanceAnalysis" => IsExpandTier(club.Tier),
                "EngagementTrends" => IsExpandTier(club.Tier),
                "EventRecommendations" => IsExpandTier(club.Tier),
                "ROIMetrics" => IsExpandTier(club.Tier),

                // Other advanced features - Expand tier only
                "DataExport" => IsExpandTier(club.Tier),
                "WhiteLabeling" => IsExpandTier(club.Tier),
                "AdvancedEventManagement" => IsExpandTier(club.Tier),
                "MemberSegmentation" => IsExpandTier(club.Tier),
                "APIAccess" => IsExpandTier(club.Tier),

                // Grow+ features  
                "EnhancedReporting" => club.Tier == "Grow" || club.Tier == "Growth" || IsExpandTier(club.Tier),
                "CustomFields" => club.Tier == "Grow" || club.Tier == "Growth" || IsExpandTier(club.Tier),

                _ => false // Unknown features denied by default
            };

            _logger.LogInformation("Feature access check for club {ClubId} tier {Tier}, feature {Feature}: access={Access}, tier={ClubTier}, isExpand={IsExpand}",
            clubId, club.Tier, featureName, hasAccess, club.Tier, IsExpandTier(club.Tier));

            return hasAccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature access for club {ClubId}, feature {FeatureName}",
                clubId, featureName);
            return false;
        }
    }

    /// <summary>
    /// Validates club access for a specific user
    /// </summary>
    public async Task<bool> ValidateClubAccessAsync(int clubId, int userId)
    {
        try
        {
            // Check if user is the club owner or admin first
            var clubAdmin = await _context.ClubAdmins
                .Where(ca => ca.ClubId == clubId && ca.UserId == userId)
                .FirstOrDefaultAsync();

            if (clubAdmin != null)
            {
                return true;
            }

            // Check if user is a member of the club and has active status
            // Look for member by matching user email pattern or explicit user-member mapping
            var user = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new { u.Email })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return false;
            }

            var member = await _context.Members
                .Where(m => m.ClubId == clubId && m.Email == user.Email)
                .Select(m => new { m.Status, m.Id, m.Email })
                .FirstOrDefaultAsync();

            if (member == null)
            {
                return false;
            }

            var isActive = member.Status?.Equals("Active", StringComparison.OrdinalIgnoreCase) ?? false;

            _logger.LogInformation("Club access validation for user {UserId} in club {ClubId}: active={IsActive}, memberId={MemberId}, status={Status}",
            userId, clubId, isActive, member.Id, member.Status);

            return isActive;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating club access for user {UserId}, club {ClubId}", userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Gets user ID from claims principal
    /// </summary>
    public int? GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("userId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Gets club ID from claims principal
    /// </summary>
    public int? GetClubIdFromClaims(ClaimsPrincipal user)
    {
        var clubIdClaim = user.FindFirst("ClubId")?.Value;
        return int.TryParse(clubIdClaim, out var clubId) ? clubId : null;
    }

    /// <summary>
    /// Checks if user can access club as admin
    /// </summary>
    public async Task<bool> CanAccessClubAsAdminAsync(ClaimsPrincipal user, int clubId)
    {
        var userId = GetUserIdFromClaims(user);
        if (!userId.HasValue) return false;

        // Check if user is admin of the specific club
        var isAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId.Value);

        return isAdmin;
    }

    /// <summary>
    /// Checks if user can access club as member
    /// </summary>
    public async Task<bool> CanAccessClubAsMemberAsync(ClaimsPrincipal user, int clubId)
    {
        var userId = GetUserIdFromClaims(user);
        if (!userId.HasValue) return false;

        return await ValidateClubAccessAsync(clubId, userId.Value);
    }

    /// <summary>
    /// Checks if requesting user can access target user data
    /// </summary>
    public async Task<bool> CanAccessUserDataAsync(ClaimsPrincipal requestingUser, int targetUserId)
    {
        var requestingUserId = GetUserIdFromClaims(requestingUser);
        if (requestingUserId.HasValue && requestingUserId.Value == targetUserId)
        {
            return true;
        }

        // Check if requesting user is admin of any club that the target user is a member of
        if (!requestingUserId.HasValue) return false;

        var isAdminOfSameClub = await _context.ClubAdmins
            .Where(ca => ca.UserId == requestingUserId.Value)
            .AnyAsync(ca => _context.Members
                .Any(m => m.ClubId == ca.ClubId && m.Id == targetUserId));

        return isAdminOfSameClub;
    }

    /// <summary>
    /// Checks if club can access grow tier features
    /// </summary>
    public async Task<bool> CanAccessGrowFeaturesAsync(int clubId)
    {
        try
        {
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                return false;
            }

            return club.Tier == "Grow" || club.Tier == "Growth" || IsExpandTier(club.Tier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking grow tier access for club {ClubId}", clubId);
            return false;
        }
    }

    /// <summary>
    /// Gets the club tier
    /// </summary>
    public async Task<string?> GetClubTierAsync(int clubId)
    {
        try
        {
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            return club?.Tier;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tier for club {ClubId}", clubId);
            return null;
        }
    }

    /// <summary>
    /// Checks if user is authorized for a specific club
    /// </summary>
    public async Task<bool> IsUserAuthorizedForClubAsync(int userId, int clubId)
    {
        return await ValidateClubAccessAsync(clubId, userId);
    }

    /// <summary>
    /// Validates if a user can access another member's data (self access or same club admin/member)
    /// SECURITY: Prevents IDOR attacks by ensuring users can only access data they're authorized to see
    /// </summary>
    public async Task<bool> CanAccessMemberDataAsync(int memberId, int userId)
    {
        try
        {
            // Get the member's club information
            var member = await _context.Members
                .Where(m => m.Id == memberId)
                .Select(m => new { m.ClubId, m.Email })
                .FirstOrDefaultAsync();

            if (member == null)
            {
                _logger.LogWarning("Member {MemberId} not found for access check", memberId);
                return false;
            }

            // Get the requesting user's email
            var requestingUser = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new { u.Email })
                .FirstOrDefaultAsync();

            if (requestingUser == null)
            {
                _logger.LogWarning("User {UserId} not found for member access check", userId);
                return false;
            }

            // Check if the user is accessing their own member record (self access)
            if (member.Email?.Equals(requestingUser.Email, StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogInformation("Self-access granted: User {UserId} accessing their own member record {MemberId}", userId, memberId);
                return true;
            }

            // Check if the user is an admin of the member's club
            var isClubAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == member.ClubId && ca.UserId == userId);

            if (isClubAdmin)
            {
                _logger.LogInformation("Admin access granted: User {UserId} is admin of club {ClubId} for member {MemberId}", userId, member.ClubId, memberId);
                return true;
            }

            // Check if the user is a member of the same club
            var isClubMember = await _context.Members
                .AnyAsync(m => m.ClubId == member.ClubId &&
                              m.Email == requestingUser.Email &&
                              (m.Status == "Active" || m.Status == "active"));

            if (isClubMember)
            {
                _logger.LogInformation("Club member access granted: User {UserId} is member of same club {ClubId} for member {MemberId}", userId, member.ClubId, memberId);
                return true;
            }

            _logger.LogWarning("Access denied: User {UserId} attempted unauthorized access to member {MemberId} in club {ClubId}", userId, memberId, member.ClubId);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking member data access for member {MemberId}, user {UserId}", memberId, userId);
            return false;
        }
    }
}
