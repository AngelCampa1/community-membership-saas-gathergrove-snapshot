using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for dashboard data operations
/// </summary>
public interface IDashboardService
{
    /// <summary>
    /// Gets summary statistics for a club's dashboard
    /// </summary>
    /// <param name="clubId">The unique identifier of the club</param>
    /// <returns>Dashboard summary data including member count, dues collected, and upcoming events</returns>
    Task<DashboardSummaryResponse> GetDashboardSummaryAsync(int clubId);
}