using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services.Interfaces
{
    /// <summary>
    /// Interface for managing event feedback operations
    /// </summary>
    public interface IEventFeedbackService
    {
        /// <summary>
        /// Creates a feedback survey for an event
        /// </summary>
        /// <param name="request">The create feedback survey request</param>
        /// <returns>The created feedback survey</returns>
        Task<FeedbackSurveyResponse> CreateFeedbackSurveyAsync(CreateFeedbackSurveyRequest request);

        /// <summary>
        /// Creates a feedback survey for an event - overload with event ID
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <param name="request">The create survey request</param>
        /// <returns>The created feedback survey</returns>
        Task<FeedbackSurveyResponse> CreateFeedbackSurveyAsync(int eventId, CreateFeedbackSurveyRequest request);

        /// <summary>
        /// Gets a feedback survey by ID
        /// </summary>
        /// <param name="surveyId">The survey ID</param>
        /// <returns>The feedback survey</returns>
        Task<FeedbackSurveyResponse?> GetFeedbackSurveyAsync(int surveyId);

        /// <summary>
        /// Submits feedback for a survey
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <param name="request">The feedback submission request</param>
        /// <returns>The feedback response</returns>
        Task<FeedbackResponseDetails> SubmitFeedbackAsync(int eventId, SubmitFeedbackRequest request);

        /// <summary>
        /// Submits feedback for a survey - overload without event ID
        /// </summary>
        /// <param name="request">The feedback submission request</param>
        /// <returns>The feedback response</returns>
        Task<SubmitFeedbackResponse> SubmitFeedbackAsync(SubmitFeedbackRequest request);

        /// <summary>
        /// Gets a feedback response by ID
        /// </summary>
        /// <param name="responseId">The response ID</param>
        /// <returns>The feedback response</returns>
        Task<FeedbackResponseDetails?> GetFeedbackResponseAsync(int responseId);

        /// <summary>
        /// Gets feedback analytics for an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <returns>The feedback analytics</returns>
        Task<EventFeedbackAnalytics> GetFeedbackAnalyticsAsync(int eventId);

        /// <summary>
        /// Sends feedback reminders
        /// </summary>
        /// <param name="surveyId">The survey ID</param>
        /// <returns>The reminder result</returns>
        Task<FeedbackReminderResult> SendFeedbackRemindersAsync(int surveyId);

        /// <summary>
        /// Closes a feedback survey
        /// </summary>
        /// <param name="surveyId">The survey ID</param>
        /// <returns>Task</returns>
        Task CloseFeedbackSurveyAsync(int surveyId);

        /// <summary>
        /// Exports feedback data
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <param name="request">The export request</param>
        /// <returns>The exported feedback data</returns>
        Task<ExportedFeedbackData> ExportFeedbackDataAsync(int eventId, ExportFeedbackDataRequest request);

        /// <summary>
        /// Gets all feedback surveys for an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <returns>List of feedback surveys</returns>
        Task<List<FeedbackSurveyResponse>> GetEventFeedbackSurveysAsync(int eventId);

        /// <summary>
        /// Gets all feedback responses for an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <param name="surveyId">Optional survey ID filter</param>
        /// <returns>List of feedback responses</returns>
        Task<List<FeedbackResponseDetails>> GetEventFeedbackResponsesAsync(int eventId, int? surveyId = null);

        /// <summary>
        /// Gets feedback summary for an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <returns>Event feedback summary</returns>
        Task<EventFeedbackSummary> GetEventFeedbackSummaryAsync(int eventId);
    }
}