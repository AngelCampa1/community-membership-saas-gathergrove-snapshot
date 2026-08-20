using GatherGrove.Application.DTOs.Locations;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing location-specific branding
/// </summary>
public interface ILocationBrandingService
{
    /// <summary>
    /// Updates branding for a location
    /// </summary>
    Task<LocationBrandingResponse> UpdateLocationBrandingAsync(int locationId, int userId, UpdateLocationBrandingRequest request);

    /// <summary>
    /// Gets branding for a location (public access)
    /// </summary>
    Task<LocationBrandingResponse> GetLocationBrandingAsync(int locationId);
}

