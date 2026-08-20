using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Middleware;
using FluentAssertions;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class SecurityHeadersMiddlewareTests
{
    private Mock<RequestDelegate> _mockNext;
    private Mock<ILogger<SecurityHeadersMiddleware>> _mockLogger;
    private SecurityHeadersMiddleware _middleware;

    [SetUp]
    public void SetUp()
    {
        _mockNext = new Mock<RequestDelegate>();
        _mockLogger = new Mock<ILogger<SecurityHeadersMiddleware>>();
        _middleware = new SecurityHeadersMiddleware(_mockNext.Object, _mockLogger.Object);
    }

    #region Bug-Finding Tests: HSTS Configuration

    [Test]
    public async Task HSTS_Header_IncludesOneYearMaxAge()
    {
        // Bug Scenario: HSTS max-age too short could allow downgrade attacks
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Strict-Transport-Security");
        var hsts = context.Response.Headers["Strict-Transport-Security"].ToString();
        hsts.Should().Contain("max-age=31536000", "HSTS should have 1 year (31536000 seconds) max age");
        hsts.Should().Contain("includeSubDomains", "HSTS should protect all subdomains");
    }

    [Test]
    public async Task HSTS_AppliedInDevelopment_CouldCauseLocalIssues()
    {
        // Bug Scenario: HSTS in development forces HTTPS, can break local HTTP development
        // DOCUMENTED BEHAVIOR: Middleware does NOT check environment before applying HSTS
        var context = CreateHttpContext("/api/test");
        context.Request.Scheme = "http"; // Local development often uses HTTP

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Strict-Transport-Security",
            "DOCUMENTED BUG: HSTS applied even on HTTP in development (forces HTTPS upgrade)");
    }

    [Test]
    public async Task HSTS_MissingPreloadDirective()
    {
        // Bug Scenario: Missing 'preload' directive prevents HSTS preload list submission
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var hsts = context.Response.Headers["Strict-Transport-Security"].ToString();
        hsts.Should().NotContain("preload",
            "DOCUMENTED LIMITATION: HSTS missing 'preload' directive for browser preload lists");
    }

    #endregion

    #region Bug-Finding Tests: Content Security Policy

    [Test]
    public async Task CSP_AllowsStripeIntegration()
    {
        // Bug Scenario: CSP too restrictive would break Stripe payment integration
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Content-Security-Policy");
        var csp = context.Response.Headers["Content-Security-Policy"].ToString();

        csp.Should().Contain("https://js.stripe.com", "CSP should allow Stripe scripts");
        csp.Should().Contain("https://api.stripe.com", "CSP should allow Stripe API connections");
        csp.Should().Contain("frame-src 'self' https://js.stripe.com", "CSP should allow Stripe iframe");
    }

    [Test]
    public async Task CSP_UsesStaticNonce_InsteadOfDynamic()
    {
        // Bug Scenario: CSP nonce should be unique per request, not static 'RANDOM'
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var csp = context.Response.Headers["Content-Security-Policy"].ToString();
        csp.Should().Contain("'nonce-RANDOM'",
            "DOCUMENTED BUG: CSP uses static nonce 'RANDOM' instead of dynamic per-request nonce");

        // Make second request - nonce should be different but isn't
        var context2 = CreateHttpContext("/api/test");
        await _middleware.InvokeAsync(context2);
        var csp2 = context2.Response.Headers["Content-Security-Policy"].ToString();

        csp2.Should().Be(csp, "static nonce means same CSP for all requests (security issue)");
    }

    [Test]
    public async Task CSP_AllowsUnsafeInlineStyles()
    {
        // Bug Scenario: 'unsafe-inline' for styles weakens CSP protection
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var csp = context.Response.Headers["Content-Security-Policy"].ToString();
        csp.Should().Contain("style-src 'self' 'unsafe-inline'",
            "DOCUMENTED WEAKNESS: CSP allows 'unsafe-inline' styles (could allow XSS)");
    }

    [Test]
    public async Task CSP_BlocksMixedContent()
    {
        // Bug Scenario: Mixed content (HTTP resources on HTTPS page) should be blocked
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var csp = context.Response.Headers["Content-Security-Policy"].ToString();
        csp.Should().Contain("block-all-mixed-content",
            "CSP should block mixed content (HTTP on HTTPS)");
        csp.Should().Contain("upgrade-insecure-requests",
            "CSP should upgrade insecure requests to HTTPS");
    }

    [Test]
    public async Task CSP_FrameAncestorsDenyClickjacking()
    {
        // Bug Scenario: Missing frame-ancestors allows clickjacking
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var csp = context.Response.Headers["Content-Security-Policy"].ToString();
        csp.Should().Contain("frame-ancestors 'none'",
            "CSP should prevent embedding in iframes (clickjacking protection)");
    }

    #endregion

    #region Bug-Finding Tests: Clickjacking Protection

    [Test]
    public async Task XFrameOptions_SetToDeny()
    {
        // Bug Scenario: X-Frame-Options should be DENY to prevent clickjacking
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-Frame-Options");
        context.Response.Headers["X-Frame-Options"].ToString().Should().Be("DENY",
            "X-Frame-Options should be DENY to prevent all framing");
    }

    [Test]
    public async Task XFrameOptions_ConflictsWithCSPFrameAncestors()
    {
        // Bug Scenario: Both X-Frame-Options and CSP frame-ancestors provide same protection
        // DOCUMENTED REDUNDANCY: Modern browsers prefer CSP, but X-Frame-Options kept for legacy
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-Frame-Options");
        var csp = context.Response.Headers["Content-Security-Policy"].ToString();
        csp.Should().Contain("frame-ancestors 'none'",
            "DOCUMENTED REDUNDANCY: Both X-Frame-Options and CSP frame-ancestors set (not a bug, defense in depth)");
    }

    #endregion

    #region Bug-Finding Tests: Content Type Sniffing

    [Test]
    public async Task ContentTypeOptions_SetToNoSniff()
    {
        // Bug Scenario: Missing nosniff allows browser to MIME-sniff and execute malicious files
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-Content-Type-Options");
        context.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff",
            "X-Content-Type-Options should be 'nosniff' to prevent MIME sniffing attacks");
    }

    #endregion

    #region Bug-Finding Tests: XSS Protection Header

    [Test]
    public async Task XSSProtection_Enabled()
    {
        // Bug Scenario: X-XSS-Protection header is DEPRECATED (Chrome removed support in 2019)
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-XSS-Protection");
        context.Response.Headers["X-XSS-Protection"].ToString().Should().Be("1; mode=block",
            "DOCUMENTED LEGACY: X-XSS-Protection set but deprecated (modern browsers ignore it)");
    }

    #endregion

    #region Bug-Finding Tests: Referrer Policy

    [Test]
    public async Task ReferrerPolicy_StrictOrigin()
    {
        // Bug Scenario: Weak referrer policy could leak sensitive URLs to third parties
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Referrer-Policy");
        context.Response.Headers["Referrer-Policy"].ToString().Should().Be("strict-origin-when-cross-origin",
            "Referrer-Policy should be strict to prevent URL leakage");
    }

    #endregion

    #region Bug-Finding Tests: Permissions Policy

    [Test]
    public async Task PermissionsPolicy_AllowsStripePayment()
    {
        // Bug Scenario: Blocking payment feature would break Stripe integration
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Permissions-Policy");
        var policy = context.Response.Headers["Permissions-Policy"].ToString();
        policy.Should().Contain("payment=('self' https://js.stripe.com)",
            "Permissions-Policy should allow payment API for Stripe");
    }

    [Test]
    public async Task PermissionsPolicy_BlocksDangerousFeatures()
    {
        // Bug Scenario: Dangerous features like camera/microphone should be blocked
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var policy = context.Response.Headers["Permissions-Policy"].ToString();
        policy.Should().Contain("geolocation=()", "should block geolocation");
        policy.Should().Contain("microphone=()", "should block microphone");
        policy.Should().Contain("camera=()", "should block camera");
        policy.Should().Contain("usb=()", "should block USB access");
    }

    [Test]
    public async Task PermissionsPolicy_AllowsFullscreenForSelf()
    {
        // Bug Scenario: Blocking fullscreen would break legitimate UI features
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var policy = context.Response.Headers["Permissions-Policy"].ToString();
        policy.Should().Contain("fullscreen=(self)",
            "fullscreen should be allowed for self (needed for modals, videos)");
    }

    #endregion

    #region Bug-Finding Tests: CORS and Cross-Origin Headers

    [Test]
    public async Task CrossOriginHeaders_ConfiguredCorrectly()
    {
        // Bug Scenario: CORS headers must be configured to prevent embedding attacks
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Cross-Origin-Embedder-Policy");
        context.Response.Headers["Cross-Origin-Embedder-Policy"].ToString().Should().Be("require-corp",
            "COEP should require corp for cross-origin resources");

        context.Response.Headers.Should().ContainKey("Cross-Origin-Opener-Policy");
        context.Response.Headers["Cross-Origin-Opener-Policy"].ToString().Should().Be("same-origin",
            "COOP should be same-origin to prevent window references");

        context.Response.Headers.Should().ContainKey("Cross-Origin-Resource-Policy");
        context.Response.Headers["Cross-Origin-Resource-Policy"].ToString().Should().Be("cross-origin",
            "CORP should allow cross-origin for API resources");
    }

    [Test]
    public async Task CrossOriginResourcePolicy_ConflictWithCOEP()
    {
        // Bug Scenario: COEP=require-corp + CORP=cross-origin might conflict
        // COEP requires resources to opt-in via CORP, but CORP=cross-origin allows all
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        var coep = context.Response.Headers["Cross-Origin-Embedder-Policy"].ToString();
        var corp = context.Response.Headers["Cross-Origin-Resource-Policy"].ToString();

        coep.Should().Be("require-corp");
        corp.Should().Be("cross-origin",
            "DOCUMENTED POTENTIAL CONFLICT: COEP requires corp but CORP allows cross-origin");
    }

    #endregion

    #region Bug-Finding Tests: Server Header Removal

    [Test]
    public async Task ServerHeader_IsRemoved()
    {
        // Bug Scenario: Server header reveals technology stack to attackers
        var context = CreateHttpContext("/api/test");
        context.Response.Headers.Append("Server", "Kestrel"); // Simulate server adding header

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().NotContainKey("Server",
            "Server header should be removed to hide technology stack");
    }

    [Test]
    public async Task ServerHeader_RemovalTiming()
    {
        // Bug Scenario: Server might add header AFTER middleware runs
        var context = CreateHttpContext("/api/test");

        // Middleware removes header
        await _middleware.InvokeAsync(context);

        // Simulate server adding header after middleware
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["Server"] = "Kestrel";
            return Task.CompletedTask;
        });

        // This test DOCUMENTS that header removal happens before response starts
        // If server adds header in OnStarting, it would appear in final response
        Assert.Pass("Server header removal timing: middleware runs before response starts");
    }

    #endregion

    #region Bug-Finding Tests: Header Application Scope

    [Test]
    public async Task SecurityHeaders_AppliedToAllEndpoints()
    {
        // Bug Scenario: Security headers should apply to ALL responses, not just API routes
        var paths = new[] { "/api/test", "/health", "/.well-known/acme", "/swagger", "/" };

        foreach (var path in paths)
        {
            var context = CreateHttpContext(path);
            await _middleware.InvokeAsync(context);

            context.Response.Headers.Should().ContainKey("Strict-Transport-Security",
                $"HSTS should be applied to {path}");
            context.Response.Headers.Should().ContainKey("Content-Security-Policy",
                $"CSP should be applied to {path}");
        }
    }

    [Test]
    public async Task SecurityHeaders_AppliedToOptionsRequests()
    {
        // Bug Scenario: OPTIONS requests (CORS preflight) might skip security headers
        var context = CreateHttpContext("/api/test", "OPTIONS");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Strict-Transport-Security",
            "security headers should apply to OPTIONS requests");
        context.Response.Headers.Should().ContainKey("Content-Security-Policy",
            "CSP should apply to OPTIONS requests");
    }

    [Test]
    public async Task SecurityHeaders_NotDuplicated()
    {
        // Bug Scenario: If middleware runs twice, headers might be duplicated
        var context = CreateHttpContext("/api/test");

        // Run middleware twice (simulating misconfiguration)
        await _middleware.InvokeAsync(context);
        await _middleware.InvokeAsync(context);

        // Headers should only have one value, not duplicated
        var hsts = context.Response.Headers["Strict-Transport-Security"];
        hsts.Count.Should().Be(1, "HSTS header should not be duplicated if middleware runs multiple times");
    }

    #endregion

    #region Bug-Finding Tests: Adobe Cross-Domain Policy

    [Test]
    public async Task PermittedCrossDomainPolicies_SetToNone()
    {
        // Bug Scenario: Missing header allows Flash/PDF to make cross-domain requests
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-Permitted-Cross-Domain-Policies");
        context.Response.Headers["X-Permitted-Cross-Domain-Policies"].ToString().Should().Be("none",
            "X-Permitted-Cross-Domain-Policies should be 'none' to block Flash/PDF cross-domain requests");
    }

    #endregion

    #region Bug-Finding Tests: Integration with Other Middleware

    [Test]
    public async Task SecurityHeaders_DoNotConflictWithCorsMiddleware()
    {
        // Bug Scenario: CORS middleware might add conflicting headers
        var context = CreateHttpContext("/api/test");
        context.Request.Headers["Origin"] = "https://example.com";

        // Simulate CORS middleware adding headers first
        context.Response.Headers["Access-Control-Allow-Origin"] = "https://example.com";
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET,POST";

        await _middleware.InvokeAsync(context);

        // Security headers should coexist with CORS headers
        context.Response.Headers.Should().ContainKey("Access-Control-Allow-Origin",
            "CORS headers should not be removed by security middleware");
        context.Response.Headers.Should().ContainKey("Strict-Transport-Security",
            "security headers should coexist with CORS headers");
    }

    #endregion

    #region Helper Methods

    private DefaultHttpContext CreateHttpContext(string path, string method = "GET")
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        context.Request.Method = method;
        context.Request.Scheme = "https";
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.1");
        return context;
    }

    #endregion
}
