using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services.Interfaces
{
    public interface ISurveyService
    {
        Task<EventFeedbackSurvey> CreateSurveyAsync(string title, string description);
        Task<EventFeedbackSurvey> CreateSurveyAsync(CreateSurveyRequest request);
        Task<string?> GetSurveyByIdAsync(int surveyId);
        Task<IEnumerable<string>> GetSurveysForEventAsync(int eventId);
        Task<bool> SubmitSurveyResponseAsync(int surveyId, int memberId, string response);
        Task<bool> DeleteSurveyAsync(int surveyId);
        Task<object> GetSurveyAnalyticsAsync(int surveyId);
        Task<string?> GetSurveyAsync(int surveyId);
        Task<bool> CloseSurveyAsync(int surveyId);
    }
}