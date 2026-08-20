using NUnit.Framework;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;
using System;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class AdminServiceTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<ILogger<AdminService>> _mockLogger = null!;
    private Mock<IEmailService> _mockEmailService = null!;
    private AdminService _adminService = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<AdminService>>();
        _mockEmailService = new Mock<IEmailService>();
        _adminService = new AdminService(_context, _mockLogger.Object, _mockEmailService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region GetClubAdminsAsync Tests

    [Test]
    public async Task GetClubAdminsAsync_Should_Return_All_Admins_For_Club()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var regularAdmin = new User { Id = 2, FullName = "Regular Admin", Email = "admin@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(primaryAdmin, regularAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, UserId = 2, ClubId = 1, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _adminService.GetClubAdminsAsync(1, 1);

        // Assert
        result.Should().HaveCount(2);
        var adminsList = result.ToList();

        // Primary admin should be marked as primary
        var primaryAdminResponse = adminsList.First(a => a.UserId == 1);
        primaryAdminResponse.Role.Should().Be("Primary");
        primaryAdminResponse.FullName.Should().Be("Primary Admin");
        primaryAdminResponse.IsCurrentUser.Should().BeTrue();

        // Regular admin should be marked as admin
        var regularAdminResponse = adminsList.First(a => a.UserId == 2);
        regularAdminResponse.Role.Should().Be("Admin");
        regularAdminResponse.FullName.Should().Be("Regular Admin");
        regularAdminResponse.IsCurrentUser.Should().BeFalse();
    }

    [Test]
    public async Task GetClubAdminsAsync_Should_Return_Empty_List_For_NonExistent_Club()
    {
        // Act
        var result = await _adminService.GetClubAdminsAsync(999, 1);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region CreateAdminInviteAsync Tests

    [Test]
    public async Task CreateAdminInviteAsync_Should_Create_Invite_For_Grow_Tier_Club()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        // Act
        var result = await _adminService.CreateAdminInviteAsync(1, 1, request);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("newadmin@test.com");
        result.Status.Should().Be("Pending");
        result.InvitedByName.Should().Be("Primary Admin");
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow.AddHours(71)); // Should be around 72 hours

        // Verify invite was saved to database
        var savedInvite = await _context.ClubAdminInvites.FirstOrDefaultAsync();
        savedInvite.Should().NotBeNull();
        savedInvite!.Email.Should().Be("newadmin@test.com");
        savedInvite.ClubId.Should().Be(1);
        savedInvite.InvitedByUserId.Should().Be(1);
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Throw_Exception_For_Sprout_Tier_Club()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Sprout", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.CreateAdminInviteAsync(1, 1, request));

        Assert.That(exception.Message, Does.Contain("Admin invitations require at least a Seed tier subscription"));
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Create_Invite_For_Seed_Tier_Club()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Seed", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        // Act
        var result = await _adminService.CreateAdminInviteAsync(1, 1, request);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("newadmin@test.com");
        result.Status.Should().Be("Pending");
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Create_Invite_For_Unlimited_Tier_Club()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        // Act
        var result = await _adminService.CreateAdminInviteAsync(1, 1, request);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("Pending");
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Enforce_2_Admin_Limit_For_Seed_Tier()
    {
        // Arrange
        var users = new[]
        {
            new User { Id = 1, FullName = "Admin 1", Email = "admin1@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = 2, FullName = "Admin 2", Email = "admin2@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Seed", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(users);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, UserId = 2, ClubId = 1, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.CreateAdminInviteAsync(1, 1, request));

        Assert.That(exception.Message, Does.Contain("maximum number of administrators (2)"));
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Allow_Up_To_3_Admins_For_Grow_Tier()
    {
        // Arrange — 2 existing admins on Grow tier, inviting a 3rd should succeed
        var users = new[]
        {
            new User { Id = 1, FullName = "Admin 1", Email = "admin1@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = 2, FullName = "Admin 2", Email = "admin2@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(users);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, UserId = 2, ClubId = 1, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "thirdadmin@test.com" };

        // Act — should not throw; Grow allows 3 admins total (2 existing + 1 invite)
        var result = await _adminService.CreateAdminInviteAsync(1, 1, request);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("Pending");
    }

    [Test]
    public async Task CreateAdminInviteAsync_Unlimited_Tier_Has_No_Admin_Limit()
    {
        // Arrange — 5 existing admins on Unlimited tier
        var users = Enumerable.Range(1, 5)
            .Select(i => new User { Id = i, FullName = $"Admin {i}", Email = $"admin{i}@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow })
            .ToList();
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(users);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(users.Select((u, i) =>
            new ClubAdmin { Id = i + 1, UserId = u.Id, ClubId = 1, CreatedAt = DateTime.UtcNow }));
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "sixth@test.com" };

        // Act — should not throw; Unlimited has no cap
        var result = await _adminService.CreateAdminInviteAsync(1, 1, request);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("Pending");
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Throw_Exception_For_Non_Admin_User()
    {
        // Arrange
        var user = new User { Id = 1, FullName = "Regular User", Email = "user@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.CreateAdminInviteAsync(1, 1, request));

        Assert.That(exception.Message, Does.Contain("Only club administrators can send invitations"));
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Throw_Exception_When_At_Admin_Limit()
    {
        // Arrange
        var users = new[]
        {
            new User { Id = 1, FullName = "Admin 1", Email = "admin1@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = 2, FullName = "Admin 2", Email = "admin2@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = 3, FullName = "Admin 3", Email = "admin3@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(users);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, UserId = 2, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 3, UserId = 3, ClubId = 1, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "newadmin@test.com" };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.CreateAdminInviteAsync(1, 1, request));

        Assert.That(exception.Message, Does.Contain("Club has reached the maximum number of administrators (3)"));
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Throw_Exception_For_Existing_Admin_Email()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var existingAdmin = new User { Id = 2, FullName = "Existing Admin", Email = "existing@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(primaryAdmin, existingAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, UserId = 2, ClubId = 1, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "existing@test.com" };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.CreateAdminInviteAsync(1, 1, request));

        Assert.That(exception.Message, Does.Contain("This person is already an administrator of this club"));
    }

    [Test]
    public async Task CreateAdminInviteAsync_Should_Throw_Exception_For_Pending_Invite_Email()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        _context.ClubAdminInvites.Add(new ClubAdminInvite
        {
            InviteId = 1,
            ClubId = 1,
            Email = "pending@test.com",
            InviteToken = "token123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = 1
        });
        await _context.SaveChangesAsync();

        var request = new CreateAdminInviteRequest { Email = "pending@test.com" };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.CreateAdminInviteAsync(1, 1, request));

        Assert.That(exception.Message, Does.Contain("An invitation has already been sent to this email address"));
    }

    #endregion

    #region GetPendingInvitesAsync Tests

    [Test]
    public async Task GetPendingInvitesAsync_Should_Return_Only_Pending_Non_Expired_Invites()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdminInvites.AddRange(
            new ClubAdminInvite
            {
                InviteId = 1,
                ClubId = 1,
                Email = "pending@test.com",
                InviteToken = "token1",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            },
            new ClubAdminInvite
            {
                InviteId = 2,
                ClubId = 1,
                Email = "expired@test.com",
                InviteToken = "token2",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            },
            new ClubAdminInvite
            {
                InviteId = 3,
                ClubId = 1,
                Email = "cancelled@test.com",
                InviteToken = "token3",
                Status = "Cancelled",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _adminService.GetPendingInvitesAsync(1);

        // Assert
        result.Should().HaveCount(1);
        var invite = result.First();
        invite.Email.Should().Be("pending@test.com");
        invite.Status.Should().Be("Pending");
        invite.InvitedByName.Should().Be("Primary Admin");
    }

    #endregion

    #region CancelInviteAsync Tests

    [Test]
    public async Task CancelInviteAsync_Should_Cancel_Pending_Invite()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        _context.ClubAdminInvites.Add(new ClubAdminInvite
        {
            InviteId = 1,
            ClubId = 1,
            Email = "pending@test.com",
            InviteToken = "token123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = 1
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _adminService.CancelInviteAsync(1, 1, 1);

        // Assert
        result.Should().BeTrue();

        var cancelledInvite = await _context.ClubAdminInvites.FindAsync(1);
        cancelledInvite!.Status.Should().Be("Cancelled");
    }

    [Test]
    public async Task CancelInviteAsync_Should_Return_False_For_NonExistent_Invite()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        // Act
        var result = await _adminService.CancelInviteAsync(1, 999, 1);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region RemoveAdminAsync Tests

    [Test]
    public async Task RemoveAdminAsync_Should_Remove_Regular_Admin()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var regularAdmin = new User { Id = 2, FullName = "Regular Admin", Email = "admin@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(primaryAdmin, regularAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, UserId = 2, ClubId = 1, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _adminService.RemoveAdminAsync(1, 2, 1);

        // Assert
        result.Should().BeTrue();

        var remainingAdmins = await _context.ClubAdmins.Where(ca => ca.ClubId == 1).ToListAsync();
        remainingAdmins.Should().HaveCount(1);
        remainingAdmins.First().UserId.Should().Be(1); // Only primary admin remains
    }

    [Test]
    public async Task RemoveAdminAsync_Should_Throw_Exception_For_Sprout_Tier()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Sprout", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.RemoveAdminAsync(1, 2, 1));

        Assert.That(exception.Message, Does.Contain("Admin management requires at least a Seed tier subscription"));
    }

    [Test]
    public async Task RemoveAdminAsync_Should_Throw_Exception_When_Removing_Self()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.RemoveAdminAsync(1, 1, 1)); // Trying to remove self

        Assert.That(exception.Message, Does.Contain("You cannot remove yourself as an administrator"));
    }

    [Test]
    public async Task RemoveAdminAsync_Should_Throw_Exception_When_Removing_Primary_Admin()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var regularAdmin = new User { Id = 2, FullName = "Regular Admin", Email = "admin@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Grow", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(primaryAdmin, regularAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdmins.AddRange(
            new ClubAdmin { Id = 1, UserId = 1, ClubId = 1, CreatedAt = DateTime.UtcNow },
            new ClubAdmin { Id = 2, UserId = 2, ClubId = 1, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminService.RemoveAdminAsync(1, 1, 2)); // Regular admin trying to remove primary admin

        Assert.That(exception.Message, Does.Contain("The primary administrator cannot be removed"));
    }

    #endregion

    #region HandleTierDowngradeAsync Tests

    [Test]
    public async Task HandleTierDowngradeAsync_Should_Cancel_All_Pending_Invitations()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Sprout", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdminInvites.AddRange(
            new ClubAdminInvite
            {
                InviteId = 1,
                ClubId = 1,
                Email = "invite1@test.com",
                InviteToken = "token1",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(48),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            },
            new ClubAdminInvite
            {
                InviteId = 2,
                ClubId = 1,
                Email = "invite2@test.com",
                InviteToken = "token2",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            }
        );
        await _context.SaveChangesAsync();

        // Act
        await _adminService.HandleTierDowngradeAsync(1);

        // Assert
        var invitations = await _context.ClubAdminInvites.Where(ci => ci.ClubId == 1).ToListAsync();
        invitations.Should().HaveCount(2);
        invitations.Should().AllSatisfy(i => i.Status.Should().Be("Cancelled"));
    }

    [Test]
    public async Task HandleTierDowngradeAsync_Should_Handle_No_Pending_Invitations_Gracefully()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Sprout", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act - Should not throw exception
        await _adminService.HandleTierDowngradeAsync(1);

        // Assert - No invitations should exist
        var invitations = await _context.ClubAdminInvites.Where(ci => ci.ClubId == 1).ToListAsync();
        invitations.Should().BeEmpty();
    }

    [Test]
    public async Task HandleTierDowngradeAsync_Should_Only_Cancel_Pending_Invitations()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Sprout", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdminInvites.AddRange(
            new ClubAdminInvite
            {
                InviteId = 1,
                ClubId = 1,
                Email = "pending@test.com",
                InviteToken = "token1",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            },
            new ClubAdminInvite
            {
                InviteId = 2,
                ClubId = 1,
                Email = "already-cancelled@test.com",
                InviteToken = "token2",
                Status = "Cancelled",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            },
            new ClubAdminInvite
            {
                InviteId = 3,
                ClubId = 1,
                Email = "accepted@test.com",
                InviteToken = "token3",
                Status = "Accepted",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            }
        );
        await _context.SaveChangesAsync();

        // Act
        await _adminService.HandleTierDowngradeAsync(1);

        // Assert
        var invitations = await _context.ClubAdminInvites.Where(ci => ci.ClubId == 1).ToListAsync();
        invitations.Should().HaveCount(3);

        var pendingInvite = invitations.First(i => i.InviteId == 1);
        pendingInvite.Status.Should().Be("Cancelled"); // Should be cancelled

        var alreadyCancelledInvite = invitations.First(i => i.InviteId == 2);
        alreadyCancelledInvite.Status.Should().Be("Cancelled"); // Should remain cancelled

        var acceptedInvite = invitations.First(i => i.InviteId == 3);
        acceptedInvite.Status.Should().Be("Accepted"); // Should remain accepted
    }

    [Test]
    public async Task HandleTierDowngradeAsync_Should_Not_Cancel_Expired_Invitations()
    {
        // Arrange
        var primaryAdmin = new User { Id = 1, FullName = "Primary Admin", Email = "primary@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Sprout", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.Add(primaryAdmin);
        _context.Clubs.Add(club);
        _context.ClubAdminInvites.AddRange(
            new ClubAdminInvite
            {
                InviteId = 1,
                ClubId = 1,
                Email = "expired@test.com",
                InviteToken = "token1",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired
                CreatedAt = DateTime.UtcNow.AddHours(-25),
                InvitedByUserId = 1
            },
            new ClubAdminInvite
            {
                InviteId = 2,
                ClubId = 1,
                Email = "active@test.com",
                InviteToken = "token2",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(24), // Not expired
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            }
        );
        await _context.SaveChangesAsync();

        // Act
        await _adminService.HandleTierDowngradeAsync(1);

        // Assert
        var invitations = await _context.ClubAdminInvites.Where(ci => ci.ClubId == 1).ToListAsync();
        invitations.Should().HaveCount(2);

        var expiredInvite = invitations.First(i => i.InviteId == 1);
        expiredInvite.Status.Should().Be("Pending"); // Should remain pending (expired invites are ignored)

        var activeInvite = invitations.First(i => i.InviteId == 2);
        activeInvite.Status.Should().Be("Cancelled"); // Should be cancelled
    }

    [Test]
    public async Task HandleTierDowngradeAsync_Should_Not_Affect_Other_Clubs_Invitations()
    {
        // Arrange
        var admin1 = new User { Id = 1, FullName = "Admin 1", Email = "admin1@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var admin2 = new User { Id = 2, FullName = "Admin 2", Email = "admin2@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club1 = new Club { Id = 1, Name = "Club 1", Tier = "Sprout", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var club2 = new Club { Id = 2, Name = "Club 2", Tier = "Grow", CreatedByUserId = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _context.Users.AddRange(admin1, admin2);
        _context.Clubs.AddRange(club1, club2);
        _context.ClubAdminInvites.AddRange(
            new ClubAdminInvite
            {
                InviteId = 1,
                ClubId = 1,
                Email = "invite-club1@test.com",
                InviteToken = "token1",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 1
            },
            new ClubAdminInvite
            {
                InviteId = 2,
                ClubId = 2,
                Email = "invite-club2@test.com",
                InviteToken = "token2",
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                InvitedByUserId = 2
            }
        );
        await _context.SaveChangesAsync();

        // Act - Downgrade only club 1
        await _adminService.HandleTierDowngradeAsync(1);

        // Assert
        var club1Invites = await _context.ClubAdminInvites.Where(ci => ci.ClubId == 1).ToListAsync();
        club1Invites.Should().HaveCount(1);
        club1Invites.First().Status.Should().Be("Cancelled");

        var club2Invites = await _context.ClubAdminInvites.Where(ci => ci.ClubId == 2).ToListAsync();
        club2Invites.Should().HaveCount(1);
        club2Invites.First().Status.Should().Be("Pending"); // Should remain unchanged
    }

    #endregion
}