using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// TDD Tests for Advanced Analytics Repository (US-004)
/// Tests complex data access patterns for premium analytics features
/// </summary>
public class AdvancedAnalyticsRepositoryTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly AdvancedAnalyticsRepository _repository;

    public AdvancedAnalyticsRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _repository = new AdvancedAnalyticsRepository(_context);

        SeedTestData();
    }

    private void SeedTestData()
    {
        // Create test club
        var club = new Club
        {
            Id = 1,
            Name = "Analytics Test Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow.AddMonths(-12)
        };
        _context.Clubs.Add(club);

        // Create members with different join dates for cohort analysis
        var members = new List<Member>();
        var random = new Random(42); // Fixed seed for consistent tests

        for (int i = 1; i <= 50; i++)
        {
            members.Add(new Member
            {
                Id = i,
                ClubId = 1,
                FullName = $"Test Member {i}",
                EmailAddress = $"member{i}@test.com",
                Status = "Active",
                JoinedAt = DateTime.UtcNow.AddDays(-300 + (i * 5)) // Staggered join dates
            });
        }
        _context.Members.AddRange(members);

        // Create events spanning multiple months
        var events = new List<Event>();
        for (int i = 1; i <= 30; i++)
        {
            events.Add(new Event
            {
                Id = i,
                ClubId = 1,
                Name = $"Analytics Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(-180 + (i * 5)),
                CreatedAt = DateTime.UtcNow.AddDays(-185 + (i * 5))
            });
        }
        _context.Events.AddRange(events);

        // Create comprehensive engagement tracking data
        var trackings = new List<EventEngagementTracking>();
        foreach (var eventItem in events)
        {
            var attendeeCount = random.Next(10, 30);
            var selectedMembers = members.OrderBy(x => random.Next()).Take(attendeeCount);

            foreach (var member in selectedMembers)
            {
                trackings.Add(new EventEngagementTracking
                {
                    EventId = eventItem.Id,
                    MemberId = member.Id,
                    RegistrationStatus = "registered",
                    AttendanceStatus = random.NextDouble() > 0.15 ? "attended" : "no_show",
                    InteractionCount = random.Next(0, 25),
                    ParticipationScore = (decimal)(20 + random.NextDouble() * 80),
                    SessionDurationMinutes = random.Next(30, 150),
                    SatisfactionRating = (decimal)(2.5 + random.NextDouble() * 2.5),
                    NetPromoterScore = random.Next(-10, 11),
                    QuestionsAsked = random.Next(0, 5),
                    PollsParticipated = random.Next(0, 8),
                    NetworkingConnections = random.Next(0, 12),
                    ResourcesDownloaded = random.Next(0, 3),
                    PostEventSurveyCompleted = random.NextDouble() > 0.3,
                    CreatedAt = eventItem.EventDateTime,
                    UpdatedAt = eventItem.EventDateTime
                });
            }
        }
        _context.EventEngagementTrackings.AddRange(trackings);

        // Create member engagement scores
        var memberScores = new List<MemberEventEngagementScores>();
        foreach (var member in members)
        {
            var memberTrackings = trackings.Where(t => t.MemberId == member.Id).ToList();
            memberScores.Add(new MemberEventEngagementScores
            {
                MemberId = member.Id,
                TotalEventsAttended = memberTrackings.Count(t => t.AttendanceStatus == "attended"),
                EventAttendanceRate = memberTrackings.Any() 
                    ? (decimal)memberTrackings.Count(t => t.AttendanceStatus == "attended") / memberTrackings.Count * 100
                    : 0m,
                AverageEventEngagementScore = memberTrackings.Any()
                    ? memberTrackings.Average(t => t.ParticipationScore)
                    : 0m,
                AverageSatisfactionRating = memberTrackings.Any()
                    ? (double)memberTrackings.Where(t => t.SatisfactionRating.HasValue)
                        .Average(t => t.SatisfactionRating!.Value)
                    : 0.0,
                Recent90DayEvents = memberTrackings.Count(t => t.CreatedAt >= DateTime.UtcNow.AddDays(-90) && t.AttendanceStatus == "attended"),
                EngagementTrend = random.Next(3) switch
                {
                    0 => "improving",
                    1 => "stable",
                    _ => "declining"
                },
                RiskLevel = random.Next(3) switch
                {
                    0 => "low",
                    1 => "medium",
                    _ => "high"
                },
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow
            });
        }
        _context.MemberEventEngagementScores.AddRange(memberScores);

        _context.SaveChanges();
    }

    #region Complex Query Performance Tests (RED Phase)

    [Test]
    public async Task GetEngagementTrendDataAsync_WithLargeDateRange_ShouldCompleteWithinThreeSeconds()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-365);
        var endDate = DateTime.UtcNow;

        // Act
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var result = await _repository.GetEngagementTrendDataAsync(clubId, startDate, endDate);
        stopwatch.Stop();

        // Assert - Must complete within 3 seconds (requirement)
        Assert.True(stopwatch.ElapsedMilliseconds < 3000,
            $"Query took {stopwatch.ElapsedMilliseconds}ms, exceeding 3 second limit");
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count > 0, Is.True);
    }

    [Test]
    public async Task GetEngagementTrendDataAsync_WithExtendedRange_ShouldReturnDailyAggregates()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _repository.GetEngagementTrendDataAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count > 0, Is.True);
        
        // Should have daily data points
        Assert.All(result, trend =>
        {
            Assert.That(trend.Date >= startDate.Date, Is.True);
            Assert.That(trend.Date <= endDate.Date, Is.True);
            Assert.That(trend.EngagementScore >= 0, Is.True);
            Assert.That(trend.AttendeeCount >= 0, Is.True);
            Assert.That(trend.AttendanceRate >= 0 && trend.AttendanceRate <= 100, Is.True);
        });

        // Should be ordered by date
        var sortedResult = result.OrderBy(r => r.Date).ToList();
        Assert.Equal(sortedResult, result);
    }

    #endregion

    #region Cohort Analysis Query Tests (RED Phase)

    [Test]
    public async Task GetCohortRetentionDataAsync_WithMonthlyGrouping_ShouldReturnCohortMetrics()
    {
        // Arrange
        var clubId = 1;
        var analysisStartDate = DateTime.UtcNow.AddDays(-180);
        var analysisEndDate = DateTime.UtcNow;

        // Act
        var result = await _repository.GetCohortRetentionDataAsync(clubId, analysisStartDate, analysisEndDate, "monthly");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count > 0, Is.True);
        
        // Each cohort should have valid metrics
        Assert.All(result, cohort =>
        {
            Assert.That(cohort.Size > 0, Is.True);
            Assert.That(cohort.RetentionRate >= 0 && cohort.RetentionRate <= 100, Is.True);
            Assert.That(cohort.EngagementScore >= 0, Is.True);
            Assert.NotEmpty(cohort.CohortId);
        });
    }

    [Test]
    public async Task GetCohortRetentionDataAsync_WithQuarterlyGrouping_ShouldGroupByQuarter()
    {
        // Arrange
        var clubId = 1;
        var analysisStartDate = DateTime.UtcNow.AddDays(-365);
        var analysisEndDate = DateTime.UtcNow;

        // Act
        var result = await _repository.GetCohortRetentionDataAsync(clubId, analysisStartDate, analysisEndDate, "quarterly");

        // Assert
        Assert.That(result, Is.Not.Null);
        
        // Should have quarterly cohort IDs (YYYY-Q1, YYYY-Q2, etc.)
        if (result.Any())
        {
            Assert.All(result, cohort =>
            {
                Assert.Contains("Q", cohort.CohortId);
            });
        }
    }

    [Test]
    public async Task GetCohortRetentionDataAsync_WithMinimumSize_ShouldFilterSmallCohorts()
    {
        // Arrange
        var clubId = 1;
        var analysisStartDate = DateTime.UtcNow.AddDays(-90);
        var analysisEndDate = DateTime.UtcNow;
        var minCohortSize = 5;

        // Act
        var result = await _repository.GetCohortRetentionDataAsync(clubId, analysisStartDate, analysisEndDate, "monthly", minCohortSize);

        // Assert
        Assert.That(result, Is.Not.Null);
        
        // All cohorts should meet minimum size requirement
        Assert.All(result, cohort =>
        {
            Assert.That(cohort.Size >= minCohortSize, Is.True);
        });
    }

    #endregion

    #region Event Performance Aggregation Tests (RED Phase)

    [Test]
    public async Task GetEventPerformanceMetricsAsync_ForMultipleEvents_ShouldReturnDetailedMetrics()
    {
        // Arrange
        var eventIds = new List<int> { 1, 2, 3, 4, 5 };
        var clubId = 1;

        // Act
        var result = await _repository.GetEventPerformanceMetricsAsync(eventIds, clubId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.Equal(eventIds.Count, result.Count);
        
        Assert.All(result, metrics =>
        {
            Assert.True(eventIds.Contains(metrics.EventId));
            Assert.NotEmpty(metrics.EventName);
            Assert.That(metrics.TotalRsvps >= 0, Is.True);
            Assert.That(metrics.TotalAttendees >= 0, Is.True);
            Assert.That(metrics.AttendanceRate >= 0 && metrics.AttendanceRate <= 100, Is.True);
            Assert.That(metrics.EngagementScore >= 0, Is.True);
            Assert.That(metrics.OverallPerformanceScore >= 0 && metrics.OverallPerformanceScore <= 100, Is.True);
        });
    }

    [Test]
    public async Task GetEventPerformanceMetricsAsync_WithCalculatedFields_ShouldHaveAccurateCalculations()
    {
        // Arrange
        var eventIds = new List<int> { 1, 2 };
        var clubId = 1;

        // Get raw data for verification
        var rawTrackings = await _context.EventEngagementTrackings
            .Where(et => eventIds.Contains(et.EventId))
            .ToListAsync();

        // Act
        var result = await _repository.GetEventPerformanceMetricsAsync(eventIds, clubId);

        // Assert
        Assert.That(result, Is.Not.Null);
        
        foreach (var metrics in result)
        {
            var eventTrackings = rawTrackings.Where(rt => rt.EventId == metrics.EventId).ToList();
            
            if (eventTrackings.Any())
            {
                // Verify attendance rate calculation
                var expectedAttendanceRate = (decimal)eventTrackings.Count(et => et.AttendanceStatus == "attended") / eventTrackings.Count * 100;
                Assert.Equal(expectedAttendanceRate, metrics.AttendanceRate, 1); // Within 1 decimal place
                
                // Verify no-show rate calculation
                var expectedNoShowRate = (decimal)eventTrackings.Count(et => et.AttendanceStatus == "no_show") / eventTrackings.Count * 100;
                Assert.Equal(expectedNoShowRate, metrics.NoShowRate, 1);
            }
        }
    }

    #endregion

    #region Member Segmentation Query Tests (RED Phase)

    [Test]
    public async Task GetMemberSegmentationDataAsync_WithCriteria_ShouldReturnSegmentedMembers()
    {
        // Arrange
        var clubId = 1;
        var criteria = new MemberSegmentationCriteria
        {
            EngagementThreshold = 70.0m,
            AttendanceThreshold = 60.0m,
            PeriodDays = 90,
            MinimumEventsThreshold = 2
        };

        // Act
        var result = await _repository.GetMemberSegmentationDataAsync(clubId, criteria);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count > 0, Is.True);
        
        // Should have multiple segments
        var segmentKeys = result.Keys.ToList();
        Assert.Contains(segmentKeys, key => key.Contains("High", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(segmentKeys, key => key.Contains("Risk", StringComparison.OrdinalIgnoreCase) || key.Contains("Low", StringComparison.OrdinalIgnoreCase));
        
        // Each segment should have valid member data
        foreach (var segment in result.Values)
        {
            Assert.All(segment, member =>
            {
                Assert.That(member.MemberId > 0, Is.True);
                Assert.NotEmpty(member.MemberName);
                Assert.That(member.EngagementScore >= 0, Is.True);
                Assert.That(member.AttendanceRate >= 0 && member.AttendanceRate <= 100, Is.True);
            });
        }
    }

    [Test]
    public async Task GetMemberSegmentationDataAsync_WithHighThresholds_ShouldCreateCorrectDistribution()
    {
        // Arrange
        var clubId = 1;
        var highCriteria = new MemberSegmentationCriteria
        {
            EngagementThreshold = 90.0m, // Very high
            AttendanceThreshold = 85.0m, // Very high
            PeriodDays = 60
        };

        var lowCriteria = new MemberSegmentationCriteria
        {
            EngagementThreshold = 30.0m, // Low
            AttendanceThreshold = 25.0m, // Low
            PeriodDays = 60
        };

        // Act
        var highThresholdResult = await _repository.GetMemberSegmentationDataAsync(clubId, highCriteria);
        var lowThresholdResult = await _repository.GetMemberSegmentationDataAsync(clubId, lowCriteria);

        // Assert
        Assert.That(highThresholdResult, Is.Not.Null);
        Assert.That(lowThresholdResult, Is.Not.Null);
        
        // High thresholds should result in fewer high-engagement members
        // Low thresholds should result in more high-engagement members
        var highThresholdHighEngagement = highThresholdResult.GetValueOrDefault("High Engagement", new List<MemberSegmentInfo>()).Count;
        var lowThresholdHighEngagement = lowThresholdResult.GetValueOrDefault("High Engagement", new List<MemberSegmentInfo>()).Count;
        
        Assert.That(lowThresholdHighEngagement >= highThresholdHighEngagement, Is.True);
    }

    #endregion

    #region Financial ROI Calculation Tests (RED Phase)

    [Test]
    public async Task CalculateEventROIMetricsAsync_WithMockCosts_ShouldReturnROICalculations()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-180);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _repository.CalculateEventROIMetricsAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.Equal(clubId, result.ClubId);
        Assert.That(result.TotalEventCosts >= 0, Is.True);
        Assert.That(result.TotalMemberValue >= 0, Is.True);
        
        // ROI calculation should be mathematically correct
        if (result.TotalEventCosts > 0)
        {
            var expectedROI = ((result.TotalMemberValue - result.TotalEventCosts) / result.TotalEventCosts) * 100m;
            Assert.Equal(expectedROI, result.ROIPercentage, 2); // Within 2 decimal places
        }
        
        // Should have cost and value breakdowns
        Assert.That(result.CostBreakdown.Count > 0, Is.True);
        Assert.That(result.ValueDrivers.Count > 0, Is.True);
        
        // Breakdown totals should match overall totals
        var costBreakdownTotal = result.CostBreakdown.Values.Sum();
        var valueDriversTotal = result.ValueDrivers.Values.Sum();
        
        Assert.Equal(result.TotalEventCosts, costBreakdownTotal, 2);
        Assert.Equal(result.TotalMemberValue, valueDriversTotal, 2);
    }

    [Test]
    public async Task CalculateEventROIMetricsAsync_ByEventType_ShouldSegmentROI()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _repository.CalculateEventROIMetricsAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        
        if (result is DetailedROIAnalysis detailedResult)
        {
            Assert.That(detailedResult.ROIByEventType.Count >= 0, Is.True);
            Assert.That(detailedResult.EventBreakdowns.Count >= 0, Is.True);
            
            // Each event breakdown should have valid data
            Assert.All(detailedResult.EventBreakdowns, breakdown =>
            {
                Assert.That(breakdown.EventId > 0, Is.True);
                Assert.NotEmpty(breakdown.EventName);
                Assert.That(breakdown.EventCost >= 0, Is.True);
                Assert.That(breakdown.EventValue >= 0, Is.True);
            });
        }
    }

    #endregion

    #region Data Aggregation Accuracy Tests (RED Phase)

    [Test]
    public async Task GetEngagementTrendDataAsync_AggregationAccuracy_ShouldMatchRawData()
    {
        // Arrange
        var clubId = 1;
        var testDate = DateTime.UtcNow.Date.AddDays(-7);
        var startDate = testDate;
        var endDate = testDate.AddDays(1);

        // Get raw data for specific date
        var eventsOnDate = await _context.Events
            .Where(e => e.ClubId == clubId && e.EventDateTime >= startDate && e.EventDateTime < endDate)
            .ToListAsync();

        var eventIds = eventsOnDate.Select(e => e.Id).ToList();
        var rawTrackings = await _context.EventEngagementTrackings
            .Where(et => eventIds.Contains(et.EventId))
            .ToListAsync();

        // Calculate expected values
        var expectedAttendeeCount = rawTrackings.Count(t => t.AttendanceStatus == "attended");
        var expectedAvgEngagement = rawTrackings.Any() 
            ? rawTrackings.Average(t => t.ParticipationScore) 
            : 0m;

        // Act
        var result = await _repository.GetEngagementTrendDataAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        
        var dayResult = result.FirstOrDefault(r => r.Date.Date == testDate);
        if (dayResult != null && rawTrackings.Any())
        {
            Assert.Equal(expectedAttendeeCount, dayResult.AttendeeCount);
            Assert.Equal(expectedAvgEngagement, dayResult.EngagementScore, 1); // Within 1 decimal
        }
    }

    #endregion

    #region Query Optimization Tests (RED Phase)

    [Test]
    public async Task GetMemberSegmentationDataAsync_LargeDataset_ShouldUseEfficientQueries()
    {
        // Arrange
        var clubId = 1;
        var criteria = new MemberSegmentationCriteria
        {
            EngagementThreshold = 50.0m,
            AttendanceThreshold = 40.0m,
            PeriodDays = 365 // Full year - large dataset
        };

        // Act
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var result = await _repository.GetMemberSegmentationDataAsync(clubId, criteria);
        stopwatch.Stop();

        // Assert - Should complete within performance requirement
        Assert.True(stopwatch.ElapsedMilliseconds < 3000,
            $"Segmentation query took {stopwatch.ElapsedMilliseconds}ms, exceeding 3 second limit");
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task GetEventPerformanceMetricsAsync_BatchQuery_ShouldBeOptimized()
    {
        // Arrange - Request all events (large batch)
        var allEventIds = await _context.Events
            .Where(e => e.ClubId == 1)
            .Select(e => e.Id)
            .ToListAsync();

        // Act
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var result = await _repository.GetEventPerformanceMetricsAsync(allEventIds, 1);
        stopwatch.Stop();

        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds < 3000,
            $"Batch performance query took {stopwatch.ElapsedMilliseconds}ms, exceeding 3 second limit");
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count > 0, Is.True);
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}