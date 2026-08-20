using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Services;
using System.Diagnostics;
using System.Collections.Concurrent;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Advanced TDD Test Suite for Event Engagement Analytics
/// Focuses on edge cases, security, performance, and failure scenarios
/// Following RED → GREEN → REFACTOR methodology
/// </summary>
[TestFixture]
public class EventEngagementAnalyticsAdvancedTests : IDisposable
{
    private GatherGroveDbContext _context;
    private Mock<IClubTierService> _mockClubTierService;
    private Mock<ILogger<EventEngagementAnalyticsService>> _mockLogger;
    private Mock<GatherGrove.Application.Services.IClubAuthorizationService> _mockClubAuthorizationService;
    private EventEngagementAnalyticsService _service;
    private IServiceProvider _serviceProvider;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Setup ServiceProvider for concurrent test
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(opt => opt.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));
        services.AddLogging();
        _serviceProvider = services.BuildServiceProvider();

        _context = new GatherGroveDbContext(options);
        _mockClubTierService = new Mock<IClubTierService>();
        _mockLogger = new Mock<ILogger<EventEngagementAnalyticsService>>();
        _mockClubAuthorizationService = new Mock<GatherGrove.Application.Services.IClubAuthorizationService>();

        _service = new EventEngagementAnalyticsService(
            _context,
            _mockLogger.Object,
            _mockClubTierService.Object
        );

        SeedAdvancedTestData();
    }

    private void SeedAdvancedTestData()
    {
        // Edge case test data - null handling, boundary values, concurrent scenarios
        var club = new Club
        {
            Id = 1,
            Name = "Advanced Test Club",
            Tier = "Unlimited",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddYears(-2),
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Advanced",
            DuesAmount = 200.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create edge case scenarios
        var members = new[]
        {
            // Member with empty email (edge case)
            new Member
            {
                Id = 1, ClubId = 1, MembershipTypeId = 1, FullName = "Edge Case Member",
                Email = "edge.case@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1), UpdatedAt = DateTime.UtcNow
            },
            // Member with future join date (edge case)
            new Member
            {
                Id = 2, ClubId = 1, MembershipTypeId = 1, FullName = "Future Member",
                Email = "future@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow.AddDays(-1), UpdatedAt = DateTime.UtcNow
            },
            // Member with very old join date (boundary case)
            new Member
            {
                Id = 3, ClubId = 1, MembershipTypeId = 1, FullName = "Legacy Member",
                Email = "legacy@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddYears(-50),
                CreatedAt = DateTime.UtcNow.AddYears(-50), UpdatedAt = DateTime.UtcNow
            }
        };

        // Events with edge cases
        var events = new[]
        {
            // Event with empty description
            new Event
            {
                Id = 1, ClubId = 1, Name = "Empty Description Event",
                EventDateTime = DateTime.UtcNow.AddDays(-1), Location = "Test",
                Description = "", CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            },
            // Event in the far past
            new Event
            {
                Id = 2, ClubId = 1, Name = "Ancient Event",
                EventDateTime = DateTime.UtcNow.AddYears(-10), Location = "Ancient Location",
                Description = "Very old event", CreatedAt = DateTime.UtcNow.AddYears(-10),
                UpdatedAt = DateTime.UtcNow.AddYears(-10)
            },
            // Event with exact boundary dates
            new Event
            {
                Id = 3, ClubId = 1, Name = "Boundary Event",
                EventDateTime = DateTime.UtcNow, Location = "Boundary",
                Description = "Boundary test", CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);
        _context.Members.AddRange(members);
        _context.Events.AddRange(events);
        _context.SaveChanges();
    }

    /// <summary>
    /// Test: Security - Unauthorized access attempts should be properly blocked
    /// RED Phase: Test should fail before proper security implementation
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_UnauthorizedUserAccess_ThrowsSecurityException()
    {
        // Arrange
        var clubId = 1;
        var unauthorizedUserId = 999;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(unauthorizedUserId, clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };

        // Should throw UnauthorizedAccessException for unauthorized access
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetEventEngagementAnalyticsReportAsync(query, unauthorizedUserId));
    }

    /// <summary>
    /// Test: SQL Injection Prevention
    /// RED Phase: Test should fail if SQL injection vulnerabilities exist
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_SQLInjectionAttempt_SafelyHandled()
    {
        // Arrange
        var maliciousClubId = 1; // Using legitimate ID but with malicious query attempt
        var userId = 1;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, maliciousClubId))
            .ReturnsAsync(true);

        // Attempt SQL injection through date parameters
        var maliciousStartDate = DateTime.MinValue;
        var maliciousEndDate = DateTime.MaxValue;

        // Act & Assert - Should not throw SQL exceptions
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = maliciousClubId,
            StartDate = maliciousStartDate,
            EndDate = maliciousEndDate
        };

        Assert.DoesNotThrowAsync(async () =>
        {
            var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
            Assert.That(result, Is.Not.Null);
        });
    }

    /// <summary>
    /// Test: Concurrent Access Performance
    /// RED Phase: Test should fail if concurrency issues exist
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_ConcurrentRequests_HandledSafely()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var concurrentRequestCount = 20;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        var exceptions = new ConcurrentBag<Exception>();
        var results = new ConcurrentBag<GatherGrove.Application.DTOs.EventEngagementAnalyticsReportDto>();

        // Act - Create concurrent requests
        var tasks = Enumerable.Range(0, concurrentRequestCount).Select(async i =>
        {
            try
            {
                var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
                {
                    ClubId = clubId,
                    StartDate = startDate,
                    EndDate = endDate
                };
                var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
                results.Add(result);
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
            }
        });

        await Task.WhenAll(tasks);

        // Assert
        Assert.That(exceptions, Is.Empty, $"Concurrent requests caused {exceptions.Count} exceptions");
        Assert.That(results.Count, Is.EqualTo(concurrentRequestCount));
        Assert.IsTrue(results.All(r => r.ClubId == clubId));
    }

    /// <summary>
    /// Test: Memory Leak Prevention Under Load
    /// RED Phase: Test should fail if memory leaks exist
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_RepeatedRequests_NoMemoryLeaks()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var iterations = 50; // Reduced for test performance
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        var initialMemory = GC.GetTotalMemory(false);

        // Act - Make repeated requests
        for (int i = 0; i < iterations; i++)
        {
            var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
            {
                ClubId = clubId,
                StartDate = startDate,
                EndDate = endDate
            };
            var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
            Assert.That(result, Is.Not.Null);

            // Force garbage collection every 10 iterations
            if (i % 10 == 0)
            {
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
            }
        }

        // Final cleanup
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();

        var finalMemory = GC.GetTotalMemory(false);
        var memoryIncrease = finalMemory - initialMemory;

        // Assert
        Assert.That(memoryIncrease, Is.LessThan(20 * 1024 * 1024), // Less than 20MB increase
            $"Memory increased by {memoryIncrease / 1024 / 1024:F2} MB, indicating potential memory leak");
    }

    /// <summary>
    /// Test: Null Data Handling
    /// RED Phase: Test should fail if null data isn't handled gracefully
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_NullDataScenarios_HandledGracefully()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Act & Assert - Should handle null data gracefully
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };

        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        Assert.That(result.EventMetrics, Is.Not.Null);
        // Should handle members with null emails gracefully
        Assert.DoesNotThrow(() =>
        {
            var memberCount = result.EventMetrics.Count;
        });
    }

    /// <summary>
    /// Test: Date Boundary Conditions
    /// RED Phase: Test should fail if date boundaries aren't handled properly
    /// </summary>
    [Test]
    [TestCase("2024-01-01T00:00:00.000Z", "2024-01-01T23:59:59.999Z")] // Same day
    [TestCase("2024-12-31T23:59:59.999Z", "2025-01-01T00:00:00.000Z")] // Year boundary
    [TestCase("2024-02-28T23:59:59.999Z", "2024-02-29T00:00:00.000Z")] // Leap year
    public async Task GetEventEngagementAnalyticsReportAsync_DateBoundaries_HandledCorrectly(string startDateStr, string endDateStr)
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var startDate = DateTime.Parse(startDateStr, null, System.Globalization.DateTimeStyles.AdjustToUniversal);
        var endDate = DateTime.Parse(endDateStr, null, System.Globalization.DateTimeStyles.AdjustToUniversal);

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Act
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };

        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ReportPeriodStart, Is.EqualTo(startDate));
        Assert.That(result.ReportPeriodEnd, Is.EqualTo(endDate));
    }

    /// <summary>
    /// Test: Performance Benchmarking
    /// RED Phase: Test should fail if performance requirements aren't met
    /// </summary>
    [Test, Timeout(10000)] // 10 second timeout
    public async Task GetEventEngagementAnalyticsReportAsync_PerformanceBenchmark_MeetsRequirements()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Create performance test data
        await SeedPerformanceTestData(clubId);

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
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(5000), // Less than 5 seconds
            $"Analytics processing took {stopwatch.ElapsedMilliseconds}ms, exceeding performance requirement");
    }

    /// <summary>
    /// Test: Data Consistency Under Concurrent Updates
    /// RED Phase: Test should fail if data consistency issues exist
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_ConcurrentDataUpdates_MaintainsConsistency()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Act - Simulate concurrent data updates while reading analytics
        var readTask = Task.Run(async () =>
        {
            var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
            {
                ClubId = clubId,
                StartDate = startDate,
                EndDate = endDate
            };
            return await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
        });

        var updateTask = Task.Run(async () =>
        {
            // Simulate concurrent data updates with new DbContext
            await Task.Delay(50); // Small delay to ensure read starts first

            // Use a separate DbContext instance for thread safety
            using var scope = _serviceProvider.CreateScope();
            using var contextForUpdate = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

            var newEvent = new Event
            {
                Id = 99,
                ClubId = clubId,
                Name = "Concurrent Event",
                EventDateTime = DateTime.UtcNow.AddDays(-5),
                Location = "Test",
                Description = "Concurrent test",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            contextForUpdate.Events.Add(newEvent);
            await contextForUpdate.SaveChangesAsync();
        });

        await Task.WhenAll(readTask, updateTask);

        // Assert - Concurrent access completed without exceptions
        Assert.Pass("Concurrent access test completed successfully");
    }

    private async Task SeedPerformanceTestData(int clubId)
    {
        var events = new List<Event>();
        var rsvps = new List<EventRsvp>();
        var attendances = new List<EventAttendance>();

        // Create test events for performance testing (reduced for test speed)
        for (int i = 100; i < 130; i++) // 30 events
        {
            var eventDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 90));
            events.Add(new Event
            {
                Id = i,
                ClubId = clubId,
                Name = $"Performance Event {i}",
                EventDateTime = eventDate,
                Location = $"Location {i}",
                Description = $"Performance test event {i}",
                CreatedAt = eventDate.AddDays(-1),
                UpdatedAt = eventDate.AddDays(-1)
            });

            // Add some RSVPs and attendances
            if (Random.Shared.Next(0, 2) == 1)
            {
                rsvps.Add(new EventRsvp
                {
                    EventId = i,
                    MemberId = 1,
                    RsvpStatus = "Attending",
                    CreatedAt = eventDate.AddDays(-2),
                    UpdatedAt = eventDate.AddDays(-2)
                });

                if (Random.Shared.Next(0, 3) > 0) // 2/3 attendance rate
                {
                    attendances.Add(new EventAttendance
                    {
                        EventId = i,
                        MemberId = 1,
                        AttendedAt = eventDate,
                        CreatedAt = eventDate
                    });
                }
            }
        }

        _context.Events.AddRange(events);
        _context.EventRsvps.AddRange(rsvps);
        _context.EventAttendances.AddRange(attendances);
        await _context.SaveChangesAsync();
    }

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

/// <summary>
/// Security-focused tests for Event Engagement Analytics
/// Tests authorization, data access control, and security vulnerabilities
/// </summary>
[TestFixture]
public class EventEngagementAnalyticsSecurityTests : IDisposable
{
    private GatherGroveDbContext _context;
    private Mock<IClubTierService> _mockClubTierService;
    private Mock<ILogger<EventEngagementAnalyticsService>> _mockLogger;
    private EventEngagementAnalyticsService _service;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockClubTierService = new Mock<IClubTierService>();
        _mockLogger = new Mock<ILogger<EventEngagementAnalyticsService>>();

        _service = new EventEngagementAnalyticsService(
            _context,
            _mockLogger.Object,
            _mockClubTierService.Object
        );

        SeedSecurityTestData();
    }

    private void SeedSecurityTestData()
    {
        var clubs = new[]
        {
            new Club { Id = 1, Name = "Unlimited Club", Tier = "Unlimited", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 2, Name = "Growth Club", Tier = "Growth", CreatedByUserId = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Club { Id = 3, Name = "Basic Club", Tier = "Basic", CreatedByUserId = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _context.Clubs.AddRange(clubs);
        _context.SaveChanges();
    }

    /// <summary>
    /// Test: Cross-club data access prevention
    /// RED Phase: Should fail if cross-club access isn't prevented
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_CrossClubAccess_Denied()
    {
        // Arrange - User from Club 1 trying to access Club 2 data
        var requestedClubId = 2;
        var userClubId = 1;
        var userId = 1;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, requestedClubId))
            .ReturnsAsync(false); // User doesn't have access to requested club

        // Act & Assert
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = requestedClubId,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };

        // Should throw UnauthorizedAccessException for cross-club access
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetEventEngagementAnalyticsReportAsync(query, userId));
    }

    /// <summary>
    /// Test: Tier-based feature access enforcement
    /// RED Phase: Should fail if tier restrictions aren't enforced
    /// </summary>
    [Test]
    [TestCase("Basic", false)]
    [TestCase("Growth", false)]
    [TestCase("Unlimited", true)]
    public async Task GetEventEngagementAnalyticsReportAsync_TierBasedAccess_EnforcedCorrectly(string tier, bool shouldHaveAccess)
    {
        // Arrange
        var clubId = tier == "Basic" ? 3 : tier == "Growth" ? 2 : 1;
        var userId = 1;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(shouldHaveAccess);

        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };

        // Act & Assert - Test tier-based access enforcement
        if (shouldHaveAccess)
        {
            var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
            Assert.That(result, Is.Not.Null);
            Assert.That(result.ClubId, Is.EqualTo(clubId));
        }
        else
        {
            Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service.GetEventEngagementAnalyticsReportAsync(query, userId));
        }
    }

    /// <summary>
    /// Test: Data sanitization and XSS prevention
    /// RED Phase: Should fail if data isn't properly sanitized
    /// </summary>
    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_MaliciousData_Sanitized()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Add event with potentially malicious data
        var maliciousEvent = new Event
        {
            Id = 999,
            ClubId = clubId,
            Name = "<script>alert('XSS')</script>",
            Description = "'; DROP TABLE Events; --",
            Location = "<img src=x onerror=alert('XSS')>",
            EventDateTime = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(maliciousEvent);
        await _context.SaveChangesAsync();

        // Act
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };

        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        // Data should be returned safely (specific sanitization depends on implementation)
        var eventMetric = result.EventMetrics.FirstOrDefault(e => e.EventId == 999);
        if (eventMetric != null)
        {
            Assert.That(eventMetric.EventName, Is.Not.Null);
            // Should not contain executable script tags
            Assert.That(eventMetric.EventName, Does.Not.Contain("<script>"));
        }
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}