using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;
using System.Text;
using System.Net;
using Newtonsoft.Json;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.API.Controllers;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class CustomFieldsControllerTests
{
    private Mock<ICustomFieldService> _mockCustomFieldService;
    private Mock<ILogger<CustomFieldsController>> _mockLogger;
    private CustomFieldsController _controller;

    [SetUp]
    public void Setup()
    {
        _mockCustomFieldService = new Mock<ICustomFieldService>();
        _mockLogger = new Mock<ILogger<CustomFieldsController>>();
        _controller = new CustomFieldsController(_mockCustomFieldService.Object, _mockLogger.Object);

        // Set up fake user context
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("UserId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
    }

    private List<CustomFieldResponse> GetSampleCustomFields()
    {
        return new List<CustomFieldResponse>
        {
            new CustomFieldResponse
            {
                CustomFieldId = 1,
                ClubId = 1,
                FieldLabel = "Emergency Contact",
                FieldType = "Text",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new CustomFieldResponse
            {
                CustomFieldId = 2,
                ClubId = 1,
                FieldLabel = "Allergies",
                FieldType = "Text",
                CreatedAt = DateTime.UtcNow
            }
        };
    }

    [Test]
    public async Task GetCustomFields_WithValidClub_ReturnsOkWithCustomFields()
    {
        // Arrange
        var clubId = 1;
        var customFields = GetSampleCustomFields();
        _mockCustomFieldService.Setup(s => s.GetCustomFieldsAsync(clubId, 1))
            .ReturnsAsync(customFields);

        // Act
        var result = await _controller.GetCustomFields(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(customFields));

        _mockCustomFieldService.Verify(s => s.GetCustomFieldsAsync(clubId, 1), Times.Once);
    }

    [Test]
    public async Task GetCustomFields_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        _mockCustomFieldService.Setup(s => s.GetCustomFieldsAsync(clubId, 1))
            .ThrowsAsync(new UnauthorizedAccessException("User is not authorized"));

        // Act
        var result = await _controller.GetCustomFields(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetCustomFields_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        _mockCustomFieldService.Setup(s => s.GetCustomFieldsAsync(clubId, 1))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.GetCustomFields(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task GetCustomField_WithValidId_ReturnsOkWithCustomField()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        var customField = GetSampleCustomFields().First();
        _mockCustomFieldService.Setup(s => s.GetCustomFieldByIdAsync(clubId, customFieldId, 1))
            .ReturnsAsync(customField);

        // Act
        var result = await _controller.GetCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(customField));
    }

    [Test]
    public async Task GetCustomField_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 999;
        _mockCustomFieldService.Setup(s => s.GetCustomFieldByIdAsync(clubId, customFieldId, 1))
            .ThrowsAsync(new InvalidOperationException("Custom field not found"));

        // Act
        var result = await _controller.GetCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result.Result as NotFoundObjectResult;
        var response = notFoundResult?.Value as object;
        Assert.That(response, Is.Not.Null);
    }

    [Test]
    public async Task GetCustomField_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        _mockCustomFieldService.Setup(s => s.GetCustomFieldByIdAsync(clubId, customFieldId, 1))
            .ThrowsAsync(new UnauthorizedAccessException("User is not authorized"));

        // Act
        var result = await _controller.GetCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetCustomField_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        _mockCustomFieldService.Setup(s => s.GetCustomFieldByIdAsync(clubId, customFieldId, 1))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task CreateCustomField_WithValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };
        var createdField = new CustomFieldResponse
        {
            CustomFieldId = 1,
            ClubId = clubId,
            FieldLabel = request.FieldLabel,
            FieldType = request.FieldType,
            CreatedAt = DateTime.UtcNow
        };

        _mockCustomFieldService.Setup(s => s.CreateCustomFieldAsync(clubId, 1, request))
            .ReturnsAsync(createdField);

        // Act
        var result = await _controller.CreateCustomField(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result.Result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(createdField));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(CustomFieldsController.GetCustomField)));

        _mockCustomFieldService.Verify(s => s.CreateCustomFieldAsync(clubId, 1, request), Times.Once);
    }

    [Test]
    public async Task CreateCustomField_WithDuplicateLabel_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.CreateCustomFieldAsync(clubId, 1, request))
            .ThrowsAsync(new InvalidOperationException("A custom field with this label already exists"));

        // Act
        var result = await _controller.CreateCustomField(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        var response = badRequestResult?.Value as object;
        Assert.That(response, Is.Not.Null);
    }

    [Test]
    public async Task CreateCustomField_ExceedsMaxLimit_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Field 11",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.CreateCustomFieldAsync(clubId, 1, request))
            .ThrowsAsync(new InvalidOperationException("Maximum of 10 custom fields allowed per club"));

        // Act
        var result = await _controller.CreateCustomField(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        var response = badRequestResult?.Value as object;
        Assert.That(response, Is.Not.Null);
    }

    [Test]
    public async Task CreateCustomField_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.CreateCustomFieldAsync(clubId, 1, request))
            .ThrowsAsync(new UnauthorizedAccessException("User is not authorized"));

        // Act
        var result = await _controller.CreateCustomField(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task CreateCustomField_WithInvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.CreateCustomFieldAsync(clubId, 1, request))
            .ThrowsAsync(new ArgumentException("Field label cannot be empty"));

        // Act
        var result = await _controller.CreateCustomField(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        var response = badRequestResult?.Value as object;
        Assert.That(response, Is.Not.Null);
    }

    [Test]
    public async Task CreateCustomField_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.CreateCustomFieldAsync(clubId, 1, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateCustomField(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task UpdateCustomField_WithValidRequest_ReturnsOkWithUpdatedField()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Updated Emergency Contact",
            FieldType = "Text"
        };
        var updatedField = new CustomFieldResponse
        {
            CustomFieldId = customFieldId,
            ClubId = clubId,
            FieldLabel = request.FieldLabel,
            FieldType = request.FieldType,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _mockCustomFieldService.Setup(s => s.UpdateCustomFieldAsync(clubId, customFieldId, 1, request))
            .ReturnsAsync(updatedField);

        // Act
        var result = await _controller.UpdateCustomField(clubId, customFieldId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(updatedField));

        _mockCustomFieldService.Verify(s => s.UpdateCustomFieldAsync(clubId, customFieldId, 1, request), Times.Once);
    }

    [Test]
    public async Task UpdateCustomField_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 999;
        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Updated Field",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.UpdateCustomFieldAsync(clubId, customFieldId, 1, request))
            .ThrowsAsync(new InvalidOperationException("Custom field not found"));

        // Act
        var result = await _controller.UpdateCustomField(clubId, customFieldId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task UpdateCustomField_WithDuplicateLabel_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Existing Label",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.UpdateCustomFieldAsync(clubId, customFieldId, 1, request))
            .ThrowsAsync(new InvalidOperationException("A custom field with this label already exists"));

        // Act
        var result = await _controller.UpdateCustomField(clubId, customFieldId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task UpdateCustomField_WithInvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.UpdateCustomFieldAsync(clubId, customFieldId, 1, request))
            .ThrowsAsync(new ArgumentException("Field label cannot be empty"));

        // Act
        var result = await _controller.UpdateCustomField(clubId, customFieldId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        var response = badRequestResult?.Value as object;
        Assert.That(response, Is.Not.Null);
    }

    [Test]
    public async Task UpdateCustomField_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.UpdateCustomFieldAsync(clubId, customFieldId, 1, request))
            .ThrowsAsync(new UnauthorizedAccessException("User is not authorized"));

        // Act
        var result = await _controller.UpdateCustomField(clubId, customFieldId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task UpdateCustomField_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;
        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        _mockCustomFieldService.Setup(s => s.UpdateCustomFieldAsync(clubId, customFieldId, 1, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.UpdateCustomField(clubId, customFieldId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task DeleteCustomField_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;

        _mockCustomFieldService.Setup(s => s.DeleteCustomFieldAsync(clubId, customFieldId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());

        _mockCustomFieldService.Verify(s => s.DeleteCustomFieldAsync(clubId, customFieldId, 1), Times.Once);
    }

    [Test]
    public async Task DeleteCustomField_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 999;

        _mockCustomFieldService.Setup(s => s.DeleteCustomFieldAsync(clubId, customFieldId, 1))
            .ThrowsAsync(new InvalidOperationException("Custom field not found"));

        // Act
        var result = await _controller.DeleteCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task DeleteCustomField_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;

        _mockCustomFieldService.Setup(s => s.DeleteCustomFieldAsync(clubId, customFieldId, 1))
            .ThrowsAsync(new UnauthorizedAccessException("User is not authorized"));

        // Act
        var result = await _controller.DeleteCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task DeleteCustomField_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;

        _mockCustomFieldService.Setup(s => s.DeleteCustomFieldAsync(clubId, customFieldId, 1))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.DeleteCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task DeleteCustomField_WithMemberData_ReturnsConflict()
    {
        // Arrange
        var clubId = 1;
        var customFieldId = 1;

        _mockCustomFieldService.Setup(s => s.DeleteCustomFieldAsync(clubId, customFieldId, 1))
            .ThrowsAsync(new InvalidOperationException("Cannot delete custom field that contains member data"));

        // Act
        var result = await _controller.DeleteCustomField(clubId, customFieldId);

        // Assert
        Assert.That(result, Is.InstanceOf<ConflictObjectResult>());
        var conflictResult = result as ConflictObjectResult;
        Assert.That(conflictResult.StatusCode, Is.EqualTo(409));
        var response = conflictResult?.Value as object;
        Assert.That(response, Is.Not.Null);
    }
}