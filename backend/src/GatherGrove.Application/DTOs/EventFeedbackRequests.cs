using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to create a feedback survey for an event
/// </summary>
public class CreateFeedbackSurveyRequest
{
    /// <summary>
    /// The event ID to create feedback for
    /// </summary>
    [Required]
    public int EventId { get; set; }

    /// <summary>
    /// Title of the feedback survey
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Description of the feedback survey
    /// </summary>
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether the survey is anonymous
    /// </summary>
    public bool IsAnonymous { get; set; } = false;

    /// <summary>
    /// Whether to send to all attendees
    /// </summary>
    public bool SendToAllAttendees { get; set; } = true;

    /// <summary>
    /// Whether the survey is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When the survey expires
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// List of survey questions
    /// </summary>
    [Required]
    public List<CreateFeedbackQuestionRequest> Questions { get; set; } = new();
}

/// <summary>
/// Request to submit feedback for an event
/// </summary>
public class SubmitFeedbackRequest
{
    /// <summary>
    /// The survey ID
    /// </summary>
    [Required]
    public int SurveyId { get; set; }

    /// <summary>
    /// The member submitting feedback
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Overall rating for the event
    /// </summary>
    [Range(1, 5)]
    public int? OverallRating { get; set; }

    /// <summary>
    /// General comments about the event
    /// </summary>
    public string? Comments { get; set; }

    /// <summary>
    /// The survey responses
    /// </summary>
    [Required]
    public List<SurveyResponse> Responses { get; set; } = new();
}

/// <summary>
/// Request to export feedback data
/// </summary>
public class ExportFeedbackDataRequest
{
    /// <summary>
    /// The event ID to export feedback for
    /// </summary>
    [Required]
    public int EventId { get; set; }

    /// <summary>
    /// Whether to include raw responses
    /// </summary>
    public bool IncludeRawResponses { get; set; } = true;

    /// <summary>
    /// Whether to include analytics
    /// </summary>
    public bool IncludeAnalytics { get; set; } = true;

    /// <summary>
    /// Export format
    /// </summary>
    public ExportFormat Format { get; set; } = ExportFormat.CSV;

    /// <summary>
    /// Date range for export
    /// </summary>
    public DateRange? DateRange { get; set; }
}

/// <summary>
/// Response for feedback submission
/// </summary>
public class SubmitFeedbackResponse
{
    /// <summary>
    /// Whether the submission was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// The response ID if successful
    /// </summary>
    public int? ResponseId { get; set; }

    /// <summary>
    /// When the feedback was submitted
    /// </summary>
    public DateTime? SubmittedAt { get; set; }

    /// <summary>
    /// Error message if submission failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Response for closing a feedback survey
/// </summary>
public class CloseFeedbackSurveyResponse
{
    /// <summary>
    /// Whether the closure was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// The final report data
    /// </summary>
    public string? FinalReportData { get; set; }

    /// <summary>
    /// The final report generated
    /// </summary>
    public EventFeedbackReport? FinalReport { get; set; }

    /// <summary>
    /// Error message if closure failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Response for sending feedback reminders
/// </summary>
public class SendFeedbackRemindersResponse
{
    /// <summary>
    /// Number of reminders sent
    /// </summary>
    public int RemindersSent { get; set; }

    /// <summary>
    /// List of member IDs who didn't respond
    /// </summary>
    public List<int> NonResponders { get; set; } = new();

    /// <summary>
    /// Whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Error message if operation failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request to create a feedback question
/// </summary>
public class CreateFeedbackQuestionRequest
{
    /// <summary>
    /// The question text
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// The type of question
    /// </summary>
    public QuestionType QuestionType { get; set; } = QuestionType.Text;

    /// <summary>
    /// Whether this question is required
    /// </summary>
    public bool IsRequired { get; set; } = false;

    /// <summary>
    /// Options for multiple choice questions
    /// </summary>
    public string? Options { get; set; }
}

/// <summary>
/// Survey response for a specific question
/// </summary>
public class SurveyResponse
{
    /// <summary>
    /// The question ID
    /// </summary>
    [Required]
    public int QuestionId { get; set; }

    /// <summary>
    /// The answer provided
    /// </summary>
    [Required]
    public string Answer { get; set; } = string.Empty;
}

/// <summary>
/// Feedback survey response
/// </summary>
public class FeedbackSurveyResponse
{
    /// <summary>
    /// Survey ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Survey title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Survey description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether the survey is anonymous
    /// </summary>
    public bool IsAnonymous { get; set; }

    /// <summary>
    /// Whether the survey is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When the survey expires
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// When the survey was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// List of questions in the survey
    /// </summary>
    public List<FeedbackQuestionResponse> Questions { get; set; } = new();
}

/// <summary>
/// Feedback question response
/// </summary>
public class FeedbackQuestionResponse
{
    /// <summary>
    /// Question ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Question text
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Question type
    /// </summary>
    public QuestionType QuestionType { get; set; }

    /// <summary>
    /// Whether this question is required
    /// </summary>
    public bool IsRequired { get; set; }

    /// <summary>
    /// Options for multiple choice questions
    /// </summary>
    public string? Options { get; set; }
}

/// <summary>
/// Feedback response details
/// </summary>
public class FeedbackResponseDetails
{
    /// <summary>
    /// Response ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Survey ID
    /// </summary>
    public int SurveyId { get; set; }

    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Event ID for context
    /// </summary>
    public int? EventId { get; set; }

    /// <summary>
    /// Overall rating
    /// </summary>
    public int? OverallRating { get; set; }

    /// <summary>
    /// Comments
    /// </summary>
    public string? Comments { get; set; }

    /// <summary>
    /// When submitted
    /// </summary>
    public DateTime SubmittedAt { get; set; }

    /// <summary>
    /// List of question responses
    /// </summary>
    public List<FeedbackAnswerResponse> Responses { get; set; } = new();
}

/// <summary>
/// Feedback answer response
/// </summary>
public class FeedbackAnswerResponse
{
    /// <summary>
    /// Question ID
    /// </summary>
    public int QuestionId { get; set; }

    /// <summary>
    /// Answer provided
    /// </summary>
    public string Answer { get; set; } = string.Empty;
}

/// <summary>
/// Feedback analytics response
/// </summary>
public class FeedbackAnalyticsResponse
{
    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Total number of surveys
    /// </summary>
    public int TotalSurveys { get; set; }

    /// <summary>
    /// Total number of responses
    /// </summary>
    public int TotalResponses { get; set; }

    /// <summary>
    /// Average rating
    /// </summary>
    public double AverageRating { get; set; }

    /// <summary>
    /// Response rate percentage
    /// </summary>
    public double ResponseRate { get; set; }

    /// <summary>
    /// When completed
    /// </summary>
    public DateTime? CompletionDate { get; set; }

    /// <summary>
    /// Question-level analytics
    /// </summary>
    public List<QuestionAnalytics> QuestionAnalytics { get; set; } = new();

    /// <summary>
    /// Sentiment analysis results
    /// </summary>
    public SentimentAnalysis SentimentAnalysis { get; set; } = new();
}

/// <summary>
/// Feedback reminder result
/// </summary>
public class FeedbackReminderResult
{
    /// <summary>
    /// Survey ID
    /// </summary>
    public int SurveyId { get; set; }

    /// <summary>
    /// Number of reminders sent
    /// </summary>
    public int RemindersSent { get; set; }

    /// <summary>
    /// List of non-responders
    /// </summary>
    public List<int> NonResponders { get; set; } = new();

    /// <summary>
    /// Total eligible members
    /// </summary>
    public int TotalEligible { get; set; }

    /// <summary>
    /// Failed send count
    /// </summary>
    public int FailedSends { get; set; }

    /// <summary>
    /// Result message
    /// </summary>
    public string? Message { get; set; }
}

/// <summary>
/// Exported feedback data
/// </summary>
public class ExportedFeedbackData
{
    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Export format used
    /// </summary>
    public ExportFormat ExportFormat { get; set; }

    /// <summary>
    /// When exported
    /// </summary>
    public DateTime ExportedAt { get; set; }

    /// <summary>
    /// Total records exported
    /// </summary>
    public int TotalRecords { get; set; }

    /// <summary>
    /// Exported data
    /// </summary>
    public string Data { get; set; } = string.Empty;

    /// <summary>
    /// Export format used
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Download URL for the exported data
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// When the export expires
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Event feedback analytics data
/// </summary>
public class EventFeedbackAnalytics
{
    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Total survey count
    /// </summary>
    public int TotalSurveys { get; set; }

    /// <summary>
    /// Total response count
    /// </summary>
    public int TotalResponses { get; set; }

    /// <summary>
    /// Average overall rating
    /// </summary>
    public double AverageRating { get; set; }

    /// <summary>
    /// Response rate percentage
    /// </summary>
    public double ResponseRate { get; set; }

    /// <summary>
    /// Completion percentage
    /// </summary>
    public double CompletionRate { get; set; }

    /// <summary>
    /// Most common feedback themes
    /// </summary>
    public List<string> CommonThemes { get; set; } = new();
}

/// <summary>
/// Feedback export data specifically
/// </summary>
public class FeedbackExportData
{
    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Export format
    /// </summary>
    public string Format { get; set; } = string.Empty;

    /// <summary>
    /// Exported data content
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Export timestamp
    /// </summary>
    public DateTime ExportedAt { get; set; }

    /// <summary>
    /// Total record count
    /// </summary>
    public int RecordCount { get; set; }

    /// <summary>
    /// Survey data
    /// </summary>
    public FeedbackSurveyResponse? Survey { get; set; }

    /// <summary>
    /// All survey responses
    /// </summary>
    public List<FeedbackResponseDetails> Responses { get; set; } = new();

    /// <summary>
    /// Analytics data
    /// </summary>
    public EventFeedbackAnalytics? Analytics { get; set; }
}

/// <summary>
/// Event feedback report
/// </summary>
public class EventFeedbackReport
{
    /// <summary>
    /// Survey ID
    /// </summary>
    public int SurveyId { get; set; }

    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// When the report was generated
    /// </summary>
    public DateTime GeneratedAt { get; set; }

    /// <summary>
    /// Report title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Report summary
    /// </summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>
    /// Total number of responses
    /// </summary>
    public int TotalResponses { get; set; }

    /// <summary>
    /// Response rate percentage
    /// </summary>
    public double ResponseRate { get; set; }

    /// <summary>
    /// Average rating
    /// </summary>
    public double AverageRating { get; set; }

    /// <summary>
    /// Key insights from the feedback
    /// </summary>
    public List<string> KeyInsights { get; set; } = new();

    /// <summary>
    /// Detailed analytics
    /// </summary>
    public EventFeedbackAnalytics Analytics { get; set; } = new();

    /// <summary>
    /// Survey questions and responses
    /// </summary>
    public List<FeedbackQuestionResponse> Questions { get; set; } = new();
}

/// <summary>
/// Close feedback survey response with full report
/// </summary>
public class CloseFeedbackSurveyResponseWithReport
{
    /// <summary>
    /// Whether the closure was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// The final report generated
    /// </summary>
    public EventFeedbackReport? FinalReport { get; set; }

    /// <summary>
    /// Error message if closure failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request to create a survey
/// </summary>
public class CreateSurveyRequest
{
    /// <summary>
    /// Survey title
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Survey description
    /// </summary>
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Event ID if this is for an event
    /// </summary>
    public int? EventId { get; set; }

    /// <summary>
    /// Whether the survey is anonymous
    /// </summary>
    public bool IsAnonymous { get; set; } = false;

    /// <summary>
    /// Whether the survey is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When the survey expires
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// List of survey questions
    /// </summary>
    [Required]
    public List<CreateFeedbackQuestionRequest> Questions { get; set; } = new();
}

