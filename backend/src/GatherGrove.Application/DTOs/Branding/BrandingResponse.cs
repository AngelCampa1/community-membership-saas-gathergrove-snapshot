namespace GatherGrove.Application.DTOs.Branding;

/// <summary>
/// Response DTO for club branding settings
/// </summary>
public class BrandingResponse
{
    /// <summary>
    /// The club ID these branding settings belong to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// URL to the club's custom logo
    /// </summary>
    public string? LogoUrl { get; set; }

    /// <summary>
    /// Primary brand color in hex format
    /// </summary>
    public string? PrimaryColor { get; set; }

    /// <summary>
    /// Secondary brand color in hex format
    /// </summary>
    public string? SecondaryColor { get; set; }

    /// <summary>
    /// Custom font family to use
    /// </summary>
    public string? FontFamily { get; set; }

    /// <summary>
    /// Custom CSS styles
    /// </summary>
    public string? CustomCSS { get; set; }

    /// <summary>
    /// Custom domain for white-label hosting
    /// </summary>
    public string? WhiteLabelDomain { get; set; }

    /// <summary>
    /// Club's Facebook page URL
    /// </summary>
    public string? FacebookUrl { get; set; }

    /// <summary>
    /// Club's Twitter profile URL
    /// </summary>
    public string? TwitterUrl { get; set; }

    /// <summary>
    /// Club's Instagram profile URL
    /// </summary>
    public string? InstagramUrl { get; set; }

    /// <summary>
    /// Club's LinkedIn page URL
    /// </summary>
    public string? LinkedInUrl { get; set; }

    /// <summary>
    /// Club's YouTube channel URL
    /// </summary>
    public string? YouTubeUrl { get; set; }

    /// <summary>
    /// Club's custom website URL
    /// </summary>
    public string? WebsiteUrl { get; set; }

    /// <summary>
    /// Whether to hide the GatherGrove branding
    /// </summary>
    public bool HideGatherGroveBranding { get; set; }

    /// <summary>
    /// Custom footer text
    /// </summary>
    public string? CustomFooterText { get; set; }

    /// <summary>
    /// Custom club name override for white-label branding
    /// </summary>
    public string? CustomClubName { get; set; }

    /// <summary>
    /// URL to the club's custom favicon
    /// </summary>
    public string? FaviconUrl { get; set; }

    /// <summary>
    /// When the branding settings were created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the branding settings were last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}