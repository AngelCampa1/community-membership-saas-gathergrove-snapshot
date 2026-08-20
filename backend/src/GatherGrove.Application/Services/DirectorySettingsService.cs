using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service implementation for managing club directory settings
/// </summary>
public class DirectorySettingsService : IDirectorySettingsService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<DirectorySettingsService> _logger;

    public DirectorySettingsService(GatherGroveDbContext context, ILogger<DirectorySettingsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets the directory settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Directory settings response</returns>
    public async Task<DirectorySettingsResponse> GetDirectorySettingsAsync(int clubId, int userId)
    {
        _logger.LogInformation("Getting directory settings for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var club = await _context.Clubs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        var allowedFields = string.IsNullOrEmpty(club.DirectoryAllowedSharableFields)
            ? Array.Empty<string>()
            : club.DirectoryAllowedSharableFields.Split(',', StringSplitOptions.RemoveEmptyEntries);

        return new DirectorySettingsResponse
        {
            IsEnabled = club.IsDirectoryEnabled,
            AllowedSharableFields = allowedFields
        };
    }

    /// <summary>
    /// Updates the directory settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The updated directory settings</param>
    /// <returns>Updated directory settings response</returns>
    public async Task<DirectorySettingsResponse> UpdateDirectorySettingsAsync(int clubId, int userId, UpdateDirectorySettingsRequest request)
    {
        _logger.LogInformation("Updating directory settings for club {ClubId} by user {UserId}: IsEnabled={IsEnabled}, Fields={AllowedFields}",
            clubId, userId, request.IsEnabled, string.Join(",", request.AllowedSharableFields));

        // Verify user is an admin of this club
        await ValidateClubAdminAsync(clubId, userId);

        var club = await _context.Clubs
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        // Validate allowed fields (only allow known profile fields)
        var validFields = new[] { "email", "phoneNumber" };
        var invalidFields = request.AllowedSharableFields.Where(f => !validFields.Contains(f)).ToArray();

        if (invalidFields.Any())
        {
            throw new ArgumentException($"Invalid fields specified: {string.Join(", ", invalidFields)}. Valid fields are: {string.Join(", ", validFields)}");
        }

        // Update the club settings
        club.IsDirectoryEnabled = request.IsEnabled;
        club.DirectoryAllowedSharableFields = request.AllowedSharableFields.Any()
            ? string.Join(",", request.AllowedSharableFields)
            : null;
        club.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Directory settings updated successfully for club {ClubId}", clubId);

        return new DirectorySettingsResponse
        {
            IsEnabled = club.IsDirectoryEnabled,
            AllowedSharableFields = request.AllowedSharableFields
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