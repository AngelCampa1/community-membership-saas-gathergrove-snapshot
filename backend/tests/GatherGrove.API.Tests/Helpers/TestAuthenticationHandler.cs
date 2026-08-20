using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace GatherGrove.API.Tests.Helpers;

/// <summary>
/// Test authentication handler for integration tests
/// Provides authenticated admin user with unlimited tier access
/// </summary>
public class TestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check for test headers first (this is the primary method for tests)
        if (Request.Headers.ContainsKey("X-Test-UserId"))
        {
            var userId = Request.Headers["X-Test-UserId"].ToString();
            var clubId = Request.Headers["X-Test-ClubId"].ToString();
            var isAdmin = Request.Headers["X-Test-IsAdmin"].ToString();
            var role = Request.Headers["X-Test-Role"].ToString();
            var unlimitedTier = Request.Headers["X-Test-UnlimitedTier"].ToString();

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, $"test{userId}@example.com"),
                new Claim(ClaimTypes.Name, $"Test User {userId}"),
                new Claim("ClubId", clubId),
                new Claim("IsAdmin", isAdmin),
                new Claim("UnlimitedTier", unlimitedTier),
                new Claim("TierAccess", unlimitedTier.ToLower() == "true" ? "Unlimited" : "Basic"),
                new Claim(ClaimTypes.Role, role),
                new Claim("sub", userId),
                new Claim("userId", userId)
            };

            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "Test");

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }

        // Fallback to Authorization header for explicit test scenarios
        if (Request.Headers.ContainsKey("Authorization"))
        {
            var authHeader = Request.Headers.Authorization.ToString();

            // Handle unauthorized test case
            if (authHeader == "UnauthorizedTest")
            {
                var unauthorizedClaims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, "999"),
                    new Claim(ClaimTypes.Email, "unauthorized@example.com"),
                    new Claim(ClaimTypes.Name, "Unauthorized User"),
                    new Claim("ClubId", "999"),
                    new Claim("IsAdmin", "false"),
                    new Claim("UnlimitedTier", "false"),
                    new Claim("TierAccess", "Basic"),
                    new Claim(ClaimTypes.Role, "Member"),
                    new Claim("sub", "999"),
                    new Claim("userId", "999")
                };

                var unauthorizedIdentity = new ClaimsIdentity(unauthorizedClaims, "Test");
                var unauthorizedPrincipal = new ClaimsPrincipal(unauthorizedIdentity);
                var unauthorizedTicket = new AuthenticationTicket(unauthorizedPrincipal, "Test");

                return Task.FromResult(AuthenticateResult.Success(unauthorizedTicket));
            }

            // Only succeed for specific test authorization headers
            if (authHeader == "Test" || authHeader == "AuthorizedTest")
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, "1"),
                    new Claim(ClaimTypes.Email, "test@example.com"),
                    new Claim(ClaimTypes.Name, "Test User"),
                    new Claim("ClubId", "1"),
                    new Claim("IsAdmin", "true"),
                    new Claim("UnlimitedTier", "true"),
                    new Claim("TierAccess", "Unlimited"),
                    new Claim(ClaimTypes.Role, "Admin"),
                    new Claim("sub", "1"),
                    new Claim("userId", "1")
                };

                var identity = new ClaimsIdentity(claims, "Test");
                var principal = new ClaimsPrincipal(identity);
                var ticket = new AuthenticationTicket(principal, "Test");

                return Task.FromResult(AuthenticateResult.Success(ticket));
            }
        }

        // No valid authentication found
        return Task.FromResult(AuthenticateResult.Fail("No valid test authentication found"));
    }
}

/// <summary>
/// Authorized test authentication handler - user with proper permissions
/// </summary>
public class AuthorizedTestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public AuthorizedTestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if Authorization header is present and matches this scheme
        if (!Request.Headers.ContainsKey("Authorization"))
        {
            return Task.FromResult(AuthenticateResult.Fail("No Authorization header"));
        }

        var authHeader = Request.Headers.Authorization.ToString();
        if (authHeader != "AuthorizedTest")
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid authorization for AuthorizedTest scheme"));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "authorized@example.com"),
            new Claim(ClaimTypes.Name, "Authorized User"),
            new Claim("ClubId", "200"),
            new Claim("IsAdmin", "true"),
            new Claim("UnlimitedTier", "true"),
            new Claim("TierAccess", "Unlimited"),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim("sub", "1"),
            new Claim("userId", "1")
        };

        var identity = new ClaimsIdentity(claims, "AuthorizedTest");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "AuthorizedTest");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

/// <summary>
/// Unauthorized test authentication handler - user without proper permissions
/// </summary>
public class UnauthorizedTestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public UnauthorizedTestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if Authorization header is present and matches this scheme
        if (!Request.Headers.ContainsKey("Authorization"))
        {
            return Task.FromResult(AuthenticateResult.Fail("No Authorization header"));
        }

        var authHeader = Request.Headers.Authorization.ToString();
        if (authHeader != "UnauthorizedTest")
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid authorization for UnauthorizedTest scheme"));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Email, "unauthorized@example.com"),
            new Claim(ClaimTypes.Name, "Unauthorized User"),
            new Claim("ClubId", "999"), // Different club
            new Claim("IsAdmin", "false"),
            new Claim("UnlimitedTier", "false"),
            new Claim("TierAccess", "Basic"),
            new Claim(ClaimTypes.Role, "Member"),
            new Claim("sub", "2"),
            new Claim("userId", "2")
        };

        var identity = new ClaimsIdentity(claims, "UnauthorizedTest");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "UnauthorizedTest");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}