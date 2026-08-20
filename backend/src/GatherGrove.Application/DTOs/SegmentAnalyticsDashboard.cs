using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for segment analytics dashboard data
/// </summary>
public class SegmentAnalyticsDashboard
{
    /// <summary>
    /// Total number of segments in the club
    /// </summary>
    public int TotalSegments { get; set; }

    /// <summary>
    /// Number of active segments
    /// </summary>
    public int ActiveSegments { get; set; }

    /// <summary>
    /// Dashboard overview statistics
    /// </summary>
    public DashboardOverview Overview { get; set; } = new();

    /// <summary>
    /// Top performing segments
    /// </summary>
    public List<SegmentPerformanceSummary> TopSegments { get; set; } = new();

    /// <summary>
    /// Segments that need attention
    /// </summary>
    public List<SegmentAlert> AlertSegments { get; set; } = new();

    /// <summary>
    /// Recent trends and changes
    /// </summary>
    public List<TrendSummary> RecentTrends { get; set; } = new();

    /// <summary>
    /// Key metrics charts data
    /// </summary>
    public List<ChartData> ChartsData { get; set; } = new();

    /// <summary>
    /// Activity summary for the current period
    /// </summary>
    public ActivitySummary ActivitySummary { get; set; } = new();

    /// <summary>
    /// When the dashboard was last updated
    /// </summary>
    public DateTime LastUpdated { get; set; }

    /// <summary>
    /// Date range for the analytics data
    /// </summary>
    public DateRange DateRange { get; set; } = new();
}

// ActivitySummary class already exists elsewhere - using existing definition

// DateRange class already exists elsewhere - using existing definition