using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Branding;

/// <summary>
/// Request DTO for updating club branding settings
/// </summary>
public class UpdateBrandingRequest
{
    /// <summary>
    /// Primary brand color in hex format (e.g., #FF0000)
    /// </summary>
    [StringLength(7, MinimumLength = 7, ErrorMessage = "Primary color must be in hex format (#RRGGBB)")]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Primary color must be a valid hex color")]
    public string? PrimaryColor { get; set; }

    /// <summary>
    /// Secondary brand color in hex format (e.g., #00FF00)
    /// </summary>
    [StringLength(7, MinimumLength = 7, ErrorMessage = "Secondary color must be in hex format (#RRGGBB)")]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Secondary color must be a valid hex color")]
    public string? SecondaryColor { get; set; }

    /// <summary>
    /// Custom font family to use (e.g., Arial, Helvetica, etc.)
    /// </summary>
    [StringLength(100, ErrorMessage = "Font family name cannot exceed 100 characters")]
    public string? FontFamily { get; set; }

    /// <summary>
    /// Custom CSS styles to be injected into the application
    /// </summary>
    [StringLength(10000, ErrorMessage = "Custom CSS cannot exceed 10,000 characters")]
    public string? CustomCSS { get; set; }

    /// <summary>
    /// Custom domain for white-label hosting (e.g., myclub.com)
    /// </summary>
    [StringLength(255, ErrorMessage = "Domain name cannot exceed 255 characters")]
    [RegularExpression(@"^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
        ErrorMessage = "Invalid domain format")]
    public string? WhiteLabelDomain { get; set; }

    /// <summary>
    /// Club's Facebook page URL
    /// </summary>
    [StringLength(500, ErrorMessage = "Facebook URL cannot exceed 500 characters")]
    [RegularExpression(@"^https:\/\/(www\.)?facebook\.com\/.+",
        ErrorMessage = "Facebook URL must be a valid Facebook page URL")]
    public string? FacebookUrl { get; set; }

    /// <summary>
    /// Club's Twitter profile URL
    /// </summary>
    [StringLength(500, ErrorMessage = "Twitter URL cannot exceed 500 characters")]
    [RegularExpression(@"^https:\/\/(www\.)?(twitter\.com|x\.com)\/.+",
        ErrorMessage = "Twitter URL must be a valid Twitter/X profile URL")]
    public string? TwitterUrl { get; set; }

    /// <summary>
    /// Club's Instagram profile URL
    /// </summary>
    [StringLength(500, ErrorMessage = "Instagram URL cannot exceed 500 characters")]
    [RegularExpression(@"^https:\/\/(www\.)?instagram\.com\/.+",
        ErrorMessage = "Instagram URL must be a valid Instagram profile URL")]
    public string? InstagramUrl { get; set; }

    /// <summary>
    /// Club's LinkedIn page URL
    /// </summary>
    [StringLength(500, ErrorMessage = "LinkedIn URL cannot exceed 500 characters")]
    [RegularExpression(@"^https:\/\/(www\.)?linkedin\.com\/(company|in)\/.+",
        ErrorMessage = "LinkedIn URL must be a valid LinkedIn company or profile URL")]
    public string? LinkedInUrl { get; set; }

    /// <summary>
    /// Club's YouTube channel URL
    /// </summary>
    [StringLength(500, ErrorMessage = "YouTube URL cannot exceed 500 characters")]
    [RegularExpression(@"^https:\/\/(www\.)?youtube\.com\/(channel|c|user)\/.+",
        ErrorMessage = "YouTube URL must be a valid YouTube channel URL")]
    public string? YouTubeUrl { get; set; }

    /// <summary>
    /// Club's custom website URL
    /// </summary>
    [StringLength(500, ErrorMessage = "Website URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Website URL must be a valid URL")]
    public string? WebsiteUrl { get; set; }

    /// <summary>
    /// Whether to hide the GatherGrove branding from the club's pages
    /// </summary>
    public bool? HideGatherGroveBranding { get; set; }

    /// <summary>
    /// Custom footer text to display on club pages
    /// </summary>
    [StringLength(1000, ErrorMessage = "Footer text cannot exceed 1,000 characters")]
    public string? CustomFooterText { get; set; }

    /// <summary>
    /// Custom club name override for white-label branding
    /// </summary>
    [StringLength(200, ErrorMessage = "Custom club name cannot exceed 200 characters")]
    public string? CustomClubName { get; set; }
}