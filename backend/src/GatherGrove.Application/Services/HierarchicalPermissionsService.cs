using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing hierarchical location permissions
/// </summary>
public class HierarchicalPermissionsService : IHierarchicalPermissionsService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<HierarchicalPermissionsService> _logger;

    public HierarchicalPermissionsService(
        GatherGroveDbContext context,
        ILogger<HierarchicalPermissionsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Assigns an admin to a location with specified permission level
    /// </summary>
    public async Task<LocationAdminResponse> AssignLocationAdminAsync(int locationId, int assigningUserId, AssignLocationAdminRequest request)
    {
        _logger.LogInformation("Assigning user {UserId} as {PermissionLevel} to location {LocationId} by {AssigningUserId}",
            request.UserId, request.PermissionLevel, locationId, assigningUserId);

        var location = await _context.ClubLocations
            .Include(l => l.ParentClub)
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify assigning user has permission (must be club admin or SuperAdmin of this location)
        var assigningUserIsClubAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == assigningUserId);

        var assigningUserIsSuperAdmin = await _context.LocationAdmins
            .AnyAsync(la => la.LocationId == locationId &&
                           la.UserId == assigningUserId &&
                           la.PermissionLevel == LocationPermissionLevel.SuperAdmin);

        if (!assigningUserIsClubAdmin && !assigningUserIsSuperAdmin)
        {
            throw new UnauthorizedAccessException("You do not have permission to assign admins to this location");
        }

        // Verify user to be assigned exists
        var userToAssign = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (userToAssign == null)
        {
            throw new ArgumentException($"User {request.UserId} not found", nameof(request.UserId));
        }

        // Check if already assigned
        var existing = await _context.LocationAdmins
            .FirstOrDefaultAsync(la => la.LocationId == locationId && la.UserId == request.UserId);

        if (existing != null)
        {
            // Update permission level
            existing.PermissionLevel = request.PermissionLevel;
            existing.AssignedAt = DateTime.UtcNow;
            existing.AssignedBy = assigningUserId;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated permission level for user {UserId} at location {LocationId}",
                request.UserId, locationId);
        }
        else
        {
            // Create new assignment
            var locationAdmin = new LocationAdmin
            {
                LocationId = locationId,
                UserId = request.UserId,
                PermissionLevel = request.PermissionLevel,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = assigningUserId
            };

            _context.LocationAdmins.Add(locationAdmin);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Assigned user {UserId} to location {LocationId}", request.UserId, locationId);
        }

        // Return the assignment details
        var result = await _context.LocationAdmins
            .Include(la => la.User)
            .Include(la => la.Location)
            .Include(la => la.AssignedByUser)
            .FirstAsync(la => la.LocationId == locationId && la.UserId == request.UserId);

        return MapToResponse(result);
    }

    /// <summary>
    /// Removes an admin from a location
    /// </summary>
    public async Task RemoveLocationAdminAsync(int locationId, int userId, int removingUserId)
    {
        _logger.LogInformation("Removing user {UserId} from location {LocationId} by {RemovingUserId}",
            userId, locationId, removingUserId);

        var location = await _context.ClubLocations
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify removing user has permission
        var removingUserIsClubAdmin = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == removingUserId);

        if (!removingUserIsClubAdmin)
        {
            throw new UnauthorizedAccessException("You do not have permission to remove admins from this location");
        }

        var locationAdmin = await _context.LocationAdmins
            .FirstOrDefaultAsync(la => la.LocationId == locationId && la.UserId == userId);

        if (locationAdmin == null)
        {
            throw new ArgumentException($"User {userId} is not an admin of location {locationId}");
        }

        _context.LocationAdmins.Remove(locationAdmin);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Removed user {UserId} from location {LocationId}", userId, locationId);
    }

    /// <summary>
    /// Gets all locations a user can access with their permission levels
    /// </summary>
    public async Task<List<LocationAdminResponse>> GetUserLocationPermissionsAsync(int userId, int clubId)
    {
        _logger.LogInformation("Getting location permissions for user {UserId} in club {ClubId}", userId, clubId);

        var permissions = await _context.LocationAdmins
            .Include(la => la.User)
            .Include(la => la.Location)
            .Include(la => la.AssignedByUser)
            .Where(la => la.UserId == userId && la.Location.ParentClubId == clubId)
            .AsNoTracking()
            .ToListAsync();

        return permissions.Select(MapToResponse).ToList();
    }

    /// <summary>
    /// Checks if a user has the required permission level for a location
    /// </summary>
    public async Task<bool> CheckLocationPermissionAsync(int userId, int locationId, LocationPermissionLevel requiredLevel)
    {
        var userPermission = await _context.LocationAdmins
            .AsNoTracking()
            .FirstOrDefaultAsync(la => la.UserId == userId && la.LocationId == locationId);

        if (userPermission == null)
        {
            // Check if user is club admin (which grants SuperAdmin to all locations)
            var location = await _context.ClubLocations
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == locationId);

            if (location != null)
            {
                var isClubAdmin = await _context.ClubAdmins
                    .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == userId);

                if (isClubAdmin)
                {
                    return true; // Club admins have full access
                }
            }

            return false;
        }

        // Check if user's permission level is sufficient
        // Lower enum values = higher permissions (SuperAdmin = 1, Staff = 5)
        return userPermission.PermissionLevel <= requiredLevel;
    }

    /// <summary>
    /// Gets all admins for a location
    /// </summary>
    public async Task<List<LocationAdminResponse>> GetLocationAdminsAsync(int locationId, int requestingUserId)
    {
        _logger.LogInformation("Getting admins for location {LocationId} by user {UserId}",
            locationId, requestingUserId);

        var location = await _context.ClubLocations
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null)
        {
            throw new ArgumentException($"Location {locationId} not found", nameof(locationId));
        }

        // Verify requesting user has access
        var hasAccess = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == location.ParentClubId && ca.UserId == requestingUserId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to view admins for this location");
        }

        var admins = await _context.LocationAdmins
            .Include(la => la.User)
            .Include(la => la.Location)
            .Include(la => la.AssignedByUser)
            .Where(la => la.LocationId == locationId)
            .AsNoTracking()
            .ToListAsync();

        return admins.Select(MapToResponse).ToList();
    }

    private static LocationAdminResponse MapToResponse(LocationAdmin locationAdmin)
    {
        return new LocationAdminResponse
        {
            Id = locationAdmin.Id,
            LocationId = locationAdmin.LocationId,
            LocationName = locationAdmin.Location.LocationName,
            UserId = locationAdmin.UserId,
            UserFullName = locationAdmin.User.FullName,
            UserEmail = locationAdmin.User.Email,
            PermissionLevel = locationAdmin.PermissionLevel,
            PermissionLevelName = locationAdmin.PermissionLevel.ToString(),
            AssignedAt = locationAdmin.AssignedAt,
            AssignedBy = locationAdmin.AssignedBy,
            AssignedByName = locationAdmin.AssignedByUser?.FullName
        };
    }
}

