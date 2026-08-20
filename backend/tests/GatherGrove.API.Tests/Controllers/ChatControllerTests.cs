using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services.Chat;
using GatherGrove.Application.DTOs.Chat;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class ChatControllerTests
{
    private ChatController _controller;
    private Mock<IChatService> _mockChatService;
    private Mock<ILogger<ChatController>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        _mockChatService = new Mock<IChatService>();
        _mockLogger = new Mock<ILogger<ChatController>>();
        _controller = new ChatController(_mockChatService.Object, _mockLogger.Object);

        // Setup a mock user context
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    #region GetChatHistory Tests

    [Test]
    public async Task GetChatHistory_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var expectedHistory = new ChatHistoryResponse
        {
            Messages = new List<ChatMessageResponse>
            {
                new ChatMessageResponse
                {
                    MessageContent = "Test message",
                    SenderName = "Test User",
                    SentAt = DateTime.UtcNow
                }
            },
            HasMore = false
        };

        _mockChatService
            .Setup(s => s.GetChatHistoryAsync(clubId, 1, null, 50))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetChatHistory(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedHistory));

        _mockChatService.Verify(
            s => s.GetChatHistoryAsync(clubId, 1, null, 50),
            Times.Once);
    }

    [Test]
    public async Task GetChatHistory_WithPaginationParams_PassesCorrectParameters()
    {
        // Arrange
        var clubId = 1;
        var before = DateTime.UtcNow;
        var limit = 25;
        var expectedHistory = new ChatHistoryResponse
        {
            Messages = new List<ChatMessageResponse>(),
            HasMore = false
        };

        _mockChatService
            .Setup(s => s.GetChatHistoryAsync(clubId, 1, It.IsAny<DateTime?>(), limit))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetChatHistory(clubId, before, limit);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());

        _mockChatService.Verify(
            s => s.GetChatHistoryAsync(clubId, 1, It.IsAny<DateTime?>(), limit),
            Times.Once);
    }

    [Test]
    public async Task GetChatHistory_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        _mockChatService
            .Setup(s => s.GetChatHistoryAsync(clubId, 1, null, 50))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have access to this club's chat"));

        // Act
        var result = await _controller.GetChatHistory(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetChatHistory_WithChatDisabled_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;

        _mockChatService
            .Setup(s => s.GetChatHistoryAsync(clubId, 1, null, 50))
            .ThrowsAsync(new InvalidOperationException("Chat is not enabled for this club"));

        // Act
        var result = await _controller.GetChatHistory(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task GetChatHistory_WithGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockChatService
            .Setup(s => s.GetChatHistoryAsync(clubId, 1, null, 50))
            .ThrowsAsync(new Exception("Generic error"));

        // Act
        var result = await _controller.GetChatHistory(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region SendMessage Tests (Story 33)

    [Test]
    public async Task SendMessage_WithValidRequest_ReturnsCreatedWithBroadcast()
    {
        // Arrange
        var clubId = 1;
        var request = new SendMessageRequest
        {
            MessageContent = "Hello from test!"
        };
        var expectedResponse = new ChatMessageResponse
        {
            MessageContent = "Hello from test!",
            SenderName = "Test User",
            SentAt = DateTime.UtcNow
        };

        _mockChatService
            .Setup(s => s.SendMessageAsync(clubId, 1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SendMessage(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result.Result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(ChatController.GetChatHistory)));

        _mockChatService.Verify(
            s => s.SendMessageAsync(clubId, 1, request),
            Times.Once);
    }

    [Test]
    public async Task SendMessage_WithEmptyMessage_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new SendMessageRequest
        {
            MessageContent = ""
        };

        _mockChatService
            .Setup(s => s.SendMessageAsync(clubId, 1, request))
            .ThrowsAsync(new ArgumentException("Message content cannot be empty"));

        // Act
        var result = await _controller.SendMessage(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task SendMessage_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new SendMessageRequest
        {
            MessageContent = "Unauthorized message"
        };

        _mockChatService
            .Setup(s => s.SendMessageAsync(clubId, 1, request))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have access to this club's chat"));

        // Act
        var result = await _controller.SendMessage(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task SendMessage_WithChatDisabled_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new SendMessageRequest
        {
            MessageContent = "Message when chat disabled"
        };

        _mockChatService
            .Setup(s => s.SendMessageAsync(clubId, 1, request))
            .ThrowsAsync(new InvalidOperationException("Chat is not enabled for this club"));

        // Act
        var result = await _controller.SendMessage(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task SendMessage_WithNullRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        SendMessageRequest request = null!;

        // Act
        var result = await _controller.SendMessage(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult.Value, Is.Not.Null);

        // Verify service was not called
        _mockChatService.Verify(
            s => s.SendMessageAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<SendMessageRequest>()),
            Times.Never);
    }

    [Test]
    public async Task SendMessage_WithGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new SendMessageRequest
        {
            MessageContent = "Test message"
        };

        _mockChatService
            .Setup(s => s.SendMessageAsync(clubId, 1, request))
            .ThrowsAsync(new Exception("Generic error"));

        // Act
        var result = await _controller.SendMessage(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task SendMessage_LongMessage_HandlesCorrectly()
    {
        // Arrange
        var clubId = 1;
        var longMessage = new string('A', 500); // 500 character message
        var request = new SendMessageRequest
        {
            MessageContent = longMessage
        };
        var expectedResponse = new ChatMessageResponse
        {
            MessageContent = longMessage,
            SenderName = "Test User",
            SentAt = DateTime.UtcNow
        };

        _mockChatService
            .Setup(s => s.SendMessageAsync(clubId, 1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SendMessage(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result.Result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));

        _mockChatService.Verify(
            s => s.SendMessageAsync(clubId, 1, request),
            Times.Once);
    }

    #endregion

    #region CheckChatAccess Tests

    [Test]
    public async Task CheckChatAccess_WithValidAccess_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var expectedResponse = new ChatAccessResponse
        {
            HasAccess = true,
            IsChatEnabled = true
        };

        _mockChatService
            .Setup(s => s.HasChatAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockChatService
            .Setup(s => s.IsChatEnabledAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckChatAccess(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        var response = okResult.Value as ChatAccessResponse;

        Assert.That(response, Is.Not.Null);
        Assert.That(response.HasAccess, Is.True);
        Assert.That(response.IsChatEnabled, Is.True);

        _mockChatService.Verify(s => s.HasChatAccessAsync(clubId, 1), Times.Once);
        _mockChatService.Verify(s => s.IsChatEnabledAsync(clubId), Times.Once);
    }

    [Test]
    public async Task CheckChatAccess_WithNoAccess_ReturnsOkWithFalse()
    {
        // Arrange
        var clubId = 1;

        _mockChatService
            .Setup(s => s.HasChatAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        _mockChatService
            .Setup(s => s.IsChatEnabledAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckChatAccess(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        var response = okResult.Value as ChatAccessResponse;

        Assert.That(response, Is.Not.Null);
        Assert.That(response.HasAccess, Is.False);
        Assert.That(response.IsChatEnabled, Is.True);
    }

    [Test]
    public async Task CheckChatAccess_WithChatDisabled_ReturnsOkWithDisabled()
    {
        // Arrange
        var clubId = 1;

        _mockChatService
            .Setup(s => s.HasChatAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockChatService
            .Setup(s => s.IsChatEnabledAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CheckChatAccess(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        var response = okResult.Value as ChatAccessResponse;

        Assert.That(response, Is.Not.Null);
        Assert.That(response.HasAccess, Is.True);
        Assert.That(response.IsChatEnabled, Is.False);
    }

    #endregion
}