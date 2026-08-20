using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for event feedback operations
/// </summary>
public interface IEventFeedbackRepository
{
    /// <summary>
    /// Creates a new event feedback entry
    /// </summary>
    Task<EventFeedback> CreateAsync(EventFeedback feedback);

    /// <summary>
    /// Gets feedback by ID
    /// </summary>
    Task<EventFeedback?> GetByIdAsync(int id);

    /// <summary>
    /// Gets all feedback for a specific event
    /// </summary>
    Task<IEnumerable<EventFeedback>> GetByEventIdAsync(int eventId);

    /// <summary>
    /// Gets all feedback submitted by a specific member
    /// </summary>
    Task<IEnumerable<EventFeedback>> GetByMemberIdAsync(int memberId);

    /// <summary>
    /// Checks if a member has already provided feedback for an event
    /// </summary>
    Task<bool> HasMemberProvidedFeedbackAsync(int eventId, int memberId);

    /// <summary>
    /// Updates existing feedback
    /// </summary>
    Task UpdateAsync(EventFeedback feedback);

    /// <summary>
    /// Deletes feedback by ID
    /// </summary>
    Task DeleteAsync(int id);

    /// <summary>
    /// Gets the average rating for an event
    /// </summary>
    Task<double> GetAverageRatingAsync(int eventId);

    /// <summary>
    /// Gets the total count of feedback for an event
    /// </summary>
    Task<int> GetFeedbackCountAsync(int eventId);

    /// <summary>
    /// Gets the feedback survey for an event
    /// </summary>
    Task<EventFeedbackSurvey?> GetFeedbackSurveyByEventAsync(int eventId);

    /// <summary>
    /// Exports feedback data for an event
    /// Returns anonymous object with ExportedFeedbackData structure
    /// </summary>
    Task<object?> ExportFeedbackDataAsync(int eventId, string format, bool includeRawResponses = true, bool includeAnalytics = true);

    /// <summary>
    /// Generates a final report for an event's feedback
    /// </summary>
    Task<string> GenerateFinalReportAsync(int eventId);

    /// <summary>
    /// Gets a summary of feedback for an event
    /// Returns anonymous object with EventFeedbackSummary structure
    /// </summary>
    Task<object?> GetEventFeedbackSummaryAsync(int eventId);

    /// <summary>
    /// Gets list of members who haven't responded to a survey
    /// </summary>
    Task<List<int>> GetNonRespondersAsync(int surveyId);

    /// <summary>
    /// Checks if a member has submitted feedback for a survey
    /// </summary>
    Task<bool> HasSubmittedFeedbackAsync(int surveyId, int memberId);

    /// <summary>
    /// Creates a new feedback response
    /// </summary>
    Task<EventFeedbackResponse> CreateResponseAsync(EventFeedbackResponse response);

    /// <summary>
    /// Creates a new feedback survey
    /// </summary>
    Task<EventFeedbackSurvey> CreateSurveyAsync(EventFeedbackSurvey survey);

    /// <summary>
    /// Gets analytics for event feedback
    /// </summary>
    Task<object?> GetFeedbackAnalyticsAsync(int eventId);
}
