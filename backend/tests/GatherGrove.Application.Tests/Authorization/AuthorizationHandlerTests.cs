using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Security.Claims;
using GatherGrove.Application.Authorization;
using GatherGrove.Application.Services;

namespace GatherGrove.Application.Tests.Authorization;

[TestFixture]
public class AuthorizationHandlerTests
{
    private Mock<IClubAuthorizationService> _mockAuthService;
    private Mock<IHttpContextAccessor> _mockHttpContextAccessor;
    private Mock<ILogger<ClubAdminHandler>> _mockAdminLogger;
    private Mock<ILogger<ClubMemberHandler>> _mockMemberLogger;
    private Mock<ILogger<GrowTierHandler>> _mockGrowLogger;
    private Mock<ILogger<SelfAccessHandler>> _mockSelfLogger;

    [SetUp]
    public void Setup()
    {
        _mockAuthService = new Mock<IClubAuthorizationService>();
        _mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        _mockAdminLogger = new Mock<ILogger<ClubAdminHandler>>();
        _mockMemberLogger = new Mock<ILogger<ClubMemberHandler>>();
        _mockGrowLogger = new Mock<ILogger<GrowTierHandler>>();
        _mockSelfLogger = new Mock<ILogger<SelfAccessHandler>>();
    }

    #region ClubAdminHandler Tests

    [Test]
    public async Task ClubAdminHandler_UserWithAdminRole_Succeeds()
    {
        // Arrange
        var handler = new ClubAdminHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockAdminLogger.Object);
        var user = CreateUserWithClaims(clubId: 1, userId: 1, role: "Admin");
        var requirement = new ClubAdminRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.GetClubIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(user, 1)).ReturnsAsync(true);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
    }

    [Test]
    public async Task ClubAdminHandler_UserWithoutAdminRole_Fails()
    {
        // Arrange
        var handler = new ClubAdminHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockAdminLogger.Object);
        var user = CreateUserWithClaims(clubId: 1, userId: 1, role: "Member");
        var requirement = new ClubAdminRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.GetClubIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(user, 1)).ReturnsAsync(false);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.False);
    }

    [Test]
    public async Task ClubAdminHandler_NoRole_Fails()
    {
        // Arrange
        var handler = new ClubAdminHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockAdminLogger.Object);
        var user = CreateUserWithRole(null, userId: 1);
        var requirement = new ClubAdminRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.False);
    }

    #endregion

    #region ClubMemberHandler Tests

    [Test]
    public async Task ClubMemberHandler_UserWithAdminRole_Succeeds()
    {
        // Arrange
        var handler = new ClubMemberHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockMemberLogger.Object);
        var user = CreateUserWithClaims(clubId: 1, userId: 1, role: "Admin");
        var requirement = new ClubMemberRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.GetClubIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.CanAccessClubAsMemberAsync(user, 1)).ReturnsAsync(true);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
    }

    [Test]
    public async Task ClubMemberHandler_UserWithMemberRole_Succeeds()
    {
        // Arrange
        var handler = new ClubMemberHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockMemberLogger.Object);
        var user = CreateUserWithClaims(clubId: 1, userId: 1, role: "Member");
        var requirement = new ClubMemberRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.GetClubIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.CanAccessClubAsMemberAsync(user, 1)).ReturnsAsync(true);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
    }

    [Test]
    public async Task ClubMemberHandler_UserWithOtherRole_Fails()
    {
        // Arrange
        var handler = new ClubMemberHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockMemberLogger.Object);
        var user = CreateUserWithRole("Guest", userId: 1);
        var requirement = new ClubMemberRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.False);
    }

    #endregion

    #region GrowTierHandler Tests

    [Test]
    public async Task GrowTierHandler_ClubWithGrowTier_Succeeds()
    {
        // Arrange
        var handler = new GrowTierHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockGrowLogger.Object);
        var user = CreateUserWithClaims(clubId: 1, userId: 1);
        var requirement = new GrowTierRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetClubIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.CanAccessGrowFeaturesAsync(1)).ReturnsAsync(true);
        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
    }

    [Test]
    public async Task GrowTierHandler_ClubWithoutGrowTier_Fails()
    {
        // Arrange
        var handler = new GrowTierHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockGrowLogger.Object);
        var user = CreateUserWithClaims(clubId: 1, userId: 1);
        var requirement = new GrowTierRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetClubIdFromClaims(user)).Returns(1);
        _mockAuthService.Setup(x => x.CanAccessGrowFeaturesAsync(1)).ReturnsAsync(false);
        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.False);
    }

    [Test]
    public async Task GrowTierHandler_NoClubIdClaim_Fails()
    {
        // Arrange
        var handler = new GrowTierHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockGrowLogger.Object);
        var user = CreateUserWithClaims(clubId: null, userId: 1);
        var requirement = new GrowTierRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetClubIdFromClaims(user)).Returns((int?)null);
        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.False);
    }

    #endregion

    #region SelfAccessHandler Tests

    [Test]
    public async Task SelfAccessHandler_UserWithAdminRole_Succeeds()
    {
        // Arrange
        var handler = new SelfAccessHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockSelfLogger.Object);
        var user = CreateUserWithRole("Admin", userId: 1);
        var requirement = new SelfAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
    }

    [Test]
    public async Task SelfAccessHandler_UserWithMemberRole_Succeeds()
    {
        // Arrange
        var handler = new SelfAccessHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockSelfLogger.Object);
        var user = CreateUserWithRole("Member", userId: 1);
        var requirement = new SelfAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.True);
    }

    [Test]
    public async Task SelfAccessHandler_UserWithoutValidRole_Fails()
    {
        // Arrange
        var handler = new SelfAccessHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockSelfLogger.Object);
        var user = CreateUserWithRole("Guest", userId: 1);
        var requirement = new SelfAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns(1);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.False);
    }

    [Test]
    public async Task SelfAccessHandler_NoUserIdClaim_Fails()
    {
        // Arrange
        var handler = new SelfAccessHandler(_mockAuthService.Object, _mockHttpContextAccessor.Object, _mockSelfLogger.Object);
        var user = CreateUserWithRole("Admin", userId: null);
        var requirement = new SelfAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(user)).Returns((int?)null);

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.That(context.HasSucceeded, Is.False);
    }

    #endregion

    #region Helper Methods

    private ClaimsPrincipal CreateUserWithRole(string? role, int? userId = 1)
    {
        var claims = new List<Claim>();

        if (userId.HasValue)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));

        if (!string.IsNullOrEmpty(role))
            claims.Add(new Claim(ClaimTypes.Role, role));

        var identity = new ClaimsIdentity(claims, "Test");
        return new ClaimsPrincipal(identity);
    }

    private ClaimsPrincipal CreateUserWithClaims(int? clubId = null, int? userId = null, string? role = null, string? email = null)
    {
        var claims = new List<Claim>();

        if (userId.HasValue)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));

        if (clubId.HasValue)
            claims.Add(new Claim("ClubId", clubId.Value.ToString()));

        if (!string.IsNullOrEmpty(role))
            claims.Add(new Claim(ClaimTypes.Role, role));

        if (!string.IsNullOrEmpty(email))
            claims.Add(new Claim(ClaimTypes.Email, email));

        var identity = new ClaimsIdentity(claims, "Test");
        return new ClaimsPrincipal(identity);
    }

    #endregion
}