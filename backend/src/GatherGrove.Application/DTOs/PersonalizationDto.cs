namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to personalize content for a member
/// </summary>
public class PersonalizeContentRequest
{
    /// <summary>
    /// Content template with tokens
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Member ID to personalize for
    /// </summary>
    public int MemberId { get; set; }
}

/// <summary>
/// Personalized content response
/// </summary>
public class PersonalizedContentResponse
{
    /// <summary>
    /// Content with tokens replaced
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Tokens that were replaced
    /// </summary>
    public Dictionary<string, string> ReplacedTokens { get; set; } = new();

    /// <summary>
    /// Tokens that failed to resolve
    /// </summary>
    public List<string> FailedTokens { get; set; } = new();
}

/// <summary>
/// Available personalization tokens response
/// </summary>
public class AvailableTokensResponse
{
    /// <summary>
    /// System-provided tokens
    /// </summary>
    public List<TokenInfo> SystemTokens { get; set; } = new();

    /// <summary>
    /// Club-specific custom tokens
    /// </summary>
    public List<TokenInfo> CustomTokens { get; set; } = new();
}

/// <summary>
/// Information about a personalization token
/// </summary>
public class TokenInfo
{
    public int? Id { get; set; }
    public string TokenName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? DefaultValue { get; set; }
    public string ExampleValue { get; set; } = string.Empty;
    public bool IsSystemToken { get; set; }
}

/// <summary>
/// Request to create a custom personalization token
/// </summary>
public class CreatePersonalizationTokenRequest
{
    /// <summary>
    /// Token name (e.g., "custom_field_name")
    /// </summary>
    public string TokenName { get; set; } = string.Empty;

    /// <summary>
    /// Display name for UI
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Description of what the token does
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Token category
    /// </summary>
    public string Category { get; set; } = "Custom";

    /// <summary>
    /// Data source for the token value
    /// </summary>
    public string? DataSource { get; set; }

    /// <summary>
    /// Default value if token cannot be resolved
    /// </summary>
    public string? DefaultValue { get; set; }
}

/// <summary>
/// Preview personalized content for multiple members
/// </summary>
public class PreviewPersonalizationRequest
{
    /// <summary>
    /// Content template with tokens
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Number of sample members to preview (default: 3)
    /// </summary>
    public int SampleCount { get; set; } = 3;

    /// <summary>
    /// Optional segment to preview from
    /// </summary>
    public int? SegmentId { get; set; }
}

/// <summary>
/// Preview personalization response
/// </summary>
public class PreviewPersonalizationResponse
{
    /// <summary>
    /// Sample personalized content for different members
    /// </summary>
    public List<PersonalizedSample> Samples { get; set; } = new();
}

/// <summary>
/// A sample of personalized content
/// </summary>
public class PersonalizedSample
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string PersonalizedContent { get; set; } = string.Empty;
}

