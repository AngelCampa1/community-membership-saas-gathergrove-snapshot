using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling club-specific authorization checks
/// </summary>
public class ClubAuthorizationService : IClubAuthorizationService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ClubAuthorizationService> _logger;

    private static bool IsExpandTier(string? tier) =>
        tier?.Equals("Expand", StringComparison.OrdinalIgnoreCase) == true
        || tier?.Equals("Unlimited", StringComparison.OrdinalIgnoreCase) == true;

    public ClubAuthorizationService(
        GatherGroveDbContext context,
        ILogger<ClubAuthorizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Task<bool> CanAccessClubAsAdminAsync(ClaimsPrincipal user, int clubId)
    {
        // Check if user has Admin role
        if (!user.IsInRole("Admin"))
        {
            _logger.LogWarning("User {UserId} attempted to access club {ClubId} without Admin role", GetUserIdFromClaims(user), clubId);
            return Task.FromResult(false);
        }

        // Get user's club ID from claims
        var userClubId = GetClubIdFromClaims(user);
        if (userClubId == null)
        {
            _logger.LogWarning("User {UserId} has no ClubId claim", GetUserIdFromClaims(user));
            return Task.FromResult(false);
        }

        // Verify user belongs to the requested club
        if (userClubId != clubId)
        {
            _logger.LogWarning("User {UserId} attempted to access club {ClubId} but belongs to club {UserClubId}", GetUserIdFromClaims(user), clubId, userClubId);
            return Task.FromResult(false);
        }

        return Task.FromResult(true);
    }

    public Task<bool> CanAccessClubAsMemberAsync(ClaimsPrincipal user, int clubId)
    {
        // Check if user has Admin or Member role
        if (!user.IsInRole("Admin") && !user.IsInRole("Member"))
        {
            _logger.LogWarning("User {UserId} attempted to access club {ClubId} without proper role", GetUserIdFromClaims(user), clubId);
            return Task.FromResult(false);
        }

        // Get user's club ID from claims
        var userClubId = GetClubIdFromClaims(user);
        if (userClubId == null)
        {
            _logger.LogWarning("User {UserId} has no ClubId claim", GetUserIdFromClaims(user));
            return Task.FromResult(false);
        }

        // Verify user belongs to the requested club
        if (userClubId != clubId)
        {
            _logger.LogWarning("User {UserId} attempted to access club {ClubId} but belongs to club {UserClubId}", GetUserIdFromClaims(user), clubId, userClubId);
            return Task.FromResult(false);
        }

        return Task.FromResult(true);
    }

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
                _logger.LogWarning("Club {ClubId} not found for tier check", clubId);
                return false;
            }

            return club.Tier == "Grow" || IsExpandTier(club.Tier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Grow tier access for club {ClubId}", clubId);
            return false;
        }
    }

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
                _logger.LogWarning("Club {ClubId} not found for Expand tier check", clubId);
                return false;
            }

            return IsExpandTier(club.Tier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Expand tier access for club {ClubId}", clubId);
            return false;
        }
    }

    public async Task<bool> CanAccessUserDataAsync(ClaimsPrincipal requestingUser, int targetUserId)
    {
        var requestingUserId = GetUserIdFromClaims(requestingUser);
        if (requestingUserId == null)
        {
            _logger.LogWarning("User has no valid UserId claim");
            return false;
        }

        // User can always access their own data
        if (requestingUserId == targetUserId)
        {
            return true;
        }

        // Admins can access other users' data within their club
        if (requestingUser.IsInRole("Admin"))
        {
            var requestingUserClubId = GetClubIdFromClaims(requestingUser);
            if (requestingUserClubId == null)
            {
                return false;
            }

            try
            {
                // Check if target user belongs to the same club as the requesting admin
                var targetUserInSameClub = await _context.ClubAdmins
                    .AnyAsync(ca => ca.UserId == targetUserId && ca.ClubId == requestingUserClubId.Value);

                return targetUserInSameClub;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking user data access for user {RequestingUserId} to access user {TargetUserId}", requestingUserId, targetUserId);
                return false;
            }
        }

        return false;
    }

    public int? GetClubIdFromClaims(ClaimsPrincipal user)
    {
        var clubIdClaim = user.FindFirst("ClubId")?.Value;
        if (string.IsNullOrEmpty(clubIdClaim) || !int.TryParse(clubIdClaim, out var clubId))
        {
            return null;
        }
        return clubId;
    }

    public int? GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return null;
        }
        return userId;
    }

    public async Task<bool> ValidateClubAccessAsync(int clubId, int userId)
    {
        try
        {
            // Check if user is a club admin
            var isClubAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

            if (isClubAdmin)
            {
                return true;
            }

            // Check if user is a club member
            var isClubMember = await _context.Members
                .AnyAsync(m => m.ClubId == clubId && m.Email == _context.Users
                    .Where(u => u.Id == userId)
                    .Select(u => u.Email)
                    .FirstOrDefault());

            return isClubMember;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating club access for user {UserId} and club {ClubId}", userId, clubId);
            return false;
        }
    }

    public async Task<bool> HasFeatureAccess(int clubId, string featureName)
    {
        try
        {
            // Handle null/empty feature names
            if (string.IsNullOrWhiteSpace(featureName))
            {
                _logger.LogWarning("Feature name is null or empty for club {ClubId}", clubId);
                return false;
            }

            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier, c.TrialExpiresAt })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found for feature access check", clubId);
                return false;
            }

            // Check if the club's trial/subscription has expired
            if (club.TrialExpiresAt.HasValue && club.TrialExpiresAt.Value < DateTime.UtcNow)
            {
                _logger.LogWarning("Club {ClubId} subscription/trial expired on {ExpirationDate}", clubId, club.TrialExpiresAt);
                return false;
            }

            // Define feature access based on tier - CRITICAL: EventEngagementAnalytics is Expand-only
            _logger.LogInformation("Checking feature access - ClubId: {ClubId}, Tier: '{Tier}', Feature: '{FeatureName}'", clubId, club.Tier, featureName);

            switch (featureName.ToLower())
            {
                // EXPAND TIER ONLY - These features require Expand tier access
                case "eventengagementanalytics":
                case "eventanalytics":
                case "memberengagement":
                case "memberengagementinsights":
                case "advancedanalytics":
                case "eventperformanceanalysis":
                case "engagementtrends":
                case "eventrecommendations":
                case "roimetrics":
                case "premium":
                case "unlimitedfeatures":
                    // Explicitly deny Growth and Basic tiers for these features
                    if (club.Tier == "Growth" || club.Tier == "Basic")
                    {
                        _logger.LogWarning("Club {ClubId} with tier '{Tier}' DENIED access to Expand feature '{FeatureName}'", clubId, club.Tier, featureName);
                        return false;
                    }
                    var hasUnlimitedAccess = IsExpandTier(club.Tier);
                    _logger.LogInformation("Club {ClubId} with tier '{Tier}' access result for '{FeatureName}': {HasAccess}", clubId, club.Tier, featureName, hasUnlimitedAccess);
                    return hasUnlimitedAccess;

                // GROWTH+ FEATURES - Available to Growth and Expand tiers
                case "advancedeventmanagement":
                case "membercommunication":
                case "basicanalytics":
                    return club.Tier == "Growth" || IsExpandTier(club.Tier);

                // BASIC FEATURES - Available to all tiers
                case "memberlist":
                case "eventlist":
                case "basicfeatures":
                case "basiceventmanagement":
                case "memberdirectory":
                case "eventrsvp":
                case "basicreporting":
                    return true;

                default:
                    // Unknown features are denied by default for security
                    _logger.LogWarning("Unknown feature '{FeatureName}' requested for club {ClubId}", featureName, clubId);
                    return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature access for club {ClubId} and feature {FeatureName}", clubId, featureName);
            return false;
        }
    }

    public async Task<bool> IsUserAuthorizedForClubAsync(int userId, int clubId)
    {
        // Delegate to the existing ValidateClubAccessAsync method
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
