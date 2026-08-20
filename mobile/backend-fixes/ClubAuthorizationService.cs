using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Services;

/// <summary>
/// Service for handling club-level authorization and feature access control
/// </summary>
public class ClubAuthorizationService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ClubAuthorizationService> _logger;

    // Define tier-based feature access rules
    private static readonly Dictionary<string, HashSet<string>> TierFeatureAccess = new()
    {
        ["Basic"] = new HashSet<string>
        {
            "BasicEventManagement",
            "MemberDirectory", 
            "EventRSVP",
            "BasicReporting"
        },
        ["Growth"] = new HashSet<string>
        {
            "BasicEventManagement",
            "MemberDirectory",
            "EventRSVP", 
            "BasicReporting",
            "AdvancedEventManagement",
            "MemberCommunication",
            "EventAnalytics"
        },
        ["Unlimited"] = new HashSet<string>
        {
            "BasicEventManagement",
            "MemberDirectory",
            "EventRSVP",
            "BasicReporting",
            "AdvancedEventManagement", 
            "MemberCommunication",
            "EventAnalytics",
            "EventEngagementAnalytics",
            "MemberEngagementInsights",
            "EventPerformanceAnalysis",
            "EngagementTrends",
            "EventRecommendations",
            "ROIMetrics"
        }
    };

    public ClubAuthorizationService(GatherGroveDbContext context, ILogger<ClubAuthorizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Validate if a user has access to a specific club
    /// </summary>
    public async Task<bool> ValidateClubAccessAsync(int clubId, int userId)
    {
        try
        {
            // Check if user is a club admin (owner/admin role)
            var isAdmin = await _context.ClubAdmins
                .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

            if (isAdmin)
                return true;

            // Check if user is an active member
            var isMember = await _context.Members
                .AnyAsync(m => m.ClubId == clubId && m.Status == "Active" && 
                              m.Email == _context.Users.Where(u => u.Id == userId).Select(u => u.Email).FirstOrDefault());

            return isMember;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating club access for user {UserId} in club {ClubId}", userId, clubId);
            return false;
        }
    }

    /// <summary>
    /// Check if a club has access to a specific feature based on tier
    /// </summary>
    public async Task<bool> HasFeatureAccess(int clubId, string featureName)
    {
        try
        {
            if (string.IsNullOrEmpty(featureName))
                return false;

            var club = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == clubId);
            if (club == null)
                return false;

            // Check for expired subscriptions
            if (club.TrialExpiresAt.HasValue && club.TrialExpiresAt.Value < DateTime.UtcNow)
            {
                _logger.LogWarning("Club {ClubId} trial has expired, denying feature access", clubId);
                return false;
            }

            var clubTier = club.Tier ?? "Basic";

            // Check if the tier has access to the requested feature
            if (TierFeatureAccess.ContainsKey(clubTier))
            {
                var hasAccess = TierFeatureAccess[clubTier].Contains(featureName);
                
                if (!hasAccess)
                {
                    _logger.LogWarning("Club {ClubId} with tier {Tier} denied access to feature {Feature}", 
                        clubId, clubTier, featureName);
                }

                return hasAccess;
            }

            _logger.LogWarning("Unknown club tier {Tier} for club {ClubId}", clubTier, clubId);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature access for club {ClubId}, feature {Feature}", clubId, featureName);
            return false;
        }
    }

    /// <summary>
    /// Get user's role within a club
    /// </summary>
    public async Task<string> GetUserRoleInClub(int clubId, int userId)
    {
        try
        {
            // Check if user is owner (created the club)
            var club = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == clubId && c.CreatedByUserId == userId);
            if (club != null)
                return "Owner";

            // Check if user is admin
            var isAdmin = await _context.ClubAdmins.AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);
            if (isAdmin)
                return "Admin";

            // Check if user is member
            var userEmail = await _context.Users.Where(u => u.Id == userId).Select(u => u.Email).FirstOrDefaultAsync();
            var isMember = await _context.Members.AnyAsync(m => m.ClubId == clubId && m.Email == userEmail && m.Status == "Active");
            if (isMember)
                return "Member";

            return "None";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user role for user {UserId} in club {ClubId}", userId, clubId);
            return "None";
        }
    }

    /// <summary>
    /// Check if user has administrative permissions in a club
    /// </summary>
    public async Task<bool> HasAdministrativeAccess(int clubId, int userId)
    {
        var role = await GetUserRoleInClub(clubId, userId);
        return role == "Owner" || role == "Admin";
    }
}