using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing club locations
/// </summary>
public class LocationManagementService : ILocationManagementService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<LocationManagementService> _logger;

    public LocationManagementService(
        GatherGroveDbContext context,
        ILogger<LocationManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new location for a club (Expand tier only)
    /// </summary>
    public async Task<LocationResponse> CreateLocationAsync(int clubId, int userId, CreateLocationRequest request)
    {
        _logger.LogInformation("Creating location {LocationName} for club {ClubId} by user {UserId}",
            request.LocationName, clubId, userId);

        // Verify club exists and user is admin
        var club = await _context.Clubs
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new ArgumentException($"Club {clubId} not found", nameof(clubId));
        }

        // Verify user is admin of this club
        var isAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("You do not have permission to create locations for this club");
        }

        // Verify club is on Expand tier
        if (club.Tier != "Expand" && club.Tier != "Unlimited")
        {
            throw new InvalidOperationException("Multi-location support is only available for Expand tier clubs");
        }

        // Check if location code is unique for this club
        var existingLocation = await _context.ClubLocations
            .FirstOrDefaultAsync(l => l.ParentClubId == clubId && l.LocationCode == request.LocationCode);

        if (existingLocation != null)
        {
            throw new ArgumentException($"Location code '{request.LocationCode}' already exists for this club", nameof(request.LocationCode));
        }

        var now = DateTime.UtcNow;
        var location = new ClubLocation
        {
            ParentClubId = clubId,
            LocationName = request.LocationName,
            LocationCode = request.LocationCode,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            Timezone = request.Timezone,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            SettingsJson = request.SettingsJson,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.ClubLocations.Add(location);
        await _context.SaveChangesAsync();

        // Create default branding for the location
        var branding = new LocationBranding
        {
            LocationId = location.Id,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.LocationBrandings.Add(branding);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created location {LocationId} for club {ClubId}", location.Id, clubId);

        return await GetLocationAsync(location.Id, userId);
    }

    /// <summary>
    /// Updates an existing location
    /// </summary>
    public async Task<LocationResponse> UpdateLocationAsync(int locationId, int userId, UpdateLocationRequest request)
    {
        _logger.LogInformation("Updating location {LocationId} by user {UserId}", locationId, userId);

        var location = await _context.ClubLocations
            .Include(l => l.ParentClub)
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify user is admin of the parent club
        var isAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == userId);

        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("You do not have permission to update this location");
        }

        // Update fields if provided
        if (!string.IsNullOrEmpty(request.LocationName))
            location.LocationName = request.LocationName;

        if (!string.IsNullOrEmpty(request.Address))
            location.Address = request.Address;

        if (!string.IsNullOrEmpty(request.City))
            location.City = request.City;

        if (!string.IsNullOrEmpty(request.State))
            location.State = request.State;

        if (!string.IsNullOrEmpty(request.Country))
            location.Country = request.Country;

        if (!string.IsNullOrEmpty(request.Timezone))
            location.Timezone = request.Timezone;

        if (!string.IsNullOrEmpty(request.ContactEmail))
            location.ContactEmail = request.ContactEmail;

        if (!string.IsNullOrEmpty(request.ContactPhone))
            location.ContactPhone = request.ContactPhone;

        if (request.IsActive.HasValue)
            location.IsActive = request.IsActive.Value;

        if (request.SettingsJson != null)
            location.SettingsJson = request.SettingsJson;

        location.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated location {LocationId}", locationId);

        return await GetLocationAsync(locationId, userId);
    }

    /// <summary>
    /// Gets a single location by ID with permission check
    /// </summary>
    public async Task<LocationResponse> GetLocationAsync(int locationId, int userId)
    {
        var location = await _context.ClubLocations
            .Include(l => l.ParentClub)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify user has access to this club
        var hasAccess = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == userId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to view this location");
        }

        // Get stats
        var memberCount = await _context.Members
            .CountAsync(m => m.LocationId == locationId && m.Status == "Active");

        var eventCount = await _context.Events
            .CountAsync(e => e.LocationId == locationId);

        var activeAdminCount = await _context.LocationAdmins
            .CountAsync(la => la.LocationId == locationId);

        return new LocationResponse
        {
            Id = location.Id,
            ParentClubId = location.ParentClubId,
            ParentClubName = location.ParentClub.Name,
            LocationName = location.LocationName,
            LocationCode = location.LocationCode,
            Address = location.Address,
            City = location.City,
            State = location.State,
            Country = location.Country,
            Timezone = location.Timezone,
            ContactEmail = location.ContactEmail,
            ContactPhone = location.ContactPhone,
            IsActive = location.IsActive,
            MemberCount = memberCount,
            EventCount = eventCount,
            ActiveAdminCount = activeAdminCount,
            CreatedAt = location.CreatedAt,
            UpdatedAt = location.UpdatedAt,
            SettingsJson = location.SettingsJson
        };
    }

    /// <summary>
    /// Gets all locations for a club
    /// </summary>
    public async Task<List<LocationResponse>> GetClubLocationsAsync(int clubId, int userId)
    {
        _logger.LogInformation("Getting locations for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user has access to this club
        var hasAccess = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to view locations for this club");
        }

        var locations = await _context.ClubLocations
            .Include(l => l.ParentClub)
            .Where(l => l.ParentClubId == clubId)
            .AsNoTracking()
            .ToListAsync();

        var responses = new List<LocationResponse>();

        foreach (var location in locations)
        {
            var memberCount = await _context.Members
                .CountAsync(m => m.LocationId == location.Id && m.Status == "Active");

            var eventCount = await _context.Events
                .CountAsync(e => e.LocationId == location.Id);

            var activeAdminCount = await _context.LocationAdmins
                .CountAsync(la => la.LocationId == location.Id);

            responses.Add(new LocationResponse
            {
                Id = location.Id,
                ParentClubId = location.ParentClubId,
                ParentClubName = location.ParentClub.Name,
                LocationName = location.LocationName,
                LocationCode = location.LocationCode,
                Address = location.Address,
                City = location.City,
                State = location.State,
                Country = location.Country,
                Timezone = location.Timezone,
                ContactEmail = location.ContactEmail,
                ContactPhone = location.ContactPhone,
                IsActive = location.IsActive,
                MemberCount = memberCount,
                EventCount = eventCount,
                ActiveAdminCount = activeAdminCount,
                CreatedAt = location.CreatedAt,
                UpdatedAt = location.UpdatedAt,
                SettingsJson = location.SettingsJson
            });
        }

        return responses;
    }

    /// <summary>
    /// Deactivates a location (soft delete)
    /// </summary>
    public async Task DeactivateLocationAsync(int locationId, int userId)
    {
        _logger.LogInformation("Deactivating location {LocationId} by user {UserId}", locationId, userId);

        var location = await _context.ClubLocations
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify user is admin of the parent club
        var isAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == userId);

        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("You do not have permission to deactivate this location");
        }

        // Prevent deactivating Main Location
        if (location.LocationCode == "MAIN")
        {
            throw new InvalidOperationException("Cannot deactivate the Main Location");
        }

        // Check if location has active members
        var activeMemberCount = await _context.Members
            .CountAsync(m => m.LocationId == locationId && m.Status == "Active");

        if (activeMemberCount > 0)
        {
            throw new InvalidOperationException($"Cannot deactivate location with {activeMemberCount} active members. Please transfer members first.");
        }

        location.IsActive = false;
        location.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deactivated location {LocationId}", locationId);
    }

    /// <summary>
    /// Gets detailed statistics for a location
    /// </summary>
    public async Task<LocationResponse> GetLocationStatsAsync(int locationId, int userId)
    {
        return await GetLocationAsync(locationId, userId);
    }
}

