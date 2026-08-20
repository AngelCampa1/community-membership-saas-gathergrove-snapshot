using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.Integration;

public class LoginActivityEntityTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly ServiceProvider _serviceProvider;

    public LoginActivityEntityTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
    }

    [Test]
    public async Task CanCreateMemberEngagementScore()
    {
        // Test that new Login Activity entities work with EF
        var score = new MemberEngagementScore
        {
            MemberId = 1,
            ClubId = 1,
            OverallScore = 75.5m,
            LoginScore = 80m,
            EventScore = 70m,
            LoginCount7Days = 5,
            LoginCount30Days = 15,
            ActivityLevel = "HighlyActive",
            IsAtRisk = false,
            LastLoginDate = DateTime.UtcNow,
            EngagementLevel = "High",
            CalculatedDate = DateTime.UtcNow.Date
        };

        _context.MemberEngagementScores.Add(score);
        await _context.SaveChangesAsync();

        var savedScore = await _context.MemberEngagementScores.FirstAsync();
        Assert.That(savedScore.MemberId, Is.EqualTo(1));
        Assert.That(savedScore.OverallScore, Is.EqualTo(75.5m));
        Assert.That(savedScore.ActivityLevel, Is.EqualTo("HighlyActive"));
    }

    [Test]
    public async Task CanCreateFeatureUsageEvent()
    {
        var usage = new FeatureUsageEvent
        {
            MemberId = 1,
            ClubId = 1,
            FeatureName = "Dashboard",
            Platform = "web",
            SessionId = "test-session",
            UsedAt = DateTime.UtcNow,
            EngagementWeight = 1.5m
        };

        _context.FeatureUsageEvents.Add(usage);
        await _context.SaveChangesAsync();

        var savedUsage = await _context.FeatureUsageEvents.FirstAsync();
        Assert.That(savedUsage.FeatureName, Is.EqualTo("Dashboard"));
        Assert.That(savedUsage.EngagementWeight, Is.EqualTo(1.5m));
    }

    [Test]
    public async Task CanQueryMemberEngagementScores()
    {
        // Clear any existing data to avoid contamination
        _context.MemberEngagementScores.RemoveRange(_context.MemberEngagementScores);
        await _context.SaveChangesAsync();

        // Add test data
        var scores = new List<MemberEngagementScore>
        {
            new()
            {
                MemberId = 1,
                ClubId = 1,
                OverallScore = 85m,
                ActivityLevel = "HighlyActive",
                IsAtRisk = false,
                CalculatedDate = DateTime.UtcNow.Date,
                EngagementLevel = "High"
            },
            new()
            {
                MemberId = 2,
                ClubId = 1,
                OverallScore = 25m,
                ActivityLevel = "Inactive",
                IsAtRisk = true,
                CalculatedDate = DateTime.UtcNow.Date,
                EngagementLevel = "Low"
            }
        };

        _context.MemberEngagementScores.AddRange(scores);
        await _context.SaveChangesAsync();

        // Test querying
        var activeMembers = await _context.MemberEngagementScores
            .Where(s => s.ActivityLevel == "HighlyActive")
            .ToListAsync();

        var atRiskMembers = await _context.MemberEngagementScores
            .Where(s => s.IsAtRisk)
            .ToListAsync();

        Assert.That(activeMembers.Count, Is.EqualTo(1));
        Assert.That(atRiskMembers.Count, Is.EqualTo(1));
        Assert.That(activeMembers.First().MemberId, Is.EqualTo(1));
        Assert.That(atRiskMembers.First().MemberId, Is.EqualTo(2));
    }

    public void Dispose()
    {
        _context?.Dispose();
        _serviceProvider?.Dispose();
    }
}