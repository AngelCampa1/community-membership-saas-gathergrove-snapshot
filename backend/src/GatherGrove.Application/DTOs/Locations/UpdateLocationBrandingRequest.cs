using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Request to update location branding
/// </summary>
public class UpdateLocationBrandingRequest
{
    /// <summary>
    /// Custom logo URL for this location
    /// </summary>
    [StringLength(500)]
    public string? CustomLogoUrl { get; set; }

    /// <summary>
    /// Color scheme settings (JSON format)
    /// </summary>
    public string? ColorScheme { get; set; }

    /// <summary>
    /// Custom name override for this location
    /// </summary>
    [StringLength(200)]
    public string? CustomNameOverride { get; set; }

    /// <summary>
    /// Additional branding settings in JSON format
    /// </summary>
    public string? SettingsJson { get; set; }
}

