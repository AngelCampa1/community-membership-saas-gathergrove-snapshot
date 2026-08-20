namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to create an A/B test campaign
/// </summary>
public class CreateABTestCampaignRequest
{
    /// <summary>
    /// Name of the campaign
    /// </summary>
    public string CampaignName { get; set; } = string.Empty;

    /// <summary>
    /// Description of what is being tested
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Type of test (SubjectLine, Content, SendTime)
    /// </summary>
    public string TestType { get; set; } = "SubjectLine";

    /// <summary>
    /// Template ID for variant A
    /// </summary>
    public int? VariantATemplateId { get; set; }

    /// <summary>
    /// Subject line for variant A
    /// </summary>
    public string? VariantASubject { get; set; }

    /// <summary>
    /// Content for variant A
    /// </summary>
    public string? VariantAContent { get; set; }

    /// <summary>
    /// Template ID for variant B
    /// </summary>
    public int? VariantBTemplateId { get; set; }

    /// <summary>
    /// Subject line for variant B
    /// </summary>
    public string? VariantBSubject { get; set; }

    /// <summary>
    /// Content for variant B
    /// </summary>
    public string? VariantBContent { get; set; }

    /// <summary>
    /// Percentage of audience to include in test
    /// </summary>
    public int TestPercentage { get; set; } = 50;

    /// <summary>
    /// Minimum sample size before declaring winner
    /// </summary>
    public int MinimumSampleSize { get; set; } = 100;

    /// <summary>
    /// Required confidence level for statistical significance
    /// </summary>
    public decimal ConfidenceLevel { get; set; } = 95.0m;

    /// <summary>
    /// Member segment ID for targeting (null = all members)
    /// </summary>
    public int? SegmentId { get; set; }
}

/// <summary>
/// A/B test campaign response
/// </summary>
public class ABTestCampaignResponse
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TestType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? WinnerId { get; set; }
    public string? WinnerVariant { get; set; }
    public decimal? StatisticalSignificance { get; set; }
    public int TestPercentage { get; set; }
    public int MinimumSampleSize { get; set; }
    public decimal ConfidenceLevel { get; set; }
    public int? SegmentId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Template ID for variant A
    /// </summary>
    public int VariantATemplateId { get; set; }

    /// <summary>
    /// Template ID for variant B
    /// </summary>
    public int VariantBTemplateId { get; set; }

    /// <summary>
    /// Variant A details
    /// </summary>
    public ABTestVariantDetails? VariantA { get; set; }

    /// <summary>
    /// Variant B details
    /// </summary>
    public ABTestVariantDetails? VariantB { get; set; }
}

/// <summary>
/// Details about an A/B test variant
/// </summary>
public class ABTestVariantDetails
{
    public int? TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public string? Subject { get; set; }
    public string? Content { get; set; }
    public int SendCount { get; set; }
    public int OpenCount { get; set; }
    public int ClickCount { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }
}

/// <summary>
/// Start A/B test campaign request
/// </summary>
public class StartABTestRequest
{
    /// <summary>
    /// When to start the test (null = immediately)
    /// </summary>
    public DateTime? ScheduledFor { get; set; }
}

/// <summary>
/// A/B test results response
/// </summary>
public class ABTestResultsResponse
{
    public int CampaignId { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public VariantStatsResponse VariantA { get; set; } = new();
    public VariantStatsResponse VariantB { get; set; } = new();
    public int TestPercentage { get; set; }
    public int? WinnerId { get; set; }
    public bool IsComplete { get; set; }
    public string? WinnerVariant { get; set; }
    public decimal? StatisticalSignificance { get; set; }
    public bool HasReachedMinimumSample { get; set; }
    public bool IsStatisticallySignificant { get; set; }
}

/// <summary>
/// Results for a single variant
/// </summary>
public class ABTestVariantResults
{
    public string Variant { get; set; } = string.Empty;
    public int SentCount { get; set; }
    public int OpenedCount { get; set; }
    public int ClickedCount { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }
    public decimal ConversionRate { get; set; }
}

/// <summary>
/// List response for A/B test campaigns
/// </summary>
public class ABTestCampaignListResponse
{
    public int Id { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public int TestPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int? WinnerId { get; set; }
    public bool IsComplete { get; set; }
}

/// <summary>
/// Variant statistics response
/// </summary>
public class VariantStatsResponse
{
    public int TemplateId { get; set; }
    public int TotalSent { get; set; }
    public int TotalOpened { get; set; }
    public int TotalClicked { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }
}

