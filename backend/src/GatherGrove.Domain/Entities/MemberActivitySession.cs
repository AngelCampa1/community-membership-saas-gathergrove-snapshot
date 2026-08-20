using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities
{
    /// <summary>
    /// Represents a member's activity session for tracking engagement patterns
    /// </summary>
    public class MemberActivitySession
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member Member { get; set; } = null!;

        /// <summary>
        /// Foreign key to the member's engagement score
        /// </summary>
        public int? MemberEngagementScoreId { get; set; }

        [ForeignKey("MemberEngagementScoreId")]
        public MemberEngagementScore? MemberEngagementScore { get; set; }

        /// <summary>
        /// Unique session identifier
        /// </summary>
        [Required]
        [StringLength(100)]
        public string SessionId { get; set; } = string.Empty;

        /// <summary>
        /// When the session started
        /// </summary>
        public DateTime StartTime { get; set; }

        /// <summary>
        /// When the session ended (null if still active)
        /// </summary>
        public DateTime? EndTime { get; set; }

        /// <summary>
        /// Duration of the session in minutes
        /// </summary>
        public int? DurationMinutes { get; set; }

        /// <summary>
        /// Number of pages/screens viewed during session
        /// </summary>
        public int PageViews { get; set; }

        /// <summary>
        /// Number of actions performed during session
        /// </summary>
        public int ActionsPerformed { get; set; }

        /// <summary>
        /// Number of messages sent during session
        /// </summary>
        public int MessagesSent { get; set; }

        /// <summary>
        /// Number of events interacted with during session
        /// </summary>
        public int EventInteractions { get; set; }

        /// <summary>
        /// Platform used for this session (web, mobile, api)
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Platform { get; set; } = "web";

        /// <summary>
        /// Device type (desktop, mobile, tablet)
        /// </summary>
        [StringLength(20)]
        public string? DeviceType { get; set; }

        /// <summary>
        /// IP address for this session
        /// </summary>
        [StringLength(45)]
        public string? IpAddress { get; set; }

        /// <summary>
        /// User agent string
        /// </summary>
        [StringLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// Referrer URL (how they arrived)
        /// </summary>
        [StringLength(500)]
        public string? ReferrerUrl { get; set; }

        /// <summary>
        /// Session quality score (0-100) based on activity level
        /// </summary>
        [Range(0, 100)]
        public decimal QualityScore { get; set; }

        /// <summary>
        /// Whether this session is currently active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// When this record was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When this record was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// Collection of feature usage events that occurred during this session
        /// </summary>
        public ICollection<FeatureUsageEvent> FeatureUsageEvents { get; set; } = new List<FeatureUsageEvent>();

        /// <summary>
        /// Calculate and update the session duration
        /// </summary>
        public void UpdateDuration()
        {
            if (EndTime.HasValue)
            {
                DurationMinutes = (int)Math.Ceiling((EndTime.Value - StartTime).TotalMinutes);
            }
        }

        /// <summary>
        /// Calculate the quality score based on session metrics
        /// </summary>
        public void CalculateQualityScore()
        {
            if (!DurationMinutes.HasValue || DurationMinutes.Value == 0)
            {
                QualityScore = 0;
                return;
            }

            // Base score from duration (up to 30 points for sessions > 10 minutes)
            var durationScore = Math.Min(DurationMinutes.Value * 3m, 30m);

            // Actions per minute score (up to 25 points)
            var actionsPerMinute = (decimal)ActionsPerformed / DurationMinutes.Value;
            var actionScore = Math.Min(actionsPerMinute * 10m, 25m);

            // Page engagement score (up to 20 points)
            var pageScore = Math.Min(PageViews * 2m, 20m);

            // Communication score (up to 15 points)
            var communicationScore = Math.Min(MessagesSent * 3m, 15m);

            // Event interaction score (up to 10 points)
            var eventScore = Math.Min(EventInteractions * 5m, 10m);

            QualityScore = Math.Round(durationScore + actionScore + pageScore + communicationScore + eventScore, 2);
            QualityScore = Math.Min(QualityScore, 100);
        }

        /// <summary>
        /// End the session and calculate final metrics
        /// </summary>
        public void EndSession()
        {
            if (IsActive)
            {
                EndTime = DateTime.UtcNow;
                IsActive = false;
                UpdatedAt = DateTime.UtcNow;
                UpdateDuration();
                CalculateQualityScore();
            }
        }

        /// <summary>
        /// Check if this is a high-quality session (score >= 60)
        /// </summary>
        public bool IsHighQualitySession()
        {
            return QualityScore >= 60;
        }

        /// <summary>
        /// Check if this session is recent (within specified days)
        /// </summary>
        public bool IsRecent(int days = 30)
        {
            return DateTime.UtcNow.Subtract(StartTime).TotalDays <= days;
        }

        /// <summary>
        /// Get engagement contribution score for this session
        /// </summary>
        public decimal GetEngagementContribution()
        {
            if (!DurationMinutes.HasValue) return 0;

            // Base contribution from quality score
            var baseContribution = QualityScore / 10m;

            // Bonus for longer sessions
            var durationBonus = DurationMinutes.Value > 30 ? 2m : (DurationMinutes.Value > 10 ? 1m : 0m);

            return Math.Min(baseContribution + durationBonus, 15m);
        }
    }
}