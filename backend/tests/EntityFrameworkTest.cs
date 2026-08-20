using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using Xunit;

namespace GatherGrove.Tests;

public class EntityFrameworkTest : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly ServiceProvider _serviceProvider;

    public EntityFrameworkTest()
    {
        var services = new ServiceCollection();
        services.AddDbContext<GatherGroveDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<GatherGroveDbContext>();
    }

    [Fact]
    public async Task CanCreateMemberEngagementScore()
    {
        // Test that new engagement score entities work with EF
        var score = new MemberEngagementScore
        {
            MemberId = 1,
            ClubId = 1,
            OverallScore = 75.5m,
            LoginScore = 80m,
            EventScore = 70m,
            CommunicationScore = 65m,
            FeatureUsageScore = 85m,
            ProfileCompletenessScore = 90m,
            EngagementLevel = "High",
            CalculatedDate = DateTime.UtcNow.Date
        };

        _context.MemberEngagementScores.Add(score);
        await _context.SaveChangesAsync();

        var savedScore = await _context.MemberEngagementScores.FirstAsync();
        Assert.Equal(1, savedScore.MemberId);
        Assert.Equal(75.5m, savedScore.OverallScore);
    }

    [Fact]
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
        Assert.Equal("Dashboard", savedUsage.FeatureName);
    }

    public void Dispose()
    {
        _context?.Dispose();
        _serviceProvider?.Dispose();
    }
}