using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Middleware;
using GatherGrove.Application.Services;
using FluentAssertions;
using System.Text.Json;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class GlobalExceptionMiddlewareTests
{
    private Mock<ILogger<GlobalExceptionMiddleware>> _mockLogger;
    private Mock<IWebHostEnvironment> _mockEnvironment;
    private Mock<IErrorLoggingService> _mockErrorLoggingService;
    private GlobalExceptionMiddleware _middleware;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<GlobalExceptionMiddleware>>();
        _mockEnvironment = new Mock<IWebHostEnvironment>();
        _mockErrorLoggingService = new Mock<IErrorLoggingService>();

        // Default to development environment
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
    }

    #region Bug-Finding Tests: Exception Handling & Status Codes

    [Test]
    public async Task ArgumentException_Returns400BadRequest()
    {
        // Bug Scenario: Validation errors should return 400, not 500
        var thrownException = new ArgumentException("Invalid argument");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "ArgumentException should map to 400 Bad Request for validation errors");
    }

    [Test]
    public async Task UnauthorizedAccessException_Returns401Unauthorized()
    {
        // Bug Scenario: Auth failures should return 401, not 500
        var thrownException = new UnauthorizedAccessException("Not authorized");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(401,
            "UnauthorizedAccessException should map to 401 Unauthorized");
    }

    [Test]
    public async Task InvalidOperationException_Returns400BadRequest()
    {
        // Bug Scenario: Business logic violations should return 400
        var thrownException = new InvalidOperationException("Invalid operation");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "InvalidOperationException should map to 400 Bad Request");
    }

    [Test]
    public async Task NotImplementedException_Returns501NotImplemented()
    {
        // Bug Scenario: Unimplemented features should return 501
        var thrownException = new NotImplementedException("Feature not implemented");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(501,
            "NotImplementedException should map to 501 Not Implemented");
    }

    [Test]
    public async Task UnknownException_Returns500InternalServerError()
    {
        // Bug Scenario: Unexpected exceptions should return 500
        var thrownException = new DivideByZeroException("Math error");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(500,
            "unknown exception types should default to 500 Internal Server Error");
    }

    [Test]
    public async Task DerivedArgumentException_Returns400()
    {
        // Bug Scenario: Derived exception types should inherit status code mapping
        var thrownException = new ArgumentNullException("param", "Value cannot be null");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(400,
            "ArgumentNullException (derived from ArgumentException) should map to 400");
    }

    #endregion

    #region Bug-Finding Tests: Development vs Production Responses

    [Test]
    public async Task DevelopmentEnvironment_ExposesStackTrace()
    {
        // Bug Scenario: Development should show detailed errors for debugging
        var thrownException = new InvalidOperationException("Test error");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        var body = await GetResponseBody(context);
        var response = JsonSerializer.Deserialize<ErrorResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        response.Should().NotBeNull();
        response!.Message.Should().Be("Test error", "dev environment should expose exception message");
        response.Details.Should().NotBeNullOrEmpty("dev environment should include stack trace");
        response.Details.Should().Contain("InvalidOperationException", "stack trace should mention exception type");
    }

    [Test]
    public async Task ProductionEnvironment_HidesStackTrace()
    {
        // Bug Scenario: Production should NOT expose internal errors to prevent info leakage
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Production");
        var thrownException = new InvalidOperationException("Internal database connection failed");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        var body = await GetResponseBody(context);
        var response = JsonSerializer.Deserialize<ErrorResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        response.Should().NotBeNull();
        response!.Message.Should().Be("An error occurred while processing your request.",
            "production should use generic error message");
        response.Details.Should().BeNull("production should NOT expose stack trace (security)");
        response.Message.Should().NotContain("database", "production should not leak internal details");
    }

    [Test]
    public async Task AllEnvironments_IncludeTraceId()
    {
        // Bug Scenario: TraceId needed for correlation even in production
        var thrownException = new Exception("Test");
        var middleware = CreateMiddleware(_ => throw thrownException);
        var context = CreateHttpContext("/api/test");
        context.TraceIdentifier = "trace-12345";

        await middleware.InvokeAsync(context);

        var body = await GetResponseBody(context);
        var response = JsonSerializer.Deserialize<ErrorResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        response.Should().NotBeNull();
        response!.TraceId.Should().Be("trace-12345",
            "TraceId required for log correlation across all environments");
    }

    #endregion

    #region Bug-Finding Tests: Query String Sanitization

    [Test]
    public async Task QueryString_WithPassword_IsSanitized()
    {
        // Bug Scenario: Password in query string should be masked in logs
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/login?username=john&password=secret123");
        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        // Verify error logging service was called with sanitized query
        _mockErrorLoggingService.Verify(s => s.LogErrorAsync(
            It.IsAny<Exception>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int?>(),
            It.Is<Dictionary<string, object>>(d =>
                d.ContainsKey("QueryString") &&
                d["QueryString"].ToString()!.Contains("password=***"))),
            Times.Once,
            "password parameter should be sanitized to ***");
    }

    [Test]
    public async Task QueryString_WithToken_IsSanitized()
    {
        // Bug Scenario: API tokens in query should be masked
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/data?token=abc123&id=5");
        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        _mockErrorLoggingService.Verify(s => s.LogErrorAsync(
            It.IsAny<Exception>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int?>(),
            It.Is<Dictionary<string, object>>(d =>
                d.ContainsKey("QueryString") &&
                d["QueryString"].ToString()!.Contains("token=***"))),
            Times.Once,
            "token parameter should be sanitized");
    }

    [Test]
    public async Task QueryString_CaseSensitiveSanitization_HandlesVariations()
    {
        // Bug Scenario: Attacker uses "Password" (capital P) to bypass sanitization
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/login?Password=secret&TOKEN=xyz");
        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        _mockErrorLoggingService.Verify(s => s.LogErrorAsync(
            It.IsAny<Exception>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int?>(),
            It.Is<Dictionary<string, object>>(d =>
                d.ContainsKey("QueryString") &&
                d["QueryString"].ToString()!.Contains("Password=***") &&
                d["QueryString"].ToString()!.Contains("TOKEN=***"))),
            Times.Once,
            "case variations (Password, TOKEN) should be sanitized (case-insensitive check)");
    }

    [Test]
    public async Task QueryString_WithApiKey_IsSanitized()
    {
        // Bug Scenario: API keys should be masked
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/external?apikey=sk_test_12345");
        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        _mockErrorLoggingService.Verify(s => s.LogErrorAsync(
            It.IsAny<Exception>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int?>(),
            It.Is<Dictionary<string, object>>(d =>
                d.ContainsKey("QueryString") &&
                d["QueryString"].ToString()!.Contains("apikey=***"))),
            Times.Once,
            "apikey parameter should be sanitized");
    }

    [Test]
    public async Task QueryString_PartialMatch_NotSanitized()
    {
        // Bug Scenario: "user_password" contains "password" - should it be sanitized?
        // This tests the Contains() logic on line 161
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/test?user_password=hash123");
        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        // Current implementation uses Contains(), so "user_password" WILL be sanitized
        _mockErrorLoggingService.Verify(s => s.LogErrorAsync(
            It.IsAny<Exception>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int?>(),
            It.Is<Dictionary<string, object>>(d =>
                d.ContainsKey("QueryString") &&
                d["QueryString"].ToString()!.Contains("user_password=***"))),
            Times.Once,
            "DOCUMENTED BEHAVIOR: Contains('password') matches 'user_password'");
    }

    [Test]
    public async Task QueryString_Empty_DoesNotCrash()
    {
        // Bug Scenario: Empty query string should not cause errors
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/test");
        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        // Should complete without throwing
        context.Response.StatusCode.Should().Be(500, "should handle exception even with no query string");
    }

    #endregion

    #region Bug-Finding Tests: User Context

    [Test]
    public async Task AuthenticatedUser_LogsUserId()
    {
        // Bug Scenario: Authenticated requests should log user ID for audit trail
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/test");

        // Simulate authenticated user
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, "john.doe@example.com"),
            new Claim("ClubId", "42")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        _mockErrorLoggingService.Verify(s => s.LogErrorAsync(
            It.IsAny<Exception>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            "john.doe@example.com",
            It.IsAny<string>(),
            It.IsAny<string>(),
            42,
            It.IsAny<Dictionary<string, object>>()),
            Times.Once,
            "authenticated user info should be logged for audit trail");
    }

    [Test]
    public async Task AnonymousUser_HandlesNullUser()
    {
        // Bug Scenario: Unauthenticated requests should not crash on null User
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/public");
        context.User = null!; // Explicitly null user

        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        // Should not throw NullReferenceException
        context.Response.StatusCode.Should().Be(500, "should handle null user gracefully");
    }

    [Test]
    public async Task InvalidClubId_HandlesGracefully()
    {
        // Bug Scenario: Non-numeric ClubId claim should not crash
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/test");

        var claims = new List<Claim>
        {
            new Claim("ClubId", "not-a-number") // Invalid club ID
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims));

        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        _mockErrorLoggingService.Verify(s => s.LogErrorAsync(
            It.IsAny<Exception>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            null, // ClubId should be null when parsing fails
            It.IsAny<Dictionary<string, object>>()),
            Times.Once,
            "invalid ClubId should be handled gracefully (set to null)");
    }

    #endregion

    #region Bug-Finding Tests: Logging Failure Handling

    [Test]
    public async Task DatabaseLoggingFailure_DoesNotBreakResponse()
    {
        // Bug Scenario: If database is down, error logging shouldn't crash the app
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        _mockErrorLoggingService
            .Setup(s => s.LogErrorAsync(
                It.IsAny<Exception>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<Dictionary<string, object>>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        var middleware = CreateMiddleware(_ => throw new InvalidOperationException("Original error"));
        var context = CreateHttpContext("/api/test");
        ConfigureErrorLoggingService(context);

        await middleware.InvokeAsync(context);

        // Should still return error response despite logging failure
        context.Response.StatusCode.Should().Be(400,
            "should handle original exception even if logging fails");

        var body = await GetResponseBody(context);
        body.Should().Contain("Original error",
            "response should reflect original exception, not logging failure");
    }

    #endregion

    #region Bug-Finding Tests: Response Format

    [Test]
    public async Task ErrorResponse_IsValidJSON()
    {
        // Bug Scenario: Malformed JSON could break client parsing
        var middleware = CreateMiddleware(_ => throw new Exception("Test error"));
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        context.Response.ContentType.Should().Be("application/json",
            "error response should be JSON");

        var body = await GetResponseBody(context);
        var act = () => JsonSerializer.Deserialize<ErrorResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        act.Should().NotThrow("response should be valid JSON");
    }

    [Test]
    public async Task ErrorResponse_UsesCamelCase()
    {
        // Bug Scenario: JSON property names should follow camelCase convention
        var middleware = CreateMiddleware(_ => throw new Exception("Test"));
        var context = CreateHttpContext("/api/test");

        await middleware.InvokeAsync(context);

        var body = await GetResponseBody(context);

        body.Should().Contain("\"message\"", "JSON should use camelCase (message, not Message)");
        body.Should().Contain("\"traceId\"", "JSON should use camelCase (traceId, not TraceId)");
    }

    #endregion

    #region Helper Methods

    private GlobalExceptionMiddleware CreateMiddleware(RequestDelegate next)
    {
        return new GlobalExceptionMiddleware(next, _mockLogger.Object, _mockEnvironment.Object);
    }

    private DefaultHttpContext CreateHttpContext(string path)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        context.Request.Method = "GET";
        context.Request.QueryString = new QueryString(path.Contains('?') ? path.Substring(path.IndexOf('?')) : "");
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.1");
        context.TraceIdentifier = "test-trace-id";

        // Setup service provider
        var services = new ServiceCollection();
        services.AddSingleton(_mockErrorLoggingService.Object);
        context.RequestServices = services.BuildServiceProvider();

        return context;
    }

    private void ConfigureErrorLoggingService(HttpContext context)
    {
        var services = new ServiceCollection();
        services.AddSingleton(_mockErrorLoggingService.Object);
        context.RequestServices = services.BuildServiceProvider();
    }

    private async Task<string> GetResponseBody(HttpContext context)
    {
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }

    #endregion
}
