using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MemberInviteCodeControllerTests
{
    private Mock<IMemberInviteCodeService> _mockService;
    private MemberInviteCodeController _controller;

    [SetUp]
    public void Setup()
    {
        _mockService = new Mock<IMemberInviteCodeService>();
        _controller = new MemberInviteCodeController(_mockService.Object);

        // Set up a mock authenticated user
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "admin@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    #region CreateInviteCode Tests

    [Test]
    public async Task CreateInviteCode_WithValidRequest_ShouldReturnOk()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMemberInviteCodeRequest
        {
            Name = "Test Code",
            Description = "Test Description",
            MembershipTypeId = 1,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            IsActive = true
        };

        var responseData = new MemberInviteCodeResponse
        {
            Id = 1,
            ClubId = clubId,
            Code = "TEST1234",
            Name = "Test Code",
            Description = "Test Description",
            MembershipTypeId = 1,
            MembershipTypeName = "Regular",
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            JoinUrl = "https://gathergrove.club/join/TEST1234",
            QrCodeDataUrl = "data:image/svg+xml;base64,..."
        };

        _mockService.Setup(x => x.CreateInviteCodeAsync(clubId, 1, request))
            .ReturnsAsync((true, "Invite code created successfully.", responseData));

        // Act
        var result = await _controller.CreateInviteCode(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        _mockService.Verify(x => x.CreateInviteCodeAsync(clubId, 1, request), Times.Once);
    }

    [Test]
    public async Task CreateInviteCode_WithServiceFailure_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMemberInviteCodeRequest
        {
            Name = "Test Code",
            MembershipTypeId = 1,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _mockService.Setup(x => x.CreateInviteCodeAsync(clubId, 1, request))
            .ReturnsAsync((false, "You must be an admin of this club.", null));

        // Act
        var result = await _controller.CreateInviteCode(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
    }

    #endregion

    #region GetClubInviteCodes Tests

    [Test]
    public async Task GetClubInviteCodes_WithValidClub_ShouldReturnOk()
    {
        // Arrange
        var clubId = 1;
        var inviteCodes = new List<MemberInviteCodeResponse>
        {
            new MemberInviteCodeResponse
            {
                Id = 1,
                ClubId = clubId,
                Code = "CODE1234",
                Name = "Test Code",
                MembershipTypeId = 1,
                MembershipTypeName = "Regular",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CurrentUses = 5,
                MaxUses = 100,
                IsActive = true
            }
        };

        _mockService.Setup(x => x.GetClubInviteCodesAsync(clubId, 1))
            .ReturnsAsync((true, "Invite codes retrieved successfully.", inviteCodes));

        // Act
        var result = await _controller.GetClubInviteCodes(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        _mockService.Verify(x => x.GetClubInviteCodesAsync(clubId, 1), Times.Once);
    }

    [Test]
    public async Task GetClubInviteCodes_WithUnauthorizedUser_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;

        _mockService.Setup(x => x.GetClubInviteCodesAsync(clubId, 1))
            .ReturnsAsync((false, "You must be an admin of this club.", new List<MemberInviteCodeResponse>()));

        // Act
        var result = await _controller.GetClubInviteCodes(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region GetInviteCode Tests

    [Test]
    public async Task GetInviteCode_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var clubId = 1;
        var inviteCodeId = 1;
        var responseData = new MemberInviteCodeResponse
        {
            Id = inviteCodeId,
            ClubId = clubId,
            Code = "TEST1234",
            Name = "Test Code",
            MembershipTypeId = 1,
            MembershipTypeName = "Regular"
        };

        _mockService.Setup(x => x.GetInviteCodeByIdAsync(inviteCodeId, clubId, 1))
            .ReturnsAsync((true, "Invite code retrieved successfully.", responseData));

        // Act
        var result = await _controller.GetInviteCode(clubId, inviteCodeId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockService.Verify(x => x.GetInviteCodeByIdAsync(inviteCodeId, clubId, 1), Times.Once);
    }

    [Test]
    public async Task GetInviteCode_WithNonExistentId_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var inviteCodeId = 999;

        _mockService.Setup(x => x.GetInviteCodeByIdAsync(inviteCodeId, clubId, 1))
            .ReturnsAsync((false, "Invite code not found.", null));

        // Act
        var result = await _controller.GetInviteCode(clubId, inviteCodeId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region ToggleInviteCodeStatus Tests

    [Test]
    public async Task ToggleInviteCodeStatus_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var clubId = 1;
        var inviteCodeId = 1;

        _mockService.Setup(x => x.ToggleInviteCodeStatusAsync(inviteCodeId, clubId, 1))
            .ReturnsAsync((true, "Invite code deactivated successfully."));

        // Act
        var result = await _controller.ToggleInviteCodeStatus(clubId, inviteCodeId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockService.Verify(x => x.ToggleInviteCodeStatusAsync(inviteCodeId, clubId, 1), Times.Once);
    }

    [Test]
    public async Task ToggleInviteCodeStatus_WithUnauthorizedUser_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var inviteCodeId = 1;

        _mockService.Setup(x => x.ToggleInviteCodeStatusAsync(inviteCodeId, clubId, 1))
            .ReturnsAsync((false, "You must be an admin of this club."));

        // Act
        var result = await _controller.ToggleInviteCodeStatus(clubId, inviteCodeId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region DeleteInviteCode Tests

    [Test]
    public async Task DeleteInviteCode_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var clubId = 1;
        var inviteCodeId = 1;

        _mockService.Setup(x => x.DeleteInviteCodeAsync(inviteCodeId, clubId, 1))
            .ReturnsAsync((true, "Invite code deleted successfully."));

        // Act
        var result = await _controller.DeleteInviteCode(clubId, inviteCodeId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockService.Verify(x => x.DeleteInviteCodeAsync(inviteCodeId, clubId, 1), Times.Once);
    }

    [Test]
    public async Task DeleteInviteCode_WithNonExistentId_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var inviteCodeId = 999;

        _mockService.Setup(x => x.DeleteInviteCodeAsync(inviteCodeId, clubId, 1))
            .ReturnsAsync((false, "Invite code not found."));

        // Act
        var result = await _controller.DeleteInviteCode(clubId, inviteCodeId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion
}

[TestFixture]
public class PublicInviteCodeControllerTests
{
    private Mock<IMemberInviteCodeService> _mockService;
    private PublicInviteCodeController _controller;

    [SetUp]
    public void Setup()
    {
        _mockService = new Mock<IMemberInviteCodeService>();
        _controller = new PublicInviteCodeController(_mockService.Object);
    }

    #region ValidateInviteCode Tests

    [Test]
    public async Task ValidateInviteCode_WithValidCode_ShouldReturnOk()
    {
        // Arrange
        var code = "VALID123";
        var responseData = new MemberInviteCodeResponse
        {
            Id = 1,
            ClubId = 1,
            Code = code,
            Name = "Valid Code",
            MembershipTypeId = 1,
            MembershipTypeName = "Regular",
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CurrentUses = 0,
            MaxUses = 100,
            IsActive = true
        };

        _mockService.Setup(x => x.ValidateInviteCodeAsync(code))
            .ReturnsAsync((true, "Invite code is valid.", responseData));

        // Act
        var result = await _controller.ValidateInviteCode(code);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockService.Verify(x => x.ValidateInviteCodeAsync(code), Times.Once);
    }

    [Test]
    public async Task ValidateInviteCode_WithInvalidCode_ShouldReturnBadRequest()
    {
        // Arrange
        var code = "INVALID1";

        _mockService.Setup(x => x.ValidateInviteCodeAsync(code))
            .ReturnsAsync((false, "Invalid invite code.", null));

        // Act
        var result = await _controller.ValidateInviteCode(code);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task ValidateInviteCode_WithExpiredCode_ShouldReturnBadRequest()
    {
        // Arrange
        var code = "EXPIRED1";

        _mockService.Setup(x => x.ValidateInviteCodeAsync(code))
            .ReturnsAsync((false, "This invite code has expired.", null));

        // Act
        var result = await _controller.ValidateInviteCode(code);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region GetInviteCode Tests

    [Test]
    public async Task GetInviteCode_WithValidCode_ShouldReturnOk()
    {
        // Arrange
        var code = "TEST1234";
        var responseData = new MemberInviteCodeResponse
        {
            Id = 1,
            ClubId = 1,
            Code = code,
            Name = "Test Code",
            MembershipTypeId = 1,
            MembershipTypeName = "Regular"
        };

        _mockService.Setup(x => x.GetInviteCodeByCodeAsync(code))
            .ReturnsAsync((true, "Invite code retrieved successfully.", responseData));

        // Act
        var result = await _controller.GetInviteCode(code);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockService.Verify(x => x.GetInviteCodeByCodeAsync(code), Times.Once);
    }

    [Test]
    public async Task GetInviteCode_WithNonExistentCode_ShouldReturnBadRequest()
    {
        // Arrange
        var code = "NOTFOUND";

        _mockService.Setup(x => x.GetInviteCodeByCodeAsync(code))
            .ReturnsAsync((false, "Invite code not found.", null));

        // Act
        var result = await _controller.GetInviteCode(code);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region RegisterWithInviteCode Tests

    [Test]
    public async Task RegisterWithInviteCode_WithValidRequest_ShouldReturnOk()
    {
        // Arrange
        var request = new RegisterWithInviteCodeRequest
        {
            InviteCode = "VALID123",
            FullName = "New Member",
            Email = "newmember@test.com",
            Password = "Password123!",
            PhoneNumber = "555-0123",
            HasSmsConsent = true
        };

        var memberResponse = new MemberResponse
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            MembershipTypeName = "Regular",
            FullName = "New Member",
            Email = "newmember@test.com",
            PhoneNumber = "555-0123",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            HasSmsConsent = true
        };

        _mockService.Setup(x => x.RegisterMemberWithInviteCodeAsync(request))
            .ReturnsAsync((true, "Member registered successfully!", memberResponse));

        // Act
        var result = await _controller.RegisterWithInviteCode(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockService.Verify(x => x.RegisterMemberWithInviteCodeAsync(request), Times.Once);
    }

    [Test]
    public async Task RegisterWithInviteCode_WithInvalidCode_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterWithInviteCodeRequest
        {
            InviteCode = "INVALID1",
            FullName = "New Member",
            Email = "newmember@test.com",
            Password = "Password123!"
        };

        _mockService.Setup(x => x.RegisterMemberWithInviteCodeAsync(request))
            .ReturnsAsync((false, "Invalid invite code.", null));

        // Act
        var result = await _controller.RegisterWithInviteCode(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task RegisterWithInviteCode_WithExistingMember_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterWithInviteCodeRequest
        {
            InviteCode = "VALID123",
            FullName = "New Member",
            Email = "existing@test.com",
            Password = "Password123!"
        };

        _mockService.Setup(x => x.RegisterMemberWithInviteCodeAsync(request))
            .ReturnsAsync((false, "A member with this email already exists in this club.", null));

        // Act
        var result = await _controller.RegisterWithInviteCode(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion
}