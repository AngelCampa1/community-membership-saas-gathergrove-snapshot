using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Infrastructure.Services.TierValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class ClubTierControllerTests
{
    private Mock<ITierGateService> _tierGateServiceMock = null!;
    private Mock<ILogger<ClubTierController>> _loggerMock = null!;
    private ClubTierController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _tierGateServiceMock = new Mock<ITierGateService>();
        _loggerMock = new Mock<ILogger<ClubTierController>>();

        _controller = new ClubTierController(
            _tierGateServiceMock.Object,
            _loggerMock.Object);

        // Setup HTTP context with default authenticated user
        SetupAuthenticatedUser(clubId: 1);
    }

    private void SetupAuthenticatedUser(int clubId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "ClubAdmin"),
            new("ClubId", clubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupUnauthenticatedUser()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "Member")
            // No ClubId claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetTierInfo Tests

    [Test]
    public async Task GetTierInfo_UnlimitedTier_ReturnsUnlimitedTierInfo()
    {
        // Arrange
        var clubId = 1;
        var resourceLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 10000,
            MaxCacheSize = 1000,
            MaxBackgroundJobs = 100,
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = true
        };

        _tierGateServiceMock
            .Setup(s => s.GetTierResourceLimitsAsync(clubId))
            .ReturnsAsync(resourceLimits);
        _tierGateServiceMock
            .Setup(s => s.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.GetTierInfo(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        // Verify tier is "Unlimited"
        var value = okResult.Value;
        value.Should().NotBeNull();

        var tierProperty = value!.GetType().GetProperty("tier");
        tierProperty.Should().NotBeNull();
        tierProperty!.GetValue(value).Should().Be("Unlimited");

        var resourceLimitsProperty = value.GetType().GetProperty("resourceLimits");
        resourceLimitsProperty.Should().NotBeNull();
    }

    [Test]
    public async Task GetTierInfo_GrowTier_ReturnsGrowTierInfo()
    {
        // Arrange
        var clubId = 1;
        var resourceLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 1000,
            MaxCacheSize = 500,
            MaxBackgroundJobs = 10,
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = true
        };

        _tierGateServiceMock
            .Setup(s => s.GetTierResourceLimitsAsync(clubId))
            .ReturnsAsync(resourceLimits);
        _tierGateServiceMock
            .Setup(s => s.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetTierInfo(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var tierProperty = value!.GetType().GetProperty("tier");
        tierProperty!.GetValue(value).Should().Be("Grow");
    }

    [Test]
    public async Task GetTierInfo_NonUnlimitedNonAdvancedTier_ReturnsGrowTierInfo()
    {
        // Arrange - a club with no advanced features enabled and non-unlimited defaults to Grow
        var clubId = 1;
        var resourceLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 100,
            MaxCacheSize = 50,
            MaxBackgroundJobs = 0,
            BackgroundProcessingEnabled = false,
            AdvancedFeaturesEnabled = false
        };

        _tierGateServiceMock
            .Setup(s => s.GetTierResourceLimitsAsync(clubId))
            .ReturnsAsync(resourceLimits);
        _tierGateServiceMock
            .Setup(s => s.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetTierInfo(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var tierProperty = value!.GetType().GetProperty("tier");
        tierProperty!.GetValue(value).Should().Be("Grow");
    }

    [Test]
    public async Task GetTierInfo_NoClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        SetupUnauthenticatedUser();

        // Act
        var result = await _controller.GetTierInfo(clubId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetTierInfo_DifferentClubId_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // User is in club 1
        SetupAuthenticatedUser(clubId: 1);

        // Act
        var result = await _controller.GetTierInfo(clubId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetTierInfo_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        _tierGateServiceMock
            .Setup(s => s.GetTierResourceLimitsAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetTierInfo(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ValidateFeatureAccess Tests

    [Test]
    public async Task ValidateFeatureAccess_HasAccess_ReturnsOkWithAccessGranted()
    {
        // Arrange
        var clubId = 1;
        var feature = "advanced-analytics";
        var validationResult = new TierValidationResult
        {
            HasAccess = true,
            Message = "Access granted",
            CurrentTier = "Grow",
            RequiredTier = "Grow"
        };

        _tierGateServiceMock
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, feature))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateFeatureAccess(clubId, feature);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var hasAccessProperty = value!.GetType().GetProperty("hasAccess");
        hasAccessProperty.Should().NotBeNull();
        hasAccessProperty!.GetValue(value).Should().Be(true);

        var messageProperty = value.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Access granted");

        var currentTierProperty = value.GetType().GetProperty("currentTier");
        currentTierProperty!.GetValue(value).Should().Be("Grow");

        var requiredTierProperty = value.GetType().GetProperty("requiredTier");
        requiredTierProperty!.GetValue(value).Should().Be("Grow");
    }

    [Test]
    public async Task ValidateFeatureAccess_NoAccess_ReturnsOkWithAccessDenied()
    {
        // Arrange
        var clubId = 1;
        var feature = "unlimited-features";
        var validationResult = new TierValidationResult
        {
            HasAccess = false,
            Message = "Upgrade to Expand tier required",
            CurrentTier = "Sprout",
            RequiredTier = "Unlimited"
        };

        _tierGateServiceMock
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, feature))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateFeatureAccess(clubId, feature);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var hasAccessProperty = value!.GetType().GetProperty("hasAccess");
        hasAccessProperty!.GetValue(value).Should().Be(false);

        var messageProperty = value.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Upgrade to Expand tier required");
    }

    [Test]
    public async Task ValidateFeatureAccess_NoClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var feature = "test-feature";
        SetupUnauthenticatedUser();

        // Act
        var result = await _controller.ValidateFeatureAccess(clubId, feature);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task ValidateFeatureAccess_DifferentClubId_ReturnsForbid()
    {
        // Arrange
        var clubId = 2;
        var feature = "test-feature";
        SetupAuthenticatedUser(clubId: 1);

        // Act
        var result = await _controller.ValidateFeatureAccess(clubId, feature);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task ValidateFeatureAccess_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var feature = "test-feature";
        _tierGateServiceMock
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, feature))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.ValidateFeatureAccess(clubId, feature);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ValidateUnlimitedAccess Tests

    [Test]
    public async Task ValidateUnlimitedAccess_HasUnlimitedAccess_ReturnsOkWithTrue()
    {
        // Arrange
        var clubId = 1;
        _tierGateServiceMock
            .Setup(s => s.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ValidateUnlimitedAccess(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var hasUnlimitedAccessProperty = value!.GetType().GetProperty("hasUnlimitedAccess");
        hasUnlimitedAccessProperty.Should().NotBeNull();
        hasUnlimitedAccessProperty!.GetValue(value).Should().Be(true);
    }

    [Test]
    public async Task ValidateUnlimitedAccess_NoUnlimitedAccess_ReturnsOkWithFalse()
    {
        // Arrange
        var clubId = 1;
        _tierGateServiceMock
            .Setup(s => s.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ValidateUnlimitedAccess(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var hasUnlimitedAccessProperty = value!.GetType().GetProperty("hasUnlimitedAccess");
        hasUnlimitedAccessProperty!.GetValue(value).Should().Be(false);
    }

    [Test]
    public async Task ValidateUnlimitedAccess_NoClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        SetupUnauthenticatedUser();

        // Act
        var result = await _controller.ValidateUnlimitedAccess(clubId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task ValidateUnlimitedAccess_DifferentClubId_ReturnsForbid()
    {
        // Arrange
        var clubId = 2;
        SetupAuthenticatedUser(clubId: 1);

        // Act
        var result = await _controller.ValidateUnlimitedAccess(clubId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task ValidateUnlimitedAccess_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        _tierGateServiceMock
            .Setup(s => s.ValidateUnlimitedAccessAsync(clubId))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.ValidateUnlimitedAccess(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
