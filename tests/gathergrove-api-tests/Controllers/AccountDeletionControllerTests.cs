using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Security.Claims;
using FluentAssertions;

namespace GatherGrove.API.Tests.Controllers;

/// <summary>
/// TDD-first test suite for AccountDeletion API endpoints
/// Tests cover: validation, authorization, data export, subscription checks
/// </summary>
public class AccountDeletionControllerTests
{
    private readonly Mock<IAccountDeletionService> _mockAccountDeletionService;
    private readonly Mock<ILogger<AccountDeletionController>> _mockLogger;
    private readonly AccountDeletionController _controller;

    public AccountDeletionControllerTests()
    {
        _mockAccountDeletionService = new Mock<IAccountDeletionService>();
        _mockLogger = new Mock<ILogger<AccountDeletionController>>();
        _controller = new AccountDeletionController(_mockAccountDeletionService.Object, _mockLogger.Object);
        
        // Setup controller context with authenticated user
        SetupControllerContext();
    }

    [Fact]
    public async Task RequestAccountDeletion_WithValidRequest_ShouldReturnSuccessResponse()
    {
        // Arrange
        var request = new AccountDeletionRequest
        {
            Reason = "No longer needed",
            ConfirmationPhrase = "DELETE MY ACCOUNT",
            RequestDataExport = true
        };

        var expectedResponse = new AccountDeletionResponse
        {
            DeletionRequestId = Guid.NewGuid(),
            Status = "Pending",
            RequiresManualReview = false,
            EstimatedCompletionDate = DateTime.UtcNow.AddDays(7),
            DataExportId = Guid.NewGuid()
        };

        _mockAccountDeletionService
            .Setup(x => x.RequestAccountDeletionAsync(123, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AccountDeletionResponse>().Subject;
        response.DeletionRequestId.Should().Be(expectedResponse.DeletionRequestId);
        response.DataExportId.Should().Be(expectedResponse.DataExportId);
    }

    [Theory]
    [InlineData("", "Reason is required")]
    [InlineData("DELETE", "Confirmation phrase must be exactly 'DELETE MY ACCOUNT'")]
    [InlineData(null, "Confirmation phrase is required")]
    public async Task RequestAccountDeletion_WithInvalidRequest_ShouldReturnBadRequest(
        string confirmationPhrase, string expectedError)
    {
        // Arrange
        var request = new AccountDeletionRequest
        {
            Reason = string.IsNullOrEmpty(confirmationPhrase) ? "" : "Valid reason",
            ConfirmationPhrase = confirmationPhrase,
            RequestDataExport = true
        };

        // Manually invalidate model state to simulate validation failure
        if (string.IsNullOrEmpty(request.Reason))
        {
            _controller.ModelState.AddModelError("Reason", "Reason is required");
        }
        if (confirmationPhrase != "DELETE MY ACCOUNT")
        {
            _controller.ModelState.AddModelError("ConfirmationPhrase", expectedError);
        }

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task RequestAccountDeletion_WithActiveSubscription_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new AccountDeletionRequest
        {
            Reason = "Moving to competitor",
            ConfirmationPhrase = "DELETE MY ACCOUNT"
        };

        _mockAccountDeletionService
            .Setup(x => x.RequestAccountDeletionAsync(123, request))
            .ThrowsAsync(new InvalidOperationException("Cannot delete account with active subscription"));

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var problemDetails = badRequestResult.Value.Should().BeOfType<ProblemDetails>().Subject;
        problemDetails.Detail.Should().Contain("active subscription");
    }

    [Fact]
    public async Task GetAccountDeletionStatus_WithValidId_ShouldReturnStatus()
    {
        // Arrange
        var deletionId = Guid.NewGuid();
        var expectedStatus = new AccountDeletionStatusResponse
        {
            DeletionRequestId = deletionId,
            Status = "InProgress",
            Progress = 75,
            EstimatedCompletionDate = DateTime.UtcNow.AddDays(1),
            CompletedSteps = new List<string> { "DataExport", "SubscriptionCancellation" },
            RemainingSteps = new List<string> { "DataDeletion" }
        };

        _mockAccountDeletionService
            .Setup(x => x.GetAccountDeletionStatusAsync(123, deletionId))
            .ReturnsAsync(expectedStatus);

        // Act
        var result = await _controller.GetAccountDeletionStatus(deletionId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AccountDeletionStatusResponse>().Subject;
        response.Status.Should().Be("InProgress");
        response.Progress.Should().Be(75);
    }

    [Fact]
    public async Task GetAccountDeletionStatus_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var invalidId = Guid.NewGuid();
        
        _mockAccountDeletionService
            .Setup(x => x.GetAccountDeletionStatusAsync(123, invalidId))
            .ThrowsAsync(new ArgumentException("Deletion request not found"));

        // Act
        var result = await _controller.GetAccountDeletionStatus(invalidId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CancelAccountDeletion_WithValidId_ShouldReturnSuccess()
    {
        // Arrange
        var deletionId = Guid.NewGuid();
        
        _mockAccountDeletionService
            .Setup(x => x.CancelAccountDeletionAsync(123, deletionId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.CancelAccountDeletion(deletionId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
        response.ToString().Should().Contain("successfully cancelled");
    }

    [Fact]
    public async Task CancelAccountDeletion_WhenAlreadyProcessed_ShouldReturnBadRequest()
    {
        // Arrange
        var deletionId = Guid.NewGuid();
        
        _mockAccountDeletionService
            .Setup(x => x.CancelAccountDeletionAsync(123, deletionId))
            .ThrowsAsync(new InvalidOperationException("Cannot cancel deletion - already in progress"));

        // Act
        var result = await _controller.CancelAccountDeletion(deletionId);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var problemDetails = badRequestResult.Value.Should().BeOfType<ProblemDetails>().Subject;
        problemDetails.Detail.Should().Contain("Cannot cancel");
    }

    [Fact]
    public async Task DownloadDataExport_WithValidId_ShouldReturnFile()
    {
        // Arrange
        var exportId = Guid.NewGuid();
        var fileContent = new byte[] { 1, 2, 3, 4, 5 };
        var fileName = "user_data_export.zip";

        _mockAccountDeletionService
            .Setup(x => x.DownloadDataExportAsync(123, exportId))
            .ReturnsAsync(new DataExportDownloadResponse
            {
                FileContent = fileContent,
                FileName = fileName,
                ContentType = "application/zip"
            });

        // Act
        var result = await _controller.DownloadDataExport(exportId);

        // Assert
        var fileResult = result.Should().BeOfType<FileContentResult>().Subject;
        fileResult.FileContents.Should().BeEquivalentTo(fileContent);
        fileResult.FileDownloadName.Should().Be(fileName);
        fileResult.ContentType.Should().Be("application/zip");
    }

    [Fact]
    public async Task DownloadDataExport_WithExpiredLink_ShouldReturnGone()
    {
        // Arrange
        var expiredId = Guid.NewGuid();
        
        _mockAccountDeletionService
            .Setup(x => x.DownloadDataExportAsync(123, expiredId))
            .ThrowsAsync(new InvalidOperationException("Export link has expired"));

        // Act
        var result = await _controller.DownloadDataExport(expiredId);

        // Assert
        var goneResult = result.Should().BeOfType<ObjectResult>().Subject;
        goneResult.StatusCode.Should().Be(410); // Gone
    }

    [Fact]
    public async Task ValidateAccountDeletion_ShouldReturnValidationResult()
    {
        // Arrange
        var validationResult = new AccountDeletionValidationResponse
        {
            CanDelete = false,
            ValidationErrors = new List<string>
            {
                "User owns multiple clubs",
                "Active subscription must be cancelled first"
            },
            RequiredActions = new List<string>
            {
                "Transfer ownership of clubs",
                "Cancel subscription"
            },
            EstimatedDeletionTime = TimeSpan.FromDays(14)
        };

        _mockAccountDeletionService
            .Setup(x => x.ValidateAccountDeletionAsync(123))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateAccountDeletion();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AccountDeletionValidationResponse>().Subject;
        response.CanDelete.Should().BeFalse();
        response.ValidationErrors.Should().HaveCount(2);
    }

    private void SetupControllerContext()
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }
}