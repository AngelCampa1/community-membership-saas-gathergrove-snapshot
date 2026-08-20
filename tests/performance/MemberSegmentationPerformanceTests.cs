using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Services;
using GatherGrove.Core.Entities;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace GatherGrove.Tests.Performance;

[TestFixture]
[Category("Performance")]
public class MemberSegmentationPerformanceTests
{
    private IServiceProvider _serviceProvider;
    private GatherGroveDbContext _context;
    private IMemberSegmentationService _segmentService;

    [OneTimeSetUp]
    public async Task OneTimeSetup()
    {
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        );
        services.AddMemoryCache();
        services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Warning));
        
        // Register services
        services.AddScoped<IMemberSegmentationService, MemberSegmentationService>();
        services.AddScoped<IBillingService, MockBillingService>();
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        _segmentService = _serviceProvider.GetRequiredService<IMemberSegmentationService>();
        
        await SeedLargeDatasetAsync();
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        await _context?.DisposeAsync();
        _serviceProvider?.Dispose();
    }

    private async Task SeedLargeDatasetAsync()
    {
        // Create test club
        var club = new Club
        {
            Id = 1,
            Name = "Performance Test Club",
            Description = "Large dataset for performance testing",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.Clubs.Add(club);

        // Create membership types
        var membershipTypes = new List<MembershipType>
        {
            new() { Id = 1, ClubId = 1, Name = "Basic", Price = 25.00m, IsActive = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 2, ClubId = 1, Name = "Premium", Price = 50.00m, IsActive = true, CreatedAt = DateTime.UtcNow },
            new() { Id = 3, ClubId = 1, Name = "VIP", Price = 100.00m, IsActive = true, CreatedAt = DateTime.UtcNow }
        };
        _context.MembershipTypes.AddRange(membershipTypes);

        // Create 10,000 members with diverse attributes
        var members = new List<Member>();
        var random = new Random(12345); // Fixed seed for consistent results

        for (int i = 1; i <= 10000; i++)
        {
            var member = new Member
            {
                Id = i,
                ClubId = 1,
                FirstName = $"Member{i}",
                LastName = $"Test{i}",
                Email = $"member{i}@performance.test",
                Phone = $"555-{i:D4}",
                MembershipTypeId = (i % 3) + 1,
                JoinDate = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                IsActive = random.NextDouble() > 0.1, // 90% active
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                DateOfBirth = DateTime.UtcNow.AddYears(-random.Next(18, 80)),
                Gender = random.Next(3) switch
                {
                    0 => "Male",
                    1 => "Female",
                    _ => "Other"
                },
                Address = $"{i} Performance Street",
                City = random.Next(2) == 0 ? "TestCity" : "OtherCity",
                State = random.Next(3) switch
                {
                    0 => "CA",
                    1 => "NY",
                    _ => "TX"
                },
                PostalCode = $"{10000 + i}",
                Country = "US"
            };
            members.Add(member);
        }
        _context.Members.AddRange(members);

        // Create tags
        var tags = new List<Tag>();
        for (int i = 1; i <= 50; i++)
        {
            tags.Add(new Tag
            {
                Id = i,
                ClubId = 1,
                Name = $"Tag{i}",
                Color = $"#{random.Next(0x1000000):X6}",
                CreatedAt = DateTime.UtcNow
            });
        }
        _context.Tags.AddRange(tags);

        // Create member-tag relationships (each member has 0-5 tags)
        var memberTags = new List<MemberTag>();
        for (int memberId = 1; memberId <= 10000; memberId++)
        {
            var tagCount = random.Next(0, 6);
            var assignedTags = new HashSet<int>();
            
            for (int j = 0; j < tagCount; j++)
            {
                var tagId = random.Next(1, 51);
                if (assignedTags.Add(tagId))
                {
                    memberTags.Add(new MemberTag
                    {
                        MemberId = memberId,
                        TagId = tagId
                    });
                }
            }
        }
        _context.MemberTags.AddRange(memberTags);

        await _context.SaveChangesAsync();
        Console.WriteLine($"Seeded database with {members.Count} members and {memberTags.Count} tag relationships");
    }

    [Test]
    [TestCase(Description = "Segment creation should complete under 5 seconds")]
    public async Task SegmentCreation_ShouldComplete_UnderFiveSeconds()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
        {
            Name = "Performance Test Segment",
            Description = "Testing creation performance",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "IsActive",
                        "operator": "equals",
                        "value": "true"
                    },
                    {
                        "field": "MembershipTypeId",
                        "operator": "equals",
                        "value": "2"
                    }
                ],
                "tagConditions": [
                    {
                        "tagId": 1,
                        "operator": "has"
                    }
                ]
            }
            """
        };

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var result = await _segmentService.CreateMemberSegmentAsync(1, 1, request);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(5.0), 
            $"Segment creation took {stopwatch.Elapsed.TotalSeconds:F2} seconds, should be under 5 seconds");
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Name, Is.EqualTo("Performance Test Segment"));
    }

    [Test]
    [TestCase(Description = "Simple segment query should complete under 2 seconds")]
    public async Task SimpleSegmentQuery_ShouldComplete_UnderTwoSeconds()
    {
        // Arrange - Create a simple segment
        var segmentRequest = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
        {
            Name = "Simple Query Test",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "IsActive",
                        "operator": "equals",
                        "value": "true"
                    }
                ]
            }
            """
        };

        var segment = await _segmentService.CreateMemberSegmentAsync(1, 1, segmentRequest);

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var members = await _segmentService.GetSegmentMembersAsync(1, segment.Id, 1, 1, 1000);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(2.0),
            $"Simple query took {stopwatch.Elapsed.TotalSeconds:F2} seconds, should be under 2 seconds");
        Assert.That(members.Items.Count(), Is.GreaterThan(0));
    }

    [Test]
    [TestCase(Description = "Complex segment query should complete under 2 seconds")]
    public async Task ComplexSegmentQuery_ShouldComplete_UnderTwoSeconds()
    {
        // Arrange - Create a complex segment
        var segmentRequest = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
        {
            Name = "Complex Query Test",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "IsActive",
                        "operator": "equals",
                        "value": "true"
                    },
                    {
                        "field": "MembershipTypeId",
                        "operator": "in",
                        "value": "1,2"
                    },
                    {
                        "field": "JoinDate",
                        "operator": "greater_than",
                        "value": "2024-01-01"
                    }
                ],
                "tagConditions": [
                    {
                        "tagId": 1,
                        "operator": "has"
                    },
                    {
                        "tagId": 2,
                        "operator": "has"
                    }
                ],
                "logic": "AND"
            }
            """
        };

        var segment = await _segmentService.CreateMemberSegmentAsync(1, 1, segmentRequest);

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var members = await _segmentService.GetSegmentMembersAsync(1, segment.Id, 1, 1, 1000);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(2.0),
            $"Complex query took {stopwatch.Elapsed.TotalSeconds:F2} seconds, should be under 2 seconds");
    }

    [Test]
    [TestCase(Description = "Large result set pagination should be efficient")]
    public async Task LargeResultSetPagination_ShouldBeEfficient()
    {
        // Arrange - Create segment that matches most members
        var segmentRequest = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
        {
            Name = "Large Result Set Test",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "ClubId",
                        "operator": "equals",
                        "value": "1"
                    }
                ]
            }
            """
        };

        var segment = await _segmentService.CreateMemberSegmentAsync(1, 1, segmentRequest);

        // Act & Assert - Test multiple pages
        for (int page = 1; page <= 5; page++)
        {
            var stopwatch = Stopwatch.StartNew();
            
            var members = await _segmentService.GetSegmentMembersAsync(1, segment.Id, 1, page, 100);
            
            stopwatch.Stop();

            Assert.That(stopwatch.Elapsed.TotalMilliseconds, Is.LessThan(500),
                $"Page {page} took {stopwatch.Elapsed.TotalMilliseconds:F0}ms, should be under 500ms");
            Assert.That(members.Items.Count(), Is.EqualTo(100));
        }
    }

    [Test]
    [TestCase(Description = "Concurrent segment operations should maintain performance")]
    public async Task ConcurrentSegmentOperations_ShouldMaintainPerformance()
    {
        // Arrange
        var tasks = new List<Task<TimeSpan>>();

        // Act - Create multiple concurrent operations
        for (int i = 0; i < 10; i++)
        {
            var taskId = i;
            tasks.Add(Task.Run(async () =>
            {
                var stopwatch = Stopwatch.StartNew();
                
                var segmentRequest = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
                {
                    Name = $"Concurrent Test {taskId}",
                    Criteria = $$"""
                    {
                        "conditions": [
                            {
                                "field": "IsActive",
                                "operator": "equals",
                                "value": "true"
                            },
                            {
                                "field": "MembershipTypeId",
                                "operator": "equals",
                                "value": "{{(taskId % 3) + 1}}"
                            }
                        ]
                    }
                    """
                };

                using var scope = _serviceProvider.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IMemberSegmentationService>();
                
                var segment = await service.CreateMemberSegmentAsync(1, 1, segmentRequest);
                var members = await service.GetSegmentMembersAsync(1, segment.Id, 1, 1, 50);
                
                stopwatch.Stop();
                return stopwatch.Elapsed;
            }));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        var maxTime = results.Max(r => r.TotalSeconds);
        var avgTime = results.Average(r => r.TotalSeconds);

        Assert.That(maxTime, Is.LessThan(10.0), 
            $"Maximum concurrent operation time was {maxTime:F2} seconds, should be under 10 seconds");
        Assert.That(avgTime, Is.LessThan(5.0),
            $"Average concurrent operation time was {avgTime:F2} seconds, should be under 5 seconds");
    }

    [Test]
    [TestCase(Description = "Segment member count calculation should be fast")]
    public async Task SegmentMemberCount_ShouldBeCalculated_Quickly()
    {
        // Arrange
        var segmentRequest = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
        {
            Name = "Count Performance Test",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "IsActive",
                        "operator": "equals",
                        "value": "true"
                    }
                ]
            }
            """
        };

        var segment = await _segmentService.CreateMemberSegmentAsync(1, 1, segmentRequest);

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var count = await _segmentService.GetSegmentMemberCountAsync(1, segment.Id, 1);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalMilliseconds, Is.LessThan(100),
            $"Member count calculation took {stopwatch.Elapsed.TotalMilliseconds:F0}ms, should be under 100ms");
        Assert.That(count, Is.GreaterThan(0));
    }

    [Test]
    [TestCase(Description = "Cache should improve repeated query performance")]
    public async Task RepeatedQueries_ShouldBenefit_FromCaching()
    {
        // Arrange
        var segmentRequest = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
        {
            Name = "Cache Performance Test",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "MembershipTypeId",
                        "operator": "equals",
                        "value": "2"
                    }
                ]
            }
            """
        };

        var segment = await _segmentService.CreateMemberSegmentAsync(1, 1, segmentRequest);

        // Act - First query (cold cache)
        var stopwatch1 = Stopwatch.StartNew();
        var members1 = await _segmentService.GetSegmentMembersAsync(1, segment.Id, 1, 1, 100);
        stopwatch1.Stop();

        // Act - Second query (should hit cache)
        var stopwatch2 = Stopwatch.StartNew();
        var members2 = await _segmentService.GetSegmentMembersAsync(1, segment.Id, 1, 1, 100);
        stopwatch2.Stop();

        // Assert
        Assert.That(stopwatch2.Elapsed.TotalMilliseconds, Is.LessThan(stopwatch1.Elapsed.TotalMilliseconds),
            $"Cached query ({stopwatch2.Elapsed.TotalMilliseconds:F0}ms) should be faster than cold query ({stopwatch1.Elapsed.TotalMilliseconds:F0}ms)");
        
        Assert.That(members1.Items.Count(), Is.EqualTo(members2.Items.Count()),
            "Cached results should match original results");
    }

    [Test]
    [TestCase(Description = "Memory usage should remain reasonable during large operations")]
    public async Task LargeOperations_ShouldNot_ExcessivelyConsume_Memory()
    {
        // Arrange
        var initialMemory = GC.GetTotalMemory(false);

        var segmentRequest = new GatherGrove.Application.DTOs.CreateMemberSegmentRequest
        {
            Name = "Memory Test Segment",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "ClubId",
                        "operator": "equals",
                        "value": "1"
                    }
                ]
            }
            """
        };

        // Act - Perform memory-intensive operations
        var segment = await _segmentService.CreateMemberSegmentAsync(1, 1, segmentRequest);
        
        // Query large result sets
        for (int page = 1; page <= 20; page++)
        {
            var members = await _segmentService.GetSegmentMembersAsync(1, segment.Id, 1, page, 500);
            // Don't hold references to prevent artificial memory inflation
        }

        // Force garbage collection and measure
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        var finalMemory = GC.GetTotalMemory(false);
        var memoryIncrease = finalMemory - initialMemory;

        // Assert
        Assert.That(memoryIncrease, Is.LessThan(100 * 1024 * 1024), // Less than 100MB increase
            $"Memory increased by {memoryIncrease / (1024 * 1024):F1}MB, should be less than 100MB");
    }

    [Test]
    [TestCase(Description = "Database connection pooling should be efficient")]
    public async Task DatabaseConnections_ShouldBe_PooledEfficiently()
    {
        // Arrange & Act - Simulate multiple rapid operations that would typically require many DB connections
        var tasks = new List<Task>();
        
        for (int i = 0; i < 50; i++)
        {
            var taskId = i;
            tasks.Add(Task.Run(async () =>
            {
                using var scope = _serviceProvider.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IMemberSegmentationService>();
                
                var segments = await service.GetMemberSegmentsAsync(1, 1);
                var count = segments.Count();
            }));
        }

        var stopwatch = Stopwatch.StartNew();
        await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert - All operations should complete reasonably quickly
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(30.0),
            $"50 concurrent database operations took {stopwatch.Elapsed.TotalSeconds:F2} seconds, connection pooling may be inefficient");
    }

    private class MockBillingService : IBillingService
    {
        public Task<string> GetUserTierAsync(int userId)
        {
            return Task.FromResult("Unlimited"); // Always return Unlimited tier for performance tests
        }

        public Task<bool> HasFeatureAccessAsync(int userId, string featureName)
        {
            return Task.FromResult(true);
        }

        public Task<int> GetFeatureLimitAsync(int userId, string featureName)
        {
            return Task.FromResult(int.MaxValue);
        }
    }
}