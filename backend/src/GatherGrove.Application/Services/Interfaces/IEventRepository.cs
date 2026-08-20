using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs.Export;

namespace GatherGrove.Application.Services.Interfaces;

public interface IEventRepository
{
    Task<List<Event>> GetEventsByClubIdAsync(int clubId);
    Task<Event?> GetByIdAsync(int eventId);
    Task<List<Event>> GetEventsByDateRangeAsync(int clubId, DateTime startDate, DateTime endDate);
    Task<List<Event>> GetUpcomingEventsAsync(int clubId);
    Task<List<Event>> GetPastEventsAsync(int clubId);
    Task<Event> CreateAsync(Event eventEntity);
    Task<Event> UpdateAsync(Event eventEntity);
    Task DeleteAsync(int eventId);
    Task<EventAnalyticsMetrics?> GetEventAnalyticsAsync(int eventId);
    Task<EventAnalyticsMetrics?> GetEventAnalyticsAsync(int clubId, DateTime startDate, DateTime endDate, string? eventType);
    Task<List<EventFeedback>> GetEventFeedbackAsync(int eventId);
    Task<int> GetEventCountAsync(int clubId);
    Task<double> GetAverageAttendanceRateAsync(int clubId);
    Task<EventTrendAnalysis> GetEventTrendAnalysisAsync(int clubId, DateTime startDate, DateTime endDate);
    Task<MonthlyEventSummary> GetMonthlyEventSummaryAsync(int clubId, int year, int month);

    // Additional methods expected by tests
    Task<List<EventPhoto>> GetEventPhotosAsync(int eventId);
    Task<List<EventTestimonial>> GetEventTestimonialsAsync(int eventId);
    Task<Event?> GetDetailedEventDataAsync(int eventId);

    // Missing methods for CS1061 fixes
    Task<List<EngagementAnalytics>> GetEngagementAnalyticsAsync(int clubId, EventExportOptions options);
    Task<List<MemberParticipation>> GetMemberEventParticipationAsync(int clubId, EventExportOptions options);
    Task<List<EventAnalytics>> GetFilteredEventAnalyticsAsync(int clubId, EventExportOptions options);
}