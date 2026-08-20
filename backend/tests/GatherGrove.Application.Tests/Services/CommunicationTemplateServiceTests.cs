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
public class CommunicationTemplateServiceTests
{
    private GatherGroveDbContext _context = null!;
    private CommunicationTemplateService _service = null!;
    private Mock<ILogger<CommunicationTemplateService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<CommunicationTemplateService>>();
        _service = new CommunicationTemplateService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task CreateTemplateAsync_ValidRequest_CreatesTemplate()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var club = new Club
        {
            Id = clubId,
            Name = "Test Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow
        };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        var request = new CreateEmailTemplateRequest
        {
            TemplateName = "Test Template",
            Description = "Test Description",
            TemplateHtml = "<html><body>Test</body></html>",
            TemplateJson = "{\"test\": true}"
        };

        // Act
        var result = await _service.CreateTemplateAsync(clubId, userId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TemplateName, Is.EqualTo("Test Template"));
        Assert.That(result.Description, Is.EqualTo("Test Description"));
        Assert.That(result.TemplateHtml, Is.EqualTo(request.TemplateHtml));
        Assert.That(result.TemplateJson, Is.EqualTo(request.TemplateJson));
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        // CreatedByUserId is not exposed in response DTO
        Assert.That(result.IsActive, Is.True);

        var savedTemplate = await _context.EmailTemplates.FindAsync(result.Id);
        Assert.That(savedTemplate, Is.Not.Null);
    }

    [Test]
    public async Task GetTemplatesAsync_ReturnsOnlyClubTemplates()
    {
        // Arrange
        var clubId = 1;
        await _context.EmailTemplates.AddRangeAsync(
            new EmailTemplate { ClubId = clubId, TemplateName = "Template 1", TemplateHtml = "<html>1</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EmailTemplate { ClubId = clubId, TemplateName = "Template 2", TemplateHtml = "<html>2</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EmailTemplate { ClubId = 2, TemplateName = "Other Club", TemplateHtml = "<html>3</html>", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTemplatesAsync(clubId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(2));
    }

    [Test]
    public async Task GetTemplateAsync_ValidId_ReturnsTemplate()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Test",
            TemplateHtml = "<html>Test</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTemplateAsync(template.ClubId, template.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(template.Id));
        Assert.That(result.TemplateName, Is.EqualTo(template.TemplateName));
    }

    [Test]
    public async Task GetTemplateAsync_InvalidId_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetTemplateAsync(1, 999));

        Assert.That(ex.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateTemplateAsync_ValidRequest_UpdatesTemplate()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Original",
            TemplateHtml = "<html>Original</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var request = new UpdateEmailTemplateRequest
        {
            TemplateName = "Updated",
            TemplateHtml = "<html>Updated</html>"
        };

        // Act
        var result = await _service.UpdateTemplateAsync(template.ClubId, template.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TemplateName, Is.EqualTo("Updated"));
        Assert.That(result.TemplateHtml, Is.EqualTo(request.TemplateHtml));

        var updated = await _context.EmailTemplates.FindAsync(template.Id);
        Assert.That(updated!.TemplateName, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task DeleteTemplateAsync_ValidId_DeletesTemplate()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "To Delete",
            TemplateHtml = "<html>Delete</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        await _service.DeleteTemplateAsync(template.ClubId, template.Id);

        // Assert
        var deleted = await _context.EmailTemplates.FindAsync(template.Id);
        Assert.That(deleted, Is.Null);
    }

    [Test]
    public async Task DuplicateTemplateAsync_ValidId_CreatesNewTemplate()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var template = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Original",
            Description = "Original description",
            TemplateHtml = "<html>Original</html>",
            TemplateJson = "{\"original\": true}",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DuplicateTemplateAsync(clubId, template.Id, userId, "Copy of Original");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TemplateName, Is.EqualTo("Copy of Original"));
        Assert.That(result.TemplateHtml, Is.EqualTo(template.TemplateHtml));
        Assert.That(result.TemplateJson, Is.EqualTo(template.TemplateJson));
        Assert.That(result.Id, Is.Not.EqualTo(template.Id));

        var count = await _context.EmailTemplates.CountAsync();
        Assert.That(count, Is.EqualTo(2));
    }

    #region CreateTemplateAsync Extended Tests

    [Test]
    public async Task CreateTemplateAsync_ClubNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateEmailTemplateRequest
        {
            TemplateName = "Test Template",
            Description = "Test Description",
            TemplateHtml = "<html><body>Test</body></html>"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateTemplateAsync(999, 1, request));

        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task CreateTemplateAsync_NonUnlimitedTier_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var club = new Club
        {
            Id = clubId,
            Name = "Basic Club",
            Tier = "Basic",
            CreatedAt = DateTime.UtcNow
        };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        var request = new CreateEmailTemplateRequest
        {
            TemplateName = "Test Template",
            Description = "Test Description",
            TemplateHtml = "<html><body>Test</body></html>"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateTemplateAsync(clubId, 1, request));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    [Test]
    public async Task CreateTemplateAsync_SetsDefaultValues()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var club = new Club
        {
            Id = clubId,
            Name = "Test Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow
        };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        var request = new CreateEmailTemplateRequest
        {
            TemplateName = "Test Template",
            TemplateHtml = "<html><body>Test</body></html>"
        };

        // Act
        var result = await _service.CreateTemplateAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSystemTemplate, Is.False);
        Assert.That(result.IsActive, Is.True);
        Assert.That(result.Version, Is.EqualTo(1));
        Assert.That(result.UsageCount, Is.EqualTo(0));
    }

    #endregion

    #region UpdateTemplateAsync Extended Tests

    [Test]
    public async Task UpdateTemplateAsync_TemplateNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateEmailTemplateRequest
        {
            TemplateName = "Updated"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateTemplateAsync(1, 999, request));

        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateTemplateAsync_SystemTemplate_ThrowsInvalidOperationException()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "System Template",
            TemplateHtml = "<html>System</html>",
            IsSystemTemplate = true,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var request = new UpdateEmailTemplateRequest
        {
            TemplateName = "Updated"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateTemplateAsync(template.ClubId, template.Id, request));

        Assert.That(ex!.Message, Does.Contain("System templates cannot be modified"));
    }

    [Test]
    public async Task UpdateTemplateAsync_PartialUpdate_OnlyUpdatesProvidedFields()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Original",
            Description = "Original Description",
            TemplateHtml = "<html>Original</html>",
            TemplateJson = "{\"original\": true}",
            ThumbnailUrl = "https://example.com/thumb.png",
            IsActive = true,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var request = new UpdateEmailTemplateRequest
        {
            TemplateName = "Updated Name Only"
            // Other fields not provided
        };

        // Act
        var result = await _service.UpdateTemplateAsync(template.ClubId, template.Id, request);

        // Assert
        Assert.That(result.TemplateName, Is.EqualTo("Updated Name Only"));
        Assert.That(result.Description, Is.EqualTo("Original Description")); // Unchanged
        Assert.That(result.TemplateHtml, Is.EqualTo("<html>Original</html>")); // Unchanged
        Assert.That(result.ThumbnailUrl, Is.EqualTo("https://example.com/thumb.png")); // Unchanged
    }

    [Test]
    public async Task UpdateTemplateAsync_HtmlChanged_IncrementsVersion()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Original",
            TemplateHtml = "<html>Original</html>",
            Version = 1,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var request = new UpdateEmailTemplateRequest
        {
            TemplateHtml = "<html>Updated HTML</html>"
        };

        // Act
        var result = await _service.UpdateTemplateAsync(template.ClubId, template.Id, request);

        // Assert
        Assert.That(result.Version, Is.EqualTo(2));
    }

    [Test]
    public async Task UpdateTemplateAsync_DeactivateTemplate_SetsIsActiveFalse()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Active Template",
            TemplateHtml = "<html>Content</html>",
            IsActive = true,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var request = new UpdateEmailTemplateRequest
        {
            IsActive = false
        };

        // Act
        var result = await _service.UpdateTemplateAsync(template.ClubId, template.Id, request);

        // Assert
        Assert.That(result.IsActive, Is.False);
    }

    [Test]
    public async Task UpdateTemplateAsync_UpdateDescription_AllowsNullDescription()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Template",
            Description = "Has Description",
            TemplateHtml = "<html>Content</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var request = new UpdateEmailTemplateRequest
        {
            Description = "" // Set to empty string
        };

        // Act
        var result = await _service.UpdateTemplateAsync(template.ClubId, template.Id, request);

        // Assert - Description should be updated to empty string (not null)
        Assert.That(result.Description, Is.Empty);
    }

    #endregion

    #region GetTemplatesAsync Extended Tests

    [Test]
    public async Task GetTemplatesAsync_IncludeInactive_ReturnsAllTemplates()
    {
        // Arrange
        var clubId = 1;
        await _context.EmailTemplates.AddRangeAsync(
            new EmailTemplate { ClubId = clubId, TemplateName = "Active 1", TemplateHtml = "<html>1</html>", IsActive = true, CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EmailTemplate { ClubId = clubId, TemplateName = "Inactive", TemplateHtml = "<html>2</html>", IsActive = false, CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EmailTemplate { ClubId = clubId, TemplateName = "Active 2", TemplateHtml = "<html>3</html>", IsActive = true, CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTemplatesAsync(clubId, includeInactive: true);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3));
    }

    [Test]
    public async Task GetTemplatesAsync_ExcludeInactive_ReturnsOnlyActiveTemplates()
    {
        // Arrange
        var clubId = 1;
        await _context.EmailTemplates.AddRangeAsync(
            new EmailTemplate { ClubId = clubId, TemplateName = "Active 1", TemplateHtml = "<html>1</html>", IsActive = true, CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EmailTemplate { ClubId = clubId, TemplateName = "Inactive", TemplateHtml = "<html>2</html>", IsActive = false, CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EmailTemplate { ClubId = clubId, TemplateName = "Active 2", TemplateHtml = "<html>3</html>", IsActive = true, CreatedByUserId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTemplatesAsync(clubId, includeInactive: false);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result.All(t => t.IsActive), Is.True);
    }

    [Test]
    public async Task GetTemplatesAsync_OrdersByLastUsedAtThenCreatedAt()
    {
        // Arrange
        var clubId = 1;
        var now = DateTime.UtcNow;
        await _context.EmailTemplates.AddRangeAsync(
            new EmailTemplate { ClubId = clubId, TemplateName = "Old Created No Usage", TemplateHtml = "<html>1</html>", IsActive = true, CreatedByUserId = 1, CreatedAt = now.AddDays(-10), UpdatedAt = now, LastUsedAt = null },
            new EmailTemplate { ClubId = clubId, TemplateName = "Recent Usage", TemplateHtml = "<html>2</html>", IsActive = true, CreatedByUserId = 1, CreatedAt = now.AddDays(-5), UpdatedAt = now, LastUsedAt = now },
            new EmailTemplate { ClubId = clubId, TemplateName = "Old Usage", TemplateHtml = "<html>3</html>", IsActive = true, CreatedByUserId = 1, CreatedAt = now.AddDays(-3), UpdatedAt = now, LastUsedAt = now.AddDays(-2) }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTemplatesAsync(clubId);

        // Assert
        Assert.That(result[0].TemplateName, Is.EqualTo("Recent Usage")); // Most recently used
        Assert.That(result[1].TemplateName, Is.EqualTo("Old Usage")); // Used but older
        Assert.That(result[2].TemplateName, Is.EqualTo("Old Created No Usage")); // Never used, created first
    }

    [Test]
    public async Task GetTemplatesAsync_EmptyClub_ReturnsEmptyList()
    {
        // Act
        var result = await _service.GetTemplatesAsync(999);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region DeleteTemplateAsync Extended Tests

    [Test]
    public async Task DeleteTemplateAsync_TemplateNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.DeleteTemplateAsync(1, 999));

        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task DeleteTemplateAsync_SystemTemplate_ThrowsInvalidOperationException()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "System Template",
            TemplateHtml = "<html>System</html>",
            IsSystemTemplate = true,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.DeleteTemplateAsync(template.ClubId, template.Id));

        Assert.That(ex!.Message, Does.Contain("System templates cannot be deleted"));
    }

    [Test]
    public async Task DeleteTemplateAsync_TemplateInActiveABTest_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var template = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "In Use Template",
            TemplateHtml = "<html>Content</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var abTest = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Active Test",
            TestType = "SubjectLine",
            VariantATemplateId = template.Id,
            Status = "Running",
            StartedAt = DateTime.UtcNow.AddDays(-1),
            EndedAt = DateTime.UtcNow.AddDays(7),
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(abTest);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.DeleteTemplateAsync(clubId, template.Id));

        Assert.That(ex!.Message, Does.Contain("active A/B tests"));
    }

    [Test]
    public async Task DeleteTemplateAsync_TemplateInCompletedABTest_SuccessfullyDeletes()
    {
        // Arrange
        var clubId = 1;
        var template = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Was Used Template",
            TemplateHtml = "<html>Content</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var abTest = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Completed Test",
            TestType = "SubjectLine",
            VariantATemplateId = template.Id,
            Status = "Completed", // Not running
            StartedAt = DateTime.UtcNow.AddDays(-10),
            EndedAt = DateTime.UtcNow.AddDays(-1),
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(abTest);
        await _context.SaveChangesAsync();

        // Act
        await _service.DeleteTemplateAsync(clubId, template.Id);

        // Assert
        var deleted = await _context.EmailTemplates.FindAsync(template.Id);
        Assert.That(deleted, Is.Null);
    }

    [Test]
    public async Task DeleteTemplateAsync_TemplateInActiveABTestAsVariantB_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var templateA = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Variant A",
            TemplateHtml = "<html>A</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var templateB = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Variant B",
            TemplateHtml = "<html>B</html>",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddRangeAsync(templateA, templateB);
        await _context.SaveChangesAsync();

        var abTest = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = "Active Test",
            TestType = "SubjectLine",
            VariantATemplateId = templateA.Id,
            VariantBTemplateId = templateB.Id,
            Status = "Running",
            StartedAt = DateTime.UtcNow.AddDays(-1),
            EndedAt = DateTime.UtcNow.AddDays(7),
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.ABTestCampaigns.AddAsync(abTest);
        await _context.SaveChangesAsync();

        // Act & Assert - Try to delete variant B
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.DeleteTemplateAsync(clubId, templateB.Id));

        Assert.That(ex!.Message, Does.Contain("active A/B tests"));
    }

    #endregion

    #region DuplicateTemplateAsync Extended Tests

    [Test]
    public async Task DuplicateTemplateAsync_TemplateNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.DuplicateTemplateAsync(1, 999, 1, "Copy"));

        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task DuplicateTemplateAsync_CopiesAllContent()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var template = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "Original",
            Description = "Original description",
            TemplateHtml = "<html><body>Complex HTML with styles</body></html>",
            TemplateJson = "{\"sections\": [\"header\", \"body\", \"footer\"]}",
            ThumbnailUrl = "https://example.com/original-thumb.png",
            IsSystemTemplate = false,
            IsActive = true,
            Version = 5,
            UsageCount = 100,
            CreatedByUserId = 2, // Different user
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DuplicateTemplateAsync(clubId, template.Id, userId, "Duplicated Template");

        // Assert
        Assert.That(result.TemplateName, Is.EqualTo("Duplicated Template"));
        Assert.That(result.Description, Is.EqualTo(template.Description));
        Assert.That(result.TemplateHtml, Is.EqualTo(template.TemplateHtml));
        Assert.That(result.TemplateJson, Is.EqualTo(template.TemplateJson));
        Assert.That(result.ThumbnailUrl, Is.EqualTo(template.ThumbnailUrl));

        // These should be reset for the new template
        Assert.That(result.Version, Is.EqualTo(1)); // Reset to 1
        Assert.That(result.UsageCount, Is.EqualTo(0)); // Reset to 0
        Assert.That(result.IsSystemTemplate, Is.False); // Never copy as system template
        Assert.That(result.IsActive, Is.True); // New templates are active
    }

    [Test]
    public async Task DuplicateTemplateAsync_SystemTemplate_CreatesNonSystemCopy()
    {
        // Arrange
        var clubId = 1;
        var template = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = "System Template",
            Description = "System template description",
            TemplateHtml = "<html>System</html>",
            IsSystemTemplate = true,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DuplicateTemplateAsync(clubId, template.Id, 1, "My Copy");

        // Assert
        Assert.That(result.IsSystemTemplate, Is.False); // Copy should not be system template
    }

    #endregion

    #region IncrementUsageAsync Tests

    [Test]
    public async Task IncrementUsageAsync_ValidTemplate_IncrementsUsageCountAndUpdatesLastUsed()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Test Template",
            TemplateHtml = "<html>Content</html>",
            UsageCount = 5,
            LastUsedAt = DateTime.UtcNow.AddDays(-7),
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-7)
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var beforeIncrement = DateTime.UtcNow;

        // Act
        await _service.IncrementUsageAsync(template.Id);

        // Assert
        var updated = await _context.EmailTemplates.FindAsync(template.Id);
        Assert.That(updated!.UsageCount, Is.EqualTo(6));
        Assert.That(updated.LastUsedAt, Is.GreaterThanOrEqualTo(beforeIncrement));
    }

    [Test]
    public async Task IncrementUsageAsync_NonExistentTemplate_DoesNothing()
    {
        // Act - Should not throw
        await _service.IncrementUsageAsync(999);

        // Assert - No exception thrown, method completed silently
        Assert.Pass("Method completed without throwing exception");
    }

    [Test]
    public async Task IncrementUsageAsync_FirstUsage_SetsLastUsedAt()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Never Used",
            TemplateHtml = "<html>Content</html>",
            UsageCount = 0,
            LastUsedAt = null,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        await _service.IncrementUsageAsync(template.Id);

        // Assert
        var updated = await _context.EmailTemplates.FindAsync(template.Id);
        Assert.That(updated!.UsageCount, Is.EqualTo(1));
        Assert.That(updated.LastUsedAt, Is.Not.Null);
    }

    #endregion

    #region Edge Cases and Response Mapping Tests

    [Test]
    public async Task GetTemplateAsync_ReturnsAllMappedFields()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Complete Template",
            Description = "Full description",
            TemplateHtml = "<html><body>Content</body></html>",
            TemplateJson = "{\"type\": \"email\"}",
            ThumbnailUrl = "https://example.com/thumb.png",
            IsSystemTemplate = false,
            IsActive = true,
            Version = 3,
            UsageCount = 15,
            LastUsedAt = now.AddHours(-1),
            CreatedByUserId = 1,
            CreatedAt = now.AddDays(-7),
            UpdatedAt = now.AddDays(-1)
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTemplateAsync(template.ClubId, template.Id);

        // Assert - Verify all fields are correctly mapped
        Assert.That(result.Id, Is.EqualTo(template.Id));
        Assert.That(result.ClubId, Is.EqualTo(template.ClubId));
        Assert.That(result.TemplateName, Is.EqualTo(template.TemplateName));
        Assert.That(result.Description, Is.EqualTo(template.Description));
        Assert.That(result.TemplateHtml, Is.EqualTo(template.TemplateHtml));
        Assert.That(result.TemplateJson, Is.EqualTo(template.TemplateJson));
        Assert.That(result.ThumbnailUrl, Is.EqualTo(template.ThumbnailUrl));
        Assert.That(result.IsSystemTemplate, Is.EqualTo(template.IsSystemTemplate));
        Assert.That(result.IsActive, Is.EqualTo(template.IsActive));
        Assert.That(result.Version, Is.EqualTo(template.Version));
        Assert.That(result.UsageCount, Is.EqualTo(template.UsageCount));
        Assert.That(result.LastUsedAt, Is.EqualTo(template.LastUsedAt));
        Assert.That(result.CreatedAt, Is.EqualTo(template.CreatedAt));
        Assert.That(result.UpdatedAt, Is.EqualTo(template.UpdatedAt));
    }

    [Test]
    public async Task GetTemplatesAsync_ReturnsListResponseWithCorrectFields()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "List Template",
            Description = "For list view",
            ThumbnailUrl = "https://example.com/thumb.png",
            TemplateHtml = "<html>Content</html>",
            IsSystemTemplate = true,
            IsActive = true,
            UsageCount = 25,
            LastUsedAt = now.AddHours(-2),
            CreatedByUserId = 1,
            CreatedAt = now.AddDays(-5),
            UpdatedAt = now.AddDays(-1)
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTemplatesAsync(template.ClubId);

        // Assert - List response has fewer fields
        Assert.That(result, Has.Count.EqualTo(1));
        var item = result[0];
        Assert.That(item.Id, Is.EqualTo(template.Id));
        Assert.That(item.TemplateName, Is.EqualTo(template.TemplateName));
        Assert.That(item.Description, Is.EqualTo(template.Description));
        Assert.That(item.ThumbnailUrl, Is.EqualTo(template.ThumbnailUrl));
        Assert.That(item.IsSystemTemplate, Is.EqualTo(template.IsSystemTemplate));
        Assert.That(item.IsActive, Is.EqualTo(template.IsActive));
        Assert.That(item.UsageCount, Is.EqualTo(template.UsageCount));
        Assert.That(item.LastUsedAt, Is.EqualTo(template.LastUsedAt));
        Assert.That(item.CreatedAt, Is.EqualTo(template.CreatedAt));
    }

    [Test]
    public async Task CreateTemplateAsync_WithThumbnail_SavesThumbnailUrl()
    {
        // Arrange
        var clubId = 1;
        var club = new Club
        {
            Id = clubId,
            Name = "Test Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow
        };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        var request = new CreateEmailTemplateRequest
        {
            TemplateName = "Template with Thumbnail",
            TemplateHtml = "<html>Content</html>",
            ThumbnailUrl = "https://example.com/template-preview.png"
        };

        // Act
        var result = await _service.CreateTemplateAsync(clubId, 1, request);

        // Assert
        Assert.That(result.ThumbnailUrl, Is.EqualTo(request.ThumbnailUrl));
    }

    [Test]
    public async Task UpdateTemplateAsync_UpdatesThumbnailUrl()
    {
        // Arrange
        var template = new EmailTemplate
        {
            ClubId = 1,
            TemplateName = "Template",
            TemplateHtml = "<html>Content</html>",
            ThumbnailUrl = "https://example.com/old-thumb.png",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.EmailTemplates.AddAsync(template);
        await _context.SaveChangesAsync();

        var request = new UpdateEmailTemplateRequest
        {
            ThumbnailUrl = "https://example.com/new-thumb.png"
        };

        // Act
        var result = await _service.UpdateTemplateAsync(template.ClubId, template.Id, request);

        // Assert
        Assert.That(result.ThumbnailUrl, Is.EqualTo("https://example.com/new-thumb.png"));
    }

    #endregion
}
