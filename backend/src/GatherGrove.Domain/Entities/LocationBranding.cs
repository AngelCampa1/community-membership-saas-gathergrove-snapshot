namespace GatherGrove.Domain.Entities;

/// <summary>
/// Location-specific branding and customization settings
/// </summary>
public class LocationBranding
{
    /// <summary>
    /// Unique identifier for the branding settings
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The location these branding settings belong to
    /// </summary>
    public int LocationId { get; set; }

    /// <summary>
    /// Custom logo URL for this location
    /// </summary>
    public string? CustomLogoUrl { get; set; }

    /// <summary>
    /// Color scheme settings (JSON format)
    /// </summary>
    public string? ColorScheme { get; set; }

    /// <summary>
    /// Custom name override for this location (displayed instead of LocationName)
    /// </summary>
    public string? CustomNameOverride { get; set; }

    /// <summary>
    /// Additional branding settings in JSON format
    /// </summary>
    public string? SettingsJson { get; set; }

    /// <summary>
    /// When the branding was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the branding was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property to the location
    /// </summary>
    public virtual ClubLocation Location { get; set; } = null!;
}

