using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Test authorization policy provider that allows all requests for testing
/// </summary>
public class TestAuthorizationPolicyProvider : IAuthorizationPolicyProvider
{
    private readonly DefaultAuthorizationPolicyProvider _defaultProvider;

    public TestAuthorizationPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _defaultProvider = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
    {
        // Return a policy that allows all authenticated users
        // Note: This is used when [Authorize] is used without parameters
        // Role-based authorization like [Authorize(Roles = "Admin")] uses a different mechanism
        var policy = new AuthorizationPolicyBuilder()
            .RequireAssertion(context => context.User.Identity?.IsAuthenticated == true)
            .Build();

        return Task.FromResult(policy);
    }

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
    {
        return Task.FromResult<AuthorizationPolicy?>(null);
    }

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // For all authorization policies in test, return a policy that allows all authenticated users
        // This includes AdminOnly, UnlimitedTierRequired, GrowTierRequired, and any other custom policies
        var policy = new AuthorizationPolicyBuilder()
            .RequireAssertion(context =>
            {
                // Always allow if user is authenticated in test environment
                return context.User.Identity?.IsAuthenticated == true;
            })
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}