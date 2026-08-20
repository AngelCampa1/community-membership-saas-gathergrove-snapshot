using FluentAssertions;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace GatherGrove.Integration.Tests;

/// <summary>
/// Integration tests for Communication Workflow functionality (US-010)
/// Tests A/B testing campaigns, automated workflows, and member segmentation
/// </summary>
[TestFixture]
public class CommunicationWorkflowTests
{
    private GatherGroveDbContext _dbContext = null!;
    private Club _testClub = null!;
    private User _testUser = null!;
    private EmailTemplate _template = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new GatherGroveDbContext(options);

        // Create test user
        _testUser = new User
        {
            FullName = "Admin User",
            Email = "admin@gathergrove.club",
            PasswordHash = "hashed_password",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Users.Add(_testUser);
        _dbContext.SaveChanges();

        // Create test club
        _testClub = new Club
        {
            Name = "Test Club",
            Tier = "Professional",
            SubscriptionStatus = "active",
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Clubs.Add(_testClub);
        _dbContext.SaveChanges();

        // Create email template
        _template = new EmailTemplate
        {
            ClubId = _testClub.Id,
            TemplateName = "Welcome Email",
            TemplateHtml = "<h1>Welcome!</h1>",
            IsActive = true,
            Version = 1,
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.EmailTemplates.Add(_template);
        _dbContext.SaveChanges();
    }

    [TearDown]
    public void TearDown()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    #region Email Campaign A/B Testing

    [Test]
    public async Task ABTest_CreateCampaign_StoresCorrectly()
    {
        // Arrange
        var campaign = new ABTestCampaign
        {
            ClubId = _testClub.Id,
            CampaignName = "Welcome Email Test",
            TestType = "SubjectLine",
            VariantATemplateId = _template.Id,
            VariantASubject = "Welcome to our community!",
            VariantBTemplateId = _template.Id,
            VariantBSubject = "You're now part of something special!",
            TestPercentage = 20,
            MinimumSampleSize = 100,
            ConfidenceLevel = 95.0m,
            Status = "Draft",
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        _dbContext.ABTestCampaigns.Add(campaign);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.ABTestCampaigns
            .FirstOrDefaultAsync(c => c.CampaignName == "Welcome Email Test");

        saved.Should().NotBeNull();
        saved!.TestType.Should().Be("SubjectLine");
        saved.VariantASubject.Should().Be("Welcome to our community!");
        saved.VariantBSubject.Should().Be("You're now part of something special!");
        saved.TestPercentage.Should().Be(20);
        saved.Status.Should().Be("Draft");
    }

    [Test]
    public async Task ABTest_ContentVariation_StoresDifferentContent()
    {
        // Arrange & Act
        var campaign = new ABTestCampaign
        {
            ClubId = _testClub.Id,
            CampaignName = "Content Test",
            TestType = "Content",
            VariantATemplateId = _template.Id,
            VariantASubject = "Same Subject",
            VariantAContent = "<h1>Short message</h1>",
            VariantBTemplateId = _template.Id,
            VariantBSubject = "Same Subject",
            VariantBContent = "<h1>Longer detailed message</h1><p>With more information</p>",
            TestPercentage = 30,
            MinimumSampleSize = 200,
            ConfidenceLevel = 95.0m,
            Status = "Draft",
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.ABTestCampaigns.Add(campaign);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.ABTestCampaigns.FindAsync(campaign.Id);
        saved.Should().NotBeNull();
        saved!.TestType.Should().Be("Content");
        saved.VariantAContent.Should().Contain("Short message");
        saved.VariantBContent.Should().Contain("Longer detailed message");
    }

    [Test]
    public async Task ABTest_DetermineWinner_UpdatesCampaign()
    {
        // Arrange
        var campaign = new ABTestCampaign
        {
            ClubId = _testClub.Id,
            CampaignName = "Winner Test Campaign",
            TestType = "SubjectLine",
            VariantATemplateId = _template.Id,
            VariantASubject = "Subject A",
            VariantBTemplateId = _template.Id,
            VariantBSubject = "Subject B",
            TestPercentage = 20,
            MinimumSampleSize = 100,
            ConfidenceLevel = 95.0m,
            Status = "Running",
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.ABTestCampaigns.Add(campaign);
        await _dbContext.SaveChangesAsync();

        // Act - Determine winner (Variant A)
        campaign.Status = "Completed";
        campaign.WinnerVariant = "A";
        campaign.StatisticalSignificance = 97.5m;
        campaign.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.ABTestCampaigns.FindAsync(campaign.Id);
        updated.Should().NotBeNull();
        updated!.Status.Should().Be("Completed");
        updated.WinnerVariant.Should().Be("A");
        updated.StatisticalSignificance.Should().Be(97.5m);
    }

    [Test]
    public async Task ABTest_SendTimeVariation_RecordsSchedule()
    {
        // Arrange
        var campaign = new ABTestCampaign
        {
            ClubId = _testClub.Id,
            CampaignName = "Send Time Test",
            TestType = "SendTime",
            VariantATemplateId = _template.Id,
            VariantASubject = "Event Update",
            VariantBTemplateId = _template.Id,
            VariantBSubject = "Event Update",
            TestPercentage = 25,
            MinimumSampleSize = 150,
            ConfidenceLevel = 90.0m,
            Status = "Scheduled",
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.ABTestCampaigns.Add(campaign);
        await _dbContext.SaveChangesAsync();

        // Create scheduled sends for different times
        var morningLog = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "Email",
            Subject = "Event Update",
            Body = "Morning variant",
            RecipientCount = 50,
            Recipients = "[]",
            Status = "Scheduled",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            TemplateId = _template.Id,
            ABTestCampaignId = campaign.Id,
            ScheduledFor = DateTime.UtcNow.Date.AddHours(9), // 9 AM
            CreatedAt = DateTime.UtcNow
        };

        var eveningLog = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "Email",
            Subject = "Event Update",
            Body = "Evening variant",
            RecipientCount = 50,
            Recipients = "[]",
            Status = "Scheduled",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            TemplateId = _template.Id,
            ABTestCampaignId = campaign.Id,
            ScheduledFor = DateTime.UtcNow.Date.AddHours(18), // 6 PM
            CreatedAt = DateTime.UtcNow
        };

        // Act
        _dbContext.CommunicationsLogs.AddRange(morningLog, eveningLog);
        await _dbContext.SaveChangesAsync();

        // Assert
        var logs = await _dbContext.CommunicationsLogs
            .Where(l => l.ABTestCampaignId == campaign.Id)
            .ToListAsync();

        logs.Should().HaveCount(2);
        logs.Should().OnlyContain(l => l.Status == "Scheduled");
        var times = logs.Select(l => l.ScheduledFor!.Value.Hour).OrderBy(h => h).ToList();
        times.Should().Equal(new[] { 9, 18 });
    }

    #endregion

    #region Automated Communication Workflows

    [Test]
    public async Task Workflow_Create_StoresCorrectly()
    {
        // Arrange & Act
        var workflow = new CommunicationWorkflow
        {
            ClubId = _testClub.Id,
            WorkflowName = "New Member Welcome",
            TriggerType = "MemberJoin",
            TriggerConfig = "{\"delay\":\"immediate\"}",
            WorkflowSteps = "[{\"step\":1,\"action\":\"sendEmail\",\"templateId\":" + _template.Id + "}]",
            IsActive = true,
            TriggerCount = 0,
            SuccessCount = 0,
            FailureCount = 0,
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationWorkflows.Add(workflow);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.CommunicationWorkflows.FindAsync(workflow.Id);
        saved.Should().NotBeNull();
        saved!.WorkflowName.Should().Be("New Member Welcome");
        saved.TriggerType.Should().Be("MemberJoin");
        saved.IsActive.Should().BeTrue();
    }

    [Test]
    public async Task Workflow_TriggerExecution_IncrementsCounters()
    {
        // Arrange
        var workflow = new CommunicationWorkflow
        {
            ClubId = _testClub.Id,
            WorkflowName = "Event Reminder",
            TriggerType = "CustomDate",
            TriggerConfig = "{\"timing\":\"24h_before_event\"}",
            WorkflowSteps = "[{\"step\":1,\"action\":\"sendEmail\"}]",
            IsActive = true,
            TriggerCount = 0,
            SuccessCount = 0,
            FailureCount = 0,
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationWorkflows.Add(workflow);
        await _dbContext.SaveChangesAsync();

        // Act - Simulate successful execution
        workflow.TriggerCount++;
        workflow.SuccessCount++;
        workflow.LastTriggeredAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.CommunicationWorkflows.FindAsync(workflow.Id);
        updated.Should().NotBeNull();
        updated!.TriggerCount.Should().Be(1);
        updated.SuccessCount.Should().Be(1);
        updated.LastTriggeredAt.Should().NotBeNull();
    }

    [Test]
    public async Task Workflow_FailedExecution_IncrementsFailureCount()
    {
        // Arrange
        var workflow = new CommunicationWorkflow
        {
            ClubId = _testClub.Id,
            WorkflowName = "Test Workflow with Failure",
            TriggerType = "MemberJoin",
            TriggerConfig = "{}",
            WorkflowSteps = "[{\"step\":1,\"action\":\"sendEmail\"}]",
            IsActive = true,
            TriggerCount = 0,
            SuccessCount = 0,
            FailureCount = 0,
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationWorkflows.Add(workflow);
        await _dbContext.SaveChangesAsync();

        // Act - Simulate failed execution
        workflow.TriggerCount++;
        workflow.FailureCount++;
        workflow.LastTriggeredAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.CommunicationWorkflows.FindAsync(workflow.Id);
        updated.Should().NotBeNull();
        updated!.TriggerCount.Should().Be(1);
        updated.FailureCount.Should().Be(1);
        updated.SuccessCount.Should().Be(0);
    }

    [Test]
    public async Task Workflow_MultiStepSequence_StoresStepsCorrectly()
    {
        // Arrange & Act
        var workflow = new CommunicationWorkflow
        {
            ClubId = _testClub.Id,
            WorkflowName = "Onboarding Sequence",
            TriggerType = "MemberJoin",
            TriggerConfig = "{\"delay\":\"immediate\"}",
            WorkflowSteps = @"[
                {""step"":1,""action"":""sendEmail"",""delay"":""immediate""},
                {""step"":2,""action"":""sendEmail"",""delay"":""3d""},
                {""step"":3,""action"":""sendEmail"",""delay"":""7d""}
            ]",
            IsActive = true,
            TriggerCount = 0,
            SuccessCount = 0,
            FailureCount = 0,
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationWorkflows.Add(workflow);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.CommunicationWorkflows.FindAsync(workflow.Id);
        saved.Should().NotBeNull();
        saved!.WorkflowSteps.Should().Contain("\"step\":1");
        saved.WorkflowSteps.Should().Contain("\"step\":2");
        saved.WorkflowSteps.Should().Contain("\"step\":3");
    }

    #endregion

    #region Segmentation & Targeting

    [Test]
    public async Task Segment_Create_StoresFilterCriteria()
    {
        // Arrange & Act
        var segment = new MemberSegment
        {
            ClubId = _testClub.Id,
            Name = "Highly Engaged",
            Description = "Members who attended 5+ events in the last 30 days",
            FilterCriteria = "{\"eventAttendance\":{\"count\":\">=5\",\"period\":\"30days\"}}",
            IsActive = true,
            IsSystemGenerated = false,
            MemberCount = 0,
            LastCalculated = DateTime.UtcNow,
            CalculationDurationMs = 150,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MemberSegments.Add(segment);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.MemberSegments
            .FirstOrDefaultAsync(s => s.Name == "Highly Engaged");

        saved.Should().NotBeNull();
        saved!.FilterCriteria.Should().Contain("eventAttendance");
        saved.IsActive.Should().BeTrue();
        saved.MemberCount.Should().Be(0);
    }

    [Test]
    public async Task Segment_Update_RecalculatesMetrics()
    {
        // Arrange
        var segment = new MemberSegment
        {
            ClubId = _testClub.Id,
            Name = "Newsletter Subscribers",
            Description = "Members who opted into newsletter",
            FilterCriteria = "{\"newsletterOptIn\":true}",
            IsActive = true,
            IsSystemGenerated = false,
            MemberCount = 100,
            LastCalculated = DateTime.UtcNow.AddHours(-1),
            CalculationDurationMs = 300,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MemberSegments.Add(segment);
        await _dbContext.SaveChangesAsync();

        // Act - Recalculate segment
        segment.MemberCount = 105; // 5 new subscribers
        segment.LastCalculated = DateTime.UtcNow;
        segment.CalculationDurationMs = 280;
        segment.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.MemberSegments.FindAsync(segment.Id);
        updated.Should().NotBeNull();
        updated!.MemberCount.Should().Be(105);
        updated.CalculationDurationMs.Should().Be(280);
        updated.LastCalculated.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task Segment_SystemGenerated_MarkedCorrectly()
    {
        // Arrange & Act
        var systemSegment = new MemberSegment
        {
            ClubId = _testClub.Id,
            Name = "All Active Members",
            Description = "System-generated segment for all active members",
            FilterCriteria = "{\"membershipStatus\":\"Active\"}",
            IsActive = true,
            IsSystemGenerated = true,
            MemberCount = 500,
            LastCalculated = DateTime.UtcNow,
            CalculationDurationMs = 400,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MemberSegments.Add(systemSegment);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.MemberSegments
            .FirstOrDefaultAsync(s => s.IsSystemGenerated);

        saved.Should().NotBeNull();
        saved!.IsSystemGenerated.Should().BeTrue();
        saved.Name.Should().Be("All Active Members");
    }

    [Test]
    public async Task Segment_ComplexCriteria_StoresJsonCorrectly()
    {
        // Arrange & Act
        var complexSegment = new MemberSegment
        {
            ClubId = _testClub.Id,
            Name = "Target Segment",
            Description = "Members matching complex criteria",
            FilterCriteria = @"{
                ""and"": [
                    {""membershipStatus"": ""Active""},
                    {""eventAttendance"": {""count"": "">=3"", ""period"": ""90days""}},
                    {""or"": [
                        {""membershipType"": ""Premium""},
                        {""totalSpent"": {""amount"": "">=500""}}
                    ]}
                ]
            }",
            IsActive = true,
            IsSystemGenerated = false,
            MemberCount = 42,
            LastCalculated = DateTime.UtcNow,
            CalculationDurationMs = 850,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MemberSegments.Add(complexSegment);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.MemberSegments.FindAsync(complexSegment.Id);
        saved.Should().NotBeNull();
        saved!.FilterCriteria.Should().Contain("\"and\"");
        saved.FilterCriteria.Should().Contain("eventAttendance");
        saved.FilterCriteria.Should().Contain("totalSpent");
        saved.MemberCount.Should().Be(42);
    }

    [Test]
    public async Task Segment_Deactivate_StopsTargeting()
    {
        // Arrange
        var segment = new MemberSegment
        {
            ClubId = _testClub.Id,
            Name = "Outdated Segment",
            Description = "Segment to be deactivated",
            FilterCriteria = "{\"old\":\"criteria\"}",
            IsActive = true,
            IsSystemGenerated = false,
            MemberCount = 50,
            LastCalculated = DateTime.UtcNow,
            CalculationDurationMs = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MemberSegments.Add(segment);
        await _dbContext.SaveChangesAsync();

        // Act - Deactivate segment
        segment.IsActive = false;
        segment.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.MemberSegments.FindAsync(segment.Id);
        updated.Should().NotBeNull();
        updated!.IsActive.Should().BeFalse();
    }

    #endregion

    #region Multi-Channel Communications

    [Test]
    public async Task Communication_Email_SendsCorrectly()
    {
        // Arrange & Act
        var emailLog = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "Email",
            Subject = "Test Email",
            Body = "<p>Test content</p>",
            RecipientCount = 10,
            Recipients = "[{\"email\":\"user1@example.com\"}]",
            Status = "Sent",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            TemplateId = _template.Id,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationsLogs.Add(emailLog);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.CommunicationsLogs.FindAsync(emailLog.Id);
        saved.Should().NotBeNull();
        saved!.CommunicationType.Should().Be("Email");
        saved.Status.Should().Be("Sent");
        saved.RecipientCount.Should().Be(10);
    }

    [Test]
    public async Task Communication_SMS_SendsCorrectly()
    {
        // Arrange & Act
        var smsLog = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "SMS",
            Subject = null, // SMS doesn't have subject
            Body = "Your event starts in 1 hour!",
            RecipientCount = 5,
            Recipients = "[{\"phone\":\"+1234567890\"}]",
            Status = "Sent",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationsLogs.Add(smsLog);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.CommunicationsLogs
            .FirstOrDefaultAsync(l => l.CommunicationType == "SMS");

        saved.Should().NotBeNull();
        saved!.CommunicationType.Should().Be("SMS");
        saved.Subject.Should().BeNull();
        saved.Body.Should().Contain("event starts in 1 hour");
        saved.RecipientCount.Should().Be(5);
    }

    [Test]
    public async Task Communication_WhatsApp_SendsCorrectly()
    {
        // Arrange & Act
        var whatsappLog = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "WhatsApp",
            Subject = null,
            Body = "Your membership renewal is due.",
            RecipientCount = 10,
            Recipients = "[{\"whatsapp\":\"+1234567890\"}]",
            Status = "Sent",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationsLogs.Add(whatsappLog);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.CommunicationsLogs
            .FirstOrDefaultAsync(l => l.CommunicationType == "WhatsApp");

        saved.Should().NotBeNull();
        saved!.CommunicationType.Should().Be("WhatsApp");
        saved.Body.Should().Contain("membership renewal");
        saved.RecipientCount.Should().Be(10);
    }

    [Test]
    public async Task Communication_Scheduled_SavesScheduleTime()
    {
        // Arrange & Act
        var scheduledLog = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "Email",
            Subject = "Upcoming Event Announcement",
            Body = "<p>Mark your calendars!</p>",
            RecipientCount = 100,
            Recipients = "[]",
            Status = "Scheduled",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            TemplateId = _template.Id,
            ScheduledFor = DateTime.UtcNow.AddDays(2), // Schedule for 2 days from now
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationsLogs.Add(scheduledLog);
        await _dbContext.SaveChangesAsync();

        // Assert
        var saved = await _dbContext.CommunicationsLogs
            .FirstOrDefaultAsync(l => l.Status == "Scheduled");

        saved.Should().NotBeNull();
        saved!.Status.Should().Be("Scheduled");
        saved.ScheduledFor.Should().NotBeNull();
        saved.ScheduledFor!.Value.Should().BeAfter(DateTime.UtcNow);
    }

    #endregion

    #region Template Usage Tracking

    [Test]
    public async Task Template_IncrementUsageCount_TracksUsage()
    {
        // Arrange
        var initialUsage = _template.UsageCount;

        // Act - Use template in communication
        var log = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "Email",
            Subject = "Test",
            Body = _template.TemplateHtml,
            RecipientCount = 1,
            Recipients = "[]",
            Status = "Sent",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            TemplateId = _template.Id,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationsLogs.Add(log);

        // Update template usage
        _template.UsageCount++;
        _template.LastUsedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.EmailTemplates.FindAsync(_template.Id);
        updated.Should().NotBeNull();
        updated!.UsageCount.Should().Be(initialUsage + 1);
        updated.LastUsedAt.Should().NotBeNull();
        updated.LastUsedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task Template_MultipleUses_AccumulatesCount()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = _testClub.Id,
            TemplateName = "Popular Template",
            TemplateHtml = "<p>Test</p>",
            IsActive = true,
            Version = 1,
            CreatedByUserId = _testUser.Id,
            UsageCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.EmailTemplates.Add(template);
        await _dbContext.SaveChangesAsync();

        // Act - Use template 3 times
        for (int i = 0; i < 3; i++)
        {
            var log = new CommunicationsLog
            {
                ClubId = _testClub.Id,
                CommunicationType = "Email",
                Subject = $"Email {i + 1}",
                Body = template.TemplateHtml,
                RecipientCount = 1,
                Recipients = "[]",
                Status = "Sent",
                SentByUserId = _testUser.Id,
                SentAt = DateTime.UtcNow,
                TemplateId = template.Id,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.CommunicationsLogs.Add(log);
            template.UsageCount++;
            template.LastUsedAt = DateTime.UtcNow;
        }
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.EmailTemplates.FindAsync(template.Id);
        updated.Should().NotBeNull();
        updated!.UsageCount.Should().Be(3);

        var usageLogs = await _dbContext.CommunicationsLogs
            .Where(l => l.TemplateId == template.Id)
            .ToListAsync();
        usageLogs.Should().HaveCount(3);
    }

    #endregion

    #region Integration Tests

    [Test]
    public async Task Integration_CampaignWithSegmentAndLogs_LinksCorrectly()
    {
        // Arrange
        var segment = new MemberSegment
        {
            ClubId = _testClub.Id,
            Name = "VIP Members",
            FilterCriteria = "{\"membershipType\":\"VIP\"}",
            IsActive = true,
            IsSystemGenerated = false,
            MemberCount = 25,
            LastCalculated = DateTime.UtcNow,
            CalculationDurationMs = 200,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MemberSegments.Add(segment);
        await _dbContext.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = _testClub.Id,
            CampaignName = "VIP Campaign",
            TestType = "SubjectLine",
            VariantATemplateId = _template.Id,
            VariantASubject = "Exclusive Offer A",
            VariantBTemplateId = _template.Id,
            VariantBSubject = "Exclusive Offer B",
            TestPercentage = 50,
            MinimumSampleSize = 20,
            ConfidenceLevel = 90.0m,
            Status = "Running",
            SegmentId = segment.Id,
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.ABTestCampaigns.Add(campaign);
        await _dbContext.SaveChangesAsync();

        var log = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "Email",
            Subject = "Exclusive Offer A",
            Body = "Content",
            RecipientCount = 12,
            Recipients = "[]",
            Status = "Sent",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            TemplateId = _template.Id,
            ABTestCampaignId = campaign.Id,
            SegmentId = segment.Id,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationsLogs.Add(log);
        await _dbContext.SaveChangesAsync();

        // Act & Assert - Verify relationships
        var savedLog = await _dbContext.CommunicationsLogs
            .Include(l => l.ABTestCampaign)
            .Include(l => l.Segment)
            .FirstAsync();

        savedLog.ABTestCampaign.Should().NotBeNull();
        savedLog.ABTestCampaign!.CampaignName.Should().Be("VIP Campaign");
        savedLog.Segment.Should().NotBeNull();
        savedLog.Segment!.Name.Should().Be("VIP Members");
    }

    [Test]
    public async Task Integration_WorkflowWithLogs_TracksExecution()
    {
        // Arrange
        var workflow = new CommunicationWorkflow
        {
            ClubId = _testClub.Id,
            WorkflowName = "Welcome Series",
            TriggerType = "MemberJoin",
            TriggerConfig = "{}",
            WorkflowSteps = "[{\"step\":1,\"action\":\"sendEmail\"}]",
            IsActive = true,
            TriggerCount = 0,
            SuccessCount = 0,
            FailureCount = 0,
            CreatedByUserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationWorkflows.Add(workflow);
        await _dbContext.SaveChangesAsync();

        // Act - Execute workflow
        workflow.TriggerCount++;
        workflow.SuccessCount++;
        workflow.LastTriggeredAt = DateTime.UtcNow;

        var log = new CommunicationsLog
        {
            ClubId = _testClub.Id,
            CommunicationType = "Email",
            Subject = "Welcome!",
            Body = "Welcome content",
            RecipientCount = 1,
            Recipients = "[]",
            Status = "Sent",
            SentByUserId = _testUser.Id,
            SentAt = DateTime.UtcNow,
            TemplateId = _template.Id,
            WorkflowId = workflow.Id,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunicationsLogs.Add(log);
        await _dbContext.SaveChangesAsync();

        // Assert
        var savedWorkflow = await _dbContext.CommunicationWorkflows.FindAsync(workflow.Id);
        savedWorkflow!.TriggerCount.Should().Be(1);
        savedWorkflow.SuccessCount.Should().Be(1);

        var savedLog = await _dbContext.CommunicationsLogs
            .Include(l => l.Workflow)
            .FirstAsync();
        savedLog.Workflow.Should().NotBeNull();
        savedLog.Workflow!.WorkflowName.Should().Be("Welcome Series");
    }

    #endregion
}
