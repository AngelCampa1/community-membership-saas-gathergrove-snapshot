namespace GatherGrove.Application.DTOs;

/// <summary>
/// Email template request for creating or updating templates
/// </summary>
public class CreateEmailTemplateRequest
{
    /// <summary>
    /// Name of the template
    /// </summary>
    public string TemplateName { get; set; } = string.Empty;

    /// <summary>
    /// Optional description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// HTML content of the template
    /// </summary>
    public string TemplateHtml { get; set; } = string.Empty;

    /// <summary>
    /// JSON representation for the email builder
    /// </summary>
    public string? TemplateJson { get; set; }

    /// <summary>
    /// Preview thumbnail URL or base64 image
    /// </summary>
    public string? ThumbnailUrl { get; set; }
}

/// <summary>
/// Email template update request
/// </summary>
public class UpdateEmailTemplateRequest
{
    /// <summary>
    /// Name of the template
    /// </summary>
    public string? TemplateName { get; set; }

    /// <summary>
    /// Optional description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// HTML content of the template
    /// </summary>
    public string? TemplateHtml { get; set; }

    /// <summary>
    /// JSON representation for the email builder
    /// </summary>
    public string? TemplateJson { get; set; }

    /// <summary>
    /// Preview thumbnail URL or base64 image
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Whether the template is active
    /// </summary>
    public bool? IsActive { get; set; }
}

/// <summary>
/// Email template response
/// </summary>
public class EmailTemplateResponse
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TemplateHtml { get; set; } = string.Empty;
    public string? TemplateJson { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsSystemTemplate { get; set; }
    public bool IsActive { get; set; }
    public int Version { get; set; }
    public int UsageCount { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Simplified template list response
/// </summary>
public class EmailTemplateListResponse
{
    public int Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsSystemTemplate { get; set; }
    public bool IsActive { get; set; }
    public int UsageCount { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

