using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class DashboardServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<ILogger<DashboardService>> _mockLogger;
    private DashboardService _dashboardService;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<DashboardService>>();

        // Create a real MemoryCache for testing instead of mocking
        var mockCache = new Microsoft.Extensions.Caching.Memory.MemoryCache(new Microsoft.Extensions.Caching.Memory.MemoryCacheOptions());
        _dashboardService = new DashboardService(_context, _mockLogger.Object, mockCache);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<Club> CreateTestClubAsync(string tier = "Sprout")
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = tier,
            CreatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    private async Task<MembershipType> CreateTestMembershipTypeAsync(int clubId)
    {
        var membershipType = new MembershipType
        {
            ClubId = clubId,
            Name = "Regular",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();
        return membershipType;
    }

    private async Task<Member> CreateTestMemberAsync(int clubId, int membershipTypeId, DateTime? joinDate = null)
    {
        var member = new Member
        {
            ClubId = clubId,
            MembershipTypeId = membershipTypeId,
            FullName = "Test Member",
            Email = $"member{Guid.NewGuid()}@test.com",
            Status = "Active",
            JoinDate = joinDate ?? DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithSproutTier_ReturnsCorrectSummary()
    {
        // Arrange
        var club = await CreateTestClubAsync("Sprout");
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);

        // Create 3 active members
        await CreateTestMemberAsync(club.Id, membershipType.Id);
        await CreateTestMemberAsync(club.Id, membershipType.Id);
        await CreateTestMemberAsync(club.Id, membershipType.Id);

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.CurrentTier, Is.EqualTo("Sprout"));
        Assert.That(result.MemberCount, Is.EqualTo(3));
        Assert.That(result.MemberLimit, Is.EqualTo(50));
        Assert.That(result.DuesCollectedYTD, Is.EqualTo(0.00m)); // No payments yet
        Assert.That(result.UpcomingEventCount, Is.EqualTo(0)); // No events yet
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithSeedTier_Returns100MemberLimit()
    {
        // Arrange
        var club = await CreateTestClubAsync("Seed");
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);
        await CreateTestMemberAsync(club.Id, membershipType.Id);

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.CurrentTier, Is.EqualTo("Seed"));
        Assert.That(result.MemberLimit, Is.EqualTo(100));
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithGrowTier_ReturnsCorrectMemberLimit()
    {
        // Arrange
        var club = await CreateTestClubAsync("Grow");
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);

        // Create 5 active members
        for (int i = 0; i < 5; i++)
        {
            await CreateTestMemberAsync(club.Id, membershipType.Id);
        }

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.CurrentTier, Is.EqualTo("Grow"));
        Assert.That(result.MemberCount, Is.EqualTo(5));
        Assert.That(result.MemberLimit, Is.EqualTo(200));
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithUnknownTier_UsesDefaultSproutLimit()
    {
        // Arrange
        var club = await CreateTestClubAsync("Unknown");
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);
        await CreateTestMemberAsync(club.Id, membershipType.Id);

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.CurrentTier, Is.EqualTo("Unknown"));
        Assert.That(result.MemberLimit, Is.EqualTo(50)); // Default to Sprout limit
    }

    [Test]
    public async Task GetDashboardSummaryAsync_OnlyCountsActiveMembers()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);

        // Create active and inactive members
        var activeMember = await CreateTestMemberAsync(club.Id, membershipType.Id);
        var inactiveMember = await CreateTestMemberAsync(club.Id, membershipType.Id);

        // Make one member inactive
        inactiveMember.Status = "Inactive";
        await _context.SaveChangesAsync();

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.MemberCount, Is.EqualTo(1)); // Only active member counted
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithNoMembers_ReturnsZeroCount()
    {
        // Arrange
        var club = await CreateTestClubAsync();

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.MemberCount, Is.EqualTo(0));
        Assert.That(result.DuesCollectedYTD, Is.EqualTo(0.00m));
        Assert.That(result.UpcomingEventCount, Is.EqualTo(0));
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithNonExistentClub_ThrowsInvalidOperationException()
    {
        // Arrange
        int nonExistentClubId = 999;

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _dashboardService.GetDashboardSummaryAsync(nonExistentClubId));

        Assert.That(ex.Message, Does.Contain("Club with ID").And.Contain("not found"));
    }

    [Test]
    public async Task GetDashboardSummaryAsync_PerformanceTest_ExecutesQueriesInParallel()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);

        // Create multiple members to test performance
        for (int i = 0; i < 10; i++)
        {
            await CreateTestMemberAsync(club.Id, membershipType.Id);
        }

        // Act - This should complete quickly due to parallel execution
        var startTime = DateTime.UtcNow;
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);
        var duration = DateTime.UtcNow - startTime;

        // Assert
        Assert.That(result.MemberCount, Is.EqualTo(10));
        Assert.That(duration.TotalSeconds, Is.LessThan(1)); // Should be very fast
    }

    [Test]
    public async Task GetDashboardSummaryAsync_ValidatesClubExists()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var validClubId = club.Id;

        // Delete the club to simulate it not existing
        _context.Clubs.Remove(club);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _dashboardService.GetDashboardSummaryAsync(validClubId));

        Assert.That(ex.Message, Does.Contain("Club with ID").And.Contain("not found"));
    }

    [Test]
    public async Task GetDashboardSummaryAsync_LogsQueryExecution()
    {
        // Arrange
        var club = await CreateTestClubAsync();

        // Act
        await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert - Verify that appropriate logging occurred
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting dashboard summary")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetDashboardSummaryAsync_HandlesLargeMemberCount()
    {
        // Arrange
        var club = await CreateTestClubAsync("Grow");
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);

        // Create a large number of members (close to Grow limit)
        for (int i = 0; i < 150; i++)
        {
            await CreateTestMemberAsync(club.Id, membershipType.Id);
        }

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.MemberCount, Is.EqualTo(150));
        Assert.That(result.MemberLimit, Is.EqualTo(200));
        Assert.That(result.CurrentTier, Is.EqualTo("Grow"));
    }

    [Test]
    public async Task GetDashboardSummaryAsync_CalculatesDuesFromPayments()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);
        var member = await CreateTestMemberAsync(club.Id, membershipType.Id);

        // Add payments from this year
        var currentYear = DateTime.UtcNow.Year;
        var payment1 = new Payment
        {
            MemberId = member.Id,
            ClubId = club.Id,
            Amount = 50.00m,
            PaymentDate = new DateTime(currentYear, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "Cash",
            CreatedAt = DateTime.UtcNow
        };
        var payment2 = new Payment
        {
            MemberId = member.Id,
            ClubId = club.Id,
            Amount = 25.00m,
            PaymentDate = new DateTime(currentYear, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "Check",
            CreatedAt = DateTime.UtcNow
        };

        // Add payment from last year (should not be counted)
        var lastYearPayment = new Payment
        {
            MemberId = member.Id,
            ClubId = club.Id,
            Amount = 100.00m,
            PaymentDate = new DateTime(currentYear - 1, 12, 1, 0, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "Cash",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.AddRange(payment1, payment2, lastYearPayment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.DuesCollectedYTD, Is.EqualTo(75.00m)); // Only this year's payments
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithMultipleClubs_OnlyCountsCorrectClubPayments()
    {
        // Arrange
        var club1 = await CreateTestClubAsync("Sprout");
        var club2 = await CreateTestClubAsync("Grow");
        var membershipType1 = await CreateTestMembershipTypeAsync(club1.Id);
        var membershipType2 = await CreateTestMembershipTypeAsync(club2.Id);
        var member1 = await CreateTestMemberAsync(club1.Id, membershipType1.Id);
        var member2 = await CreateTestMemberAsync(club2.Id, membershipType2.Id);

        // Add payments for both clubs
        var currentYear = DateTime.UtcNow.Year;
        var payment1 = new Payment
        {
            MemberId = member1.Id,
            ClubId = club1.Id,
            Amount = 100.00m,
            PaymentDate = new DateTime(currentYear, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "Cash",
            CreatedAt = DateTime.UtcNow
        };
        var payment2 = new Payment
        {
            MemberId = member2.Id,
            ClubId = club2.Id,
            Amount = 200.00m,
            PaymentDate = new DateTime(currentYear, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "Cash",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.AddRange(payment1, payment2);
        await _context.SaveChangesAsync();

        // Act
        var result1 = await _dashboardService.GetDashboardSummaryAsync(club1.Id);
        var result2 = await _dashboardService.GetDashboardSummaryAsync(club2.Id);

        // Assert
        Assert.That(result1.DuesCollectedYTD, Is.EqualTo(100.00m)); // Only club1's payments
        Assert.That(result2.DuesCollectedYTD, Is.EqualTo(200.00m)); // Only club2's payments
    }

    [Test]
    public async Task GetDashboardSummaryAsync_WithUnlimitedTier_ReturnsExpandMemberLimit()
    {
        // Arrange
        var club = await CreateTestClubAsync("Unlimited");

        // Act
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert
        Assert.That(result.CurrentTier, Is.EqualTo("Unlimited"));
        Assert.That(result.MemberLimit, Is.EqualTo(2000));
    }

    /// <summary>
    /// Regression test for NEW-001: Dashboard crashes with "Cannot write DateTime with Kind=Unspecified
    /// to PostgreSQL type 'timestamp with time zone'" (Npgsql 6+).
    /// The year-boundary dates (startOfYear, startOfNextYear) must be DateTimeKind.Utc.
    /// </summary>
    [Test]
    public async Task GetDashboardSummaryAsync_WithYtdPayments_DateRangeFilterUsesUtcDates()
    {
        // Arrange
        var club = await CreateTestClubAsync("Grow");
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);
        var member = await CreateTestMemberAsync(club.Id, membershipType.Id);
        var currentYear = DateTime.UtcNow.Year;

        // Payment exactly at start of year boundary
        var yearStartPayment = new Payment
        {
            MemberId = member.Id,
            ClubId = club.Id,
            Amount = 10.00m,
            PaymentDate = new DateTime(currentYear, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "Cash",
            CreatedAt = DateTime.UtcNow
        };
        // Payment one day before year start (should be excluded)
        var priorYearPayment = new Payment
        {
            MemberId = member.Id,
            ClubId = club.Id,
            Amount = 999.00m,
            PaymentDate = new DateTime(currentYear - 1, 12, 31, 23, 59, 59, DateTimeKind.Utc),
            PaymentMethod = "Cash",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.AddRange(yearStartPayment, priorYearPayment);
        await _context.SaveChangesAsync();

        // Act — verifies no Npgsql "Kind=Unspecified" exception is thrown
        var result = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert — only current-year payment is included
        Assert.That(result.DuesCollectedYTD, Is.EqualTo(10.00m));
    }

    [Test]
    public async Task GetDashboardSummaryAsync_ReturnsConsistentResults()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var membershipType = await CreateTestMembershipTypeAsync(club.Id);
        await CreateTestMemberAsync(club.Id, membershipType.Id);

        // Act - Call multiple times
        var result1 = await _dashboardService.GetDashboardSummaryAsync(club.Id);
        var result2 = await _dashboardService.GetDashboardSummaryAsync(club.Id);

        // Assert - Results should be identical
        Assert.That(result1.CurrentTier, Is.EqualTo(result2.CurrentTier));
        Assert.That(result1.MemberCount, Is.EqualTo(result2.MemberCount));
        Assert.That(result1.MemberLimit, Is.EqualTo(result2.MemberLimit));
        Assert.That(result1.DuesCollectedYTD, Is.EqualTo(result2.DuesCollectedYTD));
        Assert.That(result1.UpcomingEventCount, Is.EqualTo(result2.UpcomingEventCount));
    }
}
