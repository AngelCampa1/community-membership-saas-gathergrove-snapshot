using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Moq;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class ErrorsControllerTests
{
    private Mock<IErrorLoggingService> _errorLoggingServiceMock = null!;
    private Mock<IWebHostEnvironment> _environmentMock = null!;
    private ErrorsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _errorLoggingServiceMock = new Mock<IErrorLoggingService>();
        _environmentMock = new Mock<IWebHostEnvironment>();

        _controller = new ErrorsController(
            _errorLoggingServiceMock.Object,
            _environmentMock.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    #region LogError Tests

    [Test]
    public async Task LogError_DevelopmentEnvironment_ValidRequest_ReturnsOk()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
        var request = new FrontendErrorLogRequest
        {
            Level = "Error",
            Message = "Test error message",
            StackTrace = "at TestComponent.render()",
            UserId = "user-123",
            UserAgent = "Mozilla/5.0",
            Url = "/test-page",
            AdditionalData = new Dictionary<string, object>
            {
                { "browser", "Chrome" },
                { "version", "120" }
            }
        };

        _errorLoggingServiceMock
            .Setup(s => s.LogErrorAsync(
                request.Message,
                "Frontend",
                request.StackTrace,
                request.Level,
                null,
                null,
                request.UserId,
                request.UserAgent,
                null,
                null,
                request.AdditionalData))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.LogError(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Error logged successfully");

        _errorLoggingServiceMock.Verify(
            s => s.LogErrorAsync(
                request.Message,
                "Frontend",
                request.StackTrace,
                request.Level,
                null,
                null,
                request.UserId,
                request.UserAgent,
                null,
                null,
                request.AdditionalData),
            Times.Once);
    }

    [Test]
    public async Task LogError_DevelopmentEnvironment_MinimalRequest_ReturnsOk()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
        var request = new FrontendErrorLogRequest
        {
            Message = "Simple error"
        };

        _errorLoggingServiceMock
            .Setup(s => s.LogErrorAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<Dictionary<string, object>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.LogError(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task LogError_ProductionEnvironment_ReturnsNotFound()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);
        var request = new FrontendErrorLogRequest
        {
            Message = "Error in production"
        };

        // Act
        var result = await _controller.LogError(request);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
        var notFoundResult = result as NotFoundResult;
        notFoundResult!.StatusCode.Should().Be(404);

        // Verify service was never called in production
        _errorLoggingServiceMock.Verify(
            s => s.LogErrorAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<Dictionary<string, object>>()),
            Times.Never);
    }

    [Test]
    public async Task LogError_StagingEnvironment_ReturnsNotFound()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Staging);
        var request = new FrontendErrorLogRequest
        {
            Message = "Error in staging"
        };

        // Act
        var result = await _controller.LogError(request);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
        var notFoundResult = result as NotFoundResult;
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task LogError_ServiceThrowsException_Returns500()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
        var request = new FrontendErrorLogRequest
        {
            Message = "Test error"
        };

        _errorLoggingServiceMock
            .Setup(s => s.LogErrorAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<Dictionary<string, object>>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.LogError(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Failed to log error");
    }

    [Test]
    public async Task LogError_WithWarningLevel_LogsCorrectly()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
        var request = new FrontendErrorLogRequest
        {
            Level = "Warning",
            Message = "Warning message"
        };

        _errorLoggingServiceMock
            .Setup(s => s.LogErrorAsync(
                request.Message,
                "Frontend",
                request.StackTrace,
                request.Level,
                null,
                null,
                request.UserId,
                request.UserAgent,
                null,
                null,
                request.AdditionalData))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.LogError(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        _errorLoggingServiceMock.Verify(
            s => s.LogErrorAsync(
                request.Message,
                "Frontend",
                request.StackTrace,
                "Warning", // Verify correct level was passed
                null,
                null,
                request.UserId,
                request.UserAgent,
                null,
                null,
                request.AdditionalData),
            Times.Once);
    }

    [Test]
    public async Task LogError_WithComplexAdditionalData_LogsCorrectly()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
        var additionalData = new Dictionary<string, object>
        {
            { "componentName", "ErrorBoundary" },
            { "errorCount", 5 },
            { "timestamp", DateTime.UtcNow },
            { "userActions", new[] { "click", "scroll", "submit" } }
        };

        var request = new FrontendErrorLogRequest
        {
            Message = "Component error",
            AdditionalData = additionalData
        };

        _errorLoggingServiceMock
            .Setup(s => s.LogErrorAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.Is<Dictionary<string, object>>(d => d == additionalData)))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.LogError(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        _errorLoggingServiceMock.Verify(
            s => s.LogErrorAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.Is<Dictionary<string, object>>(d => d == additionalData)),
            Times.Once);
    }

    #endregion
}
