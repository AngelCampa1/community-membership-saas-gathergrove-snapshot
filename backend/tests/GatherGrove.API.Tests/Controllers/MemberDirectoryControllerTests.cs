using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MemberDirectoryControllerTests
{
    private Mock<IMemberService> _mockMemberService = null!;
    private Mock<IClubAuthorizationService> _mockAuthService = null!;
    private Mock<ILogger<MembersController>> _mockLogger = null!;
    private MembersController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _mockMemberService = new Mock<IMemberService>();
        _mockAuthService = new Mock<IClubAuthorizationService>();
        _mockLogger = new Mock<ILogger<MembersController>>();
        _controller = new MembersController(_mockMemberService.Object, _mockAuthService.Object, _mockLogger.Object);

        // Setup a default user context for member
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, "test@example.com"),
            new("ClubId", "1"),
            new(ClaimTypes.Role, "Member")
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

    [Test]
    public async Task GetMemberDirectory_ValidRequest_ReturnsOk()
    {
        // Arrange
        var expectedResponse = new PaginatedDirectoryMembersResponse
        {
            Members = new List<DirectoryMemberResponse>
            {
                new DirectoryMemberResponse
                {
                    Id = 1,
                    FullName = "John Doe",
                    Email = "john@test.com",
                    PhoneNumber = "(555) 123-4567"
                },
                new DirectoryMemberResponse
                {
                    Id = 2,
                    FullName = "Jane Smith",
                    Email = "jane@test.com"
                }
            },
            CurrentPage = 1,
            TotalPages = 1,
            TotalMembers = 2,
            PageSize = 25,
            HasNextPage = false,
            HasPreviousPage = false
        };

        _mockMemberService.Setup(x => x.GetMemberDirectoryAsync(1, 1, null, 1, 25))
                         .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMemberDirectory(1);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as PaginatedDirectoryMembersResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.Members.Count, Is.EqualTo(2));
        Assert.That(response.TotalMembers, Is.EqualTo(2));
    }

    [Test]
    public async Task GetMemberDirectory_WithSearchAndPagination_PassesParametersCorrectly()
    {
        // Arrange
        var expectedResponse = new PaginatedDirectoryMembersResponse
        {
            Members = new List<DirectoryMemberResponse>(),
            CurrentPage = 2,
            TotalPages = 3,
            TotalMembers = 5,
            PageSize = 2,
            HasNextPage = true,
            HasPreviousPage = true
        };

        _mockMemberService.Setup(x => x.GetMemberDirectoryAsync(1, 1, "John", 2, 2))
                         .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMemberDirectory(1, "John", 2, 2);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        _mockMemberService.Verify(x => x.GetMemberDirectoryAsync(1, 1, "John", 2, 2), Times.Once);
    }

    [Test]
    public async Task GetMemberDirectory_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid"),
            new(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.GetMemberDirectory(1);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));
    }

    [Test]
    public async Task GetMemberDirectory_DirectoryDisabled_ReturnsForbidden()
    {
        // Arrange
        _mockMemberService.Setup(x => x.GetMemberDirectoryAsync(1, 1, null, 1, 25))
                         .ThrowsAsync(new InvalidOperationException("The member directory is disabled for this club"));

        // Act
        var result = await _controller.GetMemberDirectory(1);

        // Assert
        var forbidResult = result as ForbidResult;
        Assert.That(forbidResult, Is.Not.Null);
    }

    [Test]
    public async Task GetMemberDirectory_MemberNotOptedIn_ReturnsForbidden()
    {
        // Arrange
        _mockMemberService.Setup(x => x.GetMemberDirectoryAsync(1, 1, null, 1, 25))
                         .ThrowsAsync(new InvalidOperationException("You must opt in to the member directory to view other members"));

        // Act
        var result = await _controller.GetMemberDirectory(1);

        // Assert
        var forbidResult = result as ForbidResult;
        Assert.That(forbidResult, Is.Not.Null);
    }

    [Test]
    public async Task GetMemberDirectory_UserNotFound_ReturnsBadRequest()
    {
        // Arrange
        _mockMemberService.Setup(x => x.GetMemberDirectoryAsync(1, 1, null, 1, 25))
                         .ThrowsAsync(new ArgumentException("Requesting user not found"));

        // Act
        var result = await _controller.GetMemberDirectory(1);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task GetMemberDirectory_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockMemberService.Setup(x => x.GetMemberDirectoryAsync(1, 1, null, 1, 25))
                         .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberDirectory(1);

        // Assert
        var serverErrorResult = result as ObjectResult;
        Assert.That(serverErrorResult, Is.Not.Null);
        Assert.That(serverErrorResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task GetMemberDirectory_EmptyResults_ReturnsEmptyList()
    {
        // Arrange
        var expectedResponse = new PaginatedDirectoryMembersResponse
        {
            Members = new List<DirectoryMemberResponse>(),
            CurrentPage = 1,
            TotalPages = 0,
            TotalMembers = 0,
            PageSize = 25,
            HasNextPage = false,
            HasPreviousPage = false
        };

        _mockMemberService.Setup(x => x.GetMemberDirectoryAsync(1, 1, null, 1, 25))
                         .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMemberDirectory(1);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult.Value as PaginatedDirectoryMembersResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.Members.Count, Is.EqualTo(0));
        Assert.That(response.TotalMembers, Is.EqualTo(0));
    }
}