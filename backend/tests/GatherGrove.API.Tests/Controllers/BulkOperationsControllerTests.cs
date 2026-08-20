using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class BulkOperationsControllerTests
{
    private Mock<IBulkOperationsService> _bulkOperationsServiceMock = null!;
    private Mock<IClubAuthorizationService> _authServiceMock = null!;
    private Mock<ILogger<BulkOperationsController>> _loggerMock = null!;
    private BulkOperationsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _bulkOperationsServiceMock = new Mock<IBulkOperationsService>();
        _authServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<BulkOperationsController>>();

        _controller = new BulkOperationsController(
            _bulkOperationsServiceMock.Object,
            _authServiceMock.Object,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1, clubId: 1);
    }

    private void SetupAuthenticatedUser(int userId, int clubId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "ClubAdmin"),
            new("ClubId", clubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Setup authorization service to allow access
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns(userId);
    }

    private void SetupUnauthenticatedUser()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "ClubAdmin")
            // No NameIdentifier claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns((int?)null);
    }

    #region BulkAssignTags Tests

    [Test]
    public async Task BulkAssignTags_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new BulkAssignTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        var expectedResult = new BulkTagOperationResult
        {
            SuccessCount = 3,
            ErrorCount = 0,
            Errors = new List<BulkOperationError>()
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkAssignTagsAsync(clubId, userId, It.Is<BulkAssignTagsRequest>(r =>
                r.ClubId == clubId && r.RequestedByUserId == userId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.BulkAssignTags(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var tagResult = okResult.Value as BulkTagOperationResult;
        tagResult.Should().NotBeNull();
        tagResult!.SuccessCount.Should().Be(3);
        tagResult.ErrorCount.Should().Be(0);
        tagResult.TotalCount.Should().Be(3);
    }

    [Test]
    public async Task BulkAssignTags_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var request = new BulkAssignTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.BulkAssignTags(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("Invalid authentication token");

        _bulkOperationsServiceMock.Verify(
            s => s.BulkAssignTagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkAssignTagsRequest>()),
            Times.Never);
    }

    [Test]
    public async Task BulkAssignTags_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkAssignTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkAssignTagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkAssignTagsRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid tag IDs"));

        // Act
        var result = await _controller.BulkAssignTags(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid tag IDs");
    }

    [Test]
    public async Task BulkAssignTags_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkAssignTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkAssignTagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkAssignTagsRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.BulkAssignTags(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred during bulk tag assignment.");
    }

    #endregion

    #region BulkRemoveTags Tests

    [Test]
    public async Task BulkRemoveTags_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new BulkRemoveTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        var expectedResult = new BulkTagOperationResult
        {
            SuccessCount = 3,
            ErrorCount = 0,
            Errors = new List<BulkOperationError>()
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkRemoveTagsAsync(clubId, userId, It.Is<BulkRemoveTagsRequest>(r =>
                r.ClubId == clubId && r.RequestedByUserId == userId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.BulkRemoveTags(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var tagResult = okResult.Value as BulkTagOperationResult;
        tagResult.Should().NotBeNull();
        tagResult!.SuccessCount.Should().Be(3);
        tagResult.ErrorCount.Should().Be(0);
    }

    [Test]
    public async Task BulkRemoveTags_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var request = new BulkRemoveTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.BulkRemoveTags(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _bulkOperationsServiceMock.Verify(
            s => s.BulkRemoveTagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkRemoveTagsRequest>()),
            Times.Never);
    }

    [Test]
    public async Task BulkRemoveTags_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkRemoveTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkRemoveTagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkRemoveTagsRequest>()))
            .ThrowsAsync(new ArgumentException("Tag not found"));

        // Act
        var result = await _controller.BulkRemoveTags(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Tag not found");
    }

    [Test]
    public async Task BulkRemoveTags_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkRemoveTagsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            TagIds = new List<int> { 10, 20 }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkRemoveTagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkRemoveTagsRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.BulkRemoveTags(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred during bulk tag removal.");
    }

    #endregion

    #region BulkUpdateCustomFields Tests

    [Test]
    public async Task BulkUpdateCustomFields_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new BulkUpdateCustomFieldsRequest
        {
            CustomFieldId = 5,
            Updates = new List<MemberCustomFieldUpdate>
            {
                new() { MemberId = 1, NewValue = "Value1" },
                new() { MemberId = 2, NewValue = "Value2" }
            }
        };

        var expectedResult = new BulkCustomFieldResult
        {
            SuccessCount = 2,
            ErrorCount = 0,
            Errors = new List<BulkOperationError>()
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkUpdateCustomFieldsAsync(clubId, userId, It.Is<BulkUpdateCustomFieldsRequest>(r =>
                r.ClubId == clubId && r.RequestedByUserId == userId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.BulkUpdateCustomFields(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var fieldResult = okResult.Value as BulkCustomFieldResult;
        fieldResult.Should().NotBeNull();
        fieldResult!.SuccessCount.Should().Be(2);
        fieldResult.ErrorCount.Should().Be(0);
    }

    [Test]
    public async Task BulkUpdateCustomFields_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var request = new BulkUpdateCustomFieldsRequest
        {
            CustomFieldId = 5,
            Updates = new List<MemberCustomFieldUpdate>
            {
                new() { MemberId = 1, NewValue = "Value1" }
            }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.BulkUpdateCustomFields(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _bulkOperationsServiceMock.Verify(
            s => s.BulkUpdateCustomFieldsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkUpdateCustomFieldsRequest>()),
            Times.Never);
    }

    [Test]
    public async Task BulkUpdateCustomFields_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkUpdateCustomFieldsRequest
        {
            CustomFieldId = 5,
            Updates = new List<MemberCustomFieldUpdate>
            {
                new() { MemberId = 1, NewValue = "Value1" }
            }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkUpdateCustomFieldsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkUpdateCustomFieldsRequest>()))
            .ThrowsAsync(new ArgumentException("Custom field not found"));

        // Act
        var result = await _controller.BulkUpdateCustomFields(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Custom field not found");
    }

    [Test]
    public async Task BulkUpdateCustomFields_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkUpdateCustomFieldsRequest
        {
            CustomFieldId = 5,
            Updates = new List<MemberCustomFieldUpdate>
            {
                new() { MemberId = 1, NewValue = "Value1" }
            }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkUpdateCustomFieldsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkUpdateCustomFieldsRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.BulkUpdateCustomFields(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred during bulk custom field update.");
    }

    #endregion

    #region BulkUpdateMemberStatuses Tests

    [Test]
    public async Task BulkUpdateMemberStatuses_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new BulkUpdateMemberStatusRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            NewStatus = "Active"
        };

        var expectedResult = new BulkMemberUpdateResult
        {
            SuccessfulUpdates = 3,
            FailedUpdates = 0,
            TotalTargeted = 3,
            ValidationErrors = new List<BulkValidationError>(),
            ProcessingErrors = new List<BulkProcessingError>()
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkUpdateMemberStatusAsync(clubId, userId, It.Is<BulkUpdateMemberStatusRequest>(r =>
                r.ClubId == clubId && r.RequestedByUserId == userId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.BulkUpdateMemberStatuses(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var statusResult = okResult.Value as BulkMemberUpdateResult;
        statusResult.Should().NotBeNull();
        statusResult!.SuccessCount.Should().Be(3); // Uses computed property
        statusResult.ErrorCount.Should().Be(0); // Uses computed property
        statusResult.TotalTargeted.Should().Be(3);
    }

    [Test]
    public async Task BulkUpdateMemberStatuses_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var request = new BulkUpdateMemberStatusRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            NewStatus = "Archived"
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.BulkUpdateMemberStatuses(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _bulkOperationsServiceMock.Verify(
            s => s.BulkUpdateMemberStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkUpdateMemberStatusRequest>()),
            Times.Never);
    }

    [Test]
    public async Task BulkUpdateMemberStatuses_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkUpdateMemberStatusRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            NewStatus = "InvalidStatus"
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkUpdateMemberStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkUpdateMemberStatusRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid status"));

        // Act
        var result = await _controller.BulkUpdateMemberStatuses(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid status");
    }

    [Test]
    public async Task BulkUpdateMemberStatuses_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkUpdateMemberStatusRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            NewStatus = "Active"
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkUpdateMemberStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkUpdateMemberStatusRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.BulkUpdateMemberStatuses(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred during bulk member status update.");
    }

    #endregion

    #region BulkExport Tests

    [Test]
    public async Task BulkExport_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new BulkExportRequest
        {
            ExportFormat = ExportFormat.CSV,
            IncludeCustomFields = true,
            IncludeTags = true
        };

        var expectedResult = new BulkExportResult
        {
            TotalRecordsExported = 150,
            FileInfo = new ExportFileInfo
            {
                DownloadUrl = "https://example.com/exports/members-2024-01-15.csv",
                FileFormat = "CSV"
            },
            CompletedAt = DateTime.UtcNow
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkExportMembersAsync(clubId, userId, It.Is<BulkExportRequest>(r =>
                r.ClubId == clubId && r.RequestedByUserId == userId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.BulkExport(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var exportResult = okResult.Value as BulkExportResult;
        exportResult.Should().NotBeNull();
        exportResult!.RecordCount.Should().Be(150); // Uses computed property
        exportResult.FileInfo.DownloadUrl.Should().Be("https://example.com/exports/members-2024-01-15.csv");
        exportResult.FileInfo.FileFormat.Should().Be("CSV");
    }

    [Test]
    public async Task BulkExport_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var request = new BulkExportRequest
        {
            ExportFormat = ExportFormat.Excel
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.BulkExport(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _bulkOperationsServiceMock.Verify(
            s => s.BulkExportMembersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkExportRequest>()),
            Times.Never);
    }

    [Test]
    public async Task BulkExport_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkExportRequest
        {
            ExportFormat = ExportFormat.CSV // Service will throw regardless
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkExportMembersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkExportRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid export format"));

        // Act
        var result = await _controller.BulkExport(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid export format");
    }

    [Test]
    public async Task BulkExport_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkExportRequest
        {
            ExportFormat = ExportFormat.CSV
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkExportMembersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkExportRequest>()))
            .ThrowsAsync(new Exception("Storage error"));

        // Act
        var result = await _controller.BulkExport(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred during bulk export.");
    }

    #endregion

    #region BulkImport Tests

    [Test]
    public async Task BulkImport_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new BulkImportRequest
        {
            FileContent = "Rmlyc3ROYW1lLExhc3ROYW1lLEVtYWls", // Base64 encoded CSV
            FileName = "members.csv",
            FileType = ImportFileType.CSV,
            ImportMode = ImportMode.Upsert,
            ColumnMapping = new Dictionary<string, string>
            {
                { "FirstName", "FirstName" },
                { "LastName", "LastName" },
                { "Email", "Email" }
            }
        };

        var expectedResult = new BulkImportResult
        {
            SuccessfulImports = 50,
            FailedImports = 5,
            TotalRecordsInFile = 55,
            ValidationErrors = new List<ImportValidationError>
            {
                new() { ErrorMessage = "Row 10: Invalid email" },
                new() { ErrorMessage = "Row 25: Missing required field" }
            }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkImportMembersAsync(clubId, userId, It.Is<BulkImportRequest>(r =>
                r.ClubId == clubId && r.RequestedByUserId == userId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.BulkImport(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var importResult = okResult.Value as BulkImportResult;
        importResult.Should().NotBeNull();
        importResult!.SuccessCount.Should().Be(50); // Uses computed property
        importResult.ErrorCount.Should().Be(5); // Uses computed property
        importResult.TotalRecordsInFile.Should().Be(55);
        importResult.ValidationErrors.Should().HaveCount(2);
    }

    [Test]
    public async Task BulkImport_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var request = new BulkImportRequest
        {
            FileContent = "test",
            FileName = "members.csv",
            ColumnMapping = new Dictionary<string, string> { { "Email", "Email" } }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.BulkImport(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _bulkOperationsServiceMock.Verify(
            s => s.BulkImportMembersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkImportRequest>()),
            Times.Never);
    }

    [Test]
    public async Task BulkImport_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkImportRequest
        {
            FileContent = "invalid-content",
            FileName = "members.csv",
            ColumnMapping = new Dictionary<string, string> { { "Email", "Email" } }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkImportMembersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkImportRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid file format"));

        // Act
        var result = await _controller.BulkImport(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid file format");
    }

    [Test]
    public async Task BulkImport_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new BulkImportRequest
        {
            FileContent = "test-content",
            FileName = "members.csv",
            ColumnMapping = new Dictionary<string, string> { { "Email", "Email" } }
        };

        _bulkOperationsServiceMock
            .Setup(s => s.BulkImportMembersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<BulkImportRequest>()))
            .ThrowsAsync(new Exception("Processing error"));

        // Act
        var result = await _controller.BulkImport(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred during bulk import.");
    }

    #endregion

    #region GetOperationStatus Tests

    [Test]
    public async Task GetOperationStatus_ValidOperationId_ReturnsOkWithStatus()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var operationId = "op-12345";

        var expectedStatus = BulkOperationStatus.Completed;

        _bulkOperationsServiceMock
            .Setup(s => s.GetOperationStatusAsync(clubId, operationId, userId))
            .ReturnsAsync(expectedStatus);

        // Act
        var result = await _controller.GetOperationStatus(clubId, operationId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var status = okResult.Value;
        status.Should().Be(BulkOperationStatus.Completed);
    }

    // Note: OperationNotFound test omitted because service interface returns non-nullable BulkOperationStatus
    // The controller's null check is unreachable code given the current interface definition

    [Test]
    public async Task GetOperationStatus_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var operationId = "op-12345";

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.GetOperationStatus(clubId, operationId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _bulkOperationsServiceMock.Verify(
            s => s.GetOperationStatusAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetOperationStatus_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var operationId = "invalid-id";

        _bulkOperationsServiceMock
            .Setup(s => s.GetOperationStatusAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()))
            .ThrowsAsync(new ArgumentException("Invalid operation ID format"));

        // Act
        var result = await _controller.GetOperationStatus(clubId, operationId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid operation ID format");
    }

    [Test]
    public async Task GetOperationStatus_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var operationId = "op-12345";

        _bulkOperationsServiceMock
            .Setup(s => s.GetOperationStatusAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetOperationStatus(clubId, operationId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred while retrieving operation status.");
    }

    #endregion

    #region CancelOperation Tests

    [Test]
    public async Task CancelOperation_ValidOperationId_ReturnsOkWithMessage()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var operationId = "op-12345";

        _bulkOperationsServiceMock
            .Setup(s => s.CancelOperationAsync(clubId, operationId, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CancelOperation(clubId, operationId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Operation cancelled successfully");
    }

    [Test]
    public async Task CancelOperation_CannotBeCancelled_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var operationId = "op-completed";

        _bulkOperationsServiceMock
            .Setup(s => s.CancelOperationAsync(clubId, operationId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CancelOperation(clubId, operationId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Operation cannot be cancelled");
    }

    [Test]
    public async Task CancelOperation_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var operationId = "op-12345";

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CancelOperation(clubId, operationId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _bulkOperationsServiceMock.Verify(
            s => s.CancelOperationAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task CancelOperation_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var operationId = "invalid-id";

        _bulkOperationsServiceMock
            .Setup(s => s.CancelOperationAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()))
            .ThrowsAsync(new ArgumentException("Invalid operation ID"));

        // Act
        var result = await _controller.CancelOperation(clubId, operationId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid operation ID");
    }

    [Test]
    public async Task CancelOperation_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var operationId = "op-12345";

        _bulkOperationsServiceMock
            .Setup(s => s.CancelOperationAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CancelOperation(clubId, operationId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An unexpected error occurred while cancelling the operation.");
    }

    #endregion
}
