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
    public class EmailTemplatesControllerTests
    {
        private EmailTemplatesController _controller;
        private Mock<ICommunicationTemplateService> _mockTemplateService;
        private Mock<IClubAuthorizationService> _mockAuthService;
        private Mock<ILogger<EmailTemplatesController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _mockTemplateService = new Mock<ICommunicationTemplateService>();
            _mockAuthService = new Mock<IClubAuthorizationService>();
            _mockLogger = new Mock<ILogger<EmailTemplatesController>>();

            _controller = new EmailTemplatesController(
                _mockTemplateService.Object,
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

            // Default: authorize all requests
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
                .ReturnsAsync(true);
        }

        #region GetTemplates Tests

        [Test]
        public async Task GetTemplates_ValidRequest_ReturnsOkWithTemplates()
        {
            // Arrange
            var clubId = 1;
            var templates = new List<EmailTemplateListResponse>
            {
                new EmailTemplateListResponse { Id = 1, TemplateName = "Template 1" },
                new EmailTemplateListResponse { Id = 2, TemplateName = "Template 2" }
            };

            _mockTemplateService
                .Setup(x => x.GetTemplatesAsync(clubId, false))
                .ReturnsAsync(templates);

            // Act
            var result = await _controller.GetTemplates(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(templates));
        }

        [Test]
        public async Task GetTemplates_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetTemplates(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetTemplates_ServiceThrows_Returns500()
        {
            // Arrange
            var clubId = 1;
            _mockTemplateService
                .Setup(x => x.GetTemplatesAsync(clubId, false))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetTemplates(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
            var objectResult = result.Result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        }

        #endregion

        #region GetTemplate Tests

        [Test]
        public async Task GetTemplate_ValidRequest_ReturnsOkWithTemplate()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            var template = new EmailTemplateResponse
            {
                Id = templateId,
                TemplateName = "Test Template",
                TemplateHtml = "<html><body>Test</body></html>"
            };

            _mockTemplateService
                .Setup(x => x.GetTemplateAsync(clubId, templateId))
                .ReturnsAsync(template);

            // Act
            var result = await _controller.GetTemplate(clubId, templateId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(template));
        }

        [Test]
        public async Task GetTemplate_TemplateNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var templateId = 999;
            _mockTemplateService
                .Setup(x => x.GetTemplateAsync(clubId, templateId))
                .ThrowsAsync(new ArgumentException("Template not found"));

            // Act
            var result = await _controller.GetTemplate(clubId, templateId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetTemplate_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetTemplate(clubId, templateId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region CreateTemplate Tests

        [Test]
        public async Task CreateTemplate_ValidRequest_ReturnsCreated()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateEmailTemplateRequest
            {
                TemplateName = "New Template",
                Description = "Test description",
                TemplateHtml = "<html><body>Test</body></html>",
                TemplateJson = "{\"test\": true}"
            };

            var createdTemplate = new EmailTemplateResponse
            {
                Id = 1,
                TemplateName = request.TemplateName,
                Description = request.Description
            };

            _mockTemplateService
                .Setup(x => x.CreateTemplateAsync(clubId, 1, request))
                .ReturnsAsync(createdTemplate);

            // Act
            var result = await _controller.CreateTemplate(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult!.Value, Is.EqualTo(createdTemplate));
            Assert.That(createdResult.ActionName, Is.EqualTo(nameof(_controller.GetTemplate)));
        }

        [Test]
        public async Task CreateTemplate_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateEmailTemplateRequest { TemplateName = "Test" };
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.CreateTemplate(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task CreateTemplate_InvalidData_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateEmailTemplateRequest { TemplateName = "Test" };
            _mockTemplateService
                .Setup(x => x.CreateTemplateAsync(clubId, 1, request))
                .ThrowsAsync(new ArgumentException("Template name is required"));

            // Act
            var result = await _controller.CreateTemplate(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
            var objectResult = result.Result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        }

        #endregion

        #region UpdateTemplate Tests

        [Test]
        public async Task UpdateTemplate_ValidRequest_ReturnsOk()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            var request = new UpdateEmailTemplateRequest
            {
                TemplateName = "Updated Template",
                TemplateHtml = "<html><body>Updated</body></html>"
            };

            var updatedTemplate = new EmailTemplateResponse
            {
                Id = templateId,
                TemplateName = request.TemplateName
            };

            _mockTemplateService
                .Setup(x => x.UpdateTemplateAsync(clubId, templateId, request))
                .ReturnsAsync(updatedTemplate);

            // Act
            var result = await _controller.UpdateTemplate(clubId, templateId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(updatedTemplate));
        }

        [Test]
        public async Task UpdateTemplate_TemplateNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var templateId = 999;
            var request = new UpdateEmailTemplateRequest { TemplateName = "Test" };
            _mockTemplateService
                .Setup(x => x.UpdateTemplateAsync(clubId, templateId, request))
                .ThrowsAsync(new ArgumentException("Template not found"));

            // Act
            var result = await _controller.UpdateTemplate(clubId, templateId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateTemplate_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            var request = new UpdateEmailTemplateRequest { TemplateName = "Test" };
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.UpdateTemplate(clubId, templateId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region DeleteTemplate Tests

        [Test]
        public async Task DeleteTemplate_ValidRequest_ReturnsNoContent()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            _mockTemplateService
                .Setup(x => x.DeleteTemplateAsync(clubId, templateId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteTemplate(clubId, templateId);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task DeleteTemplate_TemplateNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var templateId = 999;
            _mockTemplateService
                .Setup(x => x.DeleteTemplateAsync(clubId, templateId))
                .ThrowsAsync(new ArgumentException("Template not found"));

            // Act
            var result = await _controller.DeleteTemplate(clubId, templateId);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteTemplate_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteTemplate(clubId, templateId);

            // Assert
            Assert.That(result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region DuplicateTemplate Tests

        [Test]
        public async Task DuplicateTemplate_ValidRequest_ReturnsCreated()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            var request = new DuplicateTemplateRequest { NewName = "Copy of Template" };

            var duplicatedTemplate = new EmailTemplateResponse
            {
                Id = 2,
                TemplateName = request.NewName
            };

            _mockTemplateService
                .Setup(x => x.DuplicateTemplateAsync(clubId, 1, templateId, request.NewName))
                .ReturnsAsync(duplicatedTemplate);

            // Act
            var result = await _controller.DuplicateTemplate(clubId, templateId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult!.Value, Is.EqualTo(duplicatedTemplate));
        }

        [Test]
        public async Task DuplicateTemplate_TemplateNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var templateId = 999;
            var request = new DuplicateTemplateRequest { NewName = "Copy" };
            _mockTemplateService
                .Setup(x => x.DuplicateTemplateAsync(clubId, 1, templateId, request.NewName))
                .ThrowsAsync(new ArgumentException("Template not found"));

            // Act
            var result = await _controller.DuplicateTemplate(clubId, templateId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DuplicateTemplate_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var templateId = 1;
            var request = new DuplicateTemplateRequest { NewName = "Copy" };
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DuplicateTemplate(clubId, templateId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion
    }
}
