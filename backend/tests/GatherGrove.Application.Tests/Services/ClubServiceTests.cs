using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ClubServiceTests
{
    private GatherGroveDbContext _context = null!;
    private ClubService _clubService = null!;
    private Mock<ILogger<ClubService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<ClubService>>();
        _clubService = new ClubService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club)> CreateTestUserAndClub(string tier = "Basic")
    {
        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = tier
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        return (user, club);
    }

    private async Task<ClubAdmin> CreateClubAdmin(User user, Club club)
    {
        var clubAdmin = new ClubAdmin
        {
            User = user,
            UserId = user.Id,
            Club = club,
            ClubId = club.Id
        };

        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        return clubAdmin;
    }

    #region HasUnlimitedTierAccess Tests

    [Test]
    public async Task HasUnlimitedTierAccess_UserIsAdminWithUnlimitedTier_ReturnsTrue()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("Unlimited");
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_UserIsAdminWithBasicTier_ReturnsFalse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("Basic");
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_UserIsNotAdmin_ReturnsFalse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("Unlimited");
        // Don't create admin relationship

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_UserIsAdminWithSproutTier_ReturnsFalse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("Sprout");
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_CaseInsensitiveTierComparison_ReturnsTrue()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("unlimited"); // lowercase
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_ClubDoesNotExist_ReturnsFalse()
    {
        // Arrange
        var (user, _) = await CreateTestUserAndClub("Unlimited");
        var nonExistentClubId = 99999;

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, nonExistentClubId);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region IsClubAdmin Tests

    [Test]
    public async Task IsClubAdmin_UserIsAdmin_ReturnsTrue()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.IsClubAdmin(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task IsClubAdmin_UserIsNotAdmin_ReturnsFalse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        // Don't create admin relationship

        // Act
        var result = await _clubService.IsClubAdmin(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsClubAdmin_UserIsAdminOfDifferentClub_ReturnsFalse()
    {
        // Arrange
        var (user, club1) = await CreateTestUserAndClub();
        await CreateClubAdmin(user, club1);

        var club2 = new Club { Name = "Another Club", Tier = "Basic" };
        _context.Clubs.Add(club2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _clubService.IsClubAdmin(user.Id, club2.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsClubAdmin_NonExistentUser_ReturnsFalse()
    {
        // Arrange
        var (_, club) = await CreateTestUserAndClub();
        var nonExistentUserId = 99999;

        // Act
        var result = await _clubService.IsClubAdmin(nonExistentUserId, club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsClubAdmin_NonExistentClub_ReturnsFalse()
    {
        // Arrange
        var (user, _) = await CreateTestUserAndClub();
        var nonExistentClubId = 99999;

        // Act
        var result = await _clubService.IsClubAdmin(user.Id, nonExistentClubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsClubAdmin_MultipleAdminsForSameClub_CorrectlyIdentifiesAdmins()
    {
        // Arrange
        var (user1, club) = await CreateTestUserAndClub();
        await CreateClubAdmin(user1, club);

        var user2 = new User
        {
            FullName = "Second Admin",
            Email = "admin2@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(user2);
        await _context.SaveChangesAsync();
        await CreateClubAdmin(user2, club);

        var regularUser = new User
        {
            FullName = "Regular User",
            Email = "regular@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(regularUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        Assert.That(await _clubService.IsClubAdmin(user1.Id, club.Id), Is.True);
        Assert.That(await _clubService.IsClubAdmin(user2.Id, club.Id), Is.True);
        Assert.That(await _clubService.IsClubAdmin(regularUser.Id, club.Id), Is.False);
    }

    #endregion

    #region IsClubMember Tests

    [Test]
    public async Task IsClubMember_UserIsAdmin_ReturnsTrue()
    {
        // Arrange - Admins are considered members
        var (user, club) = await CreateTestUserAndClub();
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.IsClubMember(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task IsClubMember_UserIsNotAdminOrMember_ReturnsFalse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        // No admin relationship

        // Act
        var result = await _clubService.IsClubMember(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsClubMember_NonExistentUser_ReturnsFalse()
    {
        // Arrange
        var (_, club) = await CreateTestUserAndClub();
        var nonExistentUserId = 99999;

        // Act
        var result = await _clubService.IsClubMember(nonExistentUserId, club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region GetClubSubscriptionTier Tests

    [Test]
    public async Task GetClubSubscriptionTier_ClubExists_ReturnsTier()
    {
        // Arrange
        var (_, club) = await CreateTestUserAndClub("Premium");

        // Act
        var result = await _clubService.GetClubSubscriptionTier(club.Id);

        // Assert
        Assert.That(result, Is.EqualTo("Premium"));
    }

    [Test]
    public async Task GetClubSubscriptionTier_ClubDoesNotExist_ReturnsBasic()
    {
        // Arrange
        var nonExistentClubId = 99999;

        // Act
        var result = await _clubService.GetClubSubscriptionTier(nonExistentClubId);

        // Assert
        Assert.That(result, Is.EqualTo("Basic"));
    }

    [Test]
    public async Task GetClubSubscriptionTier_ClubWithEmptyTier_ReturnsEmptyString()
    {
        // Arrange - Club entity requires non-null Tier, test with empty string
        var club = new Club { Name = "Club With Empty Tier", Tier = "" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act
        var result = await _clubService.GetClubSubscriptionTier(club.Id);

        // Assert - returns the actual tier value (empty string) rather than default
        Assert.That(result, Is.EqualTo(""));
    }

    [Test]
    public async Task GetClubSubscriptionTier_DifferentTiers_ReturnsCorrectTier()
    {
        // Arrange
        var tiers = new[] { "Basic", "Sprout", "Growth", "Unlimited" };
        var clubIds = new List<int>();

        foreach (var tier in tiers)
        {
            var club = new Club { Name = $"Club {tier}", Tier = tier };
            _context.Clubs.Add(club);
            await _context.SaveChangesAsync();
            clubIds.Add(club.Id);
        }

        // Act & Assert
        for (int i = 0; i < tiers.Length; i++)
        {
            var result = await _clubService.GetClubSubscriptionTier(clubIds[i]);
            Assert.That(result, Is.EqualTo(tiers[i]), $"Expected tier {tiers[i]} for club {clubIds[i]}");
        }
    }

    #endregion

    #region Edge Cases and Error Handling Tests

    [Test]
    public async Task IsClubAdmin_ZeroIds_ReturnsFalse()
    {
        // Arrange - use zero IDs which should not match anything

        // Act
        var result = await _clubService.IsClubAdmin(0, 0);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsClubMember_NegativeIds_ReturnsFalse()
    {
        // Arrange - use negative IDs which should not match anything

        // Act
        var result = await _clubService.IsClubMember(-1, -1);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task GetClubSubscriptionTier_ZeroClubId_ReturnsBasic()
    {
        // Arrange - club ID 0 should not exist

        // Act
        var result = await _clubService.GetClubSubscriptionTier(0);

        // Assert
        Assert.That(result, Is.EqualTo("Basic"));
    }

    [Test]
    public async Task HasUnlimitedTierAccess_MixedCaseTier_HandlesCorrectly()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("UNLIMITED");
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, club.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_WithWhitespaceTier_HandlesCorrectly()
    {
        // Arrange - tier with extra whitespace
        var (user, club) = await CreateTestUserAndClub(" Unlimited ");
        await CreateClubAdmin(user, club);

        // Act
        var result = await _clubService.HasUnlimitedTierAccess(user.Id, club.Id);

        // Assert - The service uses Equals which doesn't trim, so this should return false
        Assert.That(result, Is.False);
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task IsClubAdmin_ConcurrentCalls_HandlesCorrectly()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        await CreateClubAdmin(user, club);

        // Act - make multiple concurrent calls
        var tasks = Enumerable.Range(0, 10)
            .Select(_ => _clubService.IsClubAdmin(user.Id, club.Id))
            .ToList();

        var results = await Task.WhenAll(tasks);

        // Assert - all calls should return true
        Assert.That(results, Has.All.EqualTo(true));
    }

    [Test]
    public async Task GetClubSubscriptionTier_ConcurrentCalls_HandlesCorrectly()
    {
        // Arrange
        var (_, club) = await CreateTestUserAndClub("Growth");

        // Act - make multiple concurrent calls
        var tasks = Enumerable.Range(0, 10)
            .Select(_ => _clubService.GetClubSubscriptionTier(club.Id))
            .ToList();

        var results = await Task.WhenAll(tasks);

        // Assert - all calls should return "Growth"
        Assert.That(results, Has.All.EqualTo("Growth"));
    }

    #endregion
}
