using NUnit.Framework;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;

namespace GatherGrove.Application.Tests;

[TestFixture]
public class IsolatedAdminTest
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
}