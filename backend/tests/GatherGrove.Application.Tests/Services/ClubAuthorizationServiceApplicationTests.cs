using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using FluentAssertions;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using AppClubAuthorizationService = GatherGrove.Application.Services.ClubAuthorizationService;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for GatherGrove.Application.Services.ClubAuthorizationService.
/// These tests cover the Application layer authorization service which includes
/// feature-based access control, tier validation, and member data access protection.
/// </summary>
[TestFixture]
public class ClubAuthorizationServiceApplicationTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<ILogger<AppClubAuthorizationService>> _mockLogger = null!;
    private AppClubAuthorizationService _service = null!;

    [SetUp]
    public async Task Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"AppAuthTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<AppClubAuthorizationService>>();
        _service = new AppClubAuthorizationService(_context, _mockLogger.Object);

        await SeedTestDataAsync();
    }

    private async Task SeedTestDataAsync()
    {
        // Create test clubs with different tiers
        var unlimitedClub = new Club
        {
            Id = 1,
            Name = "Unlimited Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
        var growthClub = new Club
        {
            Id = 2,
            Name = "Growth Club",
            Tier = "Growth",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
        var basicClub = new Club
        {
            Id = 3,
            Name = "Basic Club",
            Tier = "Basic",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
        var expiredClub = new Club
        {
            Id = 4,
            Name = "Expired Club",
            Tier = "Unlimited",
            TrialExpiresAt = DateTime.UtcNow.AddDays(-7), // Expired
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.AddRange(unlimitedClub, growthClub, basicClub, expiredClub);

        // Create membership types
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Standard",
            Description = "Standard membership"
        };
        _context.MembershipTypes.Add(membershipType);

        // Create test users
        var adminUser = new User
        {
            Id = 1,
            Email = "admin@testclub.com",
            FullName = "Admin User",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            IsActive = true
        };
        var memberUser = new User
        {
            Id = 2,
            Email = "member@testclub.com",
            FullName = "Member User",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            IsActive = true
        };
        var otherUser = new User
        {
            Id = 3,
            Email = "other@testclub.com",
            FullName = "Other User",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            IsActive = true
        };

        _context.Users.AddRange(adminUser, memberUser, otherUser);

        // Create club admin relationships
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

    #region HasFeatureAccess Tests - Unlimited Tier Features

    [Test]
    public async Task HasFeatureAccess_UnlimitedTier_EventEngagementAnalytics_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(1, "eventengagementanalytics");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_UnlimitedTier_AdvancedAnalytics_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(1, "advancedanalytics");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_UnlimitedTier_ROIMetrics_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(1, "roimetrics");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_UnlimitedTier_MemberEngagement_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(1, "memberengagement");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_GrowthTier_EventEngagementAnalytics_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(2, "eventengagementanalytics");
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasFeatureAccess_BasicTier_AdvancedAnalytics_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(3, "advancedanalytics");
        result.Should().BeFalse();
    }

    #endregion

    #region HasFeatureAccess Tests - Growth+ Features

    [Test]
    public async Task HasFeatureAccess_GrowthTier_AdvancedEventManagement_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(2, "advancedeventmanagement");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_UnlimitedTier_MemberCommunication_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(1, "membercommunication");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_BasicTier_AdvancedEventManagement_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(3, "advancedeventmanagement");
        result.Should().BeFalse();
    }

    #endregion

    #region HasFeatureAccess Tests - Basic Features

    [Test]
    public async Task HasFeatureAccess_BasicTier_MemberList_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(3, "memberlist");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_BasicTier_EventList_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(3, "eventlist");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_BasicTier_MemberDirectory_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(3, "memberdirectory");
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasFeatureAccess_GrowthTier_BasicReporting_ReturnsTrue()
    {
        var result = await _service.HasFeatureAccess(2, "basicreporting");
        result.Should().BeTrue();
    }

    #endregion

    #region HasFeatureAccess Tests - Edge Cases

    [Test]
    public async Task HasFeatureAccess_NonExistentClub_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(999, "memberlist");
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasFeatureAccess_ExpiredTrial_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(4, "eventengagementanalytics");
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasFeatureAccess_UnknownFeature_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(1, "unknownfeature");
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasFeatureAccess_NullFeatureName_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(1, null!);
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasFeatureAccess_EmptyFeatureName_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(1, "");
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasFeatureAccess_WhitespaceFeatureName_ReturnsFalse()
    {
        var result = await _service.HasFeatureAccess(1, "   ");
        result.Should().BeFalse();
    }

    #endregion

    #region ValidateClubAccessAsync Tests

    [Test]
    public async Task ValidateClubAccessAsync_ClubAdmin_ReturnsTrue()
    {
        var result = await _service.ValidateClubAccessAsync(1, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task ValidateClubAccessAsync_ClubMember_ReturnsTrue()
    {
        var result = await _service.ValidateClubAccessAsync(1, 2);
        result.Should().BeTrue();
    }

    [Test]
    public async Task ValidateClubAccessAsync_NonMember_ReturnsFalse()
    {
        var result = await _service.ValidateClubAccessAsync(1, 3);
        result.Should().BeFalse();
    }

    [Test]
    public async Task ValidateClubAccessAsync_NonExistentClub_ReturnsFalse()
    {
        var result = await _service.ValidateClubAccessAsync(999, 1);
        result.Should().BeFalse();
    }

    [Test]
    public async Task ValidateClubAccessAsync_NonExistentUser_ReturnsFalse()
    {
        var result = await _service.ValidateClubAccessAsync(1, 999);
        result.Should().BeFalse();
    }

    #endregion

    #region IsUserAuthorizedForClubAsync Tests

    [Test]
    public async Task IsUserAuthorizedForClubAsync_AuthorizedUser_ReturnsTrue()
    {
        var result = await _service.IsUserAuthorizedForClubAsync(1, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task IsUserAuthorizedForClubAsync_UnauthorizedUser_ReturnsFalse()
    {
        var result = await _service.IsUserAuthorizedForClubAsync(3, 1);
        result.Should().BeFalse();
    }

    #endregion

    #region CanAccessMemberDataAsync Tests

    [Test]
    public async Task CanAccessMemberDataAsync_SelfAccess_ReturnsTrue()
    {
        // User 1 accessing their own member record (member 1)
        var result = await _service.CanAccessMemberDataAsync(1, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessMemberDataAsync_AdminAccessingSameClubMember_ReturnsTrue()
    {
        // User 1 (admin) accessing member 2 (same club)
        var result = await _service.CanAccessMemberDataAsync(2, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessMemberDataAsync_SameClubMember_ReturnsTrue()
    {
        // User 2 (member) accessing member 1 (same club)
        var result = await _service.CanAccessMemberDataAsync(1, 2);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessMemberDataAsync_NonExistentMember_ReturnsFalse()
    {
        var result = await _service.CanAccessMemberDataAsync(999, 1);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessMemberDataAsync_NonExistentUser_ReturnsFalse()
    {
        var result = await _service.CanAccessMemberDataAsync(1, 999);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessMemberDataAsync_DifferentClubUser_ReturnsFalse()
    {
        // Create member in different club
        var differentClubMember = new Member
        {
            Id = 100,
            ClubId = 2, // Different club
            Email = "differentclub@test.com",
            FullName = "Different Club Member",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        _context.Members.Add(differentClubMember);
        await _context.SaveChangesAsync();

        // User 1 (club 1 admin) trying to access member in club 2
        var result = await _service.CanAccessMemberDataAsync(100, 1);
        result.Should().BeFalse();
    }

    #endregion

    #region CanAccessClubAsAdminAsync Tests

    [Test]
    public async Task CanAccessClubAsAdminAsync_AdminWithCorrectClub_ReturnsTrue()
    {
        var user = CreateUserWithClaims("Admin", userId: 1, clubId: 1);
        var result = await _service.CanAccessClubAsAdminAsync(user, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessClubAsAdminAsync_AdminWithDifferentClub_ReturnsFalse()
    {
        var user = CreateUserWithClaims("Admin", userId: 1, clubId: 1);
        var result = await _service.CanAccessClubAsAdminAsync(user, 2);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessClubAsAdminAsync_MemberRole_ReturnsFalse()
    {
        var user = CreateUserWithClaims("Member", userId: 2, clubId: 1);
        var result = await _service.CanAccessClubAsAdminAsync(user, 1);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessClubAsAdminAsync_NoClubIdClaim_ReturnsFalse()
    {
        var user = CreateUserWithClaims("Admin", userId: 1, clubId: null);
        var result = await _service.CanAccessClubAsAdminAsync(user, 1);
        result.Should().BeFalse();
    }

    #endregion

    #region CanAccessClubAsMemberAsync Tests

    [Test]
    public async Task CanAccessClubAsMemberAsync_AdminWithCorrectClub_ReturnsTrue()
    {
        var user = CreateUserWithClaims("Admin", userId: 1, clubId: 1);
        var result = await _service.CanAccessClubAsMemberAsync(user, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessClubAsMemberAsync_MemberWithCorrectClub_ReturnsTrue()
    {
        var user = CreateUserWithClaims("Member", userId: 2, clubId: 1);
        var result = await _service.CanAccessClubAsMemberAsync(user, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessClubAsMemberAsync_NoRole_ReturnsFalse()
    {
        var user = CreateUserWithClaims(null, userId: 2, clubId: 1);
        var result = await _service.CanAccessClubAsMemberAsync(user, 1);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessClubAsMemberAsync_DifferentClub_ReturnsFalse()
    {
        var user = CreateUserWithClaims("Member", userId: 2, clubId: 1);
        var result = await _service.CanAccessClubAsMemberAsync(user, 2);
        result.Should().BeFalse();
    }

    #endregion

    #region CanAccessGrowFeaturesAsync Tests

    [Test]
    public async Task CanAccessGrowFeaturesAsync_UnlimitedTier_ReturnsTrue()
    {
        var result = await _service.CanAccessGrowFeaturesAsync(1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessGrowFeaturesAsync_GrowTier_ReturnsTrue()
    {
        // Update club to Grow tier
        var club = await _context.Clubs.FindAsync(2);
        club!.Tier = "Grow";
        await _context.SaveChangesAsync();

        var result = await _service.CanAccessGrowFeaturesAsync(2);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessGrowFeaturesAsync_BasicTier_ReturnsFalse()
    {
        var result = await _service.CanAccessGrowFeaturesAsync(3);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessGrowFeaturesAsync_NonExistentClub_ReturnsFalse()
    {
        var result = await _service.CanAccessGrowFeaturesAsync(999);
        result.Should().BeFalse();
    }

    #endregion

    #region CanAccessUnlimitedFeaturesAsync Tests

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_UnlimitedTier_ReturnsTrue()
    {
        var result = await _service.CanAccessUnlimitedFeaturesAsync(1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_GrowthTier_ReturnsFalse()
    {
        var result = await _service.CanAccessUnlimitedFeaturesAsync(2);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_BasicTier_ReturnsFalse()
    {
        var result = await _service.CanAccessUnlimitedFeaturesAsync(3);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_NonExistentClub_ReturnsFalse()
    {
        var result = await _service.CanAccessUnlimitedFeaturesAsync(999);
        result.Should().BeFalse();
    }

    #endregion

    #region CanAccessUserDataAsync Tests

    [Test]
    public async Task CanAccessUserDataAsync_SelfAccess_ReturnsTrue()
    {
        var user = CreateUserWithClaims("Member", userId: 1, clubId: 1);
        var result = await _service.CanAccessUserDataAsync(user, 1);
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessUserDataAsync_NoUserId_ReturnsFalse()
    {
        var user = CreateUserWithClaims("Member", userId: null, clubId: 1);
        var result = await _service.CanAccessUserDataAsync(user, 1);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessUserDataAsync_AdminNoClubId_ReturnsFalse()
    {
        var user = CreateUserWithClaims("Admin", userId: 1, clubId: null);
        var result = await _service.CanAccessUserDataAsync(user, 2);
        result.Should().BeFalse();
    }

    #endregion

    #region GetClaimHelpers Tests

    [Test]
    public void GetClubIdFromClaims_ValidClaim_ReturnsClubId()
    {
        var user = CreateUserWithClaims("Admin", clubId: 42);
        var result = _service.GetClubIdFromClaims(user);
        result.Should().Be(42);
    }

    [Test]
    public void GetClubIdFromClaims_MissingClaim_ReturnsNull()
    {
        var user = CreateUserWithClaims("Admin", clubId: null);
        var result = _service.GetClubIdFromClaims(user);
        result.Should().BeNull();
    }

    [Test]
    public void GetUserIdFromClaims_ValidClaim_ReturnsUserId()
    {
        var user = CreateUserWithClaims("Admin", userId: 123, clubId: 1);
        var result = _service.GetUserIdFromClaims(user);
        result.Should().Be(123);
    }

    [Test]
    public void GetUserIdFromClaims_MissingClaim_ReturnsNull()
    {
        var user = CreateUserWithClaims("Admin", userId: null, clubId: 1);
        var result = _service.GetUserIdFromClaims(user);
        result.Should().BeNull();
    }

    #endregion

    #region Helper Methods

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
