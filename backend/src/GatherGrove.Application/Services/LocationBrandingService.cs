using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing location-specific branding
/// </summary>
public class LocationBrandingService : ILocationBrandingService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<LocationBrandingService> _logger;

    public LocationBrandingService(
        GatherGroveDbContext context,
        ILogger<LocationBrandingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Updates branding for a location
    /// </summary>
    public async Task<LocationBrandingResponse> UpdateLocationBrandingAsync(int locationId, int userId, UpdateLocationBrandingRequest request)
    {
        _logger.LogInformation("Updating branding for location {LocationId} by user {UserId}", locationId, userId);

        var location = await _context.ClubLocations
            .Include(l => l.ParentClub)
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify user has permission
        var hasPermission = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == userId);

        if (!hasPermission)
        {
            throw new UnauthorizedAccessException("You do not have permission to update branding for this location");
        }

        // Verify club is on Expand tier
        if (location.ParentClub.Tier != "Expand" && location.ParentClub.Tier != "Unlimited")
        {
            throw new InvalidOperationException("Location-specific branding is only available for Expand tier clubs");
        }

        var branding = await _context.LocationBrandings
            .FirstOrDefaultAsync(b => b.LocationId == locationId);

        if (branding == null)
        {
            // Create new branding if it doesn't exist
            branding = new Domain.Entities.LocationBranding
            {
                LocationId = locationId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.LocationBrandings.Add(branding);
        }

        // Update fields
        if (request.CustomLogoUrl != null)
            branding.CustomLogoUrl = request.CustomLogoUrl;

        if (request.ColorScheme != null)
            branding.ColorScheme = request.ColorScheme;

        if (request.CustomNameOverride != null)
            branding.CustomNameOverride = request.CustomNameOverride;

        if (request.SettingsJson != null)
            branding.SettingsJson = request.SettingsJson;

        branding.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated branding for location {LocationId}", locationId);

        return await GetLocationBrandingAsync(locationId);
    }

    /// <summary>
    /// Gets branding for a location (public access)
    /// </summary>
    public async Task<LocationBrandingResponse> GetLocationBrandingAsync(int locationId)
    {
        var branding = await _context.LocationBrandings
            .Include(b => b.Location)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.LocationId == locationId);

        if (branding == null)
        {
            throw new ArgumentException($"Branding not found for location {locationId}", nameof(locationId));
        }

        return new LocationBrandingResponse
        {
            Id = branding.Id,
            LocationId = branding.LocationId,
            LocationName = branding.Location.LocationName,
            CustomLogoUrl = branding.CustomLogoUrl,
            ColorScheme = branding.ColorScheme,
            CustomNameOverride = branding.CustomNameOverride,
            SettingsJson = branding.SettingsJson,
            CreatedAt = branding.CreatedAt,
            UpdatedAt = branding.UpdatedAt
        };
    }
}

