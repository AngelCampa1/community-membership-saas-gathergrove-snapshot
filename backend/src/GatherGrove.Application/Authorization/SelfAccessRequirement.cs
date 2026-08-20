using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization requirement that verifies a user can only access their own data or is an admin
/// </summary>
public class SelfAccessRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The user ID parameter name in the route
    /// </summary>
    public string UserIdParameterName { get; }

    /// <summary>
    /// Creates a new SelfAccessRequirement
    /// </summary>
    /// <param name="userIdParameterName">The name of the route parameter containing the user ID (default: "userId")</param>
    public SelfAccessRequirement(string userIdParameterName = "userId")
    {
        UserIdParameterName = userIdParameterName;
    }
}