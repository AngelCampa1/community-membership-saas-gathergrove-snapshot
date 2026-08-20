using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Request to update an existing location
/// </summary>
public class UpdateLocationRequest
{
    /// <summary>
    /// Name of the location/chapter
    /// </summary>
    [StringLength(200)]
    public string? LocationName { get; set; }

    /// <summary>
    /// Street address of the location
    /// </summary>
    [StringLength(500)]
    public string? Address { get; set; }

    /// <summary>
    /// City where the location is based
    /// </summary>
    [StringLength(100)]
    public string? City { get; set; }

    /// <summary>
    /// State/Province where the location is based
    /// </summary>
    [StringLength(100)]
    public string? State { get; set; }

    /// <summary>
    /// Country where the location is based
    /// </summary>
    [StringLength(100)]
    public string? Country { get; set; }

    /// <summary>
    /// Timezone for the location (e.g., "America/New_York")
    /// </summary>
    [StringLength(100)]
    public string? Timezone { get; set; }

    /// <summary>
    /// Contact email for this location
    /// </summary>
    [EmailAddress]
    [StringLength(255)]
    public string? ContactEmail { get; set; }

    /// <summary>
    /// Contact phone for this location
    /// </summary>
    [StringLength(20)]
    public string? ContactPhone { get; set; }

    /// <summary>
    /// Whether this location is currently active
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// JSON string for additional location-specific settings
    /// </summary>
    public string? SettingsJson { get; set; }
}

