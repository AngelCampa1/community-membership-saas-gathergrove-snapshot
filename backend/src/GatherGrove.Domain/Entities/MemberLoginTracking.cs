using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities
{
    /// <summary>
    /// Tracks member login sessions for engagement scoring
    /// </summary>
    public class MemberLoginTracking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member Member { get; set; } = null!;

        /// <summary>
        /// When the member logged in
        /// </summary>
        [Required]
        public DateTime LoginTimestamp { get; set; }

        /// <summary>
        /// Session identifier for grouping related activities
        /// </summary>
        [Required]
        [StringLength(128)]
        public string SessionId { get; set; } = string.Empty;

        /// <summary>
        /// How long the session lasted (if available)
        /// </summary>
        public TimeSpan? SessionDuration { get; set; }

        /// <summary>
        /// Platform used for login (web, mobile, api)
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
        /// IP address for analytics (anonymized for privacy)
        /// </summary>
        [StringLength(45)]
        public string? IpAddress { get; set; }

        /// <summary>
        /// User agent string for device/browser identification
        /// </summary>
        [StringLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// Geographic location (country/region code)
        /// </summary>
        [StringLength(10)]
        public string? LocationCode { get; set; }

        /// <summary>
        /// Whether this was a successful login
        /// </summary>
        [Required]
        public bool IsSuccessful { get; set; } = true;

        /// <summary>
        /// When this record was created
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Check if this login occurred within the last N days
        /// </summary>
        /// <param name="days">Number of days to check</param>
        /// <returns>True if login is within the specified timeframe</returns>
        public bool IsWithinLast(int days)
        {
            return DateTime.UtcNow.Subtract(LoginTimestamp).TotalDays <= days;
        }

        /// <summary>
        /// Get engagement weight based on session duration
        /// </summary>
        /// <returns>Weight multiplier for engagement scoring</returns>
        public decimal GetEngagementWeight()
        {
            if (!SessionDuration.HasValue) return 1.0m;

            return SessionDuration.Value.TotalMinutes switch
            {
                >= 30 => 1.5m,  // Long session
                >= 10 => 1.2m,  // Medium session
                >= 5 => 1.0m,   // Short session
                _ => 0.8m       // Very short session
            };
        }

        /// <summary>
        /// Check if this is a high-value login session
        /// </summary>
        public bool IsHighValueSession()
        {
            return SessionDuration?.TotalMinutes >= 10 || Platform == "web";
        }
    }
}