using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace GatherGrove.Tests.Application.Services;

/// <summary>
/// Comprehensive test suite for MemberSegmentationService
/// Tests segment creation, criteria evaluation, and member filtering
/// </summary>
public class MemberSegmentationServiceTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly Mock<ILogger<MemberSegmentationService>> _loggerMock;
    private readonly Mock<IMemoryCache> _cacheMock;
    private readonly MemberSegmentationService _service;

    public MemberSegmentationServiceTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _loggerMock = new Mock<ILogger<MemberSegmentationService>>();
        _cacheMock = new Mock<IMemoryCache>();
        _service = new MemberSegmentationService(_context, _cacheMock.Object, _loggerMock.Object);

        SeedTestData();
    }

    [Fact]
    public async Task GetSegmentsAsync_ValidClubId_ShouldReturnSegments()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetSegmentsAsync(clubId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(s => s.ClubId == clubId).Should().BeTrue();
    }

    [Fact]
    public async Task GetSegmentByIdAsync_ValidSegmentId_ShouldReturnSegment()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetSegmentByIdAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.SegmentId.Should().Be(segmentId);
        result.ClubId.Should().Be(clubId);
    }

    [Fact]
    public async Task CreateSegmentAsync_ValidRequest_ShouldCreateSegment()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;
        var request = new CreateMemberSegmentRequest
        {
            Name = "High Value Members",
            Description = "Members with high lifetime value",
            FilterCriteria = new SegmentFilterCriteria
            {
                Rules = new List<SegmentRule>
                {
                    new SegmentRule
                    {
                        FieldName = "TotalPaid",
                        Operator = "GREATER_THAN",
                        Value = "1000"
                    }
                }
            }
        };

        // Act
        var result = await _service.CreateSegmentAsync(clubId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(request.Name);
        result.Description.Should().Be(request.Description);
        result.ClubId.Should().Be(clubId);
    }

    [Fact]
    public async Task CreateSegmentAsync_DuplicateSegmentName_ShouldThrowException()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;
        var request = new CreateMemberSegmentRequest
        {
            Name = "Active Members", // Already exists in test data
            Description = "Duplicate segment test"
        };

        // Act & Assert
        await _service.Invoking(s => s.CreateSegmentAsync(clubId, userId, request))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task UpdateSegmentAsync_ValidRequest_ShouldUpdateSegment()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;
        var request = new UpdateMemberSegmentRequest
        {
            Name = "Updated Active Members",
            Description = "Updated description",
            FilterCriteria = new SegmentFilterCriteria
            {
                Rules = new List<SegmentRule>
                {
                    new SegmentRule
                    {
                        FieldName = "LastEventAttendance",
                        Operator = "GREATER_THAN",
                        Value = "30"
                    }
                }
            }
        };

        // Act
        var result = await _service.UpdateSegmentAsync(clubId, segmentId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(request.Name);
        result.Description.Should().Be(request.Description);
    }

    [Fact]
    public async Task DeleteSegmentAsync_ValidSegmentId_ShouldDeleteSuccessfully()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 2; // Segment without dependencies
        const int userId = 1;

        // Act
        var result = await _service.DeleteSegmentAsync(clubId, segmentId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify segment is actually deleted
        var segment = await _context.MemberSegments.FindAsync(segmentId);
        segment.Should().BeNull();
    }

    [Fact]
    public async Task CalculateSegmentMembersAsync_ValidSegmentId_ShouldCalculateAndCache()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.CalculateSegmentMembersAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.SegmentId.Should().Be(segmentId);
        result.MemberCount.Should().BeGreaterThan(0);
        result.Members.Should().NotBeEmpty();

        // Verify cache is populated
        var cachedMembers = await _context.MemberSegmentCache
            .Where(c => c.SegmentId == segmentId && c.IsIncluded)
            .ToListAsync();
        cachedMembers.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetSegmentMembersAsync_ValidSegmentId_ShouldReturnCachedMembers()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // First calculate to populate cache
        await _service.CalculateSegmentMembersAsync(clubId, segmentId, userId);

        // Act
        var result = await _service.GetSegmentMembersAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(m => m.ClubId == clubId).Should().BeTrue();
    }

    [Fact]
    public async Task EvaluateSegmentRulesAsync_SimpleRule_ShouldFilterCorrectly()
    {
        // Arrange
        const int clubId = 1;
        var filterCriteria = new SegmentFilterCriteria
        {
            Rules = new List<SegmentRule>
            {
                new SegmentRule
                {
                    FieldName = "FullName",
                    Operator = "CONTAINS",
                    Value = "Member 1"
                }
            }
        };

        // Act
        var result = await _service.EvaluateSegmentRulesAsync(clubId, filterCriteria);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().FullName.Should().Contain("Member 1");
    }

    [Fact]
    public async Task EvaluateSegmentRulesAsync_MultipleRulesWithAnd_ShouldCombineCorrectly()
    {
        // Arrange
        const int clubId = 1;
        var filterCriteria = new SegmentFilterCriteria
        {
            LogicalOperator = "AND",
            Rules = new List<SegmentRule>
            {
                new SegmentRule
                {
                    FieldName = "MembershipTypeId",
                    Operator = "EQUALS",
                    Value = "1",
                    LogicalOperator = "AND"
                },
                new SegmentRule
                {
                    FieldName = "IsActive",
                    Operator = "EQUALS",
                    Value = "true"
                }
            }
        };

        // Act
        var result = await _service.EvaluateSegmentRulesAsync(clubId, filterCriteria);

        // Assert
        result.Should().NotBeNull();
        result.All(m => m.MembershipTypeId == 1).Should().BeTrue();
        result.All(m => m.IsActive).Should().BeTrue();
    }

    [Theory]
    [InlineData("EQUALS", "Member 1", true)]
    [InlineData("NOT_EQUALS", "Member 2", true)]
    [InlineData("CONTAINS", "Member", true)]
    [InlineData("NOT_CONTAINS", "NonExistent", true)]
    [InlineData("STARTS_WITH", "Test", true)]
    [InlineData("ENDS_WITH", "1", true)]
    public async Task EvaluateSegmentRulesAsync_StringOperators_ShouldWorkCorrectly(string operatorType, string value, bool shouldMatch)
    {
        // Arrange
        const int clubId = 1;
        var filterCriteria = new SegmentFilterCriteria
        {
            Rules = new List<SegmentRule>
            {
                new SegmentRule
                {
                    FieldName = "FullName",
                    Operator = operatorType,
                    Value = value
                }
            }
        };

        // Act
        var result = await _service.EvaluateSegmentRulesAsync(clubId, filterCriteria);

        // Assert
        if (shouldMatch)
        {
            result.Should().NotBeEmpty();
        }
        else
        {
            result.Should().BeEmpty();
        }
    }

    [Theory]
    [InlineData("GREATER_THAN", "0", true)]
    [InlineData("LESS_THAN", "999", true)]
    [InlineData("GREATER_THAN_OR_EQUAL", "1", true)]
    [InlineData("LESS_THAN_OR_EQUAL", "2", true)]
    public async Task EvaluateSegmentRulesAsync_NumericOperators_ShouldWorkCorrectly(string operatorType, string value, bool shouldMatch)
    {
        // Arrange
        const int clubId = 1;
        var filterCriteria = new SegmentFilterCriteria
        {
            Rules = new List<SegmentRule>
            {
                new SegmentRule
                {
                    FieldName = "MembershipTypeId",
                    Operator = operatorType,
                    Value = value
                }
            }
        };

        // Act
        var result = await _service.EvaluateSegmentRulesAsync(clubId, filterCriteria);

        // Assert
        if (shouldMatch)
        {
            result.Should().NotBeEmpty();
        }
        else
        {
            result.Should().BeEmpty();
        }
    }

    [Fact]
    public async Task RefreshSegmentCacheAsync_ValidSegmentId_ShouldUpdateCache()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.RefreshSegmentCacheAsync(clubId, segmentId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify segment last calculated is updated
        var segment = await _context.MemberSegments.FindAsync(segmentId);
        segment.Should().NotBeNull();
        segment.LastCalculated.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));
    }

    [Fact]
    public async Task GetSegmentPerformanceAsync_ValidSegmentId_ShouldReturnMetrics()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // First calculate segment to populate cache
        await _service.CalculateSegmentMembersAsync(clubId, segmentId, userId);

        // Act
        var result = await _service.GetSegmentPerformanceAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.SegmentId.Should().Be(segmentId);
        result.MemberCount.Should().BeGreaterThan(0);
        result.CalculationTimeMs.Should().BeGreaterThan(0);
    }

    private void SeedTestData()
    {
        // Create test club
        var club = new Club
        {
            Id = 1,
            ClubName = "Test Club",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);

        // Create test user
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            FullName = "Test User"
        };
        _context.Users.Add(user);

        // Create test membership type
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            TypeName = "Standard",
            MembershipFee = 50.0m
        };
        _context.MembershipTypes.Add(membershipType);

        // Create test members
        var member1 = new Member
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 1",
            Email = "member1@example.com",
            IsActive = true
        };
        var member2 = new Member
        {
            Id = 2,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 2",
            Email = "member2@example.com",
            IsActive = true
        };
        _context.Members.AddRange(member1, member2);

        // Create test segments
        var segment1 = new MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Active Members",
            Description = "Members who are currently active",
            FilterCriteria = "{\"rules\":[{\"fieldName\":\"IsActive\",\"operator\":\"EQUALS\",\"value\":\"true\"}]}",
            CreatedByUserId = 1
        };
        var segment2 = new MemberSegment
        {
            Id = 2,
            ClubId = 1,
            Name = "Inactive Members",
            Description = "Members who are inactive",
            FilterCriteria = "{\"rules\":[{\"fieldName\":\"IsActive\",\"operator\":\"EQUALS\",\"value\":\"false\"}]}",
            CreatedByUserId = 1
        };
        _context.MemberSegments.AddRange(segment1, segment2);

        // Create club admin relationship
        var clubAdmin = new ClubAdmin
        {
            ClubId = 1,
            UserId = 1
        };
        _context.ClubAdmins.Add(clubAdmin);

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}