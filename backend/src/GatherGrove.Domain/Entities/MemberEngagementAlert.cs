using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities
{
    /// <summary>
    /// Represents alerts generated for declining member engagement
    /// </summary>
    public class MemberEngagementAlert
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member Member { get; set; } = null!;

        /// <summary>
        /// Type of engagement alert
        /// </summary>
        [Required]
        public AlertType Type { get; set; }

        /// <summary>
        /// Severity level of the alert
        /// </summary>
        [Required]
        public AlertSeverity Severity { get; set; }

        /// <summary>
        /// Score that triggered the alert
        /// </summary>
        [Range(0, 100)]
        public decimal TriggerScore { get; set; }

        /// <summary>
        /// Previous score for comparison
        /// </summary>
        [Range(0, 100)]
        public decimal? PreviousScore { get; set; }

        /// <summary>
        /// Score change that triggered the alert (negative for decline)
        /// </summary>
        public decimal ScoreChange { get; set; }

        /// <summary>
        /// Alert message describing the issue
        /// </summary>
        [Required]
        [StringLength(500)]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Recommended actions to address the alert
        /// </summary>
        [StringLength(1000)]
        public string? RecommendedActions { get; set; }

        /// <summary>
        /// Whether the alert has been resolved
        /// </summary>
        public bool IsResolved { get; set; } = false;

        /// <summary>
        /// When the alert was created
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When the alert was resolved
        /// </summary>
        public DateTime? ResolvedAt { get; set; }

        /// <summary>
        /// User who resolved the alert
        /// </summary>
        public int? ResolvedByUserId { get; set; }

        [ForeignKey("ResolvedByUserId")]
        public User? ResolvedByUser { get; set; }

        /// <summary>
        /// Notes about the alert resolution
        /// </summary>
        [StringLength(1000)]
        public string? ResolutionNotes { get; set; }

        /// <summary>
        /// Whether notifications have been sent for this alert
        /// </summary>
        public bool NotificationsSent { get; set; } = false;

        /// <summary>
        /// When notifications were last sent
        /// </summary>
        public DateTime? LastNotificationSent { get; set; }

        /// <summary>
        /// Resolve the alert with notes
        /// </summary>
        /// <param name="resolvedByUserId">User resolving the alert</param>
        /// <param name="notes">Resolution notes</param>
        public void Resolve(int resolvedByUserId, string? notes = null)
        {
            IsResolved = true;
            ResolvedAt = DateTime.UtcNow;
            ResolvedByUserId = resolvedByUserId;
            ResolutionNotes = notes;
        }

        /// <summary>
        /// Check if the alert is high priority and needs immediate attention
        /// </summary>
        public bool RequiresImmediateAttention()
        {
            return Severity >= AlertSeverity.High && !IsResolved;
        }

        /// <summary>
        /// Get the age of the alert in days
        /// </summary>
        public int GetAlertAge()
        {
            return (DateTime.UtcNow - CreatedAt).Days;
        }
    }
}