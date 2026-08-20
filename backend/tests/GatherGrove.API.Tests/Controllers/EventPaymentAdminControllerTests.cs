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
public class EventPaymentAdminControllerTests
{
    private Mock<IEventPaymentAdminService> _mockAdminService;
    private Mock<ILogger<EventPaymentAdminController>> _mockLogger;
    private EventPaymentAdminController _controller;

    [SetUp]
    public void Setup()
    {
        _mockAdminService = new Mock<IEventPaymentAdminService>();
        _mockLogger = new Mock<ILogger<EventPaymentAdminController>>();
        _controller = new EventPaymentAdminController(_mockAdminService.Object, _mockLogger.Object);

        // Setup default authenticated user with ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Test]
    public async Task GetPaymentOverview_ReturnsOkWithData()
    {
        // Arrange
        var overview = new EventPaymentOverviewResponse
        {
            EventId = 1,
            EventName = "Test Event",
            TotalRevenue = 250.00m,
            TotalAttendees = 10,
            PaymentSummary = new PaymentSummaryStats
            {
                Completed = 8,
                Pending = 2,
                Failed = 0,
                Refunded = 0,
                ManualPayments = 2
            },
            Attendees = new List<EventAttendeePaymentInfo>()
        };

        _mockAdminService
            .Setup(s => s.GetEventPaymentOverviewAsync(1, 1))
            .ReturnsAsync(overview);

        // Act
        var result = await _controller.GetPaymentOverview(1, 1);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(overview));
    }

    [Test]
    public async Task GetPaymentOverview_ReturnsForbidForWrongClub()
    {
        // Arrange - user belongs to club 1, trying to access club 2
        // Act
        var result = await _controller.GetPaymentOverview(2, 1);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetPaymentOverview_ReturnsNotFoundForNonExistentEvent()
    {
        // Arrange
        _mockAdminService
            .Setup(s => s.GetEventPaymentOverviewAsync(1, 999))
            .ThrowsAsync(new ArgumentException("Event 999 not found"));

        // Act
        var result = await _controller.GetPaymentOverview(1, 999);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task IssueRefund_ReturnsOkOnSuccess()
    {
        // Arrange
        var request = new IssueRefundRequest
        {
            EventId = 1,
            RsvpId = 1,
            Amount = 25.00m,
            Reason = "Customer request"
        };

        var response = new EventRefundResponse
        {
            Success = true,
            RefundId = "re_test123",
            Message = "Refund of $25.00 processed successfully"
        };

        _mockAdminService
            .Setup(s => s.IssueRefundAsync(1, It.IsAny<IssueRefundRequest>()))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.IssueRefund(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(response));
    }

    [Test]
    public async Task IssueRefund_ReturnsBadRequestForInvalidAmount()
    {
        // Arrange
        var request = new IssueRefundRequest
        {
            EventId = 1,
            RsvpId = 1,
            Amount = -10.00m,
            Reason = "Test"
        };

        _mockAdminService
            .Setup(s => s.IssueRefundAsync(1, It.IsAny<IssueRefundRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid refund amount"));

        // Act
        var result = await _controller.IssueRefund(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task IssueRefund_ReturnsBadRequestForManualPayment()
    {
        // Arrange
        var request = new IssueRefundRequest
        {
            EventId = 1,
            RsvpId = 1,
            Amount = 25.00m,
            Reason = "Test"
        };

        _mockAdminService
            .Setup(s => s.IssueRefundAsync(1, It.IsAny<IssueRefundRequest>()))
            .ThrowsAsync(new InvalidOperationException("Cannot refund - no Stripe payment found"));

        // Act
        var result = await _controller.IssueRefund(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task IssueRefund_ReturnsForbidForWrongClub()
    {
        // Arrange
        var request = new IssueRefundRequest
        {
            EventId = 1,
            RsvpId = 1,
            Amount = 25.00m,
            Reason = "Test"
        };

        // Act - user belongs to club 1, trying to refund in club 2
        var result = await _controller.IssueRefund(2, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task RecordManualPayment_ReturnsOkOnSuccess()
    {
        // Arrange
        var request = new RecordManualPaymentRequest
        {
            EventId = 1,
            MemberId = 1,
            AmountPaid = 25.00m,
            PaymentMethod = "cash",
            Notes = "Paid at the door"
        };

        var response = new ManualPaymentResponse
        {
            Success = true,
            RsvpId = 1,
            Message = "Manual payment of $25.00 recorded successfully"
        };

        _mockAdminService
            .Setup(s => s.RecordManualPaymentAsync(1, It.IsAny<RecordManualPaymentRequest>()))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.RecordManualPayment(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(response));
    }

    [Test]
    public async Task RecordManualPayment_ReturnsBadRequestForInvalidAmount()
    {
        // Arrange
        var request = new RecordManualPaymentRequest
        {
            EventId = 1,
            MemberId = 1,
            AmountPaid = 0,
            PaymentMethod = "cash"
        };

        _mockAdminService
            .Setup(s => s.RecordManualPaymentAsync(1, It.IsAny<RecordManualPaymentRequest>()))
            .ThrowsAsync(new ArgumentException("Payment amount must be greater than 0"));

        // Act
        var result = await _controller.RecordManualPayment(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task RecordManualPayment_ReturnsForbidForWrongClub()
    {
        // Arrange
        var request = new RecordManualPaymentRequest
        {
            EventId = 1,
            MemberId = 1,
            AmountPaid = 25.00m,
            PaymentMethod = "cash"
        };

        // Act - user belongs to club 1, trying to record payment in club 2
        var result = await _controller.RecordManualPayment(2, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task ExportPaymentData_ReturnsFileOnSuccess()
    {
        // Arrange
        var csvData = System.Text.Encoding.UTF8.GetBytes("Name,Email,Amount\nTest User,test@example.com,25.00");

        _mockAdminService
            .Setup(s => s.ExportPaymentDataAsync(1, It.IsAny<ExportPaymentDataRequest>()))
            .ReturnsAsync(csvData);

        // Act
        var result = await _controller.ExportPaymentData(1, 1, "csv");

        // Assert
        Assert.That(result, Is.InstanceOf<FileContentResult>());
        var fileResult = result as FileContentResult;
        Assert.That(fileResult.ContentType, Is.EqualTo("text/csv"));
        Assert.That(fileResult.FileContents, Is.EqualTo(csvData));
        Assert.That(fileResult.FileDownloadName, Does.Contain("event-1-payments"));
    }

    [Test]
    public async Task ExportPaymentData_ReturnsForbidForWrongClub()
    {
        // Act - user belongs to club 1, trying to export from club 2
        var result = await _controller.ExportPaymentData(2, 1, "csv");

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task ExportPaymentData_ReturnsNotFoundForNonExistentEvent()
    {
        // Arrange
        _mockAdminService
            .Setup(s => s.ExportPaymentDataAsync(1, It.IsAny<ExportPaymentDataRequest>()))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.ExportPaymentData(1, 999, "csv");

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetPaymentOverview_ReturnsForbidWhenMissingClubIdClaim()
    {
        // Arrange - setup user without ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GetPaymentOverview(1, 1);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetPaymentOverview_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockAdminService
            .Setup(s => s.GetEventPaymentOverviewAsync(1, 1))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetPaymentOverview(1, 1);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task IssueRefund_ReturnsForbidWhenMissingClubIdClaim()
    {
        // Arrange - setup user without ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        var request = new IssueRefundRequest
        {
            EventId = 1,
            RsvpId = 1,
            Amount = 25.00m,
            Reason = "Test"
        };

        // Act
        var result = await _controller.IssueRefund(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task IssueRefund_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new IssueRefundRequest
        {
            EventId = 1,
            RsvpId = 1,
            Amount = 25.00m,
            Reason = "Test"
        };

        _mockAdminService
            .Setup(s => s.IssueRefundAsync(1, It.IsAny<IssueRefundRequest>()))
            .ThrowsAsync(new Exception("Stripe service unavailable"));

        // Act
        var result = await _controller.IssueRefund(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task RecordManualPayment_ReturnsForbidWhenMissingClubIdClaim()
    {
        // Arrange - setup user without ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        var request = new RecordManualPaymentRequest
        {
            EventId = 1,
            MemberId = 1,
            AmountPaid = 25.00m,
            PaymentMethod = "cash"
        };

        // Act
        var result = await _controller.RecordManualPayment(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task RecordManualPayment_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new RecordManualPaymentRequest
        {
            EventId = 1,
            MemberId = 1,
            AmountPaid = 25.00m,
            PaymentMethod = "cash"
        };

        _mockAdminService
            .Setup(s => s.RecordManualPaymentAsync(1, It.IsAny<RecordManualPaymentRequest>()))
            .ThrowsAsync(new Exception("Database write failed"));

        // Act
        var result = await _controller.RecordManualPayment(1, 1, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task ExportPaymentData_ReturnsForbidWhenMissingClubIdClaim()
    {
        // Arrange - setup user without ClubId claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.ExportPaymentData(1, 1, "csv");

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task ExportPaymentData_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockAdminService
            .Setup(s => s.ExportPaymentDataAsync(1, It.IsAny<ExportPaymentDataRequest>()))
            .ThrowsAsync(new Exception("Export service failed"));

        // Act
        var result = await _controller.ExportPaymentData(1, 1, "csv");

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }
}

