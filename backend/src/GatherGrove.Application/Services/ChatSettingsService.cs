using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service implementation for managing club chat settings
/// </summary>
public class ChatSettingsService : IChatSettingsService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ChatSettingsService> _logger;

    public ChatSettingsService(GatherGroveDbContext context, ILogger<ChatSettingsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets the chat settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Chat settings response</returns>
    public async Task<ChatSettingsResponse> GetChatSettingsAsync(int clubId, int userId)
    {
        _logger.LogInformation("Getting chat settings for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var club = await _context.Clubs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        return new ChatSettingsResponse
        {
            IsChatEnabled = club.IsChatEnabled
        };
    }

    /// <summary>
    /// Updates the chat settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The updated chat settings</param>
    /// <returns>Updated chat settings response</returns>
    public async Task<ChatSettingsResponse> UpdateChatSettingsAsync(int clubId, int userId, UpdateChatSettingsRequest request)
    {
        _logger.LogInformation("Updating chat settings for club {ClubId} by user {UserId}: IsChatEnabled={IsChatEnabled}",
            clubId, userId, request.IsChatEnabled);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var club = await _context.Clubs
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        // Update the club chat settings
        club.IsChatEnabled = request.IsChatEnabled;
        club.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Chat settings updated successfully for club {ClubId}: IsChatEnabled={IsChatEnabled}",
            clubId, request.IsChatEnabled);

        return new ChatSettingsResponse
        {
            IsChatEnabled = club.IsChatEnabled
        };
    }

    /// <summary>
    /// Validates that the user is an admin of the specified club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The user ID to validate</param>
    /// <exception cref="UnauthorizedAccessException">Thrown if user is not an admin</exception>
    private async Task ValidateClubAdminAsync(int clubId, int userId)
    {
        var isAdmin = await _context.ClubAdmins
            .AsNoTracking()
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("User is not authorized to manage settings for this club");
        }
    }
}