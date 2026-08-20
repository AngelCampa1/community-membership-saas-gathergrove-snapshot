using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization requirement that verifies a user is a member (admin or member role) of the specified club
/// </summary>
public class ClubMemberRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The club ID parameter name in the route
    /// </summary>
    public string ClubIdParameterName { get; }

    /// <summary>
    /// Creates a new ClubMemberRequirement
    /// </summary>
    /// <param name="clubIdParameterName">The name of the route parameter containing the club ID (default: "clubId")</param>
    public ClubMemberRequirement(string clubIdParameterName = "clubId")
    {
        ClubIdParameterName = clubIdParameterName;
    }
}