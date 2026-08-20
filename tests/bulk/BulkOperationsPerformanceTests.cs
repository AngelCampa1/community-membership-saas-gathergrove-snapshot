using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Services;
using GatherGrove.Core.Entities;
using GatherGrove.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace GatherGrove.Tests.Bulk;

[TestFixture]
[Category("Performance")]
[Category("Bulk")]
public class BulkOperationsPerformanceTests
{
    private IServiceProvider _serviceProvider;
    private GatherGroveDbContext _context;
    private IBulkOperationsService _bulkService;

    [OneTimeSetUp]
    public async Task OneTimeSetup()
    {
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        );
        services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Warning));
        
        // Register services
        services.AddScoped<IBulkOperationsService, BulkOperationsService>();
        services.AddScoped<IBillingService, MockBillingService>();
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        _bulkService = _serviceProvider.GetRequiredService<IBulkOperationsService>();
        
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
            Name = "Bulk Performance Test Club",
            Description = "Large dataset for bulk operation testing",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.Clubs.Add(club);

        // Create membership types
        var membershipTypes = new List<MembershipType>();
        for (int i = 1; i <= 5; i++)
        {
            membershipTypes.Add(new MembershipType
            {
                Id = i,
                ClubId = 1,
                Name = $"Type {i}",
                Price = 25.00m * i,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }
        _context.MembershipTypes.AddRange(membershipTypes);

        // Create 15,000 members for bulk testing
        var members = new List<Member>();
        var random = new Random(54321); // Fixed seed for consistent results

        for (int i = 1; i <= 15000; i++)
        {
            var member = new Member
            {
                Id = i,
                ClubId = 1,
                FirstName = $"BulkMember{i}",
                LastName = $"Test{i}",
                Email = $"bulk{i}@performance.test",
                Phone = $"555-{i:D5}",
                MembershipTypeId = (i % 5) + 1,
                JoinDate = DateTime.UtcNow.AddDays(-random.Next(1, 730)),
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 730)),
                DateOfBirth = DateTime.UtcNow.AddYears(-random.Next(18, 80)),
                Gender = random.Next(3) switch
                {
                    0 => "Male",
                    1 => "Female",
                    _ => "Other"
                },
                Address = $"{i} Bulk Street",
                City = random.Next(5) switch
                {
                    0 => "BulkCity1",
                    1 => "BulkCity2", 
                    2 => "BulkCity3",
                    3 => "BulkCity4",
                    _ => "BulkCity5"
                },
                State = random.Next(5) switch
                {
                    0 => "CA",
                    1 => "NY",
                    2 => "TX",
                    3 => "FL",
                    _ => "WA"
                },
                PostalCode = $"{20000 + i}",
                Country = "US"
            };
            members.Add(member);
        }
        _context.Members.AddRange(members);

        // Create tags for bulk operations
        var tags = new List<Tag>();
        for (int i = 1; i <= 100; i++)
        {
            tags.Add(new Tag
            {
                Id = i,
                ClubId = 1,
                Name = $"BulkTag{i}",
                Color = $"#{random.Next(0x1000000):X6}",
                CreatedAt = DateTime.UtcNow
            });
        }
        _context.Tags.AddRange(tags);

        await _context.SaveChangesAsync();
        Console.WriteLine($"Seeded database with {members.Count} members for bulk testing");
    }

    [Test]
    [TestCase(1000, TestName = "Bulk tag assignment for 1,000 members")]
    [TestCase(5000, TestName = "Bulk tag assignment for 5,000 members")]
    [TestCase(10000, TestName = "Bulk tag assignment for 10,000 members")]
    public async Task BulkAddTags_ShouldComplete_WithinPerformanceLimits(int memberCount)
    {
        // Arrange
        var operationRequest = new CreateBulkOperationRequest
        {
            Name = $"Bulk Add Tags - {memberCount} members",
            Description = "Performance test for bulk tag assignment",
            Type = "ADD_TAGS"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, memberCount);
        var tagIds = new[] { 1, 2, 3 }; // Add 3 tags to each member

        // Calculate expected time limits based on member count
        var expectedTimeSeconds = memberCount switch
        {
            <= 1000 => 10.0,
            <= 5000 => 30.0,
            _ => 60.0
        };

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var result = await _bulkService.ExecuteBulkAddTagsAsync(1, operation.Id, memberIds, tagIds, 1);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(expectedTimeSeconds),
            $"Bulk tag assignment for {memberCount} members took {stopwatch.Elapsed.TotalSeconds:F2} seconds, should be under {expectedTimeSeconds} seconds");
        
        Assert.That(result.IsSuccess, Is.True, "Bulk operation should complete successfully");
        Assert.That(result.ProcessedCount, Is.EqualTo(memberCount), "All members should be processed");
    }

    [Test]
    [TestCase(2000, TestName = "Bulk membership type update for 2,000 members")]
    [TestCase(8000, TestName = "Bulk membership type update for 8,000 members")]
    public async Task BulkUpdateMembershipType_ShouldComplete_WithinPerformanceLimits(int memberCount)
    {
        // Arrange
        var operationRequest = new CreateBulkOperationRequest
        {
            Name = $"Bulk Update Membership - {memberCount} members",
            Description = "Performance test for bulk membership type updates",
            Type = "UPDATE_MEMBERSHIP_TYPE"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, memberCount);
        var newMembershipTypeId = 3; // Update to Premium membership

        var expectedTimeSeconds = memberCount <= 2000 ? 15.0 : 45.0;

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var result = await _bulkService.ExecuteBulkUpdateMembershipTypeAsync(1, operation.Id, memberIds, newMembershipTypeId, 1);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(expectedTimeSeconds),
            $"Bulk membership update for {memberCount} members took {stopwatch.Elapsed.TotalSeconds:F2} seconds, should be under {expectedTimeSeconds} seconds");
        
        Assert.That(result.IsSuccess, Is.True, "Bulk operation should complete successfully");
        Assert.That(result.ProcessedCount, Is.EqualTo(memberCount), "All members should be processed");

        // Verify the updates were applied
        var updatedMembers = await _context.Members
            .Where(m => memberIds.Contains(m.Id))
            .CountAsync(m => m.MembershipTypeId == newMembershipTypeId);
        
        Assert.That(updatedMembers, Is.EqualTo(memberCount), "All members should have updated membership type");
    }

    [Test]
    [TestCase(3000, TestName = "Bulk custom field update for 3,000 members")]
    [TestCase(12000, TestName = "Bulk custom field update for 12,000 members")]
    public async Task BulkUpdateCustomFields_ShouldComplete_WithinPerformanceLimits(int memberCount)
    {
        // Arrange
        var operationRequest = new CreateBulkOperationRequest
        {
            Name = $"Bulk Custom Fields - {memberCount} members",
            Description = "Performance test for bulk custom field updates",
            Type = "UPDATE_CUSTOM_FIELDS"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, memberCount);
        var customFieldUpdates = new Dictionary<int, string>
        {
            { 1, "Bulk Updated Value 1" },
            { 2, "Bulk Updated Value 2" },
            { 3, "Performance Test Update" }
        };

        var expectedTimeSeconds = memberCount <= 3000 ? 20.0 : 80.0;

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var result = await _bulkService.ExecuteBulkUpdateCustomFieldsAsync(1, operation.Id, memberIds, customFieldUpdates, 1);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(expectedTimeSeconds),
            $"Bulk custom field update for {memberCount} members took {stopwatch.Elapsed.TotalSeconds:F2} seconds, should be under {expectedTimeSeconds} seconds");
        
        Assert.That(result.IsSuccess, Is.True, "Bulk operation should complete successfully");
        Assert.That(result.ProcessedCount, Is.EqualTo(memberCount), "All members should be processed");
    }

    [Test]
    [TestCase(5000, "CSV", TestName = "Bulk export 5,000 members to CSV")]
    [TestCase(10000, "Excel", TestName = "Bulk export 10,000 members to Excel")]
    public async Task BulkExportMembers_ShouldComplete_WithinPerformanceLimits(int memberCount, string format)
    {
        // Arrange
        var operationRequest = new CreateBulkOperationRequest
        {
            Name = $"Bulk Export - {memberCount} members to {format}",
            Description = "Performance test for bulk member export",
            Type = "EXPORT_MEMBERS"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, memberCount);
        var includeFields = new[] { "FirstName", "LastName", "Email", "Phone", "MembershipType", "JoinDate" };

        var expectedTimeSeconds = format == "CSV" ? 25.0 : 40.0;

        // Act
        var stopwatch = Stopwatch.StartNew();
        
        var result = await _bulkService.ExecuteBulkExportMembersAsync(1, operation.Id, memberIds, format, includeFields, 1);
        
        stopwatch.Stop();

        // Assert
        Assert.That(stopwatch.Elapsed.TotalSeconds, Is.LessThan(expectedTimeSeconds),
            $"Bulk export of {memberCount} members to {format} took {stopwatch.Elapsed.TotalSeconds:F2} seconds, should be under {expectedTimeSeconds} seconds");
        
        Assert.That(result.IsSuccess, Is.True, "Bulk export should complete successfully");
        Assert.That(result.ProcessedCount, Is.EqualTo(memberCount), "All members should be processed");
        Assert.That(result.Data, Is.Not.Null, "Export should contain data");
    }

    [Test]
    [TestCase(TestName = "Concurrent bulk operations should not interfere")]
    public async Task ConcurrentBulkOperations_ShouldNot_Interfere()
    {
        // Arrange - Create multiple concurrent bulk operations
        var tasks = new List<Task<(TimeSpan duration, bool success)>>();

        for (int i = 0; i < 5; i++)
        {
            var taskId = i;
            tasks.Add(Task.Run(async () =>
            {
                using var scope = _serviceProvider.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IBulkOperationsService>();
                
                var operationRequest = new CreateBulkOperationRequest
                {
                    Name = $"Concurrent Operation {taskId}",
                    Description = $"Concurrent bulk test {taskId}",
                    Type = "ADD_TAGS"
                };

                var stopwatch = Stopwatch.StartNew();
                
                var operation = await service.CreateBulkOperationAsync(1, 1, operationRequest);
                var memberIds = Enumerable.Range(1 + (taskId * 1000), 1000); // Each task gets different member range
                var tagIds = new[] { taskId + 1 }; // Each task uses different tag
                
                var result = await service.ExecuteBulkAddTagsAsync(1, operation.Id, memberIds, tagIds, 1);
                
                stopwatch.Stop();
                return (stopwatch.Elapsed, result.IsSuccess);
            }));
        }

        // Act
        var results = await Task.WhenAll(tasks);

        // Assert
        Assert.That(results.All(r => r.success), Is.True, "All concurrent operations should succeed");
        
        var maxDuration = results.Max(r => r.duration.TotalSeconds);
        var avgDuration = results.Average(r => r.duration.TotalSeconds);
        
        Assert.That(maxDuration, Is.LessThan(30.0), 
            $"Maximum concurrent operation time was {maxDuration:F2} seconds, should be under 30 seconds");
        Assert.That(avgDuration, Is.LessThan(20.0),
            $"Average concurrent operation time was {avgDuration:F2} seconds, should be under 20 seconds");
    }

    [Test]
    [TestCase(TestName = "Bulk operation progress tracking should be accurate")]
    public async Task BulkOperationProgress_ShouldBe_AccuractelyTracked()
    {
        // Arrange
        var operationRequest = new CreateBulkOperationRequest
        {
            Name = "Progress Tracking Test",
            Description = "Test bulk operation progress tracking",
            Type = "ADD_TAGS"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, 2000);
        var tagIds = new[] { 10 };

        // Act - Start bulk operation in background
        var bulkTask = Task.Run(async () => 
            await _bulkService.ExecuteBulkAddTagsAsync(1, operation.Id, memberIds, tagIds, 1));

        // Monitor progress during execution
        var progressChecks = new List<BulkOperationProgress>();
        var progressStopwatch = Stopwatch.StartNew();

        while (!bulkTask.IsCompleted && progressStopwatch.Elapsed.TotalSeconds < 30)
        {
            var progress = await _bulkService.GetBulkOperationProgressAsync(1, operation.Id, 1);
            progressChecks.Add(progress);
            
            await Task.Delay(500); // Check every 500ms
        }

        await bulkTask;
        progressStopwatch.Stop();

        // Final progress check
        var finalProgress = await _bulkService.GetBulkOperationProgressAsync(1, operation.Id, 1);
        progressChecks.Add(finalProgress);

        // Assert
        Assert.That(progressChecks.Count, Is.GreaterThan(1), "Should have multiple progress checks");
        Assert.That(finalProgress.Status, Is.EqualTo("Completed"), "Final status should be completed");
        Assert.That(finalProgress.ProcessedCount, Is.EqualTo(2000), "All members should be processed");
        Assert.That(finalProgress.PercentComplete, Is.EqualTo(100), "Should be 100% complete");

        // Verify progress was incrementally updated
        var progressIncreases = 0;
        for (int i = 1; i < progressChecks.Count; i++)
        {
            if (progressChecks[i].ProcessedCount > progressChecks[i - 1].ProcessedCount)
            {
                progressIncreases++;
            }
        }
        
        Assert.That(progressIncreases, Is.GreaterThan(0), "Progress should increase over time");
    }

    [Test]
    [TestCase(TestName = "Memory usage should be controlled during large bulk operations")]
    public async Task LargeBulkOperations_ShouldNot_ExcessivelyConsume_Memory()
    {
        // Arrange
        var initialMemory = GC.GetTotalMemory(false);

        var operationRequest = new CreateBulkOperationRequest
        {
            Name = "Memory Test Bulk Operation",
            Description = "Test memory usage during large bulk operations",
            Type = "ADD_TAGS"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, 15000); // Use all members
        var tagIds = new[] { 50, 51, 52, 53, 54 }; // Add 5 tags

        // Act
        var result = await _bulkService.ExecuteBulkAddTagsAsync(1, operation.Id, memberIds, tagIds, 1);

        // Force garbage collection and measure
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        var finalMemory = GC.GetTotalMemory(false);
        var memoryIncrease = finalMemory - initialMemory;

        // Assert
        Assert.That(result.IsSuccess, Is.True, "Bulk operation should complete successfully");
        Assert.That(result.ProcessedCount, Is.EqualTo(15000), "All members should be processed");
        
        Assert.That(memoryIncrease, Is.LessThan(200 * 1024 * 1024), // Less than 200MB increase
            $"Memory increased by {memoryIncrease / (1024 * 1024):F1}MB, should be less than 200MB");
    }

    [Test]
    [TestCase(TestName = "Bulk operation cancellation should work correctly")]
    public async Task BulkOperationCancellation_ShouldWork_Correctly()
    {
        // Arrange
        var operationRequest = new CreateBulkOperationRequest
        {
            Name = "Cancellation Test",
            Description = "Test bulk operation cancellation",
            Type = "UPDATE_CUSTOM_FIELDS"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, 10000); // Large operation to allow cancellation
        var customFields = new Dictionary<int, string> { { 1, "Should not complete" } };

        // Act - Start operation and cancel quickly
        var bulkTask = Task.Run(async () => 
            await _bulkService.ExecuteBulkUpdateCustomFieldsAsync(1, operation.Id, memberIds, customFields, 1));

        // Wait a bit then cancel
        await Task.Delay(100);
        var cancelResult = await _bulkService.CancelBulkOperationAsync(1, operation.Id, 1);

        // Give some time for cancellation to take effect
        await Task.Delay(1000);

        // Assert
        Assert.That(cancelResult, Is.True, "Cancellation should return true");

        var finalProgress = await _bulkService.GetBulkOperationProgressAsync(1, operation.Id, 1);
        Assert.That(finalProgress.Status, Is.EqualTo("Cancelled").Or.EqualTo("Completed"), 
            "Final status should be Cancelled or Completed");

        // If it completed before cancellation, that's also valid
        if (finalProgress.Status == "Cancelled")
        {
            Assert.That(finalProgress.ProcessedCount, Is.LessThan(10000), 
                "Not all members should be processed if cancelled");
        }
    }

    [Test]
    [TestCase(TestName = "Database transaction integrity during bulk operations")]
    public async Task BulkOperations_ShouldMaintain_TransactionIntegrity()
    {
        // Arrange - Get initial counts
        var initialMemberCount = await _context.Members.CountAsync();
        var initialTagCount = await _context.Tags.CountAsync();

        var operationRequest = new CreateBulkOperationRequest
        {
            Name = "Transaction Integrity Test",
            Description = "Test transaction integrity during bulk operations",
            Type = "ADD_TAGS"
        };

        var operation = await _bulkService.CreateBulkOperationAsync(1, 1, operationRequest);
        var memberIds = Enumerable.Range(1, 1000);
        var tagIds = new[] { 99 }; // Use existing tag

        // Act
        var result = await _bulkService.ExecuteBulkAddTagsAsync(1, operation.Id, memberIds, tagIds, 1);

        // Assert - Verify no data corruption
        var finalMemberCount = await _context.Members.CountAsync();
        var finalTagCount = await _context.Tags.CountAsync();

        Assert.That(finalMemberCount, Is.EqualTo(initialMemberCount), 
            "Member count should remain unchanged");
        Assert.That(finalTagCount, Is.EqualTo(initialTagCount), 
            "Tag count should remain unchanged");

        Assert.That(result.IsSuccess, Is.True, "Bulk operation should complete successfully");

        // Verify tag assignments were created
        var tagAssignments = await _context.MemberTags
            .Where(mt => memberIds.Contains(mt.MemberId) && mt.TagId == 99)
            .CountAsync();

        Assert.That(tagAssignments, Is.EqualTo(1000), 
            "All tag assignments should be created");
    }

    private class MockBillingService : IBillingService
    {
        public Task<string> GetUserTierAsync(int userId)
        {
            return Task.FromResult("Unlimited");
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