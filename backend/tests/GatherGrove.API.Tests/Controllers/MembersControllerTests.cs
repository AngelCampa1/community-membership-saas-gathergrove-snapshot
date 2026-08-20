using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MembersControllerTests
{
    private Mock<IMemberService> _mockMemberService;
    private Mock<IClubAuthorizationService> _mockAuthService;
    private Mock<ILogger<MembersController>> _mockLogger;
    private MembersController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockMemberService = new Mock<IMemberService>();
        _mockAuthService = new Mock<IClubAuthorizationService>();
        _mockLogger = new Mock<ILogger<MembersController>>();
        _controller = new MembersController(_mockMemberService.Object, _mockAuthService.Object, _mockLogger.Object);

        // Set up a mock user context with ClubId claim for authorization
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("ClubId", "1")
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

        // Set up default authorization service behavior to allow access
        _mockAuthService
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        _mockAuthService
            .Setup(s => s.CanAccessClubAsMemberAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
            .ReturnsAsync(true);
    }

    #region CreateMember Tests

    [Test]
    public async Task CreateMember_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMemberRequest
        {
            MembershipTypeId = 1,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            PhoneNumber = "(555) 123-4567",
            Address = "123 Main St, Anytown, ST 12345",
            JoinDate = DateTime.Today
        };

        var expectedResponse = new MemberResponse
        {
            Id = 1,
            ClubId = clubId,
            MembershipTypeId = request.MembershipTypeId,
            MembershipTypeName = "Individual",
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            Status = "Active",
            JoinDate = request.JoinDate.Value,
            DuesPaidUntil = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockMemberService
            .Setup(s => s.CreateMemberAsync(clubId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateMember(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = (CreatedAtActionResult)result;
        Assert.That(createdResult.StatusCode, Is.EqualTo(201));
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(MembersController.GetMember)));

        var routeValues = createdResult.RouteValues!;
        Assert.That(routeValues["clubId"], Is.EqualTo(clubId));
        Assert.That(routeValues["memberId"], Is.EqualTo(expectedResponse.Id));

        _mockMemberService.Verify(s => s.CreateMemberAsync(clubId, request), Times.Once);
    }

    [Test]
    public async Task CreateMember_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMemberRequest
        {
            MembershipTypeId = 999,
            FullName = "John Smith",
            Email = "john.smith@example.com"
        };

        _mockMemberService
            .Setup(s => s.CreateMemberAsync(clubId, request))
            .ThrowsAsync(new ArgumentException("Membership type not found in this club"));

        // Act
        var result = await _controller.CreateMember(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task CreateMember_DuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMemberRequest
        {
            MembershipTypeId = 1,
            FullName = "Jane Doe",
            Email = "duplicate@example.com"
        };

        _mockMemberService
            .Setup(s => s.CreateMemberAsync(clubId, request))
            .ThrowsAsync(new ArgumentException("A member with this email already exists in this club"));

        // Act
        var result = await _controller.CreateMember(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("already exists"));
    }

    [Test]
    public async Task CreateMember_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMemberRequest
        {
            MembershipTypeId = 1,
            FullName = "Test Member",
            Email = "test@example.com"
        };

        _mockMemberService
            .Setup(s => s.CreateMemberAsync(clubId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.CreateMember(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region GetPaginatedMembers Tests - Story 14

    [Test]
    public async Task GetPaginatedMembers_ValidRequest_ReturnsOkWithPaginatedData()
    {
        // Arrange
        var clubId = 1;
        var expectedResponse = new PaginatedMembersResponse
        {
            Members = new List<MemberResponse>
            {
                new()
                {
                    Id = 1,
                    ClubId = clubId,
                    FullName = "Alice Johnson",
                    Email = "alice@example.com",
                    PhoneNumber = "555-0001",
                    MembershipTypeName = "Individual",
                    Status = "Active",
                    JoinDate = DateTime.Today,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = 2,
                    ClubId = clubId,
                    FullName = "Bob Smith",
                    Email = "bob@example.com",
                    PhoneNumber = "555-0002",
                    MembershipTypeName = "Individual",
                    Status = "Active",
                    JoinDate = DateTime.Today,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            },
            CurrentPage = 1,
            PageSize = 25,
            TotalCount = 2,
            TotalPages = 1,
            HasPrevious = false,
            HasNext = false,
            Search = null
        };

        _mockMemberService
            .Setup(s => s.GetPaginatedMembersAsync(clubId, null, 1, 25))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetPaginatedMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMemberService.Verify(s => s.GetPaginatedMembersAsync(clubId, null, 1, 25), Times.Once);
    }

    [Test]
    public async Task GetPaginatedMembers_WithSearchParameter_ReturnsFilteredResults()
    {
        // Arrange
        var clubId = 1;
        var search = "alice";
        var expectedResponse = new PaginatedMembersResponse
        {
            Members = new List<MemberResponse>
            {
                new()
                {
                    Id = 1,
                    ClubId = clubId,
                    FullName = "Alice Johnson",
                    Email = "alice@example.com",
                    MembershipTypeName = "Individual",
                    Status = "Active",
                    JoinDate = DateTime.Today,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            },
            CurrentPage = 1,
            PageSize = 25,
            TotalCount = 1,
            TotalPages = 1,
            HasPrevious = false,
            HasNext = false,
            Search = search
        };

        _mockMemberService
            .Setup(s => s.GetPaginatedMembersAsync(clubId, search, 1, 25))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetPaginatedMembers(clubId, search);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = (PaginatedMembersResponse)okResult.Value!;
        Assert.That(response.Search, Is.EqualTo(search));
        Assert.That(response.TotalCount, Is.EqualTo(1));
        Assert.That(response.Members.Count, Is.EqualTo(1));

        _mockMemberService.Verify(s => s.GetPaginatedMembersAsync(clubId, search, 1, 25), Times.Once);
    }

    [Test]
    public async Task GetPaginatedMembers_WithCustomPagination_ReturnsCorrectPage()
    {
        // Arrange
        var clubId = 1;
        var page = 2;
        var pageSize = 10;
        var expectedResponse = new PaginatedMembersResponse
        {
            Members = new List<MemberResponse>(),
            CurrentPage = page,
            PageSize = pageSize,
            TotalCount = 25,
            TotalPages = 3,
            HasPrevious = true,
            HasNext = true,
            Search = null
        };

        _mockMemberService
            .Setup(s => s.GetPaginatedMembersAsync(clubId, null, page, pageSize))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetPaginatedMembers(clubId, null, page, pageSize);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;

        var response = (PaginatedMembersResponse)okResult.Value!;
        Assert.That(response.CurrentPage, Is.EqualTo(page));
        Assert.That(response.PageSize, Is.EqualTo(pageSize));
        Assert.That(response.HasPrevious, Is.True);
        Assert.That(response.HasNext, Is.True);

        _mockMemberService.Verify(s => s.GetPaginatedMembersAsync(clubId, null, page, pageSize), Times.Once);
    }

    [Test]
    public async Task GetPaginatedMembers_NoMembers_ReturnsEmptyResult()
    {
        // Arrange
        var clubId = 1;
        var expectedResponse = new PaginatedMembersResponse
        {
            Members = new List<MemberResponse>(),
            CurrentPage = 1,
            PageSize = 25,
            TotalCount = 0,
            TotalPages = 0,
            HasPrevious = false,
            HasNext = false,
            Search = null
        };

        _mockMemberService
            .Setup(s => s.GetPaginatedMembersAsync(clubId, null, 1, 25))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetPaginatedMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;

        var response = (PaginatedMembersResponse)okResult.Value!;
        Assert.That(response.Members, Is.Empty);
        Assert.That(response.TotalCount, Is.EqualTo(0));
        Assert.That(response.TotalPages, Is.EqualTo(0));
    }

    [Test]
    public async Task GetPaginatedMembers_UserWithoutClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        // Setup controller with user that has no ClubId claim
        var claimsWithoutClubId = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1")
            // No ClubId claim
        };
        var identity = new ClaimsIdentity(claimsWithoutClubId, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };

        // Setup authorization service to deny access for this specific test
        _mockAuthService
            .Setup(s => s.CanAccessClubAsMemberAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetPaginatedMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        // Verify service was not called
        _mockMemberService.Verify(s => s.GetPaginatedMembersAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetPaginatedMembers_UserAccessingDifferentClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)

        // Setup authorization service to deny access for this specific test
        _mockAuthService
            .Setup(s => s.CanAccessClubAsMemberAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetPaginatedMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        // Verify service was not called
        _mockMemberService.Verify(s => s.GetPaginatedMembersAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetPaginatedMembers_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockMemberService
            .Setup(s => s.GetPaginatedMembersAsync(clubId, null, 1, 25))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetPaginatedMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region GetMembers Tests

    [Test]
    public async Task GetMembers_ValidClubId_ReturnsOkWithList()
    {
        // Arrange
        var clubId = 1;
        var expectedResponse = new List<MemberResponse>
        {
            new MemberResponse
            {
                Id = 1,
                ClubId = clubId,
                MembershipTypeId = 1,
                MembershipTypeName = "Individual",
                FullName = "Alice Johnson",
                Email = "alice@example.com",
                PhoneNumber = "(555) 111-2222",
                Address = "123 Oak St",
                Status = "Active",
                JoinDate = DateTime.Today.AddDays(-30),
                DuesPaidUntil = DateTime.Today.AddDays(30),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new MemberResponse
            {
                Id = 2,
                ClubId = clubId,
                MembershipTypeId = 2,
                MembershipTypeName = "Family",
                FullName = "Bob Smith",
                Email = "bob@example.com",
                PhoneNumber = "(555) 333-4444",
                Address = "456 Pine Ave",
                Status = "Active",
                JoinDate = DateTime.Today.AddDays(-15),
                DuesPaidUntil = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockMemberService
            .Setup(s => s.GetMembersByClubAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMemberService.Verify(s => s.GetMembersByClubAsync(clubId), Times.Once);
    }

    [Test]
    public async Task GetMembers_EmptyClub_ReturnsOkWithEmptyList()
    {
        // Arrange
        var clubId = 1;
        var expectedResponse = new List<MemberResponse>();

        _mockMemberService
            .Setup(s => s.GetMembersByClubAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        var list = (List<MemberResponse>)okResult.Value!;
        Assert.That(list, Has.Count.EqualTo(0));
    }

    [Test]
    public async Task GetMembers_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockMemberService
            .Setup(s => s.GetMembersByClubAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMembers(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region GetMember Tests

    [Test]
    public async Task GetMember_ExistingMember_ReturnsOkWithMember()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var expectedResponse = new MemberResponse
        {
            Id = memberId,
            ClubId = clubId,
            MembershipTypeId = 1,
            MembershipTypeName = "Premium",
            FullName = "Premium Member",
            Email = "premium@example.com",
            PhoneNumber = "(555) 987-6543",
            Address = "789 Elite Blvd, Uptown, ST 54321",
            Status = "Active",
            JoinDate = DateTime.Today.AddDays(-60),
            DuesPaidUntil = DateTime.Today.AddDays(365),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockMemberService
            .Setup(s => s.GetMemberByIdAsync(clubId, memberId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMember(clubId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMemberService.Verify(s => s.GetMemberByIdAsync(clubId, memberId), Times.Once);
    }

    [Test]
    public async Task GetMember_NonExistentMember_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var memberId = 999;

        _mockMemberService
            .Setup(s => s.GetMemberByIdAsync(clubId, memberId))
            .ReturnsAsync((MemberResponse?)null);

        // Act
        var result = await _controller.GetMember(clubId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = (NotFoundObjectResult)result;
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));

        var responseValue = notFoundResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task GetMember_MemberFromDifferentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;

        // Service returns null when member doesn't belong to the specified club
        _mockMemberService
            .Setup(s => s.GetMemberByIdAsync(clubId, memberId))
            .ReturnsAsync((MemberResponse?)null);

        // Act
        var result = await _controller.GetMember(clubId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = (NotFoundObjectResult)result;
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));

        var responseValue = notFoundResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task GetMember_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;

        _mockMemberService
            .Setup(s => s.GetMemberByIdAsync(clubId, memberId))
            .ThrowsAsync(new Exception("Database connection lost"));

        // Act
        var result = await _controller.GetMember(clubId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region UpdateMember Tests - Story 15

    [Test]
    public async Task UpdateMember_ValidRequest_ReturnsOkWithUpdatedMember()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "John M. Smith",
            Email = "john.m.smith@example.com",
            PhoneNumber = "(555) 987-6543",
            Address = "456 Oak Ave",
            MembershipTypeId = 2,
            HasSmsConsent = true
        };

        var expectedResponse = new MemberResponse
        {
            Id = memberId,
            ClubId = clubId,
            MembershipTypeId = request.MembershipTypeId,
            MembershipTypeName = "Family",
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            Status = "Active",
            JoinDate = DateTime.Today.AddDays(-30),
            DuesPaidUntil = null,
            HasSmsConsent = request.HasSmsConsent,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, memberId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMemberService.Verify(s => s.UpdateMemberAsync(clubId, memberId, request), Times.Once);
    }

    [Test]
    public async Task UpdateMember_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 999;
        var request = new UpdateMemberRequest
        {
            FullName = "John Smith",
            Email = "john.smith@example.com",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, memberId, request))
            .ThrowsAsync(new ArgumentException($"Member with ID {memberId} not found in club {clubId}"));

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateMember_DuplicateEmailWithOtherMember_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "Jane Doe",
            Email = "duplicate@example.com",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, memberId, request))
            .ThrowsAsync(new ArgumentException("A member with the email 'duplicate@example.com' already exists in this club"));

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("already exists"));
    }

    [Test]
    public async Task UpdateMember_NonExistentMembershipType_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "John Smith",
            Email = "john.smith@example.com",
            MembershipTypeId = 999,
            HasSmsConsent = false
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, memberId, request))
            .ThrowsAsync(new ArgumentException("Membership type with ID 999 not found in this club"));

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateMember_SproutTierWithSmsConsentTrue_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "John Smith",
            Email = "john.smith@example.com",
            MembershipTypeId = 1,
            HasSmsConsent = true
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, memberId, request))
            .ThrowsAsync(new ArgumentException("SMS consent is only available for clubs on the Grow tier"));

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));

        var responseValue = badRequestResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("Grow tier"));
    }

    [Test]
    public async Task UpdateMember_UserWithoutClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "John Smith",
            Email = "john.smith@example.com",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        // Set up controller context without ClubId claim
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1")
            // Missing ClubId claim
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

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        // Verify service was not called
        _mockMemberService.Verify(s => s.UpdateMemberAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateMemberRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateMember_UserAccessingDifferentClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)
        var memberId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "John Smith",
            Email = "john.smith@example.com",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        // User claims are already set up in SetUp() with ClubId = 1

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        // Verify service was not called
        _mockMemberService.Verify(s => s.UpdateMemberAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateMemberRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateMember_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "John Smith",
            Email = "john.smith@example.com",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, memberId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.UpdateMember(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));

        var responseValue = errorResult.Value;
        Assert.That(responseValue, Is.Not.Null);
        Assert.That(responseValue!.ToString(), Does.Contain("unexpected error"));
    }

    #endregion

    #region GetMyProfile Tests

    [Test]
    public async Task GetMyProfile_ValidRequest_ReturnsOkWithMemberProfile()
    {
        // Arrange
        var clubId = 1;
        var userEmail = "test@example.com";

        // Setup claims with email
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, userEmail),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var expectedMember = new MemberResponse
        {
            Id = 1,
            ClubId = clubId,
            FullName = "Test User",
            Email = userEmail,
            Status = "Active"
        };

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync(expectedMember);

        // Act
        var result = await _controller.GetMyProfile(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedMember));
    }

    [Test]
    public async Task GetMyProfile_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;

        // Setup claims without NameIdentifier
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "test@example.com"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.GetMyProfile(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(s => s.GetMemberByEmailAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task GetMyProfile_NoEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;

        // Setup claims without email
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.GetMyProfile(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(s => s.GetMemberByEmailAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task GetMyProfile_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var userEmail = "notfound@example.com";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, userEmail),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync((MemberResponse?)null);

        // Act
        var result = await _controller.GetMyProfile(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetMyProfile_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var userEmail = "test@example.com";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, userEmail),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMyProfile(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateMyProfile Tests

    [Test]
    public async Task UpdateMyProfile_ValidRequest_ReturnsOkWithUpdatedProfile()
    {
        // Arrange
        var clubId = 1;
        var userEmail = "test@example.com";
        var request = new UpdateMemberRequest
        {
            FullName = "Updated Name",
            PhoneNumber = "555-1234",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, userEmail),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var existingMember = new MemberResponse { Id = 1, Email = userEmail };
        var updatedMember = new MemberResponse
        {
            Id = 1,
            ClubId = clubId,
            FullName = request.FullName,
            Email = userEmail,
            PhoneNumber = request.PhoneNumber
        };

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync(existingMember);

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, existingMember.Id, request))
            .ReturnsAsync(updatedMember);

        // Act
        var result = await _controller.UpdateMyProfile(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(updatedMember));
    }

    [Test]
    public async Task UpdateMyProfile_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateMemberRequest
        {
            FullName = "Test",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "test@example.com"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.UpdateMyProfile(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(s => s.UpdateMemberAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateMemberRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateMyProfile_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var userEmail = "notfound@example.com";
        var request = new UpdateMemberRequest
        {
            FullName = "Test",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, userEmail),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync((MemberResponse?)null);

        // Act
        var result = await _controller.UpdateMyProfile(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task UpdateMyProfile_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userEmail = "test@example.com";
        var request = new UpdateMemberRequest
        {
            FullName = "Test",
            MembershipTypeId = 999,
            HasSmsConsent = false
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, userEmail),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var existingMember = new MemberResponse { Id = 1, Email = userEmail };

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync(existingMember);

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, existingMember.Id, request))
            .ThrowsAsync(new ArgumentException("Invalid membership type"));

        // Act
        var result = await _controller.UpdateMyProfile(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task UpdateMyProfile_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var userEmail = "test@example.com";
        var request = new UpdateMemberRequest
        {
            FullName = "Test",
            MembershipTypeId = 1,
            HasSmsConsent = false
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, userEmail),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var existingMember = new MemberResponse { Id = 1, Email = userEmail };

        _mockMemberService
            .Setup(s => s.GetMemberByEmailAsync(clubId, userEmail))
            .ReturnsAsync(existingMember);

        _mockMemberService
            .Setup(s => s.UpdateMemberAsync(clubId, existingMember.Id, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateMyProfile(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region PayMyDues Tests

    [Test]
    public async Task PayMyDues_ValidRequest_ReturnsOkWithPayment()
    {
        // Arrange
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test123",
            MembershipTypeId = 1
        };

        var expectedPayment = new PaymentResponse
        {
            PaymentId = 1,
            Amount = 100.00m,
            PaymentMethod = "card",
            PaymentDate = DateTime.UtcNow,
            IsSuccess = true
        };

        _mockMemberService
            .Setup(s => s.PayMemberDuesAsync(1, request))
            .ReturnsAsync(expectedPayment);

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedPayment));
    }

    [Test]
    public async Task PayMyDues_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test123",
            MembershipTypeId = 1
        };

        var claims = new List<Claim>
        {
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());

        _mockMemberService.Verify(s => s.PayMemberDuesAsync(It.IsAny<int>(), It.IsAny<PayMyDuesRequest>()), Times.Never);
    }

    [Test]
    public async Task PayMyDues_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test123",
            MembershipTypeId = 999
        };

        _mockMemberService
            .Setup(s => s.PayMemberDuesAsync(1, request))
            .ThrowsAsync(new ArgumentException("Invalid membership type"));

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task PayMyDues_InvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test123",
            MembershipTypeId = 1
        };

        _mockMemberService
            .Setup(s => s.PayMemberDuesAsync(1, request))
            .ThrowsAsync(new InvalidOperationException("Payment processing failed"));

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task PayMyDues_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test123",
            MembershipTypeId = 1
        };

        _mockMemberService
            .Setup(s => s.PayMemberDuesAsync(1, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateMemberStatus Tests

    [Test]
    public async Task UpdateMemberStatus_ValidRequest_ReturnsOkWithUpdatedMember()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberStatusRequest
        {
            Status = "Inactive"
        };

        var expectedMember = new MemberResponse
        {
            Id = memberId,
            ClubId = clubId,
            Status = "Inactive"
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberStatusAsync(clubId, memberId, request.Status))
            .ReturnsAsync(expectedMember);

        // Act
        var result = await _controller.UpdateMemberStatus(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedMember));
    }

    [Test]
    public async Task UpdateMemberStatus_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberStatusRequest
        {
            Status = "Inactive"
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.UpdateMemberStatus(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        _mockMemberService.Verify(s => s.UpdateMemberStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task UpdateMemberStatus_DifferentClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)
        var memberId = 1;
        var request = new UpdateMemberStatusRequest
        {
            Status = "Inactive"
        };

        // Act
        var result = await _controller.UpdateMemberStatus(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        _mockMemberService.Verify(s => s.UpdateMemberStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task UpdateMemberStatus_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 999;
        var request = new UpdateMemberStatusRequest
        {
            Status = "Inactive"
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberStatusAsync(clubId, memberId, request.Status))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.UpdateMemberStatus(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task UpdateMemberStatus_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new UpdateMemberStatusRequest
        {
            Status = "Inactive"
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberStatusAsync(clubId, memberId, request.Status))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateMemberStatus(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region RecordPayment Tests

    [Test]
    public async Task RecordPayment_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new RecordPaymentRequest
        {
            Amount = 100.00m,
            PaymentMethod = "cash",
            PaymentDate = DateTime.Today,
            Notes = "Paid in full"
        };

        var expectedPayment = new PaymentResponse
        {
            PaymentId = 1,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            PaymentDate = request.PaymentDate,
            IsSuccess = true
        };

        _mockMemberService
            .Setup(s => s.RecordPaymentAsync(clubId, memberId, request))
            .ReturnsAsync(expectedPayment);

        // Act
        var result = await _controller.RecordPayment(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = (CreatedAtActionResult)result;
        Assert.That(createdResult.StatusCode, Is.EqualTo(201));
        Assert.That(createdResult.Value, Is.EqualTo(expectedPayment));
    }

    [Test]
    public async Task RecordPayment_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new RecordPaymentRequest
        {
            Amount = 100.00m,
            PaymentMethod = "cash",
            PaymentDate = DateTime.Today
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.RecordPayment(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        _mockMemberService.Verify(s => s.RecordPaymentAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<RecordPaymentRequest>()), Times.Never);
    }

    [Test]
    public async Task RecordPayment_DifferentClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)
        var memberId = 1;
        var request = new RecordPaymentRequest
        {
            Amount = 100.00m,
            PaymentMethod = "cash",
            PaymentDate = DateTime.Today
        };

        // Act
        var result = await _controller.RecordPayment(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        _mockMemberService.Verify(s => s.RecordPaymentAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<RecordPaymentRequest>()), Times.Never);
    }

    [Test]
    public async Task RecordPayment_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 999;
        var request = new RecordPaymentRequest
        {
            Amount = 100.00m,
            PaymentMethod = "cash",
            PaymentDate = DateTime.Today
        };

        _mockMemberService
            .Setup(s => s.RecordPaymentAsync(clubId, memberId, request))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.RecordPayment(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task RecordPayment_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var request = new RecordPaymentRequest
        {
            Amount = 100.00m,
            PaymentMethod = "cash",
            PaymentDate = DateTime.Today
        };

        _mockMemberService
            .Setup(s => s.RecordPaymentAsync(clubId, memberId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RecordPayment(clubId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetMemberPayments Tests

    [Test]
    public async Task GetMemberPayments_ValidRequest_ReturnsOkWithPayments()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;

        var expectedPayments = new List<PaymentResponse>
        {
            new PaymentResponse
            {
                PaymentId = 1,
                Amount = 100.00m,
                PaymentMethod = "cash",
                PaymentDate = DateTime.Today
            }
        };

        _mockMemberService
            .Setup(s => s.GetMemberPaymentsAsync(clubId, memberId))
            .ReturnsAsync(expectedPayments);

        // Act
        var result = await _controller.GetMemberPayments(clubId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedPayments));
    }

    [Test]
    public async Task GetMemberPayments_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 999;

        _mockMemberService
            .Setup(s => s.GetMemberPaymentsAsync(clubId, memberId))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.GetMemberPayments(clubId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task GetMemberPayments_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;

        _mockMemberService
            .Setup(s => s.GetMemberPaymentsAsync(clubId, memberId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberPayments(clubId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetPayment Tests

    [Test]
    public async Task GetPayment_ValidRequest_ReturnsOkWithPayment()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;

        var expectedPayment = new PaymentResponse
        {
            PaymentId = paymentId,
            Amount = 100.00m,
            PaymentMethod = "cash",
            PaymentDate = DateTime.Today
        };

        _mockMemberService
            .Setup(s => s.GetPaymentByIdAsync(clubId, memberId, paymentId))
            .ReturnsAsync(expectedPayment);

        // Act
        var result = await _controller.GetPayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedPayment));
    }

    [Test]
    public async Task GetPayment_NotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 999;

        _mockMemberService
            .Setup(s => s.GetPaymentByIdAsync(clubId, memberId, paymentId))
            .ReturnsAsync((PaymentResponse?)null);

        // Act
        var result = await _controller.GetPayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetPayment_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;

        _mockMemberService
            .Setup(s => s.GetPaymentByIdAsync(clubId, memberId, paymentId))
            .ThrowsAsync(new ArgumentException("Invalid payment ID"));

        // Act
        var result = await _controller.GetPayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task GetPayment_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;

        _mockMemberService
            .Setup(s => s.GetPaymentByIdAsync(clubId, memberId, paymentId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetPayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdatePayment Tests

    [Test]
    public async Task UpdatePayment_ValidRequest_ReturnsOkWithUpdatedPayment()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;
        var request = new UpdatePaymentRequest
        {
            Amount = 150.00m,
            PaymentMethod = "check",
            Notes = "Updated amount"
        };

        var expectedPayment = new PaymentResponse
        {
            PaymentId = paymentId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            PaymentDate = DateTime.Today
        };

        _mockMemberService
            .Setup(s => s.UpdatePaymentAsync(clubId, memberId, paymentId, request))
            .ReturnsAsync(expectedPayment);

        // Act
        var result = await _controller.UpdatePayment(clubId, memberId, paymentId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedPayment));
    }

    [Test]
    public async Task UpdatePayment_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 999;
        var request = new UpdatePaymentRequest
        {
            Amount = 150.00m,
            PaymentMethod = "check"
        };

        _mockMemberService
            .Setup(s => s.UpdatePaymentAsync(clubId, memberId, paymentId, request))
            .ThrowsAsync(new ArgumentException("Payment not found"));

        // Act
        var result = await _controller.UpdatePayment(clubId, memberId, paymentId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task UpdatePayment_InvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;
        var request = new UpdatePaymentRequest
        {
            Amount = 150.00m,
            PaymentMethod = "check"
        };

        _mockMemberService
            .Setup(s => s.UpdatePaymentAsync(clubId, memberId, paymentId, request))
            .ThrowsAsync(new InvalidOperationException("Cannot update Stripe payments"));

        // Act
        var result = await _controller.UpdatePayment(clubId, memberId, paymentId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task UpdatePayment_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;
        var request = new UpdatePaymentRequest
        {
            Amount = 150.00m,
            PaymentMethod = "check"
        };

        _mockMemberService
            .Setup(s => s.UpdatePaymentAsync(clubId, memberId, paymentId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdatePayment(clubId, memberId, paymentId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region DeletePayment Tests

    [Test]
    public async Task DeletePayment_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;

        _mockMemberService
            .Setup(s => s.DeletePaymentAsync(clubId, memberId, paymentId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeletePayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task DeletePayment_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 999;

        _mockMemberService
            .Setup(s => s.DeletePaymentAsync(clubId, memberId, paymentId))
            .ThrowsAsync(new ArgumentException("Payment not found"));

        // Act
        var result = await _controller.DeletePayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task DeletePayment_InvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;

        _mockMemberService
            .Setup(s => s.DeletePaymentAsync(clubId, memberId, paymentId))
            .ThrowsAsync(new InvalidOperationException("Cannot delete Stripe payments"));

        // Act
        var result = await _controller.DeletePayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task DeletePayment_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var paymentId = 1;

        _mockMemberService
            .Setup(s => s.DeletePaymentAsync(clubId, memberId, paymentId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.DeletePayment(clubId, memberId, paymentId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetAllMembersWithStatuses Tests

    [Test]
    public async Task GetAllMembersWithStatuses_ValidRequest_ReturnsOk()
    {
        // Arrange
        var clubId = 1;

        var expectedMembers = new List<object>
        {
            new { Id = 1, FullName = "Test Member", Status = "Active" }
        };

        _mockMemberService
            .Setup(s => s.GetAllMembersWithStatusesAsync(clubId))
            .ReturnsAsync(expectedMembers);

        // Act
        var result = await _controller.GetAllMembersWithStatuses(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedMembers));
    }

    [Test]
    public async Task GetAllMembersWithStatuses_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockMemberService
            .Setup(s => s.GetAllMembersWithStatusesAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetAllMembersWithStatuses(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetMemberDirectory Tests

    [Test]
    public async Task GetMemberDirectory_ValidRequest_ReturnsOkWithPaginatedDirectory()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var search = "john";
        var page = 1;
        var pageSize = 25;

        var expectedResponse = new PaginatedDirectoryMembersResponse
        {
            Members = new List<DirectoryMemberResponse>
            {
                new DirectoryMemberResponse { Id = 1, FullName = "John Doe", Email = "john@example.com" },
                new DirectoryMemberResponse { Id = 2, FullName = "John Smith", Email = "jsmith@example.com" }
            },
            CurrentPage = 1,
            TotalPages = 1,
            TotalMembers = 2,
            PageSize = 25,
            HasNextPage = false,
            HasPreviousPage = false
        };

        _mockMemberService
            .Setup(s => s.GetMemberDirectoryAsync(clubId, userId, search, page, pageSize))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMemberDirectory(clubId, search, page, pageSize);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockMemberService.Verify(
            s => s.GetMemberDirectoryAsync(clubId, userId, search, page, pageSize),
            Times.Once);
    }

    [Test]
    public async Task GetMemberDirectory_MissingUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;

        // Setup user without NameIdentifier claim
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "test@example.com"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.GetMemberDirectory(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(
            s => s.GetMemberDirectoryAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetMemberDirectory_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;

        // Setup user with non-integer NameIdentifier claim
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "not-a-number"),
            new(ClaimTypes.Email, "test@example.com"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.GetMemberDirectory(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(
            s => s.GetMemberDirectoryAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetMemberDirectory_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _mockMemberService
            .Setup(s => s.GetMemberDirectoryAsync(clubId, userId, It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .ThrowsAsync(new ArgumentException("Invalid page size"));

        // Act
        var result = await _controller.GetMemberDirectory(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;

        var value = badRequestResult.Value;
        Assert.That(value, Is.Not.Null);
        var messageProperty = value!.GetType().GetProperty("message");
        Assert.That(messageProperty, Is.Not.Null);
        Assert.That(messageProperty!.GetValue(value), Is.EqualTo("Invalid page size"));
    }

    [Test]
    public async Task GetMemberDirectory_DirectoryAccessRestricted_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _mockMemberService
            .Setup(s => s.GetMemberDirectoryAsync(clubId, userId, It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .ThrowsAsync(new InvalidOperationException("User has not opted in to directory or directory is disabled"));

        // Act
        var result = await _controller.GetMemberDirectory(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetMemberDirectory_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _mockMemberService
            .Setup(s => s.GetMemberDirectoryAsync(clubId, userId, It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberDirectory(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateMyGlobalProfile Tests

    [Test]
    public async Task UpdateMyGlobalProfile_ValidRequest_ReturnsOkWithUpdatedProfile()
    {
        // Arrange
        var userId = 1;
        var request = new UpdateMemberProfileRequest
        {
            FullName = "Updated Name",
            PhoneNumber = "555-1234",
            Address = "123 Main St",
            HasSmsConsent = true
        };

        var expectedProfile = new MemberProfileResponse
        {
            Id = userId,
            ClubId = 1,
            ClubName = "Test Club",
            MembershipTypeId = 1,
            MembershipTypeName = "Regular",
            FullName = "Updated Name",
            Email = "test@example.com",
            PhoneNumber = "555-1234",
            Address = "123 Main St",
            Status = "Active",
            HasSmsConsent = true,
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberProfileAsync(userId, request))
            .ReturnsAsync(expectedProfile);

        // Act
        var result = await _controller.UpdateMyGlobalProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(expectedProfile));

        _mockMemberService.Verify(
            s => s.UpdateMemberProfileAsync(userId, request),
            Times.Once);
    }

    [Test]
    public async Task UpdateMyGlobalProfile_MissingUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new UpdateMemberProfileRequest
        {
            FullName = "Test User",
            PhoneNumber = "555-1234"
        };

        // Setup user without NameIdentifier claim
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.UpdateMyGlobalProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());

        _mockMemberService.Verify(
            s => s.UpdateMemberProfileAsync(It.IsAny<int>(), It.IsAny<UpdateMemberProfileRequest>()),
            Times.Never);
    }

    [Test]
    public async Task UpdateMyGlobalProfile_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new UpdateMemberProfileRequest
        {
            FullName = "Test User",
            PhoneNumber = "555-1234"
        };

        // Setup user with non-integer NameIdentifier claim
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid"),
            new(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.UpdateMyGlobalProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());

        _mockMemberService.Verify(
            s => s.UpdateMemberProfileAsync(It.IsAny<int>(), It.IsAny<UpdateMemberProfileRequest>()),
            Times.Never);
    }

    [Test]
    public async Task UpdateMyGlobalProfile_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        var request = new UpdateMemberProfileRequest
        {
            FullName = "", // Invalid empty name
            PhoneNumber = "555-1234"
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberProfileAsync(userId, request))
            .ThrowsAsync(new ArgumentException("Full name is required"));

        // Act
        var result = await _controller.UpdateMyGlobalProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;

        var value = badRequestResult.Value;
        Assert.That(value, Is.Not.Null);
        var messageProperty = value!.GetType().GetProperty("message");
        Assert.That(messageProperty, Is.Not.Null);
        Assert.That(messageProperty!.GetValue(value), Is.EqualTo("Full name is required"));
    }

    [Test]
    public async Task UpdateMyGlobalProfile_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        var request = new UpdateMemberProfileRequest
        {
            FullName = "Test User",
            PhoneNumber = "555-1234"
        };

        _mockMemberService
            .Setup(s => s.UpdateMemberProfileAsync(userId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateMyGlobalProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var errorResult = (ObjectResult)result;
        Assert.That(errorResult.StatusCode, Is.EqualTo(500));
    }

    #endregion
}