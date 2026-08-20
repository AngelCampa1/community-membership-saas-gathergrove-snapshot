using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class EmailTemplateTests
{
    #region Default Value Tests (5 tests)

    [Test]
    public void TemplateName_DefaultsToEmptyString()
    {
        var template = new EmailTemplate();
        Assert.That(template.TemplateName, Is.EqualTo(string.Empty));
    }

    [Test]
    public void TemplateHtml_DefaultsToEmptyString()
    {
        var template = new EmailTemplate();
        Assert.That(template.TemplateHtml, Is.EqualTo(string.Empty));
    }

    [Test]
    public void IsSystemTemplate_DefaultsToFalse()
    {
        var template = new EmailTemplate();
        Assert.That(template.IsSystemTemplate, Is.False);
    }

    [Test]
    public void IsActive_DefaultsToTrue()
    {
        var template = new EmailTemplate();
        Assert.That(template.IsActive, Is.True);
    }

    [Test]
    public void Version_DefaultsToOne()
    {
        var template = new EmailTemplate();
        Assert.That(template.Version, Is.EqualTo(1));
    }

    #endregion

    #region Template Content Tests (5 tests)

    [Test]
    public void TemplateName_CanBeSet()
    {
        var template = new EmailTemplate { TemplateName = "Welcome Email" };
        Assert.That(template.TemplateName, Is.EqualTo("Welcome Email"));
    }

    [Test]
    public void TemplateHtml_CanBeSetToFullHtmlContent()
    {
        var html = "<html><body><h1>Welcome!</h1></body></html>";
        var template = new EmailTemplate { TemplateHtml = html };
        Assert.That(template.TemplateHtml, Is.EqualTo(html));
    }

    [Test]
    public void TemplateJson_CanBeSetForEmailBuilder()
    {
        var json = "{\"components\":[{\"type\":\"text\",\"content\":\"Hello\"}]}";
        var template = new EmailTemplate { TemplateJson = json };
        Assert.That(template.TemplateJson, Is.EqualTo(json));
    }

    [Test]
    public void Description_CanBeSet()
    {
        var template = new EmailTemplate { Description = "Template for new member welcomes" };
        Assert.That(template.Description, Is.EqualTo("Template for new member welcomes"));
    }

    [Test]
    public void ThumbnailUrl_CanBeSet()
    {
        var template = new EmailTemplate { ThumbnailUrl = "https://example.com/thumbnails/welcome.png" };
        Assert.That(template.ThumbnailUrl, Is.EqualTo("https://example.com/thumbnails/welcome.png"));
    }

    #endregion

    #region Template Type Tests (3 tests)

    [Test]
    public void IsSystemTemplate_CanBeSetToTrue()
    {
        var template = new EmailTemplate { IsSystemTemplate = true };
        Assert.That(template.IsSystemTemplate, Is.True);
    }

    [Test]
    public void SystemTemplate_CanBeDistinguishedFromCustomTemplate()
    {
        var systemTemplate = new EmailTemplate { IsSystemTemplate = true, TemplateName = "System Welcome" };
        var customTemplate = new EmailTemplate { IsSystemTemplate = false, TemplateName = "Custom Welcome" };

        Assert.That(systemTemplate.IsSystemTemplate, Is.True);
        Assert.That(customTemplate.IsSystemTemplate, Is.False);
    }

    [Test]
    public void IsActive_CanBeSetToFalse()
    {
        var template = new EmailTemplate { IsActive = false };
        Assert.That(template.IsActive, Is.False);
    }

    #endregion

    #region Versioning Tests (3 tests)

    [Test]
    public void Version_CanBeIncremented()
    {
        var template = new EmailTemplate { Version = 1 };
        template.Version++;
        Assert.That(template.Version, Is.EqualTo(2));
    }

    [Test]
    public void Version_CanTrackMultipleRevisions()
    {
        var template = new EmailTemplate
        {
            TemplateName = "Newsletter",
            Version = 5
        };

        Assert.That(template.Version, Is.EqualTo(5));
    }

    [Test]
    public void UpdatedAt_CanTrackLastModification()
    {
        var template = new EmailTemplate
        {
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        Assert.That(template.UpdatedAt, Is.GreaterThan(template.CreatedAt));
    }

    #endregion

    #region Usage Tracking Tests (4 tests)

    [Test]
    public void UsageCount_DefaultsToZero()
    {
        var template = new EmailTemplate();
        Assert.That(template.UsageCount, Is.EqualTo(0));
    }

    [Test]
    public void UsageCount_CanBeIncremented()
    {
        var template = new EmailTemplate { UsageCount = 10 };
        template.UsageCount++;
        Assert.That(template.UsageCount, Is.EqualTo(11));
    }

    [Test]
    public void LastUsedAt_CanBeSet()
    {
        var lastUsed = DateTime.UtcNow.AddHours(-2);
        var template = new EmailTemplate { LastUsedAt = lastUsed };
        Assert.That(template.LastUsedAt, Is.EqualTo(lastUsed));
    }

    [Test]
    public void UsageTracking_CanRecordMultipleUses()
    {
        var template = new EmailTemplate
        {
            UsageCount = 25,
            LastUsedAt = DateTime.UtcNow.AddMinutes(-15)
        };

        Assert.That(template.UsageCount, Is.EqualTo(25));
        Assert.That(template.LastUsedAt, Is.Not.Null);
        Assert.That(template.LastUsedAt.Value, Is.LessThan(DateTime.UtcNow));
    }

    #endregion

    #region Audit Trail Tests (3 tests)

    [Test]
    public void CreatedByUserId_CanBeSet()
    {
        var template = new EmailTemplate { CreatedByUserId = 123 };
        Assert.That(template.CreatedByUserId, Is.EqualTo(123));
    }

    [Test]
    public void UpdatedByUserId_CanBeSet()
    {
        var template = new EmailTemplate { UpdatedByUserId = 456 };
        Assert.That(template.UpdatedByUserId, Is.EqualTo(456));
    }

    [Test]
    public void AuditTrail_TracksCreationAndUpdate()
    {
        var template = new EmailTemplate
        {
            CreatedByUserId = 100,
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            UpdatedByUserId = 200,
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        Assert.That(template.CreatedByUserId, Is.EqualTo(100));
        Assert.That(template.UpdatedByUserId, Is.EqualTo(200));
        Assert.That(template.UpdatedAt, Is.GreaterThan(template.CreatedAt));
    }

    #endregion
}
