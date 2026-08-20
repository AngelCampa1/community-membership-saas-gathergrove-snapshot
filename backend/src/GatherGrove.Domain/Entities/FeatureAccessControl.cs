using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Controls feature access based on club subscription tiers
/// </summary>
public class FeatureAccessControl
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ClubId { get; set; }

    // Subscription Tier
    [Required]
    [StringLength(20)]
    public string SubscriptionTier { get; set; } = "basic"; // basic, premium, unlimited

    [Required]
    public DateTime TierStartDate { get; set; } = DateTime.UtcNow;

    public DateTime? TierEndDate { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    // Event Engagement Analytics Features
    [Required]
    public bool EventAnalyticsAccess { get; set; } = false;

    [Required]
    public bool AdvancedEngagementMetrics { get; set; } = false;

    [Required]
    public bool PredictiveAnalytics { get; set; } = false;

    [Required]
    public bool CustomEngagementReports { get; set; } = false;

    [Required]
    public bool RealTimeEngagementTracking { get; set; } = false;

    // Data Export and Integration
    [Required]
    public bool DataExportAccess { get; set; } = false;

    [Required]
    public bool APIAccess { get; set; } = false;

    [Required]
    public bool WebhooksAccess { get; set; } = false;

    [Required]
    public bool ThirdPartyIntegrations { get; set; } = false;

    // Analytics Depth and History
    [Required]
    public int MaxHistoricalDataMonths { get; set; } = 3;

    [Required]
    public int MaxMemberEngagementProfiles { get; set; } = 100;

    [Required]
    public int MaxCustomDashboards { get; set; } = 1;

    [Required]
    public int MaxAutomatedReports { get; set; } = 2;

    // Advanced Features (Unlimited Tier)
    [Required]
    public bool MemberSegmentationAccess { get; set; } = false;

    [Required]
    public bool EngagementScoringCustomization { get; set; } = false;

    [Required]
    public bool MachineLearningInsights { get; set; } = false;

    [Required]
    public bool PredictiveNoShowModels { get; set; } = false;

    [Required]
    public bool SentimentAnalysis { get; set; } = false;

    [Required]
    public bool CompetitiveAnalytics { get; set; } = false;

    // Alerts and Notifications
    [Required]
    public bool EngagementAlertsAccess { get; set; } = true;

    [Required]
    public int MaxAlertRules { get; set; } = 5;

    [Required]
    public bool CustomAlertActions { get; set; } = false;

    [Required]
    public bool SlackIntegration { get; set; } = false;

    [Required]
    public bool EmailReporting { get; set; } = true;

    // Usage Limits
    [Required]
    public int MaxAPICallsPerMonth { get; set; } = 1000;

    [Required]
    public int MaxDataExportsPerMonth { get; set; } = 10;

    [Required]
    public int MaxConcurrentUsers { get; set; } = 3;

    // Feature Usage Tracking
    [Required]
    public int CurrentAPICallsThisMonth { get; set; } = 0;

    [Required]
    public int CurrentDataExportsThisMonth { get; set; } = 0;

    [Required]
    public int CurrentActiveUsers { get; set; } = 1;

    public DateTime LastAPICall { get; set; }

    public DateTime LastDataExport { get; set; }

    // Billing Information
    [Column(TypeName = "decimal(10,2)")]
    public decimal? MonthlyFee { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? AnnualFee { get; set; }

    [Required]
    public bool AutoRenewal { get; set; } = true;

    public DateTime? LastBillingDate { get; set; }

    public DateTime? NextBillingDate { get; set; }

    // Trial and Promotional Features
    [Required]
    public bool IsTrialAccount { get; set; } = false;

    public DateTime? TrialStartDate { get; set; }

    public DateTime? TrialEndDate { get; set; }

    [StringLength(50)]
    public string? PromoCode { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercentage { get; set; } = 0.0m;

    // Feature Flags for A/B Testing
    [StringLength(1000)]
    public string FeatureFlags { get; set; } = "{}"; // JSON object for experimental features

    [Required]
    public bool BetaFeaturesEnabled { get; set; } = false;

    // Compliance and Security
    [Required]
    public bool GDPRCompliant { get; set; } = true;

    [Required]
    public bool DataRetentionPolicyAccepted { get; set; } = true;

    [Required]
    public bool SecurityAuditAccess { get; set; } = false;

    // Support Level
    [Required]
    [StringLength(20)]
    public string SupportLevel { get; set; } = "community"; // community, email, priority, dedicated

    [Required]
    public bool PrioritySupport { get; set; } = false;

    [Required]
    public bool DedicatedAccountManager { get; set; } = false;

    // Timestamps
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastFeatureCheck { get; set; }

    // Navigation Properties
    public virtual Club Club { get; set; } = null!;
}