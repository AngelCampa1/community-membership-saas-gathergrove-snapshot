using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Services.Interfaces;

namespace GatherGrove.Application.Repositories;

/// <summary>
/// Repository implementation for event operations
/// NOTE: Temporarily in Application layer to avoid circular dependency with Infrastructure
/// </summary>
public class EventRepository : IEventRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventRepository> _logger;

    public EventRepository(
        GatherGroveDbContext context,
        ILogger<EventRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Event>> GetEventsByClubIdAsync(int clubId)
    {
        return await _context.Events
            .AsNoTracking()
            .Where(e => e.ClubId == clubId)
            .OrderByDescending(e => e.EventDateTime)
            .ToListAsync();
    }

    public async Task<Event?> GetByIdAsync(int eventId)
    {
        return await _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .FirstOrDefaultAsync(e => e.Id == eventId);
    }

    public async Task<List<Event>> GetEventsByDateRangeAsync(int clubId, DateTime startDate, DateTime endDate)
    {
        return await _context.Events
            .AsNoTracking()
            .Where(e => e.ClubId == clubId && e.EventDateTime >= startDate && e.EventDateTime <= endDate)
            .OrderBy(e => e.EventDateTime)
            .ToListAsync();
    }

    public async Task<List<Event>> GetUpcomingEventsAsync(int clubId)
    {
        var now = DateTime.UtcNow;
        return await _context.Events
            .AsNoTracking()
            .Where(e => e.ClubId == clubId && e.EventDateTime >= now)
            .OrderBy(e => e.EventDateTime)
            .ToListAsync();
    }

    public async Task<List<Event>> GetPastEventsAsync(int clubId)
    {
        var now = DateTime.UtcNow;
        return await _context.Events
            .AsNoTracking()
            .Where(e => e.ClubId == clubId && e.EventDateTime < now)
            .OrderByDescending(e => e.EventDateTime)
            .ToListAsync();
    }

    public async Task<Event> CreateAsync(Event eventEntity)
    {
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity;
    }

    public async Task<Event> UpdateAsync(Event eventEntity)
    {
        _context.Events.Update(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity;
    }

    public async Task DeleteAsync(int eventId)
    {
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity != null)
        {
            _context.Events.Remove(eventEntity);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<EventAnalyticsMetrics?> GetEventAnalyticsAsync(int eventId)
    {
        var eventEntity = await _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (eventEntity == null)
            return null;

        var totalRsvps = eventEntity.EventRsvps.Count;
        var attendedCount = eventEntity.EventAttendances.Count;
        var attendanceRate = totalRsvps > 0 ? (decimal)attendedCount / totalRsvps * 100 : 0;

        return new EventAnalyticsMetrics
        {
            EventId = eventId,
            TotalRegistrations = totalRsvps,
            TotalAttendees = attendedCount,
            AttendanceRate = attendanceRate,
            ClubId = eventEntity.ClubId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public async Task<EventAnalyticsMetrics?> GetEventAnalyticsAsync(int clubId, DateTime startDate, DateTime endDate, string? eventType)
    {
        var query = _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .Where(e => e.ClubId == clubId && e.EventDateTime >= startDate && e.EventDateTime <= endDate);

        var events = await query.ToListAsync();

        if (!events.Any())
            return null;

        var totalRsvps = events.Sum(e => e.EventRsvps.Count);
        var totalAttended = events.Sum(e => e.EventAttendances.Count);
        var attendanceRate = totalRsvps > 0 ? (decimal)totalAttended / totalRsvps * 100 : 0;

        return new EventAnalyticsMetrics
        {
            EventId = 0, // Aggregate metric
            TotalRegistrations = totalRsvps,
            TotalAttendees = totalAttended,
            AttendanceRate = attendanceRate,
            ClubId = clubId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public async Task<List<Event>> GetEventsRequiringFollowUpAsync(int clubId)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-7);
        return await _context.Events
            .AsNoTracking()
            .Where(e => e.ClubId == clubId && e.EventDateTime < cutoffDate)
            .OrderByDescending(e => e.EventDateTime)
            .ToListAsync();
    }

    public async Task<double> GetAverageAttendanceRateAsync(int clubId)
    {
        var events = await _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .Where(e => e.ClubId == clubId && e.EventDateTime < DateTime.UtcNow)
            .ToListAsync();

        if (!events.Any())
            return 0;

        var rates = events
            .Where(e => e.EventRsvps.Any())
            .Select(e => (double)e.EventAttendances.Count / e.EventRsvps.Count * 100);

        return rates.Any() ? rates.Average() : 0;
    }

    public async Task<EventTrendAnalysis> GetEventTrendAnalysisAsync(int clubId, DateTime startDate, DateTime endDate)
    {
        var events = await _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .Where(e => e.ClubId == clubId && e.EventDateTime >= startDate && e.EventDateTime <= endDate)
            .ToListAsync();

        return new EventTrendAnalysis
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate,
            TotalEvents = events.Count,
            TotalRsvps = events.Sum(e => e.EventRsvps.Count),
            TotalAttendance = events.Sum(e => e.EventAttendances.Count),
            AverageAttendanceRate = events.Any() ? events.Average(e =>
                e.EventRsvps.Any() ? (double)e.EventAttendances.Count / e.EventRsvps.Count * 100 : 0) : 0
        };
    }

    public async Task<MonthlyEventSummary> GetMonthlyEventSummaryAsync(int clubId, int year, int month)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var events = await _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .Where(e => e.ClubId == clubId && e.EventDateTime >= startDate && e.EventDateTime < endDate)
            .ToListAsync();

        return new MonthlyEventSummary
        {
            ClubId = clubId,
            Year = year,
            Month = month,
            TotalEvents = events.Count,
            TotalRsvps = events.Sum(e => e.EventRsvps.Count),
            TotalAttendance = events.Sum(e => e.EventAttendances.Count)
        };
    }

    public Task<List<EventFeedback>> GetEventFeedbackAsync(int eventId)
    {
        // EventFeedback is not currently implemented as a DbSet
        // Return empty list for now
        _logger.LogInformation("GetEventFeedbackAsync called for event {EventId}", eventId);
        return Task.FromResult(new List<EventFeedback>());
    }

    public Task<List<EventPhoto>> GetEventPhotosAsync(int eventId)
    {
        // EventPhotos is not currently implemented as a DbSet
        // Return empty list for now
        _logger.LogInformation("GetEventPhotosAsync called for event {EventId}", eventId);
        return Task.FromResult(new List<EventPhoto>());
    }

    public Task<List<EventTestimonial>> GetEventTestimonialsAsync(int eventId)
    {
        // EventTestimonials is not currently implemented as a DbSet
        // Return empty list for now
        _logger.LogInformation("GetEventTestimonialsAsync called for event {EventId}", eventId);
        return Task.FromResult(new List<EventTestimonial>());
    }

    public async Task<List<EngagementAnalytics>> GetEngagementAnalyticsAsync(int clubId, EventExportOptions options)
    {
        var query = _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .Where(e => e.ClubId == clubId);

        if (options.StartDate.HasValue)
        {
            query = query.Where(e => e.EventDateTime >= options.StartDate.Value);
        }

        if (options.EndDate.HasValue)
        {
            query = query.Where(e => e.EventDateTime <= options.EndDate.Value);
        }

        var events = await query.ToListAsync();

        return events.Select(e => new EngagementAnalytics
        {
            ClubId = clubId,
            EventName = e.Title,
            TotalEvents = e.EventRsvps.Count,
            TotalAttendance = e.EventAttendances.Count,
            AverageAttendancePerEvent = e.EventRsvps.Any() ? (double)e.EventAttendances.Count / e.EventRsvps.Count * 100 : 0,
            EngagementScore = e.EventRsvps.Any() ? (double)e.EventAttendances.Count / e.EventRsvps.Count * 100 : 0
        }).ToList();
    }

    public async Task<List<MemberParticipation>> GetMemberEventParticipationAsync(int clubId, EventExportOptions options)
    {
        var query = _context.EventAttendances
            .AsNoTracking()
            .Include(a => a.Event)
            .Include(a => a.Member)
            .Where(a => a.Event.ClubId == clubId);

        if (options.StartDate.HasValue)
        {
            query = query.Where(a => a.Event.EventDateTime >= options.StartDate.Value);
        }

        if (options.EndDate.HasValue)
        {
            query = query.Where(a => a.Event.EventDateTime <= options.EndDate.Value);
        }

        var attendances = await query.ToListAsync();

        return attendances
            .GroupBy(a => a.MemberId)
            .Select(g => new MemberParticipation
            {
                MemberId = g.Key,
                MemberName = g.First().Member?.FullName ?? "Unknown",
                TotalEventsAttended = g.Count(),
                EventsAttended = g.Count(),
                LastAttendance = g.Max(a => a.AttendedAt),
                AttendanceRate = 100.0 // Would need to calculate against total RSVPs
            }).ToList();
    }

    public async Task<List<EventAnalytics>> GetEventAnalyticsForExportAsync(int clubId, EventExportOptions options)
    {
        var query = _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .Where(e => e.ClubId == clubId);

        if (options.StartDate.HasValue)
        {
            query = query.Where(e => e.EventDateTime >= options.StartDate.Value);
        }

        if (options.EndDate.HasValue)
        {
            query = query.Where(e => e.EventDateTime <= options.EndDate.Value);
        }

        var events = await query.ToListAsync();

        return events.Select(e => new EventAnalytics
        {
            EventId = e.Id,
            EventName = e.Name,
            EventDate = e.EventDateTime,
            TotalRegistrations = e.EventRsvps.Count,
            ActualAttendance = e.EventAttendances.Count,
            AttendanceRate = e.EventRsvps.Any() ? (double)e.EventAttendances.Count / e.EventRsvps.Count * 100 : 0,
            NoShowRate = e.EventRsvps.Any() ? (double)(e.EventRsvps.Count - e.EventAttendances.Count) / e.EventRsvps.Count * 100 : 0
        }).ToList();
    }

    public async Task<int> GetEventCountAsync(int clubId)
    {
        return await _context.Events
            .AsNoTracking()
            .Where(e => e.ClubId == clubId)
            .CountAsync();
    }

    public async Task<Event?> GetDetailedEventDataAsync(int eventId)
    {
        return await _context.Events
            .AsNoTracking()
            .Include(e => e.EventRsvps)
            .Include(e => e.EventAttendances)
            .Include(e => e.Club)
            .FirstOrDefaultAsync(e => e.Id == eventId);
    }

    public async Task<List<EventAnalytics>> GetFilteredEventAnalyticsAsync(int clubId, EventExportOptions options)
    {
        return await GetEventAnalyticsForExportAsync(clubId, options);
    }
}
