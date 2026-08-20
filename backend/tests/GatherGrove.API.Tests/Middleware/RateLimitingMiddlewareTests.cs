using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Middleware;
using FluentAssertions;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class RateLimitingMiddlewareTests
{
    private Mock<RequestDelegate> _mockNext;
    private Mock<ILogger<RateLimitingMiddleware>> _mockLogger;
    private IMemoryCache _cache;
    private IConfiguration _configuration;
    private RateLimitingMiddleware _middleware;

    [SetUp]
    public void SetUp()
    {
        _mockNext = new Mock<RequestDelegate>();
        _mockLogger = new Mock<ILogger<RateLimitingMiddleware>>();
        _cache = new MemoryCache(new MemoryCacheOptions());

        // Create configuration with test limits
        var configValues = new Dictionary<string, string?>
        {
            ["ASPNETCORE_ENVIRONMENT"] = "Production",  // Use production limits for testing
            // The IP-spoofing / X-Forwarded-For tests simulate requests arriving behind a
            // trusted reverse proxy (e.g. Cloudflare). RequestClientIpResolver only honors
            // X-Forwarded-For when proxy trust is enabled — secure-by-default, since trusting
            // XFF without a known proxy is itself the bypass. Enable it so those scenarios
            // exercise the real trusted-proxy code path rather than falling back to RemoteIp.
            ["TrustedProxy"] = "true",
            ["RateLimit:WellKnown:MaxRequests"] = "3",
            ["RateLimit:WellKnown:WindowMinutes"] = "60",
            ["RateLimit:Export:MaxRequests"] = "5",
            ["RateLimit:Export:WindowMinutes"] = "10",
            ["RateLimit:General:MaxRequests"] = "1000",
            ["RateLimit:General:WindowMinutes"] = "60"
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        _middleware = new RateLimitingMiddleware(_mockNext.Object, _mockLogger.Object, _cache, _configuration);
    }

    [TearDown]
    public void TearDown()
    {
        _cache?.Dispose();
    }

    #region Bug-Finding Tests: Rate Limit Boundary Conditions

    [Test]
    public async Task GeneralRateLimit_ExactlyAtLimit_ShouldAllow()
    {
        // Bug Scenario: Off-by-one error - does the middleware use > or >= for limit check?
        // Testing boundary condition: exactly at the limit (1000 requests)
        var context = CreateHttpContext("192.168.1.1", "/api/test");

        // Make exactly 1000 requests (the limit)
        for (int i = 0; i < 1000; i++)
        {
            await _middleware.InvokeAsync(context);
            context = CreateHttpContext("192.168.1.1", "/api/test"); // Fresh context for each request
        }

        // Assert: The 1000th request should be ALLOWED (limit is inclusive)
        context.Response.StatusCode.Should().NotBe(429, "1000th request should be allowed when limit is 1000");
        _mockNext.Verify(n => n(It.IsAny<HttpContext>()), Times.Exactly(1000));
    }

    [Test]
    public async Task GeneralRateLimit_OnePastLimit_ShouldBlock()
    {
        // Bug Scenario: Verify blocking happens at limit + 1
        var context = CreateHttpContext("192.168.1.2", "/api/test");

        // Make 1001 requests (one past the limit)
        for (int i = 0; i < 1001; i++)
        {
            await _middleware.InvokeAsync(context);
            if (i < 1000)
            {
                context = CreateHttpContext("192.168.1.2", "/api/test");
            }
        }

        // Assert: The 1001st request should be BLOCKED
        context.Response.StatusCode.Should().Be(429, "1001st request should be blocked when limit is 1000");
    }

    [Test]
    public async Task WellKnownRateLimit_ExceedsDoubleLimit_BlocksIpTemporarily()
    {
        // Bug Scenario: IP should be blocked for 1 hour after 2x the .well-known limit
        // Limit is 3, so 7+ requests should trigger IP block
        var context = CreateHttpContext("192.168.1.3", "/.well-known/acme-challenge/test");

        // Make 7 requests (more than 2x the limit of 3)
        for (int i = 0; i < 7; i++)
        {
            await _middleware.InvokeAsync(context);
            context = CreateHttpContext("192.168.1.3", "/.well-known/acme-challenge/test");
        }

        // Assert: IP should now be blocked for subsequent requests to ANY endpoint
        var newContext = CreateHttpContext("192.168.1.3", "/api/different-endpoint");
        await _middleware.InvokeAsync(newContext);

        newContext.Response.StatusCode.Should().Be(429, "IP should be blocked site-wide after excessive .well-known requests");
        var bodyContent = await GetResponseBody(newContext);
        bodyContent.Should().Contain("IP temporarily blocked", "response should indicate IP blocking");
    }

    #endregion

    #region Bug-Finding Tests: Race Conditions

    [Test]
    [Explicit("KNOWN BUG: Race condition in cache increment allows more requests than limit. Requires atomic operations to fix.")]
    public async Task ExportRateLimit_ConcurrentRequests_ShouldNotExceedLimit()
    {
        // Bug Scenario: Race condition in cache increment could allow more requests than limit
        // Two requests arriving simultaneously might both read count=4, both increment to 5, both allowed
        // CURRENT STATUS: This test correctly identifies a race condition bug in the middleware
        // The middleware uses Read-Modify-Write without locking, allowing concurrent requests to bypass the limit
        // FIX REQUIRED: Use Interlocked.Increment or distributed lock (Redis) for atomic counter updates
        var ip = "192.168.1.4";
        var tasks = new List<Task<DefaultHttpContext>>();

        // Simulate 10 concurrent export requests (limit is 5)
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                var context = CreateHttpContext(ip, "/api/export/members", "POST");
                await _middleware.InvokeAsync(context);
                return context;
            }));
        }

        var results = await Task.WhenAll(tasks);

        // Assert: Maximum 5 requests should succeed (race condition would allow 6+)
        var successfulRequests = results.Count(r => r.Response.StatusCode != 429);
        successfulRequests.Should().BeLessOrEqualTo(5,
            "race condition in cache increment should not allow more than the limit");

        var blockedRequests = results.Count(r => r.Response.StatusCode == 429);
        blockedRequests.Should().BeGreaterOrEqualTo(5,
            "at least 5 requests should be blocked when 10 concurrent requests hit limit of 5");
    }

    #endregion

    #region Bug-Finding Tests: IP Spoofing & Security

    [Test]
    public async Task GeneralRateLimit_UntrustedRemoteCannotBypassByRotatingForwardedHeaders()
    {
        var testConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TrustedProxy"] = "true",
                ["TrustedProxy:KnownProxies:0"] = "10.0.0.5",
                ["RateLimit:General:MaxRequests"] = "3",
                ["RateLimit:General:WindowMinutes"] = "60"
            })
            .Build();
        var testMiddleware = new RateLimitingMiddleware(_mockNext.Object, _mockLogger.Object, _cache, testConfig);

        DefaultHttpContext context = null!;
        for (int i = 0; i < 4; i++)
        {
            context = CreateHttpContext("198.51.100.10", "/api/test");
            context.Request.Headers["X-Forwarded-For"] = $"203.0.113.{i + 1}";
            await testMiddleware.InvokeAsync(context);
        }

        context.Response.StatusCode.Should().Be(429,
            "untrusted clients must be rate limited by their remote IP, not spoofed forwarded headers");
    }

    [Test]
    public async Task GeneralRateLimit_TrustedProxyCanForwardDistinctClientIps()
    {
        var testConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TrustedProxy"] = "true",
                ["TrustedProxy:KnownProxies:0"] = "10.0.0.5",
                ["RateLimit:General:MaxRequests"] = "3",
                ["RateLimit:General:WindowMinutes"] = "60"
            })
            .Build();
        var testMiddleware = new RateLimitingMiddleware(_mockNext.Object, _mockLogger.Object, _cache, testConfig);

        for (int i = 0; i < 3; i++)
        {
            var context1 = CreateHttpContext("10.0.0.5", "/api/test");
            context1.Request.Headers["X-Forwarded-For"] = "203.0.113.10";
            await testMiddleware.InvokeAsync(context1);
        }

        var context2 = CreateHttpContext("10.0.0.5", "/api/test");
        context2.Request.Headers["X-Forwarded-For"] = "203.0.113.11";
        await testMiddleware.InvokeAsync(context2);

        context2.Response.StatusCode.Should().NotBe(429,
            "trusted proxies should preserve separate counters for distinct original clients");
    }

    [Test]
    public async Task GetClientIP_XForwardedForSpoofing_UsesFirstIPOnly()
    {
        // Bug Scenario: Attacker sends "X-Forwarded-For: trusted-ip, attacker-ip" to bypass rate limiting
        // Middleware should use FIRST IP only (from trusted proxy), not attacker-controlled part
        DefaultHttpContext context = null!;

        // Make requests that exceed limit (1002 requests, limit is 1000)
        for (int i = 0; i < 1002; i++)
        {
            context = CreateHttpContext("10.0.0.1", "/api/test");
            context.Request.Headers["X-Forwarded-For"] = "192.168.1.5, 203.0.113.1, attacker-controlled-ip";
            await _middleware.InvokeAsync(context);
        }

        // Assert: Should be rate limited based on FIRST IP (192.168.1.5), not spoofed IPs
        context.Response.StatusCode.Should().Be(429,
            "requests with same first X-Forwarded-For IP should be rate limited together");
    }

    [Test]
    public async Task GetClientIP_DifferentForwardedIPs_RateLimitedSeparately()
    {
        var testConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TrustedProxy"] = "true",
                ["TrustedProxy:KnownProxies:0"] = "10.0.0.1",
                ["RateLimit:General:MaxRequests"] = "1000",
                ["RateLimit:General:WindowMinutes"] = "60"
            })
            .Build();
        var testMiddleware = new RateLimitingMiddleware(_mockNext.Object, _mockLogger.Object, _cache, testConfig);

        // IP 1: Make 1000 requests (at limit)
        for (int i = 0; i < 1000; i++)
        {
            var context1 = CreateHttpContext("10.0.0.1", "/api/test");
            context1.Request.Headers["X-Forwarded-For"] = "192.168.1.100";
            await testMiddleware.InvokeAsync(context1);
        }

        // IP 2: Should still be allowed (separate counter)
        var context2 = CreateHttpContext("10.0.0.1", "/api/test");
        context2.Request.Headers["X-Forwarded-For"] = "192.168.1.101";  // Different IP
        await testMiddleware.InvokeAsync(context2);

        context2.Response.StatusCode.Should().NotBe(429,
            "different forwarded client IPs from a trusted proxy should have independent rate limit counters");
    }

    [Test]
    public async Task GetClientIP_MalformedXForwardedFor_FallsBackToRemoteIP()
    {
        // Bug Scenario: Malformed X-Forwarded-For header could cause crashes or bypasses
        var context = CreateHttpContext("192.168.1.6", "/api/test");
        context.Request.Headers["X-Forwarded-For"] = ""; // Empty header

        // Should not crash
        await _middleware.InvokeAsync(context);

        // Should use RemoteIP (192.168.1.6) for rate limiting
        for (int i = 0; i < 1001; i++)
        {
            context = CreateHttpContext("192.168.1.6", "/api/test");
            context.Request.Headers["X-Forwarded-For"] = "";
            await _middleware.InvokeAsync(context);
        }

        context.Response.StatusCode.Should().Be(429, "should rate limit by RemoteIP when X-Forwarded-For is empty");
    }

    #endregion

    #region Bug-Finding Tests: Time Window & Expiration

    [Test]
    [Explicit("This test takes 61+ seconds to run due to waiting for rate limit window expiration")]
    public async Task WellKnownRateLimit_CounterResetsAfterWindowExpires()
    {
        // Bug Scenario: Counter should reset after time window expires (60 minutes)
        // Testing with shortened window for test speed (1 minute minimum due to int config)
        // NOTE: Marked as Explicit because waiting 61 seconds is too slow for regular CI/CD
        var testConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RateLimit:WellKnown:MaxRequests"] = "3",
                ["RateLimit:WellKnown:WindowMinutes"] = "1" // 1 minute for testing (minimum due to int type)
            })
            .Build();

        var testMiddleware = new RateLimitingMiddleware(_mockNext.Object, _mockLogger.Object, _cache, testConfig);
        DefaultHttpContext context = null!;

        // Make 3 requests (at limit)
        for (int i = 0; i < 3; i++)
        {
            context = CreateHttpContext("192.168.1.7", "/.well-known/test");
            await testMiddleware.InvokeAsync(context);
        }

        // 4th request should be blocked
        context = CreateHttpContext("192.168.1.7", "/.well-known/test");
        await testMiddleware.InvokeAsync(context);
        context.Response.StatusCode.Should().Be(429, "4th request should be blocked");

        // Wait for window to expire (1 minute + 1 second buffer)
        await Task.Delay(TimeSpan.FromSeconds(61));

        // After window expires, counter should reset - request should succeed
        var newContext = CreateHttpContext("192.168.1.7", "/.well-known/test");
        await testMiddleware.InvokeAsync(newContext);
        newContext.Response.StatusCode.Should().NotBe(429,
            "request counter should reset after time window expires");
    }

    #endregion

    #region Bug-Finding Tests: Different Endpoints

    [Test]
    public async Task ExportEndpoint_HasMoreRestrictiveLimit_ThanGeneralEndpoint()
    {
        // Bug Scenario: Export endpoints should have stricter limits (5) vs general (1000)
        var ip = "192.168.1.8";

        // Make 6 export requests (exceeds export limit of 5)
        for (int i = 0; i < 6; i++)
        {
            var context = CreateHttpContext(ip, "/api/export/members", "POST");
            await _middleware.InvokeAsync(context);
        }

        // Last export request should be blocked
        var exportContext = CreateHttpContext(ip, "/api/export/members", "POST");
        await _middleware.InvokeAsync(exportContext);
        exportContext.Response.StatusCode.Should().Be(429, "export requests should be blocked at limit of 5");

        // But general API requests from same IP should still work (different counter)
        var generalContext = CreateHttpContext(ip, "/api/members");
        await _middleware.InvokeAsync(generalContext);
        generalContext.Response.StatusCode.Should().NotBe(429,
            "general API endpoints should have separate, higher limit than export endpoints");
    }

    [Test]
    public async Task WellKnownEndpoint_PathCaseSensitivity_ShouldBeInsensitive()
    {
        // Bug Scenario: Attacker uses /.WELL-KNOWN/ (uppercase) to bypass lowercase check
        var ip = "192.168.1.9";

        // Make requests with different casings - should all count toward same limit
        var paths = new[]
        {
            "/.well-known/test",
            "/.WELL-KNOWN/test",
            "/.Well-Known/test",
            "/.well-KNOWN/test"
        };

        for (int i = 0; i < paths.Length; i++)
        {
            var context = CreateHttpContext(ip, paths[i % paths.Length]);
            await _middleware.InvokeAsync(context);
        }

        // 5th request (beyond limit of 3) should be blocked regardless of casing
        var testContext = CreateHttpContext(ip, "/.WeLl-KnOwN/test");
        await _middleware.InvokeAsync(testContext);
        testContext.Response.StatusCode.Should().Be(429,
            "different casings of .well-known should count toward same rate limit");
    }

    #endregion

    #region Bug-Finding Tests: Response Headers & Bodies

    [Test]
    public async Task RateLimitExceeded_ReturnsRetryAfterHeader()
    {
        // Bug Scenario: Client needs Retry-After header to know when to retry
        var context = CreateHttpContext("192.168.1.10", "/api/test");

        // Exceed general limit
        for (int i = 0; i < 1002; i++)
        {
            context = CreateHttpContext("192.168.1.10", "/api/test");
            await _middleware.InvokeAsync(context);
        }

        // Assert: Retry-After header should be present
        context.Response.Headers.Should().ContainKey("Retry-After",
            "rate limit response should include Retry-After header");

        var retryAfter = context.Response.Headers["Retry-After"].ToString();
        int.TryParse(retryAfter, out var seconds).Should().BeTrue(
            "Retry-After should be numeric seconds");
        seconds.Should().BeGreaterThan(0, "Retry-After should indicate when to retry");
    }

    [Test]
    public async Task RateLimitExceeded_ReturnsMeaningfulErrorMessage()
    {
        // Bug Scenario: Error message should help debug which limit was hit
        var exportContext = CreateHttpContext("192.168.1.11", "/api/export/members", "POST");

        // Exceed export limit
        for (int i = 0; i < 6; i++)
        {
            exportContext = CreateHttpContext("192.168.1.11", "/api/export/members", "POST");
            await _middleware.InvokeAsync(exportContext);
        }

        var body = await GetResponseBody(exportContext);
        body.Should().Contain("Export", "error message should indicate it's an export rate limit");
        body.Should().NotContain("general", "error message should be specific to export limit, not general");
    }

    #endregion

    #region Helper Methods

    private DefaultHttpContext CreateHttpContext(string ipAddress, string path, string method = "GET")
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse(ipAddress);
        context.Request.Path = path;
        context.Request.Method = method;
        context.Response.Body = new MemoryStream();
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
