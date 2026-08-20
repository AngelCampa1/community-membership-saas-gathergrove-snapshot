using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Analyzes member sign-up timing patterns and early bird behavior
/// </summary>
public class EventSignUpTimingAnalysis
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EventId { get; set; }

    [Required]
    public int MemberId { get; set; }

    // Sign-Up Timing
    [Required]
    public DateTime SignUpTimestamp { get; set; } = DateTime.UtcNow;

    [Required]
    public int DaysBeforeEvent { get; set; } = 0;

    [Required]
    public int HoursBeforeEvent { get; set; } = 0;

    [Required]
    public int MinutesBeforeEvent { get; set; } = 0;

    // Timing Categories
    [Required]
    [StringLength(20)]
    public string TimingCategory { get; set; } = "regular"; // immediate, early_bird, regular, last_minute, very_late

    [Required]
    [StringLength(20)]
    public string SignUpWindow { get; set; } = "unknown"; // first_week, second_week, third_week, final_week, final_days, final_hours

    // Member Behavior Patterns
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal MemberAvgDaysBeforeSignUp { get; set; } = 0.0m;

    [Required]
    [StringLength(20)]
    public string MemberSignUpPattern { get; set; } = "inconsistent"; // early_bird, consistent, last_minute, inconsistent

    [Required]
    public int MemberTotalEventSignUps { get; set; } = 1;

    // Event Context
    [Required]
    [StringLength(50)]
    public string? EventType { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal EventCapacityWhenSigned { get; set; } = 0.0m; // Percentage of capacity filled

    [Required]
    public int EventTotalSignUpsAtTime { get; set; } = 1;

    [Required]
    public bool WasWaitlisted { get; set; } = false;

    [Required]
    public int WaitlistPosition { get; set; } = 0;

    // Engagement Correlation
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal PredictedEngagementScore { get; set; } = 50.0m;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal ActualEngagementScore { get; set; } = 0.0m;

    [Required]
    [Column(TypeName = "decimal(6,2)")]
    public decimal EngagementPredictionAccuracy { get; set; } = 0.0m;

    // Attendance Correlation
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal PredictedAttendanceProbability { get; set; } = 80.0m;

    [Required]
    public bool ActuallyAttended { get; set; } = false;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AttendancePredictionAccuracy { get; set; } = 0.0m;

    // Behavioral Triggers
    [StringLength(100)]
    public string? SignUpTrigger { get; set; } // notification, reminder, friend_influence, direct_access

    [Required]
    public bool SignedUpViaNotification { get; set; } = false;

    [Required]
    public bool SignedUpAfterReminder { get; set; } = false;

    [Required]
    public int ReminderCount { get; set; } = 0;

    // Social Influence
    [Required]
    public int FriendsAlreadySignedUp { get; set; } = 0;

    [Required]
    public bool InfluencedByFriends { get; set; } = false;

    [StringLength(100)]
    public string? SocialInfluenceFactors { get; set; } // JSON array of influence factors

    // Platform and Device
    [Required]
    [StringLength(20)]
    public string Platform { get; set; } = "web";

    [StringLength(20)]
    public string? DeviceType { get; set; }

    [StringLength(20)]
    public string? TimeOfDay { get; set; } // morning, afternoon, evening, night

    [StringLength(20)]
    public string? DayOfWeek { get; set; }

    // Outcome Metrics
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal SignUpEfficiencyScore { get; set; } = 50.0m;

    [Required]
    [StringLength(20)]
    public string SignUpSuccessCategory { get; set; } = "optimal"; // optimal, good, fair, poor

    // Timestamps
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual Event Event { get; set; } = null!;
    public virtual Member Member { get; set; } = null!;
}