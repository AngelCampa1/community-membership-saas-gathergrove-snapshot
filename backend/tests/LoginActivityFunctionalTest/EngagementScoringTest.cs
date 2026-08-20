using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;

namespace LoginActivityFunctionalTest;

[TestFixture]
public class EngagementScoringTest
{
    private GatherGroveDbContext _context;
    private EngagementScoringService _service;
    private Mock<ILogger<EngagementScoringService>> _loggerMock;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _loggerMock = new Mock<ILogger<EngagementScoringService>>();
        _service = new EngagementScoringService(_context, _loggerMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    [Test]
    public async Task CalculateEngagementScore_ShouldReturnValidScore()
    {
        // Arrange
        var member = new Member { Id = 1, ClubId = 1, FullName = "Test User", Email = "test@example.com" };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var score = await _service.CalculateEngagementScoreAsync(1);

        // Assert
        Assert.That(score, Is.GreaterThanOrEqualTo(0));
        Assert.That(score, Is.LessThanOrEqualTo(100));
    }

    [Test]
    public void DetermineEngagementLevel_ShouldReturnCorrectLevels()
    {
        // Act & Assert
        Assert.That(_service.DetermineEngagementLevel(80m), Is.EqualTo(EngagementLevel.Green));
        Assert.That(_service.DetermineEngagementLevel(50m), Is.EqualTo(EngagementLevel.Yellow));
        Assert.That(_service.DetermineEngagementLevel(30m), Is.EqualTo(EngagementLevel.Red));
    }

    [Test]
    public void GetScoreWeights_ShouldReturnValidWeights()
    {
        // Act
        var weights = _service.GetScoreWeights();

        // Assert
        Assert.That(weights.Values.Sum(), Is.EqualTo(1.0m));
        Assert.That(weights.ContainsKey("Login"), Is.True);
        Assert.That(weights.ContainsKey("Event"), Is.True);
        Assert.That(weights.ContainsKey("Communication"), Is.True);
        Assert.That(weights.ContainsKey("FeatureUsage"), Is.True);
        Assert.That(weights.ContainsKey("ProfileCompleteness"), Is.True);
    }
}