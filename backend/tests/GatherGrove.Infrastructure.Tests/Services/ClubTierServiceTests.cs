using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Services;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Tests.Services;

/// <summary>
/// TDD Tests for ClubTierService - SECURITY CRITICAL
/// Tests tier-based access control, export limits, and authorization logic
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
public class ClubTierServiceTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly ClubTierService _tierService;
    private readonly Mock<ILogger<ClubTierService>> _mockLogger;

    public ClubTierServiceTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<ClubTierService>>();
        _tierService = new ClubTierService(_context, _mockLogger.Object);

        SeedTestData();
    }

    private void SeedTestData()
    {
        var users = new[]
        {
            new User { Id = 1, FullName = "Active User", Email = "active@test.com", IsActive = true },
            new User { Id = 2, FullName = "Inactive User", Email = "inactive@test.com", IsActive = false },
            new User { Id = 3, FullName = "Non-Admin User", Email = "nonadmin@test.com", IsActive = true }
        };

        var clubs = new[]
        {
            new Club { Id = 1, Name = "Unlimited Club Active", Tier = "Unlimited", MembershipExpiresAt = DateTime.UtcNow.AddYears(1), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 2, Name = "Unlimited Club Expired", Tier = "Unlimited", MembershipExpiresAt = DateTime.UtcNow.AddDays(-1), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 3, Name = "Grow Club", Tier = "Grow", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 4, Name = "Legacy Club", Tier = "Legacy", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 5, Name = "Unknown Tier Club", Tier = "Unknown", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 6, Name = "Sprout Club", Tier = "Sprout", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 7, Name = "Unlimited Club No Expiry", Tier = "Unlimited", MembershipExpiresAt = null, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 8, Name = "Unlimited Lowercase", Tier = "unlimited", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 9, Name = "Unlimited Uppercase", Tier = "UNLIMITED", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var clubAdmins = new[]
        {
            new ClubAdmin { UserId = 1, ClubId = 1 }, // Active user, Unlimited Active
            new ClubAdmin { UserId = 1, ClubId = 2 }, // Active user, Unlimited Expired
            new ClubAdmin { UserId = 1, ClubId = 3 }, // Active user, Premium
            new ClubAdmin { UserId = 1, ClubId = 7 }, // Active user, Unlimited No Expiry
            new ClubAdmin { UserId = 1, ClubId = 8 }, // Active user, Unlimited Lowercase
            new ClubAdmin { UserId = 1, ClubId = 9 }, // Active user, Unlimited Uppercase
            new ClubAdmin { UserId = 2, ClubId = 4 }  // Inactive user, Standard
        };

        _context.Users.AddRange(users);
        _context.Clubs.AddRange(clubs);
        _context.ClubAdmins.AddRange(clubAdmins);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region HasUnlimitedTierAccess Tests (18 tests) - SECURITY CRITICAL

    [Test]
    public void HasUnlimitedTierAccess_InvalidUserId_ThrowsUnauthorizedException()
    {
        // Arrange
        var invalidUserId = 0;
        var clubId = 1;

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _tierService.HasUnlimitedTierAccess(invalidUserId, clubId));
    }

    [Test]
    public void HasUnlimitedTierAccess_NegativeUserId_ThrowsUnauthorizedException()
    {
        // Arrange
        var invalidUserId = -5;
        var clubId = 1;

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _tierService.HasUnlimitedTierAccess(invalidUserId, clubId));
    }

    [Test]
    public void HasUnlimitedTierAccess_UserNotFound_ThrowsUnauthorizedException()
    {
        // Arrange
        var nonExistentUserId = 999;
        var clubId = 1;

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _tierService.HasUnlimitedTierAccess(nonExistentUserId, clubId));
    }

    [Test]
    public void HasUnlimitedTierAccess_UserInactive_ThrowsUnauthorizedException()
    {
        // Arrange
        var inactiveUserId = 2;
        var clubId = 4;

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _tierService.HasUnlimitedTierAccess(inactiveUserId, clubId));
    }

    [Test]
    public async Task HasUnlimitedTierAccess_UserNotAdmin_ReturnsFalse()
    {
        // Arrange
        var userId = 3; // Non-admin user
        var clubId = 1;

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_ClubNotFound_ReturnsFalse()
    {
        // Arrange
        var userId = 1;
        var nonExistentClubId = 999;

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, nonExistentClubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void HasUnlimitedTierAccess_ClubMembershipExpired_ThrowsUnauthorizedException()
    {
        // Arrange
        var userId = 1;
        var clubId = 2; // Unlimited tier but expired

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _tierService.HasUnlimitedTierAccess(userId, clubId));
    }

    [Test]
    public async Task HasUnlimitedTierAccess_UnlimitedTierActiveAdmin_ReturnsTrue()
    {
        // Arrange
        var userId = 1;
        var clubId = 1; // Unlimited tier, active membership

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_UnlimitedTierNoExpiry_ReturnsTrue()
    {
        // Arrange
        var userId = 1;
        var clubId = 7; // Unlimited tier, no expiration date

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_PremiumTier_ReturnsFalse()
    {
        // Arrange
        var userId = 1;
        var clubId = 3; // Premium tier

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_StandardTier_ReturnsFalse()
    {
        // Arrange - need to add user 1 as admin of club 4
        _context.ClubAdmins.Add(new ClubAdmin { UserId = 1, ClubId = 4 });
        await _context.SaveChangesAsync();

        var userId = 1;
        var clubId = 4; // Standard tier

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_BasicTier_ReturnsFalse()
    {
        // Arrange - need to add user 1 as admin of club 5
        _context.ClubAdmins.Add(new ClubAdmin { UserId = 1, ClubId = 5 });
        await _context.SaveChangesAsync();

        var userId = 1;
        var clubId = 5; // Basic tier

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_NullTier_ReturnsFalse()
    {
        // Arrange - need to add user 1 as admin of club 6
        _context.ClubAdmins.Add(new ClubAdmin { UserId = 1, ClubId = 6 });
        await _context.SaveChangesAsync();

        var userId = 1;
        var clubId = 6; // Null tier

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_CaseInsensitiveLowercase_ReturnsTrue()
    {
        // Arrange
        var userId = 1;
        var clubId = 8; // "unlimited" (lowercase)

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_CaseInsensitiveUppercase_ReturnsTrue()
    {
        // Arrange
        var userId = 1;
        var clubId = 9; // "UNLIMITED" (uppercase)

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_MembershipExpiresFuture_ReturnsTrue()
    {
        // Arrange
        var userId = 1;
        var clubId = 1; // Expires in 1 year

        // Act
        var result = await _tierService.HasUnlimitedTierAccess(userId, clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_GeneralException_ReturnsFalse()
    {
        // Arrange - dispose context to cause exception
        var disposedContext = new GatherGroveDbContext(
            new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
        disposedContext.Dispose();

        var disposedService = new ClubTierService(disposedContext, _mockLogger.Object);

        // Act
        var result = await disposedService.HasUnlimitedTierAccess(1, 1);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasUnlimitedTierAccess_MultipleUsers_ReturnsCorrectResults()
    {
        // Arrange
        var adminUserId = 1;
        var nonAdminUserId = 3;
        var clubId = 1;

        // Act
        var adminResult = await _tierService.HasUnlimitedTierAccess(adminUserId, clubId);
        var nonAdminResult = await _tierService.HasUnlimitedTierAccess(nonAdminUserId, clubId);

        // Assert
        Assert.That(adminResult, Is.True);
        Assert.That(nonAdminResult, Is.False);
    }

    #endregion

    #region CanExportFinancialData Tests (6 tests)

    [Test]
    public async Task CanExportFinancialData_UserIsAdmin_ReturnsTrue()
    {
        // Arrange
        var userId = 1;
        var clubId = 1;

        // Act
        var result = await _tierService.CanExportFinancialData(userId, clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanExportFinancialData_UserNotAdmin_ReturnsFalse()
    {
        // Arrange
        var userId = 3; // Not admin
        var clubId = 1;

        // Act
        var result = await _tierService.CanExportFinancialData(userId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportFinancialData_UserDoesNotExist_ReturnsFalse()
    {
        // Arrange
        var nonExistentUserId = 999;
        var clubId = 1;

        // Act
        var result = await _tierService.CanExportFinancialData(nonExistentUserId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportFinancialData_ClubDoesNotExist_ReturnsFalse()
    {
        // Arrange
        var userId = 1;
        var nonExistentClubId = 999;

        // Act
        var result = await _tierService.CanExportFinancialData(userId, nonExistentClubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportFinancialData_ExceptionHandling_ReturnsFalse()
    {
        // Arrange - dispose context to cause exception
        var disposedContext = new GatherGroveDbContext(
            new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
        disposedContext.Dispose();

        var disposedService = new ClubTierService(disposedContext, _mockLogger.Object);

        // Act
        var result = await disposedService.CanExportFinancialData(1, 1);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportFinancialData_AllTierLevelsForAdmin_ReturnsTrue()
    {
        // Arrange
        var userId = 1;

        // Act
        var unlimitedResult = await _tierService.CanExportFinancialData(userId, 1); // Unlimited
        var premiumResult = await _tierService.CanExportFinancialData(userId, 3); // Premium

        // Assert
        Assert.That(unlimitedResult, Is.True);
        Assert.That(premiumResult, Is.True);
    }

    #endregion

    #region CanExportMemberData Tests (6 tests)

    [Test]
    public async Task CanExportMemberData_UserIsAdmin_ReturnsTrue()
    {
        // Arrange
        var userId = 1;
        var clubId = 1;

        // Act
        var result = await _tierService.CanExportMemberData(userId, clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanExportMemberData_UserNotAdmin_ReturnsFalse()
    {
        // Arrange
        var userId = 3; // Not admin
        var clubId = 1;

        // Act
        var result = await _tierService.CanExportMemberData(userId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportMemberData_UserDoesNotExist_ReturnsFalse()
    {
        // Arrange
        var nonExistentUserId = 999;
        var clubId = 1;

        // Act
        var result = await _tierService.CanExportMemberData(nonExistentUserId, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportMemberData_ClubDoesNotExist_ReturnsFalse()
    {
        // Arrange
        var userId = 1;
        var nonExistentClubId = 999;

        // Act
        var result = await _tierService.CanExportMemberData(userId, nonExistentClubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportMemberData_ExceptionHandling_ReturnsFalse()
    {
        // Arrange - dispose context to cause exception
        var disposedContext = new GatherGroveDbContext(
            new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
        disposedContext.Dispose();

        var disposedService = new ClubTierService(disposedContext, _mockLogger.Object);

        // Act
        var result = await disposedService.CanExportMemberData(1, 1);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanExportMemberData_AllTierLevelsForAdmin_ReturnsTrue()
    {
        // Arrange
        var userId = 1;

        // Act
        var unlimitedResult = await _tierService.CanExportMemberData(userId, 1); // Unlimited
        var premiumResult = await _tierService.CanExportMemberData(userId, 3); // Premium

        // Assert
        Assert.That(unlimitedResult, Is.True);
        Assert.That(premiumResult, Is.True);
    }

    #endregion

    #region GetFinancialExportLimitAsync Tests (5 tests)

    [Test]
    public async Task GetFinancialExportLimitAsync_UnlimitedTier_ReturnsMaxValue()
    {
        // Arrange
        var clubId = 1; // Unlimited tier

        // Act
        var result = await _tierService.GetFinancialExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(int.MaxValue));
    }

    [Test]
    public async Task GetFinancialExportLimitAsync_GrowTier_Returns50()
    {
        // Arrange
        var clubId = 3; // Grow tier

        // Act
        var result = await _tierService.GetFinancialExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(50));
    }

    [Test]
    public async Task GetFinancialExportLimitAsync_UnknownTier_Returns20()
    {
        // Arrange
        var clubId = 4; // Legacy/unknown tier — falls to default 20

        // Act
        var result = await _tierService.GetFinancialExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(20));
    }

    [Test]
    public async Task GetFinancialExportLimitAsync_AnotherUnknownTier_Returns20()
    {
        // Arrange
        var clubId = 5; // Unknown tier — falls to default 20

        // Act
        var result = await _tierService.GetFinancialExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(20));
    }

    [Test]
    public async Task GetFinancialExportLimitAsync_ClubNotFound_Returns0()
    {
        // Arrange
        var nonExistentClubId = 999;

        // Act
        var result = await _tierService.GetFinancialExportLimitAsync(nonExistentClubId);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    #endregion

    #region GetMemberExportLimitAsync Tests (5 tests)

    [Test]
    public async Task GetMemberExportLimitAsync_UnlimitedTier_ReturnsMaxValue()
    {
        // Arrange
        var clubId = 1; // Unlimited tier

        // Act
        var result = await _tierService.GetMemberExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(int.MaxValue));
    }

    [Test]
    public async Task GetMemberExportLimitAsync_GrowTier_Returns100()
    {
        // Arrange
        var clubId = 3; // Grow tier

        // Act
        var result = await _tierService.GetMemberExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(100));
    }

    [Test]
    public async Task GetMemberExportLimitAsync_UnknownTier_Returns50()
    {
        // Arrange
        var clubId = 4; // Legacy/unknown tier — falls to default 50

        // Act
        var result = await _tierService.GetMemberExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(50));
    }

    [Test]
    public async Task GetMemberExportLimitAsync_AnotherUnknownTier_Returns50()
    {
        // Arrange
        var clubId = 5; // Unknown tier — falls to default 50

        // Act
        var result = await _tierService.GetMemberExportLimitAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(50));
    }

    [Test]
    public async Task GetMemberExportLimitAsync_ClubNotFound_Returns0()
    {
        // Arrange
        var nonExistentClubId = 999;

        // Act
        var result = await _tierService.GetMemberExportLimitAsync(nonExistentClubId);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    #endregion

    #region CanExportEventData Tests (2 tests)

    [Test]
    public async Task CanExportEventData_UnlimitedAndGrowTiers_ReturnsTrue()
    {
        // Arrange & Act
        var unlimitedResult = await _tierService.CanExportEventData(1, 1); // Unlimited
        var growResult = await _tierService.CanExportEventData(1, 3); // Grow

        // Assert
        Assert.That(unlimitedResult, Is.True);
        Assert.That(growResult, Is.True);
    }

    [Test]
    public async Task CanExportEventData_UnknownTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 5; // Unknown tier — not Grow or Unlimited

        // Act
        var result = await _tierService.CanExportEventData(1, clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region Seed Tier Tests

    [Test]
    public async Task GetFinancialExportLimitAsync_SeedTier_Returns20()
    {
        // Arrange - add a Seed tier club
        var seedClub = new Club { Id = 10, Name = "Seed Club", Tier = "Seed", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var limit = await _tierService.GetFinancialExportLimitAsync(10);

        // Assert
        Assert.That(limit, Is.EqualTo(20));
    }

    [Test]
    public async Task GetMemberExportLimitAsync_SeedTier_Returns50()
    {
        // Arrange
        var seedClub = new Club { Id = 11, Name = "Seed Club 2", Tier = "Seed", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var limit = await _tierService.GetMemberExportLimitAsync(11);

        // Assert
        Assert.That(limit, Is.EqualTo(50));
    }

    [Test]
    public async Task CanExportEventData_SeedTier_ReturnsTrue()
    {
        // Arrange
        var seedClub = new Club { Id = 12, Name = "Seed Club 3", Tier = "Seed", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        var seedAdmin = new ClubAdmin { UserId = 1, ClubId = 12 };
        _context.ClubAdmins.Add(seedAdmin);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierService.CanExportEventData(1, 12);

        // Assert
        Assert.That(result, Is.True);
    }

    #endregion
}
