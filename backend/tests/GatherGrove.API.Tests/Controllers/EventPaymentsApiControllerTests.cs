using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class EventPaymentsApiControllerTests
{
    private Mock<IEventPaymentService> _eventPaymentServiceMock = null!;
    private Mock<IClubAuthorizationService> _clubAuthorizationServiceMock = null!;
    private Mock<ILogger<EventPaymentsApiController>> _loggerMock = null!;
    private EventPaymentsApiController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _eventPaymentServiceMock = new Mock<IEventPaymentService>();
        _clubAuthorizationServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<EventPaymentsApiController>>();
        _clubAuthorizationServiceMock
            .Setup(s => s.GetClubIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns(1);
        _clubAuthorizationServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), 1))
            .ReturnsAsync(true);

        _controller = new EventPaymentsApiController(
            _eventPaymentServiceMock.Object,
            _clubAuthorizationServiceMock.Object,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1, clubId: 1);
    }

    private void SetupAuthenticatedUser(int userId, int clubId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "Member"),
            new("ClubId", clubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupUnauthenticatedUser()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "Member")
            // No NameIdentifier or ClubId claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region ProcessEventPayment Tests

    [Test]
    public async Task ProcessEventPayment_ValidRequest_ReturnsOkWithPaymentResponse()
    {
        // Arrange
        var userId = 1;
        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        var expectedResponse = new EventPaymentResponse
        {
            Success = true,
            PaymentId = "pi_test_123456",
            RsvpId = 100,
            ConfirmationNumber = "CONF-ABC123",
            AmountPaid = 50.00m,
            EventName = "Annual Gala",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            EventLocation = "Grand Ballroom",
            ClubName = "Test Club"
        };

        _eventPaymentServiceMock
            .Setup(s => s.PayForEventAsync(userId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as EventPaymentResponse;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.PaymentId.Should().Be("pi_test_123456");
        response.RsvpId.Should().Be(100);
        response.ConfirmationNumber.Should().Be("CONF-ABC123");
        response.AmountPaid.Should().Be(50.00m);
        response.EventName.Should().Be("Annual Gala");
    }

    [Test]
    public async Task ProcessEventPayment_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Invalid authentication token");

        // Verify service was never called
        _eventPaymentServiceMock.Verify(
            s => s.PayForEventAsync(It.IsAny<int>(), It.IsAny<PayEventRequest>()),
            Times.Never);
    }

    [Test]
    public async Task ProcessEventPayment_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid-user-id"), // Non-numeric
            new(ClaimTypes.Role, "Member"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _eventPaymentServiceMock.Verify(
            s => s.PayForEventAsync(It.IsAny<int>(), It.IsAny<PayEventRequest>()),
            Times.Never);
    }

    [Test]
    public async Task ProcessEventPayment_NoClubIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "Member")
            // No ClubId claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid club authentication");

        _eventPaymentServiceMock.Verify(
            s => s.PayForEventAsync(It.IsAny<int>(), It.IsAny<PayEventRequest>()),
            Times.Never);
    }

    [Test]
    public async Task ProcessEventPayment_InvalidClubIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "Member"),
            new("ClubId", "invalid-club-id") // Non-numeric
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _eventPaymentServiceMock.Verify(
            s => s.PayForEventAsync(It.IsAny<int>(), It.IsAny<PayEventRequest>()),
            Times.Never);
    }

    [Test]
    public async Task ProcessEventPayment_ArgumentExceptionWithNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = 1;
        var request = new PayEventRequest
        {
            EventId = 999, // Non-existent event
            PaymentMethodId = "pm_test_123456"
        };

        _eventPaymentServiceMock
            .Setup(s => s.PayForEventAsync(userId, request))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Event not found");
    }

    [Test]
    public async Task ProcessEventPayment_ArgumentExceptionWithoutNotFound_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_invalid"
        };

        _eventPaymentServiceMock
            .Setup(s => s.PayForEventAsync(userId, request))
            .ThrowsAsync(new ArgumentException("Invalid payment method ID"));

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid payment method ID");
    }

    [Test]
    public async Task ProcessEventPayment_InvalidOperationExceptionWithAlreadyPaid_ReturnsConflict()
    {
        // Arrange
        var userId = 1;
        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        _eventPaymentServiceMock
            .Setup(s => s.PayForEventAsync(userId, request))
            .ThrowsAsync(new InvalidOperationException("User has already paid for this event"));

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var conflictResult = result as ConflictObjectResult;
        conflictResult.Should().NotBeNull();
        conflictResult!.StatusCode.Should().Be(409);

        var value = conflictResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("User has already paid for this event");
    }

    [Test]
    public async Task ProcessEventPayment_InvalidOperationExceptionWithoutAlreadyPaid_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        _eventPaymentServiceMock
            .Setup(s => s.PayForEventAsync(userId, request))
            .ThrowsAsync(new InvalidOperationException("Event registration is closed"));

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Event registration is closed");
    }

    [Test]
    public async Task ProcessEventPayment_GenericException_Returns500()
    {
        // Arrange
        var userId = 1;
        var request = new PayEventRequest
        {
            EventId = 10,
            PaymentMethodId = "pm_test_123456"
        };

        _eventPaymentServiceMock
            .Setup(s => s.PayForEventAsync(userId, request))
            .ThrowsAsync(new Exception("Stripe error"));

        // Act
        var result = await _controller.ProcessEventPayment(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while processing your payment. Please try again.");
    }

    #endregion

    #region GetEventPaymentHistory Tests

    [Test]
    public async Task GetEventPaymentHistory_ValidRequest_ReturnsOkWithPaymentList()
    {
        // Arrange
        var eventId = 10;
        var expectedPayments = new List<EventPaymentDetailsDto>
        {
            new()
            {
                RsvpId = 100,
                EventId = eventId,
                EventName = "Annual Gala",
                EventDateTime = DateTime.UtcNow.AddDays(30),
                MemberId = 5,
                Name = "John Doe",
                Email = "john@example.com",
                IsGuestRegistration = false,
                PaymentStatus = "Paid",
                AmountPaid = 50.00m,
                PaymentDate = DateTime.UtcNow.AddDays(-5),
                PaymentMethod = "stripe",
                StripePaymentIntentId = "pi_test_123",
                CanRefund = true,
                ClubId = 1,
                ClubName = "Test Club",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new()
            {
                RsvpId = 101,
                EventId = eventId,
                EventName = "Annual Gala",
                EventDateTime = DateTime.UtcNow.AddDays(30),
                MemberId = 6,
                Name = "Jane Smith",
                Email = "jane@example.com",
                IsGuestRegistration = false,
                PaymentStatus = "Paid",
                AmountPaid = 50.00m,
                PaymentDate = DateTime.UtcNow.AddDays(-3),
                PaymentMethod = "stripe",
                StripePaymentIntentId = "pi_test_456",
                CanRefund = true,
                ClubId = 1,
                ClubName = "Test Club",
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            }
        };

        _eventPaymentServiceMock
            .Setup(s => s.GetPaymentHistoryAsync(eventId, 1))
            .ReturnsAsync(expectedPayments);

        // Act
        var result = await _controller.GetEventPaymentHistory(eventId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var payments = okResult.Value as List<EventPaymentDetailsDto>;
        payments.Should().NotBeNull();
        payments.Should().HaveCount(2);
        payments![0].Name.Should().Be("John Doe");
        payments[0].AmountPaid.Should().Be(50.00m);
        payments[1].Name.Should().Be("Jane Smith");
    }

    [Test]
    public async Task GetEventPaymentHistory_NoPayments_ReturnsOkWithEmptyList()
    {
        // Arrange
        var eventId = 10;
        var expectedPayments = new List<EventPaymentDetailsDto>();

        _eventPaymentServiceMock
            .Setup(s => s.GetPaymentHistoryAsync(eventId, 1))
            .ReturnsAsync(expectedPayments);

        // Act
        var result = await _controller.GetEventPaymentHistory(eventId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var payments = okResult!.Value as List<EventPaymentDetailsDto>;
        payments.Should().NotBeNull();
        payments.Should().BeEmpty();
    }

    [Test]
    public async Task GetEventPaymentHistory_NonAdminClubAccess_ReturnsForbid()
    {
        // Arrange
        _clubAuthorizationServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventPaymentHistory(10);

        // Assert
        result.Should().BeOfType<ForbidResult>();
        _eventPaymentServiceMock.Verify(s => s.GetPaymentHistoryAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetEventPaymentHistory_GenericException_Returns500()
    {
        // Arrange
        var eventId = 10;

        _eventPaymentServiceMock
            .Setup(s => s.GetPaymentHistoryAsync(eventId, 1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventPaymentHistory(eventId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving payment history");
    }

    #endregion

    #region GetEventPaymentDetails Tests

    [Test]
    public async Task GetEventPaymentDetails_ValidPaymentId_ReturnsOkWithPaymentDetails()
    {
        // Arrange
        var paymentId = "pi_test_123456";
        var expectedPayment = new EventPaymentDetailsDto
        {
            RsvpId = 100,
            EventId = 10,
            EventName = "Annual Gala",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            MemberId = 5,
            Name = "John Doe",
            Email = "john@example.com",
            IsGuestRegistration = false,
            PaymentStatus = "Paid",
            AmountPaid = 50.00m,
            PaymentDate = DateTime.UtcNow.AddDays(-5),
            PaymentMethod = "stripe",
            StripePaymentIntentId = paymentId,
            CanRefund = true,
            ClubId = 1,
            ClubName = "Test Club",
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        };

        _eventPaymentServiceMock
            .Setup(s => s.GetPaymentDetailsAsync(paymentId, 1))
            .ReturnsAsync(expectedPayment);

        // Act
        var result = await _controller.GetEventPaymentDetails(paymentId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var payment = okResult.Value as EventPaymentDetailsDto;
        payment.Should().NotBeNull();
        payment!.StripePaymentIntentId.Should().Be(paymentId);
        payment.Name.Should().Be("John Doe");
        payment.AmountPaid.Should().Be(50.00m);
        payment.PaymentStatus.Should().Be("Paid");
    }

    [Test]
    public async Task GetEventPaymentDetails_PaymentNotFound_ReturnsNotFound()
    {
        // Arrange
        var paymentId = "pi_invalid_123";

        _eventPaymentServiceMock
            .Setup(s => s.GetPaymentDetailsAsync(paymentId, 1))
            .ReturnsAsync((EventPaymentDetailsDto?)null);

        // Act
        var result = await _controller.GetEventPaymentDetails(paymentId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Payment not found");
    }

    [Test]
    public async Task GetEventPaymentDetails_GenericException_Returns500()
    {
        // Arrange
        var paymentId = "pi_test_123456";

        _eventPaymentServiceMock
            .Setup(s => s.GetPaymentDetailsAsync(paymentId, 1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventPaymentDetails(paymentId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving payment details");
    }

    #endregion

    #region RefundEventPayment Tests

    [Test]
    public async Task RefundEventPayment_ValidRequest_ReturnsOkWithRefundResponse()
    {
        // Arrange
        var paymentId = "pi_test_123456";
        var request = new RefundRequest
        {
            Reason = "Customer requested refund"
        };

        var expectedResponse = new EventPaymentRefundResponse
        {
            Success = true,
            RefundId = "re_test_123456",
            RefundAmount = 50.00m,
            Currency = "USD",
            RefundStatus = "succeeded",
            Reason = request.Reason,
            RefundDate = DateTime.UtcNow,
            OriginalPaymentId = paymentId
        };

        _eventPaymentServiceMock
            .Setup(s => s.ProcessRefundAsync(paymentId, request.Reason, 1))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RefundEventPayment(paymentId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var refund = okResult.Value as EventPaymentRefundResponse;
        refund.Should().NotBeNull();
        refund!.Success.Should().BeTrue();
        refund.RefundId.Should().Be("re_test_123456");
        refund.RefundAmount.Should().Be(50.00m);
        refund.RefundStatus.Should().Be("succeeded");
        refund.Reason.Should().Be("Customer requested refund");
    }

    [Test]
    public async Task RefundEventPayment_KeyNotFoundException_ReturnsNotFound()
    {
        // Arrange
        var paymentId = "pi_invalid_123";
        var request = new RefundRequest
        {
            Reason = "Customer requested refund"
        };

        _eventPaymentServiceMock
            .Setup(s => s.ProcessRefundAsync(paymentId, request.Reason, 1))
            .ThrowsAsync(new KeyNotFoundException("Payment not found"));

        // Act
        var result = await _controller.RefundEventPayment(paymentId, request);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Payment not found");
    }

    [Test]
    public async Task RefundEventPayment_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var paymentId = "pi_test_123456";
        var request = new RefundRequest
        {
            Reason = "Customer requested refund"
        };

        _eventPaymentServiceMock
            .Setup(s => s.ProcessRefundAsync(paymentId, request.Reason, 1))
            .ThrowsAsync(new InvalidOperationException("Payment has already been refunded"));

        // Act
        var result = await _controller.RefundEventPayment(paymentId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Payment has already been refunded");
    }

    [Test]
    public async Task RefundEventPayment_GenericException_Returns500()
    {
        // Arrange
        var paymentId = "pi_test_123456";
        var request = new RefundRequest
        {
            Reason = "Customer requested refund"
        };

        _eventPaymentServiceMock
            .Setup(s => s.ProcessRefundAsync(paymentId, request.Reason, 1))
            .ThrowsAsync(new Exception("Stripe error"));

        // Act
        var result = await _controller.RefundEventPayment(paymentId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while processing the refund");
    }

    #endregion
}
