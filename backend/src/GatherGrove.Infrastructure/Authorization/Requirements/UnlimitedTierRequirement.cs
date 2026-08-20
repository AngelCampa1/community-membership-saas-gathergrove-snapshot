using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Infrastructure.Authorization.Requirements;

/// <summary>
/// Authorization requirement for Expand tier features
/// Used to restrict access to premium analytics and engagement features
/// </summary>
public class UnlimitedTierRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// Gets the name of the requirement for logging and debugging
    /// </summary>
    public string RequirementName => "UnlimitedTier";

    /// <summary>
    /// Gets a description of what this requirement enforces
    /// </summary>
    public string Description => "Requires user to have access to Expand tier features for the specified club";
}