using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for attendance data access
/// </summary>
public class AttendanceRepository : IAttendanceRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<AttendanceRepository> _logger;

    public AttendanceRepository(GatherGroveDbContext context, ILogger<AttendanceRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<EventAttendance>> GetAttendanceByEventIdAsync(int eventId)
    {
        _logger.LogInformation("Getting attendance for event {EventId}", eventId);

        return await _context.EventAttendances
            .Include(a => a.Member)
            .Include(a => a.Event)
            .Where(a => a.EventId == eventId)
            .OrderBy(a => a.AttendedAt)
            .ToListAsync();
    }

    public async Task<List<EventAttendance>> GetAttendanceByMemberIdAsync(int memberId)
    {
        _logger.LogInformation("Getting attendance for member {MemberId}", memberId);

        return await _context.EventAttendances
            .Include(a => a.Event)
            .Include(a => a.Member)
            .Where(a => a.MemberId == memberId)
            .OrderByDescending(a => a.AttendedAt)
            .ToListAsync();
    }

    public async Task<List<EventAttendance>> GetAttendanceByClubIdAsync(int clubId)
    {
        _logger.LogInformation("Getting attendance for club {ClubId}", clubId);

        return await _context.EventAttendances
            .Include(a => a.Event)
            .Include(a => a.Member)
            .Where(a => a.Event.ClubId == clubId)
            .OrderByDescending(a => a.AttendedAt)
            .ToListAsync();
    }

    public async Task<List<EventAttendance>> GetAttendanceByDateRangeAsync(int clubId, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("Getting attendance for club {ClubId} from {StartDate} to {EndDate}", clubId, startDate, endDate);

        return await _context.EventAttendances
            .Include(a => a.Event)
            .Include(a => a.Member)
            .Where(a => a.Event.ClubId == clubId &&
                       a.AttendedAt >= startDate &&
                       a.AttendedAt <= endDate)
            .OrderBy(a => a.AttendedAt)
            .ToListAsync();
    }

    public async Task<int> GetTotalAttendanceCountAsync(int eventId)
    {
        _logger.LogInformation("Getting total attendance count for event {EventId}", eventId);

        return await _context.EventAttendances
            .Where(a => a.EventId == eventId)
            .CountAsync();
    }

    public async Task<double> GetAttendanceRateAsync(int eventId)
    {
        _logger.LogInformation("Getting attendance rate for event {EventId}", eventId);

        // Get total number of RSVPs for the event
        var totalRsvps = await _context.EventRsvps
            .Where(r => r.EventId == eventId && r.Status == RsvpStatus.Confirmed)
            .CountAsync();

        if (totalRsvps == 0)
        {
            return 0.0;
        }

        // Get total number of attendances
        var totalAttendances = await _context.EventAttendances
            .Where(a => a.EventId == eventId)
            .CountAsync();

        return (double)totalAttendances / totalRsvps * 100.0;
    }

    public async Task<EventAttendance?> GetAttendanceRecordAsync(int eventId, int memberId)
    {
        _logger.LogInformation("Getting attendance record for event {EventId} and member {MemberId}", eventId, memberId);

        return await _context.EventAttendances
            .Include(a => a.Event)
            .Include(a => a.Member)
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.MemberId == memberId);
    }

    public async Task<List<EventAttendance>> GetDetailedAttendanceDataAsync(int clubId, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("Getting detailed attendance data for club {ClubId} from {StartDate} to {EndDate}", clubId, startDate, endDate);

        return await _context.EventAttendances
            .Include(a => a.Event)
                .ThenInclude(e => e.Club)
            .Include(a => a.Member)
                .ThenInclude(m => m.MembershipType)
            .Where(a => a.Event.ClubId == clubId &&
                       a.AttendedAt >= startDate &&
                       a.AttendedAt <= endDate)
            .OrderBy(a => a.AttendedAt)
            .ThenBy(a => a.Member.FullName)
            .ToListAsync();
    }
}
