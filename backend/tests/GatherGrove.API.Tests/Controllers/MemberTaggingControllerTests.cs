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
public class MemberTaggingControllerTests
{
    private Mock<IMemberTaggingService> _memberTaggingServiceMock = null!;
    private Mock<IClubAuthorizationService> _authServiceMock = null!;
    private Mock<ILogger<MemberTaggingController>> _loggerMock = null!;
    private MemberTaggingController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _memberTaggingServiceMock = new Mock<IMemberTaggingService>();
        _authServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<MemberTaggingController>>();

        _controller = new MemberTaggingController(
            _memberTaggingServiceMock.Object,
            _authServiceMock.Object,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1);

        // Setup default successful authorization responses
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(It.IsAny<int>()))
            .ReturnsAsync(true);

        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns(1);
    }

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new("sub", userId.ToString()),
            new(ClaimTypes.Role, "ClubAdmin"),
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
            // No sub or userId claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetTags Tests

    [Test]
    public async Task GetTags_ValidClub_ReturnsOkWithTags()
    {
        // Arrange
        var clubId = 1;
        var tags = new List<MemberTagResponse>
        {
            new()
            {
                Id = 1,
                ClubId = clubId,
                Name = "VIP",
                Description = "VIP members",
                Color = "#FF5733",
                IsVisible = true,
                DisplayOrder = 1,
                CreatedAt = DateTime.UtcNow.AddMonths(-3),
                CreatedByUserName = "Admin User",
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = 2,
                ClubId = clubId,
                Name = "Board Member",
                Description = "Board member tag",
                Color = "#33FF57",
                IsVisible = true,
                DisplayOrder = 2,
                CreatedAt = DateTime.UtcNow.AddMonths(-6),
                CreatedByUserName = "Admin User",
                UpdatedAt = DateTime.UtcNow.AddMonths(-6)
            }
        };

        _memberTaggingServiceMock
            .Setup(s => s.GetTagsAsync(clubId, 1))
            .ReturnsAsync(tags);

        // Act
        var result = await _controller.GetTags(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedTags = okResult.Value as IEnumerable<MemberTagResponse>;
        returnedTags.Should().NotBeNull();
        returnedTags!.Should().HaveCount(2);
        returnedTags.First().Name.Should().Be("VIP");
        returnedTags.Last().Name.Should().Be("Board Member");
    }

    [Test]
    public async Task GetTags_FailedAdminAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetTags(clubId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetTags_FailedUnlimitedTierAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetTags(clubId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetTags_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();

        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns((int?)null);

        var clubId = 1;

        // Act
        var result = await _controller.GetTags(clubId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("Invalid authentication token");
    }

    [Test]
    public async Task GetTags_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.GetTagsAsync(clubId, 1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetTags(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetTag Tests

    [Test]
    public async Task GetTag_ValidTag_ReturnsOkWithTag()
    {
        // Arrange
        var clubId = 1;
        var tagId = 1;

        var tag = new MemberTagResponse
        {
            Id = tagId,
            ClubId = clubId,
            Name = "VIP",
            Description = "VIP members",
            Color = "#FF5733",
            IsVisible = true,
            DisplayOrder = 1,
            CreatedAt = DateTime.UtcNow.AddMonths(-3),
            CreatedByUserName = "Admin User",
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        };

        _memberTaggingServiceMock
            .Setup(s => s.GetTagByIdAsync(clubId, tagId, 1))
            .ReturnsAsync(tag);

        // Act
        var result = await _controller.GetTag(clubId, tagId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedTag = okResult.Value as MemberTagResponse;
        returnedTag.Should().NotBeNull();
        returnedTag!.Id.Should().Be(tagId);
        returnedTag.Name.Should().Be("VIP");
    }

    [Test]
    public async Task GetTag_TagNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var tagId = 999;

        _memberTaggingServiceMock
            .Setup(s => s.GetTagByIdAsync(clubId, tagId, 1))
            .ReturnsAsync((MemberTagResponse?)null);

        // Act
        var result = await _controller.GetTag(clubId, tagId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task GetTag_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var tagId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.GetTagByIdAsync(clubId, tagId, 1))
            .ThrowsAsync(new ArgumentException("Tag not found"));

        // Act
        var result = await _controller.GetTag(clubId, tagId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region CreateTag Tests

    [Test]
    public async Task CreateTag_ValidRequest_ReturnsCreatedWithTag()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateTagRequest
        {
            Name = "New Tag",
            Description = "A new tag",
            Color = "#007bff",
            IsVisible = true,
            DisplayOrder = 1
        };

        var createdTag = new MemberTagResponse
        {
            Id = 10,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            Color = request.Color,
            IsVisible = request.IsVisible,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserName = "Test User",
            UpdatedAt = DateTime.UtcNow
        };

        _memberTaggingServiceMock
            .Setup(s => s.CreateTagAsync(clubId, 1, It.IsAny<CreateMemberTagRequest>()))
            .ReturnsAsync(createdTag);

        // Act
        var result = await _controller.CreateTag(clubId, request);

        // Assert
        var createdResult = result as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.StatusCode.Should().Be(201);
        createdResult.ActionName.Should().Be(nameof(MemberTaggingController.GetTag));

        var returnedTag = createdResult.Value as MemberTagResponse;
        returnedTag.Should().NotBeNull();
        returnedTag!.Name.Should().Be("New Tag");
    }

    [Test]
    public async Task CreateTag_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateTagRequest
        {
            Name = "Duplicate Tag",
            Color = "#007bff"
        };

        _memberTaggingServiceMock
            .Setup(s => s.CreateTagAsync(clubId, 1, It.IsAny<CreateMemberTagRequest>()))
            .ThrowsAsync(new ArgumentException("Tag with this name already exists"));

        // Act
        var result = await _controller.CreateTag(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region UpdateTag Tests

    [Test]
    public async Task UpdateTag_ValidRequest_ReturnsOkWithUpdatedTag()
    {
        // Arrange
        var clubId = 1;
        var tagId = 1;
        var request = new UpdateTagRequest
        {
            Name = "Updated Tag",
            Description = "Updated description",
            Color = "#28a745",
            IsVisible = false,
            DisplayOrder = 5
        };

        var updatedTag = new MemberTagResponse
        {
            Id = tagId,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            Color = request.Color,
            IsVisible = request.IsVisible,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = DateTime.UtcNow.AddMonths(-1),
            CreatedByUserName = "Test User",
            UpdatedAt = DateTime.UtcNow
        };

        _memberTaggingServiceMock
            .Setup(s => s.UpdateTagAsync(clubId, tagId, 1, It.IsAny<UpdateMemberTagRequest>()))
            .ReturnsAsync(updatedTag);

        // Act
        var result = await _controller.UpdateTag(clubId, tagId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedTag = okResult.Value as MemberTagResponse;
        returnedTag.Should().NotBeNull();
        returnedTag!.Name.Should().Be("Updated Tag");
        returnedTag.IsVisible.Should().BeFalse();
    }

    [Test]
    public async Task UpdateTag_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var tagId = 1;
        var request = new UpdateTagRequest
        {
            Name = "Invalid Tag",
            Color = "#007bff"
        };

        _memberTaggingServiceMock
            .Setup(s => s.UpdateTagAsync(clubId, tagId, 1, It.IsAny<UpdateMemberTagRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid tag update"));

        // Act
        var result = await _controller.UpdateTag(clubId, tagId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region DeleteTag Tests

    [Test]
    public async Task DeleteTag_ValidTag_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var tagId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.DeleteTagAsync(clubId, tagId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteTag(clubId, tagId);

        // Assert
        var noContentResult = result as NoContentResult;
        noContentResult.Should().NotBeNull();
        noContentResult!.StatusCode.Should().Be(204);
    }

    [Test]
    public async Task DeleteTag_TagNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var tagId = 999;

        _memberTaggingServiceMock
            .Setup(s => s.DeleteTagAsync(clubId, tagId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteTag(clubId, tagId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task DeleteTag_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var tagId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.DeleteTagAsync(clubId, tagId, 1))
            .ThrowsAsync(new ArgumentException("Cannot delete tag"));

        // Act
        var result = await _controller.DeleteTag(clubId, tagId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region AssignTag Tests

    [Test]
    public async Task AssignTag_ValidAssignment_ReturnsOkWithMessage()
    {
        // Arrange
        var clubId = 1;
        var memberId = 5;
        var tagId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.AssignTagToMemberAsync(clubId, memberId, tagId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.AssignTag(clubId, memberId, tagId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task AssignTag_AssignmentFailed_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 5;
        var tagId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.AssignTagToMemberAsync(clubId, memberId, tagId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.AssignTag(clubId, memberId, tagId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task AssignTag_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 5;
        var tagId = 999;

        _memberTaggingServiceMock
            .Setup(s => s.AssignTagToMemberAsync(clubId, memberId, tagId, 1))
            .ThrowsAsync(new ArgumentException("Tag not found"));

        // Act
        var result = await _controller.AssignTag(clubId, memberId, tagId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region RemoveTag Tests

    [Test]
    public async Task RemoveTag_ValidRemoval_ReturnsOkWithMessage()
    {
        // Arrange
        var clubId = 1;
        var memberId = 5;
        var tagId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.RemoveTagFromMemberAsync(clubId, memberId, tagId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.RemoveTag(clubId, memberId, tagId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task RemoveTag_AssignmentNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var memberId = 5;
        var tagId = 999;

        _memberTaggingServiceMock
            .Setup(s => s.RemoveTagFromMemberAsync(clubId, memberId, tagId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RemoveTag(clubId, memberId, tagId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task RemoveTag_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 5;
        var tagId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.RemoveTagFromMemberAsync(clubId, memberId, tagId, 1))
            .ThrowsAsync(new ArgumentException("Invalid operation"));

        // Act
        var result = await _controller.RemoveTag(clubId, memberId, tagId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region GetMemberTags Tests

    [Test]
    public async Task GetMemberTags_ValidMember_ReturnsOkWithTags()
    {
        // Arrange
        var clubId = 1;
        var memberId = 5;

        var memberTags = new List<MemberTagResponse>
        {
            new()
            {
                Id = 1,
                ClubId = clubId,
                Name = "VIP",
                Color = "#FF5733",
                IsVisible = true,
                DisplayOrder = 1,
                CreatedAt = DateTime.UtcNow.AddMonths(-2),
                CreatedByUserName = "Admin",
                UpdatedAt = DateTime.UtcNow.AddMonths(-2)
            }
        };

        _memberTaggingServiceMock
            .Setup(s => s.GetMemberTagsAsync(clubId, memberId, 1))
            .ReturnsAsync(memberTags);

        // Act
        var result = await _controller.GetMemberTags(clubId, memberId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedTags = okResult.Value as IEnumerable<MemberTagResponse>;
        returnedTags.Should().NotBeNull();
        returnedTags!.Should().HaveCount(1);
        returnedTags.First().Name.Should().Be("VIP");
    }

    [Test]
    public async Task GetMemberTags_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 999;

        _memberTaggingServiceMock
            .Setup(s => s.GetMemberTagsAsync(clubId, memberId, 1))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.GetMemberTags(clubId, memberId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region GetMembersWithTag Tests

    [Test]
    public async Task GetMembersWithTag_ValidTag_ReturnsOkWithMembers()
    {
        // Arrange
        var clubId = 1;
        var tagId = 1;

        var members = new List<MemberResponse>
        {
            new()
            {
                Id = 5,
                FullName = "John Doe",
                Email = "john@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddYears(-1)
            },
            new()
            {
                Id = 6,
                FullName = "Jane Smith",
                Email = "jane@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddYears(-2)
            }
        };

        _memberTaggingServiceMock
            .Setup(s => s.GetMembersWithTagAsync(clubId, tagId, 1))
            .ReturnsAsync(members);

        // Act
        var result = await _controller.GetMembersWithTag(clubId, tagId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedMembers = okResult.Value as IEnumerable<MemberResponse>;
        returnedMembers.Should().NotBeNull();
        returnedMembers!.Should().HaveCount(2);
    }

    [Test]
    public async Task GetMembersWithTag_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var tagId = 999;

        _memberTaggingServiceMock
            .Setup(s => s.GetMembersWithTagAsync(clubId, tagId, 1))
            .ThrowsAsync(new ArgumentException("Tag not found"));

        // Act
        var result = await _controller.GetMembersWithTag(clubId, tagId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region GetTagUsageStats Tests

    [Test]
    public async Task GetTagUsageStats_ValidClub_ReturnsOkWithStats()
    {
        // Arrange
        var clubId = 1;

        var usageStats = new MemberTagUsageStatsResponse
        {
            TagId = 1,
            TagName = "VIP",
            CurrentStats = new TagUsageStats
            {
                AssignedMemberCount = 15,
                TotalMemberCount = 100,
                UsagePercentage = 0.15m,
                RecentAssignments = 3
            },
            CalculatedAt = DateTime.UtcNow
        };

        _memberTaggingServiceMock
            .Setup(s => s.GetTagUsageStatsAsync(clubId, 1))
            .ReturnsAsync(usageStats);

        // Act
        var result = await _controller.GetTagUsageStats(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedStats = okResult.Value as MemberTagUsageStatsResponse;
        returnedStats.Should().NotBeNull();
        returnedStats!.TagName.Should().Be("VIP");
        returnedStats.CurrentStats.AssignedMemberCount.Should().Be(15);
    }

    [Test]
    public async Task GetTagUsageStats_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;

        _memberTaggingServiceMock
            .Setup(s => s.GetTagUsageStatsAsync(clubId, 1))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetTagUsageStats(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
