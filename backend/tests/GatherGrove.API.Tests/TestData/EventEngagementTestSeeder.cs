using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.API.Tests.TestData;

/// <summary>
/// Provides predefined test data seeding scenarios for Event Engagement Analysis tests
/// </summary>
public static class EventEngagementTestSeeder
{
    #region Quick Setup Methods

    /// <summary>
    /// Creates a basic club with varied engagement patterns for general testing
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedBasicEventEngagementData(
        GatherGroveDbContext context,
        string clubName = "Basic Test Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName);
        var builderWithEvents = await builderWithClub.WithEvents(1, eventCount: 8, daysBack: 60);
        var builderWithMembers = await builderWithEvents.WithMembersAndEngagement(1, memberCount: 30);
        var result = builderWithMembers.Build();

        return result;
    }

    /// <summary>
    /// Creates comprehensive test data with complete event lifecycle
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedCompleteEventLifecycleData(
        GatherGroveDbContext context,
        string clubName = "Lifecycle Test Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName, "Unlimited");
        var builderWithEvents = await builderWithClub.WithEvents(1, eventCount: 5, daysBack: 30);
        var builderWithMembers = await builderWithEvents.WithMembersAndEngagement(1, memberCount: 40);
        var builderWithLifecycle1 = await builderWithMembers.WithCompleteEventLifecycle(1, memberCount: 25, "Complete Lifecycle Event");
        var builderWithLifecycle2 = await builderWithLifecycle1.WithCompleteEventLifecycle(1, memberCount: 30, "Another Complete Event");
        var result = builderWithLifecycle2.Build();

        return result;
    }

    /// <summary>
    /// Creates test data for trending analysis
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedTrendingEngagementData(
        GatherGroveDbContext context,
        string clubName = "Trending Test Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName);
        var builderWithMembers = await builderWithClub.WithMembersAndEngagement(1, memberCount: 50);
        var builderWithTrend1 = await builderWithMembers.WithTrendingEngagementData(1, EngagementTrend.Improving, weekCount: 6);
        var builderWithTrend2 = await builderWithTrend1.WithTrendingEngagementData(1, EngagementTrend.Declining, weekCount: 4);
        var result = builderWithTrend2.Build();

        return result;
    }

    /// <summary>
    /// Creates test data for high engagement scenarios
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedHighEngagementData(
        GatherGroveDbContext context,
        string clubName = "High Engagement Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName, "Unlimited");
        var builderWithMembers = await builderWithClub.WithMembersAndEngagement(1, memberCount: 60);
        var builderWithEvents = await builderWithMembers.WithHighEngagementEvents(1, eventCount: 8);
        var result = builderWithEvents.Build();

        return result;
    }

    /// <summary>
    /// Creates test data for low engagement scenarios
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedLowEngagementData(
        GatherGroveDbContext context,
        string clubName = "Low Engagement Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName);
        var builderWithMembers = await builderWithClub.WithMembersAndEngagement(1, memberCount: 40);
        var builderWithEvents = await builderWithMembers.WithLowEngagementEvents(1, eventCount: 6);
        var result = builderWithEvents.Build();

        return result;
    }

    /// <summary>
    /// Creates test data for real-time testing scenarios
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedRealTimeTestData(
        GatherGroveDbContext context,
        string clubName = "Real-time Test Club",
        int concurrentUsers = 20)
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName, "Grow");
        var builderWithRealTime = await builderWithClub.WithRealTimeUpdateScenarios(1, concurrentUsers);
        var builderWithMembers = await builderWithRealTime.WithMembersAndEngagement(1, memberCount: concurrentUsers + 10);
        var result = builderWithMembers.Build();

        return result;
    }

    /// <summary>
    /// Creates large dataset for performance testing
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedPerformanceTestData(
        GatherGroveDbContext context,
        string clubName = "Performance Test Club",
        int eventCount = 50,
        int memberCount = 200)
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName, "Unlimited");
        var builderWithPerfData = await builderWithClub.WithPerformanceTestData(1, eventCount, memberCount);
        var result = builderWithPerfData.Build();

        return result;
    }

    /// <summary>
    /// Creates comprehensive test data covering all scenarios
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedComprehensiveTestData(
        GatherGroveDbContext context,
        string clubName = "Comprehensive Test Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName, "Unlimited");
        var builderWithEvents = await builderWithClub.WithEvents(1, eventCount: 12, daysBack: 90);
        var builderWithMembers = await builderWithEvents.WithMembersAndEngagement(1, memberCount: 80);
        var builderWithLifecycle = await builderWithMembers.WithCompleteEventLifecycle(1, memberCount: 35, "Featured Event");
        var builderWithHigh = await builderWithLifecycle.WithHighEngagementEvents(1, eventCount: 4);
        var builderWithLow = await builderWithHigh.WithLowEngagementEvents(1, eventCount: 3);
        var builderWithTrend = await builderWithLow.WithTrendingEngagementData(1, EngagementTrend.Improving, weekCount: 8);
        var builderWithRealTime = await builderWithTrend.WithRealTimeUpdateScenarios(1, concurrentUsers: 15);
        var result = builderWithRealTime.Build();

        return result;
    }

    #endregion

    #region Specialized Scenarios

    /// <summary>
    /// Creates test data for analytics dashboard testing
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedAnalyticsDashboardData(
        GatherGroveDbContext context,
        string clubName = "Analytics Dashboard Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        // Create data spread across different time periods for comprehensive analytics
        var builderWithClub = await builder.WithClub(clubName, "Unlimited");
        var builderWithMembers = await builderWithClub.WithMembersAndEngagement(1, memberCount: 100);
        // Last 30 days - High activity
        var builderWithHigh = await builderWithMembers.WithHighEngagementEvents(1, eventCount: 6);
        // Previous period - Medium activity for comparison
        var builderWithEvents = await builderWithHigh.WithEvents(1, eventCount: 8, daysBack: 60);
        // Long-term trends
        var builderWithTrends = await builderWithEvents.WithTrendingEngagementData(1, EngagementTrend.Improving, weekCount: 12);
        // Edge cases
        var builderWithRealTime = await builderWithTrends.WithRealTimeUpdateScenarios(1, concurrentUsers: 25);
        var result = builderWithRealTime.Build();

        return result;
    }

    /// <summary>
    /// Creates test data for SignalR hub testing
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedSignalRTestData(
        GatherGroveDbContext context,
        string clubName = "SignalR Test Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName, "Grow");
        var builderWithRealTime = await builderWithClub.WithRealTimeUpdateScenarios(1, concurrentUsers: 30);
        var builderWithMembers = await builderWithRealTime.WithMembersAndEngagement(1, memberCount: 50);
        var builderWithLifecycle = await builderWithMembers.WithCompleteEventLifecycle(1, memberCount: 20, "Live Update Event");
        var result = builderWithLifecycle.Build();

        return result;
    }

    /// <summary>
    /// Creates test data for API stress testing
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedApiStressTestData(
        GatherGroveDbContext context,
        string clubName = "API Stress Test Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName, "Unlimited");
        var builderWithPerfData = await builderWithClub.WithPerformanceTestData(1, eventCount: 200, memberCount: 1000);
        var result = builderWithPerfData.Build();

        return result;
    }

    /// <summary>
    /// Creates test data for edge case testing
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedEdgeCaseTestData(
        GatherGroveDbContext context,
        string clubName = "Edge Case Test Club")
    {
        var builder = new EventEngagementTestDataBuilder(context);

        var builderWithClub = await builder.WithClub(clubName);
        var builderWithMembers = await builderWithClub.WithMembersAndEngagement(1, memberCount: 5); // Very small club
        var builderWithEvents = await builderWithMembers.WithEvents(1, eventCount: 1, daysBack: 1); // Single event
        var builderWithLifecycle = await builderWithEvents.WithCompleteEventLifecycle(1, memberCount: 2, "Edge Case Event"); // Minimal participation
        var result = builderWithLifecycle.Build();

        return result;
    }

    #endregion

    #region Multi-Club Scenarios

    /// <summary>
    /// Creates multiple clubs with different engagement patterns
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedMultiClubTestData(
        GatherGroveDbContext context)
    {
        var builder = new EventEngagementTestDataBuilder(context);

        // High-performing club
        var builderWithClub1 = await builder.WithClub("High Performance Club", "Unlimited");
        var builderWithMembers1 = await builderWithClub1.WithMembersAndEngagement(1, memberCount: 80);
        var builderWithEvents1 = await builderWithMembers1.WithHighEngagementEvents(1, eventCount: 10);
        var highClub = builderWithEvents1.Build();

        // Average club
        builder = new EventEngagementTestDataBuilder(context);
        var builderWithClub2 = await builder.WithClub("Average Club", "Grow");
        var builderWithMembers2 = await builderWithClub2.WithMembersAndEngagement(1, memberCount: 45);
        var builderWithEvents2 = await builderWithMembers2.WithEvents(1, eventCount: 8, daysBack: 45);
        var avgClub = builderWithEvents2.Build();

        // Struggling club
        builder = new EventEngagementTestDataBuilder(context);
        var builderWithClub3 = await builder.WithClub("Struggling Club", "Starter");
        var builderWithMembers3 = await builderWithClub3.WithMembersAndEngagement(1, memberCount: 20);
        var builderWithEvents3 = await builderWithMembers3.WithLowEngagementEvents(1, eventCount: 4);
        var lowClub = builderWithEvents3.Build();

        // Combine results
        var combinedResult = new EventEngagementTestDataResult
        {
            Clubs = new() { highClub.GetClub()!, avgClub.GetClub()!, lowClub.GetClub()! },
            Events = highClub.Events.Concat(avgClub.Events).Concat(lowClub.Events).ToList(),
            Members = highClub.Members.Concat(avgClub.Members).Concat(lowClub.Members).ToList()
        };

        combinedResult.TotalClubs = combinedResult.Clubs.Count;
        combinedResult.TotalEvents = combinedResult.Events.Count;
        combinedResult.TotalMembers = combinedResult.Members.Count;

        return combinedResult;
    }

    #endregion

    #region Context Extensions

    /// <summary>
    /// Extension method to easily seed test data using service provider
    /// </summary>
    public static async Task<EventEngagementTestDataResult?> SeedEventEngagementTestData(
        this IServiceProvider serviceProvider,
        EventEngagementTestScenario scenario = EventEngagementTestScenario.Comprehensive,
        string? customClubName = null)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        return scenario switch
        {
            EventEngagementTestScenario.Basic =>
                await SeedBasicEventEngagementData(context, customClubName ?? "Basic Test Club"),

            EventEngagementTestScenario.CompleteLifecycle =>
                await SeedCompleteEventLifecycleData(context, customClubName ?? "Lifecycle Test Club"),

            EventEngagementTestScenario.Trending =>
                await SeedTrendingEngagementData(context, customClubName ?? "Trending Test Club"),

            EventEngagementTestScenario.HighEngagement =>
                await SeedHighEngagementData(context, customClubName ?? "High Engagement Club"),

            EventEngagementTestScenario.LowEngagement =>
                await SeedLowEngagementData(context, customClubName ?? "Low Engagement Club"),

            EventEngagementTestScenario.RealTime =>
                await SeedRealTimeTestData(context, customClubName ?? "Real-time Test Club"),

            EventEngagementTestScenario.Performance =>
                await SeedPerformanceTestData(context, customClubName ?? "Performance Test Club"),

            EventEngagementTestScenario.Analytics =>
                await SeedAnalyticsDashboardData(context, customClubName ?? "Analytics Dashboard Club"),

            EventEngagementTestScenario.SignalR =>
                await SeedSignalRTestData(context, customClubName ?? "SignalR Test Club"),

            EventEngagementTestScenario.EdgeCases =>
                await SeedEdgeCaseTestData(context, customClubName ?? "Edge Case Test Club"),

            EventEngagementTestScenario.MultiClub =>
                await SeedMultiClubTestData(context),

            EventEngagementTestScenario.ApiStress =>
                await SeedApiStressTestData(context, customClubName ?? "API Stress Test Club"),

            EventEngagementTestScenario.Comprehensive or _ =>
                await SeedComprehensiveTestData(context, customClubName ?? "Comprehensive Test Club")
        };
    }

    /// <summary>
    /// Cleans up test data by removing all test-related records
    /// SECURITY FIX: Refactored from raw SQL to EF Core LINQ to prevent SQL injection
    /// </summary>
    public static async Task CleanupEventEngagementTestData(GatherGroveDbContext context)
    {
        // Remove in correct order to avoid foreign key constraints
        // Using EF Core LINQ for safe, parameterized queries
        var testNamePattern = "%Test%";
        var testEmailPattern = "%@test.com";

        // Get IDs of test entities first
        var testEventIds = await context.Events
            .Where(e => EF.Functions.Like(e.Name, testNamePattern))
            .Select(e => e.Id)
            .ToListAsync();

        var testClubIds = await context.Clubs
            .Where(c => EF.Functions.Like(c.Name, testNamePattern))
            .Select(c => c.Id)
            .ToListAsync();

        var testMemberIds = await context.Members
            .Where(m => EF.Functions.Like(m.Email, testEmailPattern))
            .Select(m => m.Id)
            .ToListAsync();

        var testUserIds = await context.Users
            .Where(u => EF.Functions.Like(u.Email, testEmailPattern))
            .Select(u => u.Id)
            .ToListAsync();

        // Delete in correct order to avoid foreign key violations

        // 1. Delete EventFeedbacks
        if (testEventIds.Any())
        {
            await context.EventFeedbacks
                .Where(ef => testEventIds.Contains(ef.EventId))
                .ExecuteDeleteAsync();
        }

        // 2. Delete EventAttendances
        if (testEventIds.Any())
        {
            await context.EventAttendances
                .Where(ea => testEventIds.Contains(ea.EventId))
                .ExecuteDeleteAsync();
        }

        // 3. Delete EventRsvps
        if (testEventIds.Any())
        {
            await context.EventRsvps
                .Where(er => testEventIds.Contains(er.EventId))
                .ExecuteDeleteAsync();
        }

        // 4. Delete Events
        if (testEventIds.Any())
        {
            await context.Events
                .Where(e => testEventIds.Contains(e.Id))
                .ExecuteDeleteAsync();
        }

        // 5. Delete Payments
        if (testMemberIds.Any())
        {
            await context.Payments
                .Where(p => testMemberIds.Contains(p.MemberId))
                .ExecuteDeleteAsync();
        }

        // 6. Delete ClubChatMessages
        if (testClubIds.Any())
        {
            await context.ClubChatMessages
                .Where(ccm => testClubIds.Contains(ccm.ClubId))
                .ExecuteDeleteAsync();
        }

        // 7. Delete Members
        if (testMemberIds.Any())
        {
            await context.Members
                .Where(m => testMemberIds.Contains(m.Id))
                .ExecuteDeleteAsync();
        }

        // 8. Delete MembershipTypes
        if (testClubIds.Any())
        {
            await context.MembershipTypes
                .Where(mt => testClubIds.Contains(mt.ClubId))
                .ExecuteDeleteAsync();
        }

        // 9. Delete Clubs
        if (testClubIds.Any())
        {
            await context.Clubs
                .Where(c => testClubIds.Contains(c.Id))
                .ExecuteDeleteAsync();
        }

        // 10. Delete Users
        if (testUserIds.Any())
        {
            await context.Users
                .Where(u => testUserIds.Contains(u.Id))
                .ExecuteDeleteAsync();
        }

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Quick setup method for integration tests
    /// </summary>
    public static async Task<(GatherGroveDbContext context, EventEngagementTestDataResult data)> SetupTestEnvironment(
        IServiceProvider serviceProvider,
        EventEngagementTestScenario scenario = EventEngagementTestScenario.Basic,
        string? clubName = null)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        // Ensure database is clean
        await CleanupEventEngagementTestData(context);

        // Seed test data
        var data = await serviceProvider.SeedEventEngagementTestData(scenario, clubName);

        return (context, data);
    }

    #endregion

    #region Validation Helpers

    /// <summary>
    /// Validates that test data was created correctly
    /// </summary>
    public static async Task<EventEngagementValidationResult> ValidateTestData(
        GatherGroveDbContext context,
        EventEngagementTestDataResult testData)
    {
        var validation = new EventEngagementValidationResult();

        // Validate clubs
        var actualClubCount = await context.Clubs.CountAsync(c => testData.Clubs.Select(tc => tc.Id).Contains(c.Id));
        validation.ClubsValid = actualClubCount == testData.TotalClubs;

        // Validate events
        var actualEventCount = await context.Events.CountAsync(e => testData.Events.Select(te => te.Id).Contains(e.Id));
        validation.EventsValid = actualEventCount == testData.TotalEvents;

        // Validate members
        var actualMemberCount = await context.Members.CountAsync(m => testData.Members.Select(tm => tm.Id).Contains(m.Id));
        validation.MembersValid = actualMemberCount == testData.TotalMembers;

        // Validate engagement data
        var eventIds = testData.Events.Select(e => e.Id).ToList();
        validation.RsvpCount = await context.EventRsvps.CountAsync(r => eventIds.Contains(r.EventId));
        validation.AttendanceCount = await context.EventAttendances.CountAsync(a => eventIds.Contains(a.EventId));
        validation.FeedbackCount = await context.EventFeedbacks.CountAsync(f => eventIds.Contains(f.EventId));

        // Validate data relationships
        validation.HasRsvpData = validation.RsvpCount > 0;
        validation.HasAttendanceData = validation.AttendanceCount > 0;
        validation.HasFeedbackData = validation.FeedbackCount > 0;

        // Overall validation
        validation.IsValid = validation.ClubsValid &&
                           validation.EventsValid &&
                           validation.MembersValid &&
                           validation.HasRsvpData &&
                           validation.HasAttendanceData;

        return validation;
    }

    #endregion
}

#region Supporting Enums and Classes

public enum EventEngagementTestScenario
{
    Basic,
    CompleteLifecycle,
    Trending,
    HighEngagement,
    LowEngagement,
    RealTime,
    Performance,
    Analytics,
    SignalR,
    EdgeCases,
    MultiClub,
    ApiStress,
    Comprehensive
}

public class EventEngagementValidationResult
{
    public bool ClubsValid { get; set; }
    public bool EventsValid { get; set; }
    public bool MembersValid { get; set; }
    public int RsvpCount { get; set; }
    public int AttendanceCount { get; set; }
    public int FeedbackCount { get; set; }
    public bool HasRsvpData { get; set; }
    public bool HasAttendanceData { get; set; }
    public bool HasFeedbackData { get; set; }
    public bool IsValid { get; set; }

    public string GetValidationSummary()
    {
        var issues = new List<string>();

        if (!ClubsValid) issues.Add("Clubs validation failed");
        if (!EventsValid) issues.Add("Events validation failed");
        if (!MembersValid) issues.Add("Members validation failed");
        if (!HasRsvpData) issues.Add("No RSVP data found");
        if (!HasAttendanceData) issues.Add("No attendance data found");
        if (!HasFeedbackData) issues.Add("No feedback data found");

        return issues.Any()
            ? $"Validation failed: {string.Join(", ", issues)}"
            : $"Validation passed. RSVPs: {RsvpCount}, Attendances: {AttendanceCount}, Feedbacks: {FeedbackCount}";
    }
}

#endregion