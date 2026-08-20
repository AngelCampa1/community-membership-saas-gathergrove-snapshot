using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service implementation for managing member directory settings (Story 29)
/// </summary>
public class MemberDirectorySettingsService : IMemberDirectorySettingsService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MemberDirectorySettingsService> _logger;

    public MemberDirectorySettingsService(GatherGroveDbContext context, ILogger<MemberDirectorySettingsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets the directory settings for the current member
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>Member directory settings</returns>
    public async Task<MemberDirectorySettingsResponse> GetMemberDirectorySettingsAsync(int userId)
    {
        _logger.LogInformation("Getting directory settings for user {UserId}", userId);

        // Find the user and their member record
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new ArgumentException("User not found");
        }

        // Find the member record by email
        var member = await _context.Members
            .Include(m => m.Club)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Email == user.Email);

        if (member == null)
        {
            throw new InvalidOperationException("Member record not found for this user");
        }

        // Get club directory settings
        var clubDirectoryEnabled = member.Club.IsDirectoryEnabled;
        var adminAllowedFields = clubDirectoryEnabled && !string.IsNullOrEmpty(member.Club.DirectoryAllowedSharableFields)
            ? member.Club.DirectoryAllowedSharableFields.Split(',', StringSplitOptions.RemoveEmptyEntries)
            : Array.Empty<string>();

        // Get member's current settings (only if directory is enabled)
        var memberVisibleFields = clubDirectoryEnabled && !string.IsNullOrEmpty(member.DirectoryVisibleFields)
            ? member.DirectoryVisibleFields.Split(',', StringSplitOptions.RemoveEmptyEntries)
            : Array.Empty<string>();

        return new MemberDirectorySettingsResponse
        {
            ClubDirectoryEnabled = clubDirectoryEnabled,
            AdminAllowedSharableFields = adminAllowedFields,
            IsListed = clubDirectoryEnabled && member.IsListedInDirectory,
            VisibleFields = memberVisibleFields
        };
    }

    /// <summary>
    /// Updates the directory settings for the current member
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="request">The updated settings</param>
    /// <returns>Updated member directory settings</returns>
    public async Task<MemberDirectorySettingsResponse> UpdateMemberDirectorySettingsAsync(int userId, UpdateMemberDirectorySettingsRequest request)
    {
        _logger.LogInformation("Updating directory settings for user {UserId}: IsListed={IsListed}, VisibleFields={VisibleFields}",
            userId, request.IsListed, string.Join(",", request.VisibleFields));

        // Find the user and their member record
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new ArgumentException("User not found");
        }

        // Find the member record by email
        var member = await _context.Members
            .Include(m => m.Club)
            .FirstOrDefaultAsync(m => m.Email == user.Email);

        if (member == null)
        {
            throw new InvalidOperationException("Member record not found for this user");
        }

        // Check if directory is enabled by admin
        if (!member.Club.IsDirectoryEnabled)
        {
            throw new InvalidOperationException("The member directory is currently disabled for your club");
        }

        // Validate that visible fields are allowed by admin
        var adminAllowedFields = string.IsNullOrEmpty(member.Club.DirectoryAllowedSharableFields)
            ? Array.Empty<string>()
            : member.Club.DirectoryAllowedSharableFields.Split(',', StringSplitOptions.RemoveEmptyEntries);

        var invalidFields = request.VisibleFields.Where(f => !adminAllowedFields.Contains(f)).ToArray();
        if (invalidFields.Any())
        {
            throw new ArgumentException($"The following fields are not allowed by your club admin: {string.Join(", ", invalidFields)}");
        }

        // Update member settings
        member.IsListedInDirectory = request.IsListed;
        member.DirectoryVisibleFields = request.VisibleFields.Any()
            ? string.Join(",", request.VisibleFields)
            : null;
        member.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Directory settings updated successfully for user {UserId}", userId);

        // Return updated settings
        return new MemberDirectorySettingsResponse
        {
            ClubDirectoryEnabled = member.Club.IsDirectoryEnabled,
            AdminAllowedSharableFields = adminAllowedFields,
            IsListed = member.IsListedInDirectory,
            VisibleFields = request.VisibleFields
        };
    }
}