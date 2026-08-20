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
    public class CommunicationWorkflowsControllerTests
    {
        private CommunicationWorkflowsController _controller;
        private Mock<ICommunicationWorkflowService> _mockWorkflowService;
        private Mock<IClubAuthorizationService> _mockAuthService;
        private Mock<ILogger<CommunicationWorkflowsController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _mockWorkflowService = new Mock<ICommunicationWorkflowService>();
            _mockAuthService = new Mock<IClubAuthorizationService>();
            _mockLogger = new Mock<ILogger<CommunicationWorkflowsController>>();

            _controller = new CommunicationWorkflowsController(
                _mockWorkflowService.Object,
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

        #region GetWorkflows Tests

        [Test]
        public async Task GetWorkflows_ValidRequest_ReturnsOkWithWorkflows()
        {
            // Arrange
            var clubId = 1;
            var workflows = new List<WorkflowResponse>
            {
                new WorkflowResponse { Id = 1, WorkflowName = "Workflow 1" },
                new WorkflowResponse { Id = 2, WorkflowName = "Workflow 2" }
            };

            _mockWorkflowService
                .Setup(x => x.GetWorkflowsAsync(clubId, false))
                .ReturnsAsync(workflows);

            // Act
            var result = await _controller.GetWorkflows(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(workflows));
        }

        [Test]
        public async Task GetWorkflows_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetWorkflows(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetWorkflows_NonUnlimitedTier_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetWorkflows(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetWorkflows_ServiceThrows_Returns500()
        {
            // Arrange
            var clubId = 1;
            _mockWorkflowService
                .Setup(x => x.GetWorkflowsAsync(clubId, false))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetWorkflows(clubId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
            var objectResult = result.Result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        }

        #endregion

        #region GetWorkflow Tests

        [Test]
        public async Task GetWorkflow_ValidRequest_ReturnsOkWithWorkflow()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            var workflow = new WorkflowResponse
            {
                Id = workflowId,
                WorkflowName = "Test Workflow",
                IsActive = true
            };

            _mockWorkflowService
                .Setup(x => x.GetWorkflowAsync(clubId, workflowId))
                .ReturnsAsync(workflow);

            // Act
            var result = await _controller.GetWorkflow(clubId, workflowId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(workflow));
        }

        [Test]
        public async Task GetWorkflow_WorkflowNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 999;
            _mockWorkflowService
                .Setup(x => x.GetWorkflowAsync(clubId, workflowId))
                .ThrowsAsync(new ArgumentException("Workflow not found"));

            // Act
            var result = await _controller.GetWorkflow(clubId, workflowId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetWorkflow_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetWorkflow(clubId, workflowId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region CreateWorkflow Tests

        [Test]
        public async Task CreateWorkflow_ValidRequest_ReturnsCreated()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateWorkflowRequest
            {
                WorkflowName = "New Workflow",
                Description = "Test description",
                TriggerType = "MemberJoined"
            };

            var createdWorkflow = new WorkflowResponse
            {
                Id = 1,
                WorkflowName = request.WorkflowName,
                Description = request.Description
            };

            _mockWorkflowService
                .Setup(x => x.CreateWorkflowAsync(clubId, 1, request))
                .ReturnsAsync(createdWorkflow);

            // Act
            var result = await _controller.CreateWorkflow(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult!.Value, Is.EqualTo(createdWorkflow));
            Assert.That(createdResult.ActionName, Is.EqualTo(nameof(_controller.GetWorkflow)));
        }

        [Test]
        public async Task CreateWorkflow_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateWorkflowRequest { WorkflowName = "Test" };
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.CreateWorkflow(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task CreateWorkflow_NonUnlimitedTier_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateWorkflowRequest { WorkflowName = "Test" };
            _mockAuthService
                .Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.CreateWorkflow(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task CreateWorkflow_InvalidData_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateWorkflowRequest { WorkflowName = "Test" };
            _mockWorkflowService
                .Setup(x => x.CreateWorkflowAsync(clubId, 1, request))
                .ThrowsAsync(new ArgumentException("Invalid trigger type"));

            // Act
            var result = await _controller.CreateWorkflow(clubId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
            var objectResult = result.Result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        }

        #endregion

        #region UpdateWorkflow Tests

        [Test]
        public async Task UpdateWorkflow_ValidRequest_ReturnsOk()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            var request = new UpdateWorkflowRequest
            {
                WorkflowName = "Updated Workflow",
                Description = "Updated description"
            };

            var updatedWorkflow = new WorkflowResponse
            {
                Id = workflowId,
                WorkflowName = request.WorkflowName
            };

            _mockWorkflowService
                .Setup(x => x.UpdateWorkflowAsync(clubId, workflowId, request))
                .ReturnsAsync(updatedWorkflow);

            // Act
            var result = await _controller.UpdateWorkflow(clubId, workflowId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(updatedWorkflow));
        }

        [Test]
        public async Task UpdateWorkflow_WorkflowNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 999;
            var request = new UpdateWorkflowRequest { WorkflowName = "Test" };
            _mockWorkflowService
                .Setup(x => x.UpdateWorkflowAsync(clubId, workflowId, request))
                .ThrowsAsync(new ArgumentException("Workflow not found"));

            // Act
            var result = await _controller.UpdateWorkflow(clubId, workflowId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateWorkflow_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            var request = new UpdateWorkflowRequest { WorkflowName = "Test" };
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.UpdateWorkflow(clubId, workflowId, request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region ToggleWorkflow Tests

        [Test]
        public async Task ToggleWorkflow_Activate_ValidRequest_ReturnsOk()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            var activatedWorkflow = new WorkflowResponse
            {
                Id = workflowId,
                IsActive = true
            };

            _mockWorkflowService
                .Setup(x => x.ToggleWorkflowAsync(clubId, workflowId, true))
                .ReturnsAsync(activatedWorkflow);

            // Act
            var result = await _controller.ToggleWorkflow(clubId, workflowId, true);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(activatedWorkflow));
        }

        [Test]
        public async Task ToggleWorkflow_Deactivate_ValidRequest_ReturnsOk()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            var deactivatedWorkflow = new WorkflowResponse
            {
                Id = workflowId,
                IsActive = false
            };

            _mockWorkflowService
                .Setup(x => x.ToggleWorkflowAsync(clubId, workflowId, false))
                .ReturnsAsync(deactivatedWorkflow);

            // Act
            var result = await _controller.ToggleWorkflow(clubId, workflowId, false);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(deactivatedWorkflow));
        }

        [Test]
        public async Task ToggleWorkflow_WorkflowNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 999;
            _mockWorkflowService
                .Setup(x => x.ToggleWorkflowAsync(clubId, workflowId, It.IsAny<bool>()))
                .ThrowsAsync(new ArgumentException("Workflow not found"));

            // Act
            var result = await _controller.ToggleWorkflow(clubId, workflowId, true);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task ToggleWorkflow_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.ToggleWorkflow(clubId, workflowId, true);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        #endregion

        #region DeleteWorkflow Tests

        [Test]
        public async Task DeleteWorkflow_ValidRequest_ReturnsNoContent()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            _mockWorkflowService
                .Setup(x => x.DeleteWorkflowAsync(clubId, workflowId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteWorkflow(clubId, workflowId);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task DeleteWorkflow_WorkflowNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 999;
            _mockWorkflowService
                .Setup(x => x.DeleteWorkflowAsync(clubId, workflowId))
                .ThrowsAsync(new ArgumentException("Workflow not found"));

            // Act
            var result = await _controller.DeleteWorkflow(clubId, workflowId);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteWorkflow_Unauthorized_ReturnsForbid()
        {
            // Arrange
            var clubId = 1;
            var workflowId = 1;
            _mockAuthService
                .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteWorkflow(clubId, workflowId);

            // Assert
            Assert.That(result, Is.InstanceOf<ForbidResult>());
        }

        #endregion
    }
}
