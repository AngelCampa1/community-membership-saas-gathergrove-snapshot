using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities
{
    /// <summary>
    /// Tracks historical engagement scores for trend analysis and reporting
    /// </summary>
    public class MemberEngagementHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member Member { get; set; } = null!;

        /// <summary>
        /// Overall engagement score at time of recording (0-100)
        /// </summary>
        [Range(0, 100)]
        public decimal OverallScore { get; set; }

        /// <summary>
        /// Login frequency score at time of recording (0-100)
        /// </summary>
        [Range(0, 100)]
        public decimal LoginFrequencyScore { get; set; }

        /// <summary>
        /// Event participation score at time of recording (0-100)
        /// </summary>
        [Range(0, 100)]
        public decimal EventParticipationScore { get; set; }

        /// <summary>
        /// Communication engagement score at time of recording (0-100)
        /// </summary>
        [Range(0, 100)]
        public decimal CommunicationScore { get; set; }

        /// <summary>
        /// Feature usage score at time of recording (0-100)
        /// </summary>
        [Range(0, 100)]
        public decimal FeatureUsageScore { get; set; }

        /// <summary>
        /// Profile completeness score at time of recording (0-100)
        /// </summary>
        [Range(0, 100)]
        public decimal ProfileCompletenessScore { get; set; }

        /// <summary>
        /// Engagement level at time of recording
        /// </summary>
        [Required]
        public EngagementLevel Level { get; set; }

        /// <summary>
        /// When this historical record was created
        /// </summary>
        [Required]
        public DateTime RecordedAt { get; set; }

        /// <summary>
        /// JSON snapshot of raw metrics at time of calculation
        /// </summary>
        [Column(TypeName = "text")]
        public string MetricsSnapshot { get; set; } = string.Empty;

        /// <summary>
        /// Calculate the score change from a previous history record
        /// </summary>
        /// <param name="previousRecord">Previous engagement history record</param>
        /// <returns>Score change (positive for improvement, negative for decline)</returns>
        public decimal CalculateScoreChange(MemberEngagementHistory? previousRecord)
        {
            if (previousRecord == null) return 0;
            return OverallScore - previousRecord.OverallScore;
        }

        /// <summary>
        /// Get the engagement level change from a previous record
        /// </summary>
        /// <param name="previousRecord">Previous engagement history record</param>
        /// <returns>Level change description</returns>
        public string GetLevelChange(MemberEngagementHistory? previousRecord)
        {
            if (previousRecord == null) return "New";

            if (Level == previousRecord.Level) return "Unchanged";

            return (Level, previousRecord.Level) switch
            {
                (EngagementLevel.Green, EngagementLevel.Yellow) => "Improved",
                (EngagementLevel.Green, EngagementLevel.Red) => "Greatly Improved",
                (EngagementLevel.Yellow, EngagementLevel.Green) => "Declined",
                (EngagementLevel.Yellow, EngagementLevel.Red) => "Improved",
                (EngagementLevel.Red, EngagementLevel.Yellow) => "Declined",
                (EngagementLevel.Red, EngagementLevel.Green) => "Greatly Declined",
                _ => "Changed"
            };
        }
    }
}