using FluentAssertions;
using GatherGrove.API.Middleware;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class EnvironmentValidationMiddlewareTests
{
    private Mock<RequestDelegate> _nextMock = null!;
    private Mock<ILogger<EnvironmentValidationMiddleware>> _loggerMock = null!;
    private Mock<IWebHostEnvironment> _environmentMock = null!;
    private IConfiguration _configuration = null!;
    private EnvironmentValidationMiddleware _middleware = null!;
    private DefaultHttpContext _context = null!;

    [SetUp]
    public void SetUp()
    {
        _nextMock = new Mock<RequestDelegate>();
        _loggerMock = new Mock<ILogger<EnvironmentValidationMiddleware>>();
        _environmentMock = new Mock<IWebHostEnvironment>();

        _context = new DefaultHttpContext();
        _context.Response.Body = new MemoryStream();
    }

    private void SetupConfiguration(Dictionary<string, string?> settings)
    {
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings!)
            .Build();

        _middleware = new EnvironmentValidationMiddleware(
            _nextMock.Object,
            _loggerMock.Object,
            _configuration,
            _environmentMock.Object);
    }

    #region Basic Request Handling Tests

    [Test]
    public async Task InvokeAsync_NonProductionEnvironment_PassesThrough()
    {
        // Arrange
        SetupConfiguration(new Dictionary<string, string?>());
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert - Should call next middleware without validation
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_NonHealthEndpoint_PassesThrough()
    {
        // Arrange
        SetupConfiguration(new Dictionary<string, string?>());
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/api/events";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert - Should call next middleware without validation
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_ProductionHealthEndpoint_ValidatesEnvironment()
    {
        // Arrange
        var validConfig = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key-for-production",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(validConfig);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert - Should not call next middleware
        _nextMock.Verify(n => n(_context), Times.Never);

        // Should return 200 OK
        _context.Response.StatusCode.Should().Be(200);

        // Verify response content
        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("healthy");
        responseBody.Should().Contain("Environment validation passed");
    }

    #endregion

    #region Database Validation Tests

    [Test]
    public async Task InvokeAsync_MissingDatabaseConnectionString_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Database connection string is not configured");
    }

    [Test]
    public async Task InvokeAsync_LocalDbInProduction_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=(localdb)\\mssqllocaldb;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("LocalDB detected in production environment");
    }

    [Test]
    public async Task InvokeAsync_InvalidDatabaseConnectionStringFormat_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "invalid-connection-string",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Invalid database connection string format");
    }

    #endregion

    #region JWT Validation Tests

    [Test]
    public async Task InvokeAsync_MissingJwtSecretKey_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("JWT Secret Key is not configured");
    }

    [Test]
    public async Task InvokeAsync_JwtSecretKeyTooShort_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "short-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("JWT Secret Key is too short");
    }

    [Test]
    public async Task InvokeAsync_DefaultJwtKeyInProduction_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "Super-Secret-Key-For-Development-Only-12345",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Default JWT Secret Key detected in production");
    }

    [Test]
    public async Task InvokeAsync_MissingJwtIssuer_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("JWT Issuer is not configured");
    }

    [Test]
    public async Task InvokeAsync_MissingJwtAudience_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("JWT Audience is not configured");
    }

    #endregion

    #region Stripe Validation Tests

    [Test]
    public async Task InvokeAsync_MissingStripeSecretKey_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Stripe Secret Key is not configured");
    }

    [Test]
    public async Task InvokeAsync_TestStripeKeysInProduction_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_test_validkey",
            ["Stripe:PublishableKey"] = "pk_test_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("using Stripe test keys");
    }

    [Test]
    public async Task InvokeAsync_MissingStripePublishableKey_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Stripe Publishable Key is not configured");
    }

    [Test]
    public async Task InvokeAsync_MissingStripeWebhookSecret_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Stripe Webhook Secret is not configured");
    }

    #endregion

    #region Azure Communication Services Validation Tests

    [Test]
    public async Task InvokeAsync_SmsNotConfigured_ReturnsHealthy()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert - Should still return 200 since ACS is optional
        _context.Response.StatusCode.Should().Be(200);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Environment validation passed");
    }

    [Test]
    public async Task InvokeAsync_SmsInvalidPhoneFormat_IsIgnored()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true",
            ["Telnyx:EnableSms"] = "true",
            ["Telnyx:ApiKey"] = "KEY123",
            ["Telnyx:FromPhoneNumber"] = "invalid-phone-number"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(200);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Environment validation passed");
    }

    #endregion

    #region CORS Validation Tests

    [Test]
    public async Task InvokeAsync_MissingFrontendUrl_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Frontend URL is not configured");
    }

    [Test]
    public async Task InvokeAsync_LocalhostUrlInProduction_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "http://localhost:3000",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Localhost URL detected in production environment");
    }

    [Test]
    public async Task InvokeAsync_InvalidFrontendUrlFormat_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "not-a-valid-url",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("Frontend URL format is invalid");
    }

    #endregion

    #region Security Settings Validation Tests

    [Test]
    public async Task InvokeAsync_HttpsNotRequiredInProduction_ReturnsError()
    {
        // Arrange
        var config = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "false"
        };

        SetupConfiguration(config);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.StatusCode.Should().Be(503);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        responseBody.Should().Contain("HTTPS is not required in production environment");
    }

    #endregion

    #region Response Format Tests

    [Test]
    public async Task InvokeAsync_ValidationPassed_ReturnsCorrectJsonFormat()
    {
        // Arrange
        var validConfig = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=production-server;Database=GatherGrove;",
            ["JwtSettings:SecretKey"] = "this-is-a-very-long-and-secure-secret-key",
            ["JwtSettings:Issuer"] = "https://api.gathergrove.club",
            ["JwtSettings:Audience"] = "https://app.gathergrove.club",
            ["Stripe:SecretKey"] = "sk_live_validkey",
            ["Stripe:PublishableKey"] = "pk_live_validkey",
            ["Stripe:WebhookSecret"] = "whsec_valid",
            ["App:FrontendUrl"] = "https://app.gathergrove.club",
            ["App:RequireHttps"] = "true"
        };

        SetupConfiguration(validConfig);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.ContentType.Should().Be("application/json");

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        var json = JsonDocument.Parse(responseBody);
        json.RootElement.TryGetProperty("status", out var status).Should().BeTrue();
        status.GetString().Should().Be("healthy");

        json.RootElement.TryGetProperty("message", out var message).Should().BeTrue();
        json.RootElement.TryGetProperty("timestamp", out var timestamp).Should().BeTrue();
    }

    [Test]
    public async Task InvokeAsync_ValidationFailed_ReturnsCorrectJsonFormat()
    {
        // Arrange
        var invalidConfig = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "short"
        };

        SetupConfiguration(invalidConfig);
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        _context.Request.Path = "/health/environment";

        // Act
        await _middleware.InvokeAsync(_context);

        // Assert
        _context.Response.ContentType.Should().Be("application/json");

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        var json = JsonDocument.Parse(responseBody);
        json.RootElement.TryGetProperty("status", out var status).Should().BeTrue();
        status.GetString().Should().Be("error");

        json.RootElement.TryGetProperty("errors", out var errors).Should().BeTrue();
        errors.GetArrayLength().Should().BeGreaterThan(0);
    }

    #endregion
}
