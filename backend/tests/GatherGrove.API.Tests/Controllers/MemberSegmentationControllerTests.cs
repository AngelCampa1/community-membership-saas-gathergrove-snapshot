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
public class MemberSegmentationControllerTests
{
    private Mock<IMemberSegmentationService> _memberSegmentationServiceMock = null!;
    private Mock<IClubAuthorizationService> _authServiceMock = null!;
    private Mock<ILogger<MemberSegmentationController>> _loggerMock = null!;
    private MemberSegmentationController _controller = null!;
    private ClaimsPrincipal _user = null!;

    [SetUp]
    public void SetUp()
    {
        _memberSegmentationServiceMock = new Mock<IMemberSegmentationService>();
        _authServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<MemberSegmentationController>>();

        _controller = new MemberSegmentationController(
            _memberSegmentationServiceMock.Object,
            _authServiceMock.Object,
            _loggerMock.Object);

        SetupAuthenticatedUser();
    }

    private void SetupAuthenticatedUser()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "ClubAdmin"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _user = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = _user }
        };
    }

    #region GetSegments Tests

    [Test]
    public async Task GetSegments_ValidRequest_ReturnsOkWithSegments()
    {
        // Arrange
        var clubId = 1;
        var segments = new List<MemberSegmentResponse>
        {
            new()
            {
                Id = 1,
                ClubId = clubId,
                Name = "Active Members",
                Description = "Highly engaged members",
                IsActive = true,
                MemberCount = 50
            },
            new()
            {
                Id = 2,
                ClubId = clubId,
                Name = "New Members",
                Description = "Members joined in last 30 days",
                IsActive = true,
                MemberCount = 15
            }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentsAsync(clubId, 1, false))
            .ReturnsAsync(segments);

        // Act
        var result = await _controller.GetSegments(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedSegments = okResult.Value as List<MemberSegmentResponse>;
        returnedSegments.Should().NotBeNull();
        returnedSegments.Should().HaveCount(2);
        returnedSegments![0].Name.Should().Be("Active Members");
    }

    [Test]
    public async Task GetSegments_WithIncludeInactiveTrue_ReturnsAllSegments()
    {
        // Arrange
        var clubId = 1;
        var segments = new List<MemberSegmentResponse>
        {
            new() { Id = 1, Name = "Active", IsActive = true },
            new() { Id = 2, Name = "Inactive", IsActive = false }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentsAsync(clubId, 1, true))
            .ReturnsAsync(segments);

        // Act
        var result = await _controller.GetSegments(clubId, includeInactive: true);

        // Assert
        var okResult = result as OkObjectResult;
        var returnedSegments = okResult!.Value as List<MemberSegmentResponse>;
        returnedSegments.Should().HaveCount(2);
    }

    [Test]
    public async Task GetSegments_NotClubAdmin_Returns403()
    {
        // Arrange
        var clubId = 1;
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetSegments(clubId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetSegments_NotUnlimitedTier_Returns403()
    {
        // Arrange
        var clubId = 1;
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(false);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);

        // Act
        var result = await _controller.GetSegments(clubId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetSegments_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentsAsync(clubId, 1, false))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegments(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSegment Tests

    [Test]
    public async Task GetSegment_ValidRequest_ReturnsOkWithSegment()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var segment = new MemberSegmentResponse
        {
            Id = segmentId,
            ClubId = clubId,
            Name = "VIP Members",
            Description = "High-value members",
            IsActive = true,
            MemberCount = 25
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentByIdAsync(clubId, segmentId, 1))
            .ReturnsAsync(segment);

        // Act
        var result = await _controller.GetSegment(clubId, segmentId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(segment);
    }

    [Test]
    public async Task GetSegment_SegmentNotFound_Returns404()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 999;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentByIdAsync(clubId, segmentId, 1))
            .ReturnsAsync((MemberSegmentResponse?)null);

        // Act
        var result = await _controller.GetSegment(clubId, segmentId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task GetSegment_NotClubAdmin_Returns403()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetSegment(clubId, segmentId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetSegment_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentByIdAsync(clubId, segmentId, 1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegment(clubId, segmentId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region CreateSegment Tests

    [Test]
    public async Task CreateSegment_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateSegmentRequest
        {
            Name = "New Segment",
            Description = "Test segment",
            FilterCriteria = new SegmentFilterCriteria()
        };
        var createdSegment = new MemberSegmentResponse
        {
            Id = 1,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
            MemberCount = 0
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.CreateSegmentAsync(clubId, 1, It.IsAny<CreateMemberSegmentRequest>()))
            .ReturnsAsync(createdSegment);

        // Act
        var result = await _controller.CreateSegment(clubId, request);

        // Assert
        var createdResult = result as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.StatusCode.Should().Be(201);
        createdResult.Value.Should().BeEquivalentTo(createdSegment);
        createdResult.ActionName.Should().Be(nameof(_controller.GetSegment));
    }

    [Test]
    public async Task CreateSegment_DuplicateName_Returns400()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateSegmentRequest { Name = "Existing Segment" };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.CreateSegmentAsync(clubId, 1, It.IsAny<CreateMemberSegmentRequest>()))
            .ThrowsAsync(new ArgumentException("Segment with this name already exists"));

        // Act
        var result = await _controller.CreateSegment(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task CreateSegment_NotUnlimitedTier_Returns403()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateSegmentRequest { Name = "Test" };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(false);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);

        // Act
        var result = await _controller.CreateSegment(clubId, request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task CreateSegment_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateSegmentRequest { Name = "Test" };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.CreateSegmentAsync(clubId, 1, It.IsAny<CreateMemberSegmentRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateSegment(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region UpdateSegment Tests

    [Test]
    public async Task UpdateSegment_ValidRequest_ReturnsOkWithUpdatedSegment()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var request = new UpdateSegmentRequest
        {
            Name = "Updated Segment",
            Description = "Updated description"
        };
        var updatedSegment = new MemberSegmentResponse
        {
            Id = segmentId,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            IsActive = true
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.UpdateSegmentAsync(clubId, segmentId, 1, It.IsAny<UpdateMemberSegmentRequest>()))
            .ReturnsAsync(updatedSegment);

        // Act
        var result = await _controller.UpdateSegment(clubId, segmentId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(updatedSegment);
    }

    [Test]
    public async Task UpdateSegment_SegmentNotFound_ReturnsOkWithNull()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 999;
        var request = new UpdateSegmentRequest { Name = "Test" };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.UpdateSegmentAsync(clubId, segmentId, 1, It.IsAny<UpdateMemberSegmentRequest>()))
            .ReturnsAsync((MemberSegmentResponse?)null);

        // Act
        var result = await _controller.UpdateSegment(clubId, segmentId, request);

        // Assert - Controller returns Ok with null value
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        okResult.Value.Should().BeNull();
    }

    [Test]
    public async Task UpdateSegment_NotClubAdmin_Returns403()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var request = new UpdateSegmentRequest { Name = "Test" };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.UpdateSegment(clubId, segmentId, request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task UpdateSegment_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var request = new UpdateSegmentRequest { Name = "Test" };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.UpdateSegmentAsync(clubId, segmentId, 1, It.IsAny<UpdateMemberSegmentRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateSegment(clubId, segmentId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region DeleteSegment Tests

    [Test]
    public async Task DeleteSegment_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.DeleteSegmentAsync(clubId, segmentId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteSegment(clubId, segmentId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Test]
    public async Task DeleteSegment_SegmentNotFound_Returns404()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 999;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.DeleteSegmentAsync(clubId, segmentId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteSegment(clubId, segmentId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Test]
    public async Task DeleteSegment_NotClubAdmin_Returns403()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteSegment(clubId, segmentId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task DeleteSegment_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.DeleteSegmentAsync(clubId, segmentId, 1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.DeleteSegment(clubId, segmentId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSegmentMembers Tests

    [Test]
    public async Task GetSegmentMembers_ValidRequest_ReturnsOkWithPaginatedMembers()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var request = new GetSegmentMembersRequest
        {
            Page = 1,
            PageSize = 20
        };
        var response = new PaginatedSegmentMembersResponse
        {
            SegmentId = segmentId,
            SegmentName = "Test Segment",
            Members = new List<SegmentMemberResponse>
            {
                new() { MemberId = 1, FullName = "John Doe", Email = "john@example.com" },
                new() { MemberId = 2, FullName = "Jane Smith", Email = "jane@example.com" }
            },
            TotalCount = 2,
            CurrentPage = 1,
            PageSize = 20,
            TotalPages = 1,
            HasNext = false,
            HasPrevious = false
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentMembersAsync(clubId, 1, request))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.GetSegmentMembers(clubId, segmentId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(response);
    }

    [Test]
    public async Task GetSegmentMembers_SegmentNotFound_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 999;
        var request = new GetSegmentMembersRequest();

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentMembersAsync(clubId, 1, request))
            .ReturnsAsync((PaginatedSegmentMembersResponse?)null);

        // Act
        var result = await _controller.GetSegmentMembers(clubId, segmentId, request);

        // Assert - Null response causes NullReferenceException which returns 500
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    [Test]
    public async Task GetSegmentMembers_NotUnlimitedTier_Returns403()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var request = new GetSegmentMembersRequest();

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(false);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);

        // Act
        var result = await _controller.GetSegmentMembers(clubId, segmentId, request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetSegmentMembers_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var request = new GetSegmentMembersRequest();

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentMembersAsync(clubId, 1, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegmentMembers(clubId, segmentId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region RecalculateSegment Tests

    [Test]
    public async Task RecalculateSegment_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var result = new SegmentRecalculationResult
        {
            OperationId = "op-123",
            ClubId = clubId,
            SegmentId = segmentId,
            Status = RecalculationStatus.InProgress,
            IsSuccessful = true,
            MembersProcessed = 50,
            MembersAdded = 5,
            MembersRemoved = 3
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.RecalculateSegmentAsync(clubId, segmentId, 1))
            .ReturnsAsync(result);

        // Act
        var response = await _controller.RecalculateSegment(clubId, segmentId);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        okResult.Value.Should().BeEquivalentTo(result);
    }

    [Test]
    public async Task RecalculateSegment_SegmentNotFound_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 999;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.RecalculateSegmentAsync(clubId, segmentId, 1))
            .ReturnsAsync((SegmentRecalculationResult?)null);

        // Act
        var result = await _controller.RecalculateSegment(clubId, segmentId);

        // Assert - Null response causes NullReferenceException which returns 500
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    [Test]
    public async Task RecalculateSegment_NotClubAdmin_Returns403()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RecalculateSegment(clubId, segmentId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task RecalculateSegment_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.RecalculateSegmentAsync(clubId, segmentId, 1))
            .ThrowsAsync(new Exception("Calculation error"));

        // Act
        var result = await _controller.RecalculateSegment(clubId, segmentId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region SearchMembers Tests

    [Test]
    public async Task SearchMembers_ValidRequest_ReturnsOkWithResults()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberSegmentSearchRequest
        {
            ClubId = clubId,
            SearchQuery = "john",
            RequestedByUserId = 1
        };
        var searchResult = new MemberSegmentSearchResult
        {
            SearchQuery = "john",
            TotalResults = 2,
            Members = new List<MemberSegmentMatch>
            {
                new() { MemberId = 1, FullName = "John Doe", Email = "john@example.com" },
                new() { MemberId = 2, FullName = "Johnny Smith", Email = "johnny@example.com" }
            }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.SearchMembersAsync(clubId, 1, request))
            .ReturnsAsync(searchResult);

        // Act
        var result = await _controller.SearchMembers(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(searchResult);
    }

    [Test]
    public async Task SearchMembers_InvalidRequest_Returns400()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberSegmentSearchRequest
        {
            ClubId = clubId,
            Page = 0, // Invalid page number
            RequestedByUserId = 1
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.SearchMembersAsync(clubId, 1, request))
            .ThrowsAsync(new ArgumentException("Invalid page number"));

        // Act
        var result = await _controller.SearchMembers(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
    }

    [Test]
    public async Task SearchMembers_NotUnlimitedTier_Returns403()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberSegmentSearchRequest
        {
            ClubId = clubId,
            RequestedByUserId = 1
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(false);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);

        // Act
        var result = await _controller.SearchMembers(clubId, request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task SearchMembers_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberSegmentSearchRequest
        {
            ClubId = clubId,
            RequestedByUserId = 1
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.SearchMembersAsync(clubId, 1, request))
            .ThrowsAsync(new Exception("Search error"));

        // Act
        var result = await _controller.SearchMembers(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSegmentStats Tests

    [Test]
    public async Task GetSegmentStats_ValidRequest_ReturnsOkWithStats()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;
        var stats = new SegmentStatsResponse
        {
            SegmentId = segmentId,
            SegmentName = "Active Members",
            Description = "Highly engaged members",
            MemberStats = new SegmentMemberStats { TotalMembers = 100, ActiveMembers = 85 },
            EngagementStats = new SegmentEngagementStats { AverageEngagementScore = 75.5m }
        };

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentStatsAsync(clubId, segmentId, 1, 30))
            .ReturnsAsync(stats);

        // Act
        var result = await _controller.GetSegmentStats(clubId, segmentId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(stats);
    }

    [Test]
    public async Task GetSegmentStats_SegmentNotFound_ReturnsOkWithNull()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 999;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentStatsAsync(clubId, segmentId, 1, 30))
            .ReturnsAsync((SegmentStatsResponse?)null);

        // Act
        var result = await _controller.GetSegmentStats(clubId, segmentId);

        // Assert - Controller returns Ok with null value
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        okResult.Value.Should().BeNull();
    }

    [Test]
    public async Task GetSegmentStats_NotClubAdmin_Returns403()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetSegmentStats(clubId, segmentId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetSegmentStats_ServiceThrows_Returns500()
    {
        // Arrange
        var clubId = 1;
        var segmentId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(_user, clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(_user))
            .Returns(1);
        _memberSegmentationServiceMock
            .Setup(s => s.GetSegmentStatsAsync(clubId, segmentId, 1, 30))
            .ThrowsAsync(new Exception("Statistics calculation error"));

        // Act
        var result = await _controller.GetSegmentStats(clubId, segmentId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
