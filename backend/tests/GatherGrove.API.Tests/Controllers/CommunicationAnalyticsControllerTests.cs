using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using System;

namespace GatherGrove.API.Tests.Controllers
{
    [TestFixture]
    public class CommunicationAnalyticsControllerTests
    {
        private CommunicationAnalyticsController _controller;
        private Mock<ICommunicationAnalyticsService> _mockAnalyticsService;
        private Mock<IClubAuthorizationService> _mockAuthService;
        private Mock<ILogger<CommunicationAnalyticsController>> _mockLogger;
        private Mock<ILogger<CommunicationTrackingController>> _mockTrackingLogger;

        [SetUp]
        public void Setup()
        {
            _mockAnalyticsService = new Mock<ICommunicationAnalyticsService>();
            _mockAuthService = new Mock<IClubAuthorizationService>();
            _mockLogger = new Mock<ILogger<CommunicationAnalyticsController>>();
            _mockTrackingLogger = new Mock<ILogger<CommunicationTrackingController>>();

            _controller = new CommunicationAnalyticsController(
                _mockAnalyticsService.Object,
                _mockAuthService.Object,
                _mockLogger.Object);

            // Set up user context with claims
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim("ClubId", "1")
            }));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Default: authorize all requests and enable Unlimited features
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
                .ReturnsAsync(true);
            _mockAuthService
                .Setup(x => x.CanAccessUnlimitedFeaturesAsync(It.IsAny<int>()))
                .ReturnsAsync(true);
        }

        #region GetAnalyticsSummary Tests

        [Test]
        public async Task GetAnalyticsSummary_ValidRequest_ReturnsOkWithAnalytics()
        {
            // Arrange
            var clubId = 1;
            var analytics = new CommunicationAnalyticsResponse
            {
                CommunicationId = 1,
                TotalSent = 100,
                TotalDelivered = 95,
                TotalOpened = 45,
                TotalClicked = 12,
                OpenRate = 45.5m,
                ClickRate = 12.3m
            };

            _mockAnalyticsService
                .Setup(x => x.GetAnalyticsSummaryAsync(clubId, It.IsAny<AnalyticsFilterRequest>()))
                .ReturnsAsync(analytics);

            // Act
            var result = await _controller.GetAnalyticsSummary(clubId, null, null, null, null, null);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(analytics));
        }

        [Test]
        public async Task GetAnalyticsSummary_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetAnalyticsSummary(clubId, null, null, null, null, null);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetAnalyticsSummary_NonUnlimitedTier_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetAnalyticsSummary(clubId, null, null, null, null, null);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetAnalyticsSummary_WithDateRange_ReturnsFilteredAnalytics()
        {
            // Arrange
            var clubId = 1;
            var startDate = DateTime.UtcNow.AddDays(-30);
            var endDate = DateTime.UtcNow;
            var analytics = new CommunicationAnalyticsResponse
            {
                CommunicationId = 1,
                TotalSent = 50,
                TotalDelivered = 48,
                TotalOpened = 20,
                TotalClicked = 5,
                OpenRate = 40.0m,
                ClickRate = 10.0m
            };

            _mockAnalyticsService
                .Setup(x => x.GetAnalyticsSummaryAsync(clubId, It.Is<AnalyticsFilterRequest>(f =>
                    f.StartDate == startDate && f.EndDate == endDate)))
                .ReturnsAsync(analytics);

            // Act
            var result = await _controller.GetAnalyticsSummary(clubId, startDate, endDate, null, null, null);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(analytics));
        }

        [Test]
        public async Task GetAnalyticsSummary_ServiceThrows_Returns500()
        {
            // Arrange
            var clubId = 1;
            _mockAnalyticsService
                .Setup(x => x.GetAnalyticsSummaryAsync(clubId, It.IsAny<AnalyticsFilterRequest>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetAnalyticsSummary(clubId, null, null, null, null, null);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
            var objectResult = result.Result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        }

        #endregion

        #region GetCommunicationDetails Tests

        [Test]
        public async Task GetCommunicationDetails_ValidRequest_ReturnsOkWithDetails()
        {
            // Arrange
            var clubId = 1;
            var communicationId = 123;
            var details = new CommunicationDetailsResponse
            {
                CommunicationId = communicationId,
                Subject = "Test Email",
                RecipientCount = 100,
                OpenedCount = 45,
                ClickedCount = 12
            };

            _mockAnalyticsService
                .Setup(x => x.GetCommunicationDetailsAsync(clubId, communicationId))
                .ReturnsAsync(details);

            // Act
            var result = await _controller.GetCommunicationDetails(clubId, communicationId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(details));
        }

        [Test]
        public async Task GetCommunicationDetails_CommunicationNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var communicationId = 999;
            _mockAnalyticsService
                .Setup(x => x.GetCommunicationDetailsAsync(clubId, communicationId))
                .ThrowsAsync(new ArgumentException("Communication not found"));

            // Act
            var result = await _controller.GetCommunicationDetails(clubId, communicationId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetCommunicationDetails_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var communicationId = 123;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetCommunicationDetails(clubId, communicationId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region TrackEmailOpen Tests

        [Test]
        public async Task TrackEmailOpen_ValidRequest_ReturnsPixelImage()
        {
            // Arrange
            var trackingId = "test-tracking-123";
            var trackingController = new CommunicationTrackingController(_mockAnalyticsService.Object, _mockTrackingLogger.Object);

            _mockAnalyticsService
                .Setup(x => x.TrackEmailOpenAsync(It.IsAny<TrackEmailOpenRequest>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await trackingController.TrackEmailOpen(trackingId);

            // Assert
            Assert.That(result, Is.InstanceOf<FileContentResult>());
            var fileResult = result as FileContentResult;
            Assert.That(fileResult!.ContentType, Is.EqualTo("image/gif"));
        }

        [Test]
        public async Task TrackEmailOpen_ServiceThrows_StillReturnsPixel()
        {
            // Arrange
            var trackingId = "test-tracking-123";
            var trackingController = new CommunicationTrackingController(_mockAnalyticsService.Object, _mockTrackingLogger.Object);

            _mockAnalyticsService
                .Setup(x => x.TrackEmailOpenAsync(It.IsAny<TrackEmailOpenRequest>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await trackingController.TrackEmailOpen(trackingId);

            // Assert - Should still return pixel even on error
            Assert.That(result, Is.InstanceOf<FileContentResult>());
            var fileResult = result as FileContentResult;
            Assert.That(fileResult!.ContentType, Is.EqualTo("image/gif"));
        }

        #endregion

        #region TrackLinkClick Tests

        [Test]
        public async Task TrackLinkClick_ValidRequest_ReturnsRedirect()
        {
            // Arrange
            var trackingId = "test-tracking-123";
            var url = "https://example.com";
            var trackingController = new CommunicationTrackingController(_mockAnalyticsService.Object, _mockTrackingLogger.Object);

            _mockAnalyticsService
                .Setup(x => x.TrackLinkClickAsync(It.IsAny<TrackLinkClickRequest>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await trackingController.TrackLinkClick(trackingId, url);

            // Assert
            Assert.That(result, Is.InstanceOf<RedirectResult>());
            var redirectResult = result as RedirectResult;
            Assert.That(redirectResult!.Url, Is.EqualTo(url));
        }

        [Test]
        public async Task TrackLinkClick_ServiceThrows_StillRedirects()
        {
            // Arrange
            var trackingId = "test-tracking-123";
            var url = "https://example.com";
            var trackingController = new CommunicationTrackingController(_mockAnalyticsService.Object, _mockTrackingLogger.Object);

            _mockAnalyticsService
                .Setup(x => x.TrackLinkClickAsync(It.IsAny<TrackLinkClickRequest>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await trackingController.TrackLinkClick(trackingId, url);

            // Assert - Should still redirect even on error
            Assert.That(result, Is.InstanceOf<RedirectResult>());
            var redirectResult = result as RedirectResult;
            Assert.That(redirectResult!.Url, Is.EqualTo(url));
        }

        #endregion
    }
}
