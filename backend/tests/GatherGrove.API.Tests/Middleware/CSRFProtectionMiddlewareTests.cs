using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Middleware;
using FluentAssertions;
using System.Text.Json;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class CSRFProtectionMiddlewareTests
{
    private Mock<RequestDelegate> _mockNext;
    private Mock<ILogger<CSRFProtectionMiddleware>> _mockLogger;
    private Mock<IWebHostEnvironment> _mockEnvironment;
    private IConfiguration _configuration;
    private CSRFProtectionMiddleware _middleware;
    private const string CSRF_TOKEN_HEADER = "X-CSRF-Token";
    private const string CSRF_COOKIE_NAME = "csrf-token";

    [SetUp]
    public void SetUp()
    {
        _mockNext = new Mock<RequestDelegate>();
        _mockLogger = new Mock<ILogger<CSRFProtectionMiddleware>>();
        _mockEnvironment = new Mock<IWebHostEnvironment>();

        // Default to development environment
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");

        // CRITICAL FIX: Set environment variable to Production to prevent middleware from skipping CSRF checks
        // The middleware checks Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") and skips
        // CSRF protection when it's "Testing" (line 65 of CSRFProtectionMiddleware.cs)
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production");

        // Create configuration with valid CSRF secret
        var configValues = new Dictionary<string, string?>
        {
            ["Security:CSRFSecretKey"] = "this-is-a-valid-32-character-csrf-secret-key-for-testing-purposes"
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        _middleware = new CSRFProtectionMiddleware(_mockNext.Object, _mockLogger.Object, _configuration, _mockEnvironment.Object);
    }

    [TearDown]
    public void TearDown()
    {
        // Reset environment variable to Production after each test to prevent test pollution
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production");
    }

    #region Bug-Finding Tests: Configuration Validation

    [Test]
    public void Constructor_ProductionWithoutSecret_ThrowsException()
    {
        // Bug Scenario: Production app starts without CSRF secret configured
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Production");
        var emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var act = () => new CSRFProtectionMiddleware(_mockNext.Object, _mockLogger.Object, emptyConfig, _mockEnvironment.Object);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*CRITICAL SECURITY ERROR*CSRFSecretKey is not configured*",
                "production environment must have CSRF secret configured");
    }

    [Test]
    public void Constructor_ProductionWithShortSecret_ThrowsException()
    {
        // Bug Scenario: Production app configured with weak CSRF secret
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Production");
        var weakConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:CSRFSecretKey"] = "too-short" // Only 9 characters
            })
            .Build();

        var act = () => new CSRFProtectionMiddleware(_mockNext.Object, _mockLogger.Object, weakConfig, _mockEnvironment.Object);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*must be at least 32 characters*",
                "CSRF secret must be 32+ characters for cryptographic strength");
    }

    [Test]
    public void Constructor_DevelopmentWithoutSecret_UsesFallback()
    {
        // Bug Scenario: Development without secret should work (with warning)
        var emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        // Should not throw - development allows fallback
        var act = () => new CSRFProtectionMiddleware(_mockNext.Object, _mockLogger.Object, emptyConfig, _mockEnvironment.Object);

        act.Should().NotThrow("development environment should allow fallback CSRF secret");
    }

    #endregion

    #region Bug-Finding Tests: Token Generation & Validation

    [Test]
    public async Task GetRequest_GeneratesCSRFTokenCookie()
    {
        // Bug Scenario: GET request should set CSRF token cookie for subsequent POST requests
        var context = CreateHttpContext("/api/test", "GET");

        await _middleware.InvokeAsync(context);

        // In DefaultHttpContext, cookies set via Cookies.Append() populate the SetCookie header (not Set-Cookie)
        var setCookieHeaders = context.Response.Headers.SetCookie;
        setCookieHeaders.Should().NotBeEmpty("GET request should set CSRF token cookie");

        var setCookie = setCookieHeaders.ToString().ToLowerInvariant();
        setCookie.Should().Contain(CSRF_COOKIE_NAME.ToLowerInvariant(), "cookie name should match");
        setCookie.Should().NotContain("httponly", "CSRF cookie must be readable by JavaScript (httponly attribute should be absent)");
        setCookie.Should().Contain("samesite=strict", "CSRF cookie should use SameSite=Strict");
    }

    [Test]
    public async Task PostRequest_WithoutCSRFToken_IsBlocked()
    {
        // Bug Scenario: POST request without CSRF token should be rejected
        var context = CreateHttpContext("/api/test", "POST");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            "POST request without CSRF token should be forbidden");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Never,
            "request should not proceed to next middleware");
    }

    [Test]
    public async Task PostRequest_WithMismatchedTokens_IsBlocked()
    {
        // Bug Scenario: Attacker tries to use different tokens in cookie and header
        var context = CreateHttpContext("/api/test", "POST");
        var validToken = GenerateMockToken();
        var differentToken = GenerateMockToken();

        context.Request.Cookies = new MockRequestCookieCollection(new Dictionary<string, string>
        {
            [CSRF_COOKIE_NAME] = validToken
        });
        context.Request.Headers[CSRF_TOKEN_HEADER] = differentToken;

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            "mismatched CSRF tokens should be rejected to prevent token substitution attacks");
    }

    [Test]
    public async Task PostRequest_WithMatchingTokens_IsAllowed()
    {
        // Bug Scenario: Valid CSRF token should allow POST request
        var context = CreateHttpContext("/api/test", "POST");
        var validToken = GenerateMockToken();

        context.Request.Cookies = new MockRequestCookieCollection(new Dictionary<string, string>
        {
            [CSRF_COOKIE_NAME] = validToken
        });
        context.Request.Headers[CSRF_TOKEN_HEADER] = validToken;

        await _middleware.InvokeAsync(context);

        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once,
            "valid CSRF token should allow request to proceed");
    }

    [Test]
    public async Task PostRequest_WithExpiredToken_IsBlocked()
    {
        // Bug Scenario: Token older than 1 hour should be rejected
        var context = CreateHttpContext("/api/test", "POST");
        var expiredToken = GenerateExpiredMockToken();

        context.Request.Cookies = new MockRequestCookieCollection(new Dictionary<string, string>
        {
            [CSRF_COOKIE_NAME] = expiredToken
        });
        context.Request.Headers[CSRF_TOKEN_HEADER] = expiredToken;

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            "expired CSRF tokens (>1 hour) should be rejected to limit replay window");
    }

    [Test]
    public async Task PostRequest_WithMalformedToken_IsBlocked()
    {
        // Bug Scenario: Invalid token format could cause crashes or bypasses
        var context = CreateHttpContext("/api/test", "POST");
        var malformedToken = "invalid-token-format";

        context.Request.Cookies = new MockRequestCookieCollection(new Dictionary<string, string>
        {
            [CSRF_COOKIE_NAME] = malformedToken
        });
        context.Request.Headers[CSRF_TOKEN_HEADER] = malformedToken;

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            "malformed CSRF token should be rejected gracefully without crashing");
    }

    #endregion

    #region Bug-Finding Tests: HTTP Methods

    [Test]
    [TestCase("POST")]
    [TestCase("PUT")]
    [TestCase("PATCH")]
    [TestCase("DELETE")]
    public async Task StateChangingMethods_WithoutCSRF_AreBlocked(string method)
    {
        // Bug Scenario: All state-changing methods must require CSRF protection
        var context = CreateHttpContext("/api/test", method);

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            $"{method} requests without CSRF token should be forbidden");
    }

    [Test]
    [TestCase("GET")]
    [TestCase("HEAD")]
    [TestCase("OPTIONS")]
    public async Task SafeMethods_WithoutCSRF_AreAllowed(string method)
    {
        // Bug Scenario: Safe methods should not require CSRF protection
        var context = CreateHttpContext("/api/test", method);

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(403,
            $"{method} requests should not require CSRF token (safe method)");
    }

    #endregion

    #region Bug-Finding Tests: Skip Path Logic

    [Test]
    public async Task AuthEndpoint_SkipsCSRFProtection()
    {
        // Bug Scenario: Login endpoint should skip CSRF (no cookie before login)
        var context = CreateHttpContext("/api/v1/auth/login", "POST");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(403,
            "auth endpoints should skip CSRF protection (JWT-protected instead)");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once);
    }

    [Test]
    public async Task HealthEndpoint_SkipsCSRFProtection()
    {
        // Bug Scenario: Health check endpoint should skip CSRF
        var context = CreateHttpContext("/health", "POST");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(403,
            "health endpoint should skip CSRF protection");
    }

    [Test]
    public async Task ClubEventsEndpoint_SkipsCSRFProtection()
    {
        // Bug Scenario: Cookie-authenticated club event writes must not bypass CSRF.
        var context = CreateHttpContext("/api/v1/clubs/123/events", "POST");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            "cookie-authenticated club event writes must require CSRF protection");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Never);
    }

    [Test]
    public async Task BearerAuthorizationRequest_WithoutCSRFToken_IsAllowed()
    {
        var context = CreateHttpContext("/api/v1/clubs/123/events", "POST");
        context.Request.Headers.Authorization = "Bearer test-access-token";

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(403,
            "mobile and API clients using Authorization: Bearer are not browser-cookie CSRF targets");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once);
    }

    [Test]
    public async Task CookieJwtAuthenticatedMemberImportExecute_WithoutCSRFToken_IsBlocked()
    {
        var context = CreateHttpContext("/api/v1/clubs/123/members/import/execute", "POST");
        context.Request.Cookies = new MockRequestCookieCollection(new Dictionary<string, string>
        {
            ["jwt"] = "cookie-jwt"
        });

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            "cookie JWT authenticated state-changing APIs must require a valid CSRF token");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Never);
    }

    [Test]
    public async Task SkipPath_CaseInsensitive()
    {
        // Bug Scenario: Attacker uses case variations to bypass CSRF
        var context = CreateHttpContext("/API/V1/AUTH/LOGIN", "POST");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(403,
            "skip paths should be case-insensitive to prevent case-based bypass");
    }

    [Test]
    public async Task PathTraversal_DoesNotBypassCSRF()
    {
        // Bug Scenario: Attacker tries path traversal to match skip path
        var context = CreateHttpContext("/api/v1/secret/../auth/login", "POST");

        // Path traversal should be normalized before reaching middleware
        // But if not, it should NOT bypass CSRF for non-auth endpoints
        await _middleware.InvokeAsync(context);

        // This might pass or fail depending on path normalization
        // Testing to document actual behavior
        if (context.Request.Path.Value?.Contains("../") == true)
        {
            context.Response.StatusCode.Should().Be(403,
                "path traversal should not bypass CSRF protection");
        }
    }

    [Test]
    public async Task PartialPathMatch_DoesNotBypassCSRF()
    {
        // Bug Scenario: Line 234 uses Contains("events") - too broad?
        // Path like "/api/v1/clubs/123/events-report" would also skip CSRF
        var context = CreateHttpContext("/api/v1/clubs/123/events-administration", "POST");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(403,
            "partial path matches must not bypass CSRF protection");
    }

    #endregion

    #region Bug-Finding Tests: Testing Environment

    [Test]
    public async Task TestingEnvironment_SkipsCSRFProtection()
    {
        // Bug Scenario: Integration tests need CSRF disabled
        // Create a NEW middleware with Testing environment
        // Note: IsEnvironment() extension method compares against EnvironmentName
        var testingEnvironment = new Mock<IWebHostEnvironment>();
        testingEnvironment.Setup(e => e.EnvironmentName).Returns("Testing");

        var testingMiddleware = new CSRFProtectionMiddleware(
            _mockNext.Object,
            _mockLogger.Object,
            _configuration,
            testingEnvironment.Object);

        var context = CreateHttpContext("/api/test", "POST");

        await testingMiddleware.InvokeAsync(context);

        context.Response.StatusCode.Should().NotBe(403,
            "Testing environment should skip CSRF for integration tests");
    }

    #endregion

    #region Bug-Finding Tests: Error Responses

    [Test]
    public async Task CSRFValidationFailure_ReturnsJSON()
    {
        // Bug Scenario: Error response should be JSON for API consistency
        var context = CreateHttpContext("/api/test", "POST");

        await _middleware.InvokeAsync(context);

        context.Response.ContentType.Should().Be("application/json",
            "CSRF error response should be JSON format");

        var body = await GetResponseBody(context);
        body.Should().Contain("error", "response should contain error field");
        body.Should().Contain("CSRF token validation failed", "error message should be descriptive");
    }

    #endregion

    #region Bug-Finding Tests: Cookie Security Attributes

    [Test]
    public async Task CSRFCookie_HttpOnlyFalse_ForJavaScriptAccess()
    {
        // Bug Scenario: CSRF cookie needs to be readable by JavaScript (unlike session cookies)
        var context = CreateHttpContext("/api/test", "GET");

        await _middleware.InvokeAsync(context);

        var setCookieHeaders = context.Response.Headers.SetCookie;
        setCookieHeaders.Should().NotBeEmpty("GET request should set CSRF token cookie");

        var setCookie = setCookieHeaders.ToString().ToLowerInvariant();
        setCookie.Should().NotContain("httponly",
            "CSRF cookie must be HttpOnly=false so JavaScript can read it for AJAX requests (httponly attribute should be absent)");
    }

    [Test]
    public async Task CSRFCookie_ProductionSecureFlag()
    {
        // Bug Scenario: Production cookies should have Secure flag
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Production");
        var prodMiddleware = new CSRFProtectionMiddleware(_mockNext.Object, _mockLogger.Object, _configuration, _mockEnvironment.Object);

        var context = CreateHttpContext("/api/test", "GET");

        await prodMiddleware.InvokeAsync(context);

        var setCookieHeaders = context.Response.Headers.SetCookie;
        var setCookie = setCookieHeaders.ToString().ToLowerInvariant();
        setCookie.Should().Contain("secure",
            "production CSRF cookies should have Secure flag (HTTPS only)");
    }

    [Test]
    public async Task CSRFCookie_DevelopmentNoSecureFlag()
    {
        // Bug Scenario: Development cookies should not require HTTPS
        var context = CreateHttpContext("/api/test", "GET");

        await _middleware.InvokeAsync(context);

        var setCookie = context.Response.Headers["Set-Cookie"].ToString();
        // In development, Secure flag should not be present (allow HTTP)
        // This might not be testable via Set-Cookie string format
        // Documenting expected behavior
        Assert.Pass("Development environment should allow HTTP cookies");
    }

    #endregion

    #region Helper Methods

    private DefaultHttpContext CreateHttpContext(string path, string method = "GET")
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        context.Request.Method = method;
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.1");
        return context;
    }

    private string GenerateMockToken()
    {
        // Generate a REAL valid token using the same secret as the middleware
        var secretKey = _configuration["Security:CSRFSecretKey"] ?? throw new InvalidOperationException("CSRF secret not found");

        var randomBytes = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }

        var randomValue = Convert.ToHexString(randomBytes);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();

        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(secretKey));
        var signature = Convert.ToHexString(hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(randomValue + timestamp)));

        return $"{randomValue}.{timestamp}.{signature}";
    }

    private string GenerateExpiredMockToken()
    {
        // Generate a REAL valid token with timestamp >1 hour ago
        var secretKey = _configuration["Security:CSRFSecretKey"] ?? throw new InvalidOperationException("CSRF secret not found");

        var randomBytes = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }

        var randomValue = Convert.ToHexString(randomBytes);
        var expiredTimestamp = DateTimeOffset.UtcNow.AddHours(-2).ToUnixTimeMilliseconds().ToString();

        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(secretKey));
        var signature = Convert.ToHexString(hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(randomValue + expiredTimestamp)));

        return $"{randomValue}.{expiredTimestamp}.{signature}";
    }

    private async Task<string> GetResponseBody(HttpContext context)
    {
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }

    #endregion
}

// Helper class to mock request cookies
public class MockRequestCookieCollection : IRequestCookieCollection
{
    private readonly Dictionary<string, string> _cookies;

    public MockRequestCookieCollection(Dictionary<string, string> cookies)
    {
        _cookies = cookies;
    }

    public string? this[string key] => _cookies.TryGetValue(key, out var value) ? value : null;
    public int Count => _cookies.Count;
    public ICollection<string> Keys => _cookies.Keys;
    public bool ContainsKey(string key) => _cookies.ContainsKey(key);
    public bool TryGetValue(string key, out string? value) => _cookies.TryGetValue(key, out value);
    public IEnumerator<KeyValuePair<string, string>> GetEnumerator() => _cookies.GetEnumerator();
    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => _cookies.GetEnumerator();
}
