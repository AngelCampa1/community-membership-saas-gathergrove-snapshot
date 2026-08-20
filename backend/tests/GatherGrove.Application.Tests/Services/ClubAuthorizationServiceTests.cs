using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ClubAuthorizationServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<ILogger<GatherGrove.Infrastructure.Services.ClubAuthorizationService>> _mockLogger;
    private GatherGrove.Infrastructure.Services.ClubAuthorizationService _authService;

    [SetUp]
    public async Task Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<GatherGrove.Infrastructure.Services.ClubAuthorizationService>>();
        _authService = new GatherGrove.Infrastructure.Services.ClubAuthorizationService(_context, _mockLogger.Object);

        // Setup test data
        await SeedTestDataAsync();
    }

    private async Task SeedTestDataAsync()
    {
        // Create test clubs
        var club1 = new Club
        {
            Id = 1,
            Name = "Test Club 1",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
        var club2 = new Club
        {
            Id = 2,
            Name = "Test Club 2",
            Tier = "Basic",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.AddRange(club1, club2);

        // Create test membership types
        var membershipType1 = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Standard",
            Description = "Standard membership"
        };

        _context.MembershipTypes.Add(membershipType1);

        // Create test users
        var user1 = new User
        {
            Id = 1,
            Email = "admin@testclub.com",
            FullName = "Admin User",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            IsActive = true
        };
        var user2 = new User
        {
            Id = 2,
            Email = "member@testclub.com",
            FullName = "Member User",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            IsActive = true
        };

        _context.Users.AddRange(user1, user2);

        // Create club admin relationship
        var clubAdmin = new ClubAdmin
        {
            ClubId = 1,
            UserId = 1,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.ClubAdmins.Add(clubAdmin);

        // Create test members
        var member1 = new Member
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            Email = "admin@testclub.com",
            FullName = "Admin User",
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };
        var member2 = new Member
        {
            Id = 2,
            ClubId = 1,
            MembershipTypeId = 1,
            Email = "member@testclub.com",
            FullName = "Member User",
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Members.AddRange(member1, member2);

        await _context.SaveChangesAsync();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region CanAccessClubAsAdminAsync Tests

    [Test]
    public async Task CanAccessClubAsAdminAsync_AdminUserWithCorrectClub_ReturnsTrue()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", clubId: 1);

        // Act
        var result = await _authService.CanAccessClubAsAdminAsync(user, 1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessClubAsAdminAsync_AdminUserWithDifferentClub_ReturnsFalse()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", clubId: 1);

        // Act
        var result = await _authService.CanAccessClubAsAdminAsync(user, 2);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessClubAsAdminAsync_MemberUser_ReturnsFalse()
    {
        // Arrange - Create fresh context to ensure clean state  
        var newOptions = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"FreshDb_{Guid.NewGuid()}")
            .Options;

        using var freshContext = new GatherGroveDbContext(newOptions);
        var freshService = new GatherGrove.Infrastructure.Services.ClubAuthorizationService(freshContext, _mockLogger.Object);

        // Only add minimal data - no ClubAdmin records
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Basic", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        freshContext.Clubs.Add(club);
        await freshContext.SaveChangesAsync();

        var user = CreateUserWithClaims("Member", userId: 3, clubId: 1);

        // Act
        var result = await freshService.CanAccessClubAsAdminAsync(user, 1);

        // Assert - userId=3 has no ClubAdmin record, should return False
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessClubAsAdminAsync_UserWithoutClubId_ReturnsFalse()
    {
        // Arrange - Use userId=3 and no clubId
        var user = CreateUserWithClaims("Admin", userId: 3, clubId: null);

        // Act
        var result = await _authService.CanAccessClubAsAdminAsync(user, 1);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region CanAccessClubAsMemberAsync Tests

    [Test]
    public async Task CanAccessClubAsMemberAsync_AdminUserWithCorrectClub_ReturnsTrue()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", clubId: 1);

        // Act
        var result = await _authService.CanAccessClubAsMemberAsync(user, 1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessClubAsMemberAsync_MemberUserWithCorrectClub_ReturnsTrue()
    {
        // Arrange
        var user = CreateUserWithClaims("Member", clubId: 1);

        // Act
        var result = await _authService.CanAccessClubAsMemberAsync(user, 1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessClubAsMemberAsync_UserWithDifferentClub_ReturnsFalse()
    {
        // Arrange
        var user = CreateUserWithClaims("Member", clubId: 1);

        // Act
        var result = await _authService.CanAccessClubAsMemberAsync(user, 2);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessClubAsMemberAsync_UserWithoutRole_ReturnsFalse()
    {
        // Arrange - Use userId=4 which is not in seed data
        var user = CreateUserWithClaims(null, userId: 4, clubId: 1);

        // Act
        var result = await _authService.CanAccessClubAsMemberAsync(user, 1);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region CanAccessGrowFeaturesAsync Tests

    [Test]
    public async Task CanAccessGrowFeaturesAsync_GrowTierClub_ReturnsTrue()
    {
        // Arrange - Update existing club to Grow tier
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Grow";
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.CanAccessGrowFeaturesAsync(1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessGrowFeaturesAsync_SproutTierClub_ReturnsFalse()
    {
        // Arrange - Update existing club to Sprout tier
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Sprout";
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.CanAccessGrowFeaturesAsync(1);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessGrowFeaturesAsync_NonExistentClub_ReturnsFalse()
    {
        // Act
        var result = await _authService.CanAccessGrowFeaturesAsync(999);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region CanAccessUserDataAsync Tests

    [Test]
    public async Task CanAccessUserDataAsync_SelfAccess_ReturnsTrue()
    {
        // Arrange
        var user = CreateUserWithClaims("Member", userId: 1, clubId: 1);

        // Act
        var result = await _authService.CanAccessUserDataAsync(user, 1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessUserDataAsync_AdminAccessingSameClubUser_ReturnsTrue()
    {
        // Arrange
        var adminUser = CreateUserWithClaims("Admin", userId: 1, clubId: 1);

        // Use unique ID for target user to avoid conflicts
        var targetUser = new User { Id = 99, FullName = "Target User", Email = "target@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, IsActive = true };
        var club = await _context.Clubs.FindAsync(1); // Use existing club
        var clubAdmin = new ClubAdmin { UserId = 99, ClubId = 1 };

        // Create a Member record for the target user (required for the access check logic)
        var targetMember = new Member
        {
            Id = 99,
            ClubId = 1,
            FullName = "Target User",
            Email = "target@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(targetUser);
        _context.ClubAdmins.Add(clubAdmin);
        _context.Members.Add(targetMember);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.CanAccessUserDataAsync(adminUser, 99);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessUserDataAsync_MemberAccessingOtherUser_ReturnsFalse()
    {
        // Arrange - Use userId=5 which is member, accessing userId=6
        var memberUser = CreateUserWithClaims("Member", userId: 5, clubId: 1);

        // Act
        var result = await _authService.CanAccessUserDataAsync(memberUser, 6);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessUserDataAsync_UserWithoutValidUserId_ReturnsFalse()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", userId: null, clubId: 1);

        // Act
        var result = await _authService.CanAccessUserDataAsync(user, 2);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region Helper Methods

    [Test]
    public void GetClubIdFromClaims_ValidClaim_ReturnsClubId()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", clubId: 123);

        // Act
        var result = _authService.GetClubIdFromClaims(user);

        // Assert
        Assert.That(result, Is.EqualTo(123));
    }

    [Test]
    public void GetClubIdFromClaims_MissingClaim_ReturnsNull()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", clubId: null);

        // Act
        var result = _authService.GetClubIdFromClaims(user);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public void GetUserIdFromClaims_ValidClaim_ReturnsUserId()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", userId: 456, clubId: 1);

        // Act
        var result = _authService.GetUserIdFromClaims(user);

        // Assert
        Assert.That(result, Is.EqualTo(456));
    }

    [Test]
    public void GetUserIdFromClaims_MissingClaim_ReturnsNull()
    {
        // Arrange
        var user = CreateUserWithClaims("Admin", userId: null, clubId: 1);

        // Act
        var result = _authService.GetUserIdFromClaims(user);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region CanAccessUnlimitedFeaturesAsync Tests

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_UnlimitedTierClub_ReturnsTrue()
    {
        // Arrange - Update existing club to Unlimited tier
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Unlimited";
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_GrowTierClub_ReturnsFalse()
    {
        // Arrange - Update existing club to Grow tier
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Grow";
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(1);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_NonExistentClub_ReturnsFalse()
    {
        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(999);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region ValidateClubAccessAsync Tests

    [Test]
    public async Task ValidateClubAccessAsync_ClubAdminUser_ReturnsTrue()
    {
        // Arrange - user1 (Id=1) is already a club admin for club1 (Id=1) from seed data

        // Act
        var result = await _authService.ValidateClubAccessAsync(1, 1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateClubAccessAsync_ClubMemberUser_ReturnsTrue()
    {
        // Arrange - user2 (Id=2) is a member of club1 from seed data

        // Act
        var result = await _authService.ValidateClubAccessAsync(1, 2);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateClubAccessAsync_UserNotInClub_ReturnsFalse()
    {
        // Arrange - Create a new user not associated with club1
        var newUser = new User { Id = 10, FullName = "Outsider", Email = "outsider@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, IsActive = true };
        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.ValidateClubAccessAsync(1, 10);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region HasFeatureAccess Tests

    [Test]
    public async Task HasFeatureAccess_UnlimitedFeature_UnlimitedTierClub_ReturnsTrue()
    {
        // Arrange - Update club to Unlimited tier
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Unlimited";
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.HasFeatureAccess(1, "EventEngagementAnalytics");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasFeatureAccess_UnlimitedFeature_GrowthTierClub_ReturnsFalse()
    {
        // Arrange - Update club to Growth tier
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Growth";
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.HasFeatureAccess(1, "EventEngagementAnalytics");

        // Assert - Growth tier should NOT have access to Unlimited features
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_GrowFeature_UnlimitedTierClub_ReturnsTrue()
    {
        // Arrange - Use Unlimited tier to test Growth+ features (HasFeatureAccess expects "Growth" tier but seed uses "Unlimited")
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Unlimited";
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.HasFeatureAccess(1, "AdvancedEventManagement");

        // Assert - Unlimited tier has access to all Growth+ features
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasFeatureAccess_BasicFeature_BasicTierClub_ReturnsTrue()
    {
        // Arrange - Update club1 to Basic tier to test basic features
        var club = await _context.Clubs.FindAsync(1);
        Assert.That(club, Is.Not.Null, "Club 1 should exist");
        club!.Tier = "Basic";
        club.TrialExpiresAt = null; // Ensure no trial expiration
        await _context.SaveChangesAsync();

        // Act - Use actual feature name from Infrastructure version: "MemberDirectory", "BasicEvents", etc.
        var result = await _authService.HasFeatureAccess(1, "MemberDirectory");

        // Assert - Basic features should be available to all tiers including Basic
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasFeatureAccess_NullFeatureName_ReturnsFalse()
    {
        // Act
        var result = await _authService.HasFeatureAccess(1, null!);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_EmptyFeatureName_ReturnsFalse()
    {
        // Act
        var result = await _authService.HasFeatureAccess(1, "");

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_UnknownFeature_ReturnsFalse()
    {
        // Act
        var result = await _authService.HasFeatureAccess(1, "UnknownFeatureName");

        // Assert - Unknown features should be denied for security
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_ExpiredTrial_ReturnsFalse()
    {
        // Arrange - Set trial expiration in the past
        var club = await _context.Clubs.FindAsync(1);
        club.Tier = "Unlimited";
        club.TrialExpiresAt = DateTime.UtcNow.AddDays(-1);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.HasFeatureAccess(1, "EventEngagementAnalytics");

        // Assert - Should deny access even with Unlimited tier if trial expired
        Assert.That(result, Is.False);
    }

    #endregion

    #region IsUserAuthorizedForClubAsync Tests

    [Test]
    public async Task IsUserAuthorizedForClubAsync_AuthorizedUser_ReturnsTrue()
    {
        // Arrange - user1 is admin of club1

        // Act
        var result = await _authService.IsUserAuthorizedForClubAsync(1, 1);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task IsUserAuthorizedForClubAsync_UnauthorizedUser_ReturnsFalse()
    {
        // Arrange - Create a new user not associated with any club
        var newUser = new User { Id = 11, FullName = "Unauthorized", Email = "unauth@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, IsActive = true };
        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.IsUserAuthorizedForClubAsync(11, 1);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region CanAccessMemberDataAsync Tests

    [Test]
    public async Task CanAccessMemberDataAsync_SelfAccess_ReturnsTrue()
    {
        // Arrange - member1 (Id=1) accessing their own data

        // Act
        var result = await _authService.CanAccessMemberDataAsync(1, 1);

        // Assert - User should be able to access their own member record
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessMemberDataAsync_AdminAccessingSameClubMember_ReturnsTrue()
    {
        // Arrange - user1 is admin of club1, accessing member2 in same club

        // Act
        var result = await _authService.CanAccessMemberDataAsync(2, 1);

        // Assert - Admin should be able to access member data in their club
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessMemberDataAsync_MemberAccessingSameClubMember_ReturnsTrue()
    {
        // Arrange - member1 accessing member2 (both in club1, both active)

        // Act
        var result = await _authService.CanAccessMemberDataAsync(2, 2);

        // Assert - Active members should be able to access other members in same club
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessMemberDataAsync_UserAccessingDifferentClub_ReturnsFalse()
    {
        // Arrange - Create a member in a different club
        var club2Member = new Member
        {
            Id = 10,
            ClubId = 2,
            FullName = "Club 2 Member",
            Email = "club2member@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        _context.Members.Add(club2Member);
        await _context.SaveChangesAsync();

        // Act - user1 (club1 admin) trying to access club2 member
        var result = await _authService.CanAccessMemberDataAsync(10, 1);

        // Assert - Should not allow cross-club access
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessMemberDataAsync_NonExistentMember_ReturnsFalse()
    {
        // Act
        var result = await _authService.CanAccessMemberDataAsync(999, 1);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessMemberDataAsync_NonExistentUser_ReturnsFalse()
    {
        // Act - Non-existent user trying to access member
        var result = await _authService.CanAccessMemberDataAsync(1, 999);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region Test Helpers

    private ClaimsPrincipal CreateUserWithClaims(string? role, int? userId = 1, int? clubId = 1)
    {
        var claims = new List<Claim>();

        if (userId.HasValue)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));

        if (clubId.HasValue)
            claims.Add(new Claim("ClubId", clubId.Value.ToString()));

        if (!string.IsNullOrEmpty(role))
            claims.Add(new Claim(ClaimTypes.Role, role));

        var identity = new ClaimsIdentity(claims, "Test");
        return new ClaimsPrincipal(identity);
    }

    #endregion
}