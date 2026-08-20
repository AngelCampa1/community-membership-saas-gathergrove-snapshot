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
using Moq;
using Xunit;

namespace GatherGrove.Tests.Application.Services;

/// <summary>
/// Comprehensive test suite for MemberTaggingService
/// Tests tag management and member tag assignment functionality
/// </summary>
public class MemberTaggingServiceTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly Mock<ILogger<MemberTaggingService>> _loggerMock;
    private readonly MemberTaggingService _service;

    public MemberTaggingServiceTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _loggerMock = new Mock<ILogger<MemberTaggingService>>();
        _service = new MemberTaggingService(_context, _loggerMock.Object);

        SeedTestData();
    }

    [Fact]
    public async Task GetTagsAsync_ValidClubId_ShouldReturnTags()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetTagsAsync(clubId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(t => t.ClubId == clubId).Should().BeTrue();
    }

    [Fact]
    public async Task GetTagsByIdAsync_ValidTagId_ShouldReturnTag()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetTagByIdAsync(clubId, tagId, userId);

        // Assert
        result.Should().NotBeNull();
        result.TagId.Should().Be(tagId);
        result.ClubId.Should().Be(clubId);
    }

    [Fact]
    public async Task GetTagByIdAsync_InvalidTagId_ShouldThrowException()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 999; // Non-existent
        const int userId = 1;

        // Act & Assert
        await _service.Invoking(s => s.GetTagByIdAsync(clubId, tagId, userId))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task CreateTagAsync_ValidRequest_ShouldCreateTag()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;
        var request = new CreateMemberTagRequest
        {
            TagName = "New Test Tag",
            Description = "Test description",
            Color = "#FF5733"
        };

        // Act
        var result = await _service.CreateTagAsync(clubId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.TagName.Should().Be(request.TagName);
        result.Description.Should().Be(request.Description);
        result.Color.Should().Be(request.Color);
        result.ClubId.Should().Be(clubId);
    }

    [Fact]
    public async Task CreateTagAsync_DuplicateTagName_ShouldThrowException()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;
        var request = new CreateMemberTagRequest
        {
            TagName = "VIP Member", // Already exists in test data
            Description = "Duplicate test",
            Color = "#FF5733"
        };

        // Act & Assert
        await _service.Invoking(s => s.CreateTagAsync(clubId, userId, request))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task UpdateTagAsync_ValidRequest_ShouldUpdateTag()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 1;
        const int userId = 1;
        var request = new UpdateMemberTagRequest
        {
            TagName = "Updated VIP Member",
            Description = "Updated description",
            Color = "#00FF00"
        };

        // Act
        var result = await _service.UpdateTagAsync(clubId, tagId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.TagName.Should().Be(request.TagName);
        result.Description.Should().Be(request.Description);
        result.Color.Should().Be(request.Color);
    }

    [Fact]
    public async Task DeleteTagAsync_ValidTagId_ShouldDeleteSuccessfully()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 2; // Tag without assignments
        const int userId = 1;

        // Act
        var result = await _service.DeleteTagAsync(clubId, tagId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify tag is actually deleted
        var tag = await _context.MemberTags.FindAsync(tagId);
        tag.Should().BeNull();
    }

    [Fact]
    public async Task DeleteTagAsync_TagWithAssignments_ShouldThrowException()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 1; // Tag with assignments
        const int userId = 1;

        // Act & Assert
        await _service.Invoking(s => s.DeleteTagAsync(clubId, tagId, userId))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*assigned to members*");
    }

    [Fact]
    public async Task AssignTagToMemberAsync_ValidRequest_ShouldAssignTag()
    {
        // Arrange
        const int clubId = 1;
        const int memberId = 1;
        const int tagId = 2;
        const int userId = 1;

        // Act
        var result = await _service.AssignTagToMemberAsync(clubId, memberId, tagId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify assignment exists
        var assignment = await _context.MemberTagAssignments
            .FirstOrDefaultAsync(a => a.MemberId == memberId && a.TagId == tagId);
        assignment.Should().NotBeNull();
        assignment.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task AssignTagToMemberAsync_DuplicateAssignment_ShouldReactivate()
    {
        // Arrange
        const int clubId = 1;
        const int memberId = 1;
        const int tagId = 1; // Already assigned but inactive
        const int userId = 1;

        // Make existing assignment inactive
        var existingAssignment = await _context.MemberTagAssignments
            .FirstOrDefaultAsync(a => a.MemberId == memberId && a.TagId == tagId);
        if (existingAssignment != null)
        {
            existingAssignment.IsActive = false;
            await _context.SaveChangesAsync();
        }

        // Act
        var result = await _service.AssignTagToMemberAsync(clubId, memberId, tagId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify assignment is reactivated
        var assignment = await _context.MemberTagAssignments
            .FirstOrDefaultAsync(a => a.MemberId == memberId && a.TagId == tagId);
        assignment.Should().NotBeNull();
        assignment.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveTagFromMemberAsync_ValidRequest_ShouldRemoveTag()
    {
        // Arrange
        const int clubId = 1;
        const int memberId = 1;
        const int tagId = 1;
        const int userId = 1;

        // Act
        var result = await _service.RemoveTagFromMemberAsync(clubId, memberId, tagId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify assignment is deactivated
        var assignment = await _context.MemberTagAssignments
            .FirstOrDefaultAsync(a => a.MemberId == memberId && a.TagId == tagId);
        assignment.Should().NotBeNull();
        assignment.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task GetMemberTagsAsync_ValidMemberId_ShouldReturnTags()
    {
        // Arrange
        const int clubId = 1;
        const int memberId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetMemberTagsAsync(clubId, memberId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(t => t.ClubId == clubId).Should().BeTrue();
    }

    [Fact]
    public async Task GetMembersWithTagAsync_ValidTagId_ShouldReturnMembers()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetMembersWithTagAsync(clubId, tagId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(m => m.ClubId == clubId).Should().BeTrue();
    }

    [Fact]
    public async Task BulkAssignTagsAsync_ValidRequest_ShouldAssignToAllMembers()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 2;
        const int userId = 1;
        var memberIds = new List<int> { 1, 2 };

        // Act
        var result = await _service.BulkAssignTagsAsync(clubId, memberIds, new List<int> { tagId }, userId);

        // Assert
        result.Should().BeGreaterThan(0);

        // Verify assignments exist
        var assignments = await _context.MemberTagAssignments
            .Where(a => memberIds.Contains(a.MemberId) && a.TagId == tagId && a.IsActive)
            .CountAsync();
        assignments.Should().Be(memberIds.Count);
    }

    [Fact]
    public async Task BulkRemoveTagsAsync_ValidRequest_ShouldRemoveFromAllMembers()
    {
        // Arrange
        const int clubId = 1;
        const int tagId = 1;
        const int userId = 1;
        var memberIds = new List<int> { 1 };

        // Act
        var result = await _service.BulkRemoveTagsAsync(clubId, memberIds, new List<int> { tagId }, userId);

        // Assert
        result.Should().BeGreaterThan(0);

        // Verify assignments are deactivated
        var activeAssignments = await _context.MemberTagAssignments
            .Where(a => memberIds.Contains(a.MemberId) && a.TagId == tagId && a.IsActive)
            .CountAsync();
        activeAssignments.Should().Be(0);
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

        // Create test members
        var member1 = new Member
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 1",
            Email = "member1@example.com"
        };
        var member2 = new Member
        {
            Id = 2,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 2",
            Email = "member2@example.com"
        };
        _context.Members.AddRange(member1, member2);

        // Create test membership type
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            TypeName = "Standard",
            MembershipFee = 50.0m
        };
        _context.MembershipTypes.Add(membershipType);

        // Create test tags
        var tag1 = new MemberTag
        {
            Id = 1,
            ClubId = 1,
            Name = "VIP Member",
            Description = "High-value member",
            Color = "#FF0000",
            CreatedByUserId = 1
        };
        var tag2 = new MemberTag
        {
            Id = 2,
            ClubId = 1,
            Name = "Active",
            Description = "Active member",
            Color = "#00FF00",
            CreatedByUserId = 1
        };
        _context.MemberTags.AddRange(tag1, tag2);

        // Create test tag assignment
        var assignment = new MemberTagAssignment
        {
            Id = 1,
            MemberId = 1,
            TagId = 1,
            AssignedByUserId = 1,
            AssignedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.MemberTagAssignments.Add(assignment);

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