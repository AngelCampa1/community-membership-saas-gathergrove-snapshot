using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;

namespace GatherGrove.Tests.Controllers
{
    /// <summary>
    /// Unit tests for MemberEngagementController
    /// </summary>
    public class MemberEngagementControllerTests
    {
        private readonly Mock<IMemberEngagementService> _mockEngagementService;
        private readonly Mock<IEngagementScoringService> _mockScoringService;
        private readonly Mock<IClubAuthorizationService> _mockAuthService;
        private readonly Mock<ILogger<MemberEngagementController>> _mockLogger;
        private readonly MemberEngagementController _controller;

        public MemberEngagementControllerTests()
        {
            _mockEngagementService = new Mock<IMemberEngagementService>();
            _mockScoringService = new Mock<IEngagementScoringService>();
            _mockAuthService = new Mock<IClubAuthorizationService>();
            _mockLogger = new Mock<ILogger<MemberEngagementController>>();

            _controller = new MemberEngagementController(
                _mockEngagementService.Object,
                _mockScoringService.Object,
                _mockAuthService.Object,
                _mockLogger.Object);
        }

        [Fact]
        public async Task GetMemberEngagement_WithValidMemberId_ReturnsEngagementData()
        {
            // Arrange
            var memberId = 1;
            var memberInfo = new MemberBasicInfo { MemberId = memberId, ClubId = 1, UserId = 1 };
            var engagementData = new MemberEngagementResponse
            {
                MemberId = memberId,
                FullName = "Test Member",
                OverallScore = 85.5m,
                EngagementLevel = "Green"
            };

            _mockEngagementService.Setup(x => x.GetMemberBasicInfoAsync(memberId))
                .ReturnsAsync(memberInfo);
            _mockEngagementService.Setup(x => x.GetMemberEngagementAsync(memberId))
                .ReturnsAsync(engagementData);
            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), 1))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.GetMemberEngagement(memberId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<MemberEngagementResponse>(okResult.Value);
            Assert.Equal(memberId, returnValue.MemberId);
            Assert.Equal("Green", returnValue.EngagementLevel);
        }

        [Fact]
        public async Task GetMemberEngagement_WithNonExistentMember_ReturnsNotFound()
        {
            // Arrange
            var memberId = 999;
            _mockEngagementService.Setup(x => x.GetMemberBasicInfoAsync(memberId))
                .ReturnsAsync((MemberBasicInfo?)null);

            // Act
            var result = await _controller.GetMemberEngagement(memberId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Member not found", ((dynamic)notFoundResult.Value!).message);
        }

        [Fact]
        public async Task GetEngagementDashboard_WithValidClubId_ReturnsDashboardData()
        {
            // Arrange
            var clubId = 1;
            var dashboardData = new EngagementDashboardResponse
            {
                OverallStats = new ClubEngagementStats
                {
                    TotalMembers = 100,
                    ActiveMembers = 85,
                    AverageScore = 72.5m
                },
                Distribution = new EngagementDistribution
                {
                    GreenCount = 60,
                    YellowCount = 25,
                    RedCount = 15
                }
            };

            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), clubId))
                .ReturnsAsync(true);
            _mockEngagementService.Setup(x => x.GetEngagementDashboardAsync(clubId))
                .ReturnsAsync(dashboardData);

            // Act
            var result = await _controller.GetEngagementDashboard(clubId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<EngagementDashboardResponse>(okResult.Value);
            Assert.Equal(100, returnValue.OverallStats.TotalMembers);
            Assert.Equal(85, returnValue.OverallStats.ActiveMembers);
        }

        [Fact]
        public async Task GetMembersEngagement_WithValidParameters_ReturnsPaginatedData()
        {
            // Arrange
            var clubId = 1;
            var paginatedResponse = new PaginatedEngagementResponse
            {
                Members = new List<MemberEngagementSummary>
                {
                    new() { MemberId = 1, FullName = "Member 1", OverallScore = 90, EngagementLevel = "Green" },
                    new() { MemberId = 2, FullName = "Member 2", OverallScore = 75, EngagementLevel = "Green" }
                },
                CurrentPage = 1,
                TotalPages = 1,
                TotalMembers = 2
            };

            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), clubId))
                .ReturnsAsync(true);
            _mockEngagementService.Setup(x => x.GetMembersEngagementAsync(clubId, null, "score", "desc", null, 1, 25))
                .ReturnsAsync(paginatedResponse);

            // Act
            var result = await _controller.GetMembersEngagement(clubId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<PaginatedEngagementResponse>(okResult.Value);
            Assert.Equal(2, returnValue.Members.Count);
            Assert.Equal(1, returnValue.CurrentPage);
        }

        [Fact]
        public async Task TrackMemberActivity_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var memberId = 1;
            var request = new TrackEngagementRequest
            {
                ActivityType = "login",
                SessionId = "test-session-123"
            };
            var memberInfo = new MemberBasicInfo { MemberId = memberId, ClubId = 1, UserId = 1 };

            _mockEngagementService.Setup(x => x.GetMemberBasicInfoAsync(memberId))
                .ReturnsAsync(memberInfo);
            _mockAuthService.Setup(x => x.GetUserIdFromClaims(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
                .Returns(1);

            // Act
            var result = await _controller.TrackMemberActivity(memberId, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = (dynamic)okResult.Value!;
            Assert.True((bool)response.success);
            Assert.Equal("Activity tracked successfully", (string)response.message);

            _mockEngagementService.Verify(x => x.TrackMemberActivityAsync(memberId, request), Times.Once);
        }

        [Fact]
        public async Task GetEngagementTrends_WithValidParameters_ReturnsTrendData()
        {
            // Arrange
            var clubId = 1;
            var trendData = new List<EngagementTrendPoint>
            {
                new() { Date = DateTime.UtcNow.AddDays(-7), AverageScore = 70, ActiveMembers = 80 },
                new() { Date = DateTime.UtcNow.AddDays(-6), AverageScore = 72, ActiveMembers = 82 }
            };

            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), clubId))
                .ReturnsAsync(true);
            _mockEngagementService.Setup(x => x.GetEngagementTrendsAsync(clubId, "30d", "daily"))
                .ReturnsAsync(trendData);

            // Act
            var result = await _controller.GetEngagementTrends(clubId, "30d", "daily");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<List<EngagementTrendPoint>>(okResult.Value);
            Assert.Equal(2, returnValue.Count);
        }

        [Fact]
        public async Task GetAtRiskMembers_WithValidParameters_ReturnsAtRiskData()
        {
            // Arrange
            var clubId = 1;
            var atRiskData = new PaginatedEngagementResponse
            {
                Members = new List<MemberEngagementSummary>
                {
                    new() { MemberId = 3, FullName = "At Risk Member", OverallScore = 35, EngagementLevel = "Red" }
                },
                CurrentPage = 1,
                TotalMembers = 1
            };

            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), clubId))
                .ReturnsAsync(true);
            _mockEngagementService.Setup(x => x.GetAtRiskMembersAsync(clubId, "all", 1, 25))
                .ReturnsAsync(atRiskData);

            // Act
            var result = await _controller.GetAtRiskMembers(clubId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<PaginatedEngagementResponse>(okResult.Value);
            Assert.Equal(1, returnValue.Members.Count);
            Assert.Equal("Red", returnValue.Members[0].EngagementLevel);
        }

        [Fact]
        public async Task ConfigureEngagementAlerts_WithValidRequest_ReturnsConfiguration()
        {
            // Arrange
            var clubId = 1;
            var request = new ConfigureEngagementAlertsRequest
            {
                LowEngagementAlertsEnabled = true,
                LowEngagementThreshold = 40,
                InactivityAlertsEnabled = true,
                InactivityThresholdDays = 30,
                AlertEmails = new List<string> { "admin@club.com" }
            };
            var response = new EngagementAlertsResponse
            {
                LowEngagementAlertsEnabled = true,
                LowEngagementThreshold = 40,
                InactivityAlertsEnabled = true,
                InactivityThresholdDays = 30,
                AlertEmails = new List<string> { "admin@club.com" },
                UpdatedAt = DateTime.UtcNow
            };

            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), clubId))
                .ReturnsAsync(true);
            _mockAuthService.Setup(x => x.CanAccessGrowFeaturesAsync(clubId))
                .ReturnsAsync(true);
            _mockEngagementService.Setup(x => x.ConfigureEngagementAlertsAsync(clubId, request))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.ConfigureEngagementAlerts(clubId, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<EngagementAlertsResponse>(okResult.Value);
            Assert.That(returnValue.LowEngagementAlertsEnabled, Is.True);
            Assert.Equal(40, returnValue.LowEngagementThreshold);
        }

        [Theory]
        [InlineData("Green")]
        [InlineData("Yellow")]
        [InlineData("Red")]
        public async Task GetMembersEngagement_WithLevelFilter_FiltersCorrectly(string level)
        {
            // Arrange
            var clubId = 1;
            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), clubId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.GetMembersEngagement(clubId, level);

            // Assert
            _mockEngagementService.Verify(x => x.GetMembersEngagementAsync(clubId, level, "score", "desc", null, 1, 25), Times.Once);
        }

        [Theory]
        [InlineData("7d")]
        [InlineData("30d")]
        [InlineData("90d")]
        [InlineData("1y")]
        public async Task GetEngagementTrends_WithDifferentPeriods_CallsServiceCorrectly(string period)
        {
            // Arrange
            var clubId = 1;
            _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), clubId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.GetEngagementTrends(clubId, period);

            // Assert
            _mockEngagementService.Verify(x => x.GetEngagementTrendsAsync(clubId, period, "daily"), Times.Once);
        }
    }
}