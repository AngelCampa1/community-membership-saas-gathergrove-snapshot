using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;
using System.Security.Claims;
using System.Reflection;
using GatherGrove.Infrastructure.Authorization.Handlers;
using GatherGrove.Infrastructure.Authorization.Requirements;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Infrastructure.Tests.Authorization.Handlers;

/// <summary>
/// TDD Tests for UnlimitedTierRequirementHandler
/// SECURITY CRITICAL - Tests authorization for premium Unlimited tier features
/// Tests fail-closed security: fails on any error, missing claim, or missing context
/// </summary>
[TestFixture]
public class UnlimitedTierRequirementHandlerTests
{
    private Mock<IClubTierService> _mockClubTierService = null!;
    private Mock<ILogger<UnlimitedTierRequirementHandler>> _mockLogger = null!;
    private UnlimitedTierRequirementHandler _handler = null!;
    private UnlimitedTierRequirement _requirement = null!;

    [SetUp]
    public void SetUp()
    {
        _mockClubTierService = new Mock<IClubTierService>();
        _mockLogger = new Mock<ILogger<UnlimitedTierRequirementHandler>>();
        _handler = new UnlimitedTierRequirementHandler(_mockClubTierService.Object, _mockLogger.Object);
        _requirement = new UnlimitedTierRequirement();
    }

    #region User ID Extraction Tests (3 tests)

    [Test]
    public async Task HandleRequirementAsync_ValidSubClaim_ExtractsUserId()
    {
        // Arrange
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(123, 1))
            .ReturnsAsync(true);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
        _mockClubTierService.Verify(s => s.HasUnlimitedTierAccess(123, 1), Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_ValidUserIdClaim_ExtractsUserId()
    {
        // Arrange - Uses userId claim when sub is not present
        var user = CreateUser("userId", "456");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(456, 1))
            .ReturnsAsync(true);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
        _mockClubTierService.Verify(s => s.HasUnlimitedTierAccess(456, 1), Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_NoUserIdClaim_FailsAndLogsWarning()
    {
        // Arrange - No valid user ID claim
        var user = CreateUser("email", "user@example.com"); // Wrong claim type
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasFailed, Is.True);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unable to determine user identity")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Club ID Extraction Tests (3 tests)

    [Test]
    public async Task HandleRequirementAsync_ValidClubIdInQuery_ExtractsClubId()
    {
        // Arrange
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubId: 42);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(123, 42))
            .ReturnsAsync(true);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
        _mockClubTierService.Verify(s => s.HasUnlimitedTierAccess(123, 42), Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_MissingClubId_FailsAndLogsWarning()
    {
        // Arrange - No clubId in query
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(); // No clubId
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasFailed, Is.True);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unable to determine club ID")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_InvalidClubIdFormat_FailsAndLogsWarning()
    {
        // Arrange - clubId is not a valid integer
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubIdString: "not-a-number");
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasFailed, Is.True);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unable to determine club ID")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Tier Access Check Tests (4 tests)

    [Test]
    public async Task HandleRequirementAsync_UserHasUnlimitedAccess_Succeeds()
    {
        // Arrange
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(123, 1))
            .ReturnsAsync(true);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
        Assert.That(context.HasFailed, Is.False);
    }

    [Test]
    public async Task HandleRequirementAsync_UserDoesNotHaveUnlimitedAccess_Fails()
    {
        // Arrange
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(123, 1))
            .ReturnsAsync(false);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasFailed, Is.True);
        Assert.That(context.HasSucceeded, Is.False);
    }

    [Test]
    public async Task HandleRequirementAsync_AccessGranted_LogsInformation()
    {
        // Arrange
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(123, 1))
            .ReturnsAsync(true);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("granted unlimited tier access")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_AccessDenied_LogsInformation()
    {
        // Arrange
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(123, 1))
            .ReturnsAsync(false);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("denied unlimited tier access")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Error Handling Tests (3 tests)

    [Test]
    public async Task HandleRequirementAsync_ServiceThrowsException_FailsAndLogsError()
    {
        // Arrange
        var user = CreateUser("sub", "123");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        var exception = new Exception("Database connection failed");
        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(123, 1))
            .ThrowsAsync(exception);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasFailed, Is.True);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error during unlimited tier authorization check")),
                exception,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_NullHttpContext_FailsGracefully()
    {
        // Arrange - Resource is null (no HTTP context)
        var user = CreateUser("sub", "123");
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, null);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert - Fails due to missing club ID
        Assert.That(context.HasFailed, Is.True);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unable to determine club ID")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_InvalidUserIdFormat_FailsGracefully()
    {
        // Arrange - User ID claim is not a valid integer
        var user = CreateUser("sub", "not-a-number");
        var httpContext = CreateHttpContext(clubId: 1);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert
        Assert.That(context.HasFailed, Is.True);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unable to determine user identity")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Integration Tests (2 tests)

    [Test]
    public async Task HandleRequirementAsync_CompleteSuccessFlow_AllComponentsWork()
    {
        // Arrange - Complete happy path
        var user = CreateUser("sub", "789");
        var httpContext = CreateHttpContext(clubId: 5);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(789, 5))
            .ReturnsAsync(true);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert - Complete verification
        Assert.That(context.HasSucceeded, Is.True);
        Assert.That(context.HasFailed, Is.False);

        // Verify service called with correct parameters
        _mockClubTierService.Verify(s => s.HasUnlimitedTierAccess(789, 5), Times.Once);

        // Verify success logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("granted")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HandleRequirementAsync_CompleteFailureFlow_AllComponentsWork()
    {
        // Arrange - Complete failure path
        var user = CreateUser("sub", "999");
        var httpContext = CreateHttpContext(clubId: 10);
        var context = new AuthorizationHandlerContext(new[] { _requirement }, user, httpContext);

        _mockClubTierService
            .Setup(s => s.HasUnlimitedTierAccess(999, 10))
            .ReturnsAsync(false);

        // Act
        await InvokeHandleRequirementAsync(context, _requirement);

        // Assert - Complete verification
        Assert.That(context.HasFailed, Is.True);
        Assert.That(context.HasSucceeded, Is.False);

        // Verify service called with correct parameters
        _mockClubTierService.Verify(s => s.HasUnlimitedTierAccess(999, 10), Times.Once);

        // Verify denial logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("denied")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Invokes the protected HandleRequirementAsync method using reflection
    /// </summary>
    private async Task InvokeHandleRequirementAsync(AuthorizationHandlerContext context, UnlimitedTierRequirement requirement)
    {
        var method = typeof(UnlimitedTierRequirementHandler).GetMethod(
            "HandleRequirementAsync",
            BindingFlags.NonPublic | BindingFlags.Instance);

        if (method == null)
        {
            throw new InvalidOperationException("HandleRequirementAsync method not found");
        }

        var task = method.Invoke(_handler, new object[] { context, requirement }) as Task;
        if (task != null)
        {
            await task;
        }
    }

    /// <summary>
    /// Creates a ClaimsPrincipal with a single claim for testing
    /// </summary>
    private ClaimsPrincipal CreateUser(string claimType, string claimValue)
    {
        var claims = new List<Claim> { new Claim(claimType, claimValue) };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        return new ClaimsPrincipal(identity);
    }

    /// <summary>
    /// Creates an HttpContext with optional clubId in query parameters
    /// </summary>
    private HttpContext CreateHttpContext(int? clubId = null, string? clubIdString = null)
    {
        var httpContext = new DefaultHttpContext();

        if (clubId.HasValue)
        {
            httpContext.Request.QueryString = new QueryString($"?clubId={clubId.Value}");
        }
        else if (clubIdString != null)
        {
            httpContext.Request.QueryString = new QueryString($"?clubId={clubIdString}");
        }

        return httpContext;
    }

    #endregion
}
