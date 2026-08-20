using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MembershipTypesControllerTests
{
    private Mock<IMembershipTypeService> _mockMembershipTypeService;
    private Mock<ILogger<MembershipTypesController>> _mockLogger;
    private MembershipTypesController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockMembershipTypeService = new Mock<IMembershipTypeService>();
        _mockLogger = new Mock<ILogger<MembershipTypesController>>();
        _controller = new MembershipTypesController(_mockMembershipTypeService.Object, _mockLogger.Object);

        // Set up a mock user context with ClubId claim for authorization
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("ClubId", "1")
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

    #region CreateMembershipType Tests

    [Test]
    public async Task CreateMembershipType_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMembershipTypeRequest
        {
            Name = "Individual",
            Description = "Standard individual membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly"
        };

        var expectedResponse = new MembershipTypeResponse
        {
            Id = 1,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            DuesAmount = request.DuesAmount,
            DuesFrequency = request.DuesFrequency,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockMembershipTypeService
            .Setup(s => s.CreateMembershipTypeAsync(clubId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateMembershipType(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = (CreatedAtActionResult)result;
        Assert.That(createdResult.StatusCode, Is.EqualTo(201));
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(MembershipTypesController.GetMembershipType)));

        var routeValues = createdResult.RouteValues!;
        Assert.That(routeValues["clubId"], Is.EqualTo(clubId));
        Assert.That(routeValues["membershipTypeId"], Is.EqualTo(expectedResponse.Id));

        _mockMembershipTypeService.Verify(s => s.CreateMembershipTypeAsync(clubId, request), Times.Once);
    }

    [Test]
    public async Task CreateMembershipType_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMembershipTypeRequest
        {
            Name = "Duplicate",
            Description = "This name already exists",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly"
        };

        _mockMembershipTypeService
            .Setup(s => s.CreateMembershipTypeAsync(clubId, request))
            .ThrowsAsync(new ArgumentException("A membership type with this name already exists"));

        // Act
        var result = await _controller.CreateMembershipType(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        // Verify the error message is included in the response
        Assert.That(responseValue!.ToString(), Does.Contain("already exists"));
    }

    [Test]
    public async Task CreateMembershipType_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMembershipTypeRequest
        {
            Name = "Test",
            Description = "Test membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly"
        };

        _mockMembershipTypeService
            .Setup(s => s.CreateMembershipTypeAsync(clubId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.CreateMembershipType(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region GetMembershipTypes Tests

    [Test]
    public async Task GetMembershipTypes_ValidClubId_ReturnsOkWithList()
    {
        // Arrange
        var clubId = 1;
        var expectedResponse = new List<MembershipTypeResponse>
        {
            new MembershipTypeResponse
            {
                Id = 1,
                ClubId = clubId,
                Name = "Individual",
                Description = "Individual membership",
                DuesAmount = 25.00m,
                DuesFrequency = "Monthly",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new MembershipTypeResponse
            {
                Id = 2,
                ClubId = clubId,
                Name = "Family",
                Description = "Family membership",
                DuesAmount = 40.00m,
                DuesFrequency = "Monthly",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockMembershipTypeService
            .Setup(s => s.GetMembershipTypesByClubAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMembershipTypes(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMembershipTypeService.Verify(s => s.GetMembershipTypesByClubAsync(clubId), Times.Once);
    }

    [Test]
    public async Task GetMembershipTypes_EmptyClub_ReturnsOkWithEmptyList()
    {
        // Arrange
        var clubId = 1;
        var expectedResponse = new List<MembershipTypeResponse>();

        _mockMembershipTypeService
            .Setup(s => s.GetMembershipTypesByClubAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMembershipTypes(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        var list = (List<MembershipTypeResponse>)okResult.Value!;
        Assert.That(list, Has.Count.EqualTo(0));
    }

    [Test]
    public async Task GetMembershipTypes_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockMembershipTypeService
            .Setup(s => s.GetMembershipTypesByClubAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMembershipTypes(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region GetMembershipType Tests

    [Test]
    public async Task GetMembershipType_ExistingType_ReturnsOkWithType()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;
        var expectedResponse = new MembershipTypeResponse
        {
            Id = membershipTypeId,
            ClubId = clubId,
            Name = "Individual",
            Description = "Individual membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockMembershipTypeService
            .Setup(s => s.GetMembershipTypeByIdAsync(clubId, membershipTypeId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMembershipType(clubId, membershipTypeId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMembershipTypeService.Verify(s => s.GetMembershipTypeByIdAsync(clubId, membershipTypeId), Times.Once);
    }

    [Test]
    public async Task GetMembershipType_NonExistentType_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 999;

        _mockMembershipTypeService
            .Setup(s => s.GetMembershipTypeByIdAsync(clubId, membershipTypeId))
            .ReturnsAsync((MembershipTypeResponse?)null);

        // Act
        var result = await _controller.GetMembershipType(clubId, membershipTypeId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = (NotFoundObjectResult)result;
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));

        var responseValue = notFoundResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));

        _mockMembershipTypeService.Verify(s => s.GetMembershipTypeByIdAsync(clubId, membershipTypeId), Times.Once);
    }

    [Test]
    public async Task GetMembershipType_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;

        _mockMembershipTypeService
            .Setup(s => s.GetMembershipTypeByIdAsync(clubId, membershipTypeId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMembershipType(clubId, membershipTypeId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region UpdateMembershipType Tests

    [Test]
    public async Task UpdateMembershipType_ValidRequest_ReturnsOkWithUpdatedType()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;
        var request = new UpdateMembershipTypeRequest
        {
            Name = "Updated Individual",
            DuesAmount = 30.00m
        };

        var expectedResponse = new MembershipTypeResponse
        {
            Id = membershipTypeId,
            ClubId = clubId,
            Name = request.Name,
            Description = "Original description",
            DuesAmount = request.DuesAmount,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };

        _mockMembershipTypeService
            .Setup(s => s.UpdateMembershipTypeAsync(clubId, membershipTypeId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateMembershipType(clubId, membershipTypeId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMembershipTypeService.Verify(s => s.UpdateMembershipTypeAsync(clubId, membershipTypeId, request), Times.Once);
    }

    [Test]
    public async Task UpdateMembershipType_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;
        var request = new UpdateMembershipTypeRequest
        {
            Name = "Duplicate Name",
            DuesAmount = 30.00m
        };

        _mockMembershipTypeService
            .Setup(s => s.UpdateMembershipTypeAsync(clubId, membershipTypeId, request))
            .ThrowsAsync(new ArgumentException("A membership type with this name already exists"));

        // Act
        var result = await _controller.UpdateMembershipType(clubId, membershipTypeId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("already exists"));
    }

    [Test]
    public async Task UpdateMembershipType_NonExistentType_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 999;
        var request = new UpdateMembershipTypeRequest
        {
            Name = "Updated Name",
            DuesAmount = 30.00m
        };

        _mockMembershipTypeService
            .Setup(s => s.UpdateMembershipTypeAsync(clubId, membershipTypeId, request))
            .ThrowsAsync(new ArgumentException("Membership type not found"));

        // Act
        var result = await _controller.UpdateMembershipType(clubId, membershipTypeId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateMembershipType_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;
        var request = new UpdateMembershipTypeRequest
        {
            Name = "Updated Name",
            DuesAmount = 30.00m
        };

        _mockMembershipTypeService
            .Setup(s => s.UpdateMembershipTypeAsync(clubId, membershipTypeId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.UpdateMembershipType(clubId, membershipTypeId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region DeleteMembershipType Tests

    [Test]
    public async Task DeleteMembershipType_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;

        _mockMembershipTypeService
            .Setup(s => s.DeleteMembershipTypeAsync(clubId, membershipTypeId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteMembershipType(clubId, membershipTypeId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
        var noContentResult = (NoContentResult)result;
        Assert.That(noContentResult.StatusCode, Is.EqualTo(204));

        _mockMembershipTypeService.Verify(s => s.DeleteMembershipTypeAsync(clubId, membershipTypeId), Times.Once);
    }

    [Test]
    public async Task DeleteMembershipType_NonExistentType_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 999;

        _mockMembershipTypeService
            .Setup(s => s.DeleteMembershipTypeAsync(clubId, membershipTypeId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteMembershipType(clubId, membershipTypeId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = (NotFoundObjectResult)result;
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));

        var responseValue = notFoundResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));

        _mockMembershipTypeService.Verify(s => s.DeleteMembershipTypeAsync(clubId, membershipTypeId), Times.Once);
    }

    [Test]
    public async Task DeleteMembershipType_TypeAssignedToMembers_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;

        _mockMembershipTypeService
            .Setup(s => s.DeleteMembershipTypeAsync(clubId, membershipTypeId))
            .ThrowsAsync(new InvalidOperationException("Cannot delete membership type because it is assigned to one or more members"));

        // Act
        var result = await _controller.DeleteMembershipType(clubId, membershipTypeId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("assigned to one or more members"));

        _mockMembershipTypeService.Verify(s => s.DeleteMembershipTypeAsync(clubId, membershipTypeId), Times.Once);
    }

    [Test]
    public async Task DeleteMembershipType_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var membershipTypeId = 1;

        _mockMembershipTypeService
            .Setup(s => s.DeleteMembershipTypeAsync(clubId, membershipTypeId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.DeleteMembershipType(clubId, membershipTypeId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion
}