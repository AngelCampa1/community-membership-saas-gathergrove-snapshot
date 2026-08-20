using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using DataExportDownload = GatherGrove.Application.Services.DataExportDownloadResponse;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class AccountDeletionControllerTests
{
    private Mock<IAccountDeletionService> _accountDeletionServiceMock = null!;
    private Mock<IAdminService> _adminServiceMock = null!;
    private Mock<ILogger<AccountDeletionController>> _loggerMock = null!;
    private AccountDeletionController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _accountDeletionServiceMock = new Mock<IAccountDeletionService>();
        _adminServiceMock = new Mock<IAdminService>();
        _loggerMock = new Mock<ILogger<AccountDeletionController>>();

        _controller = new AccountDeletionController(
            _accountDeletionServiceMock.Object,
            _adminServiceMock.Object,
            _loggerMock.Object);

        // Setup default authenticated user
        SetupAuthenticatedUser(userId: 1, role: "Member");
    }

    private void SetupAuthenticatedUser(int userId, string role = "Member")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, $"user{userId}@example.com"),
            new(ClaimTypes.Role, role),
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
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    #region ValidateAccountDeletion Tests

    [Test]
    public async Task ValidateAccountDeletion_ValidUser_ReturnsValidationResult()
    {
        // Arrange
        var validation = new AccountDeletionValidationResponse
        {
            CanDelete = true,
            ValidationErrors = new List<string>(),
            RequiredActions = new List<string>(),
            EstimatedDeletionTime = TimeSpan.FromDays(7),
            ImpactSummary = new DeletionImpactSummary
            {
                ClubsToDelete = 0,
                ClubsToTransfer = 0,
                MemberRecordsToAnonymize = 2,
                EventsAffected = 3,
                PaymentRecordsAffected = 5,
                DataExportSize = 1024000
            },
            IsAdminAccount = false,
            AdminInfo = new AdminDeletionInfo()
        };

        _accountDeletionServiceMock
            .Setup(s => s.ValidateAccountDeletionAsync(1))
            .ReturnsAsync(validation);

        // Act
        var result = await _controller.ValidateAccountDeletion();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as AccountDeletionValidationResponse;
        response.Should().NotBeNull();
        response!.CanDelete.Should().BeTrue();
        response.ImpactSummary.MemberRecordsToAnonymize.Should().Be(2);
    }

    [Test]
    public async Task ValidateAccountDeletion_AdminAccount_ReturnsAdminInfo()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        var validation = new AccountDeletionValidationResponse
        {
            CanDelete = false,
            ValidationErrors = new List<string> { "Must transfer club ownership first" },
            RequiredActions = new List<string> { "Transfer ownership of 2 clubs" },
            IsAdminAccount = true,
            AdminInfo = new AdminDeletionInfo
            {
                PrimaryClubsCount = 2,
                SecondaryClubsCount = 1,
                HasActiveBilling = true,
                ExtendedGracePeriodDays = 30
            }
        };

        _accountDeletionServiceMock
            .Setup(s => s.ValidateAccountDeletionAsync(1))
            .ReturnsAsync(validation);

        // Act
        var result = await _controller.ValidateAccountDeletion();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var response = okResult.Value as AccountDeletionValidationResponse;
        response!.CanDelete.Should().BeFalse();
        response.IsAdminAccount.Should().BeTrue();
        response.AdminInfo.PrimaryClubsCount.Should().Be(2);
    }

    [Test]
    public async Task ValidateAccountDeletion_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();

        // Act
        var result = await _controller.ValidateAccountDeletion();

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task ValidateAccountDeletion_ServiceThrowsException_Returns500()
    {
        // Arrange
        _accountDeletionServiceMock
            .Setup(s => s.ValidateAccountDeletionAsync(1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ValidateAccountDeletion();

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region RequestAccountDeletion Tests

    [Test]
    public async Task RequestAccountDeletion_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var request = new AccountDeletionRequest
        {
            Reason = "No longer need the account",
            ConfirmationPhrase = "DELETE MY ACCOUNT",
            RequestDataExport = true,
            MemberDataHandling = MemberDataHandling.Anonymize,
            DeleteOrphanedClubs = true
        };

        var expectedResponse = new AccountDeletionResponse
        {
            DeletionRequestId = Guid.NewGuid(),
            Status = "Requested",
            RequiresManualReview = false,
            EstimatedCompletionDate = DateTime.UtcNow.AddDays(7),
            DataExportId = Guid.NewGuid(),
            RequiredActions = new List<string>(),
            Warnings = new List<string> { "Data will be permanently deleted" }
        };

        _accountDeletionServiceMock
            .Setup(s => s.RequestAccountDeletionAsync(1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as AccountDeletionResponse;
        response.Should().NotBeNull();
        response!.Status.Should().Be("Requested");
        response.DataExportId.Should().NotBeNull();
    }

    [Test]
    public async Task RequestAccountDeletion_AdminAccountWithClubs_RequiresManualReview()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        var request = new AccountDeletionRequest
        {
            Reason = "Leaving organization",
            ConfirmationPhrase = "DELETE MY ACCOUNT",
            ClubTransferInstructions = new List<ClubTransferInstruction>
            {
                new() { ClubId = 1, TransferToUserId = 2 }
            }
        };

        var expectedResponse = new AccountDeletionResponse
        {
            DeletionRequestId = Guid.NewGuid(),
            Status = "PendingReview",
            RequiresManualReview = true,
            EstimatedCompletionDate = DateTime.UtcNow.AddDays(30),
            RequiredActions = new List<string> { "Admin approval required" }
        };

        _accountDeletionServiceMock
            .Setup(s => s.RequestAccountDeletionAsync(1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var response = okResult.Value as AccountDeletionResponse;
        response!.RequiresManualReview.Should().BeTrue();
    }

    [Test]
    public async Task RequestAccountDeletion_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();

        var request = new AccountDeletionRequest
        {
            Reason = "Test",
            ConfirmationPhrase = "DELETE MY ACCOUNT"
        };

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task RequestAccountDeletion_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var request = new AccountDeletionRequest
        {
            Reason = "Test",
            ConfirmationPhrase = "DELETE MY ACCOUNT"
        };

        _accountDeletionServiceMock
            .Setup(s => s.RequestAccountDeletionAsync(1, request))
            .ThrowsAsync(new InvalidOperationException("Active subscription must be cancelled first"));

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task RequestAccountDeletion_GenericException_Returns500()
    {
        // Arrange
        var request = new AccountDeletionRequest
        {
            Reason = "Test",
            ConfirmationPhrase = "DELETE MY ACCOUNT"
        };

        _accountDeletionServiceMock
            .Setup(s => s.RequestAccountDeletionAsync(1, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RequestAccountDeletion(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetAccountDeletionStatus Tests

    [Test]
    public async Task GetAccountDeletionStatus_ValidRequest_ReturnsStatus()
    {
        // Arrange
        var deletionRequestId = Guid.NewGuid();
        var expectedStatus = new AccountDeletionStatusResponse
        {
            DeletionRequestId = deletionRequestId,
            Status = "InProgress",
            Progress = 45,
            EstimatedCompletionDate = DateTime.UtcNow.AddDays(5),
            CompletedSteps = new List<string> { "Data export generated", "Member data anonymized" },
            RemainingSteps = new List<string> { "Event data cleanup", "Payment data anonymization" },
            ErrorMessages = new List<string>()
        };

        _accountDeletionServiceMock
            .Setup(s => s.GetAccountDeletionStatusAsync(1, deletionRequestId))
            .ReturnsAsync(expectedStatus);

        // Act
        var result = await _controller.GetAccountDeletionStatus(deletionRequestId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as AccountDeletionStatusResponse;
        response.Should().NotBeNull();
        response!.Status.Should().Be("InProgress");
        response.Progress.Should().Be(45);
    }

    [Test]
    public async Task GetAccountDeletionStatus_NotFound_ReturnsNotFound()
    {
        // Arrange
        var deletionRequestId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.GetAccountDeletionStatusAsync(1, deletionRequestId))
            .ThrowsAsync(new ArgumentException("Deletion request not found"));

        // Act
        var result = await _controller.GetAccountDeletionStatus(deletionRequestId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task GetAccountDeletionStatus_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var deletionRequestId = Guid.NewGuid();

        // Act
        var result = await _controller.GetAccountDeletionStatus(deletionRequestId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetAccountDeletionStatus_GenericException_Returns500()
    {
        // Arrange
        var deletionRequestId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.GetAccountDeletionStatusAsync(1, deletionRequestId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetAccountDeletionStatus(deletionRequestId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region CancelAccountDeletion Tests

    [Test]
    public async Task CancelAccountDeletion_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var deletionRequestId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.CancelAccountDeletionAsync(1, deletionRequestId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.CancelAccountDeletion(deletionRequestId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Account deletion request successfully cancelled");
    }

    [Test]
    public async Task CancelAccountDeletion_NotFound_ReturnsNotFound()
    {
        // Arrange
        var deletionRequestId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.CancelAccountDeletionAsync(1, deletionRequestId))
            .ThrowsAsync(new ArgumentException("Deletion request not found"));

        // Act
        var result = await _controller.CancelAccountDeletion(deletionRequestId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task CancelAccountDeletion_AlreadyProcessed_ReturnsBadRequest()
    {
        // Arrange
        var deletionRequestId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.CancelAccountDeletionAsync(1, deletionRequestId))
            .ThrowsAsync(new InvalidOperationException("Deletion already in progress and cannot be cancelled"));

        // Act
        var result = await _controller.CancelAccountDeletion(deletionRequestId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task CancelAccountDeletion_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var deletionRequestId = Guid.NewGuid();

        // Act
        var result = await _controller.CancelAccountDeletion(deletionRequestId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task CancelAccountDeletion_GenericException_Returns500()
    {
        // Arrange
        var deletionRequestId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.CancelAccountDeletionAsync(1, deletionRequestId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CancelAccountDeletion(deletionRequestId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetAdminTransferTargets Tests

    [Test]
    public async Task GetAdminTransferTargets_AdminUser_ReturnsTargets()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        var expectedTargets = new List<AdminTransferTarget>
        {
            new()
            {
                UserId = 2,
                FullName = "John Doe",
                Email = "john@example.com",
                ClubIds = new List<int> { 1, 2 },
                Role = "Admin"
            },
            new()
            {
                UserId = 3,
                FullName = "Jane Smith",
                Email = "jane@example.com",
                ClubIds = new List<int> { 1 },
                Role = "Admin"
            }
        };

        _accountDeletionServiceMock
            .Setup(s => s.GetAdminTransferTargetsAsync(1))
            .ReturnsAsync(expectedTargets);

        // Act
        var result = await _controller.GetAdminTransferTargets();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var targets = okResult.Value as List<AdminTransferTarget>;
        targets.Should().NotBeNull();
        targets!.Count.Should().Be(2);
    }

    [Test]
    public async Task GetAdminTransferTargets_OwnerUser_ReturnsTargets()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Owner");

        var expectedTargets = new List<AdminTransferTarget>
        {
            new() { UserId = 2, FullName = "John Doe", Email = "john@example.com" }
        };

        _accountDeletionServiceMock
            .Setup(s => s.GetAdminTransferTargetsAsync(1))
            .ReturnsAsync(expectedTargets);

        // Act
        var result = await _controller.GetAdminTransferTargets();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task GetAdminTransferTargets_NonAdminUser_ReturnsForbid()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Member");

        // Act
        var result = await _controller.GetAdminTransferTargets();

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetAdminTransferTargets_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();

        // Act
        var result = await _controller.GetAdminTransferTargets();

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetAdminTransferTargets_ServiceThrowsException_Returns500()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        _accountDeletionServiceMock
            .Setup(s => s.GetAdminTransferTargetsAsync(1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetAdminTransferTargets();

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region TransferClubOwnership Tests

    [Test]
    public async Task TransferClubOwnership_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        var request = new ClubOwnershipTransferRequest
        {
            ClubId = 1,
            TargetUserId = 2,
            IsPartOfAccountDeletion = true,
            RequireTargetConfirmation = true,
            PasswordConfirmation = "password123"
        };

        var expectedResult = new ClubOwnershipTransferResponse
        {
            TransferId = Guid.NewGuid(),
            Status = "Pending",
            RequiresTargetConfirmation = true,
            ScheduledTransferDate = DateTime.UtcNow.AddDays(3),
            RequiredActions = new List<string> { "Target admin must confirm" }
        };

        _accountDeletionServiceMock
            .Setup(s => s.TransferClubOwnershipAsync(1, request))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.TransferClubOwnership(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Club ownership transfer initiated successfully");
    }

    [Test]
    public async Task TransferClubOwnership_NonAdminUser_ReturnsForbid()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Member");

        var request = new ClubOwnershipTransferRequest
        {
            ClubId = 1,
            TargetUserId = 2,
            PasswordConfirmation = "password123"
        };

        // Act
        var result = await _controller.TransferClubOwnership(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task TransferClubOwnership_InvalidClubId_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        var request = new ClubOwnershipTransferRequest
        {
            ClubId = 999,
            TargetUserId = 2,
            PasswordConfirmation = "password123"
        };

        _accountDeletionServiceMock
            .Setup(s => s.TransferClubOwnershipAsync(1, request))
            .ThrowsAsync(new ArgumentException("Club not found"));

        // Act
        var result = await _controller.TransferClubOwnership(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task TransferClubOwnership_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        var request = new ClubOwnershipTransferRequest
        {
            ClubId = 1,
            TargetUserId = 2,
            PasswordConfirmation = "password123"
        };

        _accountDeletionServiceMock
            .Setup(s => s.TransferClubOwnershipAsync(1, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to transfer this club"));

        // Act
        var result = await _controller.TransferClubOwnership(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task TransferClubOwnership_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();

        var request = new ClubOwnershipTransferRequest
        {
            ClubId = 1,
            TargetUserId = 2,
            PasswordConfirmation = "password123"
        };

        // Act
        var result = await _controller.TransferClubOwnership(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task TransferClubOwnership_GenericException_Returns500()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1, role: "Admin");

        var request = new ClubOwnershipTransferRequest
        {
            ClubId = 1,
            TargetUserId = 2,
            PasswordConfirmation = "password123"
        };

        _accountDeletionServiceMock
            .Setup(s => s.TransferClubOwnershipAsync(1, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.TransferClubOwnership(request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region DownloadDataExport Tests

    [Test]
    public async Task DownloadDataExport_ValidRequest_ReturnsFile()
    {
        // Arrange
        var exportId = Guid.NewGuid();
        var fileContent = new byte[] { 1, 2, 3, 4, 5 };

        var expectedDownload = new DataExportDownload
        {
            FileContent = fileContent,
            FileName = "data-export.zip",
            ContentType = "application/zip",
            FileSize = fileContent.Length
        };

        _accountDeletionServiceMock
            .Setup(s => s.DownloadDataExportAsync(1, exportId))
            .ReturnsAsync(expectedDownload);

        // Act
        var result = await _controller.DownloadDataExport(exportId);

        // Assert
        var fileResult = result as FileContentResult;
        fileResult.Should().NotBeNull();
        fileResult!.FileContents.Should().Equal(fileContent);
        fileResult.ContentType.Should().Be("application/zip");
        fileResult.FileDownloadName.Should().Be("data-export.zip");
    }

    [Test]
    public async Task DownloadDataExport_ExportNotFound_ReturnsNotFound()
    {
        // Arrange
        var exportId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.DownloadDataExportAsync(1, exportId))
            .ThrowsAsync(new ArgumentException("Export not found"));

        // Act
        var result = await _controller.DownloadDataExport(exportId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task DownloadDataExport_ExportExpired_Returns410()
    {
        // Arrange
        var exportId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.DownloadDataExportAsync(1, exportId))
            .ThrowsAsync(new InvalidOperationException("Export link has expired"));

        // Act
        var result = await _controller.DownloadDataExport(exportId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(410);
    }

    [Test]
    public async Task DownloadDataExport_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var exportId = Guid.NewGuid();

        // Act
        var result = await _controller.DownloadDataExport(exportId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task DownloadDataExport_GenericException_Returns500()
    {
        // Arrange
        var exportId = Guid.NewGuid();

        _accountDeletionServiceMock
            .Setup(s => s.DownloadDataExportAsync(1, exportId))
            .ThrowsAsync(new Exception("File system error"));

        // Act
        var result = await _controller.DownloadDataExport(exportId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
