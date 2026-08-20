using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using Moq;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class RsvpControllerTests
{
    private Mock<IRsvpTokenService> _mockRsvpTokenService;
    private Mock<ILogger<RsvpController>> _mockLogger;
    private RsvpController _controller;

    [SetUp]
    public void Setup()
    {
        _mockRsvpTokenService = new Mock<IRsvpTokenService>();
        _mockLogger = new Mock<ILogger<RsvpController>>();
        _controller = new RsvpController(_mockRsvpTokenService.Object, _mockLogger.Object);
    }

    [Test]
    public async Task ProcessRsvpViaLink_ValidToken_ReturnsOkWithSuccessResponse()
    {
        // Arrange
        var token = "valid-token-123";
        var expectedResponse = new RsvpViaLinkResponse
        {
            Success = true,
            Message = "Thank you, John Doe! Your RSVP for 'Test Event' has been recorded as 'Attending'.",
            MemberName = "John Doe",
            EventName = "Test Event",
            RsvpStatus = "Attending"
        };

        _mockRsvpTokenService.Setup(service => service.ProcessRsvpViaTokenAsync(token))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ProcessRsvpViaLink(token);

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as OkObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(200));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.True);
        Assert.That(responseValue.MemberName, Is.EqualTo("John Doe"));
        Assert.That(responseValue.EventName, Is.EqualTo("Test Event"));
        Assert.That(responseValue.RsvpStatus, Is.EqualTo("Attending"));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(token), Times.Once);
    }

    [Test]
    public async Task ProcessRsvpViaLink_InvalidToken_ReturnsBadRequestWithErrorResponse()
    {
        // Arrange
        var token = "invalid-token-123";
        var expectedResponse = new RsvpViaLinkResponse
        {
            Success = false,
            Message = "This RSVP link is no longer valid or has already been used.",
            MemberName = "",
            EventName = "",
            RsvpStatus = ""
        };

        _mockRsvpTokenService.Setup(service => service.ProcessRsvpViaTokenAsync(token))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ProcessRsvpViaLink(token);

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as BadRequestObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(400));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.False);
        Assert.That(responseValue.Message, Is.EqualTo("This RSVP link is no longer valid or has already been used."));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(token), Times.Once);
    }

    [Test]
    public async Task ProcessRsvpViaLink_ExpiredToken_ReturnsBadRequestWithErrorResponse()
    {
        // Arrange
        var token = "expired-token-123";
        var expectedResponse = new RsvpViaLinkResponse
        {
            Success = false,
            Message = "This RSVP link has expired.",
            MemberName = "",
            EventName = "",
            RsvpStatus = ""
        };

        _mockRsvpTokenService.Setup(service => service.ProcessRsvpViaTokenAsync(token))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ProcessRsvpViaLink(token);

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as BadRequestObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(400));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.False);
        Assert.That(responseValue.Message, Is.EqualTo("This RSVP link has expired."));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(token), Times.Once);
    }

    [Test]
    public async Task ProcessRsvpViaLink_EmptyToken_ReturnsBadRequestWithErrorMessage()
    {
        // Act
        var result = await _controller.ProcessRsvpViaLink("");

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as BadRequestObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(400));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.False);
        Assert.That(responseValue.Message, Is.EqualTo("RSVP token is required."));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task ProcessRsvpViaLink_NullToken_ReturnsBadRequestWithErrorMessage()
    {
        // Act
        var result = await _controller.ProcessRsvpViaLink(null!);

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as BadRequestObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(400));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.False);
        Assert.That(responseValue.Message, Is.EqualTo("RSVP token is required."));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task ProcessRsvpViaLink_WhitespaceToken_ReturnsBadRequestWithErrorMessage()
    {
        // Act
        var result = await _controller.ProcessRsvpViaLink("   ");

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as BadRequestObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(400));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.False);
        Assert.That(responseValue.Message, Is.EqualTo("RSVP token is required."));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task ProcessRsvpViaLink_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var token = "error-token-123";
        _mockRsvpTokenService.Setup(service => service.ProcessRsvpViaTokenAsync(token))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.ProcessRsvpViaLink(token);

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as ObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(500));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.False);
        Assert.That(responseValue.Message, Is.EqualTo("There was an error processing your RSVP. Please try again later."));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(token), Times.Once);
    }

    [Test]
    public async Task ProcessRsvpViaLink_NotAttendingStatus_ReturnsOkWithSuccessResponse()
    {
        // Arrange
        var token = "not-attending-token-123";
        var expectedResponse = new RsvpViaLinkResponse
        {
            Success = true,
            Message = "Thank you, Jane Smith! Your RSVP for 'Test Event' has been recorded as 'Not Attending'.",
            MemberName = "Jane Smith",
            EventName = "Test Event",
            RsvpStatus = "NotAttending"
        };

        _mockRsvpTokenService.Setup(service => service.ProcessRsvpViaTokenAsync(token))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ProcessRsvpViaLink(token);

        // Assert
        Assert.That(result, Is.InstanceOf<ActionResult<RsvpViaLinkResponse>>());

        var actionResult = result.Result as OkObjectResult;
        Assert.That(actionResult, Is.Not.Null);
        Assert.That(actionResult.StatusCode, Is.EqualTo(200));

        var responseValue = actionResult.Value as RsvpViaLinkResponse;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue.Success, Is.True);
        Assert.That(responseValue.MemberName, Is.EqualTo("Jane Smith"));
        Assert.That(responseValue.EventName, Is.EqualTo("Test Event"));
        Assert.That(responseValue.RsvpStatus, Is.EqualTo("NotAttending"));

        _mockRsvpTokenService.Verify(service => service.ProcessRsvpViaTokenAsync(token), Times.Once);
    }
}