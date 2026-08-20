using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for attendance data access
/// </summary>
public interface IAttendanceRepository
{
    /// <summary>
    /// Gets attendance records for a specific event
    /// </summary>
    Task<List<EventAttendance>> GetAttendanceByEventIdAsync(int eventId);

    /// <summary>
    /// Gets attendance records for a specific member
    /// </summary>
    Task<List<EventAttendance>> GetAttendanceByMemberIdAsync(int memberId);

    /// <summary>
    /// Gets all attendance records for a club
    /// </summary>
    Task<List<EventAttendance>> GetAttendanceByClubIdAsync(int clubId);

    /// <summary>
    /// Gets attendance records for a club within a date range
    /// </summary>
    Task<List<EventAttendance>> GetAttendanceByDateRangeAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Gets the total number of attendees for an event
    /// </summary>
    Task<int> GetTotalAttendanceCountAsync(int eventId);

    /// <summary>
    /// Calculates the attendance rate as percentage of confirmed RSVPs
    /// </summary>
    Task<double> GetAttendanceRateAsync(int eventId);

    /// <summary>
    /// Gets a specific attendance record for an event and member
    /// </summary>
    Task<EventAttendance?> GetAttendanceRecordAsync(int eventId, int memberId);

    /// <summary>
    /// Gets detailed attendance data including member and event information
    /// </summary>
    Task<List<EventAttendance>> GetDetailedAttendanceDataAsync(int clubId, DateTime startDate, DateTime endDate);
}
