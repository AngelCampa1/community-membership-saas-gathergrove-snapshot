using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs
{
    /// <summary>
    /// Request DTO for updating member engagement metrics
    /// </summary>
    public class UpdateEngagementMetricsRequest
    {
        /// <summary>
        /// Member ID to update metrics for
        /// </summary>
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Member ID must be greater than 0")]
        public int MemberId { get; set; }

        /// <summary>
        /// Feature usage event to record
        /// </summary>
        public FeatureUsageEventDto? FeatureUsageEvent { get; set; }

        /// <summary>
        /// Activity session data to update
        /// </summary>
        public ActivitySessionUpdateDto? ActivitySessionUpdate { get; set; }

        /// <summary>
        /// Custom metrics to update
        /// </summary>
        public CustomMetricsDto? CustomMetrics { get; set; }

        /// <summary>
        /// Force recalculation of engagement score
        /// </summary>
        public bool ForceRecalculation { get; set; } = false;

        /// <summary>
        /// Update timestamp (defaults to UTC now)
        /// </summary>
        public DateTime UpdateTimestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Source of the update (web, mobile, api, system)
        /// </summary>
        [StringLength(20)]
        public string Source { get; set; } = "api";
    }

    /// <summary>
    /// DTO for feature usage events
    /// </summary>
    public class FeatureUsageEventDto
    {
        /// <summary>
        /// Name of the feature used
        /// </summary>
        [Required]
        [StringLength(100)]
        public string FeatureName { get; set; } = string.Empty;

        /// <summary>
        /// Category of the feature
        /// </summary>
        [Required]
        [StringLength(50)]
        public string FeatureCategory { get; set; } = string.Empty;

        /// <summary>
        /// Action performed
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty;

        /// <summary>
        /// Optional metadata (JSON string)
        /// </summary>
        public string? Metadata { get; set; }

        /// <summary>
        /// Duration of the interaction in milliseconds
        /// </summary>
        [Range(0, int.MaxValue)]
        public int? DurationMs { get; set; }

        /// <summary>
        /// Session ID for grouping events
        /// </summary>
        [StringLength(100)]
        public string? SessionId { get; set; }

        /// <summary>
        /// Platform used (web, mobile, api)
        /// </summary>
        [StringLength(20)]
        public string Platform { get; set; } = "web";

        /// <summary>
        /// When the event occurred
        /// </summary>
        public DateTime EventTimestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// DTO for activity session updates
    /// </summary>
    public class ActivitySessionUpdateDto
    {
        /// <summary>
        /// Session ID to update
        /// </summary>
        [Required]
        [StringLength(100)]
        public string SessionId { get; set; } = string.Empty;

        /// <summary>
        /// Action to perform (start, update, end)
        /// </summary>
        [Required]
        [StringLength(10)]
        public string Action { get; set; } = string.Empty;

        /// <summary>
        /// Number of page views to add
        /// </summary>
        [Range(0, int.MaxValue)]
        public int? PageViewsIncrement { get; set; }

        /// <summary>
        /// Number of actions to add
        /// </summary>
        [Range(0, int.MaxValue)]
        public int? ActionsIncrement { get; set; }

        /// <summary>
        /// Number of messages to add
        /// </summary>
        [Range(0, int.MaxValue)]
        public int? MessagesIncrement { get; set; }

        /// <summary>
        /// Number of event interactions to add
        /// </summary>
        [Range(0, int.MaxValue)]
        public int? EventInteractionsIncrement { get; set; }

        /// <summary>
        /// Platform for this session
        /// </summary>
        [StringLength(20)]
        public string Platform { get; set; } = "web";

        /// <summary>
        /// Device type
        /// </summary>
        [StringLength(20)]
        public string? DeviceType { get; set; }

        /// <summary>
        /// Referrer URL
        /// </summary>
        [StringLength(500)]
        public string? ReferrerUrl { get; set; }
    }

    /// <summary>
    /// DTO for custom engagement metrics
    /// </summary>
    public class CustomMetricsDto
    {
        /// <summary>
        /// Custom communication score override
        /// </summary>
        [Range(0, 100)]
        public decimal? CommunicationScoreOverride { get; set; }

        /// <summary>
        /// Custom event participation score override
        /// </summary>
        [Range(0, 100)]
        public decimal? EventParticipationScoreOverride { get; set; }

        /// <summary>
        /// Custom feature usage score override
        /// </summary>
        [Range(0, 100)]
        public decimal? FeatureUsageScoreOverride { get; set; }

        /// <summary>
        /// Custom activity frequency score override
        /// </summary>
        [Range(0, 100)]
        public decimal? ActivityFrequencyScoreOverride { get; set; }

        /// <summary>
        /// Additional metrics as key-value pairs
        /// </summary>
        public Dictionary<string, object>? AdditionalMetrics { get; set; }

        /// <summary>
        /// Notes about the custom metrics
        /// </summary>
        [StringLength(500)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Response DTO for engagement metrics update
    /// </summary>
    public class UpdateEngagementMetricsResponse
    {
        /// <summary>
        /// Whether the update was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Updated engagement score
        /// </summary>
        public MemberEngagementScoreResponse? UpdatedScore { get; set; }

        /// <summary>
        /// Changes made during the update
        /// </summary>
        public List<string> Changes { get; set; } = new();

        /// <summary>
        /// Any validation errors
        /// </summary>
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// When the update was processed
        /// </summary>
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Processing time in milliseconds
        /// </summary>
        public long ProcessingTimeMs { get; set; }
    }
}