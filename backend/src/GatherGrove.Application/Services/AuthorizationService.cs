using System.Security.Claims;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

public class AuthorizationService : IAuthorizationService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<AuthorizationService> _logger;

    public AuthorizationService(GatherGroveDbContext context, ILogger<AuthorizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> CanAccessResourceAsync(int userId, string resourceType, int resourceId)
    {
        try
        {
            _logger.LogDebug("Checking if user {UserId} can access {ResourceType} {ResourceId}",
                userId, resourceType, resourceId);

            // Basic implementation - check if user exists and is active
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsActive)
            {
                return false;
            }

            // Resource-specific access checks
            switch (resourceType.ToLower())
            {
                case "club":
                    return await CanAccessClubAsync(userId, resourceId);
                case "member":
                    return await CanAccessMemberAsync(userId, resourceId);
                case "event":
                    return await CanAccessEventAsync(userId, resourceId);
                default:
                    return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking resource access for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> HasPermissionAsync(int userId, string permission)
    {
        try
        {

            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsActive)
            {
                return false;
            }

            // Basic permission checks - could be extended with a proper RBAC system
            switch (permission.ToLower())
            {
                case "export_data":
                case "read":
                    return true; // All active users can read and export their own data
                case "admin":
                    return await IsUserAdminAsync(userId);
                case "financial_data":
                    return await IsUserAdminAsync(userId); // Only admins can access financial data
                default:
                    return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking permission {Permission} for user {UserId}", permission, userId);
            return false;
        }
    }

    public async Task<bool> CanExportDataAsync(int userId, int clubId, string dataType)
    {
        try
        {
            _logger.LogDebug("Checking if user {UserId} can export {DataType} data for club {ClubId}",
                userId, clubId, dataType);

            // Check if user has access to the club
            if (!await CanAccessClubAsync(userId, clubId))
            {
                return false;
            }

            // Check specific data type permissions
            switch (dataType.ToLower())
            {
                case "memberdata":
                case "eventdata":
                    return true; // Club members can export basic data
                case "financialdata":
                    return await IsClubAdminAsync(userId, clubId); // Only club admins can export financial data
                default:
                    return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking export permissions for user {UserId}", userId);
            return false;
        }
    }

    public async Task<ClaimsPrincipal> GetUserClaimsAsync(int userId)
    {
        try
        {

            var user = await _context.Users
                .Include(u => u.ClubAdmins)
                .ThenInclude(ca => ca.Club)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return new ClaimsPrincipal(new ClaimsIdentity());
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.FullName ?? string.Empty),
                new(ClaimTypes.Email, user.Email ?? string.Empty),
                new("account_status", user.IsActive ? "Active" : "Inactive")
            };

            // Add club admin claims
            foreach (var clubAdmin in user.ClubAdmins)
            {
                claims.Add(new("role", "Admin"));
                claims.Add(new("club_id", clubAdmin.ClubId.ToString()));
                claims.Add(new("permissions", "READ,EXPORT,FINANCIAL_DATA"));
            }

            // Check for club membership via Members table (using email as link)
            var members = await _context.Members
                .Include(m => m.Club)
                .Where(m => m.Email == user.Email && m.Status == "Active")
                .ToListAsync();

            foreach (var member in members)
            {
                if (!user.ClubAdmins.Any(ca => ca.ClubId == member.ClubId))
                {
                    claims.Add(new("role", "Member"));
                    claims.Add(new("club_id", member.ClubId.ToString()));
                    claims.Add(new("permissions", "READ,EXPORT"));
                    claims.Add(new("membership_status", member.Status));
                }
            }

            var identity = new ClaimsIdentity(claims, "AuthorizationService");
            return new ClaimsPrincipal(identity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting claims for user {UserId}", userId);
            return new ClaimsPrincipal(new ClaimsIdentity());
        }
    }

    public async Task<int> GetUserExportQuotaAsync(int userId)
    {
        try
        {

            // Check if user is admin (higher quota)
            if (await IsUserAdminAsync(userId))
            {
                return 1000; // Admin quota
            }

            // Regular member quota
            return 100;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting export quota for user {UserId}", userId);
            return 10; // Conservative fallback
        }
    }

    private async Task<bool> CanAccessClubAsync(int userId, int clubId)
    {
        // Check if user is admin of the club
        var isAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);

        if (isAdmin)
        {
            return true;
        }

        // Check if user is member of the club (via email match)
        var user = await _context.Users.FindAsync(userId);
        if (user?.Email != null)
        {
            return await _context.Members
                .AnyAsync(m => m.Email == user.Email && m.ClubId == clubId && m.Status == "Active");
        }

        return false;
    }

    private async Task<bool> CanAccessMemberAsync(int userId, int memberId)
    {
        // Get user's email
        var user = await _context.Users.FindAsync(userId);
        var member = await _context.Members.FindAsync(memberId);

        if (user?.Email == null || member?.Email == null)
        {
            return false;
        }

        // Users can access their own member records
        if (user.Email == member.Email)
        {
            return true;
        }

        // Check if user is admin of the club that the target member belongs to
        return await _context.ClubAdmins
            .AnyAsync(ca => ca.UserId == userId && ca.ClubId == member.ClubId);
    }

    private async Task<bool> CanAccessEventAsync(int userId, int eventId)
    {
        // Get user's email and admin clubs
        var user = await _context.Users.FindAsync(userId);
        if (user?.Email == null)
        {
            return false;
        }

        // Get clubs where user is admin
        var adminClubs = await _context.ClubAdmins
            .Where(ca => ca.UserId == userId)
            .Select(ca => ca.ClubId)
            .ToListAsync();

        // Get clubs where user is member (via email match)
        var memberClubs = await _context.Members
            .Where(m => m.Email == user.Email && m.Status == "Active")
            .Select(m => m.ClubId)
            .ToListAsync();

        var allUserClubs = adminClubs.Union(memberClubs).ToList();

        return await _context.Events
            .AnyAsync(e => e.Id == eventId && allUserClubs.Contains(e.ClubId));
    }

    private async Task<bool> IsUserAdminAsync(int userId)
    {
        return await _context.ClubAdmins.AnyAsync(ca => ca.UserId == userId);
    }

    private async Task<bool> IsClubAdminAsync(int userId, int clubId)
    {
        return await _context.ClubAdmins
            .AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);
    }
}