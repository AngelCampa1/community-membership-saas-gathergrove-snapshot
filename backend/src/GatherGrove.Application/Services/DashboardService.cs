using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for dashboard data operations and statistics
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<DashboardService> _logger;
    private readonly IMemoryCache _cache;

    // Tier limits based on user story requirements
    private const int SPROUT_MEMBER_LIMIT = 50;
    private const int SEED_MEMBER_LIMIT = 100;
    private const int GROW_MEMBER_LIMIT = 200;
    private const int EXPAND_MEMBER_LIMIT = 2000;

    // Cache settings
    private static readonly TimeSpan DASHBOARD_CACHE_DURATION = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan CLUB_INFO_CACHE_DURATION = TimeSpan.FromHours(1);

    public DashboardService(GatherGroveDbContext context, ILogger<DashboardService> logger, IMemoryCache cache)
    {
        _context = context;
        _logger = logger;
        _cache = cache;
    }

    /// <summary>
    /// Gets summary statistics for a club's dashboard
    /// </summary>
    /// <param name="clubId">The unique identifier of the club</param>
    /// <returns>Dashboard summary data including member count, dues collected, and upcoming events</returns>
    public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync(int clubId)
    {
        try
        {
            // Check cache first
            var cacheKey = $"dashboard_summary_{clubId}";
            if (_cache.TryGetValue(cacheKey, out DashboardSummaryResponse? cachedSummary))
            {
                return cachedSummary!;
            }

            _logger.LogInformation("Getting dashboard summary for club: {ClubId}", clubId);

            // Get club information with caching
            var club = await GetClubInfoAsync(clubId);
            if (club == null)
            {
                _logger.LogWarning("Club not found: {ClubId}", clubId);
                throw new InvalidOperationException($"Club with ID {clubId} not found.");
            }

            // Optimize date range queries - avoid .Year property in SQL
            var currentYear = DateTime.UtcNow.Year;
            var startOfYear = new DateTime(currentYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var startOfNextYear = new DateTime(currentYear + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var now = DateTime.UtcNow;

            // Execute queries with optimized date ranges and new indexes
            var memberCount = await _context.Members
                .AsNoTracking()
                .Where(m => m.ClubId == clubId && m.Status == "Active")
                .CountAsync();

            // Optimized dues query using date range instead of .Year
            var duesCollected = await _context.Payments
                .AsNoTracking()
                .Where(p => p.ClubId == clubId &&
                           p.PaymentDate >= startOfYear &&
                           p.PaymentDate < startOfNextYear)
                .SumAsync(p => p.Amount);

            // Upcoming events query (already optimized with existing index)
            var upcomingEvents = await _context.Events
                .AsNoTracking()
                .Where(e => e.ClubId == clubId && e.EventDateTime >= now)
                .CountAsync();

            // Determine member limit based on tier
            var memberLimit = club.Tier.ToLower() switch
            {
                "sprout" => SPROUT_MEMBER_LIMIT,
                "seed" => SEED_MEMBER_LIMIT,
                "grow" => GROW_MEMBER_LIMIT,
                "unlimited" or "expand" => EXPAND_MEMBER_LIMIT,
                _ => SPROUT_MEMBER_LIMIT // Default to Sprout limits
            };

            var summary = new DashboardSummaryResponse
            {
                CurrentTier = club.Tier,
                MemberCount = memberCount,
                MemberLimit = memberLimit,
                DuesCollectedYTD = duesCollected,
                UpcomingEventCount = upcomingEvents
            };

            // Cache the result
            _cache.Set(cacheKey, summary, DASHBOARD_CACHE_DURATION);

            _logger.LogInformation("Dashboard summary retrieved for club: {ClubId}, Members: {MemberCount}, Dues: ${DuesCollected}, Events: {UpcomingEvents}",
                clubId, memberCount, duesCollected, upcomingEvents);

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard summary for club: {ClubId}", clubId);
            throw;
        }
    }

    /// <summary>
    /// Gets club information with caching
    /// </summary>
    private async Task<GatherGrove.Domain.Entities.Club?> GetClubInfoAsync(int clubId)
    {
        var cacheKey = $"club_info_{clubId}";
        if (_cache.TryGetValue(cacheKey, out GatherGrove.Domain.Entities.Club? cachedClub))
        {
            return cachedClub;
        }

        var club = await _context.Clubs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club != null)
        {
            _cache.Set(cacheKey, club, CLUB_INFO_CACHE_DURATION);
        }

        return club;
    }
}
