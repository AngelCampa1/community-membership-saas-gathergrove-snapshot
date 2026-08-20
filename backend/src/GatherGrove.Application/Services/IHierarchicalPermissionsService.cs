using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing hierarchical location permissions
/// </summary>
public interface IHierarchicalPermissionsService
{
    /// <summary>
    /// Assigns an admin to a location with specified permission level
    /// </summary>
    Task<LocationAdminResponse> AssignLocationAdminAsync(int locationId, int assigningUserId, AssignLocationAdminRequest request);

    /// <summary>
    /// Removes an admin from a location
    /// </summary>
    Task RemoveLocationAdminAsync(int locationId, int userId, int removingUserId);

    /// <summary>
    /// Gets all locations a user can access with their permission levels
    /// </summary>
    Task<List<LocationAdminResponse>> GetUserLocationPermissionsAsync(int userId, int clubId);

    /// <summary>
    /// Checks if a user has the required permission level for a location
    /// </summary>
    Task<bool> CheckLocationPermissionAsync(int userId, int locationId, LocationPermissionLevel requiredLevel);

    /// <summary>
    /// Gets all admins for a location
    /// </summary>
    Task<List<LocationAdminResponse>> GetLocationAdminsAsync(int locationId, int requestingUserId);
}

