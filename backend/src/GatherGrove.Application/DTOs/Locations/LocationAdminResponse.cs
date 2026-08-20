using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Response containing location admin details
/// </summary>
public class LocationAdminResponse
{
    /// <summary>
    /// Location admin record ID
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
    /// User ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    public string UserFullName { get; set; } = string.Empty;

    /// <summary>
    /// User's email
    /// </summary>
    public string UserEmail { get; set; } = string.Empty;

    /// <summary>
    /// Permission level enum value
    /// </summary>
    public LocationPermissionLevel PermissionLevel { get; set; }

    /// <summary>
    /// Permission level as string
    /// </summary>
    public string PermissionLevelName { get; set; } = string.Empty;

    /// <summary>
    /// When assigned
    /// </summary>
    public DateTime AssignedAt { get; set; }

    /// <summary>
    /// Who assigned this admin
    /// </summary>
    public int? AssignedBy { get; set; }

    /// <summary>
    /// Name of who assigned
    /// </summary>
    public string? AssignedByName { get; set; }
}
