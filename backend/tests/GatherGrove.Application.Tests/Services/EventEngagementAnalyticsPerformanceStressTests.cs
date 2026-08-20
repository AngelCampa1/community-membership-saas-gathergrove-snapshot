using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using System.Diagnostics;
using System.Collections.Concurrent;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Stress and Performance Tests for Event Engagement Analytics
/// Tests system behavior under heavy load, large datasets, and extreme conditions
/// Following TDD principles with focus on non-functional requirements
/// </summary>
[TestFixture]
[Category("Performance")]
[Category("Stress")]
public class EventEngagementAnalyticsPerformanceStressTests : IDisposable
{
    private GatherGroveDbContext _context;
    private Mock<GatherGrove.Infrastructure.Services.IClubTierService> _mockClubTierService;
    private Mock<ILogger<EventEngagementAnalyticsService>> _mockLogger;
    private EventEngagementAnalyticsService _service;
    private const int LARGE_DATASET_SIZE = 1000; // Reduced for test performance
    private const int STRESS_TEST_ITERATIONS = 100; // Reduced for test performance

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockClubTierService = new Mock<GatherGrove.Infrastructure.Services.IClubTierService>();
        _mockLogger = new Mock<ILogger<EventEngagementAnalyticsService>>();

        _service = new EventEngagementAnalyticsService(
            _context,
            _mockLogger.Object,
            _mockClubTierService.Object
        );

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
    }

    /// <summary>
    /// RED Phase: Test should fail if large dataset processing exceeds time limits
    /// Performance requirement: Process 1000+ events within 15 seconds
    /// </summary>
    [Test, Timeout(30000)] // 30 second timeout
    public async Task GetEventEngagementAnalytics_LargeDataset_ProcessesWithinTimeLimit()
    {
        // Arrange
        await SeedLargeDataset(LARGE_DATASET_SIZE);
        var clubId = 1;
        var userId = 1;
        var startDate = DateTime.UtcNow.AddYears(-2);
        var endDate = DateTime.UtcNow;

        var stopwatch = Stopwatch.StartNew();

        // Act
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };

        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
        stopwatch.Stop();

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventMetrics, Is.Not.Null);
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(15000),
            $"Large dataset processing took {stopwatch.ElapsedMilliseconds}ms, exceeding 15 second limit");

        TestContext.WriteLine($"Processed {LARGE_DATASET_SIZE} events in {stopwatch.ElapsedMilliseconds}ms");
        TestContext.WriteLine($"Average time per event: {(double)stopwatch.ElapsedMilliseconds / LARGE_DATASET_SIZE:F2}ms");
    }

    /// <summary>
    /// RED Phase: Test should fail if memory usage grows unbounded with large datasets
    /// Memory requirement: Stay under 100MB for 1000 events
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalytics_LargeDataset_MemoryUsageControlled()
    {
        // Arrange
        await SeedLargeDataset(LARGE_DATASET_SIZE);
        var clubId = 1;
        var userId = 1;

        var initialMemory = GC.GetTotalMemory(false);

        // Act
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = DateTime.UtcNow.AddYears(-2),
            EndDate = DateTime.UtcNow
        };

        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);

        // Force garbage collection to get accurate memory reading
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();

        var finalMemory = GC.GetTotalMemory(false);
        var memoryUsed = finalMemory - initialMemory;

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(memoryUsed, Is.LessThan(100 * 1024 * 1024),
            $"Memory usage {memoryUsed / 1024 / 1024:F2}MB exceeds 100MB limit");

        TestContext.WriteLine($"Memory used: {memoryUsed / 1024 / 1024:F2}MB for {LARGE_DATASET_SIZE} events");
    }

    /// <summary>
    /// RED Phase: Test should fail if concurrent requests cause performance degradation
    /// Concurrency requirement: Handle 20 concurrent requests without significant slowdown
    /// </summary>
    [Test, Timeout(60000)] // 60 second timeout
    public async Task GetEventEngagementAnalytics_ConcurrentLoad_MaintainsPerformance()
    {
        // Arrange
        await SeedMediumDataset(500); // Medium dataset for concurrent testing
        var clubId = 1;
        var userId = 1;
        var concurrentRequests = 20;

        var results = new ConcurrentBag<(long elapsedMs, GatherGrove.Application.DTOs.EventEngagementAnalyticsReportDto result)>();
        var exceptions = new ConcurrentBag<Exception>();

        // Act - Execute concurrent requests
        var overallStopwatch = Stopwatch.StartNew();

        var tasks = Enumerable.Range(0, concurrentRequests).Select(async i =>
        {
            try
            {
                var requestStopwatch = Stopwatch.StartNew();

                var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
                {
                    ClubId = clubId,
                    StartDate = DateTime.UtcNow.AddDays(-60),
                    EndDate = DateTime.UtcNow
                };

                var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
                requestStopwatch.Stop();

                results.Add((requestStopwatch.ElapsedMilliseconds, result));
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
            }
        });

        await Task.WhenAll(tasks);
        overallStopwatch.Stop();

        // Assert
        Assert.That(exceptions, Is.Empty, $"Concurrent requests caused {exceptions.Count} exceptions");
        Assert.That(results.Count, Is.EqualTo(concurrentRequests));

        var averageResponseTime = results.Average(r => r.elapsedMs);
        var maxResponseTime = results.Max(r => r.elapsedMs);

        Assert.That(averageResponseTime, Is.LessThan(10000), // Less than 10 seconds average
            $"Average response time {averageResponseTime}ms exceeds 10 second limit");
        Assert.That(maxResponseTime, Is.LessThan(20000), // Less than 20 seconds max
            $"Maximum response time {maxResponseTime}ms exceeds 20 second limit");

        TestContext.WriteLine($"Concurrent requests: {concurrentRequests}");
        TestContext.WriteLine($"Total time: {overallStopwatch.ElapsedMilliseconds}ms");
        TestContext.WriteLine($"Average response time: {averageResponseTime:F2}ms");
        TestContext.WriteLine($"Max response time: {maxResponseTime}ms");
    }

    /// <summary>
    /// RED Phase: Test should fail if repeated requests cause memory leaks
    /// Stability requirement: No memory leaks over extended usage
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalytics_RepeatedRequests_NoMemoryLeaks()
    {
        // Arrange
        await SeedMediumDataset(200);
        var clubId = 1;
        var userId = 1;
        var iterations = STRESS_TEST_ITERATIONS;

        var initialMemory = GC.GetTotalMemory(false);
        var memoryReadings = new List<long>();

        // Act - Make repeated requests with periodic memory checks
        for (int i = 0; i < iterations; i++)
        {
            var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
            {
                ClubId = clubId,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow
            };

            var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
            Assert.That(result, Is.Not.Null);

            // Take memory reading every 10 iterations
            if (i % 10 == 0)
            {
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
                memoryReadings.Add(GC.GetTotalMemory(false));
            }
        }

        var finalMemory = GC.GetTotalMemory(false);

        // Assert - Check for memory growth trend
        var memoryGrowth = finalMemory - initialMemory;
        var maxAcceptableGrowth = 50 * 1024 * 1024; // 50MB

        Assert.That(memoryGrowth, Is.LessThan(maxAcceptableGrowth),
            $"Memory grew by {memoryGrowth / 1024 / 1024:F2}MB over {iterations} iterations, indicating memory leak");

        // Check memory growth trend
        if (memoryReadings.Count > 2)
        {
            var firstHalf = memoryReadings.Take(memoryReadings.Count / 2).Average();
            var secondHalf = memoryReadings.Skip(memoryReadings.Count / 2).Average();
            var growthTrend = (secondHalf - firstHalf) / firstHalf * 100;

            Assert.That(growthTrend, Is.LessThan(50), // Less than 50% growth trend
                $"Memory shows {growthTrend:F2}% growth trend, indicating potential leak");
        }

        TestContext.WriteLine($"Total memory growth: {memoryGrowth / 1024 / 1024:F2}MB");
        TestContext.WriteLine($"Memory readings: {string.Join(", ", memoryReadings.Select(m => $"{m / 1024 / 1024:F1}MB"))}");
    }

    /// <summary>
    /// RED Phase: Test should fail if system doesn't handle extreme date ranges efficiently
    /// Edge case: Very large date ranges (multiple years of data)
    /// </summary>
    [Test, Timeout(20000)] // 20 second timeout
    public async Task GetEventEngagementAnalytics_ExtremeDateRange_HandlesEfficiently()
    {
        // Arrange
        await SeedHistoricalDataset(300, 5); // 300 events over 5 years
        var clubId = 1;
        var userId = 1;
        var startDate = DateTime.UtcNow.AddYears(-5);
        var endDate = DateTime.UtcNow;

        var stopwatch = Stopwatch.StartNew();

        // Act
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };

        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
        stopwatch.Stop();

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(15000),
            $"Extreme date range processing took {stopwatch.ElapsedMilliseconds}ms, exceeding 15 second limit");

        TestContext.WriteLine($"Processed {(endDate - startDate).TotalDays:F0} days of data in {stopwatch.ElapsedMilliseconds}ms");
    }

    /// <summary>
    /// RED Phase: Test should fail if system can't handle high-frequency requests
    /// Load test: Rapid consecutive requests
    /// </summary>
    [Test, Timeout(30000)] // 30 second timeout
    public async Task GetEventEngagementAnalytics_HighFrequencyRequests_HandlesLoad()
    {
        // Arrange
        await SeedMediumDataset(100);
        var clubId = 1;
        var userId = 1;
        var requestCount = 50; // 50 rapid requests
        var results = new List<(long responseTime, bool success)>();

        // Act - Fire requests as fast as possible
        var overallStopwatch = Stopwatch.StartNew();

        for (int i = 0; i < requestCount; i++)
        {
            var requestStopwatch = Stopwatch.StartNew();
            try
            {
                var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
                {
                    ClubId = clubId,
                    StartDate = DateTime.UtcNow.AddDays(-30),
                    EndDate = DateTime.UtcNow
                };

                var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
                requestStopwatch.Stop();

                results.Add((requestStopwatch.ElapsedMilliseconds, true));
                Assert.That(result, Is.Not.Null);
            }
            catch (Exception)
            {
                requestStopwatch.Stop();
                results.Add((requestStopwatch.ElapsedMilliseconds, false));
            }
        }

        overallStopwatch.Stop();

        // Assert
        var successRate = results.Count(r => r.success) / (double)requestCount * 100;
        var averageResponseTime = results.Where(r => r.success).Average(r => r.responseTime);

        Assert.That(successRate, Is.GreaterThan(95), // 95% success rate
            $"Success rate {successRate:F2}% is below 95% threshold");
        Assert.That(averageResponseTime, Is.LessThan(5000), // Less than 5 seconds average
            $"Average response time {averageResponseTime:F2}ms exceeds 5 second limit");

        TestContext.WriteLine($"High-frequency test: {requestCount} requests in {overallStopwatch.ElapsedMilliseconds}ms");
        TestContext.WriteLine($"Success rate: {successRate:F2}%");
        TestContext.WriteLine($"Average response time: {averageResponseTime:F2}ms");
        TestContext.WriteLine($"Requests per second: {requestCount / (overallStopwatch.ElapsedMilliseconds / 1000.0):F2}");
    }

    #region Data Seeding Methods

    private async Task SeedLargeDataset(int eventCount)
    {
        var club = new Club
        {
            Id = 1,
            Name = "Large Dataset Club",
            Tier = "Unlimited",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddYears(-2),
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Performance",
            DuesAmount = 100m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);

        // Create large number of events
        var events = new List<Event>();
        for (int i = 1; i <= eventCount; i++)
        {
            events.Add(new Event
            {
                Id = i,
                ClubId = 1,
                Name = $"Performance Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 700)),
                Location = $"Location {i % 20}",
                Description = $"Large dataset performance test event {i}",
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 700)),
                UpdatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 700))
            });
        }

        _context.Events.AddRange(events);
        await _context.SaveChangesAsync();
    }

    private async Task SeedMediumDataset(int eventCount)
    {
        var club = new Club
        {
            Id = 1,
            Name = "Medium Dataset Club",
            Tier = "Unlimited",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Medium",
            DuesAmount = 75m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);

        // Create events with some RSVPs and attendance
        var events = new List<Event>();
        var rsvps = new List<EventRsvp>();
        var attendances = new List<EventAttendance>();
        var members = new List<Member>();

        // Create some members first
        for (int i = 1; i <= 20; i++)
        {
            members.Add(new Member
            {
                Id = i,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = $"Member {i}",
                Email = $"member{i}@test.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(30, 180)),
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(30, 180)),
                UpdatedAt = DateTime.UtcNow
            });
        }

        for (int i = 1; i <= eventCount; i++)
        {
            var eventDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 180));
            events.Add(new Event
            {
                Id = i,
                ClubId = 1,
                Name = $"Medium Event {i}",
                EventDateTime = eventDate,
                Location = $"Location {i % 10}",
                Description = $"Medium dataset event {i}",
                CreatedAt = eventDate.AddDays(-1),
                UpdatedAt = eventDate.AddDays(-1)
            });

            // Add some RSVPs and attendance
            var membersToRsvp = Random.Shared.Next(5, 15);
            for (int j = 1; j <= membersToRsvp; j++)
            {
                if (j <= 20) // Don't exceed member count
                {
                    rsvps.Add(new EventRsvp
                    {
                        EventId = i,
                        MemberId = j,
                        RsvpStatus = "Attending",
                        CreatedAt = eventDate.AddDays(-2),
                        UpdatedAt = eventDate.AddDays(-2)
                    });

                    if (Random.Shared.Next(0, 10) > 2) // 70% attendance rate
                    {
                        attendances.Add(new EventAttendance
                        {
                            EventId = i,
                            MemberId = j,
                            AttendedAt = eventDate,
                            CreatedAt = eventDate
                        });
                    }
                }
            }
        }

        _context.Members.AddRange(members);
        _context.Events.AddRange(events);
        _context.EventRsvps.AddRange(rsvps);
        _context.EventAttendances.AddRange(attendances);
        await _context.SaveChangesAsync();
    }

    private async Task SeedHistoricalDataset(int eventCount, int yearsBack)
    {
        var club = new Club
        {
            Id = 1,
            Name = "Historical Dataset Club",
            Tier = "Unlimited",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddYears(-yearsBack),
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Historical",
            DuesAmount = 50m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);

        // Create events spread across multiple years
        var events = new List<Event>();
        var totalDays = yearsBack * 365;

        for (int i = 1; i <= eventCount; i++)
        {
            var daysBack = Random.Shared.Next(1, totalDays);
            events.Add(new Event
            {
                Id = i,
                ClubId = 1,
                Name = $"Historical Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(-daysBack),
                Location = $"Historical Location {i % 5}",
                Description = $"Historical event {i} from {DateTime.UtcNow.AddDays(-daysBack):yyyy}",
                CreatedAt = DateTime.UtcNow.AddDays(-daysBack - 1),
                UpdatedAt = DateTime.UtcNow.AddDays(-daysBack - 1)
            });
        }

        _context.Events.AddRange(events);
        await _context.SaveChangesAsync();
    }

    #endregion

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}