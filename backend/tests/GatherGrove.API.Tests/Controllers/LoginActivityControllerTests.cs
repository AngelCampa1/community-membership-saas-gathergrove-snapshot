using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class LoginActivityControllerTests
{
    private Mock<ILoginActivityService> _loginActivityServiceMock = null!;
    private Mock<ILogger<LoginActivityController>> _loggerMock = null!;
    private LoginActivityController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _loginActivityServiceMock = new Mock<ILoginActivityService>();
        _loggerMock = new Mock<ILogger<LoginActivityController>>();

        _controller = new LoginActivityController(
            _loginActivityServiceMock.Object,
            _loggerMock.Object);

        // Setup HTTP context with claims
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "Admin"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetLoginStats Tests

    [Test]
    public async Task GetLoginStats_ValidRequest_ReturnsOkWithStats()
    {
        // Arrange
        var clubId = 1;
        var days = 30;
        var stats = new LoginActivityStatsDto
        {
            ClubId = clubId,
            PeriodDays = days,
            TotalMembers = 100,
            MembersWithLogins = 80,
            TotalLogins = 500,
            AverageLoginsPerMember = 5.0m,
            DailyActiveUsers = 20,
            WeeklyActiveUsers = 50,
            MonthlyActiveUsers = 80,
            InactiveMembers = 20,
            LoginTrends = new List<LoginTrendDto>
            {
                new()
                {
                    Date = DateTime.UtcNow.Date,
                    TotalLogins = 25,
                    UniqueUsers = 15,
                    WebLogins = 15,
                    MobileLogins = 10
                }
            }
        };

        _loginActivityServiceMock
            .Setup(s => s.GetClubLoginStatsAsync(clubId, days))
            .ReturnsAsync(stats);

        // Act
        var result = await _controller.GetLoginStats(clubId, days);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedStats = okResult.Value as LoginActivityStatsDto;
        returnedStats.Should().NotBeNull();
        returnedStats!.ClubId.Should().Be(clubId);
        returnedStats.TotalMembers.Should().Be(100);
        returnedStats.MembersWithLogins.Should().Be(80);
        returnedStats.LoginTrends.Should().HaveCount(1);
    }

    [Test]
    public async Task GetLoginStats_WithDefaultDays_Uses30Days()
    {
        // Arrange
        var clubId = 1;
        var stats = new LoginActivityStatsDto
        {
            ClubId = clubId,
            PeriodDays = 30,
            TotalMembers = 50,
            MembersWithLogins = 40,
            TotalLogins = 200
        };

        _loginActivityServiceMock
            .Setup(s => s.GetClubLoginStatsAsync(clubId, 30))
            .ReturnsAsync(stats);

        // Act
        var result = await _controller.GetLoginStats(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedStats = okResult!.Value as LoginActivityStatsDto;
        returnedStats!.PeriodDays.Should().Be(30);
    }

    [Test]
    public async Task GetLoginStats_WithCustomDays_UsesProvidedValue()
    {
        // Arrange
        var clubId = 1;
        var days = 90;
        var stats = new LoginActivityStatsDto
        {
            ClubId = clubId,
            PeriodDays = days,
            TotalMembers = 100,
            MembersWithLogins = 85,
            TotalLogins = 800
        };

        _loginActivityServiceMock
            .Setup(s => s.GetClubLoginStatsAsync(clubId, days))
            .ReturnsAsync(stats);

        // Act
        var result = await _controller.GetLoginStats(clubId, days);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedStats = okResult!.Value as LoginActivityStatsDto;
        returnedStats!.PeriodDays.Should().Be(90);
    }

    [Test]
    public async Task GetLoginStats_WhenServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.GetClubLoginStatsAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetLoginStats(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    [Test]
    public async Task GetLoginStats_WithNoActivity_ReturnsEmptyStats()
    {
        // Arrange
        var clubId = 1;
        var stats = new LoginActivityStatsDto
        {
            ClubId = clubId,
            PeriodDays = 30,
            TotalMembers = 50,
            MembersWithLogins = 0,
            TotalLogins = 0,
            AverageLoginsPerMember = 0,
            DailyActiveUsers = 0,
            WeeklyActiveUsers = 0,
            MonthlyActiveUsers = 0,
            InactiveMembers = 50,
            LoginTrends = new List<LoginTrendDto>()
        };

        _loginActivityServiceMock
            .Setup(s => s.GetClubLoginStatsAsync(clubId, 30))
            .ReturnsAsync(stats);

        // Act
        var result = await _controller.GetLoginStats(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedStats = okResult!.Value as LoginActivityStatsDto;
        returnedStats!.TotalLogins.Should().Be(0);
        returnedStats.InactiveMembers.Should().Be(50);
    }

    #endregion

    #region GetMemberLoginActivity Tests

    [Test]
    public async Task GetMemberLoginActivity_ValidRequest_ReturnsOkWithActivity()
    {
        // Arrange
        var clubId = 1;
        var days = 30;
        var activities = new List<MemberLoginActivityDto>
        {
            new()
            {
                MemberId = 1,
                MemberName = "John Doe",
                Email = "john@example.com",
                LastLoginDate = DateTime.UtcNow.AddDays(-2),
                LoginCount = 15,
                DaysSinceLastLogin = 2,
                ActivityLevel = "High",
                IsAtRisk = false,
                LoginFrequency = "Daily",
                PlatformsUsed = new List<string> { "Web", "Mobile" }
            },
            new()
            {
                MemberId = 2,
                MemberName = "Jane Smith",
                Email = "jane@example.com",
                LastLoginDate = DateTime.UtcNow.AddDays(-20),
                LoginCount = 3,
                DaysSinceLastLogin = 20,
                ActivityLevel = "Low",
                IsAtRisk = true,
                LoginFrequency = "Rare",
                PlatformsUsed = new List<string> { "Web" }
            }
        };

        _loginActivityServiceMock
            .Setup(s => s.GetMemberLoginActivityAsync(clubId, days))
            .ReturnsAsync(activities);

        // Act
        var result = await _controller.GetMemberLoginActivity(clubId, days);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedActivities = okResult.Value as List<MemberLoginActivityDto>;
        returnedActivities.Should().NotBeNull();
        returnedActivities.Should().HaveCount(2);
        returnedActivities![0].ActivityLevel.Should().Be("High");
        returnedActivities[1].IsAtRisk.Should().BeTrue();
    }

    [Test]
    public async Task GetMemberLoginActivity_WithDefaultDays_Uses30Days()
    {
        // Arrange
        var clubId = 1;
        var activities = new List<MemberLoginActivityDto>
        {
            new()
            {
                MemberId = 1,
                MemberName = "John Doe",
                Email = "john@example.com",
                LoginCount = 10
            }
        };

        _loginActivityServiceMock
            .Setup(s => s.GetMemberLoginActivityAsync(clubId, 30))
            .ReturnsAsync(activities);

        // Act
        var result = await _controller.GetMemberLoginActivity(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedActivities = okResult!.Value as List<MemberLoginActivityDto>;
        returnedActivities.Should().HaveCount(1);
    }

    [Test]
    public async Task GetMemberLoginActivity_WhenNoActivity_ReturnsEmptyList()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.GetMemberLoginActivityAsync(clubId, 30))
            .ReturnsAsync(new List<MemberLoginActivityDto>());

        // Act
        var result = await _controller.GetMemberLoginActivity(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedActivities = okResult!.Value as List<MemberLoginActivityDto>;
        returnedActivities.Should().BeEmpty();
    }

    [Test]
    public async Task GetMemberLoginActivity_WhenServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.GetMemberLoginActivityAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.GetMemberLoginActivity(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetInactiveMembers Tests

    [Test]
    public async Task GetInactiveMembers_ValidRequest_ReturnsOkWithInactiveMembers()
    {
        // Arrange
        var clubId = 1;
        var inactiveDays = 30;
        var inactiveMembers = new List<MemberLoginActivityDto>
        {
            new()
            {
                MemberId = 1,
                MemberName = "Inactive User",
                Email = "inactive@example.com",
                LastLoginDate = DateTime.UtcNow.AddDays(-45),
                LoginCount = 2,
                DaysSinceLastLogin = 45,
                ActivityLevel = "None",
                IsAtRisk = true,
                LoginFrequency = "Never",
                PlatformsUsed = new List<string>()
            }
        };

        _loginActivityServiceMock
            .Setup(s => s.GetInactiveMembersAsync(clubId, inactiveDays))
            .ReturnsAsync(inactiveMembers);

        // Act
        var result = await _controller.GetInactiveMembers(clubId, inactiveDays);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedMembers = okResult.Value as List<MemberLoginActivityDto>;
        returnedMembers.Should().NotBeNull();
        returnedMembers.Should().HaveCount(1);
        returnedMembers![0].IsAtRisk.Should().BeTrue();
        returnedMembers[0].DaysSinceLastLogin.Should().Be(45);
    }

    [Test]
    public async Task GetInactiveMembers_WithDefaultDays_Uses30Days()
    {
        // Arrange
        var clubId = 1;
        var inactiveMembers = new List<MemberLoginActivityDto>
        {
            new()
            {
                MemberId = 1,
                MemberName = "Inactive User",
                Email = "inactive@example.com",
                DaysSinceLastLogin = 35
            }
        };

        _loginActivityServiceMock
            .Setup(s => s.GetInactiveMembersAsync(clubId, 30))
            .ReturnsAsync(inactiveMembers);

        // Act
        var result = await _controller.GetInactiveMembers(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedMembers = okResult!.Value as List<MemberLoginActivityDto>;
        returnedMembers.Should().HaveCount(1);
    }

    [Test]
    public async Task GetInactiveMembers_WhenNoInactiveMembers_ReturnsEmptyList()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.GetInactiveMembersAsync(clubId, 30))
            .ReturnsAsync(new List<MemberLoginActivityDto>());

        // Act
        var result = await _controller.GetInactiveMembers(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedMembers = okResult!.Value as List<MemberLoginActivityDto>;
        returnedMembers.Should().BeEmpty();
    }

    [Test]
    public async Task GetInactiveMembers_WhenServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.GetInactiveMembersAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetInactiveMembers(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetLoginTrends Tests

    [Test]
    public async Task GetLoginTrends_ValidRequest_ReturnsOkWithTrends()
    {
        // Arrange
        var clubId = 1;
        var days = 90;
        var trends = new List<LoginTrendDto>
        {
            new()
            {
                Date = DateTime.UtcNow.Date.AddDays(-2),
                TotalLogins = 50,
                UniqueUsers = 30,
                WebLogins = 30,
                MobileLogins = 20
            },
            new()
            {
                Date = DateTime.UtcNow.Date.AddDays(-1),
                TotalLogins = 60,
                UniqueUsers = 35,
                WebLogins = 35,
                MobileLogins = 25
            },
            new()
            {
                Date = DateTime.UtcNow.Date,
                TotalLogins = 45,
                UniqueUsers = 28,
                WebLogins = 25,
                MobileLogins = 20
            }
        };

        _loginActivityServiceMock
            .Setup(s => s.GetLoginTrendsAsync(clubId, days))
            .ReturnsAsync(trends);

        // Act
        var result = await _controller.GetLoginTrends(clubId, days);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedTrends = okResult.Value as List<LoginTrendDto>;
        returnedTrends.Should().NotBeNull();
        returnedTrends.Should().HaveCount(3);
        returnedTrends![0].TotalLogins.Should().Be(50);
        returnedTrends[1].UniqueUsers.Should().Be(35);
    }

    [Test]
    public async Task GetLoginTrends_WithDefaultDays_Uses90Days()
    {
        // Arrange
        var clubId = 1;
        var trends = new List<LoginTrendDto>
        {
            new()
            {
                Date = DateTime.UtcNow.Date,
                TotalLogins = 40,
                UniqueUsers = 25
            }
        };

        _loginActivityServiceMock
            .Setup(s => s.GetLoginTrendsAsync(clubId, 90))
            .ReturnsAsync(trends);

        // Act
        var result = await _controller.GetLoginTrends(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedTrends = okResult!.Value as List<LoginTrendDto>;
        returnedTrends.Should().HaveCount(1);
    }

    [Test]
    public async Task GetLoginTrends_WhenNoTrends_ReturnsEmptyList()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.GetLoginTrendsAsync(clubId, 90))
            .ReturnsAsync(new List<LoginTrendDto>());

        // Act
        var result = await _controller.GetLoginTrends(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedTrends = okResult!.Value as List<LoginTrendDto>;
        returnedTrends.Should().BeEmpty();
    }

    [Test]
    public async Task GetLoginTrends_WhenServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.GetLoginTrendsAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.GetLoginTrends(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region CalculateEngagementScores Tests

    [Test]
    public async Task CalculateEngagementScores_ValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.UpdateMemberEngagementScoresAsync(clubId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.CalculateEngagementScores(clubId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        _loginActivityServiceMock.Verify(
            s => s.UpdateMemberEngagementScoresAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task CalculateEngagementScores_WhenServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        _loginActivityServiceMock
            .Setup(s => s.UpdateMemberEngagementScoresAsync(clubId))
            .ThrowsAsync(new Exception("Calculation error"));

        // Act
        var result = await _controller.CalculateEngagementScores(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    [Test]
    public async Task CalculateEngagementScores_CallsServiceWithCorrectClubId()
    {
        // Arrange
        var clubId = 42;
        _loginActivityServiceMock
            .Setup(s => s.UpdateMemberEngagementScoresAsync(clubId))
            .Returns(Task.CompletedTask);

        // Act
        await _controller.CalculateEngagementScores(clubId);

        // Assert
        _loginActivityServiceMock.Verify(
            s => s.UpdateMemberEngagementScoresAsync(42),
            Times.Once);
    }

    #endregion
}
