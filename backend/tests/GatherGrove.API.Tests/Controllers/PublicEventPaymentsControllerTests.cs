using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Stripe;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class PublicEventPaymentsControllerTests
{
    private Mock<INonMemberEventPaymentService> _mockService = null!;
    private Mock<ILogger<PublicEventPaymentsController>> _mockLogger = null!;
    private PublicEventPaymentsController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _mockService = new Mock<INonMemberEventPaymentService>();
        _mockLogger = new Mock<ILogger<PublicEventPaymentsController>>();
        _controller = new PublicEventPaymentsController(_mockService.Object, _mockLogger.Object);

        // Setup HttpContext for controller
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/v1/public/events/pay";
        _controller.ControllerContext.HttpContext = httpContext;
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithValidGuestOnlyRequest_ReturnsOk()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            GuestPhone = "555-1234",
            CreateAccount = false
        };

        var expectedResponse = new NonMemberEventPaymentResponse
        {
            Success = true,
            PaymentId = "pi_test123",
            RsvpId = 1,
            ConfirmationNumber = "CONF123",
            EventAmount = 50m,
            TotalAmount = 50m,
            MembershipCreated = false,
            AccountCreated = false,
            EventName = "Test Event",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            EventLocation = "Test Location",
            ClubName = "Test Club"
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult!.StatusCode, Is.EqualTo(StatusCodes.Status200OK));

        var response = okResult.Value as NonMemberEventPaymentResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response!.Success, Is.True);
        Assert.That(response.ConfirmationNumber, Is.EqualTo("CONF123"));
        Assert.That(response.MembershipCreated, Is.False);
        Assert.That(response.AccountCreated, Is.False);

        _mockService.Verify(s => s.ProcessNonMemberEventPaymentAsync(It.Is<NonMemberEventPaymentRequest>(
            r => r.EventId == 1 && r.GuestEmail == "john@example.com")), Times.Once);
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithMembershipUpgrade_ReturnsOkWithMembershipInfo()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "Jane Smith",
            GuestEmail = "jane@example.com",
            MembershipTypeId = 1,
            CreateAccount = false
        };

        var expectedResponse = new NonMemberEventPaymentResponse
        {
            Success = true,
            PaymentId = "pi_test456",
            RsvpId = 2,
            ConfirmationNumber = "CONF456",
            EventAmount = 50m,
            MembershipAmount = 100m,
            TotalAmount = 150m,
            MembershipCreated = true,
            AccountCreated = false,
            MemberId = 1,
            EventName = "Test Event",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            EventLocation = "Test Location",
            ClubName = "Test Club"
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as NonMemberEventPaymentResponse;

        Assert.That(response!.MembershipCreated, Is.True);
        Assert.That(response.MembershipAmount, Is.EqualTo(100m));
        Assert.That(response.TotalAmount, Is.EqualTo(150m));
        Assert.That(response.MemberId, Is.Not.Null);
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithAccountCreation_ReturnsOkWithAccountInfo()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "Bob Johnson",
            GuestEmail = "bob@example.com",
            CreateAccount = true,
            Password = "SecurePass123!"
        };

        var expectedResponse = new NonMemberEventPaymentResponse
        {
            Success = true,
            PaymentId = "pi_test789",
            RsvpId = 3,
            ConfirmationNumber = "CONF789",
            EventAmount = 50m,
            TotalAmount = 50m,
            MembershipCreated = false,
            AccountCreated = true,
            MemberId = 2,
            EventName = "Test Event",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            EventLocation = "Test Location",
            ClubName = "Test Club"
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as NonMemberEventPaymentResponse;

        Assert.That(response!.AccountCreated, Is.True);
        Assert.That(response.MemberId, Is.Not.Null);
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithAllOptions_ReturnsOkWithAllInfo()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "Alice Williams",
            GuestEmail = "alice@example.com",
            MembershipTypeId = 1,
            CreateAccount = true,
            Password = "SecurePass123!"
        };

        var expectedResponse = new NonMemberEventPaymentResponse
        {
            Success = true,
            PaymentId = "pi_test999",
            RsvpId = 4,
            ConfirmationNumber = "CONF999",
            EventAmount = 50m,
            MembershipAmount = 100m,
            TotalAmount = 150m,
            MembershipCreated = true,
            AccountCreated = true,
            MemberId = 3,
            EventName = "Test Event",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            EventLocation = "Test Location",
            ClubName = "Test Club"
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as NonMemberEventPaymentResponse;

        Assert.That(response!.MembershipCreated, Is.True);
        Assert.That(response.AccountCreated, Is.True);
        Assert.That(response.MembershipAmount, Is.EqualTo(100m));
        Assert.That(response.TotalAmount, Is.EqualTo(150m));
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithInvalidEvent_ReturnsNotFound()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 999,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ThrowsAsync(new ArgumentException("Event with ID 999 not found"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult!.StatusCode, Is.EqualTo(StatusCodes.Status400BadRequest));
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithMissingRequiredFields_ReturnsBadRequest()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ThrowsAsync(new ArgumentException("Guest name is required", "GuestName"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithStripeFailure_ReturnsPaymentRequired()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ThrowsAsync(new StripeException("Your card was declined"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(StatusCodes.Status402PaymentRequired));
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithDuplicatePayment_ReturnsConflict()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ThrowsAsync(new InvalidOperationException("You have already registered for this event"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ConflictObjectResult>());
        var conflictResult = result.Result as ConflictObjectResult;
        Assert.That(conflictResult!.StatusCode, Is.EqualTo(StatusCodes.Status409Conflict));
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithUnexpectedError_ReturnsInternalServerError()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        _mockService.Setup(s => s.ProcessNonMemberEventPaymentAsync(It.IsAny<NonMemberEventPaymentRequest>()))
            .ThrowsAsync(new Exception("Unexpected database error"));

        // Act
        var result = await _controller.PayForEvent(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(StatusCodes.Status500InternalServerError));
    }

    [Test]
    public async Task GetAvailableMembershipTypes_WithValidEvent_ReturnsOk()
    {
        // Arrange
        var eventId = 1;
        var expectedTypes = new List<MembershipTypeResponse>
        {
            new MembershipTypeResponse
            {
                Id = 1,
                ClubId = 1,
                Name = "Individual",
                Description = "Individual membership",
                DuesAmount = 100m,
                DuesFrequency = "Annual",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MemberCount = 10
            },
            new MembershipTypeResponse
            {
                Id = 2,
                ClubId = 1,
                Name = "Family",
                Description = "Family membership",
                DuesAmount = 150m,
                DuesFrequency = "Annual",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MemberCount = 5
            }
        };

        _mockService.Setup(s => s.GetAvailableMembershipTypesForEventAsync(eventId))
            .ReturnsAsync(expectedTypes);

        // Act
        var result = await _controller.GetMembershipTypes(eventId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult!.StatusCode, Is.EqualTo(StatusCodes.Status200OK));

        var types = okResult.Value as List<MembershipTypeResponse>;
        Assert.That(types, Is.Not.Null);
        Assert.That(types!.Count, Is.EqualTo(2));
        Assert.That(types[0].Name, Is.EqualTo("Individual"));
        Assert.That(types[1].Name, Is.EqualTo("Family"));

        _mockService.Verify(s => s.GetAvailableMembershipTypesForEventAsync(eventId), Times.Once);
    }

    [Test]
    public async Task GetAvailableMembershipTypes_WithInvalidEvent_ReturnsNotFound()
    {
        // Arrange
        var eventId = 999;

        _mockService.Setup(s => s.GetAvailableMembershipTypesForEventAsync(eventId))
            .ThrowsAsync(new ArgumentException("Event with ID 999 not found"));

        // Act
        var result = await _controller.GetMembershipTypes(eventId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result.Result as NotFoundObjectResult;
        Assert.That(notFoundResult!.StatusCode, Is.EqualTo(StatusCodes.Status404NotFound));
    }

    [Test]
    public async Task GetAvailableMembershipTypes_WithUnexpectedError_ReturnsInternalServerError()
    {
        // Arrange
        var eventId = 1;

        _mockService.Setup(s => s.GetAvailableMembershipTypesForEventAsync(eventId))
            .ThrowsAsync(new Exception("Unexpected database error"));

        // Act
        var result = await _controller.GetMembershipTypes(eventId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(StatusCodes.Status500InternalServerError));
    }
}
