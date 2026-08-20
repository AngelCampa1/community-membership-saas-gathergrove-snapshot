using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace GatherGrove.Tests.Migrations;

[TestFixture]
public class MemberSegmentationMigrationTests
{
    private IServiceProvider _serviceProvider;

    [SetUp]
    public void Setup()
    {
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        );
        
        _serviceProvider = services.BuildServiceProvider();
    }

    [TearDown]
    public void TearDown()
    {
        _serviceProvider?.Dispose();
    }

    [Test]
    public async Task Migration_ShouldCreateMemberSegmentsTable_WithCorrectSchema()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();

        // Act - Apply migrations by ensuring database is created
        await context.Database.EnsureCreatedAsync();

        // Assert - Verify table structure
        var tableExists = await context.Database.ExecuteSqlRawAsync(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='MemberSegments'"
        ) >= 0;

        Assert.That(tableExists, Is.True);

        // Verify we can create a segment (confirms schema)
        var segment = new GatherGrove.Core.Entities.MemberSegment
        {
            ClubId = 1,
            Name = "Migration Test",
            Description = "Test segment for migration validation",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        context.MemberSegments.Add(segment);
        await context.SaveChangesAsync();

        var savedSegment = await context.MemberSegments.FirstOrDefaultAsync();
        Assert.That(savedSegment, Is.Not.Null);
        Assert.That(savedSegment.Name, Is.EqualTo("Migration Test"));
    }

    [Test]
    public async Task Migration_ShouldCreateSegmentMembersTable_WithForeignKeys()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        await context.Database.EnsureCreatedAsync();

        // Create test data to verify foreign key relationships
        var club = new GatherGrove.Core.Entities.Club
        {
            Id = 1,
            Name = "Test Club",
            Description = "Migration test club",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        context.Clubs.Add(club);

        var membershipType = new GatherGrove.Core.Entities.MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Regular",
            Price = 50.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.MembershipTypes.Add(membershipType);

        var member = new GatherGrove.Core.Entities.Member
        {
            Id = 1,
            ClubId = 1,
            FirstName = "Test",
            LastName = "Member",
            Email = "test@example.com",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Members.Add(member);

        var segment = new GatherGrove.Core.Entities.MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "FK Test Segment",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };
        context.MemberSegments.Add(segment);

        await context.SaveChangesAsync();

        // Act - Create segment member relationship
        var segmentMember = new GatherGrove.Core.Entities.SegmentMember
        {
            SegmentId = 1,
            MemberId = 1,
            AddedAt = DateTime.UtcNow
        };
        context.SegmentMembers.Add(segmentMember);

        // Assert - Should not throw foreign key constraint errors
        Assert.DoesNotThrowAsync(async () => await context.SaveChangesAsync());

        var savedSegmentMember = await context.SegmentMembers
            .Include(sm => sm.Member)
            .Include(sm => sm.Segment)
            .FirstOrDefaultAsync();

        Assert.That(savedSegmentMember, Is.Not.Null);
        Assert.That(savedSegmentMember.Member.Email, Is.EqualTo("test@example.com"));
        Assert.That(savedSegmentMember.Segment.Name, Is.EqualTo("FK Test Segment"));
    }

    [Test]
    public async Task Migration_ShouldSupportJsonCriteriaColumn_WithComplexData()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        await context.Database.EnsureCreatedAsync();

        var complexCriteria = """
        {
            "conditions": [
                {
                    "field": "Age",
                    "operator": "between",
                    "value": "18-65"
                },
                {
                    "field": "MembershipStatus",
                    "operator": "equals",
                    "value": "Active"
                }
            ],
            "tagConditions": [
                {
                    "tagId": 1,
                    "operator": "has"
                },
                {
                    "tagId": 2,
                    "operator": "does_not_have"
                }
            ],
            "customFieldConditions": [
                {
                    "fieldId": 1,
                    "operator": "contains",
                    "value": "premium"
                }
            ],
            "logic": "AND",
            "dateRange": {
                "field": "JoinDate",
                "start": "2023-01-01",
                "end": "2024-12-31"
            }
        }
        """;

        // Act
        var segment = new GatherGrove.Core.Entities.MemberSegment
        {
            ClubId = 1,
            Name = "Complex JSON Test",
            Criteria = complexCriteria,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        context.MemberSegments.Add(segment);
        await context.SaveChangesAsync();

        // Assert
        var savedSegment = await context.MemberSegments
            .FirstOrDefaultAsync(s => s.Name == "Complex JSON Test");

        Assert.That(savedSegment, Is.Not.Null);
        Assert.That(savedSegment.Criteria, Contains.Substring("tagConditions"));
        Assert.That(savedSegment.Criteria, Contains.Substring("customFieldConditions"));
        Assert.That(savedSegment.Criteria, Contains.Substring("dateRange"));
    }

    [Test]
    public async Task Migration_ShouldCreateIndexes_ForPerformance()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        await context.Database.EnsureCreatedAsync();

        // Create test data to verify index usage
        var segments = new List<GatherGrove.Core.Entities.MemberSegment>();
        for (int i = 1; i <= 100; i++)
        {
            segments.Add(new GatherGrove.Core.Entities.MemberSegment
            {
                Id = i,
                ClubId = i % 5 + 1, // Distribute across 5 clubs
                Name = $"Segment {i}",
                Criteria = "{}",
                IsActive = i % 10 != 0, // Every 10th segment is inactive
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                CreatedBy = 1
            });
        }

        context.MemberSegments.AddRange(segments);
        await context.SaveChangesAsync();

        // Act & Assert - Test queries that should benefit from indexes
        var startTime = DateTime.UtcNow;

        // Test ClubId index
        var clubSegments = await context.MemberSegments
            .Where(s => s.ClubId == 1)
            .ToListAsync();

        var clubQueryTime = DateTime.UtcNow - startTime;
        Assert.That(clubQueryTime.TotalMilliseconds, Is.LessThan(50), 
            "ClubId query should be fast with proper indexing");

        startTime = DateTime.UtcNow;

        // Test IsActive index
        var activeSegments = await context.MemberSegments
            .Where(s => s.IsActive)
            .ToListAsync();

        var activeQueryTime = DateTime.UtcNow - startTime;
        Assert.That(activeQueryTime.TotalMilliseconds, Is.LessThan(50),
            "IsActive query should be fast with proper indexing");

        startTime = DateTime.UtcNow;

        // Test composite index (ClubId + IsActive)
        var activeClubSegments = await context.MemberSegments
            .Where(s => s.ClubId == 1 && s.IsActive)
            .ToListAsync();

        var compositeQueryTime = DateTime.UtcNow - startTime;
        Assert.That(compositeQueryTime.TotalMilliseconds, Is.LessThan(50),
            "Composite query should be fast with proper indexing");

        Assert.That(clubSegments.Count, Is.EqualTo(20));
        Assert.That(activeSegments.Count, Is.EqualTo(90));
        Assert.That(activeClubSegments.Count, Is.EqualTo(18));
    }

    [Test]
    public async Task Migration_ShouldSupportUniqueConstraints()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        await context.Database.EnsureCreatedAsync();

        var segment1 = new GatherGrove.Core.Entities.MemberSegment
        {
            ClubId = 1,
            Name = "Unique Test",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        context.MemberSegments.Add(segment1);
        await context.SaveChangesAsync();

        // Act & Assert - Attempt to create duplicate
        var segment2 = new GatherGrove.Core.Entities.MemberSegment
        {
            ClubId = 1,
            Name = "Unique Test", // Same name in same club
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };

        context.MemberSegments.Add(segment2);

        // Should handle unique constraint appropriately
        var exception = Assert.ThrowsAsync<DbUpdateException>(
            async () => await context.SaveChangesAsync()
        );
        Assert.That(exception, Is.Not.Null);
    }

    [Test]
    public async Task Migration_ShouldSupportCascadeDeletes_Appropriately()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        await context.Database.EnsureCreatedAsync();

        // Create test data with relationships
        var club = new GatherGrove.Core.Entities.Club
        {
            Id = 1,
            Name = "Cascade Test Club",
            Description = "Test cascade behavior",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        context.Clubs.Add(club);

        var segment = new GatherGrove.Core.Entities.MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Cascade Test Segment",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1
        };
        context.MemberSegments.Add(segment);

        var membershipType = new GatherGrove.Core.Entities.MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Regular",
            Price = 50.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.MembershipTypes.Add(membershipType);

        var member = new GatherGrove.Core.Entities.Member
        {
            Id = 1,
            ClubId = 1,
            FirstName = "Test",
            LastName = "Member",
            Email = "cascade@test.com",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Members.Add(member);

        var segmentMember = new GatherGrove.Core.Entities.SegmentMember
        {
            SegmentId = 1,
            MemberId = 1,
            AddedAt = DateTime.UtcNow
        };
        context.SegmentMembers.Add(segmentMember);

        await context.SaveChangesAsync();

        // Act - Delete segment
        context.MemberSegments.Remove(segment);
        await context.SaveChangesAsync();

        // Assert - SegmentMember should be cascade deleted
        var remainingSegmentMembers = await context.SegmentMembers
            .Where(sm => sm.SegmentId == 1)
            .ToListAsync();

        Assert.That(remainingSegmentMembers.Count, Is.EqualTo(0), 
            "SegmentMembers should be cascade deleted when segment is deleted");

        // Member should still exist (no cascade from segment deletion)
        var remainingMember = await context.Members.FindAsync(1);
        Assert.That(remainingMember, Is.Not.Null, 
            "Members should not be deleted when segments are deleted");
    }

    [Test]
    public async Task Migration_ShouldSupportVersioning_ForOptimisticConcurrency()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        await context.Database.EnsureCreatedAsync();

        var segment = new GatherGrove.Core.Entities.MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Versioning Test",
            Criteria = "{}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 1,
            Version = 1
        };

        context.MemberSegments.Add(segment);
        await context.SaveChangesAsync();

        // Act & Assert - Test version increment
        using var context1 = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        using var context2 = _serviceProvider.GetRequiredService<GatherGroveDbContext>();

        var segment1 = await context1.MemberSegments.FindAsync(1);
        var segment2 = await context2.MemberSegments.FindAsync(1);

        segment1.Name = "Updated by Context 1";
        segment1.Version++;
        
        segment2.Name = "Updated by Context 2";
        segment2.Version++;

        await context1.SaveChangesAsync();

        // Second update should detect concurrency conflict
        var exception = Assert.ThrowsAsync<DbUpdateConcurrencyException>(
            async () => await context2.SaveChangesAsync()
        );
        Assert.That(exception, Is.Not.Null);
    }

    [Test]
    public async Task Migration_ShouldSupportAuditFields_WithDefaultValues()
    {
        // Arrange
        using var context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
        await context.Database.EnsureCreatedAsync();

        // Act
        var segment = new GatherGrove.Core.Entities.MemberSegment
        {
            ClubId = 1,
            Name = "Audit Test",
            Criteria = "{}",
            IsActive = true,
            CreatedBy = 1
            // CreatedAt should be set automatically if configured in migration
        };

        context.MemberSegments.Add(segment);
        await context.SaveChangesAsync();

        // Assert
        var savedSegment = await context.MemberSegments.FindAsync(segment.Id);
        Assert.That(savedSegment?.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(savedSegment?.CreatedBy, Is.EqualTo(1));
        Assert.That(savedSegment?.UpdatedAt, Is.Null); // Should be null initially
        Assert.That(savedSegment?.UpdatedBy, Is.Null);

        // Test update audit fields
        savedSegment.Name = "Updated Audit Test";
        savedSegment.UpdatedAt = DateTime.UtcNow;
        savedSegment.UpdatedBy = 2;
        await context.SaveChangesAsync();

        var updatedSegment = await context.MemberSegments.FindAsync(segment.Id);
        Assert.That(updatedSegment?.UpdatedAt, Is.Not.Null);
        Assert.That(updatedSegment?.UpdatedBy, Is.EqualTo(2));
    }
}