using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service interface for calculating member engagement scores
/// </summary>
public interface IEngagementScoringService
{
    /// <summary>
    /// Calculate comprehensive engagement score for a member
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <returns>Calculated engagement score</returns>
    Task<decimal> CalculateEngagementScoreAsync(int memberId);

    /// <summary>
    /// Calculate login-based engagement score component
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Login score component</returns>
    Task<decimal> CalculateLoginScoreAsync(int memberId, int daysBack = 30);

    /// <summary>
    /// Calculate event participation score component
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Event score component</returns>
    Task<decimal> CalculateEventScoreAsync(int memberId, int daysBack = 90);

    /// <summary>
    /// Calculate communication engagement score component
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Communication score component</returns>
    Task<decimal> CalculateCommunicationScoreAsync(int memberId, int daysBack = 30);

    /// <summary>
    /// Calculate feature usage score component
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Feature usage score component</returns>
    Task<decimal> CalculateFeatureUsageScoreAsync(int memberId, int daysBack = 30);

    /// <summary>
    /// Calculate profile completeness score component
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <returns>Profile completeness score component</returns>
    Task<decimal> CalculateProfileCompletenessScoreAsync(int memberId);

    /// <summary>
    /// Determine engagement level based on overall score
    /// </summary>
    /// <param name="overallScore">Overall engagement score</param>
    /// <returns>Engagement level classification</returns>
    EngagementLevel DetermineEngagementLevel(decimal overallScore);

    /// <summary>
    /// Get score weights for different components
    /// </summary>
    /// <returns>Dictionary of component weights</returns>
    Dictionary<string, decimal> GetScoreWeights();

    /// <summary>
    /// Calculate score for a specific activity type
    /// </summary>
    /// <param name="activityType">Type of activity</param>
    /// <param name="metadata">Activity metadata</param>
    /// <returns>Activity score contribution</returns>
    decimal CalculateActivityScore(string activityType, object? metadata = null);
}