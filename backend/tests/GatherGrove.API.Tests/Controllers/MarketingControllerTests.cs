using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.API.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using DataAnnotationValidationResult = System.ComponentModel.DataAnnotations.ValidationResult;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MarketingControllerTests
{
    private Mock<IMarketingService> _marketingServiceMock = null!;
    private Mock<IPdfGenerationService> _pdfGenerationServiceMock = null!;
    private Mock<ITurnstileVerificationService> _turnstileVerificationServiceMock = null!;
    private Mock<IMarketingLeadRateLimiter> _leadRateLimiterMock = null!;
    private IConfiguration _configuration = null!;
    private Mock<ILogger<MarketingController>> _loggerMock = null!;
    private MarketingController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _marketingServiceMock = new Mock<IMarketingService>();
        _pdfGenerationServiceMock = new Mock<IPdfGenerationService>();
        _turnstileVerificationServiceMock = new Mock<ITurnstileVerificationService>();
        _leadRateLimiterMock = new Mock<IMarketingLeadRateLimiter>();
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Turnstile:SiteKey"] = "test-site-key"
            })
            .Build();
        _loggerMock = new Mock<ILogger<MarketingController>>();

        _turnstileVerificationServiceMock
            .Setup(s => s.VerifyAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _leadRateLimiterMock
            .Setup(s => s.CheckAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MarketingLeadRateLimitResult.Allowed);

        _controller = new MarketingController(
            _marketingServiceMock.Object,
            _pdfGenerationServiceMock.Object,
            _turnstileVerificationServiceMock.Object,
            _leadRateLimiterMock.Object,
            _configuration,
            _loggerMock.Object);

        // Setup default HTTP context (endpoints are AllowAnonymous)
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    #region CaptureLeadAsync Tests

    [Test]
    public void GetTurnstileSiteKey_Configured_ReturnsPublicSiteKey()
    {
        // Act
        var result = _controller.GetTurnstileSiteKey();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        okResult.Value.Should().BeEquivalentTo(new { siteKey = "test-site-key" });
    }

    [Test]
    public void CaptureLeadRequest_InvalidSource_FailsValidation()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "test@example.com",
            Source = "attacker-controlled-source"
        };
        var validationResults = new List<DataAnnotationValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            validationResults,
            validateAllProperties: true);

        // Assert
        isValid.Should().BeFalse();
        validationResults.Should().Contain(r => r.MemberNames.Contains(nameof(CaptureLeadRequest.Source)));
    }

    [Test]
    public async Task CaptureLeadAsync_ValidRequest_ReturnsOkWithResponse()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "test@example.com",
            Name = "Test User",
            Source = "newsletter"
        };

        var expectedResponse = new CaptureLeadResponse
        {
            Success = true,
            Message = "Thank you for signing up!",
            LeadId = "lead-12345"
        };

        _marketingServiceMock
            .Setup(s => s.CaptureLeadAsync(request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CaptureLeadAsync(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as CaptureLeadResponse;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.Message.Should().Be("Thank you for signing up!");
        response.LeadId.Should().Be("lead-12345");
    }

    [Test]
    public async Task CaptureLeadAsync_InvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "test@example.com",
            Source = "newsletter"
        };

        _controller.ModelState.AddModelError("Email", "Required field");

        // Act
        var result = await _controller.CaptureLeadAsync(request);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task CaptureLeadAsync_ServiceThrowsException_Returns500WithErrorResponse()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "test@example.com",
            Source = "newsletter"
        };

        _marketingServiceMock
            .Setup(s => s.CaptureLeadAsync(request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CaptureLeadAsync(request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var response = statusCodeResult.Value as CaptureLeadResponse;
        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
        response.Message.Should().Be("An error occurred while processing your request.");
    }

    [Test]
    public async Task CaptureLeadAsync_HoneypotFilled_ReturnsSuccessWithoutCallingService()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "bot@example.com",
            Source = "lead-magnet",
            CompanyWebsite = "https://spam.example"
        };

        // Act
        var result = await _controller.CaptureLeadAsync(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as CaptureLeadResponse;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();

        _turnstileVerificationServiceMock.Verify(s => s.VerifyAsync(
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _leadRateLimiterMock.Verify(s => s.CheckAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _marketingServiceMock.Verify(s => s.CaptureLeadAsync(It.IsAny<CaptureLeadRequest>()), Times.Never);
    }

    [Test]
    public async Task CaptureLeadAsync_TurnstileFails_ReturnsForbiddenBeforeLeadCapture()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "human@example.com",
            Source = "lead-magnet",
            TurnstileToken = null
        };
        _turnstileVerificationServiceMock
            .Setup(s => s.VerifyAsync(null, It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CaptureLeadAsync(request);

        // Assert
        var forbidden = result.Result as ObjectResult;
        forbidden.Should().NotBeNull();
        forbidden!.StatusCode.Should().Be(StatusCodes.Status403Forbidden);

        _leadRateLimiterMock.Verify(s => s.CheckAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _marketingServiceMock.Verify(s => s.CaptureLeadAsync(It.IsAny<CaptureLeadRequest>()), Times.Never);
    }

    [Test]
    public async Task CaptureLeadAsync_TrustedProxyConfigured_PassesForwardedClientIpToTurnstile()
    {
        // Arrange
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Turnstile:SiteKey"] = "test-site-key",
                ["TrustedProxy"] = "true",
                ["TrustedProxy:KnownProxies:0"] = "192.168.1.100"
            })
            .Build();

        _controller = new MarketingController(
            _marketingServiceMock.Object,
            _pdfGenerationServiceMock.Object,
            _turnstileVerificationServiceMock.Object,
            _leadRateLimiterMock.Object,
            _configuration,
            _loggerMock.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.HttpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.100");
        _controller.Request.Headers["CF-Connecting-IP"] = "203.0.113.44";

        var request = new CaptureLeadRequest
        {
            Email = "human@example.com",
            Source = "lead-magnet",
            TurnstileToken = "valid-token"
        };

        _marketingServiceMock
            .Setup(s => s.CaptureLeadAsync(request))
            .ReturnsAsync(new CaptureLeadResponse
            {
                Success = true,
                Message = "ok",
                LeadId = "lead-1"
            });

        // Act
        await _controller.CaptureLeadAsync(request);

        // Assert
        _turnstileVerificationServiceMock.Verify(s => s.VerifyAsync(
            "valid-token",
            "203.0.113.44",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task CaptureLeadAsync_PerEmailLimitExceeded_ReturnsTooManyRequestsBeforeLeadCapture()
    {
        // Arrange
        var request = new CaptureLeadRequest
        {
            Email = "target@example.com",
            Source = "lead-magnet",
            TurnstileToken = "valid-token"
        };
        _leadRateLimiterMock
            .Setup(s => s.CheckAsync("target@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(MarketingLeadRateLimitResult.Denied(TimeSpan.FromMinutes(10)));

        // Act
        var result = await _controller.CaptureLeadAsync(request);

        // Assert
        var tooManyRequests = result.Result as ObjectResult;
        tooManyRequests.Should().NotBeNull();
        tooManyRequests!.StatusCode.Should().Be(StatusCodes.Status429TooManyRequests);
        _controller.Response.Headers.RetryAfter.Should().Contain("600");

        _marketingServiceMock.Verify(s => s.CaptureLeadAsync(It.IsAny<CaptureLeadRequest>()), Times.Never);
    }

    #endregion

    #region TrackEventAsync Tests

    [Test]
    public async Task TrackEventAsync_ValidRequest_ReturnsOkWithSuccess()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "page_view",
            Url = "https://example.com/home"
        };

        _marketingServiceMock
            .Setup(s => s.TrackEventAsync(request))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.TrackEventAsync(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var successProperty = value!.GetType().GetProperty("success");
        successProperty.Should().NotBeNull();
        successProperty!.GetValue(value).Should().Be(true);
    }

    [Test]
    public async Task TrackEventAsync_InvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "page_view"
        };

        _controller.ModelState.AddModelError("Url", "Required field");

        // Act
        var result = await _controller.TrackEventAsync(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task TrackEventAsync_ServiceThrowsException_ReturnsOkWithSuccessFalse()
    {
        // Arrange
        var request = new TrackAnalyticsRequest
        {
            EventName = "page_view",
            Url = "https://example.com/home"
        };

        _marketingServiceMock
            .Setup(s => s.TrackEventAsync(request))
            .ThrowsAsync(new Exception("Analytics service error"));

        // Act
        var result = await _controller.TrackEventAsync(request);

        // Assert - Analytics failures are silent, returns Ok with success: false
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var successProperty = value!.GetType().GetProperty("success");
        successProperty!.GetValue(value).Should().Be(false);
    }

    #endregion

    #region GetLeadMagnetAsync Tests

    [Test]
    public async Task GetLeadMagnetAsync_ValidType_ReturnsOkWithDownloadInfo()
    {
        // Arrange
        var type = "club-management-checklist";
        var expectedUrl = "https://cdn.example.com/checklist.pdf";
        var expectedFileName = "Ultimate Club Management Checklist.pdf";

        _marketingServiceMock
            .Setup(s => s.GetLeadMagnetAsync(type))
            .ReturnsAsync((expectedUrl, expectedFileName));

        // Act
        var result = await _controller.GetLeadMagnetAsync(type);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var downloadUrlProperty = value!.GetType().GetProperty("downloadUrl");
        downloadUrlProperty.Should().NotBeNull();
        downloadUrlProperty!.GetValue(value).Should().Be(expectedUrl);

        var fileNameProperty = value.GetType().GetProperty("fileName");
        fileNameProperty.Should().NotBeNull();
        fileNameProperty!.GetValue(value).Should().Be(expectedFileName);
    }

    [Test]
    public async Task GetLeadMagnetAsync_InvalidType_ReturnsNotFound()
    {
        // Arrange
        var type = "invalid-type";

        _marketingServiceMock
            .Setup(s => s.GetLeadMagnetAsync(type))
            .ThrowsAsync(new ArgumentException("Invalid lead magnet type"));

        // Act
        var result = await _controller.GetLeadMagnetAsync(type);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task GetLeadMagnetAsync_ServiceThrowsException_Returns500()
    {
        // Arrange
        var type = "club-management-checklist";

        _marketingServiceMock
            .Setup(s => s.GetLeadMagnetAsync(type))
            .ThrowsAsync(new Exception("CDN error"));

        // Act
        var result = await _controller.GetLeadMagnetAsync(type);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region DownloadTemplateAsync Tests

    [Test]
    public async Task DownloadTemplateAsync_ValidSlug_ReturnsPdfFile()
    {
        // Arrange
        var slug = "welcome-email-new-members";
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 }; // PDF magic numbers

        _pdfGenerationServiceMock
            .Setup(s => s.GenerateTemplatePdfAsync(slug))
            .ReturnsAsync(pdfContent);

        // Act
        var result = await _controller.DownloadTemplateAsync(slug);

        // Assert
        var fileResult = result as FileContentResult;
        fileResult.Should().NotBeNull();
        fileResult!.ContentType.Should().Be("application/pdf");
        fileResult.FileDownloadName.Should().EndWith(".pdf");
        fileResult.FileContents.Should().Equal(pdfContent);
    }

    [Test]
    public async Task DownloadTemplateAsync_ServiceThrowsException_Returns500()
    {
        // Arrange
        var slug = "some-template";

        _pdfGenerationServiceMock
            .Setup(s => s.GenerateTemplatePdfAsync(slug))
            .ThrowsAsync(new Exception("PDF generation failed"));

        // Act
        var result = await _controller.DownloadTemplateAsync(slug);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    [Test]
    public async Task DownloadTemplateAsync_SlugIsPassedToService()
    {
        // Arrange
        var slug = "master-event-planning-checklist";
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 };

        _pdfGenerationServiceMock
            .Setup(s => s.GenerateTemplatePdfAsync(slug))
            .ReturnsAsync(pdfContent);

        // Act
        await _controller.DownloadTemplateAsync(slug);

        // Assert — service was called with the exact slug
        _pdfGenerationServiceMock.Verify(s => s.GenerateTemplatePdfAsync(slug), Times.Once);
    }

    [Test]
    public async Task DownloadTemplateAsync_FileNameDerivedFromSlug()
    {
        // Arrange
        var slug = "annual-budget-planning-template";
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 };

        _pdfGenerationServiceMock
            .Setup(s => s.GenerateTemplatePdfAsync(slug))
            .ReturnsAsync(pdfContent);

        // Act
        var result = await _controller.DownloadTemplateAsync(slug);

        // Assert — filename contains the template name
        var fileResult = result as FileContentResult;
        fileResult.Should().NotBeNull();
        fileResult!.FileDownloadName.Should().Contain("Annual");
        fileResult.FileDownloadName.Should().EndWith(".pdf");
    }

    #endregion

    #region DownloadClubManagementChecklistAsync Tests

    [Test]
    public async Task DownloadClubManagementChecklistAsync_Success_ReturnsPdfFile()
    {
        // Arrange
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 }; // PDF magic numbers

        _pdfGenerationServiceMock
            .Setup(s => s.GenerateClubManagementChecklistPdfAsync())
            .ReturnsAsync(pdfContent);

        // Act
        var result = await _controller.DownloadClubManagementChecklistAsync();

        // Assert
        var fileResult = result as FileContentResult;
        fileResult.Should().NotBeNull();
        fileResult!.ContentType.Should().Be("application/pdf");
        fileResult.FileDownloadName.Should().Be("Ultimate Club Management Checklist.pdf");
        fileResult.FileContents.Should().Equal(pdfContent);
    }

    [Test]
    public async Task DownloadClubManagementChecklistAsync_ServiceThrowsException_Returns500()
    {
        // Arrange
        _pdfGenerationServiceMock
            .Setup(s => s.GenerateClubManagementChecklistPdfAsync())
            .ThrowsAsync(new Exception("PDF generation failed"));

        // Act
        var result = await _controller.DownloadClubManagementChecklistAsync();

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
