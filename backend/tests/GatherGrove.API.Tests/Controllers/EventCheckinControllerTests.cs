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
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class EventCheckinControllerTests
{
    private EventCheckinController _controller;
    private Mock<IEventCheckinService> _mockEventCheckinService;
    private Mock<ApplicationClubAuth> _mockClubAuthorizationService;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<ILogger<EventCheckinController>> _mockLogger;
    private GatherGroveDbContext _context;

    [SetUp]
    public void Setup()
    {
        _mockEventCheckinService = new Mock<IEventCheckinService>();
        _mockClubAuthorizationService = new Mock<ApplicationClubAuth>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<EventCheckinController>>();
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(options);
        _context.Events.Add(new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(1)
        });
        _context.SaveChanges();

        _controller = new EventCheckinController(
            _mockEventCheckinService.Object,
            _mockClubAuthorizationService.Object,
            _mockTierGateService.Object,
            _context,
            _mockLogger.Object);

        // Setup default user claims for authentication
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
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
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private void SetAuthenticatedUser(int userId, string? email = null)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("ClubId", "1")
        };

        if (!string.IsNullOrWhiteSpace(email))
        {
            claims.Add(new Claim(ClaimTypes.Email, email));
        }

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };
    }

    private async Task AddMemberAsync(int memberId, string email, int clubId = 1)
    {
        await _context.Members.AddAsync(new Member
        {
            Id = memberId,
            ClubId = clubId,
            MembershipTypeId = 1,
            FullName = "Test Member",
            Email = email,
            Status = "Active",
            JoinDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    #region GenerateCheckinQRCode Tests

    [Test]
    public async Task GenerateCheckinQRCode_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new GenerateEventQRCodeRequest
        {
            EventId = eventId,
            ExpirationMinutes = 60,
            AllowMultipleScans = false,
            RequireLocation = true
        };

        var expectedQRCode = new EventQRCodeResponse
        {
            Id = 1,
            EventId = eventId,
            QRCodeData = "qr_token_12345",
            QRCodeImageBase64 = "base64_encoded_image_data",
            ExpiresAt = DateTime.UtcNow.AddMinutes(60),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "QRCodeCheckin"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockEventCheckinService
            .Setup(x => x.GenerateEventCheckinQRCodeAsync(It.IsAny<GenerateEventQRCodeRequest>()))
            .ReturnsAsync(expectedQRCode);

        // Act
        var result = await _controller.GenerateCheckinQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedQRCode));

        // Verify that the request was modified to include the correct eventId
        _mockEventCheckinService.Verify(x => x.GenerateEventCheckinQRCodeAsync(
            It.Is<GenerateEventQRCodeRequest>(r => r.ClubId == clubId && r.EventId == eventId)), Times.Once);
    }

    [Test]
    public async Task GenerateCheckinQRCode_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new GenerateEventQRCodeRequest();

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GenerateCheckinQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GenerateCheckinQRCode_TierRestriction_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new GenerateEventQRCodeRequest();

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "QRCodeCheckin"))
            .ReturnsAsync(new TierValidationResult { HasAccess = false, Message = "Upgrade required" });

        // Act
        var result = await _controller.GenerateCheckinQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    #endregion

    #region CheckinWithQRCode Tests

    [Test]
    public async Task CheckinWithQRCode_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new QRCodeCheckinRequest
        {
            MemberId = 123,
            QRCodeToken = "qr_token_12345",
            Location = "Main Entrance",
            CheckinTime = DateTime.UtcNow
        };

        var expectedResponse = new CheckinResponse
        {
            Success = true,
            MemberId = request.MemberId,
            EventId = eventId,
            CheckinTime = request.CheckinTime,
            Location = request.Location,
            Method = CheckinMethod.QRCode
        };

        await AddMemberAsync(request.MemberId, "member@example.com", clubId);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.CheckinWithQRCodeAsync(request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CheckinWithQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockEventCheckinService.Verify(x => x.CheckinWithQRCodeAsync(
            It.Is<QRCodeCheckinRequest>(r => r.ClubId == clubId && r.EventId == eventId)), Times.Once);
    }

    [Test]
    public async Task CheckinWithQRCode_MemberOutsideRouteClub_ReturnsForbidAndDoesNotCallService()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new QRCodeCheckinRequest
        {
            MemberId = 123,
            QRCodeToken = "qr_token_12345"
        };

        await AddMemberAsync(request.MemberId, "other-club-member@example.com", clubId: 2);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckinWithQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventCheckinService.Verify(x => x.CheckinWithQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()), Times.Never);
    }

    [Test]
    public async Task CheckinWithQRCode_MemberCanCheckinSelf_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var request = new QRCodeCheckinRequest
        {
            MemberId = memberId,
            QRCodeToken = "qr_token_12345"
        };

        await AddMemberAsync(memberId, "member@example.com");
        SetAuthenticatedUser(456, "member@example.com");

        var expectedResponse = new CheckinResponse { Success = true, MemberId = memberId };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false); // Not admin

        _mockEventCheckinService
            .Setup(x => x.CheckinWithQRCodeAsync(request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CheckinWithQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());

        _mockEventCheckinService.Verify(x => x.CheckinWithQRCodeAsync(
            It.Is<QRCodeCheckinRequest>(r => r.ClubId == clubId && r.EventId == eventId)), Times.Once);
    }

    [Test]
    public async Task CheckinWithQRCode_UserIdCollisionWithoutMemberEmail_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var request = new QRCodeCheckinRequest
        {
            MemberId = memberId,
            QRCodeToken = "qr_token_12345"
        };

        await AddMemberAsync(memberId, "other-member@example.com");
        SetAuthenticatedUser(memberId, "attacker@example.com");

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CheckinWithQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventCheckinService.Verify(x => x.CheckinWithQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()), Times.Never);
    }

    [Test]
    public async Task CheckinWithQRCode_CheckinFailed_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new QRCodeCheckinRequest { MemberId = 123, QRCodeToken = "invalid_token" };

        var failedResponse = new CheckinResponse
        {
            Success = false,
            ErrorMessage = "Invalid QR code or expired"
        };

        await AddMemberAsync(request.MemberId, "member@example.com", clubId);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.CheckinWithQRCodeAsync(request))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.CheckinWithQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region ManualCheckin Tests

    [Test]
    public async Task ManualCheckin_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var location = "Registration Desk";

        var expectedResponse = new CheckinResponse
        {
            Success = true,
            MemberId = memberId,
            EventId = eventId,
            CheckinTime = DateTime.UtcNow,
            Location = location,
            Method = CheckinMethod.Manual
        };

        await AddMemberAsync(memberId, "member@example.com", clubId);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.ManualCheckinAsync(eventId, memberId, It.IsAny<DateTime>(), location))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ManualCheckin(clubId, eventId, memberId, location);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task ManualCheckin_EventOutsideRouteClub_ReturnsForbidAndDoesNotCallService()
    {
        // Arrange
        var clubId = 1;
        var eventId = 2;
        var memberId = 123;
        await _context.Events.AddAsync(new Event
        {
            Id = eventId,
            ClubId = 2,
            Name = "Other Club Event",
            EventDateTime = DateTime.UtcNow.AddDays(1)
        });
        await _context.SaveChangesAsync();

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ManualCheckin(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventCheckinService.Verify(
            x => x.ManualCheckinAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public async Task ManualCheckin_MemberOutsideRouteClub_ReturnsForbidAndDoesNotCallService()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        await AddMemberAsync(memberId, "other-club-member@example.com", clubId: 2);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ManualCheckin(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventCheckinService.Verify(
            x => x.ManualCheckinAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public async Task ManualCheckin_OnlyAdminsAllowed_UnauthorizedMember_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ManualCheckin(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task ManualCheckin_CheckinFailed_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        var failedResponse = new CheckinResponse
        {
            Success = false,
            ErrorMessage = "Member not found or already checked in"
        };

        await AddMemberAsync(memberId, "member@example.com", clubId);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.ManualCheckinAsync(eventId, memberId, It.IsAny<DateTime>(), It.IsAny<string>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.ManualCheckin(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region CheckoutMember Tests

    [Test]
    public async Task CheckoutMember_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        var expectedResponse = new CheckinResponse
        {
            Success = true,
            MemberId = memberId,
            EventId = eventId,
            CheckoutTime = DateTime.UtcNow,
            Method = CheckinMethod.Manual
        };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.CheckoutMemberAsync(eventId, memberId, It.IsAny<DateTime>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CheckoutMember(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task CheckoutMember_MemberCanCheckoutSelf_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        await AddMemberAsync(memberId, "member@example.com");
        SetAuthenticatedUser(456, "member@example.com");

        var expectedResponse = new CheckinResponse { Success = true, MemberId = memberId };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false); // Not admin

        _mockEventCheckinService
            .Setup(x => x.CheckoutMemberAsync(eventId, memberId, It.IsAny<DateTime>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CheckoutMember(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task CheckoutMember_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.CheckoutMember(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task CheckoutMember_NotAuthorized_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5; // Different from authenticated user (ID 1)

        // User is not a club admin and trying to checkout someone else
        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CheckoutMember(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        _mockEventCheckinService.Verify(x => x.CheckoutMemberAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>()), Times.Never);
    }

    [Test]
    public async Task CheckoutMember_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.CheckoutMemberAsync(eventId, memberId, It.IsAny<DateTime>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.CheckoutMember(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEventCheckins Tests

    [Test]
    public async Task GetEventCheckins_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedCheckins = new List<EventCheckin>
        {
            new EventCheckin { Id = 1, EventId = eventId, MemberId = 123, CheckinTime = DateTime.UtcNow.AddHours(-2) },
            new EventCheckin { Id = 2, EventId = eventId, MemberId = 124, CheckinTime = DateTime.UtcNow.AddHours(-1) }
        };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetEventCheckinsAsync(eventId))
            .ReturnsAsync(expectedCheckins);

        // Act
        var result = await _controller.GetEventCheckins(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedCheckins));
    }

    [Test]
    public async Task GetEventCheckins_EventOutsideRouteClub_ReturnsForbidAndDoesNotCallService()
    {
        // Arrange
        var clubId = 1;
        var eventId = 3;
        await _context.Events.AddAsync(new Event
        {
            Id = eventId,
            ClubId = 2,
            Name = "Other Club Event",
            EventDateTime = DateTime.UtcNow.AddDays(1)
        });
        await _context.SaveChangesAsync();

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.GetEventCheckins(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventCheckinService.Verify(x => x.GetEventCheckinsAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetEventCheckins_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GetEventCheckins(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task GetEventCheckins_ClubAuthorizationFails_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventCheckins(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetEventCheckins_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetEventCheckinsAsync(eventId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetEventCheckins(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetCheckinStatistics Tests

    [Test]
    public async Task GetCheckinStatistics_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedStatistics = new CheckinStatisticsResponse
        {
            EventId = eventId,
            TotalCheckins = 25,
            TotalCheckouts = 20,
            CurrentlyPresent = 5,
            CheckinsByHour = new Dictionary<int, int> { { 9, 10 }, { 10, 15 } },
            AverageStayDuration = TimeSpan.FromHours(2.5),
            PeakHour = 10
        };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetCheckinStatisticsAsync(eventId))
            .ReturnsAsync(expectedStatistics);

        // Act
        var result = await _controller.GetCheckinStatistics(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedStatistics));
    }

    [Test]
    public async Task GetCheckinStatistics_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GetCheckinStatistics(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task GetCheckinStatistics_ClubAuthorizationFails_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetCheckinStatistics(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetCheckinStatistics_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetCheckinStatisticsAsync(eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetCheckinStatistics(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEventAttendees Tests

    [Test]
    public async Task GetEventAttendees_ValidRequest_ReturnsOkWithAttendees()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedAttendees = new List<EventAttendeeDto>
        {
            new EventAttendeeDto
            {
                Id = 1,
                MemberId = 1,
                MemberName = "John Doe",
                Email = "john@example.com",
                CheckedIn = true,
                CheckInTime = DateTime.UtcNow.AddHours(-1)
            },
            new EventAttendeeDto
            {
                Id = 2,
                MemberId = 2,
                MemberName = "Jane Smith",
                Email = "jane@example.com",
                CheckedIn = false
            }
        };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetEventAttendeesAsync(eventId))
            .ReturnsAsync(expectedAttendees);

        // Act
        var result = await _controller.GetEventAttendees(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedAttendees));
    }

    [Test]
    public async Task GetEventAttendees_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GetEventAttendees(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task GetEventAttendees_ClubAuthorizationFails_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventAttendees(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetEventAttendees_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetEventAttendeesAsync(eventId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetEventAttendees(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region CheckInAttendee Tests

    [Test]
    public async Task CheckInAttendee_ClubAdminCheckingInMember_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CheckInAttendeeRequest
        {
            MemberId = 5,
            Location = "Main Hall"
        };

        var expectedResponse = new CheckinResponse
        {
            Success = true,
            MemberId = 5,
            EventId = eventId,
            CheckinTime = DateTime.UtcNow
        };

        await AddMemberAsync(request.MemberId, "member@example.com", clubId);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.ManualCheckinAsync(eventId, request.MemberId, It.IsAny<DateTime>(), request.Location))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CheckInAttendee(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockEventCheckinService.Verify(x => x.ManualCheckinAsync(eventId, request.MemberId, It.IsAny<DateTime>(), request.Location), Times.Once);
    }

    [Test]
    public async Task CheckInAttendee_MemberOutsideRouteClub_ReturnsForbidAndDoesNotCallService()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CheckInAttendeeRequest
        {
            MemberId = 5,
            Location = "Main Hall"
        };

        await AddMemberAsync(request.MemberId, "other-club-member@example.com", clubId: 2);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckInAttendee(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventCheckinService.Verify(
            x => x.ManualCheckinAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public async Task CheckInAttendee_MemberCheckingInSelf_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CheckInAttendeeRequest
        {
            MemberId = 1,
            Location = "Main Hall"
        };

        var expectedResponse = new CheckinResponse
        {
            Success = true,
            MemberId = 1,
            EventId = eventId,
            CheckinTime = DateTime.UtcNow
        };

        await AddMemberAsync(request.MemberId, "member@example.com");
        SetAuthenticatedUser(456, "member@example.com");

        // Club authorization returns false, but the authenticated email owns this member row
        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        _mockEventCheckinService
            .Setup(x => x.ManualCheckinAsync(eventId, request.MemberId, It.IsAny<DateTime>(), request.Location))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CheckInAttendee(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventCheckinService.Verify(
            x => x.ManualCheckinAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public async Task CheckInAttendee_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CheckInAttendeeRequest
        {
            MemberId = 5,
            Location = "Main Hall"
        };

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.CheckInAttendee(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task CheckInAttendee_NotAuthorized_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CheckInAttendeeRequest
        {
            MemberId = 5, // Different from authenticated user (ID 1)
            Location = "Main Hall"
        };

        // User is not a club admin and trying to check in someone else
        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CheckInAttendee(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        _mockEventCheckinService.Verify(x => x.ManualCheckinAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task CheckInAttendee_ServiceReturnsFailure_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CheckInAttendeeRequest
        {
            MemberId = 5,
            Location = "Main Hall"
        };

        var failureResponse = new CheckinResponse
        {
            Success = false,
            ErrorMessage = "Member already checked in"
        };

        await AddMemberAsync(request.MemberId, "member@example.com", clubId);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.ManualCheckinAsync(eventId, request.MemberId, It.IsAny<DateTime>(), request.Location))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.CheckInAttendee(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult.Value, Is.EqualTo("Member already checked in"));
    }

    [Test]
    public async Task CheckInAttendee_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CheckInAttendeeRequest
        {
            MemberId = 5,
            Location = "Main Hall"
        };

        await AddMemberAsync(request.MemberId, "member@example.com", clubId);

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.ManualCheckinAsync(eventId, request.MemberId, It.IsAny<DateTime>(), request.Location))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.CheckInAttendee(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GenerateMemberQRCode Tests

    [Test]
    public async Task GenerateMemberQRCode_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var validForHours = 48;

        var expectedQRCode = new GatherGrove.Application.DTOs.MemberEventQRCode
        {
            Id = 1,
            EventId = eventId,
            MemberId = memberId,
            QRCodeData = "member_qr_token_12345",
            QRCodeImageBase64 = "base64_encoded_member_qr_data",
            ExpiresAt = DateTime.UtcNow.AddHours(validForHours),
            IsActive = true
        };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GenerateMemberQRCodeAsync(It.IsAny<GenerateMemberQRCodeRequest>()))
            .ReturnsAsync(expectedQRCode);

        // Act
        var result = await _controller.GenerateMemberQRCode(clubId, eventId, memberId, validForHours);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedQRCode));

        // Verify the request was properly constructed
        _mockEventCheckinService.Verify(x => x.GenerateMemberQRCodeAsync(
            It.Is<GenerateMemberQRCodeRequest>(r =>
                r.EventId == eventId &&
                r.MemberId == memberId &&
                r.ValidForHours == validForHours)), Times.Once);
    }

    [Test]
    public async Task GenerateMemberQRCode_MemberCanGenerateOwnQRCode_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        await AddMemberAsync(memberId, "member@example.com");
        SetAuthenticatedUser(456, "member@example.com");

        var expectedQRCode = new GatherGrove.Application.DTOs.MemberEventQRCode { Id = 1, MemberId = memberId };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false); // Not admin

        _mockEventCheckinService
            .Setup(x => x.GenerateMemberQRCodeAsync(It.IsAny<GenerateMemberQRCodeRequest>()))
            .ReturnsAsync(expectedQRCode);

        // Act
        var result = await _controller.GenerateMemberQRCode(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
    }

    #endregion

    #region GetMemberCheckinHistory Tests

    [Test]
    public async Task GetMemberCheckinHistory_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;
        var expectedHistory = new List<EventCheckin>
        {
            new EventCheckin { Id = 1, EventId = eventId, MemberId = memberId, CheckinTime = DateTime.UtcNow.AddDays(-1) },
            new EventCheckin { Id = 2, EventId = eventId, MemberId = memberId, CheckinTime = DateTime.UtcNow }
        };

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetMemberCheckinHistoryAsync(memberId, eventId))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetMemberCheckinHistory(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedHistory));
    }

    [Test]
    public async Task GetMemberCheckinHistory_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GetMemberCheckinHistory(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task GetMemberCheckinHistory_ClubAuthorizationFails_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetMemberCheckinHistory(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetMemberCheckinHistory_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.GetMemberCheckinHistoryAsync(memberId, eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberCheckinHistory(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region ValidateCheckinEligibility Tests

    [Test]
    public async Task ValidateCheckinEligibility_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.ValidateCheckinEligibilityAsync(eventId, memberId))
            .ReturnsAsync((true, "Eligible for check-in"));

        // Act
        var result = await _controller.ValidateCheckinEligibility(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var responseValue = okResult.Value;

        // Use reflection to check the anonymous object properties
        var canCheckinProperty = responseValue.GetType().GetProperty("CanCheckin");
        var reasonProperty = responseValue.GetType().GetProperty("Reason");

        Assert.That(canCheckinProperty.GetValue(responseValue), Is.EqualTo(true));
        Assert.That(reasonProperty.GetValue(responseValue), Is.EqualTo("Eligible for check-in"));
    }

    [Test]
    public async Task ValidateCheckinEligibility_NotEligible_ReturnsOkWithFalse()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 123;

        _mockClubAuthorizationService
            .Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);

        _mockEventCheckinService
            .Setup(x => x.ValidateCheckinEligibilityAsync(eventId, memberId))
            .ReturnsAsync((false, "Already checked in"));

        // Act
        var result = await _controller.ValidateCheckinEligibility(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var responseValue = okResult.Value;

        var canCheckinProperty = responseValue.GetType().GetProperty("CanCheckin");
        var reasonProperty = responseValue.GetType().GetProperty("Reason");

        Assert.That(canCheckinProperty.GetValue(responseValue), Is.EqualTo(false));
        Assert.That(reasonProperty.GetValue(responseValue), Is.EqualTo("Already checked in"));
    }

    #endregion

    #region Authentication Tests

    [Test]
    public async Task GenerateCheckinQRCode_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new GenerateEventQRCodeRequest();

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GenerateCheckinQRCode(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    #endregion
}
