using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Comprehensive tests for ClubRepository
/// Tests club data access with authorization checks and tier management
/// </summary>
public class ClubRepositoryTests : RepositoryTestBase
{
    private ClubRepository _repository = null!;

    [SetUp]
    public void Setup()
    {
        // Create a fresh database context for each test to ensure isolation
        CreateContext();
        _repository = new ClubRepository(Context);
    }

    [TearDown]
    public void TearDown()
    {
        // Dispose the context after each test
        Context?.Dispose();
    }

    #region GetClubWithAdminCheckAsync Tests (14 tests)

    [Test]
    public async Task GetClubWithAdminCheckAsync_ValidClubAndAdmin_ReturnsClub()
    {
        // Arrange
        var club = await SeedClubAsync();
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetClubWithAdminCheckAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(club.Id));
        Assert.That(result.ClubAdmins, Is.Not.Empty);
        Assert.That(result.ClubAdmins.Any(ca => ca.UserId == user.Id), Is.True);
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_UserNotAdmin_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var club = await SeedClubAsync();
        var adminUser = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        var nonAdminUser = new User { Id = 2, Email = "user@test.com", FullName = "Regular User", CreatedAt = DateTime.UtcNow };
        Context.Users.AddRange(adminUser, nonAdminUser);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _repository.GetClubWithAdminCheckAsync(club.Id, nonAdminUser.Id));

        Assert.That(ex!.Message, Does.Contain("not an admin"));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_ClubNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);
        await Context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _repository.GetClubWithAdminCheckAsync(999, user.Id));

        Assert.That(ex!.Message, Does.Contain("Club 999 not found"));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_MultipleAdmins_ReturnsClubWhenUserIsOneOfThem()
    {
        // Arrange
        var club = await SeedClubAsync();
        var admin1 = new User { Id = 1, Email = "admin1@test.com", FullName = "Admin 1", CreatedAt = DateTime.UtcNow };
        var admin2 = new User { Id = 2, Email = "admin2@test.com", FullName = "Admin 2", CreatedAt = DateTime.UtcNow };
        var admin3 = new User { Id = 3, Email = "admin3@test.com", FullName = "Admin 3", CreatedAt = DateTime.UtcNow };
        Context.Users.AddRange(admin1, admin2, admin3);

        Context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, ClubId = club.Id, UserId = admin1.Id, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, ClubId = club.Id, UserId = admin2.Id, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 3, ClubId = club.Id, UserId = admin3.Id, CreatedAt = DateTime.UtcNow }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetClubWithAdminCheckAsync(club.Id, admin2.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubAdmins.Count, Is.EqualTo(3));
        Assert.That(result.ClubAdmins.Any(ca => ca.UserId == admin2.Id), Is.True);
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_ClubWithNoAdmins_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var club = await SeedClubAsync();
        var user = new User { Id = 1, Email = "user@test.com", FullName = "User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);
        await Context.SaveChangesAsync();

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _repository.GetClubWithAdminCheckAsync(club.Id, user.Id));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_IncludesClubAdminsNavigationProperty()
    {
        // Arrange
        var club = await SeedClubAsync();
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetClubWithAdminCheckAsync(club.Id, user.Id);

        // Assert
        Assert.That(result.ClubAdmins, Is.Not.Null);
        Assert.That(result.ClubAdmins, Is.Not.Empty);
        Assert.That(result.ClubAdmins.First().UserId, Is.EqualTo(user.Id));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_WithExpiredClub_StillReturnsIfUserIsAdmin()
    {
        // Arrange
        var club = await SeedClubAsync(tier: "Sprout", id: 1);
        club.MembershipExpiresAt = DateTime.UtcNow.AddDays(-30); // Expired
        await Context.SaveChangesAsync();

        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetClubWithAdminCheckAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MembershipExpiresAt, Is.LessThan(DateTime.UtcNow));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_WithTrialClub_ReturnsClub()
    {
        // Arrange
        var club = await SeedClubAsync();
        club.TrialExpiresAt = DateTime.UtcNow.AddDays(14);
        await Context.SaveChangesAsync();

        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetClubWithAdminCheckAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TrialExpiresAt, Is.Not.Null);
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_DifferentTiers_ReturnsClub()
    {
        // Arrange
        var club = await SeedClubAsync(tier: "Grow");
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetClubWithAdminCheckAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Tier, Is.EqualTo("Grow"));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_UserIdZero_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var club = await SeedClubAsync();
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _repository.GetClubWithAdminCheckAsync(club.Id, 0));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_NegativeUserId_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var club = await SeedClubAsync();
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        var clubAdmin = new ClubAdmin { Id = 1, ClubId = club.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        Context.ClubAdmins.Add(clubAdmin);
        await Context.SaveChangesAsync();

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _repository.GetClubWithAdminCheckAsync(club.Id, -1));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_ClubIdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);
        await Context.SaveChangesAsync();

        // Act & Assert
        Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _repository.GetClubWithAdminCheckAsync(0, user.Id));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_NegativeClubId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);
        await Context.SaveChangesAsync();

        // Act & Assert
        Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _repository.GetClubWithAdminCheckAsync(-1, user.Id));
    }

    [Test]
    public async Task GetClubWithAdminCheckAsync_MultipleClubsSameUser_ReturnsCorrectClub()
    {
        // Arrange
        var club1 = await SeedClubAsync(id: 1);
        var club2 = await SeedClubAsync(id: 2);

        var user = new User { Id = 1, Email = "admin@test.com", FullName = "Admin User", CreatedAt = DateTime.UtcNow };
        Context.Users.Add(user);

        // User is admin of both clubs
        Context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, ClubId = club1.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, ClubId = club2.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetClubWithAdminCheckAsync(club2.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(club2.Id));
        Assert.That(result.Name, Is.EqualTo("Test Club 2"));
    }

    #endregion

    #region GetByIdAsync Tests (11 tests)

    [Test]
    public async Task GetByIdAsync_ValidClubId_ReturnsClub()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Act
        var result = await _repository.GetByIdAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(club.Id));
        Assert.That(result.Name, Is.EqualTo(club.Name));
    }

    [Test]
    public async Task GetByIdAsync_InvalidClubId_ReturnsNull()
    {
        // Arrange
        await SeedClubAsync();

        // Act
        var result = await _repository.GetByIdAsync(999);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByIdAsync_MultipleClubs_ReturnsCorrectOne()
    {
        // Arrange
        var club1 = await SeedClubAsync(id: 1);
        var club2 = await SeedClubAsync(id: 2);
        var club3 = await SeedClubAsync(id: 3);

        // Act
        var result = await _repository.GetByIdAsync(club2.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(club2.Id));
        Assert.That(result.Name, Is.EqualTo("Test Club 2"));
    }

    [Test]
    public async Task GetByIdAsync_ClubIdZero_ReturnsNull()
    {
        // Arrange
        await SeedClubAsync();

        // Act
        var result = await _repository.GetByIdAsync(0);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByIdAsync_NegativeClubId_ReturnsNull()
    {
        // Arrange
        await SeedClubAsync();

        // Act
        var result = await _repository.GetByIdAsync(-1);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByIdAsync_NoClubsInDatabase_ReturnsNull()
    {
        // Arrange - no clubs created

        // Act
        var result = await _repository.GetByIdAsync(1);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByIdAsync_ClubWithDifferentTiers_ReturnsClubWithCorrectTier()
    {
        // Arrange
        var club = await SeedClubAsync(tier: "Grow");

        // Act
        var result = await _repository.GetByIdAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Tier, Is.EqualTo("Grow"));
    }

    [Test]
    public async Task GetByIdAsync_ExpiredClub_StillReturnsClub()
    {
        // Arrange
        var club = await SeedClubAsync();
        club.MembershipExpiresAt = DateTime.UtcNow.AddDays(-30);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.MembershipExpiresAt, Is.LessThan(DateTime.UtcNow));
    }

    [Test]
    public async Task GetByIdAsync_ClubWithTrialPeriod_ReturnsClub()
    {
        // Arrange
        var club = await SeedClubAsync();
        club.TrialExpiresAt = DateTime.UtcNow.AddDays(14);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.TrialExpiresAt, Is.Not.Null);
        Assert.That(result.TrialExpiresAt, Is.GreaterThan(DateTime.UtcNow));
    }

    [Test]
    public async Task GetByIdAsync_ClubWithStripeData_ReturnsClubWithStripeInfo()
    {
        // Arrange
        var club = await SeedClubAsync();
        club.StripeCustomerId = "cus_test123";
        club.StripeSubscriptionId = "sub_test123";
        club.SubscriptionStatus = "active";
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.StripeCustomerId, Is.EqualTo("cus_test123"));
        Assert.That(result.StripeSubscriptionId, Is.EqualTo("sub_test123"));
        Assert.That(result.SubscriptionStatus, Is.EqualTo("active"));
    }

    [Test]
    public async Task GetByIdAsync_CalledMultipleTimes_ReturnsConsistentResults()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Act
        var result1 = await _repository.GetByIdAsync(club.Id);
        var result2 = await _repository.GetByIdAsync(club.Id);
        var result3 = await _repository.GetByIdAsync(club.Id);

        // Assert
        Assert.That(result1, Is.Not.Null);
        Assert.That(result2, Is.Not.Null);
        Assert.That(result3, Is.Not.Null);
        Assert.That(result1!.Id, Is.EqualTo(result2!.Id));
        Assert.That(result2.Id, Is.EqualTo(result3!.Id));
    }

    #endregion
}
