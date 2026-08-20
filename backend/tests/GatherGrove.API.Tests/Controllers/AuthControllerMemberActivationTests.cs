using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Moq;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Threading.Tasks;

namespace GatherGrove.API.Tests.Controllers
{
    [TestFixture]
    public class AuthControllerMemberActivationTests
    {
        private Mock<IAuthService> _mockAuthService;
        private Mock<IMemberActivationService> _mockMemberActivationService;
        private Mock<IExternalAuthService> _mockExternalAuthService;
        private Mock<ILogger<AuthController>> _mockLogger;
        private Mock<IWebHostEnvironment> _mockWebHostEnvironment;
        private Mock<IConfiguration> _mockConfiguration;
        private AuthController _controller;

        [SetUp]
        public void SetUp()
        {
            _mockAuthService = new Mock<IAuthService>();
            _mockMemberActivationService = new Mock<IMemberActivationService>();
            _mockExternalAuthService = new Mock<IExternalAuthService>();
            _mockLogger = new Mock<ILogger<AuthController>>();
            _mockWebHostEnvironment = new Mock<IWebHostEnvironment>();
            _mockConfiguration = new Mock<IConfiguration>();

            // Setup web host environment for development
            _mockWebHostEnvironment.Setup(x => x.EnvironmentName).Returns("Development");

            _controller = new AuthController(_mockAuthService.Object, _mockMemberActivationService.Object, _mockExternalAuthService.Object, _mockLogger.Object, _mockWebHostEnvironment.Object, _mockConfiguration.Object);
        }

        [Test]
        public async Task ActivateMemberAccount_ValidRequest_ReturnsOkWithSuccessResponse()
        {
            // Arrange
            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = "valid-token-123",
                NewPassword = "StrongPassword123!"
            };

            var expectedResponse = new ActivateMemberAccountResponse
            {
                Success = true,
                Message = "Account activated successfully."
            };

            _mockMemberActivationService
                .Setup(x => x.ActivateMemberAccountAsync(It.IsAny<ActivateMemberAccountRequest>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.ActivateMemberAccount(request);

            // Assert
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var response = okResult!.Value as ActivateMemberAccountResponse;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Success, Is.True);
            Assert.That(response.Message, Is.EqualTo("Account activated successfully."));

            _mockMemberActivationService.Verify(x => x.ActivateMemberAccountAsync(request), Times.Once);
        }

        [Test]
        public async Task ActivateMemberAccount_InvalidToken_ReturnsBadRequestWithFailureResponse()
        {
            // Arrange
            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = "invalid-token",
                NewPassword = "StrongPassword123!"
            };

            var expectedResponse = new ActivateMemberAccountResponse
            {
                Success = false,
                Message = "Invalid or expired activation token."
            };

            _mockMemberActivationService
                .Setup(x => x.ActivateMemberAccountAsync(It.IsAny<ActivateMemberAccountRequest>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.ActivateMemberAccount(request);

            // Assert - Controller returns BadRequest for failed responses
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
            var badRequestResult = result.Result as BadRequestObjectResult;
            var response = badRequestResult!.Value as ActivateMemberAccountResponse;
            Assert.That(response!.Success, Is.False);
            Assert.That(response.Message, Is.EqualTo("Invalid or expired activation token."));
        }

        [Test]
        public async Task ActivateMemberAccount_ServiceThrowsException_ReturnsInternalServerError()
        {
            // Arrange
            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = "valid-token",
                NewPassword = "StrongPassword123!"
            };

            _mockMemberActivationService
                .Setup(x => x.ActivateMemberAccountAsync(It.IsAny<ActivateMemberAccountRequest>()))
                .ThrowsAsync(new System.Exception("Database connection failed"));

            // Act
            var result = await _controller.ActivateMemberAccount(request);

            // Assert
            Assert.That(result.Result, Is.TypeOf<ObjectResult>());
            var objectResult = result.Result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));

            var response = objectResult.Value as ActivateMemberAccountResponse;
            Assert.That(response!.Success, Is.False);
            Assert.That(response.Message, Does.Contain("An unexpected error occurred"));
        }
    }
}