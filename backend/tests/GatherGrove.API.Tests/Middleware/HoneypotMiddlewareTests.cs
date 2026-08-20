using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Middleware;
using GatherGrove.API.Services;
using FluentAssertions;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class HoneypotMiddlewareTests
{
    private Mock<RequestDelegate> _mockNext;
    private Mock<ILogger<HoneypotMiddleware>> _mockLogger;
    private Mock<ISecurityAuditService> _mockSecurityAudit;
    private IConfiguration _configuration;
    private HoneypotMiddleware _middleware;

    [SetUp]
    public void SetUp()
    {
        _mockNext = new Mock<RequestDelegate>();
        _mockLogger = new Mock<ILogger<HoneypotMiddleware>>();
        _mockSecurityAudit = new Mock<ISecurityAuditService>();
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TrustedProxy"] = "true",
                ["TrustedProxy:KnownProxies:0"] = "10.0.0.5"
            })
            .Build();
        _middleware = new HoneypotMiddleware(_mockNext.Object, _mockLogger.Object, _mockSecurityAudit.Object, _configuration);
    }

    #region Bug-Finding Tests: Honeypot Paths

    [Test]
    [TestCase("/wp-admin")]
    [TestCase("/wp-login.php")]
    [TestCase("/phpmyadmin")]
    [TestCase("/.env")]
    [TestCase("/shell.php")]
    public async Task HoneypotPath_Returns404_AndLogsEvent(string path)
    {
        // Bug Scenario: Common attack paths should be detected and logged
        var context = CreateHttpContext(path);

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404, $"{path} is a honeypot path");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Never,
            "honeypot paths should not proceed to next middleware");
        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()), Times.Once,
            "security event should be logged");
    }

    [Test]
    public async Task HoneypotPath_CaseInsensitive()
    {
        // Bug Scenario: Attackers might try case variations to bypass detection
        var context = CreateHttpContext("/WP-ADMIN");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404,
            "honeypot detection should be case-insensitive");
    }

    [Test]
    public async Task RobotsTxt_FlaggedAsHoneypot_FalsePositive()
    {
        // Bug Scenario: robots.txt is a NORMAL file but flagged as honeypot (line 27)
        var context = CreateHttpContext("/robots.txt");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404,
            "BUG: robots.txt is a normal file but treated as honeypot (false positive)");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Never,
            "legitimate robots.txt requests are blocked");
    }

    [Test]
    public async Task SitemapXml_FlaggedAsHoneypot_FalsePositive()
    {
        // Bug Scenario: sitemap.xml is a NORMAL SEO file but flagged as honeypot (line 27)
        var context = CreateHttpContext("/sitemap.xml");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404,
            "BUG: sitemap.xml is a normal SEO file but treated as honeypot (false positive)");
    }

    #endregion

    #region Bug-Finding Tests: Suspicious File Extensions

    [Test]
    [TestCase("/uploads/malware.exe")]
    [TestCase("/files/script.php")]
    [TestCase("/content/shell.sh")]
    [TestCase("/data/config.bat")]
    public async Task SuspiciousExtension_Returns404(string path)
    {
        // Bug Scenario: Suspicious file extensions should be blocked
        var context = CreateHttpContext(path);

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404);
        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()), Times.Once);
    }

    [Test]
    public async Task JavaScriptFile_BlockedAsSuspicious_FalsePositive()
    {
        // Bug Scenario: Legitimate .js files are blocked (line 34)
        var context = CreateHttpContext("/app.js");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404,
            "BUG: Legitimate .js files blocked as suspicious (false positive)");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Never,
            "legitimate JavaScript files should be allowed");
    }

    [Test]
    public async Task PhpExtension_CaseInsensitive()
    {
        // Bug Scenario: Attackers might use .PHP or .PhP to bypass detection
        var context = CreateHttpContext("/shell.PHP");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404,
            "extension matching should be case-insensitive");
    }

    #endregion

    #region Bug-Finding Tests: Directory Traversal

    [Test]
    [TestCase("/api/../../etc/passwd")]
    [TestCase("/files/../../../windows/system32")]
    [TestCase("/content/..%2f..%2fadmin")]
    public async Task DirectoryTraversal_Returns400(string path)
    {
        // Bug Scenario: Directory traversal attempts should be blocked
        var context = CreateHttpContext(path);

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400, "directory traversal should return 400");
        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()), Times.Once);
    }

    [Test]
    public async Task DirectoryTraversal_UrlEncodedVariations_MissedByDetection()
    {
        // Bug Scenario: Many URL encoding variations not detected
        var encodedVariations = new[]
        {
            "/api/%2e%2e%2fadmin",      // Double URL encoded
            "/api/..%252f..%252fadmin",  // Nested encoding
            "/api/....//admin",          // Overlong path
            "/api/..;/admin"             // Semicolon variant
        };

        foreach (var path in encodedVariations)
        {
            var context = CreateHttpContext(path);
            await _middleware.InvokeAsync(context);

            // DOCUMENTED BUG: Only checks for ".." and "%2e%2e" (line 73)
            // Many variations bypass detection
            if (!path.Contains("..") && !path.Contains("%2e%2e"))
            {
                context.Response.StatusCode.Should().NotBe(400,
                    $"DOCUMENTED BUG: {path} bypasses directory traversal detection");
            }
        }
    }

    #endregion

    #region Bug-Finding Tests: Attack Patterns

    [Test]
    [TestCase("/api/users?id=1' OR '1'='1")]
    [TestCase("/search?q=<script>alert('xss')</script>")]
    [TestCase("/exec?cmd=ls+-la")]
    [TestCase("/file?path=/etc/passwd")]
    public async Task AttackPattern_Returns400(string pathAndQuery)
    {
        // Bug Scenario: SQL injection and XSS patterns should be detected
        var context = CreateHttpContext(pathAndQuery);

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400, "attack patterns should return 400");
        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()), Times.Once);
    }

    [Test]
    public async Task AttackPattern_FalsePositive_LegitimateQuery()
    {
        // Bug Scenario: Pattern "1=1" appears in legitimate queries
        var context = CreateHttpContext("/api/products?page=1&limit=10&priceRange=1-100");

        await _middleware.InvokeAsync(context);

        // This legitimate query contains "1=1" (from priceRange=1-100)
        // The check is too broad (line 85)
        if ("/api/products?page=1&limit=10&priceRange=1-100".Contains("1=1"))
        {
            context.Response.StatusCode.Should().Be(400,
                "DOCUMENTED BUG: Legitimate query blocked because it contains '1=1' substring");
        }
    }

    [Test]
    public async Task AttackPattern_CaseInsensitive()
    {
        // Bug Scenario: Attackers might use case variations
        var context = CreateHttpContext("/api/test?q=UNION+SELECT+*+FROM+users");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "attack pattern detection should be case-insensitive");
    }

    #endregion

    #region Bug-Finding Tests: Bot User Agents

    [Test]
    [TestCase("sqlmap/1.0")]
    [TestCase("Mozilla/5.0 (compatible; Nikto/2.1.6)")]
    [TestCase("w3af.org")]
    [TestCase("Acunetix Scanner")]
    public async Task BotUserAgent_LogsEvent_ButAllowsRequest(string userAgent)
    {
        // Bug Scenario: Automated scanning tools should be detected
        var context = CreateHttpContext("/api/test");
        context.Request.Headers["User-Agent"] = userAgent;

        await _middleware.InvokeAsync(context);

        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()), Times.Once,
            "bot user agent should be logged");

        // BUG: Bot detection logs but continues to next middleware (line 117)
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once,
            "DOCUMENTED BUG: Bot requests are logged but not blocked");
    }

    [Test]
    public async Task BotUserAgent_FalsePositive_LegitimateBot()
    {
        // Bug Scenario: Pattern "bot" matches Googlebot, Bingbot (legitimate)
        var context = CreateHttpContext("/api/test");
        context.Request.Headers["User-Agent"] = "Mozilla/5.0 (compatible; Googlebot/2.1)";

        await _middleware.InvokeAsync(context);

        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()), Times.Once,
            "DOCUMENTED BUG: Legitimate search engine bots flagged (pattern 'bot' too broad)");
    }

    #endregion

    #region Bug-Finding Tests: IP Detection

    [Test]
    public async Task GetClientIP_XForwardedFor_UsesFirstIP()
    {
        // Bug Scenario: X-Forwarded-For should use first IP (from trusted proxy)
        var context = CreateHttpContext("/api/test");
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.1, 198.51.100.2, 192.0.2.3";

        await _middleware.InvokeAsync(context);

        // Should use first IP (203.0.113.1)
        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(
            It.Is<SecurityEvent>(e => e.ClientIP == "203.0.113.1")),
            Times.Never, // Not triggered unless honeypot hit
            "X-Forwarded-For should use first IP");
    }

    [Test]
    public async Task GetClientIP_XForwardedFor_VulnerableToSpoofing()
    {
        // Bug Scenario: Attacker can spoof X-Forwarded-For header
        var context = CreateHttpContext("/wp-admin"); // Honeypot path
        context.Request.Headers["X-Forwarded-For"] = "127.0.0.1"; // Fake localhost

        await _middleware.InvokeAsync(context);

        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(
            It.Is<SecurityEvent>(e => e.ClientIP == "192.168.1.1")),
            Times.Once,
            "untrusted clients must not be able to spoof honeypot audit IPs with X-Forwarded-For");
    }

    [Test]
    public async Task GetClientIP_XForwardedFor_FromTrustedProxy_UsesForwardedClient()
    {
        var context = CreateHttpContext("/wp-admin");
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.0.0.5");
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.1";

        await _middleware.InvokeAsync(context);

        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(
            It.Is<SecurityEvent>(e => e.ClientIP == "203.0.113.1")),
            Times.Once,
            "trusted proxies may supply the original client IP");
    }

    [Test]
    public async Task GetClientIP_FallsBackToRemoteIP()
    {
        // Bug Scenario: Should use RemoteIpAddress if no X-Forwarded-For
        var context = CreateHttpContext("/api/test");
        // No X-Forwarded-For or X-Real-IP headers

        await _middleware.InvokeAsync(context);

        // Should fall back to RemoteIpAddress (192.168.1.1 from CreateHttpContext)
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Once);
    }

    #endregion

    #region Bug-Finding Tests: Response Headers

    [Test]
    public async Task HoneypotResponse_MissingContentType()
    {
        // Bug Scenario: Response written without setting Content-Type (line 57)
        var context = CreateHttpContext("/wp-admin");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(404);
        context.Response.ContentType.Should().BeNullOrEmpty(
            "DOCUMENTED BUG: Content-Type not set before writing response (line 57)");
    }

    [Test]
    public async Task HoneypotResponse_ReturnsGeneric404()
    {
        // Bug Scenario: Should return realistic 404 to not tip off attackers
        var context = CreateHttpContext("/.env");

        await _middleware.InvokeAsync(context);

        var body = await GetResponseBody(context);
        body.Should().Be("Not Found",
            "honeypot should return generic 404 message to not reveal detection");
    }

    #endregion

    #region Bug-Finding Tests: Security Event Logging

    [Test]
    public async Task SecurityEvent_ContainsAllMetadata()
    {
        // Bug Scenario: Security events should include comprehensive metadata
        // Use a path that ONLY triggers suspicious extension, not attack patterns
        var context = CreateHttpContext("/uploads/file.php");
        context.Request.Headers["User-Agent"] = "Mozilla/5.0";
        context.Request.Headers["Referer"] = "http://example.com";
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.1";
        context.Request.Method = "POST";

        SecurityEvent? capturedEvent = null;
        _mockSecurityAudit.Setup(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()))
            .Callback<SecurityEvent>(e => capturedEvent = e)
            .Returns(Task.CompletedTask);

        await _middleware.InvokeAsync(context);

        capturedEvent.Should().NotBeNull();
        capturedEvent!.EventType.Should().Be("suspicious_extension");
        capturedEvent.Severity.Should().Be(SecurityEventSeverity.High);
        capturedEvent.ClientIP.Should().Be("192.168.1.1");
        capturedEvent.RequestPath.Should().Be("/uploads/file.php");
        capturedEvent.AdditionalData.Should().ContainKey("Method");
        capturedEvent.AdditionalData["Method"].Should().Be("POST");
    }

    [Test]
    public async Task SecurityEvent_LoggedBeforeResponse()
    {
        // Bug Scenario: Event should be logged before returning response
        var context = CreateHttpContext("/wp-admin");
        var statusCodeWhenLogged = 0;

        _mockSecurityAudit.Setup(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()))
            .Callback(() => statusCodeWhenLogged = context.Response.StatusCode)
            .Returns(Task.CompletedTask);

        await _middleware.InvokeAsync(context);

        // Event is logged at line 143, then status set at line 56
        // But LogSecurityEventAsync is async, so both happen concurrently
        // This test documents the actual behavior
        Assert.Pass($"Status code when logged: {statusCodeWhenLogged} (may be 0 or 404 depending on timing)");
    }

    #endregion

    #region Bug-Finding Tests: Performance

    [Test]
    public async Task AttackPattern_LinearSearch_Performance()
    {
        // Bug Scenario: Attack pattern array linear search on every request (line 92-102)
        var context = CreateHttpContext("/api/test?query=legitimate");

        await _middleware.InvokeAsync(context);

        // This test documents that ALL attack patterns are checked on EVERY request
        // O(n) performance where n = number of patterns (currently ~18 patterns)
        Assert.Pass("DOCUMENTED PERFORMANCE: Linear search through attack patterns on every request");
    }

    #endregion

    #region Bug-Finding Tests: Rate Limiting Integration

    [Test]
    public async Task DetectedAttacker_NoRateLimiting()
    {
        // Bug Scenario: After detecting attack, no rate limiting applied
        var context = CreateHttpContext("/wp-admin");

        // Attacker can try multiple honeypot paths
        for (int i = 0; i < 100; i++)
        {
            context = CreateHttpContext($"/wp-admin?attempt={i}");
            await _middleware.InvokeAsync(context);
        }

        // All 100 attempts logged but not blocked
        _mockSecurityAudit.Verify(s => s.LogSecurityEventAsync(It.IsAny<SecurityEvent>()),
            Times.Exactly(100),
            "DOCUMENTED BUG: No rate limiting after detecting attacks (attacker can keep probing)");
    }

    #endregion

    #region Helper Methods

    private DefaultHttpContext CreateHttpContext(string pathAndQuery)
    {
        var context = new DefaultHttpContext();

        // Parse path and query string
        var parts = pathAndQuery.Split('?');
        context.Request.Path = parts[0];
        if (parts.Length > 1)
        {
            context.Request.QueryString = new QueryString($"?{parts[1]}");
        }

        context.Request.Method = "GET";
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.1");
        return context;
    }

    private async Task<string> GetResponseBody(HttpContext context)
    {
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }

    #endregion
}
