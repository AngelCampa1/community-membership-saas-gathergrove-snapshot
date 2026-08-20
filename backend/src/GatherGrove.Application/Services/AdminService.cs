using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing club administrators and invitations
/// </summary>
public class AdminService : IAdminService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<AdminService> _logger;
    private readonly IEmailService _emailService;

    public AdminService(GatherGroveDbContext context, ILogger<AdminService> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    /// <summary>
    /// Gets all administrators for a specific club
    /// </summary>
    public async Task<IEnumerable<ClubAdminResponse>> GetClubAdminsAsync(int clubId, int currentUserId)
    {
        _logger.LogInformation("Getting club administrators for club {ClubId}", clubId);

        var admins = await _context.ClubAdmins
            .Include(ca => ca.User)
            .Include(ca => ca.Club)
            .Where(ca => ca.ClubId == clubId)
            .OrderBy(ca => ca.CreatedAt)
            .Select(ca => new ClubAdminResponse
            {
                UserId = ca.UserId,
                FullName = ca.User.FullName,
                Email = ca.User.Email,
                Role = ca.UserId == ca.Club.CreatedByUserId ? "Primary" : "Admin",
                CreatedAt = ca.CreatedAt,
                IsCurrentUser = ca.UserId == currentUserId
            })
            .ToListAsync();

        _logger.LogInformation("Found {Count} administrators for club {ClubId}", admins.Count, clubId);
        return admins;
    }

    /// <summary>
    /// Creates a new administrator invitation for a club (Grow tier only)
    /// </summary>
    public async Task<AdminInviteResponse> CreateAdminInviteAsync(int clubId, int invitedByUserId, CreateAdminInviteRequest request)
    {
        _logger.LogInformation("Creating admin invitation for club {ClubId} by user {UserId} to email {Email}",
            clubId, invitedByUserId, request.Email);

        // Verify club exists and user is an admin
        var club = await _context.Clubs
            .Include(c => c.ClubAdmins)
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            _logger.LogWarning("Club {ClubId} not found", clubId);
            throw new InvalidOperationException("Club not found");
        }

        // Verify club is on Seed tier or above
        if (club.Tier != "Grow" && club.Tier != "Seed" && !IsTopTier(club.Tier))
        {
            _logger.LogWarning("User {UserId} attempted to invite admin for club {ClubId} on {Tier} tier",
                invitedByUserId, clubId, club.Tier);
            throw new InvalidOperationException("Admin invitations require at least a Seed tier subscription");
        }

        // Verify user is an admin of this club
        var isAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == invitedByUserId);

        if (!isAdmin)
        {
            _logger.LogWarning("User {UserId} is not an admin of club {ClubId}", invitedByUserId, clubId);
            throw new InvalidOperationException("Only club administrators can send invitations");
        }

        // Determine admin limit based on tier (Seed: 2, Grow: 3, top plan: no limit)
        var adminLimit = club.Tier switch
        {
            "Seed" => 2,
            "Grow" => 3,
            _ => int.MaxValue // Expand, legacy Unlimited, and unknown tiers have no cap
        };

        var currentAdminCount = club.ClubAdmins.Count;
        var pendingInviteCount = await _context.ClubAdminInvites
            .CountAsync(ci => ci.ClubId == clubId && ci.Status == "Pending" && ci.ExpiresAt > DateTime.UtcNow);

        if (adminLimit != int.MaxValue && currentAdminCount + pendingInviteCount >= adminLimit)
        {
            _logger.LogWarning("Club {ClubId} is at admin limit with {Current} admins and {Pending} pending invites",
                clubId, currentAdminCount, pendingInviteCount);
            throw new InvalidOperationException($"Club has reached the maximum number of administrators ({adminLimit})");
        }

        // Check if user is already an admin
        var existingAdmin = await _context.ClubAdmins
            .Include(ca => ca.User)
            .FirstOrDefaultAsync(ca => ca.ClubId == clubId && ca.User.Email.ToLower() == request.Email.ToLower());

        if (existingAdmin != null)
        {
            _logger.LogWarning("User with email {Email} is already an admin of club {ClubId}", request.Email, clubId);
            throw new InvalidOperationException("This person is already an administrator of this club");
        }

        // Check if there's already a pending invitation
        var existingInvite = await _context.ClubAdminInvites
            .FirstOrDefaultAsync(ci => ci.ClubId == clubId
                && ci.Email.ToLower() == request.Email.ToLower()
                && ci.Status == "Pending"
                && ci.ExpiresAt > DateTime.UtcNow);

        if (existingInvite != null)
        {
            _logger.LogWarning("Pending invitation already exists for email {Email} to club {ClubId}", request.Email, clubId);
            throw new InvalidOperationException("An invitation has already been sent to this email address");
        }

        // Generate secure token
        var token = GenerateSecureToken();

        // Create invitation
        var invite = new ClubAdminInvite
        {
            ClubId = clubId,
            Email = request.Email.ToLower(),
            InviteToken = token,
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddHours(72), // 72 hours as specified in user story
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitedByUserId
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        // Get inviter name and club name for email
        var inviterName = await _context.Users
            .Where(u => u.Id == invitedByUserId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync() ?? "Unknown";

        var clubName = await _context.Clubs
            .Where(c => c.Id == clubId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync() ?? "GatherGrove Club";

        // Send invitation email
        try
        {
            await _emailService.SendAdminInvitationEmailAsync(invite.Email, clubName, inviterName, token);
            _logger.LogInformation("Admin invitation email sent to {Email} for club {ClubId}", invite.Email, clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send admin invitation email to {Email} for club {ClubId}", invite.Email, clubId);
            // Continue - invite is still created even if email fails
        }

        return new AdminInviteResponse
        {
            InviteId = invite.InviteId,
            Email = invite.Email,
            Status = invite.Status,
            CreatedAt = invite.CreatedAt,
            ExpiresAt = invite.ExpiresAt,
            InvitedByName = inviterName
        };
    }

    /// <summary>
    /// Gets all pending invitations for a specific club
    /// </summary>
    public async Task<IEnumerable<AdminInviteResponse>> GetPendingInvitesAsync(int clubId)
    {
        _logger.LogInformation("Getting pending invitations for club {ClubId}", clubId);

        var invites = await _context.ClubAdminInvites
            .Include(ci => ci.InvitedByUser)
            .Where(ci => ci.ClubId == clubId && ci.Status == "Pending" && ci.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(ci => ci.CreatedAt)
            .Select(ci => new AdminInviteResponse
            {
                InviteId = ci.InviteId,
                Email = ci.Email,
                Status = ci.Status,
                CreatedAt = ci.CreatedAt,
                ExpiresAt = ci.ExpiresAt,
                InvitedByName = ci.InvitedByUser.FullName
            })
            .ToListAsync();

        _logger.LogInformation("Found {Count} pending invitations for club {ClubId}", invites.Count, clubId);
        return invites;
    }

    /// <summary>
    /// Cancels a pending invitation
    /// </summary>
    public async Task<bool> CancelInviteAsync(int clubId, int inviteId, int currentUserId)
    {
        _logger.LogInformation("Cancelling invitation {InviteId} for club {ClubId} by user {UserId}",
            inviteId, clubId, currentUserId);

        // Verify user is an admin of this club
        var isAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == currentUserId);

        if (!isAdmin)
        {
            _logger.LogWarning("User {UserId} is not an admin of club {ClubId}", currentUserId, clubId);
            throw new InvalidOperationException("Only club administrators can cancel invitations");
        }

        var invite = await _context.ClubAdminInvites
            .FirstOrDefaultAsync(ci => ci.InviteId == inviteId && ci.ClubId == clubId);

        if (invite == null)
        {
            _logger.LogWarning("Invitation {InviteId} not found for club {ClubId}", inviteId, clubId);
            return false;
        }

        invite.Status = "Cancelled";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully cancelled invitation {InviteId}", inviteId);
        return true;
    }

    /// <summary>
    /// Removes an administrator from a club (Grow tier only)
    /// </summary>
    public async Task<bool> RemoveAdminAsync(int clubId, int userIdToRemove, int currentUserId)
    {
        _logger.LogInformation("Removing admin {UserIdToRemove} from club {ClubId} by user {CurrentUserId}",
            userIdToRemove, clubId, currentUserId);

        // Verify club exists and is on Grow tier
        var club = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == clubId);
        if (club == null)
        {
            _logger.LogWarning("Club {ClubId} not found", clubId);
            throw new InvalidOperationException("Club not found");
        }

        if (club.Tier != "Grow" && club.Tier != "Seed" && !IsTopTier(club.Tier))
        {
            _logger.LogWarning("User {UserId} attempted to remove admin from club {ClubId} on {Tier} tier",
                currentUserId, clubId, club.Tier);
            throw new InvalidOperationException("Admin management requires at least a Seed tier subscription");
        }

        // Verify current user is an admin (primary admin for removal privileges)
        var currentUserAdmin = await _context.ClubAdmins
            .FirstOrDefaultAsync(ca => ca.ClubId == clubId && ca.UserId == currentUserId);

        if (currentUserAdmin == null)
        {
            _logger.LogWarning("User {UserId} is not an admin of club {ClubId}", currentUserId, clubId);
            throw new InvalidOperationException("Only club administrators can remove other administrators");
        }

        // Prevent removing yourself
        if (userIdToRemove == currentUserId)
        {
            _logger.LogWarning("User {UserId} attempted to remove themselves from club {ClubId}", currentUserId, clubId);
            throw new InvalidOperationException("You cannot remove yourself as an administrator");
        }

        // Prevent removing the primary admin (club creator)
        if (userIdToRemove == club.CreatedByUserId)
        {
            _logger.LogWarning("User {UserId} attempted to remove primary admin {PrimaryAdminId} from club {ClubId}",
                currentUserId, club.CreatedByUserId, clubId);
            throw new InvalidOperationException("The primary administrator cannot be removed");
        }

        var adminToRemove = await _context.ClubAdmins
            .FirstOrDefaultAsync(ca => ca.ClubId == clubId && ca.UserId == userIdToRemove);

        if (adminToRemove == null)
        {
            _logger.LogWarning("Admin relationship not found for user {UserIdToRemove} in club {ClubId}",
                userIdToRemove, clubId);
            return false;
        }

        _context.ClubAdmins.Remove(adminToRemove);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully removed admin {UserIdToRemove} from club {ClubId}", userIdToRemove, clubId);
        return true;
    }

    /// <summary>
    /// Handles tier downgrade by cancelling all pending invitations
    /// </summary>
    public async Task HandleTierDowngradeAsync(int clubId)
    {
        _logger.LogInformation("Handling tier downgrade for club {ClubId}", clubId);

        // Find all pending invitations for this club
        var pendingInvites = await _context.ClubAdminInvites
            .Where(ci => ci.ClubId == clubId && ci.Status == "Pending" && ci.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        if (pendingInvites.Any())
        {
            _logger.LogInformation("Cancelling {Count} pending invitations for club {ClubId} due to tier downgrade",
                pendingInvites.Count, clubId);

            // Mark all pending invitations as cancelled
            foreach (var invite in pendingInvites)
            {
                invite.Status = "Cancelled";
                _logger.LogInformation("Cancelled invitation {InviteId} for email {Email}",
                    invite.InviteId, invite.Email);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully cancelled all pending invitations for club {ClubId}", clubId);
        }
        else
        {
            _logger.LogInformation("No pending invitations found for club {ClubId}", clubId);
        }
    }

    /// <summary>
    /// Generates a cryptographically secure token for invitations
    /// </summary>
    private static string GenerateSecureToken()
    {
        var tokenBytes = new byte[32]; // 256 bits
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        return Convert.ToBase64String(tokenBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    private static bool IsTopTier(string? tier)
    {
        return string.Equals(tier, "Expand", StringComparison.OrdinalIgnoreCase)
            || string.Equals(tier, "Unlimited", StringComparison.OrdinalIgnoreCase);
    }
}
