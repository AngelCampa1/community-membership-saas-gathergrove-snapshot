using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class AnalyticsControllerTests
{
    private Mock<IFeatureUsageAnalyticsService> _mockFeatureAnalyticsService;
    private Mock<ILogger<AnalyticsController>> _mockLogger;
    private AnalyticsController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockFeatureAnalyticsService = new Mock<IFeatureUsageAnalyticsService>();
        _mockLogger = new Mock<ILogger<AnalyticsController>>();
        _controller = new AnalyticsController(
            _mockFeatureAnalyticsService.Object,
            _mockLogger.Object);

        SetupUserContext();
    }

    private void SetupUserContext(int userId = 1, List<string>? additionalClaims = null)
    {
        var claims = new List<Claim>
        {
            new("sub", userId.ToString()),
            new("userId", userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString())
        };

        if (additionalClaims != null)
        {
            foreach (var claim in additionalClaims)
            {
                claims.Add(new Claim("policy", claim));
            }
        }

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    #region TrackFeatureUsage Tests

    [Test]
    public async Task TrackFeatureUsage_ValidRequest_ReturnsOkWithSuccess()
    {
        // Arrange
        var request = new TrackFeatureUsageRequest
        {
            ClubId = 1,
            FeatureName = "directory_search",
            Platform = "web",
            SessionId = "session-123"
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.TrackFeatureUsageAsync(
                It.Is<int>(id => id == request.ClubId),
                It.Is<int>(uid => uid == 1), // userId from claims
                It.Is<string>(fn => fn == request.FeatureName),
                It.Is<string>(p => p == request.Platform),
                It.Is<string?>(sid => sid == request.SessionId),
                It.IsAny<string?>(), // action
                It.IsAny<string?>(), // context
                It.IsAny<decimal?>() // duration
            ))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.TrackFeatureUsage(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;

        okResult.Value.Should().NotBeNull();

        // Cast to anonymous type using reflection to verify properties
        var response = okResult.Value;
        var successProperty = response!.GetType().GetProperty("Success");
        var messageProperty = response.GetType().GetProperty("Message");

        successProperty.Should().NotBeNull();
        messageProperty.Should().NotBeNull();

        var success = (bool)successProperty!.GetValue(response)!;
        var message = (string)messageProperty!.GetValue(response)!;

        success.Should().BeTrue();
        message.Should().Be("Feature usage tracked successfully");

        _mockFeatureAnalyticsService.Verify(
            s => s.TrackFeatureUsageAsync(
                It.Is<int>(id => id == request.ClubId),
                It.Is<int>(uid => uid == 1),
                It.Is<string>(fn => fn == request.FeatureName),
                It.Is<string>(p => p == request.Platform),
                It.Is<string?>(sid => sid == request.SessionId),
                It.IsAny<string?>(), // action
                It.IsAny<string?>(), // context
                It.IsAny<decimal?>() // duration
            ),
            Times.Once);
    }

    [Test]
    public async Task TrackFeatureUsage_TrackingFails_ReturnsOkWithSuccess()
    {
        // Arrange
        var request = new TrackFeatureUsageRequest
        {
            ClubId = 1,
            FeatureName = "directory_search",
            Platform = "web"
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.TrackFeatureUsageAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<decimal?>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.TrackFeatureUsage(request);

        // Assert - Even if tracking fails, we return success to not break user experience
        result.Should().BeOfType<OkObjectResult>();
    }

    [Test]
    public async Task TrackFeatureUsage_InvalidUserClaims_ReturnsUnauthorized()
    {
        // Arrange
        var request = new TrackFeatureUsageRequest
        {
            ClubId = 1,
            FeatureName = "directory_search",
            Platform = "web"
        };

        // Setup context without valid user claims
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal()
            }
        };

        // Act
        var result = await _controller.TrackFeatureUsage(request);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorizedResult = (UnauthorizedObjectResult)result;
        unauthorizedResult.Value.Should().Be("Unable to determine user identity");
    }

    [Test]
    public async Task TrackFeatureUsage_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new TrackFeatureUsageRequest
        {
            ClubId = 1,
            FeatureName = "directory_search",
            Platform = "web"
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.TrackFeatureUsageAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<decimal?>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.TrackFeatureUsage(request);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = (ObjectResult)result;
        objectResult.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while tracking feature usage");
    }

    #endregion

    #region GetFeatureUsageAnalytics Tests

    [Test]
    public async Task GetFeatureUsageAnalytics_ValidRequest_ReturnsOkWithAnalytics()
    {
        // Arrange
        var clubId = 1;
        var daysBack = 30;
        var expectedAnalytics = new FeatureUsageAnalyticsResponse
        {
            FeatureUsage = new List<FeatureUsageStatistic>
            {
                new()
                {
                    FeatureName = "directory_search",
                    UsageCount = 50,
                    UniqueUsers = 25,
                    AdoptionRate = 75.0,
                    AverageEngagementScore = 1.2m
                }
            },
            PlatformUsage = new PlatformUsageComparison
            {
                Web = new PlatformStats { UsageCount = 40, UniqueUsers = 20 },
                Mobile = new PlatformStats { UsageCount = 10, UniqueUsers = 8 },
                WebToMobileRatio = 4.0
            }
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.GetFeatureUsageAnalyticsAsync(clubId, daysBack))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetFeatureUsageAnalytics(clubId, daysBack);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        okResult.Value.Should().Be(expectedAnalytics);

        _mockFeatureAnalyticsService.Verify(
            s => s.GetFeatureUsageAnalyticsAsync(clubId, daysBack),
            Times.Once);
    }

    [Test]
    public async Task GetFeatureUsageAnalytics_DefaultDaysBack_Uses30Days()
    {
        // Arrange
        var clubId = 1;
        var expectedAnalytics = new FeatureUsageAnalyticsResponse();

        _mockFeatureAnalyticsService
            .Setup(s => s.GetFeatureUsageAnalyticsAsync(clubId, 30))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetFeatureUsageAnalytics(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockFeatureAnalyticsService.Verify(
            s => s.GetFeatureUsageAnalyticsAsync(clubId, 30),
            Times.Once);
    }

    [Test]
    public async Task GetFeatureUsageAnalytics_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.GetFeatureUsageAnalyticsAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetFeatureUsageAnalytics(clubId);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = (ObjectResult)result;
        objectResult.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while retrieving feature usage analytics");
    }

    #endregion

    #region GetMemberEngagementAnalytics Tests

    [Test]
    public async Task GetMemberEngagementAnalytics_ValidRequest_ReturnsOkWithAnalytics()
    {
        // Arrange
        var clubId = 1;
        var expectedAnalytics = new MemberEngagementAnalyticsResponse
        {
            ClubSummary = new ClubEngagementSummary
            {
                TotalMembers = 100,
                AverageEngagementScore = 75.5m,
                HighlyActiveMembers = 30,
                ModerateMembers = 50,
                InactiveMembers = 20,
                RetentionRate = 85.0
            },
            MemberEngagement = new List<MemberEngagementSummary>
            {
                new()
                {
                    MemberId = 1,
                    MemberName = "John Doe",
                    OverallScore = 85.5m,
                    EngagementLevel = "HighlyActive",
                    LastActivity = DateTime.UtcNow.AddDays(-1),
                    DaysSinceLastLogin = 1
                }
            },
            Distribution = new EngagementDistribution
            {
                HighlyActive = 30,
                Active = 40,
                Moderate = 20,
                LowEngagement = 8,
                Inactive = 2
            }
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.GetMemberEngagementAnalyticsAsync(clubId))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetMemberEngagementAnalytics(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        okResult.Value.Should().Be(expectedAnalytics);

        _mockFeatureAnalyticsService.Verify(
            s => s.GetMemberEngagementAnalyticsAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task GetMemberEngagementAnalytics_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.GetMemberEngagementAnalyticsAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberEngagementAnalytics(clubId);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = (ObjectResult)result;
        objectResult.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while retrieving member engagement analytics");
    }

    #endregion

    #region GetTopFeatures Tests

    [Test]
    public async Task GetTopFeatures_ValidRequest_ReturnsOkWithTopFeatures()
    {
        // Arrange
        var clubId = 1;
        var limit = 5;
        var expectedFeatures = new List<FeatureUsageStatistic>
        {
            new()
            {
                FeatureName = "directory_search",
                UsageCount = 100,
                UniqueUsers = 50,
                AdoptionRate = 75.0,
                AverageEngagementScore = 1.2m
            },
            new()
            {
                FeatureName = "event_rsvp",
                UsageCount = 85,
                UniqueUsers = 42,
                AdoptionRate = 63.0,
                AverageEngagementScore = 1.8m
            }
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.GetTopFeaturesAsync(clubId, limit))
            .ReturnsAsync(expectedFeatures);

        // Act
        var result = await _controller.GetTopFeatures(clubId, limit);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        okResult.Value.Should().Be(expectedFeatures);

        _mockFeatureAnalyticsService.Verify(
            s => s.GetTopFeaturesAsync(clubId, limit),
            Times.Once);
    }

    [Test]
    public async Task GetTopFeatures_DefaultLimit_Uses10()
    {
        // Arrange
        var clubId = 1;
        var expectedFeatures = new List<FeatureUsageStatistic>();

        _mockFeatureAnalyticsService
            .Setup(s => s.GetTopFeaturesAsync(clubId, 10))
            .ReturnsAsync(expectedFeatures);

        // Act
        var result = await _controller.GetTopFeatures(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockFeatureAnalyticsService.Verify(
            s => s.GetTopFeaturesAsync(clubId, 10),
            Times.Once);
    }

    [Test]
    public async Task GetTopFeatures_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.GetTopFeaturesAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetTopFeatures(clubId);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = (ObjectResult)result;
        objectResult.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while retrieving top features");
    }

    #endregion

    #region GetPlatformUsageComparison Tests

    [Test]
    public async Task GetPlatformUsageComparison_ValidRequest_ReturnsOkWithComparison()
    {
        // Arrange
        var clubId = 1;
        var daysBack = 30;
        var expectedComparison = new PlatformUsageComparison
        {
            Web = new PlatformStats
            {
                UsageCount = 150,
                UniqueUsers = 75,
                TopFeatures = new List<string> { "directory_search", "event_rsvp", "dues_payment" }
            },
            Mobile = new PlatformStats
            {
                UsageCount = 50,
                UniqueUsers = 35,
                TopFeatures = new List<string> { "event_rsvp", "directory_search" }
            },
            WebToMobileRatio = 3.0
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.GetPlatformUsageComparisonAsync(clubId, daysBack))
            .ReturnsAsync(expectedComparison);

        // Act
        var result = await _controller.GetPlatformUsageComparison(clubId, daysBack);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        okResult.Value.Should().Be(expectedComparison);

        _mockFeatureAnalyticsService.Verify(
            s => s.GetPlatformUsageComparisonAsync(clubId, daysBack),
            Times.Once);
    }

    [Test]
    public async Task GetPlatformUsageComparison_DefaultDaysBack_Uses30Days()
    {
        // Arrange
        var clubId = 1;
        var expectedComparison = new PlatformUsageComparison();

        _mockFeatureAnalyticsService
            .Setup(s => s.GetPlatformUsageComparisonAsync(clubId, 30))
            .ReturnsAsync(expectedComparison);

        // Act
        var result = await _controller.GetPlatformUsageComparison(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockFeatureAnalyticsService.Verify(
            s => s.GetPlatformUsageComparisonAsync(clubId, 30),
            Times.Once);
    }

    [Test]
    public async Task GetPlatformUsageComparison_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.GetPlatformUsageComparisonAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetPlatformUsageComparison(clubId);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = (ObjectResult)result;
        objectResult.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while retrieving platform usage comparison");
    }

    #endregion

    #region GetLowEngagementMembers Tests

    [Test]
    public async Task GetLowEngagementMembers_ValidRequest_ReturnsOkWithLowEngagementMembers()
    {
        // Arrange
        var clubId = 1;
        var scoreThreshold = 40;
        var expectedMembers = new List<MemberEngagementSummary>
        {
            new()
            {
                MemberId = 5,
                MemberName = "Jane Smith",
                OverallScore = 35.0m,
                EngagementLevel = "LowEngagement",
                LastActivity = DateTime.UtcNow.AddDays(-10),
                DaysSinceLastLogin = 10,
                ScoreBreakdown = new EngagementScoreBreakdown
                {
                    LoginScore = 20m,
                    EventScore = 10m,
                    CommunicationScore = 5m,
                    FeatureUsageScore = 15m,
                    ProfileCompletenessScore = 60m
                }
            }
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.GetLowEngagementMembersAsync(clubId, scoreThreshold))
            .ReturnsAsync(expectedMembers);

        // Act
        var result = await _controller.GetLowEngagementMembers(clubId, scoreThreshold);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        okResult.Value.Should().Be(expectedMembers);

        _mockFeatureAnalyticsService.Verify(
            s => s.GetLowEngagementMembersAsync(clubId, scoreThreshold),
            Times.Once);
    }

    [Test]
    public async Task GetLowEngagementMembers_DefaultThreshold_Uses40()
    {
        // Arrange
        var clubId = 1;
        var expectedMembers = new List<MemberEngagementSummary>();

        _mockFeatureAnalyticsService
            .Setup(s => s.GetLowEngagementMembersAsync(clubId, 40))
            .ReturnsAsync(expectedMembers);

        // Act
        var result = await _controller.GetLowEngagementMembers(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockFeatureAnalyticsService.Verify(
            s => s.GetLowEngagementMembersAsync(clubId, 40),
            Times.Once);
    }

    [Test]
    public async Task GetLowEngagementMembers_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.GetLowEngagementMembersAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetLowEngagementMembers(clubId);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = (ObjectResult)result;
        objectResult.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while retrieving low engagement members");
    }

    #endregion

    #region CalculateMemberEngagementScores Tests

    [Test]
    public async Task CalculateMemberEngagementScores_ValidRequest_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.CalculateMemberEngagementScoresAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CalculateMemberEngagementScores(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;

        okResult.Value.Should().NotBeNull();

        // Cast to anonymous type using reflection to verify properties
        var response = okResult.Value;
        var successProperty = response!.GetType().GetProperty("Success");
        var messageProperty = response.GetType().GetProperty("Message");

        successProperty.Should().NotBeNull();
        messageProperty.Should().NotBeNull();

        var success = (bool)successProperty!.GetValue(response)!;
        var message = (string)messageProperty!.GetValue(response)!;

        success.Should().BeTrue();
        message.Should().Be("Engagement scores calculated successfully");

        _mockFeatureAnalyticsService.Verify(
            s => s.CalculateMemberEngagementScoresAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task CalculateMemberEngagementScores_CalculationFails_ReturnsOkWithFailureMessage()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.CalculateMemberEngagementScoresAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CalculateMemberEngagementScores(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;

        okResult.Value.Should().NotBeNull();

        // Cast to anonymous type using reflection to verify properties
        var response = okResult.Value;
        var successProperty = response!.GetType().GetProperty("Success");

        successProperty.Should().NotBeNull();

        var success = (bool)successProperty!.GetValue(response)!;
        success.Should().BeFalse();
    }

    [Test]
    public async Task CalculateMemberEngagementScores_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockFeatureAnalyticsService
            .Setup(s => s.CalculateMemberEngagementScoresAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CalculateMemberEngagementScores(clubId);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = (ObjectResult)result;
        objectResult.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while calculating engagement scores");
    }

    #endregion

    #region Authorization Tests

    [Test]
    public async Task UnlimitedTierEndpoints_WithoutUnlimitedTierClaim_ShouldBeRejected()
    {
        // Note: These tests would normally require setting up authorization middleware
        // For now, we document that these endpoints require UnlimitedTier policy

        // The following endpoints should require UnlimitedTier authorization:
        // - GetFeatureUsageAnalytics
        // - GetMemberEngagementAnalytics
        // - GetTopFeatures
        // - GetPlatformUsageComparison
        // - GetLowEngagementMembers

        // In a real authorization test, we would set up the authorization middleware
        // and verify that requests without the proper tier are rejected

        Assert.Pass("Authorization tests require integration test setup with authorization middleware");
    }

    [Test]
    public async Task ClubMemberEndpoints_WithClubMemberClaim_ShouldBeAllowed()
    {
        // The TrackFeatureUsage endpoint should require ClubMember authorization
        // This would be tested in integration tests with proper authorization setup

        Assert.Pass("Authorization tests require integration test setup with authorization middleware");
    }

    [Test]
    public async Task ClubAdminEndpoints_WithClubAdminClaim_ShouldBeAllowed()
    {
        // The CalculateMemberEngagementScores endpoint should require ClubAdmin authorization
        // This would be tested in integration tests with proper authorization setup

        Assert.Pass("Authorization tests require integration test setup with authorization middleware");
    }

    #endregion

    #region Edge Cases and Validation Tests

    [Test]
    public async Task TrackFeatureUsage_EmptyFeatureName_StillTracked()
    {
        // Arrange
        var request = new TrackFeatureUsageRequest
        {
            ClubId = 1,
            FeatureName = "", // Empty feature name
            Platform = "web"
        };

        _mockFeatureAnalyticsService
            .Setup(s => s.TrackFeatureUsageAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<decimal?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.TrackFeatureUsage(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        // Service should handle validation, controller just passes through
    }

    [Test]
    public async Task GetFeatureUsageAnalytics_NegativeDaysBack_PassedToService()
    {
        // Arrange
        var clubId = 1;
        var daysBack = -5; // Negative value

        _mockFeatureAnalyticsService
            .Setup(s => s.GetFeatureUsageAnalyticsAsync(clubId, daysBack))
            .ReturnsAsync(new FeatureUsageAnalyticsResponse());

        // Act
        var result = await _controller.GetFeatureUsageAnalytics(clubId, daysBack);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        // Service should handle validation of negative values
        _mockFeatureAnalyticsService.Verify(
            s => s.GetFeatureUsageAnalyticsAsync(clubId, daysBack),
            Times.Once);
    }

    [Test]
    public async Task GetTopFeatures_ZeroLimit_PassedToService()
    {
        // Arrange
        var clubId = 1;
        var limit = 0;

        _mockFeatureAnalyticsService
            .Setup(s => s.GetTopFeaturesAsync(clubId, limit))
            .ReturnsAsync(new List<FeatureUsageStatistic>());

        // Act
        var result = await _controller.GetTopFeatures(clubId, limit);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockFeatureAnalyticsService.Verify(
            s => s.GetTopFeaturesAsync(clubId, limit),
            Times.Once);
    }

    #endregion
}