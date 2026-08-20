using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MemberTransfersControllerTests
{
    private Mock<IMemberTransferService> _transferServiceMock = null!;
    private Mock<ILogger<MemberTransfersController>> _loggerMock = null!;
    private Mock<IUrlHelper> _urlHelperMock = null!;
    private MemberTransfersController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _transferServiceMock = new Mock<IMemberTransferService>();
        _loggerMock = new Mock<ILogger<MemberTransfersController>>();
        _urlHelperMock = new Mock<IUrlHelper>();

        _controller = new MemberTransfersController(
            _transferServiceMock.Object,
            _loggerMock.Object);

        // Setup URL helper for CreatedAtAction
        _controller.Url = _urlHelperMock.Object;

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1);
    }

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "Admin"),
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

    #region RequestTransfer Tests

    [Test]
    public async Task RequestTransfer_ValidRequest_ReturnsCreatedWithTransfer()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = 5,
            TransferReason = "Member relocating to new city"
        };

        var expectedTransfer = new MemberTransferResponse
        {
            Id = 100,
            MemberId = memberId,
            MemberName = "John Doe",
            MemberEmail = "john@example.com",
            FromLocationId = 1,
            FromLocationName = "North Location",
            ToLocationId = request.ToLocationId,
            ToLocationName = "South Location",
            TransferReason = request.TransferReason,
            Status = MemberTransferStatus.Pending,
            StatusName = "Pending",
            RequestedAt = DateTime.UtcNow,
            RequestedBy = userId,
            RequestedByName = "Admin User"
        };

        _transferServiceMock
            .Setup(s => s.RequestTransferAsync(memberId, userId, request))
            .ReturnsAsync(expectedTransfer);

        // Act
        var result = await _controller.RequestTransfer(memberId, request);

        // Assert
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.StatusCode.Should().Be(201);
        createdResult.ActionName.Should().Be(nameof(MemberTransfersController.GetTransferHistory));

        var transfer = createdResult.Value as MemberTransferResponse;
        transfer.Should().NotBeNull();
        transfer!.Id.Should().Be(100);
        transfer.MemberId.Should().Be(memberId);
        transfer.FromLocationName.Should().Be("North Location");
        transfer.ToLocationName.Should().Be("South Location");
        transfer.Status.Should().Be(MemberTransferStatus.Pending);
    }

    [Test]
    public async Task RequestTransfer_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var memberId = 10;
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = 5,
            TransferReason = "Member relocating"
        };

        // Act
        var result = await _controller.RequestTransfer(memberId, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid user authentication");

        // Verify service was never called
        _transferServiceMock.Verify(
            s => s.RequestTransferAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CreateMemberTransferRequest>()),
            Times.Never);
    }

    [Test]
    public async Task RequestTransfer_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = 5,
            TransferReason = "Member relocating"
        };

        _transferServiceMock
            .Setup(s => s.RequestTransferAsync(memberId, userId, request))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have permission to request transfers"));

        // Act
        var result = await _controller.RequestTransfer(memberId, request);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task RequestTransfer_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = 5,
            TransferReason = "Member relocating"
        };

        _transferServiceMock
            .Setup(s => s.RequestTransferAsync(memberId, userId, request))
            .ThrowsAsync(new InvalidOperationException("Member already has a pending transfer"));

        // Act
        var result = await _controller.RequestTransfer(memberId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Member already has a pending transfer");
    }

    [Test]
    public async Task RequestTransfer_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = 999, // Invalid location
            TransferReason = "Member relocating"
        };

        _transferServiceMock
            .Setup(s => s.RequestTransferAsync(memberId, userId, request))
            .ThrowsAsync(new ArgumentException("Target location not found"));

        // Act
        var result = await _controller.RequestTransfer(memberId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Target location not found");
    }

    [Test]
    public async Task RequestTransfer_GenericException_Returns500()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = 5,
            TransferReason = "Member relocating"
        };

        _transferServiceMock
            .Setup(s => s.RequestTransferAsync(memberId, userId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RequestTransfer(memberId, request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while requesting the transfer");
    }

    #endregion

    #region GetPendingTransfers Tests

    [Test]
    public async Task GetPendingTransfers_ValidRequest_ReturnsOkWithTransferList()
    {
        // Arrange
        var locationId = 5;
        var userId = 1;
        var expectedTransfers = new List<MemberTransferResponse>
        {
            new()
            {
                Id = 100,
                MemberId = 10,
                MemberName = "John Doe",
                MemberEmail = "john@example.com",
                FromLocationId = 1,
                FromLocationName = "North Location",
                ToLocationId = locationId,
                ToLocationName = "South Location",
                TransferReason = "Relocating",
                Status = MemberTransferStatus.Pending,
                StatusName = "Pending",
                RequestedAt = DateTime.UtcNow.AddDays(-3),
                RequestedBy = 2,
                RequestedByName = "Manager"
            },
            new()
            {
                Id = 101,
                MemberId = 11,
                MemberName = "Jane Smith",
                MemberEmail = "jane@example.com",
                FromLocationId = 2,
                FromLocationName = "East Location",
                ToLocationId = locationId,
                ToLocationName = "South Location",
                TransferReason = "Job transfer",
                Status = MemberTransferStatus.Pending,
                StatusName = "Pending",
                RequestedAt = DateTime.UtcNow.AddDays(-1),
                RequestedBy = 3,
                RequestedByName = "Supervisor"
            }
        };

        _transferServiceMock
            .Setup(s => s.GetPendingTransfersAsync(locationId, userId))
            .ReturnsAsync(expectedTransfers);

        // Act
        var result = await _controller.GetPendingTransfers(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var transfers = okResult.Value as List<MemberTransferResponse>;
        transfers.Should().NotBeNull();
        transfers.Should().HaveCount(2);
        transfers![0].MemberName.Should().Be("John Doe");
        transfers[0].Status.Should().Be(MemberTransferStatus.Pending);
        transfers[1].MemberName.Should().Be("Jane Smith");
    }

    [Test]
    public async Task GetPendingTransfers_NoPendingTransfers_ReturnsOkWithEmptyList()
    {
        // Arrange
        var locationId = 5;
        var userId = 1;
        var expectedTransfers = new List<MemberTransferResponse>();

        _transferServiceMock
            .Setup(s => s.GetPendingTransfersAsync(locationId, userId))
            .ReturnsAsync(expectedTransfers);

        // Act
        var result = await _controller.GetPendingTransfers(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var transfers = okResult!.Value as List<MemberTransferResponse>;
        transfers.Should().NotBeNull();
        transfers.Should().BeEmpty();
    }

    [Test]
    public async Task GetPendingTransfers_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var locationId = 5;

        // Act
        var result = await _controller.GetPendingTransfers(locationId);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _transferServiceMock.Verify(
            s => s.GetPendingTransfersAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetPendingTransfers_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var locationId = 5;
        var userId = 1;

        _transferServiceMock
            .Setup(s => s.GetPendingTransfersAsync(locationId, userId))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have access to this location"));

        // Act
        var result = await _controller.GetPendingTransfers(locationId);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetPendingTransfers_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var locationId = 999; // Non-existent location
        var userId = 1;

        _transferServiceMock
            .Setup(s => s.GetPendingTransfersAsync(locationId, userId))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.GetPendingTransfers(locationId);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Location not found");
    }

    [Test]
    public async Task GetPendingTransfers_GenericException_Returns500()
    {
        // Arrange
        var locationId = 5;
        var userId = 1;

        _transferServiceMock
            .Setup(s => s.GetPendingTransfersAsync(locationId, userId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetPendingTransfers(locationId);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving pending transfers");
    }

    #endregion

    #region ApproveTransfer Tests

    [Test]
    public async Task ApproveTransfer_ValidRequest_ReturnsOkWithApprovedTransfer()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new ApproveTransferRequest
        {
            ApprovalNotes = "Transfer approved by regional manager"
        };

        var expectedTransfer = new MemberTransferResponse
        {
            Id = transferId,
            MemberId = 10,
            MemberName = "John Doe",
            MemberEmail = "john@example.com",
            FromLocationId = 1,
            FromLocationName = "North Location",
            ToLocationId = 5,
            ToLocationName = "South Location",
            TransferReason = "Relocating",
            Status = MemberTransferStatus.Approved,
            StatusName = "Approved",
            RequestedAt = DateTime.UtcNow.AddDays(-3),
            RequestedBy = 2,
            RequestedByName = "Manager",
            ApprovedAt = DateTime.UtcNow,
            ApprovedBy = userId,
            ApprovedByName = "Admin User",
            ApprovalNotes = request.ApprovalNotes
        };

        _transferServiceMock
            .Setup(s => s.ApproveTransferAsync(transferId, userId, request))
            .ReturnsAsync(expectedTransfer);

        // Act
        var result = await _controller.ApproveTransfer(transferId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var transfer = okResult.Value as MemberTransferResponse;
        transfer.Should().NotBeNull();
        transfer!.Id.Should().Be(transferId);
        transfer.Status.Should().Be(MemberTransferStatus.Approved);
        transfer.ApprovedBy.Should().Be(userId);
        transfer.ApprovalNotes.Should().Be(request.ApprovalNotes);
    }

    [Test]
    public async Task ApproveTransfer_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var transferId = 100;
        var request = new ApproveTransferRequest
        {
            ApprovalNotes = "Approved"
        };

        // Act
        var result = await _controller.ApproveTransfer(transferId, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _transferServiceMock.Verify(
            s => s.ApproveTransferAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<ApproveTransferRequest>()),
            Times.Never);
    }

    [Test]
    public async Task ApproveTransfer_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new ApproveTransferRequest
        {
            ApprovalNotes = "Approved"
        };

        _transferServiceMock
            .Setup(s => s.ApproveTransferAsync(transferId, userId, request))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have permission to approve transfers"));

        // Act
        var result = await _controller.ApproveTransfer(transferId, request);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task ApproveTransfer_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new ApproveTransferRequest
        {
            ApprovalNotes = "Approved"
        };

        _transferServiceMock
            .Setup(s => s.ApproveTransferAsync(transferId, userId, request))
            .ThrowsAsync(new InvalidOperationException("Transfer has already been processed"));

        // Act
        var result = await _controller.ApproveTransfer(transferId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Transfer has already been processed");
    }

    [Test]
    public async Task ApproveTransfer_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var transferId = 999; // Non-existent transfer
        var userId = 1;
        var request = new ApproveTransferRequest
        {
            ApprovalNotes = "Approved"
        };

        _transferServiceMock
            .Setup(s => s.ApproveTransferAsync(transferId, userId, request))
            .ThrowsAsync(new ArgumentException("Transfer not found"));

        // Act
        var result = await _controller.ApproveTransfer(transferId, request);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Transfer not found");
    }

    [Test]
    public async Task ApproveTransfer_GenericException_Returns500()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new ApproveTransferRequest
        {
            ApprovalNotes = "Approved"
        };

        _transferServiceMock
            .Setup(s => s.ApproveTransferAsync(transferId, userId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ApproveTransfer(transferId, request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while approving the transfer");
    }

    #endregion

    #region DenyTransfer Tests

    [Test]
    public async Task DenyTransfer_ValidRequest_ReturnsOkWithDeniedTransfer()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new DenyTransferRequest
        {
            DenialReason = "Target location is at capacity"
        };

        var expectedTransfer = new MemberTransferResponse
        {
            Id = transferId,
            MemberId = 10,
            MemberName = "John Doe",
            MemberEmail = "john@example.com",
            FromLocationId = 1,
            FromLocationName = "North Location",
            ToLocationId = 5,
            ToLocationName = "South Location",
            TransferReason = "Relocating",
            Status = MemberTransferStatus.Denied,
            StatusName = "Denied",
            RequestedAt = DateTime.UtcNow.AddDays(-3),
            RequestedBy = 2,
            RequestedByName = "Manager"
        };

        _transferServiceMock
            .Setup(s => s.DenyTransferAsync(transferId, userId, request))
            .ReturnsAsync(expectedTransfer);

        // Act
        var result = await _controller.DenyTransfer(transferId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var transfer = okResult.Value as MemberTransferResponse;
        transfer.Should().NotBeNull();
        transfer!.Id.Should().Be(transferId);
        transfer.Status.Should().Be(MemberTransferStatus.Denied);
    }

    [Test]
    public async Task DenyTransfer_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var transferId = 100;
        var request = new DenyTransferRequest
        {
            DenialReason = "Not approved"
        };

        // Act
        var result = await _controller.DenyTransfer(transferId, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _transferServiceMock.Verify(
            s => s.DenyTransferAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DenyTransferRequest>()),
            Times.Never);
    }

    [Test]
    public async Task DenyTransfer_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new DenyTransferRequest
        {
            DenialReason = "Not approved"
        };

        _transferServiceMock
            .Setup(s => s.DenyTransferAsync(transferId, userId, request))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have permission to deny transfers"));

        // Act
        var result = await _controller.DenyTransfer(transferId, request);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task DenyTransfer_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new DenyTransferRequest
        {
            DenialReason = "Not approved"
        };

        _transferServiceMock
            .Setup(s => s.DenyTransferAsync(transferId, userId, request))
            .ThrowsAsync(new InvalidOperationException("Transfer has already been approved"));

        // Act
        var result = await _controller.DenyTransfer(transferId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Transfer has already been approved");
    }

    [Test]
    public async Task DenyTransfer_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var transferId = 999; // Non-existent transfer
        var userId = 1;
        var request = new DenyTransferRequest
        {
            DenialReason = "Not approved"
        };

        _transferServiceMock
            .Setup(s => s.DenyTransferAsync(transferId, userId, request))
            .ThrowsAsync(new ArgumentException("Transfer not found"));

        // Act
        var result = await _controller.DenyTransfer(transferId, request);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Transfer not found");
    }

    [Test]
    public async Task DenyTransfer_GenericException_Returns500()
    {
        // Arrange
        var transferId = 100;
        var userId = 1;
        var request = new DenyTransferRequest
        {
            DenialReason = "Not approved"
        };

        _transferServiceMock
            .Setup(s => s.DenyTransferAsync(transferId, userId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.DenyTransfer(transferId, request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while denying the transfer");
    }

    #endregion

    #region GetTransferHistory Tests

    [Test]
    public async Task GetTransferHistory_ValidRequest_ReturnsOkWithHistory()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;
        var expectedHistory = new List<MemberTransferResponse>
        {
            new()
            {
                Id = 100,
                MemberId = memberId,
                MemberName = "John Doe",
                MemberEmail = "john@example.com",
                FromLocationId = 1,
                FromLocationName = "North Location",
                ToLocationId = 5,
                ToLocationName = "South Location",
                TransferReason = "Relocating",
                Status = MemberTransferStatus.Approved,
                StatusName = "Approved",
                RequestedAt = DateTime.UtcNow.AddMonths(-2),
                RequestedBy = 2,
                RequestedByName = "Manager",
                ApprovedAt = DateTime.UtcNow.AddMonths(-2).AddDays(3),
                ApprovedBy = 1,
                ApprovedByName = "Admin User"
            },
            new()
            {
                Id = 101,
                MemberId = memberId,
                MemberName = "John Doe",
                MemberEmail = "john@example.com",
                FromLocationId = 5,
                FromLocationName = "South Location",
                ToLocationId = 8,
                ToLocationName = "West Location",
                TransferReason = "Job transfer",
                Status = MemberTransferStatus.Pending,
                StatusName = "Pending",
                RequestedAt = DateTime.UtcNow.AddDays(-5),
                RequestedBy = 1,
                RequestedByName = "Admin User"
            }
        };

        _transferServiceMock
            .Setup(s => s.GetTransferHistoryAsync(memberId, userId))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetTransferHistory(memberId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var history = okResult.Value as List<MemberTransferResponse>;
        history.Should().NotBeNull();
        history.Should().HaveCount(2);
        history![0].Status.Should().Be(MemberTransferStatus.Approved);
        history[1].Status.Should().Be(MemberTransferStatus.Pending);
    }

    [Test]
    public async Task GetTransferHistory_NoHistory_ReturnsOkWithEmptyList()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;
        var expectedHistory = new List<MemberTransferResponse>();

        _transferServiceMock
            .Setup(s => s.GetTransferHistoryAsync(memberId, userId))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetTransferHistory(memberId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var history = okResult!.Value as List<MemberTransferResponse>;
        history.Should().NotBeNull();
        history.Should().BeEmpty();
    }

    [Test]
    public async Task GetTransferHistory_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var memberId = 10;

        // Act
        var result = await _controller.GetTransferHistory(memberId);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _transferServiceMock.Verify(
            s => s.GetTransferHistoryAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetTransferHistory_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;

        _transferServiceMock
            .Setup(s => s.GetTransferHistoryAsync(memberId, userId))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have permission to view this member's transfer history"));

        // Act
        var result = await _controller.GetTransferHistory(memberId);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetTransferHistory_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var memberId = 999; // Non-existent member
        var userId = 1;

        _transferServiceMock
            .Setup(s => s.GetTransferHistoryAsync(memberId, userId))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.GetTransferHistory(memberId);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Member not found");
    }

    [Test]
    public async Task GetTransferHistory_GenericException_Returns500()
    {
        // Arrange
        var memberId = 10;
        var userId = 1;

        _transferServiceMock
            .Setup(s => s.GetTransferHistoryAsync(memberId, userId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetTransferHistory(memberId);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving transfer history");
    }

    #endregion
}
