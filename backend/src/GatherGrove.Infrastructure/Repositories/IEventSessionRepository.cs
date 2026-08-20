using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for Event Session operations
/// </summary>
public interface IEventSessionRepository
{
    /// <summary>
    /// Creates a new event session
    /// </summary>
    Task<EventSession> CreateAsync(EventSession eventSession);

    /// <summary>
    /// Gets an event session by ID including related data
    /// </summary>
    Task<EventSession?> GetByIdAsync(int id);

    /// <summary>
    /// Gets all sessions for a multi-session event ordered by session number
    /// </summary>
    Task<List<EventSession>> GetByMultiSessionEventIdAsync(int multiSessionEventId);

    /// <summary>
    /// Updates an existing event session
    /// </summary>
    Task<EventSession> UpdateAsync(EventSession eventSession);

    /// <summary>
    /// Deletes an event session
    /// </summary>
    Task DeleteAsync(int id);

    /// <summary>
    /// Gets attendance records for a specific session
    /// </summary>
    Task<List<EventSessionAttendance>> GetSessionAttendanceAsync(int sessionId);

    /// <summary>
    /// Records attendance for a session (creates or updates)
    /// </summary>
    Task<EventSessionAttendance> RecordAttendanceAsync(EventSessionAttendance attendance);
}
