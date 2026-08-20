using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Core.Entities;
using GatherGrove.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GatherGrove.Tests.Data;

[TestFixture]
public class MemberSegmentationDatabaseTests
{
    private GatherGroveDbContext _context;
    private IServiceProvider _serviceProvider;

    [SetUp]
    public async Task Setup()
    {
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        );
        services.AddLogging();
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        
        await SeedTestDataAsync();
    }

    [TearDown]
    public async Task TearDown()
    {
        await _context.DisposeAsync();
        _serviceProvider?.Dispose();
    }

    private async Task SeedTestDataAsync()
    {
        // Create test club
        var club = new Club
        {
            Id = 1,
            Name = "Test Club",
            Description = "Test club for database testing",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.Clubs.Add(club);

        // Create test membership type
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Regular",
            Price = 50.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);

        // Create test members with various attributes for segmentation
        var members = new List<Member>();
        for (int i = 1; i <= 100; i++)
        {
            var member = new Member
            {
                Id = i,
                ClubId = 1,
                FirstName = $"Member{i}",
                LastName = $"Test{i}",
                Email = $"member{i}@test.com",
                Phone = $"555-{i:D4}",
                MembershipTypeId = 1,
                JoinDate = DateTime.UtcNow.AddDays(-i),
                IsActive = i % 10 != 0, // Every 10th member is inactive
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                DateOfBirth = DateTime.UtcNow.AddYears(-20 - (i % 50)), // Ages 20-70
                Gender = i % 3 == 0 ? "Female" : (i % 3 == 1 ? "Male" : "Other"),
                Address = $"{i} Test Street",
                City = i % 2 == 0 ? "TestCity" : "OtherCity",
                State = i % 3 == 0 ? "CA" : (i % 3 == 1 ? "NY" : "TX"),
                PostalCode = $"{10000 + i}",
                Country = "US"
            };
            members.Add(member);
        }
        _context.Members.AddRange(members);

        // Create test tags
        var tags = new List<Tag>
        {
            new() { Id = 1, ClubId = 1, Name = "VIP", Color = "#FF0000", CreatedAt = DateTime.UtcNow },
            new() { Id = 2, ClubId = 1, Name = "Volunteer", Color = "#00FF00", CreatedAt = DateTime.UtcNow },
            new() { Id = 3, ClubId = 1, Name = "Board Member", Color = "#0000FF", CreatedAt = DateTime.UtcNow }
        };
        _context.Tags.AddRange(tags);

        // Create member-tag relationships
        var memberTags = new List<MemberTag>();
        for (int i = 1; i <= 30; i++)
        {
            memberTags.Add(new MemberTag { MemberId = i, TagId = 1 }); // First 30 are VIP
            if (i <= 15)
                memberTags.Add(new MemberTag { MemberId = i, TagId = 2 }); // First 15 are also volunteers
            if (i <= 5)
                memberTags.Add(new MemberTag { MemberId = i, TagId = 3 }); // First 5 are board members
        }
        _context.MemberTags.AddRange(memberTags);

        // Create test events for attendance tracking
        var events = new List<Event>();
        for (int i = 1; i <= 10; i++)
        {
            var evt = new Event
            {
                Id = i,
                ClubId = 1,
                Title = $"Event {i}",
                Description = $"Test event {i}",
                EventDate = DateTime.UtcNow.AddDays(-i * 7), // Weekly events
                Location = "Test Location",
                MaxAttendees = 50,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-i * 7 - 1)
            };
            events.Add(evt);
        }
        _context.Events.AddRange(events);

        await _context.SaveChangesAsync();
    }

    [Test]
    public async Task Database_ShouldCreateSegment_WithBasicCriteria()
    {
        // Arrange
        var segment = new MemberSegment
        {
            ClubId = 1,
            Name = "Active Members",
            Description = "All active members",
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
            """,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        // Act
        _context.MemberSegments.Add(segment);
        await _context.SaveChangesAsync();

        // Assert
        var savedSegment = await _context.MemberSegments.FirstOrDefaultAsync(s => s.Name == "Active Members");
        Assert.That(savedSegment, Is.Not.Null);
        Assert.That(savedSegment.ClubId, Is.EqualTo(1));
        Assert.That(savedSegment.IsActive, Is.True);
    }

    [Test]
    public async Task Database_ShouldQueryMembers_WithComplexCriteria()
    {
        // Arrange
        var segment = new MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "VIP Active Members",
            Criteria = """
            {
                "conditions": [
                    {
                        "field": "IsActive",
                        "operator": "equals",
                        "value": "true"
                    }
                ],
                "tagConditions": [
                    {
                        "tagId": 1,
                        "operator": "has"
                    }
                ]
            }
            """,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        _context.MemberSegments.Add(segment);
        await _context.SaveChangesAsync();

        // Act - Query members that match the segment criteria
        var activeVipMembers = await _context.Members
            .Where(m => m.ClubId == 1 && m.IsActive)
            .Where(m => m.MemberTags.Any(mt => mt.TagId == 1))
            .CountAsync();

        // Assert
        Assert.That(activeVipMembers, Is.EqualTo(27)); // 30 VIP members, 3 inactive (every 10th)
    }

    [Test]
    public async Task Database_ShouldHandleConcurrentSegmentUpdates()
    {
        // Arrange
        var segment = new MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Test Concurrent",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1,
            Version = 1
        };

        _context.MemberSegments.Add(segment);
        await _context.SaveChangesAsync();

        // Act & Assert - Simulate concurrent updates
        using var context1 = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        using var context2 = _serviceProvider.GetRequiredService<GatherGroveDbContext>();

        var segment1 = await context1.MemberSegments.FindAsync(1);
        var segment2 = await context2.MemberSegments.FindAsync(1);

        segment1.Name = "Updated by Context 1";
        segment2.Name = "Updated by Context 2";

        await context1.SaveChangesAsync();

        // Second update should handle concurrency appropriately
        var exception = Assert.ThrowsAsync<DbUpdateConcurrencyException>(
            async () => await context2.SaveChangesAsync()
        );
        Assert.That(exception, Is.Not.Null);
    }

    [Test]
    public async Task Database_ShouldMaintainReferentialIntegrity_WhenDeletingSegment()
    {
        // Arrange
        var segment = new MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Test Delete",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        _context.MemberSegments.Add(segment);
        await _context.SaveChangesAsync();

        // Act
        _context.MemberSegments.Remove(segment);
        await _context.SaveChangesAsync();

        // Assert
        var deletedSegment = await _context.MemberSegments.FindAsync(1);
        Assert.That(deletedSegment, Is.Null);
    }

    [Test]
    public async Task Database_ShouldIndexQueries_ForPerformance()
    {
        // Arrange & Act - Measure query performance
        var startTime = DateTime.UtcNow;

        var complexQuery = await _context.Members
            .Where(m => m.ClubId == 1)
            .Where(m => m.IsActive)
            .Where(m => m.JoinDate >= DateTime.UtcNow.AddDays(-30))
            .Include(m => m.MemberTags)
            .ThenInclude(mt => mt.Tag)
            .ToListAsync();

        var queryTime = DateTime.UtcNow - startTime;

        // Assert
        Assert.That(queryTime.TotalMilliseconds, Is.LessThan(100), "Complex query should complete under 100ms with proper indexing");
        Assert.That(complexQuery.Count, Is.GreaterThan(0));
    }

    [Test]
    public async Task Database_ShouldHandleLargeDatasets_Efficiently()
    {
        // Arrange - Create larger dataset
        var largeDataMembers = new List<Member>();
        for (int i = 1001; i <= 2000; i++)
        {
            largeDataMembers.Add(new Member
            {
                Id = i,
                ClubId = 1,
                FirstName = $"Member{i}",
                LastName = $"Test{i}",
                Email = $"member{i}@test.com",
                MembershipTypeId = 1,
                JoinDate = DateTime.UtcNow.AddDays(-i),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Members.AddRange(largeDataMembers);
        await _context.SaveChangesAsync();

        // Act & Assert - Test pagination performance
        var startTime = DateTime.UtcNow;

        var pagedResults = await _context.Members
            .Where(m => m.ClubId == 1)
            .OrderBy(m => m.Id)
            .Skip(0)
            .Take(50)
            .ToListAsync();

        var paginationTime = DateTime.UtcNow - startTime;

        Assert.That(paginationTime.TotalMilliseconds, Is.LessThan(50), "Pagination should be fast even with large datasets");
        Assert.That(pagedResults.Count, Is.EqualTo(50));
    }

    [Test]
    public async Task Database_ShouldSupportBulkOperations_Efficiently()
    {
        // Arrange
        var memberIds = Enumerable.Range(1, 50).ToList();

        // Act - Bulk update operation
        var startTime = DateTime.UtcNow;

        var membersToUpdate = await _context.Members
            .Where(m => memberIds.Contains(m.Id))
            .ToListAsync();

        foreach (var member in membersToUpdate)
        {
            member.Phone = "555-BULK";
        }

        await _context.SaveChangesAsync();

        var bulkUpdateTime = DateTime.UtcNow - startTime;

        // Assert
        Assert.That(bulkUpdateTime.TotalMilliseconds, Is.LessThan(200), "Bulk update should complete efficiently");

        var updatedCount = await _context.Members
            .Where(m => m.Phone == "555-BULK")
            .CountAsync();
        Assert.That(updatedCount, Is.EqualTo(50));
    }

    [Test]
    public async Task Database_ShouldValidateSegmentCriteria_JsonFormat()
    {
        // Arrange
        var validCriteria = """
        {
            "conditions": [
                {
                    "field": "IsActive",
                    "operator": "equals",
                    "value": "true"
                }
            ],
            "logic": "AND"
        }
        """;

        var segment = new MemberSegment
        {
            ClubId = 1,
            Name = "Valid JSON Criteria",
            Criteria = validCriteria,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
        {
            _context.MemberSegments.Add(segment);
            await _context.SaveChangesAsync();
        });

        var savedSegment = await _context.MemberSegments
            .FirstOrDefaultAsync(s => s.Name == "Valid JSON Criteria");
        Assert.That(savedSegment?.Criteria, Contains.Substring("IsActive"));
    }

    [Test]
    public async Task Database_ShouldTrackSegmentUsage_AndAnalytics()
    {
        // Arrange
        var segment = new MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Analytics Test",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1,
            LastUsed = DateTime.UtcNow,
            UsageCount = 0
        };

        _context.MemberSegments.Add(segment);
        await _context.SaveChangesAsync();

        // Act - Simulate segment usage
        segment.LastUsed = DateTime.UtcNow;
        segment.UsageCount++;
        await _context.SaveChangesAsync();

        // Assert
        var updatedSegment = await _context.MemberSegments.FindAsync(1);
        Assert.That(updatedSegment?.UsageCount, Is.EqualTo(1));
        Assert.That(updatedSegment?.LastUsed, Is.Not.Null);
    }

    [Test]
    public async Task Database_ShouldSoftDelete_Segments()
    {
        // Arrange
        var segment = new MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Soft Delete Test",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        _context.MemberSegments.Add(segment);
        await _context.SaveChangesAsync();

        // Act - Soft delete
        segment.IsActive = false;
        segment.DeletedAt = DateTime.UtcNow;
        segment.DeletedBy = 1;
        await _context.SaveChangesAsync();

        // Assert
        var softDeletedSegment = await _context.MemberSegments.FindAsync(1);
        Assert.That(softDeletedSegment?.IsActive, Is.False);
        Assert.That(softDeletedSegment?.DeletedAt, Is.Not.Null);

        // Verify it doesn't appear in active queries
        var activeSegments = await _context.MemberSegments
            .Where(s => s.IsActive)
            .ToListAsync();
        Assert.That(activeSegments.Any(s => s.Id == 1), Is.False);
    }
}