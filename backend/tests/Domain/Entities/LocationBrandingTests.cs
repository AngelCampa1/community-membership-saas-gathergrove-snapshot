using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class LocationBrandingTests
{
    #region Basic Properties Tests (3 tests)

    [Test]
    public void LocationId_CanBeSet()
    {
        var branding = new LocationBranding { LocationId = 15 };
        Assert.That(branding.LocationId, Is.EqualTo(15));
    }

    [Test]
    public void CustomLogoUrl_CanBeSet()
    {
        var branding = new LocationBranding { CustomLogoUrl = "https://example.com/logos/nyc-chapter.png" };
        Assert.That(branding.CustomLogoUrl, Is.EqualTo("https://example.com/logos/nyc-chapter.png"));
    }

    [Test]
    public void CustomNameOverride_CanBeSet()
    {
        var branding = new LocationBranding { CustomNameOverride = "NYC Elite Chapter" };
        Assert.That(branding.CustomNameOverride, Is.EqualTo("NYC Elite Chapter"));
    }

    #endregion

    #region Color Scheme Tests (3 tests)

    [Test]
    public void ColorScheme_CanStoreJsonConfiguration()
    {
        var colorJson = "{\"primary\":\"#FF5733\",\"secondary\":\"#33FF57\",\"accent\":\"#3357FF\"}";
        var branding = new LocationBranding { ColorScheme = colorJson };
        Assert.That(branding.ColorScheme, Is.EqualTo(colorJson));
    }

    [Test]
    public void ColorScheme_CanBeNull()
    {
        var branding = new LocationBranding { ColorScheme = null };
        Assert.That(branding.ColorScheme, Is.Null);
    }

    [Test]
    public void ColorScheme_SupportsComplexConfiguration()
    {
        var complexColors = "{\"light\":{\"primary\":\"#FFF\"},\"dark\":{\"primary\":\"#000\"}}";
        var branding = new LocationBranding { ColorScheme = complexColors };
        Assert.That(branding.ColorScheme, Contains.Substring("light"));
        Assert.That(branding.ColorScheme, Contains.Substring("dark"));
    }

    #endregion

    #region Settings Tests (2 tests)

    [Test]
    public void SettingsJson_CanStoreAdditionalBranding()
    {
        var settingsJson = "{\"font\":\"Arial\",\"headerStyle\":\"modern\",\"footerText\":\"Powered by GatherGrove\"}";
        var branding = new LocationBranding { SettingsJson = settingsJson };
        Assert.That(branding.SettingsJson, Is.EqualTo(settingsJson));
    }

    [Test]
    public void SettingsJson_CanBeNull()
    {
        var branding = new LocationBranding { SettingsJson = null };
        Assert.That(branding.SettingsJson, Is.Null);
    }

    #endregion

    #region Complete Branding Tests (3 tests)

    [Test]
    public void CompleteBranding_CanBeFullyCustomized()
    {
        var branding = new LocationBranding
        {
            LocationId = 20,
            CustomLogoUrl = "https://cdn.example.com/custom-logo.svg",
            CustomNameOverride = "The Premier Chapter",
            ColorScheme = "{\"primary\":\"#1E90FF\"}",
            SettingsJson = "{\"theme\":\"professional\"}"
        };

        Assert.That(branding.LocationId, Is.EqualTo(20));
        Assert.That(branding.CustomLogoUrl, Is.Not.Null);
        Assert.That(branding.CustomNameOverride, Is.EqualTo("The Premier Chapter"));
        Assert.That(branding.ColorScheme, Is.Not.Null);
        Assert.That(branding.SettingsJson, Is.Not.Null);
    }

    [Test]
    public void MinimalBranding_RequiresOnlyLocationId()
    {
        var branding = new LocationBranding
        {
            LocationId = 10,
            CustomLogoUrl = null,
            ColorScheme = null,
            CustomNameOverride = null
        };

        Assert.That(branding.LocationId, Is.EqualTo(10));
        Assert.That(branding.CustomLogoUrl, Is.Null);
    }

    [Test]
    public void BrandingTimestamps_CanBeTracked()
    {
        var branding = new LocationBranding
        {
            CreatedAt = DateTime.UtcNow.AddDays(-90),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        Assert.That(branding.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(branding.UpdatedAt, Is.GreaterThan(branding.CreatedAt));
    }

    #endregion
}
