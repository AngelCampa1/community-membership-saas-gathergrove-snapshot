using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization requirement that verifies a user is an admin of the specified club
/// </summary>
public class ClubAdminRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The club ID parameter name in the route
    /// </summary>
    public string ClubIdParameterName { get; }

    /// <summary>
    /// Creates a new ClubAdminRequirement
    /// </summary>
    /// <param name="clubIdParameterName">The name of the route parameter containing the club ID (default: "clubId")</param>
    public ClubAdminRequirement(string clubIdParameterName = "clubId")
    {
        ClubIdParameterName = clubIdParameterName;
    }
}