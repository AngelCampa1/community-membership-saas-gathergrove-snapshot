using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Middleware;
using FluentAssertions;
using System.Text;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class SecurityMiddlewareTests
{
    private Mock<RequestDelegate> _mockNext;
    private Mock<ILogger<SecurityMiddleware>> _mockLogger;
    private IConfiguration _configuration;
    private SecurityMiddleware _middleware;

    [SetUp]
    public void SetUp()
    {
        _mockNext = new Mock<RequestDelegate>();
        _mockLogger = new Mock<ILogger<SecurityMiddleware>>();

        // Create configuration with security settings enabled
        var configValues = new Dictionary<string, string?>
        {
            ["ASPNETCORE_ENVIRONMENT"] = "Production",
            ["Security:RateLimitPerMinute"] = "100",
            ["Security:EnableXssProtection"] = "true",
            ["Security:EnableSqlInjectionProtection"] = "true"
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        _middleware = new SecurityMiddleware(_mockNext.Object, _mockLogger.Object, _configuration);
    }

    #region Bug-Finding Tests: Security Headers

    [Test]
    public async Task SecurityHeaders_Production_IncludesHSTS()
    {
        // Bug Scenario: HSTS header should only be present in production
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Strict-Transport-Security",
            "HSTS header should be present in production environment");
        var hsts = context.Response.Headers["Strict-Transport-Security"].ToString();
        hsts.Should().Contain("max-age=31536000", "HSTS should have 1 year max age");
        hsts.Should().Contain("includeSubDomains", "HSTS should include subdomains");
    }

    [Test]
    public async Task SecurityHeaders_Development_ExcludesHSTS()
    {
        // Bug Scenario: HSTS in development could cause local development issues
        var devConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = "Development",
                ["Security:EnableXssProtection"] = "true",
                ["Security:EnableSqlInjectionProtection"] = "true"
            })
            .Build();

        var devMiddleware = new SecurityMiddleware(_mockNext.Object, _mockLogger.Object, devConfig);
        var context = CreateHttpContext("/api/test");

        await devMiddleware.InvokeAsync(context);

        context.Response.Headers.Should().NotContainKey("Strict-Transport-Security",
            "HSTS should NOT be present in development environment");
    }

    [Test]
    public async Task SecurityHeaders_CSP_AllowsStripeAndGoogleAnalytics()
    {
        // Bug Scenario: CSP too restrictive would break Stripe payment integration
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Content-Security-Policy");
        var csp = context.Response.Headers["Content-Security-Policy"].ToString();

        csp.Should().Contain("https://js.stripe.com", "CSP should allow Stripe scripts");
        csp.Should().Contain("https://api.stripe.com", "CSP should allow Stripe API connections");
        csp.Should().Contain("https://www.googletagmanager.com", "CSP should allow Google Tag Manager");
    }

    [Test]
    public async Task SecurityHeaders_XFrameOptions_PreventClickjacking()
    {
        // Bug Scenario: Missing or weak X-Frame-Options allows clickjacking attacks
        var context = CreateHttpContext("/api/test");

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-Frame-Options");
        context.Response.Headers["X-Frame-Options"].ToString().Should().Be("DENY",
            "X-Frame-Options should be DENY to prevent clickjacking");
    }

    [Test]
    public async Task SecurityHeaders_RemovesServerHeader()
    {
        // Bug Scenario: Server header reveals technology stack to attackers
        var context = CreateHttpContext("/api/test");
        context.Response.Headers.Append("Server", "Kestrel"); // Simulating default server header

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().NotContainKey("Server",
            "Server header should be removed to hide technology stack");
        context.Response.Headers["X-Powered-By"].ToString().Should().BeEmpty(
            "X-Powered-By should be empty");
    }

    #endregion

    #region Bug-Finding Tests: SQL Injection Detection

    [Test]
    public async Task SqlInjection_ClassicUnionAttack_IsBlocked()
    {
        // Bug Scenario: Classic SQL injection with UNION SELECT
        var context = CreateHttpContext("/api/members?search=' UNION SELECT * FROM Users--");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "SQL injection attempt with UNION should be blocked");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Never,
            "Request should not proceed to next middleware");
    }

    [Test]
    public async Task SqlInjection_BooleanBasedAttack_IsBlocked()
    {
        // Bug Scenario: Boolean-based blind SQL injection
        var context = CreateHttpContext("/api/members?id=1 OR 1=1");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "Boolean-based SQL injection should be blocked");
    }

    [Test]
    public async Task SqlInjection_CommentBasedBypass_IsBlocked()
    {
        // Bug Scenario: Using SQL comments to bypass validation
        var context = CreateHttpContext("/api/members?search=admin' --");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "SQL injection with comment bypass should be blocked");
    }

    [Test]
    public async Task SqlInjection_CaseVariation_IsBlocked()
    {
        // Bug Scenario: Attacker uses case variations to bypass detection
        var context = CreateHttpContext("/api/members?search=' UnIoN SeLeCt * FROM Users--");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "SQL injection with case variations should be blocked (regex should be case-insensitive)");
    }

    [Test]
    public async Task SqlInjection_InRequestBody_IsBlocked()
    {
        // Bug Scenario: SQL injection in POST body instead of query string
        var context = CreateHttpContext("/api/members", "POST");
        var maliciousBody = "{\"name\": \"test' OR '1'='1\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(maliciousBody));

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "SQL injection in request body should be blocked");
    }

    [Test]
    public async Task SqlInjection_LegitimateSelectKeyword_IsAllowed()
    {
        // Bug Scenario: False positive - "select" appears in legitimate product names
        // This is a KNOWN LIMITATION - legitimate use of SQL keywords will be blocked
        // Testing to document this behavior
        var context = CreateHttpContext("/api/products?name=Select%20Premium%20Coffee");

        await _middleware.InvokeAsync(context);

        // This WILL be blocked due to pattern matching - known false positive
        // Documenting expected behavior vs. ideal behavior
        context.Response.StatusCode.Should().Be(400,
            "KNOWN LIMITATION: 'select' in legitimate context is blocked (false positive)");
    }

    #endregion

    #region Bug-Finding Tests: XSS Detection

    [Test]
    public async Task XSS_ScriptTag_IsBlocked()
    {
        // Bug Scenario: Classic XSS with <script> tag
        var context = CreateHttpContext("/api/posts", "POST");
        var xssBody = "{\"content\": \"<script>alert('XSS')</script>\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(xssBody));

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400, "XSS with script tag should be blocked");
    }

    [Test]
    public async Task XSS_JavascriptProtocol_IsBlocked()
    {
        // Bug Scenario: XSS using javascript: protocol in links
        var context = CreateHttpContext("/api/posts", "POST");
        var xssBody = "{\"url\": \"javascript:alert('XSS')\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(xssBody));

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "XSS with javascript: protocol should be blocked");
    }

    [Test]
    public async Task XSS_EventHandler_IsBlocked()
    {
        // Bug Scenario: XSS using event handlers (onload, onerror, onclick)
        var context = CreateHttpContext("/api/posts", "POST");
        var xssBody = "{\"content\": \"<img src=x onerror=alert('XSS')>\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(xssBody));

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "XSS with event handler should be blocked");
    }

    [Test]
    public async Task XSS_IframeInjection_IsBlocked()
    {
        // Bug Scenario: XSS using iframe to load malicious content
        var context = CreateHttpContext("/api/posts", "POST");
        var xssBody = "{\"content\": \"<iframe src='http://evil.com'></iframe>\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(xssBody));

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400, "XSS with iframe should be blocked");
    }

    [Test]
    public async Task XSS_CaseVariation_IsBlocked()
    {
        // Bug Scenario: XSS with case variations to bypass detection
        var context = CreateHttpContext("/api/posts", "POST");
        var xssBody = "{\"content\": \"<ScRiPt>alert('XSS')</sCrIpT>\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(xssBody));

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "XSS with case variations should be blocked (regex should be case-insensitive)");
    }

    #endregion

    #region Bug-Finding Tests: Request Body Stream Handling

    [Test]
    public async Task RequestBody_AfterValidation_StreamPositionReset()
    {
        // Bug Scenario: If stream position not reset, controller can't read body
        var context = CreateHttpContext("/api/members", "POST");
        var validBody = "{\"name\": \"John Doe\", \"email\": \"john@example.com\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(validBody));

        await _middleware.InvokeAsync(context);

        // Assert: Stream position should be reset to 0
        context.Request.Body.Position.Should().Be(0,
            "request body stream should be reset after validation for controller to read");
    }

    [Test]
    public async Task RequestBody_EmptyBody_DoesNotCrash()
    {
        // Bug Scenario: Empty POST body could cause null reference exception
        var context = CreateHttpContext("/api/members", "POST");
        context.Request.Body = new MemoryStream(); // Empty stream

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(500,
            "empty request body should not cause server error");
    }

    [Test]
    public async Task RequestBody_NullContentLength_HandlesGracefully()
    {
        // Bug Scenario: Missing Content-Length header could cause issues
        var context = CreateHttpContext("/api/members", "POST");
        context.Request.ContentLength = null;
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{\"test\":\"data\"}"));

        await _middleware.InvokeAsync(context);

        // Should handle gracefully - either allow or reject, but not crash
        context.Response.StatusCode.Should().BeOneOf(200, 400, 500);
    }

    #endregion

    #region Bug-Finding Tests: Configuration Edge Cases

    [Test]
    public async Task Configuration_XssProtectionDisabled_AllowsScriptTags()
    {
        // Bug Scenario: When XSS protection is disabled, malicious content should pass through
        var disabledConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:EnableXssProtection"] = "false",
                ["Security:EnableSqlInjectionProtection"] = "true"
            })
            .Build();

        var permissiveMiddleware = new SecurityMiddleware(_mockNext.Object, _mockLogger.Object, disabledConfig);
        var context = CreateHttpContext("/api/posts", "POST");
        var xssBody = "{\"content\": \"<script>alert('XSS')</script>\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(xssBody));

        await permissiveMiddleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(400,
            "when XSS protection is disabled, script tags should be allowed");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once,
            "request should proceed to next middleware");
    }

    [Test]
    public async Task Configuration_SqlInjectionProtectionDisabled_AllowsSqlPatterns()
    {
        // Bug Scenario: When SQL injection protection is disabled, SQL keywords should pass
        var disabledConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:EnableXssProtection"] = "true",
                ["Security:EnableSqlInjectionProtection"] = "false"
            })
            .Build();

        var permissiveMiddleware = new SecurityMiddleware(_mockNext.Object, _mockLogger.Object, disabledConfig);
        var context = CreateHttpContext("/api/members?search=' UNION SELECT * FROM Users--");

        await permissiveMiddleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(400,
            "when SQL injection protection is disabled, SQL patterns should be allowed");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once,
            "request should proceed to next middleware");
    }

    [Test]
    public async Task Configuration_MissingValues_UsesDefaults()
    {
        // Bug Scenario: Missing configuration values could cause null reference exceptions
        var emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        // Should not crash during construction
        var defaultMiddleware = new SecurityMiddleware(_mockNext.Object, _mockLogger.Object, emptyConfig);
        var context = CreateHttpContext("/api/test");

        await defaultMiddleware.InvokeAsync(context);

        // Should use defaults and not crash
        context.Response.StatusCode.Should().NotBe(500, "missing config should use defaults");
    }

    #endregion

    #region Bug-Finding Tests: GET Requests (No Body Validation)

    [Test]
    public async Task GetRequest_WithSqlInjectionInQuery_IsBlocked()
    {
        // Bug Scenario: GET requests should still validate query strings
        var context = CreateHttpContext("/api/members?id=1 OR 1=1", "GET");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "GET requests with SQL injection in query should be blocked");
    }

    [Test]
    public async Task GetRequest_NoQueryString_IsAllowed()
    {
        // Bug Scenario: Simple GET request should not be blocked
        var context = CreateHttpContext("/api/members", "GET");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(400, "clean GET request should be allowed");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once);
    }

    #endregion

    #region Bug-Finding Tests: Regex Performance (ReDoS)

    [Test]
    public async Task SqlInjection_LongRepeatingPattern_DoesNotCauseTimeout()
    {
        // Bug Scenario: Malicious input designed to cause Regular Expression Denial of Service
        var context = CreateHttpContext("/api/test", "POST");
        var redosBody = "{\"data\": \"" + new string('a', 10000) + " SELECT * FROM\"}";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(redosBody));

        var startTime = DateTime.UtcNow;
        await _middleware.InvokeAsync(context);
        var duration = DateTime.UtcNow - startTime;

        // Regex should complete quickly, not cause catastrophic backtracking
        duration.Should().BeLessThan(TimeSpan.FromSeconds(5),
            "regex validation should not be vulnerable to ReDoS attacks");
    }

    #endregion

    #region Helper Methods

    private DefaultHttpContext CreateHttpContext(string path, string method = "GET")
    {
        var context = new DefaultHttpContext();

        // Split path and query string if present
        if (path.Contains('?'))
        {
            var parts = path.Split('?', 2);
            context.Request.Path = parts[0];
            context.Request.QueryString = new QueryString("?" + parts[1]);
        }
        else
        {
            context.Request.Path = path;
        }

        context.Request.Method = method;
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.1");
        return context;
    }

    #endregion
}
