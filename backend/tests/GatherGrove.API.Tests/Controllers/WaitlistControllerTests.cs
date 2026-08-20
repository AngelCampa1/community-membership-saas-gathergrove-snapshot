using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Services.TierValidation;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class WaitlistControllerTests
{
    private WaitlistController _controller;
    private Mock<IWaitlistService> _mockWaitlistService;
    private Mock<IMemberService> _mockMemberService;
    private Mock<ApplicationClubAuth> _mockClubAuthorizationService;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<ILogger<WaitlistController>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        _mockWaitlistService = new Mock<IWaitlistService>();
        _mockMemberService = new Mock<IMemberService>();
        _mockClubAuthorizationService = new Mock<ApplicationClubAuth>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<WaitlistController>>();

        _controller = new WaitlistController(
            _mockWaitlistService.Object,
            _mockMemberService.Object,
            _mockClubAuthorizationService.Object,
            _mockTierGateService.Object,
            _mockLogger.Object);

        // Setup default user claims for authentication
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };
    }

    [TearDown]
    public void TearDown()
    {
        // Controllers don't implement IDisposable in this version
    }

    #region AddToWaitlist Tests

    [Test]
    public async Task AddToWaitlist_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new AddToWaitlistRequest
        {
            MemberId = 123,
            Priority = WaitlistPriority.Normal,
            Notes = "Test member waitlist entry"
        };

        var expectedEntry = new WaitlistEntryResponse
        {
            Id = 1,
            EventId = eventId,
            MemberId = request.MemberId,
            Position = 1,
            Priority = request.Priority,
            AddedAt = DateTime.UtcNow,
            Status = WaitlistStatus.Active
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "WaitlistManagement"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockWaitlistService
            .Setup(x => x.AddToWaitlistAsync(eventId, request))
            .ReturnsAsync(expectedEntry);

        // Act
        var result = await _controller.AddToWaitlist(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedEntry));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(_controller.GetMemberWaitlistStatus)));
    }

    [Test]
    public async Task AddToWaitlist_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new AddToWaitlistRequest { MemberId = 123 };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.AddToWaitlist(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task AddToWaitlist_TierRestriction_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new AddToWaitlistRequest { MemberId = 123 };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "WaitlistManagement"))
            .ReturnsAsync(new TierValidationResult { HasAccess = false, Message = "Upgrade required" });

        // Act
        var result = await _controller.AddToWaitlist(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task AddToWaitlist_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new AddToWaitlistRequest { MemberId = 123 };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "WaitlistManagement"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockWaitlistService
            .Setup(x => x.AddToWaitlistAsync(eventId, request))
            .ThrowsAsync(new ArgumentException("Member already on waitlist"));

        // Act
        var result = await _controller.AddToWaitlist(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region GetEventWaitlist Tests

    [Test]
    public async Task GetEventWaitlist_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedWaitlist = new List<WaitlistEntryResponse>
        {
            new WaitlistEntryResponse { Id = 1, EventId = eventId, MemberId = 123, Position = 1 },
            new WaitlistEntryResponse { Id = 2, EventId = eventId, MemberId = 124, Position = 2 }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.GetWaitlistForEventAsync(eventId))
            .ReturnsAsync(expectedWaitlist);

        // Act
        var result = await _controller.GetEventWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedWaitlist));
    }

    [Test]
    public async Task GetEventWaitlist_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    #endregion

    #region RemoveFromWaitlist Tests

    [Test]
    public async Task RemoveFromWaitlist_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.RemoveFromWaitlistAsync(eventId, memberId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.RemoveFromWaitlist(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task RemoveFromWaitlist_MemberNotOnWaitlist_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.RemoveFromWaitlistAsync(eventId, memberId))
            .ThrowsAsync(new ArgumentException("Member not found on waitlist"));

        // Act
        var result = await _controller.RemoveFromWaitlist(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region GetMemberWaitlistStatus Tests

    [Test]
    public async Task GetMemberWaitlistStatus_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var expectedStatus = new MemberWaitlistStatus
        {
            MemberId = memberId,
            EventId = eventId,
            IsOnWaitlist = true,
            Position = 3,
            EstimatedWaitTime = TimeSpan.FromHours(2),
            Status = WaitlistStatus.Active
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.GetMemberWaitlistStatusAsync(eventId, memberId))
            .ReturnsAsync(expectedStatus);

        // Act
        var result = await _controller.GetMemberWaitlistStatus(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedStatus));
    }

    [Test]
    public async Task GetMemberWaitlistStatus_MemberNotOnWaitlist_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.GetMemberWaitlistStatusAsync(eventId, memberId))
            .ReturnsAsync((MemberWaitlistStatus)null);

        // Act
        var result = await _controller.GetMemberWaitlistStatus(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    #endregion

    #region UpdateWaitlistPosition Tests

    [Test]
    public async Task UpdateWaitlistPosition_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var newPosition = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.UpdateWaitlistPositionAsync(eventId, memberId, newPosition))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.UpdateWaitlistPosition(clubId, eventId, memberId, newPosition);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task UpdateWaitlistPosition_InvalidPosition_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var newPosition = 0; // Invalid position

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UpdateWaitlistPosition(clubId, eventId, memberId, newPosition);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task UpdateWaitlistPosition_ServiceError_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var newPosition = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.UpdateWaitlistPositionAsync(eventId, memberId, newPosition))
            .ThrowsAsync(new ArgumentException("Invalid position for member"));

        // Act
        var result = await _controller.UpdateWaitlistPosition(clubId, eventId, memberId, newPosition);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region ProcessWaitlist Tests

    [Test]
    public async Task ProcessWaitlist_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var availableSpots = 2;
        var expectedResult = new WaitlistProcessingResult
        {
            EventId = eventId,
            AvailableSpots = availableSpots,
            PromotedMembers = new List<WaitlistPromotion>
            {
                new WaitlistPromotion { MemberId = 123, FromPosition = 1, PromotedAt = DateTime.UtcNow },
                new WaitlistPromotion { MemberId = 124, FromPosition = 2, PromotedAt = DateTime.UtcNow }
            },
            Notificationssent = 2
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(x => x.ProcessWaitlistAsync(eventId, availableSpots))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.ProcessWaitlist(clubId, eventId, availableSpots);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResult));
    }

    [Test]
    public async Task ProcessWaitlist_InvalidAvailableSpots_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var availableSpots = 0; // Invalid

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ProcessWaitlist(clubId, eventId, availableSpots);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task ProcessWaitlist_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var availableSpots = 2;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ProcessWaitlist(clubId, eventId, availableSpots);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    #endregion

    #region Authentication Tests

    [Test]
    public async Task AddToWaitlist_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new AddToWaitlistRequest { MemberId = 123 };

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.AddToWaitlist(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    #endregion

    #region JoinWaitlist Tests

    [Test]
    public async Task JoinWaitlist_ValidUser_ReturnsCreated()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";
        var memberId = 5;

        var member = new MemberResponse { Id = memberId, Email = userEmail, ClubId = clubId };
        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync(member);

        _mockClubAuthorizationService
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, "WaitlistManagement"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        var waitlistEntry = new WaitlistEntryResponse
        {
            Id = 1,
            EventId = eventId,
            MemberId = memberId,
            Position = 1,
            AddedAt = DateTime.UtcNow
        };

        _mockWaitlistService
            .Setup(s => s.AddToWaitlistAsync(eventId, It.Is<AddToWaitlistRequest>(r => r.MemberId == memberId)))
            .ReturnsAsync(waitlistEntry);

        // Act
        var result = await _controller.JoinWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task JoinWaitlist_MissingEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with missing email claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
            // No Email claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.JoinWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult!.Value, Is.EqualTo("User email not found in token"));
    }

    [Test]
    public async Task JoinWaitlist_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync((MemberResponse?)null);

        // Act
        var result = await _controller.JoinWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult!.Value!.ToString(), Does.Contain("No member found"));
    }

    [Test]
    public async Task JoinWaitlist_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.JoinWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult!.StatusCode, Is.EqualTo(500));
        Assert.That(statusCodeResult.Value, Is.EqualTo("An error occurred while joining the waitlist"));
    }

    #endregion

    #region LeaveWaitlist Tests

    [Test]
    public async Task LeaveWaitlist_ValidUser_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";
        var memberId = 5;

        var member = new MemberResponse { Id = memberId, Email = userEmail, ClubId = clubId };
        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync(member);

        _mockClubAuthorizationService
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockWaitlistService
            .Setup(s => s.RemoveFromWaitlistAsync(eventId, memberId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.LeaveWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task LeaveWaitlist_MissingEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with missing email claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
            // No Email claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.LeaveWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult!.Value, Is.EqualTo("User email not found in token"));
    }

    [Test]
    public async Task LeaveWaitlist_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync((MemberResponse?)null);

        // Act
        var result = await _controller.LeaveWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult!.Value!.ToString(), Does.Contain("No member found"));
    }

    [Test]
    public async Task LeaveWaitlist_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.LeaveWaitlist(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult!.StatusCode, Is.EqualTo(500));
        Assert.That(statusCodeResult.Value, Is.EqualTo("An error occurred while leaving the waitlist"));
    }

    #endregion

    #region GetWaitlistStatus Tests

    [Test]
    public async Task GetWaitlistStatus_ValidUser_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";
        var memberId = 5;

        var member = new MemberResponse { Id = memberId, Email = userEmail, ClubId = clubId };
        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync(member);

        _mockClubAuthorizationService
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        var waitlistStatus = new MemberWaitlistStatus
        {
            IsOnWaitlist = true,
            Position = 3,
            EventId = eventId,
            MemberId = memberId,
            AddedAt = DateTime.UtcNow
        };

        _mockWaitlistService
            .Setup(s => s.GetMemberWaitlistStatusAsync(eventId, memberId))
            .ReturnsAsync(waitlistStatus);

        // Act
        var result = await _controller.GetWaitlistStatus(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var status = okResult!.Value as MemberWaitlistStatus;
        Assert.That(status!.IsOnWaitlist, Is.True);
        Assert.That(status.Position, Is.EqualTo(3));
    }

    [Test]
    public async Task GetWaitlistStatus_MissingEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with missing email claim
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
            // No Email claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GetWaitlistStatus(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult!.Value, Is.EqualTo("User email not found in token"));
    }

    [Test]
    public async Task GetWaitlistStatus_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync((MemberResponse?)null);

        // Act
        var result = await _controller.GetWaitlistStatus(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult!.Value!.ToString(), Does.Contain("No member found"));
    }

    [Test]
    public async Task GetWaitlistStatus_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userEmail = "test@example.com";

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetWaitlistStatus(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult!.StatusCode, Is.EqualTo(500));
        Assert.That(statusCodeResult.Value, Is.EqualTo("An error occurred while retrieving waitlist status"));
    }

    #endregion
}