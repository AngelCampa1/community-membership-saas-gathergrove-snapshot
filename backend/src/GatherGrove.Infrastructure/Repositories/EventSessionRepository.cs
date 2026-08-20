using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Event Session operations
/// </summary>
public class EventSessionRepository : IEventSessionRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventSessionRepository> _logger;

    public EventSessionRepository(GatherGroveDbContext context, ILogger<EventSessionRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<EventSession> CreateAsync(EventSession eventSession)
    {
        _logger.LogInformation("Creating event session for multi-session event {MultiSessionEventId}", eventSession.MultiSessionEventId);

        eventSession.CreatedAt = DateTime.UtcNow;
        eventSession.UpdatedAt = DateTime.UtcNow;

        _context.EventSessions.Add(eventSession);
        await _context.SaveChangesAsync();

        return eventSession;
    }

    public async Task<EventSession?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Getting event session {SessionId}", id);

        return await _context.EventSessions
            .Include(s => s.MultiSessionEvent)
            .Include(s => s.SessionRegistrations)
            .Include(s => s.SessionAttendances)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<List<EventSession>> GetByMultiSessionEventIdAsync(int multiSessionEventId)
    {
        _logger.LogInformation("Getting sessions for multi-session event {MultiSessionEventId}", multiSessionEventId);

        return await _context.EventSessions
            .Where(s => s.MultiSessionEventId == multiSessionEventId)
            .OrderBy(s => s.SessionNumber)
            .Include(s => s.SessionRegistrations)
            .Include(s => s.SessionAttendances)
            .ToListAsync();
    }

    public async Task<EventSession> UpdateAsync(EventSession eventSession)
    {
        _logger.LogInformation("Updating event session {SessionId}", eventSession.Id);

        eventSession.UpdatedAt = DateTime.UtcNow;

        _context.EventSessions.Update(eventSession);
        await _context.SaveChangesAsync();

        return eventSession;
    }

    public async Task DeleteAsync(int id)
    {
        _logger.LogInformation("Deleting event session {SessionId}", id);

        var session = await _context.EventSessions.FindAsync(id);
        if (session != null)
        {
            _context.EventSessions.Remove(session);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<EventSessionAttendance>> GetSessionAttendanceAsync(int sessionId)
    {
        _logger.LogInformation("Getting attendance for session {SessionId}", sessionId);

        return await _context.EventSessionAttendances
            .Where(a => a.SessionId == sessionId)
            .Include(a => a.Member)
            .Include(a => a.Session)
            .ToListAsync();
    }

    public async Task<EventSessionAttendance> RecordAttendanceAsync(EventSessionAttendance attendance)
    {
        _logger.LogInformation("Recording attendance for session {SessionId}, member {MemberId}", attendance.SessionId, attendance.MemberId);

        // Check if attendance record already exists
        var existing = await _context.EventSessionAttendances
            .FirstOrDefaultAsync(a => a.SessionId == attendance.SessionId &&
                                      a.MemberId == attendance.MemberId);

        if (existing != null)
        {
            // Update existing record
            existing.AttendedAt = attendance.AttendedAt ?? DateTime.UtcNow;
            existing.CheckOutTime = attendance.CheckOutTime;
            existing.Notes = attendance.Notes;
            _context.EventSessionAttendances.Update(existing);
        }
        else
        {
            // Create new record
            attendance.AttendedAt = attendance.AttendedAt ?? DateTime.UtcNow;
            _context.EventSessionAttendances.Add(attendance);
        }

        await _context.SaveChangesAsync();
        return existing ?? attendance;
    }
}
