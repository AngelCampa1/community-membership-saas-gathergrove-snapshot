using GatherGrove.Application.DTOs.Locations;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing club locations
/// </summary>
public interface ILocationManagementService
{
    /// <summary>
    /// Creates a new location for a club (Unlimited tier only)
    /// </summary>
    Task<LocationResponse> CreateLocationAsync(int clubId, int userId, CreateLocationRequest request);

    /// <summary>
    /// Updates an existing location
    /// </summary>
    Task<LocationResponse> UpdateLocationAsync(int locationId, int userId, UpdateLocationRequest request);

    /// <summary>
    /// Gets a single location by ID with permission check
    /// </summary>
    Task<LocationResponse> GetLocationAsync(int locationId, int userId);

    /// <summary>
    /// Gets all locations for a club
    /// </summary>
    Task<List<LocationResponse>> GetClubLocationsAsync(int clubId, int userId);

    /// <summary>
    /// Deactivates a location (soft delete)
    /// </summary>
    Task DeactivateLocationAsync(int locationId, int userId);

    /// <summary>
    /// Gets detailed statistics for a location
    /// </summary>
    Task<LocationResponse> GetLocationStatsAsync(int locationId, int userId);
}

