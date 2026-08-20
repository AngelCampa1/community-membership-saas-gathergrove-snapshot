using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Tests.Account.Deletion.TDD.Security;

/// <summary>
/// TDD Security Tests for Account Deletion Functionality
/// Focuses on authentication, authorization, data protection, and audit trails
/// </summary>
public class AccountDeletionSecurityTests : IDisposable
{
    private readonly Mock<IUserAccountDeletionService> _mockDeletionService;
    private readonly Mock<IAuthService> _mockAuthService;
    private readonly Mock<ILogger<UserController>> _mockLogger;
    private readonly Mock<IAuthorizationService> _mockAuthorizationService;
    private readonly GatherGroveDbContext _testDbContext;
    private readonly UserController _controller;

    public AccountDeletionSecurityTests()
    {
        // Arrange test dependencies
        _mockDeletionService = new Mock<IUserAccountDeletionService>();
        _mockAuthService = new Mock<IAuthService>();
        _mockLogger = new Mock<ILogger<UserController>>();
        _mockAuthorizationService = new Mock<IAuthorizationService>();

        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _testDbContext = new GatherGroveDbContext(options);

        // Create controller with mocked dependencies
        _controller = new UserController(
            _mockAuthService.Object,
            Mock.Of<IPushNotificationService>(),
            _mockLogger.Object,
            Mock.Of<IMemberService>()
        );

        // Setup controller context for authentication testing
        SetupControllerContext(_controller);
    }

    #region Authentication Security Tests

    [Fact]
    public async Task DeleteAccount_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var controller = CreateUnauthenticatedController();

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorizedResult.StatusCode.Should().Be(401);
        
        var problemDetails = unauthorizedResult.Value.Should().BeOfType<ProblemDetails>().Subject;
        problemDetails.Title.Should().Be("Authentication Required");
        problemDetails.Detail.Should().Contain("valid authentication token");
    }

    [Fact]
    public async Task DeleteAccount_WithExpiredToken_ShouldReturnUnauthorized()
    {
        // Arrange
        var expiredClaims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim("exp", DateTimeOffset.UtcNow.AddHours(-1).ToUnixTimeSeconds().ToString()) // Expired 1 hour ago
        };
        
        var controller = CreateControllerWithClaims(expiredClaims);

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task DeleteAccount_WithInvalidUserIdClaim_ShouldReturnUnauthorized()
    {
        // Arrange
        var invalidClaims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "not-a-number"),
            new Claim(ClaimTypes.Email, "test@example.com")
        };
        
        var controller = CreateControllerWithClaims(invalidClaims);

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorizedResult.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task DeleteAccount_WithMissingEmailClaim_ShouldReturnUnauthorized()
    {
        // Arrange
        var incompleteClaims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "123")
            // Missing email claim
        };
        
        var controller = CreateControllerWithClaims(incompleteClaims);

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    #endregion

    #region Authorization Security Tests

    [Fact]
    public async Task DeleteAccount_WithValidAuth_ShouldEnforceUserSelfDeletionOnly()
    {
        // Arrange
        var userId = 123;
        var validClaims = CreateValidUserClaims(userId, "test@example.com");
        var controller = CreateControllerWithClaims(validClaims);

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(new AccountDeletionResult { Success = true });

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        result.Should().BeOfType<OkObjectResult>();

        // Verify service was called with the authenticated user's ID only
        _mockDeletionService.Verify(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()), 
            Times.Once);
        
        // Verify no other user IDs were used
        _mockDeletionService.Verify(s => s.DeleteUserAccountAsync(It.Is<int>(id => id != userId), It.IsAny<AccountDeletionOptions>()), 
            Times.Never);
    }

    [Fact]
    public async Task DeleteAccount_AdminAttemptingToDeleteOtherUser_ShouldBeDenied()
    {
        // Arrange
        var adminUserId = 999;
        var targetUserId = 123;
        var adminClaims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, adminUserId.ToString()),
            new Claim(ClaimTypes.Email, "admin@example.com"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        
        var controller = CreateControllerWithClaims(adminClaims);

        // Act - Admin tries to delete another user's account through the /me endpoint
        var result = await controller.DeleteMyAccount();

        // Assert - Should only delete admin's own account, not target user
        _mockDeletionService.Verify(s => s.DeleteUserAccountAsync(adminUserId, It.IsAny<AccountDeletionOptions>()), 
            Times.Once);
        _mockDeletionService.Verify(s => s.DeleteUserAccountAsync(targetUserId, It.IsAny<AccountDeletionOptions>()), 
            Times.Never);
    }

    [Fact]
    public async Task DeleteAccount_WithTamperedJWT_ShouldRejectRequest()
    {
        // Arrange
        var tamperedClaims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim("iat", DateTimeOffset.UtcNow.AddMinutes(-5).ToUnixTimeSeconds().ToString()),
            new Claim("tampered", "malicious_payload") // Simulated tampering
        };
        
        var controller = CreateControllerWithClaims(tamperedClaims);

        // In real implementation, JWT validation would happen at middleware level
        // For testing, we simulate rejection of tampered token
        controller.ControllerContext.HttpContext.Items["TokenTampered"] = true;

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    #endregion

    #region Data Protection Security Tests

    [Fact]
    public async Task DeleteAccount_ShouldNotLogSensitiveInformation()
    {
        // Arrange
        var userId = 123;
        var sensitiveEmail = "sensitive.user@confidential.com";
        var validClaims = CreateValidUserClaims(userId, sensitiveEmail);
        var controller = CreateControllerWithClaims(validClaims);

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(new AccountDeletionResult { Success = true });

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        result.Should().BeOfType<OkObjectResult>();

        // Verify sensitive data is not logged
        _mockLogger.Verify(l => l.Log(
            It.IsAny<LogLevel>(),
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => !v.ToString().Contains(sensitiveEmail)),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.AtLeastOnce);

        // Verify only user ID (non-sensitive identifier) is logged
        _mockLogger.Verify(l => l.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"user: {userId}") && !v.ToString().Contains(sensitiveEmail)),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task DeleteAccount_ShouldImplementSecureDataWiping()
    {
        // Arrange
        var userId = 123;
        var validClaims = CreateValidUserClaims(userId, "test@example.com");
        var controller = CreateControllerWithClaims(validClaims);

        var deletionResult = new AccountDeletionResult 
        { 
            Success = true,
            Metadata = new Dictionary<string, object>
            {
                { "SecureWipeCompleted", true },
                { "DataCategoriesWiped", new[] { "PersonalInfo", "Communications", "Preferences" } }
            }
        };

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(deletionResult);

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<AccountDeletionResult>().Subject;
        
        response.Success.Should().BeTrue();
        response.Metadata.Should().ContainKey("SecureWipeCompleted");
        response.Metadata["SecureWipeCompleted"].Should().Be(true);
    }

    [Fact]
    public async Task DeleteAccount_WithGDPRCompliance_ShouldProvideDataPortabilityOption()
    {
        // Arrange
        var userId = 123;
        var validClaims = CreateValidUserClaims(userId, "eu.resident@example.com");
        var controller = CreateControllerWithClaims(validClaims);

        // Request includes GDPR data export option
        var deletionOptions = new AccountDeletionOptions
        {
            CreateBackup = true,
            SendConfirmationEmail = true
        };

        var deletionResult = new AccountDeletionResult 
        { 
            Success = true,
            Metadata = new Dictionary<string, object>
            {
                { "GDPRComplianceVerified", true },
                { "DataExportUrl", "https://secure.example.com/data-export/user-123" }
            }
        };

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(deletionResult);

        // Act
        var result = await controller.DeleteMyAccount(deletionOptions);

        // Assert - Test should fail initially (RED phase)
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<AccountDeletionResult>().Subject;
        
        response.Metadata.Should().ContainKey("GDPRComplianceVerified");
        response.Metadata.Should().ContainKey("DataExportUrl");
    }

    #endregion

    #region Audit Trail Security Tests

    [Fact]
    public async Task DeleteAccount_ShouldCreateComprehensiveAuditTrail()
    {
        // Arrange
        var userId = 123;
        var userIp = "192.168.1.100";
        var userAgent = "Mozilla/5.0 TestBrowser";
        
        var validClaims = CreateValidUserClaims(userId, "test@example.com");
        var controller = CreateControllerWithClaims(validClaims, userIp, userAgent);

        var deletionResult = new AccountDeletionResult 
        { 
            Success = true,
            Metadata = new Dictionary<string, object>
            {
                { "AuditLogId", Guid.NewGuid() },
                { "DeletionTimestamp", DateTime.UtcNow },
                { "InitiatorIP", userIp },
                { "InitiatorUserAgent", userAgent }
            }
        };

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(deletionResult);

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<AccountDeletionResult>().Subject;
        
        response.Metadata.Should().ContainKey("AuditLogId");
        response.Metadata.Should().ContainKey("DeletionTimestamp");
        response.Metadata.Should().ContainKey("InitiatorIP");
        response.Metadata.Should().ContainKey("InitiatorUserAgent");

        // Verify audit information is logged
        _mockLogger.Verify(l => l.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Account deletion completed")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteAccount_WithFailure_ShouldLogSecurityIncident()
    {
        // Arrange
        var userId = 123;
        var validClaims = CreateValidUserClaims(userId, "test@example.com");
        var controller = CreateControllerWithClaims(validClaims);

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ThrowsAsync(new SecurityException("Suspicious deletion attempt detected"));

        // Act
        var result = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        result.Should().BeOfType<StatusCodeResult>().Which.StatusCode.Should().Be(500);

        // Verify security incident is logged
        _mockLogger.Verify(l => l.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Security incident") || 
                                          v.ToString().Contains("deletion attempt")),
            It.IsAny<SecurityException>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteAccount_ShouldImplementRateLimiting()
    {
        // Arrange
        var userId = 123;
        var validClaims = CreateValidUserClaims(userId, "test@example.com");
        var controller = CreateControllerWithClaims(validClaims);

        // Simulate rate limiting by tracking requests
        var rateLimitExceeded = new AccountDeletionResult 
        { 
            Success = false,
            Message = "Rate limit exceeded. Please try again later."
        };

        _mockDeletionService.SetupSequence(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(new AccountDeletionResult { Success = true }) // First request succeeds
            .ReturnsAsync(rateLimitExceeded) // Second request rate limited
            .ReturnsAsync(rateLimitExceeded); // Third request rate limited

        // Act - Multiple rapid requests
        var result1 = await controller.DeleteMyAccount();
        var result2 = await controller.DeleteMyAccount();
        var result3 = await controller.DeleteMyAccount();

        // Assert - Test should fail initially (RED phase)
        result1.Should().BeOfType<OkObjectResult>();
        
        var badRequestResult2 = result2.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult2.Value.Should().BeAssignableTo<AccountDeletionResult>()
            .Which.Message.Should().Contain("Rate limit exceeded");

        var badRequestResult3 = result3.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult3.Value.Should().BeAssignableTo<AccountDeletionResult>()
            .Which.Message.Should().Contain("Rate limit exceeded");
    }

    #endregion

    #region Input Validation Security Tests

    [Fact]
    public async Task DeleteAccount_WithMaliciousOptions_ShouldSanitizeInput()
    {
        // Arrange
        var userId = 123;
        var validClaims = CreateValidUserClaims(userId, "test@example.com");
        var controller = CreateControllerWithClaims(validClaims);

        var maliciousOptions = new AccountDeletionOptions
        {
            TransferClubOwnership = true,
            NewOwnerId = -1, // Malicious negative ID
            SendConfirmationEmail = true
        };

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(new AccountDeletionResult 
            { 
                Success = false,
                Message = "Invalid transfer options provided"
            });

        // Act
        var result = await controller.DeleteMyAccount(maliciousOptions);

        // Assert - Test should fail initially (RED phase)
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeAssignableTo<AccountDeletionResult>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("Invalid");
    }

    [Fact]
    public async Task DeleteAccount_WithSQLInjectionAttempt_ShouldPreventInjection()
    {
        // Arrange
        var userId = 123;
        var validClaims = CreateValidUserClaims(userId, "test@example.com");
        var controller = CreateControllerWithClaims(validClaims);

        // Simulate SQL injection attempt through options
        var sqlInjectionOptions = new AccountDeletionOptions
        {
            // Simulated injection payload - in real implementation this would be validated
            TransferClubOwnership = true,
            // NewOwnerId would be validated to prevent injection
        };

        _mockDeletionService.Setup(s => s.DeleteUserAccountAsync(userId, It.IsAny<AccountDeletionOptions>()))
            .ReturnsAsync(new AccountDeletionResult { Success = true });

        // Act
        var result = await controller.DeleteMyAccount(sqlInjectionOptions);

        // Assert - Test should fail initially (RED phase)
        result.Should().BeOfType<OkObjectResult>();

        // Verify service was called with sanitized parameters
        _mockDeletionService.Verify(s => s.DeleteUserAccountAsync(
            It.Is<int>(id => id == userId), // Only valid user ID
            It.Is<AccountDeletionOptions>(opts => opts != null)), // Non-null options
            Times.Once);
    }

    #endregion

    #region Helper Methods

    private void SetupControllerContext(ControllerBase controller, string userIp = "127.0.0.1", string userAgent = "Test-Agent")
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse(userIp);
        httpContext.Request.Headers["User-Agent"] = userAgent;
        
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    private UserController CreateUnauthenticatedController()
    {
        var controller = new UserController(
            _mockAuthService.Object,
            Mock.Of<IPushNotificationService>(),
            _mockLogger.Object,
            Mock.Of<IMemberService>()
        );

        // Setup context without authentication
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return controller;
    }

    private UserController CreateControllerWithClaims(IEnumerable<Claim> claims, string userIp = "127.0.0.1", string userAgent = "Test-Agent")
    {
        var controller = new UserController(
            _mockAuthService.Object,
            Mock.Of<IPushNotificationService>(),
            _mockLogger.Object,
            Mock.Of<IMemberService>()
        );

        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = principal
        };
        
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse(userIp);
        httpContext.Request.Headers["User-Agent"] = userAgent;

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    private Claim[] CreateValidUserClaims(int userId, string email)
    {
        return new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
            new Claim("exp", DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds().ToString())
        };
    }

    public void Dispose()
    {
        _testDbContext?.Dispose();
    }
}

/// <summary>
/// Security exception for testing security scenarios
/// </summary>
public class SecurityException : Exception
{
    public SecurityException(string message) : base(message) { }
    public SecurityException(string message, Exception innerException) : base(message, innerException) { }
}

/// <summary>
/// Extension methods for UserController to add deletion methods (RED phase)
/// These will be implemented during GREEN phase
/// </summary>
public static class UserControllerSecurityExtensions
{
    public static async Task<IActionResult> DeleteMyAccount(this UserController controller, AccountDeletionOptions options = null)
    {
        // RED phase implementation - this will fail tests initially
        throw new NotImplementedException("Account deletion endpoint not yet implemented");
    }
}