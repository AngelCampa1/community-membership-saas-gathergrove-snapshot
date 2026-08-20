using GatherGrove.Application.DTOs.Locations;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for cross-location reporting and analytics
/// </summary>
public interface ICrossLocationReportingService
{
    /// <summary>
    /// Gets consolidated dashboard showing all locations
    /// </summary>
    Task<ConsolidatedDashboardResponse> GetConsolidatedDashboardAsync(int clubId, int userId);
}

