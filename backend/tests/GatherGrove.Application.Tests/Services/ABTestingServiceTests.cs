using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ABTestingServiceTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<ILogger<ABTestingService>> _mockLogger = null!;
    private ABTestingService _service = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<ABTestingService>>();
        _service = new ABTestingService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Test]
    public async Task CreateCampaignAsync_ValidRequest_CreatesCampaign()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        var templateA = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template A",
            TemplateHtml = "<html>A</html>",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var templateB = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template B",
            TemplateHtml = "<html>B</html>",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var request = new CreateABTestCampaignRequest
        {
            CampaignName = "Test Campaign",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50
        };

        // Act
        var result = await _service.CreateCampaignAsync(clubId, userId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.CampaignName, Is.EqualTo("Test Campaign"));
        Assert.That(result.VariantATemplateId, Is.EqualTo(templateA.Id));
        Assert.That(result.VariantBTemplateId, Is.EqualTo(templateB.Id));
        Assert.That(result.TestPercentage, Is.EqualTo(50));

        var savedCampaign = await _context.ABTestCampaigns.FindAsync(result.Id);
        Assert.That(savedCampaign, Is.Not.Null);
    }

    [Test]
    public void CreateCampaignAsync_NonExistentTemplate_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        var request = new CreateABTestCampaignRequest
        {
            CampaignName = "Test Campaign",
            VariantATemplateId = 999,
            VariantBTemplateId = 1000,
            TestPercentage = 50
        };

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CreateCampaignAsync(clubId, userId, request));
    }

    [Test]
    public async Task GetCampaignsAsync_ReturnsAllCampaignsForClub()
    {
        // Arrange
        var clubId = 1;
        await _context.ABTestCampaigns.AddRangeAsync(
            new ABTestCampaign { ClubId = clubId, CampaignName = "Campaign 1", VariantATemplateId = 1, VariantBTemplateId = 2, TestPercentage = 50, CreatedAt = DateTime.UtcNow },
            new ABTestCampaign { ClubId = clubId, CampaignName = "Campaign 2", VariantATemplateId = 3, VariantBTemplateId = 4, TestPercentage = 50, CreatedAt = DateTime.UtcNow },
            new ABTestCampaign { ClubId = 2, CampaignName = "Other Club", VariantATemplateId = 5, VariantBTemplateId = 6, TestPercentage = 50, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetCampaignsAsync(clubId);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result.All(c => c.ClubId == clubId), Is.True);
    }

    [Test]
    public async Task DetermineWinnerAsync_SelectsWinnerBasedOnOpenRate()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DetermineWinnerAsync(clubId, campaign.Id);

        // Assert
        Assert.That(result.WinnerId, Is.Not.Null);
        Assert.That(result.EndedAt, Is.Not.Null);

        var updatedCampaign = await _context.ABTestCampaigns.FindAsync(campaign.Id);
        Assert.That(updatedCampaign!.WinnerId, Is.Not.Null);
        Assert.That(updatedCampaign.EndedAt, Is.Not.Null);
    }

    [Test]
    public void DetermineWinnerAsync_AlreadyEnded_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow,
            EndedAt = DateTime.UtcNow,
            WinnerId = 1
        };
        _context.ABTestCampaigns.Add(campaign);
        _context.SaveChanges();

        // Act & Assert
        Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.DetermineWinnerAsync(clubId, campaign.Id));
    }

    [Test]
    public async Task ManualSelectWinnerAsync_ValidSelection_SetsWinner()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ManualSelectWinnerAsync(clubId, campaign.Id, campaign.VariantATemplateId!.Value);

        // Assert
        Assert.That(result.WinnerId, Is.EqualTo(campaign.VariantATemplateId));
        Assert.That(result.EndedAt, Is.Not.Null);
    }

    [Test]
    public void ManualSelectWinnerAsync_InvalidWinner_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        _context.ABTestCampaigns.Add(campaign);
        _context.SaveChanges();

        // Act & Assert - Try to select a template that's not in the test
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.ManualSelectWinnerAsync(clubId, campaign.Id, 999));
    }

    [Test]
    public async Task DeleteCampaignAsync_ExistingCampaign_DeletesCampaign()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "To Delete",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        await _service.DeleteCampaignAsync(clubId, campaign.Id);

        // Assert
        var deletedCampaign = await _context.ABTestCampaigns.FindAsync(campaign.Id);
        Assert.That(deletedCampaign, Is.Null);
    }

    #region CreateCampaignAsync Extended Tests

    [Test]
    public async Task CreateCampaignAsync_TemplatesFromDifferentClubs_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        var templateA = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template A",
            TemplateHtml = "<html>A</html>",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var templateB = new EmailTemplate
        {
            ClubId = 2, // Different club!
            TemplateName = "Template B",
            TemplateHtml = "<html>B</html>",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var request = new CreateABTestCampaignRequest
        {
            CampaignName = "Test Campaign",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateCampaignAsync(clubId, userId, request));

        Assert.That(ex!.Message, Does.Contain("Templates must belong to the specified club"));
    }

    [Test]
    public async Task CreateCampaignAsync_OneTemplateNotFound_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        var templateA = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template A",
            TemplateHtml = "<html>A</html>",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(templateA);
        await _context.SaveChangesAsync();

        var request = new CreateABTestCampaignRequest
        {
            CampaignName = "Test Campaign",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = 999, // Non-existent
            TestPercentage = 50
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateCampaignAsync(clubId, userId, request));

        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task CreateCampaignAsync_SetsDefaultValues()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        var templateA = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template A",
            TemplateHtml = "<html>A</html>",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var templateB = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template B",
            TemplateHtml = "<html>B</html>",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var request = new CreateABTestCampaignRequest
        {
            CampaignName = "Test Campaign",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 30
        };

        // Act
        var result = await _service.CreateCampaignAsync(clubId, userId, request);

        // Assert
        Assert.That(result.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(result.Status, Is.Null.Or.EqualTo("Draft"));
    }

    #endregion

    #region GetCampaignAsync Tests

    [Test]
    public async Task GetCampaignAsync_CampaignNotFound_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetCampaignAsync(clubId, 999));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    [Test]
    public async Task GetCampaignAsync_CampaignInDifferentClub_ThrowsArgumentException()
    {
        // Arrange
        var campaign = new ABTestCampaign
        {
            ClubId = 1,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act & Assert - Try to access from different club
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetCampaignAsync(2, campaign.Id));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    [Test]
    public async Task GetCampaignAsync_ValidCampaign_ReturnsFullDetails()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template A",
            TemplateHtml = "<html>A</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var templateB = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Template B",
            TemplateHtml = "<html>B</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test Campaign",
            Description = "A test description",
            TestType = "SubjectLine",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50,
            MinimumSampleSize = 100,
            ConfidenceLevel = 95,
            CreatedAt = DateTime.UtcNow,
            Status = "Running",
            StartedAt = DateTime.UtcNow.AddHours(-1)
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetCampaignAsync(clubId, campaign.Id);

        // Assert
        Assert.That(result.CampaignName, Is.EqualTo("Test Campaign"));
        Assert.That(result.Description, Is.EqualTo("A test description"));
        Assert.That(result.TestType, Is.EqualTo("SubjectLine"));
        Assert.That(result.Status, Is.EqualTo("Running"));
        Assert.That(result.MinimumSampleSize, Is.EqualTo(100));
        Assert.That(result.ConfidenceLevel, Is.EqualTo(95));
    }

    #endregion

    #region GetCampaignsAsync Extended Tests

    [Test]
    public async Task GetCampaignsAsync_EmptyClub_ReturnsEmptyList()
    {
        // Arrange
        var clubId = 999; // No campaigns for this club

        // Act
        var result = await _service.GetCampaignsAsync(clubId);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetCampaignsAsync_OrdersByCreatedAtDescending()
    {
        // Arrange
        var clubId = 1;
        await _context.ABTestCampaigns.AddRangeAsync(
            new ABTestCampaign { ClubId = clubId, CampaignName = "Old", VariantATemplateId = 1, VariantBTemplateId = 2, TestPercentage = 50, CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new ABTestCampaign { ClubId = clubId, CampaignName = "Newest", VariantATemplateId = 3, VariantBTemplateId = 4, TestPercentage = 50, CreatedAt = DateTime.UtcNow },
            new ABTestCampaign { ClubId = clubId, CampaignName = "Middle", VariantATemplateId = 5, VariantBTemplateId = 6, TestPercentage = 50, CreatedAt = DateTime.UtcNow.AddDays(-2) }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetCampaignsAsync(clubId);

        // Assert
        Assert.That(result[0].CampaignName, Is.EqualTo("Newest"));
        Assert.That(result[1].CampaignName, Is.EqualTo("Middle"));
        Assert.That(result[2].CampaignName, Is.EqualTo("Old"));
    }

    #endregion

    #region StartCampaignAsync Tests

    [Test]
    public async Task StartCampaignAsync_CampaignNotFound_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;
        var request = new StartABTestRequest { ScheduledFor = null };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.StartCampaignAsync(clubId, 999, request));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    [Test]
    public async Task StartCampaignAsync_AlreadyRunning_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate { ClubId = clubId, TemplateName = "A", TemplateHtml = "<html>A</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var templateB = new EmailTemplate { ClubId = clubId, TemplateName = "B", TemplateHtml = "<html>B</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50,
            Status = "Running",
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        var request = new StartABTestRequest { ScheduledFor = null };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.StartCampaignAsync(clubId, campaign.Id, request));

        Assert.That(ex!.Message, Does.Contain("already running"));
    }

    [Test]
    public async Task StartCampaignAsync_CompletedCampaign_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate { ClubId = clubId, TemplateName = "A", TemplateHtml = "<html>A</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var templateB = new EmailTemplate { ClubId = clubId, TemplateName = "B", TemplateHtml = "<html>B</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50,
            Status = "Completed",
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        var request = new StartABTestRequest { ScheduledFor = null };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.StartCampaignAsync(clubId, campaign.Id, request));

        Assert.That(ex!.Message, Does.Contain("Cannot start a completed campaign"));
    }

    [Test]
    public async Task StartCampaignAsync_CancelledCampaign_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate { ClubId = clubId, TemplateName = "A", TemplateHtml = "<html>A</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var templateB = new EmailTemplate { ClubId = clubId, TemplateName = "B", TemplateHtml = "<html>B</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50,
            Status = "Cancelled",
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        var request = new StartABTestRequest { ScheduledFor = null };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.StartCampaignAsync(clubId, campaign.Id, request));

        Assert.That(ex!.Message, Does.Contain("Cannot start a cancelled campaign"));
    }

    [Test]
    public async Task StartCampaignAsync_MissingVariantA_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var templateB = new EmailTemplate { ClubId = clubId, TemplateName = "B", TemplateHtml = "<html>B</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddAsync(templateB);
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = null, // Missing!
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        var request = new StartABTestRequest { ScheduledFor = null };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.StartCampaignAsync(clubId, campaign.Id, request));

        Assert.That(ex!.Message, Does.Contain("Both variant templates must be configured"));
    }

    [Test]
    public async Task StartCampaignAsync_ValidCampaign_StartsSuccessfully()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate { ClubId = clubId, TemplateName = "A", TemplateHtml = "<html>A</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var templateB = new EmailTemplate { ClubId = clubId, TemplateName = "B", TemplateHtml = "<html>B</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        var request = new StartABTestRequest { ScheduledFor = null };

        // Act
        var result = await _service.StartCampaignAsync(clubId, campaign.Id, request);

        // Assert
        Assert.That(result.Status, Is.EqualTo("Running"));
        Assert.That(result.StartedAt, Is.Not.Null);

        var savedCampaign = await _context.ABTestCampaigns.FindAsync(campaign.Id);
        Assert.That(savedCampaign!.Status, Is.EqualTo("Running"));
    }

    [Test]
    public async Task StartCampaignAsync_WithScheduledTime_UsesProvidedTime()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate { ClubId = clubId, TemplateName = "A", TemplateHtml = "<html>A</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var templateB = new EmailTemplate { ClubId = clubId, TemplateName = "B", TemplateHtml = "<html>B</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            TestPercentage = 50,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        var scheduledTime = DateTime.UtcNow.AddHours(2);
        var request = new StartABTestRequest { ScheduledFor = scheduledTime };

        // Act
        var result = await _service.StartCampaignAsync(clubId, campaign.Id, request);

        // Assert
        Assert.That(result.StartedAt, Is.EqualTo(scheduledTime).Within(TimeSpan.FromSeconds(1)));
    }

    #endregion

    #region DetermineWinnerAsync Extended Tests

    [Test]
    public async Task DetermineWinnerAsync_CampaignNotFound_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.DetermineWinnerAsync(clubId, 999));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    [Test]
    public async Task DetermineWinnerAsync_MissingVariantTemplateIds_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = null, // Missing!
            VariantBTemplateId = null, // Missing!
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.DetermineWinnerAsync(clubId, campaign.Id));

        Assert.That(ex!.Message, Does.Contain("missing variant template IDs"));
    }

    [Test]
    public async Task DetermineWinnerAsync_WithCommunicationAnalytics_SelectsWinnerBasedOnOpenRate()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate { ClubId = clubId, TemplateName = "A", TemplateHtml = "<html>A</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var templateB = new EmailTemplate { ClubId = clubId, TemplateName = "B", TemplateHtml = "<html>B</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        // Add communications logs for template A
        var logA1 = new CommunicationsLog { TemplateId = templateA.Id, ClubId = clubId, Subject = "A1", Status = "Sent", CommunicationType = "Email", CreatedAt = DateTime.UtcNow };
        var logA2 = new CommunicationsLog { TemplateId = templateA.Id, ClubId = clubId, Subject = "A2", Status = "Sent", CommunicationType = "Email", CreatedAt = DateTime.UtcNow };
        await _context.CommunicationsLogs.AddRangeAsync(logA1, logA2);
        await _context.SaveChangesAsync();

        // Add analytics showing template A has 100% open rate
        await _context.CommunicationAnalytics.AddRangeAsync(
            new CommunicationAnalytics { CommunicationId = logA1.Id, OpenedAt = DateTime.UtcNow },
            new CommunicationAnalytics { CommunicationId = logA2.Id, OpenedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id, // No communications
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DetermineWinnerAsync(clubId, campaign.Id);

        // Assert - Template A should win because it has a higher open rate
        Assert.That(result.WinnerId, Is.EqualTo(templateA.Id));
    }

    #endregion

    #region ManualSelectWinnerAsync Extended Tests

    [Test]
    public async Task ManualSelectWinnerAsync_CampaignNotFound_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.ManualSelectWinnerAsync(clubId, 999, 1));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    [Test]
    public async Task ManualSelectWinnerAsync_AlreadyEnded_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow,
            EndedAt = DateTime.UtcNow,
            WinnerId = 1
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.ManualSelectWinnerAsync(clubId, campaign.Id, 1));

        Assert.That(ex!.Message, Does.Contain("already ended"));
    }

    [Test]
    public async Task ManualSelectWinnerAsync_SelectsVariantB_SetsCorrectWinner()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ManualSelectWinnerAsync(clubId, campaign.Id, 2);

        // Assert
        Assert.That(result.WinnerId, Is.EqualTo(2));
        Assert.That(result.EndedAt, Is.Not.Null);
    }

    #endregion

    #region GetCampaignResultsAsync Tests

    [Test]
    public async Task GetCampaignResultsAsync_CampaignNotFound_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetCampaignResultsAsync(clubId, 999));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    [Test]
    public async Task GetCampaignResultsAsync_ValidCampaign_ReturnsResults()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test Campaign",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetCampaignResultsAsync(clubId, campaign.Id);

        // Assert
        Assert.That(result.CampaignId, Is.EqualTo(campaign.Id));
        Assert.That(result.CampaignName, Is.EqualTo("Test Campaign"));
        Assert.That(result.TestPercentage, Is.EqualTo(50));
        Assert.That(result.VariantA, Is.Not.Null);
        Assert.That(result.VariantB, Is.Not.Null);
    }

    [Test]
    public async Task GetCampaignResultsAsync_CompletedCampaign_ReturnsWinnerInfo()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test Campaign",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            WinnerId = 1,
            EndedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetCampaignResultsAsync(clubId, campaign.Id);

        // Assert
        Assert.That(result.WinnerId, Is.EqualTo(1));
        Assert.That(result.IsComplete, Is.True);
    }

    [Test]
    public async Task GetCampaignResultsAsync_WithAnalytics_ReturnsCorrectStats()
    {
        // Arrange
        var clubId = 1;
        var template = new EmailTemplate { ClubId = clubId, TemplateName = "A", TemplateHtml = "<html>A</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var log1 = new CommunicationsLog { TemplateId = template.Id, ClubId = clubId, Subject = "1", Status = "Sent", CommunicationType = "Email", CreatedAt = DateTime.UtcNow };
        var log2 = new CommunicationsLog { TemplateId = template.Id, ClubId = clubId, Subject = "2", Status = "Sent", CommunicationType = "Email", CreatedAt = DateTime.UtcNow };
        await _context.CommunicationsLogs.AddRangeAsync(log1, log2);
        await _context.SaveChangesAsync();

        // 1 opened, 1 clicked
        await _context.CommunicationAnalytics.AddRangeAsync(
            new CommunicationAnalytics { CommunicationId = log1.Id, OpenedAt = DateTime.UtcNow, ClickedAt = DateTime.UtcNow },
            new CommunicationAnalytics { CommunicationId = log2.Id, OpenedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Test",
            VariantATemplateId = template.Id,
            VariantBTemplateId = template.Id + 1, // Non-existent
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetCampaignResultsAsync(clubId, campaign.Id);

        // Assert
        Assert.That(result.VariantA.TotalSent, Is.EqualTo(2));
        Assert.That(result.VariantA.TotalOpened, Is.EqualTo(2));
        Assert.That(result.VariantA.TotalClicked, Is.EqualTo(1));
        Assert.That(result.VariantA.OpenRate, Is.EqualTo(100));
        Assert.That(result.VariantA.ClickRate, Is.EqualTo(50));
    }

    #endregion

    #region DeleteCampaignAsync Extended Tests

    [Test]
    public async Task DeleteCampaignAsync_CampaignNotFound_ThrowsArgumentException()
    {
        // Arrange
        var clubId = 1;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.DeleteCampaignAsync(clubId, 999));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    [Test]
    public async Task DeleteCampaignAsync_CampaignInDifferentClub_ThrowsArgumentException()
    {
        // Arrange
        var campaign = new ABTestCampaign
        {
            ClubId = 1,
            CampaignName = "Test",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 50,
            CreatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act & Assert - Try to delete from different club
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.DeleteCampaignAsync(2, campaign.Id));

        Assert.That(ex!.Message, Does.Contain("Campaign not found"));
    }

    #endregion

    #region Response Mapping Tests

    [Test]
    public async Task MapToResponse_AllFieldsMapped()
    {
        // Arrange
        var clubId = 1;
        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Full Campaign",
            Description = "Full description",
            TestType = "Content",
            VariantATemplateId = 1,
            VariantBTemplateId = 2,
            TestPercentage = 40,
            MinimumSampleSize = 200,
            ConfidenceLevel = 90,
            SegmentId = 5,
            WinnerId = 1,
            WinnerVariant = "A",
            StatisticalSignificance = 0.95m,
            StartedAt = DateTime.UtcNow.AddDays(-1),
            EndedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow,
            Status = "Completed"
        };
        await _context.ABTestCampaigns.AddAsync(campaign);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetCampaignAsync(clubId, campaign.Id);

        // Assert
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        Assert.That(result.CampaignName, Is.EqualTo("Full Campaign"));
        Assert.That(result.Description, Is.EqualTo("Full description"));
        Assert.That(result.TestType, Is.EqualTo("Content"));
        Assert.That(result.Status, Is.EqualTo("Completed"));
        Assert.That(result.VariantATemplateId, Is.EqualTo(1));
        Assert.That(result.VariantBTemplateId, Is.EqualTo(2));
        Assert.That(result.TestPercentage, Is.EqualTo(40));
        Assert.That(result.MinimumSampleSize, Is.EqualTo(200));
        Assert.That(result.ConfidenceLevel, Is.EqualTo(90));
        Assert.That(result.SegmentId, Is.EqualTo(5));
        Assert.That(result.WinnerId, Is.EqualTo(1));
        Assert.That(result.WinnerVariant, Is.EqualTo("A"));
        Assert.That(result.StatisticalSignificance, Is.EqualTo(0.95m));
        Assert.That(result.StartedAt, Is.Not.Null);
        Assert.That(result.EndedAt, Is.Not.Null);
    }

    #endregion
}

