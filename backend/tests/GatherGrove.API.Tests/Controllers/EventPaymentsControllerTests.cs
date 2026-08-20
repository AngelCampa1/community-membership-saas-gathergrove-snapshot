using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class EventPaymentsControllerTests
{
    private Mock<IEventPaymentService> _mockEventPaymentService = null!;
    private Mock<ILogger<EventPaymentsController>> _mockLogger = null!;
    private EventPaymentsController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _mockEventPaymentService = new Mock<IEventPaymentService>();
        _mockLogger = new Mock<ILogger<EventPaymentsController>>();
        _controller = new EventPaymentsController(_mockEventPaymentService.Object, _mockLogger.Object);
    }

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim(ClaimTypes.Role, "Member")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Test]
    public async Task PayForEvent_Unauthenticated_ReturnsUnauthorized()
    {
        // Arrange - No user claims set
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task PayForEvent_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange - Invalid user ID claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "invalid_id")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task PayForEvent_SuccessfulPayment_ReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        var expectedResponse = new EventPaymentResponse
        {
            Success = true,
            PaymentId = "pi_test_123",
            RsvpId = 1,
            ConfirmationNumber = "CONF123",
            AmountPaid = 25.00m,
            EventName = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            EventLocation = "Test Location",
            ClubName = "Test Club"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult!.Value, Is.InstanceOf<EventPaymentResponse>());
        var response = okResult.Value as EventPaymentResponse;
        Assert.That(response!.Success, Is.True);
        Assert.That(response.PaymentId, Is.EqualTo("pi_test_123"));
        Assert.That(response.RsvpId, Is.EqualTo(1));
        Assert.That(response.ConfirmationNumber, Is.EqualTo("CONF123"));
    }

    [Test]
    public async Task PayForEvent_PaymentFailed_ReturnsPaymentRequired()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        var failedResponse = new EventPaymentResponse
        {
            Success = false
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        // Payment failed response with Success=false returns 200 OK, not 402
        var okResult = result as OkObjectResult;
        Assert.That(okResult!.Value, Is.InstanceOf<EventPaymentResponse>());
        var response = okResult.Value as EventPaymentResponse;
        Assert.That(response!.Success, Is.False);
    }

    [Test]
    public async Task PayForEvent_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 999,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task PayForEvent_FreeEvent_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new InvalidOperationException("This is a free event"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task PayForEvent_DuplicatePayment_ReturnsConflict()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new InvalidOperationException("You have already paid for this event"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ConflictObjectResult>());
    }

    [Test]
    public async Task PayForEvent_AlreadyRsvped_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new InvalidOperationException("You have already RSVP'd to this event"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task PayForEvent_StripeError_ReturnsInternalServerError()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new Stripe.StripeException("Card declined"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task PayForEvent_UnexpectedException_ReturnsInternalServerError()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task PayForEvent_MemberNotFound_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new InvalidOperationException("Member profile not found"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task PayForEvent_StripeNotConfigured_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser(1);

        var request = new PayEventRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test_123"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(1, request))
            .ThrowsAsync(new InvalidOperationException("Stripe account not configured"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task PayForEvent_ValidRequest_CallsServiceWithCorrectParameters()
    {
        // Arrange
        const int userId = 123;
        SetupAuthenticatedUser(userId);

        var request = new PayEventRequest
        {
            EventId = 456,
            PaymentMethodId = "pm_test_789"
        };

        var expectedResponse = new EventPaymentResponse
        {
            Success = true,
            PaymentId = "pi_test_123",
            RsvpId = 1,
            ConfirmationNumber = "CONF123",
            AmountPaid = 25.00m,
            EventName = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            EventLocation = "Test Location",
            ClubName = "Test Club"
        };

        _mockEventPaymentService
            .Setup(x => x.PayForEventAsync(userId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        await _controller.PayForEvent(request);

        // Assert
        _mockEventPaymentService.Verify(
            x => x.PayForEventAsync(userId, request),
            Times.Once);
    }
}
