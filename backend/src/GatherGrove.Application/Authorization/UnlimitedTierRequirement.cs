using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization requirement for Expand tier features
/// </summary>
public class UnlimitedTierRequirement : IAuthorizationRequirement
{
    public const string PolicyName = "UnlimitedTierRequired";
}