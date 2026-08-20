using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Test authentication handler that creates authenticated users for testing
/// </summary>
public class TestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if any authorization header is provided (Bearer token or test headers)
        var authHeader = Context.Request.Headers["Authorization"].FirstOrDefault();
        var testUserId = Context.Request.Headers["X-Test-UserId"].FirstOrDefault();

        // If no authorization header and no test headers, return no result (unauthenticated)
        if (string.IsNullOrEmpty(authHeader) && string.IsNullOrEmpty(testUserId))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        // Get test user claims from request headers
        var userId = testUserId ?? "1";
        var clubId = Context.Request.Headers["X-Test-ClubId"].FirstOrDefault() ?? "1";
        var isAdmin = Context.Request.Headers["X-Test-IsAdmin"].FirstOrDefault() ?? "true";
        var role = Context.Request.Headers["X-Test-Role"].FirstOrDefault() ?? "Admin";
        var hasUnlimitedTier = Context.Request.Headers["X-Test-UnlimitedTier"].FirstOrDefault() ?? "true";

        // Create claims for the test user
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("userId", userId),
            new Claim("ClubId", clubId),
            new Claim("IsAdmin", isAdmin),
            new Claim(ClaimTypes.Role, role),
            new Claim("UnlimitedTier", hasUnlimitedTier),
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim(ClaimTypes.Email, "test@example.com")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}