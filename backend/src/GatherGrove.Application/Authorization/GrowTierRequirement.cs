using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization requirement that verifies a club has Grow tier access
/// </summary>
public class GrowTierRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The club ID parameter name in the route
    /// </summary>
    public string ClubIdParameterName { get; }

    /// <summary>
    /// Creates a new GrowTierRequirement
    /// </summary>
    /// <param name="clubIdParameterName">The name of the route parameter containing the club ID (default: "clubId")</param>
    public GrowTierRequirement(string clubIdParameterName = "clubId")
    {
        ClubIdParameterName = clubIdParameterName;
    }
}