using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using static GatherGrove.Application.Services.Interfaces.IMemberEngagementService;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MemberEngagementControllerTests
{
    private Mock<IMemberEngagementService> _mockEngagementService;
    private Mock<IClubAuthorizationService> _mockClubAuthService;
    private Mock<ILogger<MemberEngagementController>> _mockLogger;
    private MemberEngagementController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockEngagementService = new Mock<IMemberEngagementService>();
        _mockClubAuthService = new Mock<IClubAuthorizationService>();
        _mockLogger = new Mock<ILogger<MemberEngagementController>>();
        _controller = new MemberEngagementController(
            _mockEngagementService.Object,
            _mockClubAuthService.Object,
            _mockLogger.Object);

        // Set up a mock user context with claims for authorization
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("sub", "1"),
            new("userId", "1")
        };
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

    #region CalculateEngagementScore Tests

    [Test]
    public async Task CalculateEngagementScore_ValidRequest_ReturnsOkWithScore()
    {
        // Arrange
        var memberId = 1;
        var forceRecalculation = true;
        var expectedScore = new MemberEngagementScore
        {
            MemberId = memberId,
            OverallScore = 85m,
            EngagementLevel = "High",
            CalculatedDate = DateTime.UtcNow
        };

        _mockEngagementService
            .Setup(s => s.CalculateEngagementScore(memberId, forceRecalculation))
            .ReturnsAsync(expectedScore);

        // Act
        var result = await _controller.CalculateEngagementScore(memberId, forceRecalculation);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedScore));
        _mockEngagementService.Verify(s => s.CalculateEngagementScore(memberId, forceRecalculation), Times.Once);
    }

    [Test]
    public async Task CalculateEngagementScore_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var memberId = 1;

        _mockEngagementService
            .Setup(s => s.CalculateEngagementScore(memberId, false))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CalculateEngagementScore(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task CalculateEngagementScore_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var memberId = 999;

        _mockEngagementService
            .Setup(s => s.CalculateEngagementScore(memberId, false))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.CalculateEngagementScore(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    #endregion

    #region GetMemberEngagementScore Tests

    [Test]
    public async Task GetMemberEngagementScore_ValidMemberId_ReturnsOkWithScore()
    {
        // Arrange
        var memberId = 1;
        var expectedScore = new MemberEngagementScore
        {
            MemberId = memberId,
            OverallScore = 85m,
            EngagementLevel = "High",
            CalculatedDate = DateTime.UtcNow
        };

        // Mock authorization check to allow access
        _mockClubAuthService
            .Setup(s => s.CanAccessMemberDataAsync(memberId, 1))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetMemberEngagementScore(memberId))
            .ReturnsAsync(expectedScore);

        // Act
        var result = await _controller.GetMemberEngagementScore(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedScore));
    }

    [Test]
    public async Task GetMemberEngagementScore_NonExistentMember_ReturnsNotFound()
    {
        // Arrange
        var memberId = 999;

        // Mock authorization check to allow access
        _mockClubAuthService
            .Setup(s => s.CanAccessMemberDataAsync(memberId, 1))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetMemberEngagementScore(memberId))
            .ReturnsAsync((MemberEngagementScore)null);

        // Act
        var result = await _controller.GetMemberEngagementScore(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetMemberEngagementScore_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var memberId = 1;

        // Mock authorization check to deny access
        _mockClubAuthService
            .Setup(s => s.CanAccessMemberDataAsync(memberId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetMemberEngagementScore(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetMemberEngagementScore_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        var memberId = 1;

        // Setup controller with invalid user claims
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid-id")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.GetMemberEngagementScore(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task GetMemberEngagementScore_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var memberId = 1;

        _mockClubAuthService
            .Setup(s => s.CanAccessMemberDataAsync(memberId, 1))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetMemberEngagementScore(memberId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberEngagementScore(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetClubEngagementScores Tests

    [Test]
    public async Task GetClubEngagementScores_ValidClubId_ReturnsOkWithScores()
    {
        // Arrange
        var clubId = 1;
        var expectedScores = new List<MemberEngagementScore>
        {
            new() { MemberId = 1, OverallScore = 85m, EngagementLevel = "High" },
            new() { MemberId = 2, OverallScore = 65m, EngagementLevel = "Medium" }
        };

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetEngagementScores(clubId, null))
            .ReturnsAsync(expectedScores);

        // Act
        var result = await _controller.GetClubEngagementScores(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedScores));
    }

    [Test]
    public async Task GetClubEngagementScores_NoTierAccess_ReturnsForbidden()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetClubEngagementScores(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(403));
    }

    [Test]
    public async Task GetClubEngagementScores_WithLevelFilter_ReturnsFilteredScores()
    {
        // Arrange
        var clubId = 1;
        var level = "High";
        var expectedScores = new List<MemberEngagementScore>
        {
            new() { MemberId = 1, OverallScore = 85m, EngagementLevel = "High" }
        };

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetEngagementScores(clubId, EngagementLevel.High))
            .ReturnsAsync(expectedScores);

        // Act
        var result = await _controller.GetClubEngagementScores(clubId, level);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task GetClubEngagementScores_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetEngagementScores(clubId, null))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetClubEngagementScores(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetAtRiskMembers Tests

    [Test]
    public async Task GetAtRiskMembers_ValidRequest_ReturnsOkWithAtRiskMembers()
    {
        // Arrange
        var clubId = 1;
        var threshold = 40m;
        var expectedAtRiskMembers = new List<MemberEngagementScore>
        {
            new() { MemberId = 3, OverallScore = 30m, EngagementLevel = "Low" }
        };

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetAtRiskMembers(clubId, threshold))
            .ReturnsAsync(expectedAtRiskMembers);

        // Act
        var result = await _controller.GetAtRiskMembers(clubId, threshold);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedAtRiskMembers));
    }

    [Test]
    public async Task GetAtRiskMembers_NoTierAccess_ReturnsForbidden()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetAtRiskMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(403));
    }

    [Test]
    public async Task GetAtRiskMembers_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetAtRiskMembers(clubId, 40m))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetAtRiskMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEngagementHistory Tests

    [Test]
    public async Task GetEngagementHistory_ValidRequest_ReturnsOkWithHistory()
    {
        // Arrange
        var memberId = 1;
        var daysBack = 90;
        var expectedHistory = new List<MemberEngagementHistory>
        {
            new() { MemberId = memberId, RecordedAt = DateTime.UtcNow.AddDays(-1), OverallScore = 85m },
            new() { MemberId = memberId, RecordedAt = DateTime.UtcNow.AddDays(-7), OverallScore = 82m }
        };

        _mockEngagementService
            .Setup(s => s.GetEngagementHistory(memberId, daysBack))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetEngagementHistory(memberId, daysBack);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedHistory));
    }

    [Test]
    public async Task GetEngagementHistory_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var memberId = 1;

        _mockEngagementService
            .Setup(s => s.GetEngagementHistory(memberId, 90))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEngagementHistory(memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateEngagementOnActivity Tests

    [Test]
    public async Task UpdateEngagementOnActivity_ValidRequest_ReturnsOkWithUpdatedScore()
    {
        // Arrange
        var memberId = 1;
        var request = new UpdateEngagementRequest
        {
            ActivityType = "event_attendance",
            Metadata = new { EventId = 5 }
        };
        var expectedScore = new MemberEngagementScore
        {
            MemberId = memberId,
            OverallScore = 88m,
            EngagementLevel = "High"
        };

        _mockEngagementService
            .Setup(s => s.UpdateEngagementOnActivity(memberId, request.ActivityType, request.Metadata))
            .ReturnsAsync(expectedScore);

        // Act
        var result = await _controller.UpdateEngagementOnActivity(memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedScore));
    }

    [Test]
    public async Task UpdateEngagementOnActivity_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var memberId = 999;
        var request = new UpdateEngagementRequest { ActivityType = "login" };

        _mockEngagementService
            .Setup(s => s.UpdateEngagementOnActivity(memberId, request.ActivityType, request.Metadata))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.UpdateEngagementOnActivity(memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task UpdateEngagementOnActivity_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var memberId = 1;
        var request = new UpdateEngagementRequest { ActivityType = "login" };

        _mockEngagementService
            .Setup(s => s.UpdateEngagementOnActivity(memberId, request.ActivityType, request.Metadata))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateEngagementOnActivity(memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region ProcessEngagementAlerts Tests

    [Test]
    public async Task ProcessEngagementAlerts_ValidRequest_ReturnsOkWithAlerts()
    {
        // Arrange
        var clubId = 1;
        var expectedAlerts = new List<MemberEngagementAlert>
        {
            new() { Id = 1, MemberId = 3, Type = AlertType.AtRisk, Severity = AlertSeverity.Medium }
        };

        _mockEngagementService
            .Setup(s => s.ProcessEngagementAlerts(clubId))
            .ReturnsAsync(expectedAlerts);

        // Act
        var result = await _controller.ProcessEngagementAlerts(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var responseValue = okResult.Value;
        Assert.That(responseValue, Is.Not.Null);
    }

    #endregion

    #region GetEngagementAlerts Tests

    [Test]
    public async Task GetEngagementAlerts_ValidRequest_ReturnsOkWithAlerts()
    {
        // Arrange
        var clubId = 1;
        var expectedAlerts = new List<MemberEngagementAlert>
        {
            new() { Id = 1, MemberId = 3, Type = AlertType.AtRisk, Severity = AlertSeverity.High },
            new() { Id = 2, MemberId = 5, Type = AlertType.InactivityWarning, Severity = AlertSeverity.Medium }
        };

        _mockEngagementService
            .Setup(s => s.GetEngagementAlerts(clubId, null))
            .ReturnsAsync(expectedAlerts);

        // Act
        var result = await _controller.GetEngagementAlerts(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedAlerts));
    }

    [Test]
    public async Task GetEngagementAlerts_WithSeverityFilter_ReturnsFilteredAlerts()
    {
        // Arrange
        var clubId = 1;
        var severity = "High";
        var expectedAlerts = new List<MemberEngagementAlert>
        {
            new() { Id = 1, MemberId = 3, Type = AlertType.AtRisk, Severity = AlertSeverity.High }
        };

        _mockEngagementService
            .Setup(s => s.GetEngagementAlerts(clubId, AlertSeverity.High))
            .ReturnsAsync(expectedAlerts);

        // Act
        var result = await _controller.GetEngagementAlerts(clubId, severity);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedAlerts));
    }

    [Test]
    public async Task GetEngagementAlerts_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockEngagementService
            .Setup(s => s.GetEngagementAlerts(clubId, null))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEngagementAlerts(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region ResolveAlert Tests

    [Test]
    public async Task ResolveAlert_ValidRequest_ReturnsOkWithResolvedAlert()
    {
        // Arrange
        var alertId = 1;
        var request = new ResolveAlertRequest { ResolutionNotes = "Contacted member, issue resolved" };
        var expectedAlert = new MemberEngagementAlert
        {
            Id = alertId,
            MemberId = 3,
            Type = AlertType.AtRisk,
            Severity = AlertSeverity.High,
            IsResolved = true,
            ResolvedByUserId = 1,
            ResolutionNotes = request.ResolutionNotes
        };

        _mockEngagementService
            .Setup(s => s.ResolveAlert(alertId, 1, request.ResolutionNotes))
            .ReturnsAsync(expectedAlert);

        // Act
        var result = await _controller.ResolveAlert(alertId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedAlert));
    }

    [Test]
    public async Task ResolveAlert_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        var alertId = 1;
        var request = new ResolveAlertRequest { ResolutionNotes = "Test" };

        // Setup controller with invalid user claims
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid-id")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.ResolveAlert(alertId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task ResolveAlert_AlertNotFound_ReturnsNotFound()
    {
        // Arrange
        var alertId = 999;
        var request = new ResolveAlertRequest { ResolutionNotes = "Test" };

        _mockEngagementService
            .Setup(s => s.ResolveAlert(alertId, 1, request.ResolutionNotes))
            .ThrowsAsync(new ArgumentException("Alert not found"));

        // Act
        var result = await _controller.ResolveAlert(alertId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task ResolveAlert_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var alertId = 1;
        var request = new ResolveAlertRequest { ResolutionNotes = "Test" };

        _mockEngagementService
            .Setup(s => s.ResolveAlert(alertId, 1, request.ResolutionNotes))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ResolveAlert(alertId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEngagementTrends Tests

    [Test]
    public async Task GetEngagementTrends_ValidRequest_ReturnsOkWithTrends()
    {
        // Arrange
        var clubId = 1;
        var daysBack = 30;
        var expectedTrends = new EngagementTrends
        {
            TotalMembers = 100,
            AverageScore = 75.5m,
            ScoreChange = 5.5m,
            AtRiskMembers = 10,
            NewlyAtRisk = 3,
            ImprovedMembers = 8
        };

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetEngagementTrends(clubId, daysBack))
            .ReturnsAsync(expectedTrends);

        // Act
        var result = await _controller.GetEngagementTrends(clubId, daysBack);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedTrends));
    }

    [Test]
    public async Task GetEngagementTrends_NoTierAccess_ReturnsForbidden()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEngagementTrends(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(403));
    }

    [Test]
    public async Task GetEngagementTrends_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetEngagementTrends(clubId, 30))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEngagementTrends(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region RecalculateClubEngagementScores Tests

    [Test]
    public async Task RecalculateClubEngagementScores_ValidRequest_ReturnsOkWithCount()
    {
        // Arrange
        var clubId = 1;
        var expectedCount = 42;

        _mockEngagementService
            .Setup(s => s.RecalculateClubEngagementScores(clubId))
            .ReturnsAsync(expectedCount);

        // Act
        var result = await _controller.RecalculateClubEngagementScores(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.Not.Null);

        // Verify the response contains RecalculatedCount
        var responseType = okResult.Value!.GetType();
        var countProperty = responseType.GetProperty("RecalculatedCount");
        Assert.That(countProperty, Is.Not.Null);
        Assert.That(countProperty!.GetValue(okResult.Value), Is.EqualTo(expectedCount));
    }

    [Test]
    public async Task RecalculateClubEngagementScores_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockEngagementService
            .Setup(s => s.RecalculateClubEngagementScores(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RecalculateClubEngagementScores(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEngagementOverview Tests

    [Test]
    public async Task GetEngagementOverview_ValidClubId_ReturnsOkWithOverview()
    {
        // Arrange
        var clubId = 1;
        var expectedOverview = new EngagementOverview
        {
            TotalMembers = 50,
            AverageScore = 75m,
            HighlyEngaged = 15,
            ModeratelyEngaged = 25,
            AtRisk = 10
        };

        _mockClubAuthService
            .Setup(s => s.HasFeatureAccess(clubId, "memberengagement"))
            .ReturnsAsync(true);

        _mockEngagementService
            .Setup(s => s.GetEngagementOverview(clubId))
            .ReturnsAsync(expectedOverview);

        // Act
        var result = await _controller.GetEngagementOverview(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedOverview));
    }

    #endregion
}