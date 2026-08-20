namespace GatherGrove.Domain.Enums;

/// <summary>
/// Defines access levels for export operations
/// </summary>
public enum ExportAccessLevel
{
    /// <summary>
    /// No access to export operations
    /// </summary>
    None = 0,

    /// <summary>
    /// Limited export access - restricted data only
    /// </summary>
    Limited = 1,

    /// <summary>
    /// Member-level export access - club member data
    /// </summary>
    Member = 2,

    /// <summary>
    /// Admin-level export access - all club data
    /// </summary>
    Admin = 3,

    /// <summary>
    /// Full export access - all data and admin functions
    /// </summary>
    Full = 4
}