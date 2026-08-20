using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using System.Text.Json;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class HealthControllerTests
{
    private Mock<IConfiguration> _configurationMock = null!;
    private Mock<IWebHostEnvironment> _environmentMock = null!;
    private Mock<IServiceProvider> _serviceProviderMock = null!;
    private Mock<ILogger<HealthController>> _loggerMock = null!;
    private GatherGroveDbContext _context = null!;
    private HealthController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _configurationMock = new Mock<IConfiguration>();
        _environmentMock = new Mock<IWebHostEnvironment>();
        _serviceProviderMock = new Mock<IServiceProvider>();
        _loggerMock = new Mock<ILogger<HealthController>>();

        // Setup in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(options);

        // Setup default environment
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        _controller = new HealthController(
            _context,
            _configurationMock.Object,
            _environmentMock.Object,
            _serviceProviderMock.Object,
            _loggerMock.Object);

        // Setup controller context
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    #region Basic Health Endpoint Tests

    [Test]
    public void GetHealth_ValidRequest_Returns200OK()
    {
        // Act
        var result = _controller.GetHealth();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public void GetHealth_ValidRequest_ReturnsHealthyStatus()
    {
        // Act
        var result = _controller.GetHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Status").GetString().Should().Be("Healthy");
    }

    [Test]
    public void GetHealth_IncludesServiceName()
    {
        // Act
        var result = _controller.GetHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Service").GetString().Should().Be("GatherGrove API");
    }

    [Test]
    public void GetHealth_IncludesEnvironment()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns("Production");

        // Act
        var result = _controller.GetHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Environment").GetString().Should().Be("Production");
    }

    [Test]
    public void GetHealth_IncludesTimestamp()
    {
        // Act
        var result = _controller.GetHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("Timestamp", out var timestamp).Should().BeTrue();
    }

    [Test]
    public void GetHealth_IncludesVersion()
    {
        // Act
        var result = _controller.GetHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Version").GetString().Should().Be("1.0.0");
    }

    #endregion

    #region Deep Health Endpoint Tests

    [Test]
    public async Task GetDeepHealth_WithHealthyDatabase_Returns200()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Act
        var result = await _controller.GetDeepHealth();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }


    [Test]
    public async Task GetDeepHealth_IncludesDatabaseStatus()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Act
        var result = await _controller.GetDeepHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("Database", out var database).Should().BeTrue();
    }

    [Test]
    public async Task GetDeepHealth_ReturnsHealthyStatus_WhenAllChecksPass()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Act
        var result = await _controller.GetDeepHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Status").GetString().Should().Be("Healthy");
    }

    [Test]
    public async Task GetDeepHealth_IncludesConfigurationStatus()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Act
        var result = await _controller.GetDeepHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("Configuration", out var config).Should().BeTrue();
        config.TryGetProperty("Status", out _).Should().BeTrue();
    }

    [Test]
    public async Task GetDeepHealth_MissingConfiguration_Returns503()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        // Don't setup configuration

        // Act
        var result = await _controller.GetDeepHealth() as ObjectResult;

        // Assert
        result!.StatusCode.Should().Be(503);
    }

    [Test]
    public async Task GetDeepHealth_DatabaseError_Returns503()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Dispose the context to simulate database connection failure
        _context.Dispose();
        var brokenOptions = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase("broken-db")
            .Options;
        var brokenContext = new GatherGroveDbContext(brokenOptions);
        brokenContext.Dispose(); // Dispose immediately to break it

        var controller = new HealthController(
            brokenContext,
            _configurationMock.Object,
            _environmentMock.Object,
            _serviceProviderMock.Object,
            _loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = _controller.ControllerContext.HttpContext.User }
        };

        // Act
        var result = await controller.GetDeepHealth() as ObjectResult;

        // Assert
        result!.StatusCode.Should().Be(503);
    }

    [Test]
    public async Task GetDeepHealth_ConfigurationException_Returns503()
    {
        // Arrange
        SetupAuthenticatedAdmin();

        // Setup configuration that throws when accessed
        _configurationMock.Setup(c => c.GetSection(It.IsAny<string>()))
            .Throws(new InvalidOperationException("Configuration error"));

        // Act
        var result = await _controller.GetDeepHealth() as ObjectResult;

        // Assert - Configuration errors are caught and result in 503 (unhealthy service)
        result!.StatusCode.Should().Be(503);
        var response = GetJsonElement(result.Value!);
        response.GetProperty("Status").GetString().Should().Be("Degraded");
    }

    #endregion

    #region Comprehensive Health Endpoint Tests

    [Test]
    public async Task GetComprehensiveHealth_AllChecksPass_Returns200()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        SetupValidServices();

        // Act
        var result = await _controller.GetComprehensiveHealth();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Test]
    public async Task GetComprehensiveHealth_IncludesAllHealthChecks()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        SetupValidServices();

        // Act
        var result = await _controller.GetComprehensiveHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("HealthChecks", out var healthChecks).Should().BeTrue();

        var checkNames = new List<string>();
        foreach (var check in healthChecks.EnumerateArray())
        {
            checkNames.Add(check.GetProperty("Name").GetString()!);
        }

        checkNames.Should().Contain("Database");
        checkNames.Should().Contain("Configuration");
        checkNames.Should().Contain("SystemResources");
        checkNames.Should().Contain("EssentialServices");
        checkNames.Should().Contain("ApplicationState");
    }

    [Test]
    public async Task GetComprehensiveHealth_HealthChecksHaveRequiredProperties()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        SetupValidServices();

        // Act
        var result = await _controller.GetComprehensiveHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("HealthChecks", out var healthChecks).Should().BeTrue();

        foreach (var check in healthChecks.EnumerateArray())
        {
            check.TryGetProperty("Name", out _).Should().BeTrue();
            check.TryGetProperty("Status", out _).Should().BeTrue();
            check.TryGetProperty("IsHealthy", out _).Should().BeTrue();
            check.TryGetProperty("Duration", out _).Should().BeTrue();
        }
    }

    [Test]
    public async Task GetComprehensiveHealth_ReturnsHealthyStatus_WhenAllChecksPass()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        SetupValidServices();

        // Act
        var result = await _controller.GetComprehensiveHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Status").GetString().Should().Be("Healthy");
    }

    [Test]
    public async Task GetComprehensiveHealth_ConfigurationFailure_Returns503()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidServices();
        // Missing configuration

        // Act
        var result = await _controller.GetComprehensiveHealth() as ObjectResult;

        // Assert
        result!.StatusCode.Should().Be(503);
    }

    [Test]
    public async Task GetComprehensiveHealth_ServiceResolutionFailure_Returns503()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        // Missing services

        // Act
        var result = await _controller.GetComprehensiveHealth() as ObjectResult;

        // Assert
        result!.StatusCode.Should().Be(503);
    }

    [Test]
    public async Task GetComprehensiveHealth_IncludesTotalDuration()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        SetupValidServices();

        // Act
        var result = await _controller.GetComprehensiveHealth() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("TotalDuration", out _).Should().BeTrue();
    }

    [Test]
    public async Task GetComprehensiveHealth_DatabaseFailure_Returns503()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        SetupValidServices();

        // Dispose the context to simulate database connection failure
        _context.Dispose();
        var brokenOptions = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase("broken-comprehensive-db")
            .Options;
        var brokenContext = new GatherGroveDbContext(brokenOptions);
        brokenContext.Dispose();

        var controller = new HealthController(
            brokenContext,
            _configurationMock.Object,
            _environmentMock.Object,
            _serviceProviderMock.Object,
            _loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = _controller.ControllerContext.HttpContext.User }
        };

        // Act
        var result = await controller.GetComprehensiveHealth() as ObjectResult;

        // Assert
        result!.StatusCode.Should().Be(503);
        var response = GetJsonElement(result.Value!);
        response.GetProperty("Status").GetString().Should().Be("Unhealthy");
    }

    [Test]
    public async Task GetComprehensiveHealth_UnexpectedException_Returns500()
    {
        // Arrange
        SetupAuthenticatedAdmin();

        // Setup environment that throws when accessed
        _environmentMock.Setup(e => e.EnvironmentName)
            .Throws(new InvalidOperationException("Environment error"));

        // Act
        var result = await _controller.GetComprehensiveHealth() as ObjectResult;

        // Assert
        result!.StatusCode.Should().Be(500);
        var response = GetJsonElement(result.Value!);
        response.GetProperty("Status").GetString().Should().Be("Error");
    }

    #endregion

    #region Debug Endpoint Tests

    [Test]
    public async Task GetDebugInfo_ValidRequest_Returns200()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Act
        var result = await _controller.GetDebugInfo();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Test]
    public async Task GetDebugInfo_IncludesEnvironmentInformation()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();
        _environmentMock.Setup(e => e.EnvironmentName).Returns("Staging");

        // Act
        var result = await _controller.GetDebugInfo() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Environment").GetString().Should().Be("Staging");
    }

    [Test]
    public async Task GetDebugInfo_IncludesDatabaseConnectivity()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Act
        var result = await _controller.GetDebugInfo() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("DatabaseConnectivity", out var dbConnectivity).Should().BeTrue();
        dbConnectivity.GetProperty("CanConnect").GetBoolean().Should().BeTrue();
    }

    [Test]
    public async Task GetDebugInfo_ReturnsUserCount_WhenDatabaseConnects()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Add some users to the database
        _context.Users.Add(new Domain.Entities.User { Email = "test1@example.com", PasswordHash = "hash1" });
        _context.Users.Add(new Domain.Entities.User { Email = "test2@example.com", PasswordHash = "hash2" });
        _context.SaveChanges();

        // Act
        var result = await _controller.GetDebugInfo() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("DatabaseConnectivity", out var dbConnectivity).Should().BeTrue();
        dbConnectivity.GetProperty("UserCount").GetInt32().Should().Be(2);
    }

    [Test]
    public async Task GetDebugInfo_IncludesConfigurationFlags()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Act
        var result = await _controller.GetDebugInfo() as OkObjectResult;

        // Assert
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("Configuration", out var config).Should().BeTrue();
        config.TryGetProperty("HasDefaultConnection", out _).Should().BeTrue();
        config.TryGetProperty("HasJwtSecret", out _).Should().BeTrue();
    }

    [Test]
    public async Task GetDebugInfo_DatabaseFailure_IncludesError()
    {
        // Arrange
        SetupAuthenticatedAdmin();
        SetupValidConfiguration();

        // Dispose the context to simulate database connection failure
        _context.Dispose();
        var brokenOptions = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase("broken-debug-db")
            .Options;
        var brokenContext = new GatherGroveDbContext(brokenOptions);
        brokenContext.Dispose();

        var controller = new HealthController(
            brokenContext,
            _configurationMock.Object,
            _environmentMock.Object,
            _serviceProviderMock.Object,
            _loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = _controller.ControllerContext.HttpContext.User }
        };

        // Act
        var result = await controller.GetDebugInfo() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        var response = GetJsonElement(result!.Value!);
        response.TryGetProperty("DatabaseConnectivity", out var dbConnectivity).Should().BeTrue();
        dbConnectivity.GetProperty("CanConnect").GetBoolean().Should().BeFalse();
        dbConnectivity.TryGetProperty("Error", out _).Should().BeTrue();
    }

    [Test]
    public async Task GetDebugInfo_UnexpectedException_ReturnsErrorStatus()
    {
        // Arrange
        SetupAuthenticatedAdmin();

        // Setup environment that throws when accessed
        _environmentMock.Setup(e => e.EnvironmentName)
            .Throws(new InvalidOperationException("Environment error"));

        // Act
        var result = await _controller.GetDebugInfo() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        var response = GetJsonElement(result!.Value!);
        response.GetProperty("Status").GetString().Should().Be("Error");
        response.TryGetProperty("Error", out _).Should().BeTrue();
    }

    #endregion

    #region Helper Methods

    private JsonElement GetJsonElement(object value)
    {
        var json = JsonSerializer.Serialize(value);
        return JsonDocument.Parse(json).RootElement;
    }

    private void SetupAuthenticatedAdmin()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "ClubAdmin"),
            new("ClubId", "1")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;
    }

    private void SetupValidConfiguration()
    {
        // Setup connection strings section
        var connectionStringsMock = new Mock<IConfigurationSection>();
        connectionStringsMock.Setup(c => c["DefaultConnection"])
            .Returns("Server=test;Database=test;");

        _configurationMock.Setup(c => c.GetSection("ConnectionStrings"))
            .Returns(connectionStringsMock.Object);

        // Setup JWT settings
        _configurationMock.Setup(c => c["JwtSettings:SecretKey"])
            .Returns("test-secret-key-that-is-long-enough-for-validation");
    }

    private void SetupValidServices()
    {
        var authServiceMock = new Mock<GatherGrove.Application.Services.IAuthService>();
        var memberServiceMock = new Mock<GatherGrove.Application.Services.IMemberService>();
        var billingServiceMock = new Mock<GatherGrove.Application.Services.IBillingService>();

        _serviceProviderMock.Setup(sp => sp.GetService(typeof(GatherGrove.Application.Services.IAuthService)))
            .Returns(authServiceMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(GatherGrove.Application.Services.IMemberService)))
            .Returns(memberServiceMock.Object);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(GatherGrove.Application.Services.IBillingService)))
            .Returns(billingServiceMock.Object);
    }

    #endregion
}
