using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.API.Services;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class FeedbackControllerTests
{
    private FeedbackController _controller;
    private Mock<IFeedbackService> _mockFeedbackService;
    private Mock<ITurnstileVerificationService> _mockTurnstileVerificationService;
    private Mock<IMarketingLeadRateLimiter> _mockRateLimiter;
    private Mock<ILogger<FeedbackController>> _mockLogger;
    private IConfiguration _configuration;

    [SetUp]
    public void Setup()
    {
        _mockFeedbackService = new Mock<IFeedbackService>();
        _mockTurnstileVerificationService = new Mock<ITurnstileVerificationService>();
        _mockRateLimiter = new Mock<IMarketingLeadRateLimiter>();
        _mockLogger = new Mock<ILogger<FeedbackController>>();
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TrustedProxy"] = "false"
            })
            .Build();

        _mockTurnstileVerificationService
            .Setup(x => x.VerifyAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _mockRateLimiter
            .Setup(x => x.CheckAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MarketingLeadRateLimitResult.Allowed);

        _controller = new FeedbackController(
            _mockFeedbackService.Object,
            _mockTurnstileVerificationService.Object,
            _mockRateLimiter.Object,
            _configuration,
            _mockLogger.Object);

        // Setup mock HTTP context with request headers
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["User-Agent"] = "Test Browser/1.0";
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };
    }

    #region SubmitFeedback Tests - Anonymous User

    [Test]
    public async Task SubmitFeedback_ValidRequest_AnonymousUser_ReturnsOk()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Feature Request",
            Message = "Would love to see Light-Only Mode support!",
            Name = "John Doe",
            Email = "john@example.com",
            Platform = "web",
            PageUrl = "https://gathergrove.club/dashboard",
            TurnstileToken = "token"
        };

        var expectedResponse = new AppFeedbackResponse
        {
            Success = true,
            Message = "Thank you for your feedback!",
            FeedbackId = 1
        };

        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        var response = okResult.Value as AppFeedbackResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.Success, Is.True);
        Assert.That(response.FeedbackId, Is.EqualTo(1));
    }

    [Test]
    public async Task SubmitFeedback_ValidRequest_AuthenticatedUser_ReturnsOk()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "123")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = claimsPrincipal };
        httpContext.Request.Headers["User-Agent"] = "Test Browser/1.0";
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 4,
            Subject = "Bug Report",
            Message = "Found an issue with the event page loading slowly",
            Platform = "mobile"
        };

        var expectedResponse = new AppFeedbackResponse
        {
            Success = true,
            Message = "Thank you for your feedback!",
            FeedbackId = 2
        };

        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.Is<SubmitAppFeedbackRequest>(r => r.Subject == "Bug Report"),
                It.Is<int?>(id => id == 123),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        var response = okResult?.Value as AppFeedbackResponse;
        Assert.That(response?.Success, Is.True);
        Assert.That(response?.FeedbackId, Is.EqualTo(2));
    }

    [Test]
    public async Task SubmitFeedback_ServiceReturnsFailure_ReturnsBadRequest()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 3,
            Subject = "General Feedback",
            Message = "Just wanted to share my thoughts on the platform",
            Platform = "web",
            TurnstileToken = "token"
        };

        var failureResponse = new AppFeedbackResponse
        {
            Success = false,
            Message = "Rate limit exceeded. Please try again later."
        };

        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task SubmitFeedback_ServiceThrowsException_Returns500()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Feature Request",
            Message = "This is a test feedback message",
            Platform = "web",
            TurnstileToken = "token"
        };

        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region Rating Validation Tests

    [Test]
    public async Task SubmitFeedback_MinimumRating_ReturnsOk()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 1,
            Subject = "General Feedback",
            Message = "Not satisfied with the experience at all",
            Platform = "web",
            TurnstileToken = "token"
        };

        var expectedResponse = new AppFeedbackResponse { Success = true, FeedbackId = 3 };
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task SubmitFeedback_MaximumRating_ReturnsOk()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "General Feedback",
            Message = "Absolutely love this platform! Great work!",
            Platform = "web",
            TurnstileToken = "token"
        };

        var expectedResponse = new AppFeedbackResponse { Success = true, FeedbackId = 4 };
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    #endregion

    #region Subject Tests

    [Test]
    public async Task SubmitFeedback_AllSubjectOptions_ReturnsOk()
    {
        // Arrange
        var subjects = new[]
        {
            "Feature Request",
            "Bug Report",
            "General Feedback",
            "Usability Issue",
            "Performance Issue",
            "Other"
        };

        foreach (var subject in subjects)
        {
            var request = new SubmitAppFeedbackRequest
            {
                Rating = 3,
                Subject = subject,
                Message = $"Test message for {subject}",
                Platform = "web",
                TurnstileToken = "token"
            };

            var expectedResponse = new AppFeedbackResponse { Success = true };
            _mockFeedbackService
                .Setup(x => x.SubmitFeedbackAsync(
                    It.Is<SubmitAppFeedbackRequest>(r => r.Subject == subject),
                    It.IsAny<int?>(),
                    It.IsAny<string?>(),
                    It.IsAny<string?>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.SubmitFeedback(request);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>(),
                $"Failed for subject: {subject}");
        }
    }

    #endregion

    #region Platform Tests

    [Test]
    public async Task SubmitFeedback_WebPlatform_ReturnsOk()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 4,
            Subject = "Feature Request",
            Message = "Testing from web platform",
            Platform = "web",
            TurnstileToken = "token"
        };

        var expectedResponse = new AppFeedbackResponse { Success = true };
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.Is<SubmitAppFeedbackRequest>(r => r.Platform == "web"),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task SubmitFeedback_MobilePlatform_ReturnsOk()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 4,
            Subject = "Feature Request",
            Message = "Testing from mobile platform",
            Platform = "mobile"
        };

        var expectedResponse = new AppFeedbackResponse { Success = true };
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.Is<SubmitAppFeedbackRequest>(r => r.Platform == "mobile"),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    #endregion

    #region IP and User-Agent Extraction Tests

    [Test]
    public async Task SubmitFeedback_ExtractsClientIpFromConnection()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.100");
        httpContext.Request.Headers["User-Agent"] = "TestAgent";

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Test",
            Message = "Testing IP extraction",
            Platform = "web",
            TurnstileToken = "token"
        };

        string? capturedIp = null;
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .Callback<SubmitAppFeedbackRequest, int?, string?, string?>((_, _, ip, _) => capturedIp = ip)
            .ReturnsAsync(new AppFeedbackResponse { Success = true });

        // Act
        await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(capturedIp, Is.EqualTo("192.168.1.100"));
    }

    [Test]
    public async Task SubmitFeedback_DoesNotTrustForwardedIpByDefault()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.100");
        httpContext.Request.Headers["X-Forwarded-For"] = "203.0.113.195, 70.41.3.18, 150.172.238.178";
        httpContext.Request.Headers["User-Agent"] = "TestAgent";

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Test",
            Message = "Testing X-Forwarded-For extraction",
            Platform = "web",
            TurnstileToken = "token"
        };

        string? capturedIp = null;
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .Callback<SubmitAppFeedbackRequest, int?, string?, string?>((_, _, ip, _) => capturedIp = ip)
            .ReturnsAsync(new AppFeedbackResponse { Success = true });

        // Act
        await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(capturedIp, Is.EqualTo("192.168.1.100"));
    }

    [Test]
    public async Task SubmitFeedback_TrustedProxyConfigured_ExtractsIpFromXForwardedForHeader()
    {
        // Arrange
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TrustedProxy"] = "true",
                ["TrustedProxy:KnownProxies:0"] = "192.168.1.100"
            })
            .Build();
        _controller = new FeedbackController(
            _mockFeedbackService.Object,
            _mockTurnstileVerificationService.Object,
            _mockRateLimiter.Object,
            _configuration,
            _mockLogger.Object);

        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.100");
        httpContext.Request.Headers["X-Forwarded-For"] = "203.0.113.195, 70.41.3.18, 150.172.238.178";
        httpContext.Request.Headers["User-Agent"] = "TestAgent";

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Test",
            Message = "Testing X-Forwarded-For extraction",
            Platform = "web",
            TurnstileToken = "token"
        };

        string? capturedIp = null;
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .Callback<SubmitAppFeedbackRequest, int?, string?, string?>((_, _, ip, _) => capturedIp = ip)
            .ReturnsAsync(new AppFeedbackResponse { Success = true });

        // Act
        await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(capturedIp, Is.EqualTo("203.0.113.195"));
    }

    [Test]
    public async Task SubmitFeedback_ExtractsUserAgent()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "Test",
            Message = "Testing user agent extraction",
            Platform = "web",
            TurnstileToken = "token"
        };

        string? capturedUserAgent = null;
        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .Callback<SubmitAppFeedbackRequest, int?, string?, string?>((_, _, _, ua) => capturedUserAgent = ua)
            .ReturnsAsync(new AppFeedbackResponse { Success = true });

        // Act
        await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(capturedUserAgent, Does.Contain("Mozilla"));
    }

    #endregion

    #region Public Abuse Controls

    [Test]
    public async Task SubmitFeedback_HoneypotFilled_ReturnsSuccessWithoutCallingService()
    {
        // Arrange
        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "General Feedback",
            Message = "This is a spam bot filling the hidden field",
            Platform = "web",
            CompanyWebsite = "https://spam.example",
            TurnstileToken = "token"
        };

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        _mockTurnstileVerificationService.Verify(
            x => x.VerifyAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _mockRateLimiter.Verify(
            x => x.CheckAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _mockFeedbackService.Verify(
            x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()),
            Times.Never);
    }

    [Test]
    public async Task SubmitFeedback_AnonymousTurnstileFails_ReturnsForbiddenBeforeService()
    {
        // Arrange
        _mockTurnstileVerificationService
            .Setup(x => x.VerifyAsync("bad-token", It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "General Feedback",
            Message = "This feedback should not reach the service",
            Platform = "web",
            TurnstileToken = "bad-token"
        };

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result.Result!;
        Assert.That(objectResult.StatusCode, Is.EqualTo(StatusCodes.Status403Forbidden));
        _mockFeedbackService.Verify(
            x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()),
            Times.Never);
    }

    [Test]
    public async Task SubmitFeedback_AnonymousRateLimitExceeded_ReturnsTooManyRequestsBeforeService()
    {
        // Arrange
        _mockRateLimiter
            .Setup(x => x.CheckAsync("john@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(MarketingLeadRateLimitResult.Denied(TimeSpan.FromMinutes(5)));

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 5,
            Subject = "General Feedback",
            Message = "This feedback should be rate limited",
            Email = "john@example.com",
            Platform = "web",
            TurnstileToken = "token"
        };

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result.Result!;
        Assert.That(objectResult.StatusCode, Is.EqualTo(StatusCodes.Status429TooManyRequests));
        _mockFeedbackService.Verify(
            x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()),
            Times.Never);
    }

    [Test]
    public async Task SubmitFeedback_AuthenticatedUser_BypassesTurnstileAndAnonymousLimiter()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "123")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = claimsPrincipal };
        httpContext.Request.Headers["User-Agent"] = "Test Browser/1.0";
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };

        var request = new SubmitAppFeedbackRequest
        {
            Rating = 4,
            Subject = "Bug Report",
            Message = "Found an issue with the event page loading slowly",
            Platform = "web"
        };

        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(
                It.IsAny<SubmitAppFeedbackRequest>(),
                123,
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new AppFeedbackResponse { Success = true });

        // Act
        var result = await _controller.SubmitFeedback(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        _mockTurnstileVerificationService.Verify(
            x => x.VerifyAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _mockRateLimiter.Verify(
            x => x.CheckAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion
}
