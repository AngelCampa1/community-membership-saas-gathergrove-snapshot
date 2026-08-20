using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for cross-location reporting and analytics
/// </summary>
public class CrossLocationReportingService : ICrossLocationReportingService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<CrossLocationReportingService> _logger;

    public CrossLocationReportingService(
        GatherGroveDbContext context,
        ILogger<CrossLocationReportingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets consolidated dashboard showing all locations
    /// </summary>
    public async Task<ConsolidatedDashboardResponse> GetConsolidatedDashboardAsync(int clubId, int userId)
    {
        _logger.LogInformation("Getting consolidated dashboard for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user has access to this club
        var hasAccess = await _context.ClubAdmins
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == userId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to view reports for this club");
        }

        var club = await _context.Clubs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new ArgumentException($"Club {clubId} not found", nameof(clubId));
        }

        // Verify club is on Expand tier
        if (club.Tier != "Expand" && club.Tier != "Unlimited")
        {
            throw new InvalidOperationException("Cross-location reporting is only available for Expand tier clubs");
        }

        var locations = await _context.ClubLocations
            .Where(l => l.ParentClubId == clubId)
            .AsNoTracking()
            .ToListAsync();

        var locationSummaries = new List<LocationDashboardSummary>();
        var totalMembers = 0;
        var totalEvents = 0;
        var totalActiveLocations = 0;

        foreach (var location in locations)
        {
            var activeMembers = await _context.Members
                .CountAsync(m => m.LocationId == location.Id && m.Status == "Active");

            var upcomingEvents = await _context.Events
                .CountAsync(e => e.LocationId == location.Id && e.EventDateTime >= DateTime.UtcNow);

            locationSummaries.Add(new LocationDashboardSummary
            {
                Id = location.Id,
                LocationName = location.LocationName,
                LocationCode = location.LocationCode,
                ActiveMembers = activeMembers,
                UpcomingEvents = upcomingEvents,
                IsActive = location.IsActive
            });

            totalMembers += activeMembers;
            totalEvents += upcomingEvents;
            if (location.IsActive) totalActiveLocations++;
        }

        return new ConsolidatedDashboardResponse
        {
            ClubId = clubId,
            ClubName = club.Name,
            Locations = locationSummaries,
            TotalMembers = totalMembers,
            TotalEvents = totalEvents,
            TotalActiveLocations = totalActiveLocations
        };
    }
}

