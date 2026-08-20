using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Feedback response details with additional context
/// </summary>
public class FeedbackResponse
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
    /// When submitted
    /// </summary>
    public DateTime SubmittedAt { get; set; }

    /// <summary>
    /// List of answers
    /// </summary>
    public List<string> Answers { get; set; } = new();
}

/// <summary>
/// Question-level analytics
/// </summary>
public class QuestionAnalytics
{
    /// <summary>
    /// Question ID
    /// </summary>
    public int QuestionId { get; set; }

    /// <summary>
    /// Question text
    /// </summary>
    public string QuestionText { get; set; } = string.Empty;

    /// <summary>
    /// Response count
    /// </summary>
    public int ResponseCount { get; set; }

    /// <summary>
    /// Average rating (for rating questions)
    /// </summary>
    public double? AverageRating { get; set; }

    /// <summary>
    /// Most common answers
    /// </summary>
    public List<string> CommonAnswers { get; set; } = new();
}

/// <summary>
/// Sentiment analysis results
/// </summary>
public class SentimentAnalysis
{
    /// <summary>
    /// Overall sentiment score
    /// </summary>
    public double OverallSentiment { get; set; }

    /// <summary>
    /// Positive sentiment percentage
    /// </summary>
    public double PositivePercentage { get; set; }

    /// <summary>
    /// Negative sentiment percentage
    /// </summary>
    public double NegativePercentage { get; set; }

    /// <summary>
    /// Neutral sentiment percentage
    /// </summary>
    public double NeutralPercentage { get; set; }

    /// <summary>
    /// Key themes identified
    /// </summary>
    public List<string> KeyThemes { get; set; } = new();
}

/// <summary>
/// Event feedback summary DTO
/// </summary>
public class EventFeedbackSummary
{
    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Event title
    /// </summary>
    public string EventTitle { get; set; } = string.Empty;

    /// <summary>
    /// Survey title
    /// </summary>
    public string SurveyTitle { get; set; } = string.Empty;

    /// <summary>
    /// Total number of people invited
    /// </summary>
    public int TotalInvited { get; set; }

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
    /// Positive feedback percentage
    /// </summary>
    public double PositiveFeedbackPercentage { get; set; }

    /// <summary>
    /// Top compliments received
    /// </summary>
    public List<string> TopCompliments { get; set; } = new();

    /// <summary>
    /// Top complaints received
    /// </summary>
    public List<string> TopComplaints { get; set; } = new();

    /// <summary>
    /// Percentage of people who would recommend the event
    /// </summary>
    public double RecommendationPercentage { get; set; }

    /// <summary>
    /// When last updated
    /// </summary>
    public DateTime LastUpdated { get; set; }

    /// <summary>
    /// Top insights from feedback
    /// </summary>
    public List<string> TopInsights { get; set; } = new();

    /// <summary>
    /// Question averages by question ID
    /// </summary>
    public Dictionary<string, double> QuestionAverages { get; set; } = new();
}

