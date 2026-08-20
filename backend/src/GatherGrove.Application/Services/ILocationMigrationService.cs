namespace GatherGrove.Application.Services;

/// <summary>
/// Service for migrating existing clubs to multi-location structure
/// </summary>
public interface ILocationMigrationService
{
    /// <summary>
    /// Migrates all existing clubs to have a "Main Location"
    /// </summary>
    Task MigrateExistingClubsToLocationsAsync();

    /// <summary>
    /// Promotes all existing ClubAdmins to LocationAdmins with SuperAdmin permissions
    /// </summary>
    Task PromoteClubAdminsToSuperAdminsAsync();

    /// <summary>
    /// Assigns all existing members to their club's Main Location
    /// </summary>
    Task AssignExistingMembersToMainLocationAsync();

    /// <summary>
    /// Assigns all existing events to their club's Main Location
    /// </summary>
    Task AssignExistingEventsToMainLocationAsync();

    /// <summary>
    /// Runs the complete migration process
    /// </summary>
    Task RunCompleteMigrationAsync();
}

