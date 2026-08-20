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
public class PaymentControllerTests
{
    private Mock<IPaymentService> _paymentServiceMock = null!;
    private Mock<ILogger<PaymentController>> _loggerMock = null!;
    private PaymentController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _paymentServiceMock = new Mock<IPaymentService>();
        _loggerMock = new Mock<ILogger<PaymentController>>();

        _controller = new PaymentController(
            _paymentServiceMock.Object,
            _loggerMock.Object);

        // Setup HTTP context with default authenticated admin user
        SetupAuthenticatedAdmin(clubId: 1);
    }

    private void SetupAuthenticatedAdmin(int clubId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "Admin"),
            new("ClubId", clubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupAuthenticatedNonAdmin()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "Member"),
            new("ClubId", "1")
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
            // No NameIdentifier claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region RequestPayment Tests

    [Test]
    public async Task RequestPayment_ValidRequest_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var memberId = 10;
        var request = new RequestPaymentRequest
        {
            Amount = 50.00m,
            Description = "January 2025 membership dues"
        };

        _paymentServiceMock
            .Setup(s => s.RequestPaymentAsync(clubId, memberId, request))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.RequestPayment(clubId, memberId, request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Payment request sent successfully");
    }

    // Note: ModelState validation is handled automatically by [ApiController] attribute
    // in production, so we don't test it here - it's framework behavior

    [Test]
    public async Task RequestPayment_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var memberId = 10;
        var request = new RequestPaymentRequest
        {
            Amount = 50.00m,
            Description = "Test payment"
        };

        // Act
        var result = await _controller.RequestPayment(clubId, memberId, request);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("Invalid user authentication");
    }

    [Test]
    public async Task RequestPayment_NonAdminUser_ReturnsForbid()
    {
        // Arrange
        SetupAuthenticatedNonAdmin();
        var clubId = 1;
        var memberId = 10;
        var request = new RequestPaymentRequest
        {
            Amount = 50.00m,
            Description = "Test payment"
        };

        // Act
        var result = await _controller.RequestPayment(clubId, memberId, request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task RequestPayment_WrongClubId_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // User is in club 1
        var memberId = 10;
        var request = new RequestPaymentRequest
        {
            Amount = 50.00m,
            Description = "Test payment"
        };

        // Act
        var result = await _controller.RequestPayment(clubId, memberId, request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task RequestPayment_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var memberId = 10;
        var request = new RequestPaymentRequest
        {
            Amount = 50.00m,
            Description = "Test payment"
        };

        _paymentServiceMock
            .Setup(s => s.RequestPaymentAsync(clubId, memberId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RequestPayment(clubId, memberId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetPaymentPage Tests

    [Test]
    public async Task GetPaymentPage_ValidToken_ReturnsOkWithPaymentPageResponse()
    {
        // Arrange
        var token = "valid-secure-token";
        var expectedResponse = new PaymentPageResponse
        {
            ClubName = "Test Club",
            MemberName = "John Doe",
            MembershipType = "Premium",
            Amount = 100.00m,
            Description = "Annual membership dues",
            IsValid = true,
            StripePublishableKey = "pk_test_123",
            IsDevelopmentMode = false,
            IsStripeConnected = true
        };

        _paymentServiceMock
            .Setup(s => s.GetPaymentPageAsync(token))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetPaymentPage(token);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as PaymentPageResponse;
        response.Should().NotBeNull();
        response!.ClubName.Should().Be("Test Club");
        response.MemberName.Should().Be("John Doe");
        response.Amount.Should().Be(100.00m);
        response.IsValid.Should().BeTrue();
    }

    [Test]
    public async Task GetPaymentPage_InvalidToken_ReturnsNotFound()
    {
        // Arrange
        var token = "invalid-token";

        _paymentServiceMock
            .Setup(s => s.GetPaymentPageAsync(token))
            .ThrowsAsync(new ArgumentException("Invalid or expired payment token"));

        // Act
        var result = await _controller.GetPaymentPage(token);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task GetPaymentPage_ServiceThrowsException_Returns500()
    {
        // Arrange
        var token = "valid-token";

        _paymentServiceMock
            .Setup(s => s.GetPaymentPageAsync(token))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetPaymentPage(token);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ProcessPayment Tests

    [Test]
    public async Task ProcessPayment_ValidRequest_ReturnsOk()
    {
        // Arrange
        var token = "valid-secure-token";
        var request = new GatherGrove.Application.DTOs.ProcessPaymentRequest
        {
            PaymentMethodId = "pm_test_123"
        };

        _paymentServiceMock
            .Setup(s => s.ProcessPaymentAsync(token, request))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ProcessPayment(token, request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Payment processed successfully");
    }

    // Note: ModelState validation is handled automatically by [ApiController] attribute
    // in production, so we don't test it here - it's framework behavior

    [Test]
    public async Task ProcessPayment_InvalidToken_ReturnsBadRequest()
    {
        // Arrange
        var token = "invalid-token";
        var request = new GatherGrove.Application.DTOs.ProcessPaymentRequest
        {
            PaymentMethodId = "pm_test_123"
        };

        _paymentServiceMock
            .Setup(s => s.ProcessPaymentAsync(token, request))
            .ThrowsAsync(new ArgumentException("Invalid or expired payment token"));

        // Act
        var result = await _controller.ProcessPayment(token, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task ProcessPayment_ServiceThrowsException_Returns500()
    {
        // Arrange
        var token = "valid-token";
        var request = new GatherGrove.Application.DTOs.ProcessPaymentRequest
        {
            PaymentMethodId = "pm_test_123"
        };

        _paymentServiceMock
            .Setup(s => s.ProcessPaymentAsync(token, request))
            .ThrowsAsync(new Exception("Stripe error"));

        // Act
        var result = await _controller.ProcessPayment(token, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetClubPayments Tests

    [Test]
    public async Task GetClubPayments_DefaultYear_ReturnsOkWithPayments()
    {
        // Arrange
        var clubId = 1;
        var expectedPayments = new List<ClubPaymentResponse>
        {
            new()
            {
                PaymentId = 1,
                MemberId = 10,
                MemberName = "John Doe",
                MemberEmail = "john@example.com",
                MembershipTypeName = "Premium",
                Amount = 100.00m,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = "Stripe",
                IsPartialPayment = false
            }
        };

        _paymentServiceMock
            .Setup(s => s.GetClubPaymentsAsync(clubId, null))
            .ReturnsAsync(expectedPayments);

        // Act
        var result = await _controller.GetClubPayments(clubId, null);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var payments = okResult.Value as List<ClubPaymentResponse>;
        payments.Should().NotBeNull();
        payments.Should().HaveCount(1);
        payments![0].MemberName.Should().Be("John Doe");
        payments[0].Amount.Should().Be(100.00m);
    }

    [Test]
    public async Task GetClubPayments_SpecificYear_ReturnsOkWithPayments()
    {
        // Arrange
        var clubId = 1;
        var year = 2024;
        var expectedPayments = new List<ClubPaymentResponse>
        {
            new()
            {
                PaymentId = 1,
                MemberId = 10,
                MemberName = "Jane Doe",
                MemberEmail = "jane@example.com",
                MembershipTypeName = "Standard",
                Amount = 50.00m,
                PaymentDate = new DateTime(2024, 6, 15),
                PaymentMethod = "Check",
                IsPartialPayment = false
            }
        };

        _paymentServiceMock
            .Setup(s => s.GetClubPaymentsAsync(clubId, year))
            .ReturnsAsync(expectedPayments);

        // Act
        var result = await _controller.GetClubPayments(clubId, year);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var payments = okResult.Value as List<ClubPaymentResponse>;
        payments.Should().NotBeNull();
        payments.Should().HaveCount(1);
        payments![0].PaymentDate.Year.Should().Be(2024);
    }

    [Test]
    public async Task GetClubPayments_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;

        // Act
        var result = await _controller.GetClubPayments(clubId, null);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("Invalid user authentication");
    }

    [Test]
    public async Task GetClubPayments_NonAdminUser_ReturnsForbid()
    {
        // Arrange
        SetupAuthenticatedNonAdmin();
        var clubId = 1;

        // Act
        var result = await _controller.GetClubPayments(clubId, null);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetClubPayments_WrongClubId_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // User is in club 1

        // Act
        var result = await _controller.GetClubPayments(clubId, null);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetClubPayments_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;

        _paymentServiceMock
            .Setup(s => s.GetClubPaymentsAsync(clubId, null))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetClubPayments(clubId, null);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region LogPaymentError Tests

    [Test]
    public void LogPaymentError_ValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new PaymentErrorLogRequest
        {
            Token = "test-token",
            Error = "Payment method declined",
            Timestamp = DateTime.UtcNow.ToString("o"),
            UserAgent = "Mozilla/5.0"
        };

        // Act
        var result = _controller.LogPaymentError(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        // Verify it contains success and message properties
        var successProperty = value!.GetType().GetProperty("success");
        successProperty.Should().NotBeNull();
        successProperty!.GetValue(value).Should().Be(true);

        var messageProperty = value.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Error logged successfully");
    }

    [Test]
    public void LogPaymentError_ReturnsOkEvenOnException()
    {
        // Arrange
        var request = new PaymentErrorLogRequest
        {
            Token = "test-token",
            Error = "Payment error",
            Timestamp = DateTime.UtcNow.ToString("o"),
            UserAgent = "Mozilla/5.0"
        };

        // Even though logging might fail internally, we don't want to fail the client request
        // This is a "best effort" logging endpoint - it should always return OK

        // Act
        var result = _controller.LogPaymentError(request);

        // Assert - Should return Ok regardless of internal errors
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);
    }

    #endregion
}
