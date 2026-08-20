using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Request to create a new location for a club
/// </summary>
public class CreateLocationRequest
{
    /// <summary>
    /// Name of the location/chapter
    /// </summary>
    [Required]
    [StringLength(200)]
    public string LocationName { get; set; } = string.Empty;

    /// <summary>
    /// Unique code for the location (e.g., "NYC", "LA-WEST")
    /// </summary>
    [Required]
    [StringLength(50)]
    public string LocationCode { get; set; } = string.Empty;

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
    /// JSON string for additional location-specific settings
    /// </summary>
    public string? SettingsJson { get; set; }
}

