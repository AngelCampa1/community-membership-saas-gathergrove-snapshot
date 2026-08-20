using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for migrating existing clubs to multi-location structure
/// </summary>
public class LocationMigrationService : ILocationMigrationService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<LocationMigrationService> _logger;

    public LocationMigrationService(
        GatherGroveDbContext context,
        ILogger<LocationMigrationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Runs the complete migration process
    /// </summary>
    public async Task RunCompleteMigrationAsync()
    {
        _logger.LogInformation("Starting complete multi-location migration");

        try
        {
            // Step 1: Create Main Location for all existing clubs
            await MigrateExistingClubsToLocationsAsync();

            // Step 2: Promote ClubAdmins to LocationAdmins with SuperAdmin permissions
            await PromoteClubAdminsToSuperAdminsAsync();

            // Step 3: Assign existing members to Main Location
            await AssignExistingMembersToMainLocationAsync();

            // Step 4: Assign existing events to Main Location
            await AssignExistingEventsToMainLocationAsync();

            _logger.LogInformation("Complete multi-location migration finished successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during multi-location migration");
            throw;
        }
    }

    /// <summary>
    /// Migrates all existing clubs to have a "Main Location"
    /// </summary>
    public async Task MigrateExistingClubsToLocationsAsync()
    {
        _logger.LogInformation("Migrating existing clubs to locations");

        // Get all clubs that don't have a Main Location yet
        var clubs = await _context.Clubs
            .Where(c => !_context.ClubLocations.Any(l => l.ParentClubId == c.Id && l.LocationCode == "MAIN"))
            .ToListAsync();

        var now = DateTime.UtcNow;
        var locationsToAdd = new List<ClubLocation>();
        var brandingsToAdd = new List<LocationBranding>();

        foreach (var club in clubs)
        {
            _logger.LogInformation("Creating Main Location for club {ClubId} - {ClubName}", club.Id, club.Name);

            var mainLocation = new ClubLocation
            {
                ParentClubId = club.Id,
                LocationName = "Main Location",
                LocationCode = "MAIN",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            locationsToAdd.Add(mainLocation);

            // Create default branding for the location
            var locationBranding = new LocationBranding
            {
                LocationId = mainLocation.Id,
                CreatedAt = now,
                UpdatedAt = now
            };

            brandingsToAdd.Add(locationBranding);
        }

        if (locationsToAdd.Any())
        {
            await _context.ClubLocations.AddRangeAsync(locationsToAdd);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created {Count} Main Locations", locationsToAdd.Count);

            // Now add brandings after locations are saved (to get IDs)
            foreach (var location in locationsToAdd)
            {
                var branding = new LocationBranding
                {
                    LocationId = location.Id,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                await _context.LocationBrandings.AddAsync(branding);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Created {Count} Location Brandings", locationsToAdd.Count);
        }
        else
        {
            _logger.LogInformation("No clubs need migration - all clubs already have Main Location");
        }
    }

    /// <summary>
    /// Promotes all existing ClubAdmins to LocationAdmins with SuperAdmin permissions
    /// </summary>
    public async Task PromoteClubAdminsToSuperAdminsAsync()
    {
        _logger.LogInformation("Promoting ClubAdmins to LocationAdmins with SuperAdmin permissions");

        // Get all ClubAdmins
        var clubAdmins = await _context.ClubAdmins
            .Include(ca => ca.Club)
            .ToListAsync();

        var locationAdminsToAdd = new List<LocationAdmin>();
        var now = DateTime.UtcNow;

        foreach (var clubAdmin in clubAdmins)
        {
            // Get the Main Location for this club
            var mainLocation = await _context.ClubLocations
                .FirstOrDefaultAsync(l => l.ParentClubId == clubAdmin.ClubId && l.LocationCode == "MAIN");

            if (mainLocation == null)
            {
                _logger.LogWarning("No Main Location found for club {ClubId}, skipping admin {UserId}",
                    clubAdmin.ClubId, clubAdmin.UserId);
                continue;
            }

            // Check if LocationAdmin relationship already exists
            var existingLocationAdmin = await _context.LocationAdmins
                .FirstOrDefaultAsync(la => la.LocationId == mainLocation.Id && la.UserId == clubAdmin.UserId);

            if (existingLocationAdmin != null)
            {
                _logger.LogInformation("LocationAdmin already exists for location {LocationId}, user {UserId}",
                    mainLocation.Id, clubAdmin.UserId);
                continue;
            }

            _logger.LogInformation("Creating LocationAdmin (SuperAdmin) for location {LocationId}, user {UserId}",
                mainLocation.Id, clubAdmin.UserId);

            var locationAdmin = new LocationAdmin
            {
                LocationId = mainLocation.Id,
                UserId = clubAdmin.UserId,
                PermissionLevel = LocationPermissionLevel.SuperAdmin,
                AssignedAt = now,
                AssignedBy = null // Automatic migration
            };

            locationAdminsToAdd.Add(locationAdmin);
        }

        if (locationAdminsToAdd.Any())
        {
            await _context.LocationAdmins.AddRangeAsync(locationAdminsToAdd);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created {Count} LocationAdmin relationships", locationAdminsToAdd.Count);
        }
        else
        {
            _logger.LogInformation("No ClubAdmins need migration - all admins already have LocationAdmin relationships");
        }
    }

    /// <summary>
    /// Assigns all existing members to their club's Main Location
    /// </summary>
    public async Task AssignExistingMembersToMainLocationAsync()
    {
        _logger.LogInformation("Assigning existing members to Main Location");

        // Get all members without a location assigned
        var membersWithoutLocation = await _context.Members
            .Where(m => m.LocationId == null)
            .ToListAsync();

        var updatedCount = 0;

        foreach (var member in membersWithoutLocation)
        {
            // Get the Main Location for this member's club
            var mainLocation = await _context.ClubLocations
                .FirstOrDefaultAsync(l => l.ParentClubId == member.ClubId && l.LocationCode == "MAIN");

            if (mainLocation == null)
            {
                _logger.LogWarning("No Main Location found for club {ClubId}, skipping member {MemberId}",
                    member.ClubId, member.Id);
                continue;
            }

            member.LocationId = mainLocation.Id;
            member.UpdatedAt = DateTime.UtcNow;
            updatedCount++;
        }

        if (updatedCount > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Assigned {Count} members to Main Location", updatedCount);
        }
        else
        {
            _logger.LogInformation("No members need location assignment - all members already have locations");
        }
    }

    /// <summary>
    /// Assigns all existing events to their club's Main Location
    /// </summary>
    public async Task AssignExistingEventsToMainLocationAsync()
    {
        _logger.LogInformation("Assigning existing events to Main Location");

        // Get all events without a location assigned
        var eventsWithoutLocation = await _context.Events
            .Where(e => e.LocationId == null)
            .ToListAsync();

        var updatedCount = 0;

        foreach (var eventEntity in eventsWithoutLocation)
        {
            // Get the Main Location for this event's club
            var mainLocation = await _context.ClubLocations
                .FirstOrDefaultAsync(l => l.ParentClubId == eventEntity.ClubId && l.LocationCode == "MAIN");

            if (mainLocation == null)
            {
                _logger.LogWarning("No Main Location found for club {ClubId}, skipping event {EventId}",
                    eventEntity.ClubId, eventEntity.Id);
                continue;
            }

            eventEntity.LocationId = mainLocation.Id;
            eventEntity.UpdatedAt = DateTime.UtcNow;
            updatedCount++;
        }

        if (updatedCount > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Assigned {Count} events to Main Location", updatedCount);
        }
        else
        {
            _logger.LogInformation("No events need location assignment - all events already have locations");
        }
    }
}

