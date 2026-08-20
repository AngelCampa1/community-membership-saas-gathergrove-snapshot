using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for event reports service operations
/// US-005 Data Export & Reporting Engine - Event reporting functionality
/// </summary>
public interface IEventReportsService
{
    /// <summary>
    /// Export events to CSV format
    /// </summary>
    Task<byte[]> ExportEventsToCsv(int clubId, EventExportOptions options);

    /// <summary>
    /// Export events to Excel format
    /// </summary>
    Task<byte[]> ExportEventsToExcel(int clubId, EventExportOptions options);

    /// <summary>
    /// Export events to JSON format
    /// </summary>
    Task<byte[]> ExportEventsToJson(int clubId, EventExportOptions options);

    /// <summary>
    /// Export events to PDF format
    /// </summary>
    Task<byte[]> ExportEventsToPdf(int clubId, EventExportOptions options);

    /// <summary>
    /// Generate comprehensive event report
    /// </summary>
    Task<EventReportData> GenerateEventReportAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get attendance records for an event
    /// </summary>
    Task<List<AttendanceRecord>> GetAttendanceRecordsAsync(int eventId);

    /// <summary>
    /// Get event photos
    /// </summary>
    Task<List<EventPhoto>> GetEventPhotosAsync(int eventId);

    /// <summary>
    /// Get event testimonials
    /// </summary>
    Task<List<EventTestimonial>> GetEventTestimonialsAsync(int eventId);

    /// <summary>
    /// Get engagement analytics for a club
    /// </summary>
    Task<EngagementAnalytics> GetEngagementAnalyticsAsync(int clubId);

    /// <summary>
    /// Get member participation data
    /// </summary>
    Task<List<MemberParticipation>> GetMemberParticipationAsync(int clubId);

    /// <summary>
    /// Get analytics for a specific event
    /// </summary>
    Task<EventAnalytics> GetEventAnalyticsAsync(int eventId);

    /// <summary>
    /// Get event analytics with additional options
    /// </summary>
    Task<EventAnalytics> GetEventAnalyticsAsync(int eventId, DateTime startDate, DateTime endDate, EventExportOptions options);

    /// <summary>
    /// Export event analytics to CSV
    /// </summary>
    Task<byte[]> ExportEventAnalyticsToCsv(int clubId, EventExportOptions options);

    /// <summary>
    /// Export event analytics to CSV (simpler signature for tests)
    /// </summary>
    Task<byte[]> ExportEventAnalyticsToCsv(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Export event analytics to Excel
    /// </summary>
    Task<byte[]> ExportEventAnalyticsToExcel(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Export monthly event summary to Excel
    /// </summary>
    Task<byte[]> ExportMonthlyEventSummaryToExcel(int clubId, int year, int month);

    /// <summary>
    /// Export attendance report to CSV
    /// </summary>
    Task<byte[]> ExportAttendanceReportToCsv(int clubId, EventExportOptions options);

    /// <summary>
    /// Schedule event analytics export
    /// </summary>
    Task<string> ScheduleEventAnalyticsExport(int clubId, EventExportOptions options);

    /// <summary>
    /// Schedule event analytics export (overload for tests with 5 params)
    /// </summary>
    Task<string> ScheduleEventAnalyticsExport(int clubId, DateTime startDate, DateTime endDate, string reportType, string frequency);

    // Additional methods expected by tests
    Task<byte[]> ExportEventAnalyticsReportToPdf(int clubId, DateTime startDate, DateTime endDate);
    Task<byte[]> ExportSingleEventReportToPdf(int eventId);
    Task<byte[]> ExportEventAnalyticsToJson(int clubId, DateTime startDate, DateTime endDate);

    // Missing methods for CS1061 fixes
    Task<byte[]> ExportEngagementAnalyticsToCsv(int clubId, EventExportOptions options);
    Task<byte[]> ExportMemberEventParticipationToCsv(int clubId, EventExportOptions options);

    /// <summary>
    /// Export event analytics with the specified request parameters
    /// </summary>
    Task<ExportResult> ExportEventAnalyticsAsync(int clubId, EventExportRequest request);
}