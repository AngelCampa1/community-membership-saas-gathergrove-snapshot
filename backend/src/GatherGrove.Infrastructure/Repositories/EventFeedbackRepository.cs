using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Enums;
using System.Text;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for event feedback operations
/// Handles feedback collection, surveys, and analytics for events
/// </summary>
public class EventFeedbackRepository : IEventFeedbackRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventFeedbackRepository> _logger;

    public EventFeedbackRepository(
        GatherGroveDbContext context,
        ILogger<EventFeedbackRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new event feedback entry
    /// </summary>
    public async Task<EventFeedback> CreateAsync(EventFeedback feedback)
    {
        try
        {
            _logger.LogInformation("Creating feedback for event {EventId} by member {MemberId}",
                feedback.EventId, feedback.MemberId);

            feedback.CreatedAt = DateTime.UtcNow;
            feedback.UpdatedAt = DateTime.UtcNow;

            _context.EventFeedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created feedback with ID {FeedbackId}", feedback.Id);
            return feedback;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating feedback for event {EventId}", feedback.EventId);
            throw;
        }
    }

    /// <summary>
    /// Gets feedback by ID
    /// </summary>
    public async Task<EventFeedback?> GetByIdAsync(int id)
    {
        try
        {
            return await _context.EventFeedbacks
                .Include(f => f.Event)
                .Include(f => f.Member)
                .FirstOrDefaultAsync(f => f.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback by ID {FeedbackId}", id);
            throw;
        }
    }

    /// <summary>
    /// Gets all feedback for a specific event
    /// </summary>
    public async Task<IEnumerable<EventFeedback>> GetByEventIdAsync(int eventId)
    {
        try
        {
            return await _context.EventFeedbacks
                .Where(f => f.EventId == eventId)
                .Include(f => f.Member)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback for event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Gets all feedback submitted by a specific member
    /// </summary>
    public async Task<IEnumerable<EventFeedback>> GetByMemberIdAsync(int memberId)
    {
        try
        {
            return await _context.EventFeedbacks
                .Where(f => f.MemberId == memberId)
                .Include(f => f.Event)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback for member {MemberId}", memberId);
            throw;
        }
    }

    /// <summary>
    /// Checks if a member has already provided feedback for an event
    /// </summary>
    public async Task<bool> HasMemberProvidedFeedbackAsync(int eventId, int memberId)
    {
        try
        {
            return await _context.EventFeedbacks
                .AnyAsync(f => f.EventId == eventId && f.MemberId == memberId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if member {MemberId} has provided feedback for event {EventId}",
                memberId, eventId);
            throw;
        }
    }

    /// <summary>
    /// Updates existing feedback
    /// </summary>
    public async Task UpdateAsync(EventFeedback feedback)
    {
        try
        {
            _logger.LogInformation("Updating feedback {FeedbackId}", feedback.Id);

            feedback.UpdatedAt = DateTime.UtcNow;
            _context.EventFeedbacks.Update(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated feedback {FeedbackId}", feedback.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating feedback {FeedbackId}", feedback.Id);
            throw;
        }
    }

    /// <summary>
    /// Deletes feedback by ID
    /// </summary>
    public async Task DeleteAsync(int id)
    {
        try
        {
            _logger.LogInformation("Deleting feedback {FeedbackId}", id);

            var feedback = await _context.EventFeedbacks.FindAsync(id);
            if (feedback != null)
            {
                _context.EventFeedbacks.Remove(feedback);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Deleted feedback {FeedbackId}", id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting feedback {FeedbackId}", id);
            throw;
        }
    }

    /// <summary>
    /// Gets the average rating for an event
    /// </summary>
    public async Task<double> GetAverageRatingAsync(int eventId)
    {
        try
        {
            var feedbacks = await _context.EventFeedbacks
                .Where(f => f.EventId == eventId)
                .ToListAsync();

            if (!feedbacks.Any())
                return 0;

            return feedbacks.Average(f => f.Rating);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating average rating for event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Gets the total count of feedback for an event
    /// </summary>
    public async Task<int> GetFeedbackCountAsync(int eventId)
    {
        try
        {
            return await _context.EventFeedbacks
                .CountAsync(f => f.EventId == eventId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting feedback for event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Gets the feedback survey for an event
    /// </summary>
    public async Task<EventFeedbackSurvey?> GetFeedbackSurveyByEventAsync(int eventId)
    {
        try
        {
            return await _context.EventFeedbackSurveys
                .Include(s => s.Questions)
                .Include(s => s.Responses)
                .FirstOrDefaultAsync(s => s.EventId == eventId && s.IsActive);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback survey for event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Exports feedback data for an event
    /// Returns anonymous object with ExportedFeedbackData structure
    /// </summary>
    public async Task<object?> ExportFeedbackDataAsync(int eventId, string format, bool includeRawResponses = true, bool includeAnalytics = true)
    {
        try
        {
            _logger.LogInformation("Exporting feedback data for event {EventId} in {Format} format",
                eventId, format);

            var feedbacks = await GetByEventIdAsync(eventId);
            var survey = await GetFeedbackSurveyByEventAsync(eventId);

            var exportData = new StringBuilder();
            var recordCount = 0;

            // Generate export based on format
            if (format.Equals("CSV", StringComparison.OrdinalIgnoreCase))
            {
                exportData.AppendLine("Id,MemberId,Rating,Comments,CreatedAt");
                foreach (var feedback in feedbacks)
                {
                    exportData.AppendLine($"{feedback.Id},{feedback.MemberId},{feedback.Rating},\"{feedback.Comments?.Replace("\"", "\"\"")}\",{feedback.CreatedAt:yyyy-MM-dd HH:mm:ss}");
                    recordCount++;
                }
            }
            else if (format.Equals("JSON", StringComparison.OrdinalIgnoreCase))
            {
                // Simple JSON export
                exportData.Append("[");
                var isFirst = true;
                foreach (var feedback in feedbacks)
                {
                    if (!isFirst) exportData.Append(",");
                    exportData.Append($"{{\"id\":{feedback.Id},\"memberId\":{feedback.MemberId},\"rating\":{feedback.Rating},\"comments\":\"{feedback.Comments?.Replace("\"", "\\\"")}\",\"createdAt\":\"{feedback.CreatedAt:yyyy-MM-ddTHH:mm:ss}\"}}");
                    recordCount++;
                    isFirst = false;
                }
                exportData.Append("]");
            }

            // Return anonymous object matching ExportedFeedbackData DTO structure
            return new
            {
                EventId = eventId,
                ExportFormat = format,
                Format = format,
                ExportedAt = DateTime.UtcNow,
                TotalRecords = recordCount,
                Data = exportData.ToString(),
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting feedback data for event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Generates a final report for an event's feedback
    /// </summary>
    public async Task<string> GenerateFinalReportAsync(int eventId)
    {
        try
        {
            _logger.LogInformation("Generating final report for event {EventId}", eventId);

            var feedbacks = await GetByEventIdAsync(eventId);
            var survey = await GetFeedbackSurveyByEventAsync(eventId);
            var averageRating = await GetAverageRatingAsync(eventId);
            var feedbackCount = await GetFeedbackCountAsync(eventId);

            var report = new StringBuilder();
            report.AppendLine("Event Feedback Final Report");
            report.AppendLine("==========================");
            report.AppendLine();
            report.AppendLine($"Event ID: {eventId}");
            report.AppendLine($"Survey Title: {survey?.Title ?? "N/A"}");
            report.AppendLine($"Total Feedback: {feedbackCount}");
            report.AppendLine($"Average Rating: {averageRating:F2} / 5.0");
            report.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            report.AppendLine();

            if (feedbacks.Any())
            {
                report.AppendLine("Rating Distribution:");
                for (int rating = 5; rating >= 1; rating--)
                {
                    var count = feedbacks.Count(f => f.Rating == rating);
                    var percentage = (count / (double)feedbackCount) * 100;
                    report.AppendLine($"  {rating} stars: {count} ({percentage:F1}%)");
                }
            }

            return report.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating final report for event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Gets a summary of feedback for an event
    /// Returns anonymous object with EventFeedbackSummary structure
    /// </summary>
    public async Task<object?> GetEventFeedbackSummaryAsync(int eventId)
    {
        try
        {
            _logger.LogInformation("Getting feedback summary for event {EventId}", eventId);

            var feedbacks = await GetByEventIdAsync(eventId);
            var survey = await GetFeedbackSurveyByEventAsync(eventId);
            var averageRating = await GetAverageRatingAsync(eventId);
            var feedbackCount = await GetFeedbackCountAsync(eventId);

            var eventEntity = await _context.Events.FindAsync(eventId);

            // Return anonymous object matching EventFeedbackSummary DTO structure
            return new
            {
                EventId = eventId,
                EventTitle = eventEntity?.Name ?? "Unknown Event",
                SurveyTitle = survey?.Title ?? "Event Feedback",

                // PHASE 4 FIX: Calculate TotalInvited from RSVPs + Attendances
                TotalInvited = await _context.EventRsvps
                    .Where(r => r.EventId == eventId)
                    .Select(r => r.MemberId)
                    .Union(_context.EventAttendances
                        .Where(a => a.EventId == eventId)
                        .Select(a => a.MemberId))
                    .Distinct()
                    .CountAsync(),

                TotalResponses = feedbackCount,

                // PHASE 4 FIX: Calculate ResponseRate based on total invited
                ResponseRate = await CalculateResponseRate(eventId, feedbackCount),

                AverageRating = averageRating,
                PositiveFeedbackPercentage = feedbacks.Count(f => f.Rating >= 4) / (double)Math.Max(feedbackCount, 1) * 100,
                TopCompliments = feedbacks
                    .Where(f => f.Rating >= 4 && !string.IsNullOrWhiteSpace(f.Comments))
                    .Select(f => f.Comments!)
                    .Take(5)
                    .ToList(),
                TopComplaints = feedbacks
                    .Where(f => f.Rating <= 2 && !string.IsNullOrWhiteSpace(f.Comments))
                    .Select(f => f.Comments!)
                    .Take(5)
                    .ToList(),
                RecommendationPercentage = feedbacks.Count(f => f.Rating >= 4) / (double)Math.Max(feedbackCount, 1) * 100,
                LastUpdated = DateTime.UtcNow,

                // PHASE 4 FIX: Generate insights from feedback patterns
                TopInsights = GenerateInsights(feedbacks.ToList(), averageRating),

                // PHASE 4 FIX: Calculate averages for custom questions
                QuestionAverages = CalculateQuestionAverages(feedbacks.ToList())
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback summary for event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Gets list of members who haven't responded to a survey
    /// </summary>
    public async Task<List<int>> GetNonRespondersAsync(int surveyId)
    {
        try
        {
            _logger.LogInformation("Getting non-responders for survey {SurveyId}", surveyId);

            var survey = await _context.EventFeedbackSurveys
                .Include(s => s.Event)
                .ThenInclude(e => e.EventRsvps)
                .Include(s => s.Responses)
                .FirstOrDefaultAsync(s => s.Id == surveyId);

            if (survey == null)
                return new List<int>();

            // Get all registered members
            var registeredMemberIds = survey.Event?.EventRsvps
                .Select(r => r.MemberId)
                .ToList() ?? new List<int>();

            // Get members who have responded
            var respondedMemberIds = survey.Responses
                .Where(r => r.MemberId.HasValue)
                .Select(r => r.MemberId!.Value)
                .ToList();

            // Return difference
            return registeredMemberIds.Except(respondedMemberIds).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting non-responders for survey {SurveyId}", surveyId);
            throw;
        }
    }

    /// <summary>
    /// Checks if a member has submitted feedback for a survey
    /// </summary>
    public async Task<bool> HasSubmittedFeedbackAsync(int surveyId, int memberId)
    {
        try
        {
            return await _context.EventFeedbackResponses
                .AnyAsync(r => r.SurveyId == surveyId && r.MemberId == memberId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if member {MemberId} has submitted feedback for survey {SurveyId}",
                memberId, surveyId);
            throw;
        }
    }

    /// <summary>
    /// Creates a new feedback response
    /// </summary>
    public async Task<EventFeedbackResponse> CreateResponseAsync(EventFeedbackResponse response)
    {
        try
        {
            _logger.LogInformation("Creating feedback response for survey {SurveyId} by member {MemberId}",
                response.SurveyId, response.MemberId);

            response.SubmittedAt = DateTime.UtcNow;
            _context.EventFeedbackResponses.Add(response);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created feedback response with ID {ResponseId}", response.Id);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating feedback response for survey {SurveyId}", response.SurveyId);
            throw;
        }
    }

    /// <summary>
    /// Creates a new feedback survey
    /// </summary>
    public async Task<EventFeedbackSurvey> CreateSurveyAsync(EventFeedbackSurvey survey)
    {
        try
        {
            _logger.LogInformation("Creating feedback survey '{Title}' for event {EventId}",
                survey.Title, survey.EventId);

            survey.CreatedAt = DateTime.UtcNow;
            survey.UpdatedAt = DateTime.UtcNow;

            _context.EventFeedbackSurveys.Add(survey);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created feedback survey with ID {SurveyId}", survey.Id);
            return survey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating feedback survey for event {EventId}", survey.EventId);
            throw;
        }
    }

    /// <summary>
    /// Gets analytics for event feedback
    /// Returns anonymous object with EventFeedbackAnalytics structure
    /// </summary>
    public async Task<object?> GetFeedbackAnalyticsAsync(int eventId)
    {
        try
        {
            _logger.LogInformation("Getting feedback analytics for event {EventId}", eventId);

            var feedbacks = await GetByEventIdAsync(eventId);
            var surveys = await _context.EventFeedbackSurveys
                .Include(s => s.Responses)
                .Where(s => s.EventId == eventId)
                .ToListAsync();

            var totalResponses = surveys.Sum(s => s.Responses.Count);
            var averageRating = await GetAverageRatingAsync(eventId);

            // Get total attendees for response rate calculation
            var eventEntity = await _context.Events
                .Include(e => e.EventRsvps)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            var totalAttendees = eventEntity?.EventRsvps.Count ?? 0;
            var responseRate = totalAttendees > 0 ? (totalResponses / (double)totalAttendees) * 100 : 0;

            // Return anonymous object matching EventFeedbackAnalytics DTO structure
            return new
            {
                EventId = eventId,
                TotalSurveys = surveys.Count,
                TotalResponses = totalResponses,
                AverageRating = averageRating,
                ResponseRate = responseRate,
                CompletionRate = responseRate,

                // PHASE 4 FIX: Extract common themes from feedback comments
                CommonThemes = ExtractCommonThemes(feedbacks.ToList())
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback analytics for event {EventId}", eventId);
            throw;
        }
    }

    #region PHASE 4 FIX: Helper Methods for Analytics Calculations

    /// <summary>
    /// Calculate response rate for an event
    /// </summary>
    private async Task<double> CalculateResponseRate(int eventId, int feedbackCount)
    {
        var totalInvited = await _context.EventRsvps
            .Where(r => r.EventId == eventId)
            .Select(r => r.MemberId)
            .Union(_context.EventAttendances
                .Where(a => a.EventId == eventId)
                .Select(a => a.MemberId))
            .Distinct()
            .CountAsync();

        return totalInvited > 0 ? (feedbackCount / (double)totalInvited) * 100 : 0.0;
    }

    /// <summary>
    /// Generate insights from feedback patterns
    /// </summary>
    private List<string> GenerateInsights(List<Domain.Entities.EventFeedback> feedbacks, double averageRating)
    {
        var insights = new List<string>();

        if (!feedbacks.Any())
            return insights;

        // Insight 1: Overall sentiment
        if (averageRating >= 4.5)
            insights.Add($"Exceptional performance with {averageRating:F1} average rating");
        else if (averageRating >= 4.0)
            insights.Add($"Strong positive feedback with {averageRating:F1} average rating");
        else if (averageRating >= 3.0)
            insights.Add($"Mixed feedback with {averageRating:F1} average rating - room for improvement");
        else
            insights.Add($"Below expectations with {averageRating:F1} average rating - requires attention");

        // Insight 2: Response distribution
        var ratings = feedbacks.GroupBy(f => f.Rating)
            .OrderByDescending(g => g.Count())
            .ToList();

        if (ratings.Any())
        {
            var mostCommon = ratings.First();
            var percentage = (mostCommon.Count() / (double)feedbacks.Count) * 100;
            insights.Add($"{percentage:F0}% of attendees gave {mostCommon.Key} stars");
        }

        // Insight 3: Satisfaction trends
        var positiveCount = feedbacks.Count(f => f.Rating >= 4);
        var negativeCount = feedbacks.Count(f => f.Rating <= 2);

        if (positiveCount > negativeCount * 3)
            insights.Add("Overwhelming positive sentiment from attendees");
        else if (negativeCount > positiveCount)
            insights.Add("Significant concerns raised - review negative feedback carefully");

        // Insight 4: Comments analysis
        var commentsCount = feedbacks.Count(f => !string.IsNullOrWhiteSpace(f.Comments));
        var commentsRate = (commentsCount / (double)feedbacks.Count) * 100;

        if (commentsRate > 50)
            insights.Add($"High engagement: {commentsRate:F0}% provided detailed comments");

        return insights.Take(5).ToList();
    }

    /// <summary>
    /// Calculate averages for custom survey questions
    /// </summary>
    private Dictionary<string, double> CalculateQuestionAverages(List<Domain.Entities.EventFeedback> feedbacks)
    {
        var questionAverages = new Dictionary<string, double>();

        if (!feedbacks.Any())
            return questionAverages;

        // Group by survey questions and calculate averages
        // This would need the actual survey structure from EventFeedbackSurvey
        // For now, calculate average rating as the main metric
        questionAverages["Overall Rating"] = feedbacks.Average(f => f.Rating);

        // Additional question averages can be calculated if custom questions are stored
        // in a separate related table or JSON structure

        return questionAverages;
    }

    /// <summary>
    /// Extract common themes from feedback comments using keyword analysis
    /// </summary>
    private List<string> ExtractCommonThemes(List<Domain.Entities.EventFeedback> feedbacks)
    {
        var themes = new List<string>();

        if (!feedbacks.Any())
            return themes;

        // Collect all comments
        var allComments = feedbacks
            .Where(f => !string.IsNullOrWhiteSpace(f.Comments))
            .Select(f => f.Comments!.ToLower())
            .ToList();

        if (!allComments.Any())
            return themes;

        // Define common theme keywords for event feedback
        var themeKeywords = new Dictionary<string, List<string>>
        {
            ["Venue & Location"] = new List<string> { "venue", "location", "space", "room", "facility", "parking" },
            ["Food & Beverages"] = new List<string> { "food", "drink", "catering", "refreshments", "snacks", "meal" },
            ["Organization & Timing"] = new List<string> { "organized", "timing", "schedule", "late", "early", "punctual", "duration" },
            ["Content & Activities"] = new List<string> { "content", "activity", "activities", "program", "session", "workshop" },
            ["Networking & Social"] = new List<string> { "networking", "social", "meet", "connections", "people", "community" },
            ["Communication"] = new List<string> { "communication", "information", "notice", "notification", "email", "updates" }
        };

        // Count mentions of each theme
        foreach (var theme in themeKeywords)
        {
            var mentionCount = allComments.Count(comment =>
                theme.Value.Any(keyword => comment.Contains(keyword)));

            // If theme is mentioned in at least 20% of comments, include it
            if (mentionCount >= allComments.Count * 0.2)
            {
                themes.Add($"{theme.Key} ({mentionCount} mentions)");
            }
        }

        // If no major themes found, provide a generic theme
        if (!themes.Any())
        {
            themes.Add($"General feedback from {allComments.Count} respondents");
        }

        return themes.Take(5).ToList();
    }

    #endregion
}
