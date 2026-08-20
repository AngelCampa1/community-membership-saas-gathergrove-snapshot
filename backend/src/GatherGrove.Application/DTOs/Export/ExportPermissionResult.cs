using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Result of export permission validation
/// </summary>
public class ExportPermissionResult
{
    /// <summary>
    /// Whether the user is authorized for the export operation
    /// </summary>
    public bool IsAuthorized { get; set; }

    /// <summary>
    /// The access level granted to the user
    /// </summary>
    public ExportAccessLevel AccessLevel { get; set; }

    /// <summary>
    /// List of specific permissions granted to the user
    /// </summary>
    public List<string> PermissionGranted { get; set; } = new List<string>();

    /// <summary>
    /// Whether data restrictions should be applied during export
    /// </summary>
    public bool DataRestrictionsApply { get; set; }

    /// <summary>
    /// Reason for denial if not authorized
    /// </summary>
    public string? DenialReason { get; set; }
}