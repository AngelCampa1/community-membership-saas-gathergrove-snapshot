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
using System.Collections.Generic;
using System;

namespace GatherGrove.API.Tests.Controllers
{
    [TestFixture]
    public class ABTestingControllerTests
    {
        private ABTestingController _controller;
        private Mock<IABTestingService> _mockABTestingService;
        private Mock<IClubAuthorizationService> _mockAuthService;
        private Mock<ILogger<ABTestingController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _mockABTestingService = new Mock<IABTestingService>();
            _mockAuthService = new Mock<IClubAuthorizationService>();
            _mockLogger = new Mock<ILogger<ABTestingController>>();

            _controller = new ABTestingController(
                _mockABTestingService.Object,
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

        #region GetCampaigns Tests

        [Test]
        public async Task GetCampaigns_ValidRequest_ReturnsOkWithCampaigns()
        {
            // Arrange
            var clubId = 1;
            var campaigns = new List<ABTestCampaignResponse>
            {
                new ABTestCampaignResponse { Id = 1, CampaignName = "Campaign 1" },
                new ABTestCampaignResponse { Id = 2, CampaignName = "Campaign 2" }
            };

            _mockABTestingService
                .Setup(x => x.GetCampaignsAsync(clubId))
                .ReturnsAsync(campaigns);

            // Act
            var result = await _controller.GetCampaigns(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(campaigns));
        }

        [Test]
        public async Task GetCampaigns_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetCampaigns(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetCampaigns_NonUnlimitedTier_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetCampaigns(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetCampaigns_ServiceThrows_Returns500()
        {
            // Arrange
            var clubId = 1;
            _mockABTestingService
                .Setup(x => x.GetCampaignsAsync(clubId))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetCampaigns(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
            var objectResult = result.Result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        }

        #endregion

        #region GetCampaign Tests

        [Test]
        public async Task GetCampaign_ValidRequest_ReturnsOkWithCampaign()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 1;
            var campaign = new ABTestCampaignResponse
            {
                Id = campaignId,
                CampaignName = "Test Campaign",
                Status = "Running"
            };

            _mockABTestingService
                .Setup(x => x.GetCampaignAsync(clubId, campaignId))
                .ReturnsAsync(campaign);

            // Act
            var result = await _controller.GetCampaign(clubId, campaignId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(campaign));
        }

        [Test]
        public async Task GetCampaign_CampaignNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 999;
            _mockABTestingService
                .Setup(x => x.GetCampaignAsync(clubId, campaignId))
                .ThrowsAsync(new ArgumentException("Campaign not found"));

            // Act
            var result = await _controller.GetCampaign(clubId, campaignId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetCampaign_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetCampaign(clubId, campaignId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region CreateCampaign Tests

        [Test]
        public async Task CreateCampaign_ValidRequest_ReturnsCreated()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateABTestCampaignRequest
            {
                CampaignName = "New Campaign",
                VariantATemplateId = 1,
                VariantBTemplateId = 2,
                TestPercentage = 50
            };

            var createdCampaign = new ABTestCampaignResponse
            {
                Id = 1,
                CampaignName = request.CampaignName,
                Status = "Draft"
            };

            _mockABTestingService
                .Setup(x => x.CreateCampaignAsync(clubId, 1, request))
                .ReturnsAsync(createdCampaign);

            // Act
            var result = await _controller.CreateCampaign(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult!.Value, Is.EqualTo(createdCampaign));
            Assert.That(createdResult.ActionName, Is.EqualTo(nameof(_controller.GetCampaign)));
        }

        [Test]
        public async Task CreateCampaign_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateABTestCampaignRequest { CampaignName = "Test" };
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.CreateCampaign(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task CreateCampaign_NonUnlimitedTier_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateABTestCampaignRequest { CampaignName = "Test" };
            _mockAuthService
                .Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.CreateCampaign(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task CreateCampaign_InvalidData_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateABTestCampaignRequest { CampaignName = "Test" };
            _mockABTestingService
                .Setup(x => x.CreateCampaignAsync(clubId, 1, request))
                .ThrowsAsync(new ArgumentException("Invalid template IDs"));

            // Act
            var result = await _controller.CreateCampaign(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        #endregion

        #region StartCampaign Tests

        [Test]
        public async Task StartCampaign_ValidRequest_ReturnsOk()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 1;
            var request = new StartABTestRequest();
            var updatedCampaign = new ABTestCampaignResponse
            {
                Id = campaignId,
                Status = "Running"
            };

            _mockABTestingService
                .Setup(x => x.StartCampaignAsync(clubId, campaignId, request))
                .ReturnsAsync(updatedCampaign);

            // Act
            var result = await _controller.StartCampaign(clubId, campaignId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(updatedCampaign));
        }

        [Test]
        public async Task StartCampaign_CampaignNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 999;
            var request = new StartABTestRequest();
            _mockABTestingService
                .Setup(x => x.StartCampaignAsync(clubId, campaignId, request))
                .ThrowsAsync(new ArgumentException("Campaign not found"));

            // Act
            var result = await _controller.StartCampaign(clubId, campaignId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task StartCampaign_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 1;
            var request = new StartABTestRequest();
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.StartCampaign(clubId, campaignId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region DetermineWinner Tests

        [Test]
        public async Task DetermineWinner_ValidRequest_ReturnsOkWithResults()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 1;
            var updatedCampaign = new ABTestCampaignResponse
            {
                Id = campaignId,
                Status = "Completed",
                WinnerVariant = "Variant A"
            };

            _mockABTestingService
                .Setup(x => x.DetermineWinnerAsync(clubId, campaignId))
                .ReturnsAsync(updatedCampaign);

            // Act
            var result = await _controller.DetermineWinner(clubId, campaignId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(updatedCampaign));
        }

        [Test]
        public async Task DetermineWinner_CampaignNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 999;
            _mockABTestingService
                .Setup(x => x.DetermineWinnerAsync(clubId, campaignId))
                .ThrowsAsync(new ArgumentException("Campaign not found"));

            // Act
            var result = await _controller.DetermineWinner(clubId, campaignId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DetermineWinner_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var campaignId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DetermineWinner(clubId, campaignId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion
    }
}
