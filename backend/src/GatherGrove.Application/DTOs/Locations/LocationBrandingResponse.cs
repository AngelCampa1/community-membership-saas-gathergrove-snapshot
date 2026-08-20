namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Response containing location branding details
/// </summary>
public class LocationBrandingResponse
{
    /// <summary>
    /// Branding ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Location ID
    /// </summary>
    public int LocationId { get; set; }

    /// <summary>
    /// Location name
    /// </summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>
    /// Custom logo URL
    /// </summary>
    public string? CustomLogoUrl { get; set; }

    /// <summary>
    /// Color scheme settings
    /// </summary>
    public string? ColorScheme { get; set; }

    /// <summary>
    /// Custom name override
    /// </summary>
    public string? CustomNameOverride { get; set; }

    /// <summary>
    /// Additional settings
    /// </summary>
    public string? SettingsJson { get; set; }

    /// <summary>
    /// When created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

