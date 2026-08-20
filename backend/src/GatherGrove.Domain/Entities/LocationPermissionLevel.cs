namespace GatherGrove.Domain.Entities;

/// <summary>
/// Defines the hierarchical permission levels for location administration
/// </summary>
public enum LocationPermissionLevel
{
    /// <summary>
    /// Full access to all locations and settings
    /// </summary>
    SuperAdmin = 1,

    /// <summary>
    /// Access to a subset of locations (regional management)
    /// </summary>
    RegionalManager = 2,

    /// <summary>
    /// Full access to a single location
    /// </summary>
    LocationAdmin = 3,

    /// <summary>
    /// Limited administrative access to a single location
    /// </summary>
    LocationModerator = 4,

    /// <summary>
    /// Read-only access to a single location
    /// </summary>
    Staff = 5
}

