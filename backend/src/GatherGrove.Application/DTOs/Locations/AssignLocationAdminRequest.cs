using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Request to assign an admin to a location
/// </summary>
public class AssignLocationAdminRequest
{
    /// <summary>
    /// User ID to assign as admin
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Permission level to grant
    /// </summary>
    [Required]
    public LocationPermissionLevel PermissionLevel { get; set; }
}
