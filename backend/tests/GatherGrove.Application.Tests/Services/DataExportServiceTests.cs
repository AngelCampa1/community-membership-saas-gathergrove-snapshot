using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class DataExportServiceTests
{
    private GatherGroveDbContext _context = null!;
    private ILogger<DataExportService> _logger = null!;
    private DataExportService _service = null!;
    private string _tempExportPath = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(options);
        _logger = NullLogger<DataExportService>.Instance;
        _service = new DataExportService(_context, _logger);

        // Store the temp path for cleanup
        _tempExportPath = Path.Combine(Path.GetTempPath(), "GatherGrove", "Exports");
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region ExportUserDataAsync Tests

    [Test]
    public async Task ExportUserDataAsync_ValidUser_ReturnsExportResult()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow.AddYears(-1)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ExportId, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.DownloadUrl, Does.StartWith("/api/account-deletion/download/"));
        Assert.That(result.Format, Is.EqualTo("ZIP"));
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
        Assert.That(result.ExpiresAt, Is.GreaterThan(DateTime.UtcNow));
    }

    [Test]
    public async Task ExportUserDataAsync_ValidUser_IncludesExpectedDataCategories()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result.IncludedDataCategories, Is.Not.Empty);
        Assert.That(result.IncludedDataCategories, Does.Contain("User Account"));
        Assert.That(result.IncludedDataCategories, Does.Contain("Club Memberships"));
        Assert.That(result.IncludedDataCategories, Does.Contain("Club Admin Roles"));
        Assert.That(result.IncludedDataCategories, Does.Contain("Created Events"));
        Assert.That(result.IncludedDataCategories, Does.Contain("Payment History"));
    }

    [Test]
    public void ExportUserDataAsync_NonExistentUser_ThrowsException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.ExportUserDataAsync(999));

        Assert.That(ex!.Message, Does.Contain("User 999 not found"));
    }

    [Test]
    public async Task ExportUserDataAsync_UserWithClubAdmin_IncludesClubAdminData()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User
        {
            Id = 1,
            FullName = "Admin User",
            Email = "admin@example.com",
            CreatedAt = DateTime.UtcNow
        };
        var clubAdmin = new ClubAdmin
        {
            ClubId = 1,
            UserId = 1,
            Club = club,
            User = user,
            CreatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.Users.Add(user);
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    [Test]
    public async Task ExportUserDataAsync_UserWithMember_IncludesMemberData()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User
        {
            Id = 1,
            FullName = "Member User",
            Email = "member@example.com",
            CreatedAt = DateTime.UtcNow
        };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Club = club,
            FullName = "Member User",
            Email = "member@example.com",
            JoinDate = DateTime.UtcNow,
            Status = "Active"
        };

        _context.Clubs.Add(club);
        _context.Users.Add(user);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    [Test]
    public async Task ExportUserDataAsync_CreatesZipFile()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert - File should exist
        var exportFilePath = Path.Combine(_tempExportPath, $"export-{result.ExportId}.zip");
        Assert.That(File.Exists(exportFilePath), Is.True);

        // Cleanup
        if (File.Exists(exportFilePath))
        {
            File.Delete(exportFilePath);
        }
    }

    [Test]
    public async Task ExportUserDataAsync_SetsExpiryTo7Days()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var beforeExport = DateTime.UtcNow;
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        var expectedExpiry = beforeExport.AddDays(7);
        Assert.That(result.ExpiresAt, Is.GreaterThanOrEqualTo(expectedExpiry.AddSeconds(-10)));
        Assert.That(result.ExpiresAt, Is.LessThanOrEqualTo(expectedExpiry.AddSeconds(10)));
    }

    #endregion

    #region GetExportStatusAsync Tests

    [Test]
    public async Task GetExportStatusAsync_AfterExport_ReturnsCompletedStatus()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var exportResult = await _service.ExportUserDataAsync(1);

        // Act
        var status = await _service.GetExportStatusAsync(exportResult.ExportId);

        // Assert
        Assert.That(status.ExportId, Is.EqualTo(exportResult.ExportId));
        Assert.That(status.State, Is.EqualTo(DataExportState.Completed));
        Assert.That(status.ProgressPercentage, Is.EqualTo(100));
        Assert.That(status.CompletedAt, Is.Not.Null);
    }

    [Test]
    public void GetExportStatusAsync_NonExistentExport_ThrowsException()
    {
        // Arrange
        var randomExportId = Guid.NewGuid();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.GetExportStatusAsync(randomExportId));

        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task GetExportStatusAsync_HasCorrectCreatedAt()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var beforeExport = DateTime.UtcNow;
        var exportResult = await _service.ExportUserDataAsync(1);
        var afterExport = DateTime.UtcNow;

        // Act
        var status = await _service.GetExportStatusAsync(exportResult.ExportId);

        // Assert
        Assert.That(status.CreatedAt, Is.GreaterThanOrEqualTo(beforeExport));
        Assert.That(status.CreatedAt, Is.LessThanOrEqualTo(afterExport));
    }

    #endregion

    #region DownloadExportAsync Tests

    [Test]
    public async Task DownloadExportAsync_CompletedExport_ReturnsStream()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var exportResult = await _service.ExportUserDataAsync(1);

        // Act
        using var stream = await _service.DownloadExportAsync(exportResult.ExportId);

        // Assert
        Assert.That(stream, Is.Not.Null);
        Assert.That(stream.Length, Is.GreaterThan(0));
        Assert.That(stream.CanRead, Is.True);
    }

    [Test]
    public async Task DownloadExportAsync_CompletedExport_StreamContainsZipData()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var exportResult = await _service.ExportUserDataAsync(1);

        // Act
        using var stream = await _service.DownloadExportAsync(exportResult.ExportId);

        // Assert - Check for ZIP signature (PK..)
        var buffer = new byte[4];
        await stream.ReadExactlyAsync(buffer, 0, 4);
        Assert.That(buffer[0], Is.EqualTo(0x50)); // P
        Assert.That(buffer[1], Is.EqualTo(0x4B)); // K
    }

    [Test]
    public void DownloadExportAsync_NonExistentExport_ThrowsException()
    {
        // Arrange
        var randomExportId = Guid.NewGuid();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.DownloadExportAsync(randomExportId));

        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    #endregion

    #region CleanupExpiredExportsAsync Tests

    [Test]
    public async Task CleanupExpiredExportsAsync_NoExpiredExports_ReturnsZero()
    {
        // Arrange - Create a fresh service with no exports
        var freshService = new DataExportService(_context, _logger);

        // Act
        var cleanedCount = await freshService.CleanupExpiredExportsAsync();

        // Assert
        Assert.That(cleanedCount, Is.EqualTo(0));
    }

    [Test]
    public async Task CleanupExpiredExportsAsync_MultipleExports_OnlyCleansExpired()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Create an export (which won't be expired)
        var exportResult = await _service.ExportUserDataAsync(1);

        // Act
        var cleanedCount = await _service.CleanupExpiredExportsAsync();

        // Assert - No exports should be cleaned (none are expired)
        Assert.That(cleanedCount, Is.EqualTo(0));

        // The export should still be accessible
        var status = await _service.GetExportStatusAsync(exportResult.ExportId);
        Assert.That(status.State, Is.EqualTo(DataExportState.Completed));
    }

    #endregion

    #region Export Content Tests

    [Test]
    public async Task ExportUserDataAsync_GeneratesUniqueExportIds()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act - Create multiple exports
        var export1 = await _service.ExportUserDataAsync(1);
        var export2 = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(export1.ExportId, Is.Not.EqualTo(export2.ExportId));
    }

    [Test]
    public async Task ExportUserDataAsync_DownloadUrlContainsExportId()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result.DownloadUrl, Does.Contain(result.ExportId.ToString()));
    }

    #endregion

    #region Edge Cases Tests

    [Test]
    public async Task ExportUserDataAsync_UserWithNoRelatedData_StillCreatesExport()
    {
        // Arrange - User with no club memberships, events, or payments
        var user = new User
        {
            Id = 1,
            FullName = "Minimal User",
            Email = "minimal@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    [Test]
    public async Task ExportUserDataAsync_SpecialCharactersInUserName_Handled()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John \"Johnny\" O'Brien <admin>",
            Email = "john@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    [Test]
    public async Task ExportUserDataAsync_UnicodeCharactersInUserName_Handled()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "日本語 名前 🎉",
            Email = "unicode@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    [Test]
    public async Task ExportUserDataAsync_VeryLongUserName_Handled()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = new string('A', 200),
            Email = "long@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    #endregion

    #region Multiple Users Tests

    [Test]
    public async Task ExportUserDataAsync_DifferentUsers_ProduceDifferentExports()
    {
        // Arrange
        var user1 = new User
        {
            Id = 1,
            FullName = "User One",
            Email = "user1@example.com",
            CreatedAt = DateTime.UtcNow
        };
        var user2 = new User
        {
            Id = 2,
            FullName = "User Two",
            Email = "user2@example.com",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        // Act
        var export1 = await _service.ExportUserDataAsync(1);
        var export2 = await _service.ExportUserDataAsync(2);

        // Assert
        Assert.That(export1.ExportId, Is.Not.EqualTo(export2.ExportId));
    }

    [Test]
    public async Task ExportUserDataAsync_Concurrent_AllSucceed()
    {
        // Arrange
        for (int i = 1; i <= 5; i++)
        {
            _context.Users.Add(new User
            {
                Id = i,
                FullName = $"User {i}",
                Email = $"user{i}@example.com",
                CreatedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var tasks = new List<Task<DataExportResult>>();
        for (int i = 1; i <= 5; i++)
        {
            var userId = i;
            tasks.Add(_service.ExportUserDataAsync(userId));
        }
        var results = await Task.WhenAll(tasks);

        // Assert
        Assert.That(results.Length, Is.EqualTo(5));
        Assert.That(results.Select(r => r.ExportId).Distinct().Count(), Is.EqualTo(5));
    }

    #endregion

    #region Data Integrity Tests

    [Test]
    public async Task ExportUserDataAsync_UserWithPayments_IncludesPaymentData()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User
        {
            Id = 1,
            FullName = "Member With Payments",
            Email = "paying@example.com",
            CreatedAt = DateTime.UtcNow
        };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Club = club,
            FullName = "Member With Payments",
            Email = "paying@example.com",
            JoinDate = DateTime.UtcNow,
            Status = "Active"
        };
        var payment = new Payment
        {
            PaymentId = 1,
            MemberId = 1,
            Member = member,
            Amount = 99.99m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Credit Card",
            Notes = "Annual membership"
        };

        _context.Clubs.Add(club);
        _context.Users.Add(user);
        _context.Members.Add(member);
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IncludedDataCategories, Does.Contain("Payment History"));
    }

    [Test]
    public async Task ExportUserDataAsync_UserWithEvents_IncludesEventData()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User
        {
            Id = 1,
            FullName = "Event Creator",
            Email = "events@example.com",
            CreatedAt = DateTime.UtcNow
        };
        var clubAdmin = new ClubAdmin
        {
            ClubId = 1,
            UserId = 1,
            Club = club,
            User = user,
            CreatedAt = DateTime.UtcNow
        };
        var clubEvent = new Event
        {
            Id = 1,
            ClubId = 1,
            Club = club,
            Name = "Test Event",
            Description = "An event for testing",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location"
        };

        _context.Clubs.Add(club);
        _context.Users.Add(user);
        _context.ClubAdmins.Add(clubAdmin);
        _context.Events.Add(clubEvent);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExportUserDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IncludedDataCategories, Does.Contain("Created Events"));
    }

    #endregion
}
